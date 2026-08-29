/** Agregações da aba Dados: sempre em SQL (GROUP BY) em vez de carregar o
 * histórico inteiro na memória — é a razão de o app usar SQLite e não
 * Preferences. */
import { all, one, toBool } from "../db";
import { pontosResposta, type ConfiancaResposta } from "../pontuacaoTopicos";
import { COND_BLOCO_FEITO } from "./blocos";
import { condLenta } from "./questoes";
import { contarConceitos } from "./notas";

export interface Resumo {
  totalQuestoes: number;
  totalAcertos: number;
  blocosAprovados: number;
  blocosTotais: number;
  conceitosSalvos: number;
}

/**
 * `nivel` filtra só `questoes_respondidas` (a coluna não existe em `blocos`,
 * e um bloco pode ter sido respondido com o nível trocado no meio — não
 * existe hoje, mas a granularidade correta é por questão). Por isso os
 * totais de blocos aprovados/totais ignoram esse filtro.
 */
export async function resumo(materia: string | null, nivel: number | null = null): Promise<Resumo> {
  const condQ = [materia ? "materia = ?" : null, nivel ? "nivel = ?" : null].filter(Boolean) as string[];
  const paramsQ = [...(materia ? [materia] : []), ...(nivel ? [nivel] : [])];

  const [q, b, conceitosSalvos] = await Promise.all([
    one<{ n: number; a: number }>(
      `SELECT COUNT(*) AS n, SUM(acertou) AS a
       FROM questoes_respondidas ${condQ.length ? `WHERE ${condQ.join(" AND ")}` : ""}`,
      paramsQ,
    ),
    one<{ n: number; ap: number }>(
      `SELECT COUNT(*) AS n, SUM(aprovado) AS ap
       FROM blocos WHERE ${COND_BLOCO_FEITO} ${materia ? "AND materia = ?" : ""}`,
      materia ? [materia] : [],
    ),
    contarConceitos(materia),
  ]);
  return {
    totalQuestoes: Number(q?.n ?? 0),
    totalAcertos: Number(q?.a ?? 0),
    blocosAprovados: Number(b?.ap ?? 0),
    blocosTotais: Number(b?.n ?? 0),
    conceitosSalvos,
  };
}

/** Série temporal: % de acerto por bloco, em ordem cronológica. */
export async function serieBlocos(
  materia: string | null,
): Promise<{ i: number; pct: number; ts: string; materia: string }[]> {
  const rows = await all(
    `SELECT ts, materia, total_acertos, total_questoes
     FROM blocos
     WHERE total_questoes > 0 AND ${COND_BLOCO_FEITO} ${materia ? "AND materia = ?" : ""}
     ORDER BY ts ASC`,
    materia ? [materia] : [],
  );
  return rows.map((r, i) => ({
    i: i + 1,
    pct: Math.round((Number(r.total_acertos) / Number(r.total_questoes)) * 100),
    ts: String(r.ts),
    materia: String(r.materia),
  }));
}

export interface Previsao {
  amostras: number;
  tendencia: "subindo" | "estavel" | "descendo";
  jaAlcancada: boolean;
  /** Quantos blocos a mais, no ritmo atual, até a % de acerto cruzar 90% —
   * null quando a tendência não aponta para lá (estável/descendo) ou o
   * limiar já foi alcançado. */
  blocosAteAlvo: number | null;
}

const MIN_AMOSTRAS_PREVISAO = 4;
/** Pontos percentuais de acerto por bloco, abaixo do qual a tendência conta
 * como "estável" em vez de subindo/descendo — evita que ruído de ±1 bloco
 * apareça como projeção. */
const LIMIAR_INCLINACAO = 0.3;

/**
 * Projeção simples (regressão linear por mínimos quadrados, pct vs. índice
 * do bloco) de quantos blocos faltam, no ritmo atual de evolução, para a %
 * de acerto cruzar o limiar de aprovação (90%). Recebe a mesma série de
 * `serieBlocos` já usada no gráfico de evolução — não introduz consulta nova.
 * Função pura (sem SQL) para ficar fácil de testar isoladamente.
 */
export function preverAprovacao(serie: { i: number; pct: number }[]): Previsao | null {
  if (serie.length < MIN_AMOSTRAS_PREVISAO) return null;

  const n = serie.length;
  const mediaX = serie.reduce((a, p) => a + p.i, 0) / n;
  const mediaY = serie.reduce((a, p) => a + p.pct, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of serie) {
    num += (p.i - mediaX) * (p.pct - mediaY);
    den += (p.i - mediaX) ** 2;
  }
  const inclinacao = den === 0 ? 0 : num / den;
  const intercepto = mediaY - inclinacao * mediaX;

  const ultimoPct = serie[n - 1].pct;
  const jaAlcancada = ultimoPct >= 90;
  const tendencia: Previsao["tendencia"] =
    inclinacao > LIMIAR_INCLINACAO ? "subindo" : inclinacao < -LIMIAR_INCLINACAO ? "descendo" : "estavel";

  let blocosAteAlvo: number | null = null;
  if (!jaAlcancada && tendencia === "subindo") {
    const iAlvo = (90 - intercepto) / inclinacao;
    const restante = Math.ceil(iAlvo - serie[n - 1].i);
    if (restante > 0) blocosAteAlvo = restante;
  }

  return { amostras: n, tendencia, jaAlcancada, blocosAteAlvo };
}

export interface Fatia {
  chave: string;
  total: number;
  acertos: number;
  pct: number;
}

/**
 * Agrega acerto por uma coluna qualquer de `questoes_respondidas`.
 * `coluna` nunca vem do usuário — só das constantes abaixo.
 */
async function agrupar(
  coluna: "nivel" | "tipo_cobranca" | "formato" | "confianca",
  materia: string | null,
  nivel: number | null = null,
): Promise<Fatia[]> {
  const cond = [`${coluna} IS NOT NULL`];
  const params: unknown[] = [];
  if (materia) {
    cond.push("materia = ?");
    params.push(materia);
  }
  // Filtrar por nível dentro do próprio agrupamento por nível não faz
  // sentido (o filtro já é a coluna agrupada) — só se aplica a tipo/formato/confiança.
  if (nivel && coluna !== "nivel") {
    cond.push("nivel = ?");
    params.push(nivel);
  }
  const rows = await all(
    `SELECT ${coluna} AS chave, COUNT(*) AS total, SUM(acertou) AS acertos
     FROM questoes_respondidas
     WHERE ${cond.join(" AND ")}
     GROUP BY ${coluna}
     ORDER BY ${coluna} ASC`,
    params,
  );
  return rows.map((r) => {
    const total = Number(r.total);
    const acertos = Number(r.acertos);
    return {
      chave: String(r.chave),
      total,
      acertos,
      pct: total ? Math.round((acertos / total) * 100) : 0,
    };
  });
}

export const porNivel = (m: string | null) => agrupar("nivel", m);
export const porTipo = (m: string | null, nivel: number | null = null) => agrupar("tipo_cobranca", m, nivel);
export const porFormato = (m: string | null, nivel: number | null = null) => agrupar("formato", m, nivel);
/** Acerto por confiança autoavaliada ("certeza" vs "chute", ver QuestaoCard)
 * — separa acerto por conhecimento de acerto por sorte, o que o % geral não
 * distingue. Só conta respostas em que a confiança foi perguntada. */
export const porConfianca = (m: string | null, nivel: number | null = null) => agrupar("confianca", m, nivel);

/** Acerto por matéria — base da nota provável estimada (ver
 * estimarNotaProvavel), que pondera esta % pelo peso do edital de cada
 * matéria (lib/edital.ts). Só faz sentido sem filtro de matéria (a visão
 * "todas"); por isso não recebe `materia` como parâmetro. */
export async function resumoPorMateria(nivel: number | null = null): Promise<Fatia[]> {
  const rows = await all(
    `SELECT materia AS chave, COUNT(*) AS total, SUM(acertou) AS acertos
     FROM questoes_respondidas
     ${nivel ? "WHERE nivel = ?" : ""}
     GROUP BY materia
     ORDER BY materia COLLATE NOCASE ASC`,
    nivel ? [nivel] : [],
  );
  return rows.map((r) => {
    const total = Number(r.total);
    const acertos = Number(r.acertos);
    return {
      chave: String(r.chave),
      total,
      acertos,
      pct: total ? Math.round((acertos / total) * 100) : 0,
    };
  });
}

export interface NotaEstimada {
  /** % ponderada pelo peso do edital de cada matéria incluída. */
  notaEstimada: number;
  /** Total de questões respondidas nas matérias incluídas. */
  amostras: number;
  materiasIncluidas: { materia: string; pct: number; peso: number; total: number }[];
  materiasExcluidas: { materia: string; motivo: "peso-zero" | "poucas-amostras" }[];
}

/**
 * Projeta uma nota provável combinando o acerto por matéria (resumoPorMateria)
 * com o peso de cada matéria no edital (lib/edital.ts, configurado em
 * Ajustes) — matérias sem peso configurado contam peso 1 (padrão). Matérias
 * com peso 0 ("não cai") ou com amostra insuficiente para o % de acerto ser
 * confiável ficam de fora do cálculo, mas aparecem em `materiasExcluidas`
 * para transparência. Função pura (sem SQL) para ficar fácil de testar,
 * mesmo padrão de preverAprovacao.
 */
export function estimarNotaProvavel(
  porMateria: Fatia[],
  pesos: Record<string, number>,
  minimoAmostras = 5,
): NotaEstimada | null {
  const incluidas: NotaEstimada["materiasIncluidas"] = [];
  const excluidas: NotaEstimada["materiasExcluidas"] = [];

  for (const f of porMateria) {
    const peso = pesos[f.chave] ?? 1;
    if (peso <= 0) {
      excluidas.push({ materia: f.chave, motivo: "peso-zero" });
      continue;
    }
    if (f.total < minimoAmostras) {
      excluidas.push({ materia: f.chave, motivo: "poucas-amostras" });
      continue;
    }
    incluidas.push({ materia: f.chave, pct: f.pct, peso, total: f.total });
  }
  if (!incluidas.length) return null;

  const somaPesos = incluidas.reduce((a, m) => a + m.peso, 0);
  const notaEstimada = Math.round(
    incluidas.reduce((a, m) => a + m.pct * m.peso, 0) / somaPesos,
  );
  const amostras = incluidas.reduce((a, m) => a + m.total, 0);
  return { notaEstimada, amostras, materiasIncluidas: incluidas, materiasExcluidas: excluidas };
}

export interface FatiaTempo {
  chave: string;
  total: number;
  tempoMedioMs: number;
}

/** Tempo médio de resposta por matéria, do mais lento para o mais rápido —
 * cruza com "acerto por matéria" para achar onde o usuário acerta mas
 * devagar (fluência baixa), diferente de onde erra (domínio baixo). Só
 * considera questões com tempo medido (ver QuestaoCard/gravarResposta). */
export async function tempoPorMateria(): Promise<FatiaTempo[]> {
  const rows = await all(
    `SELECT materia AS chave, COUNT(*) AS total, AVG(tempo_ms) AS media
     FROM questoes_respondidas
     WHERE tempo_ms IS NOT NULL
     GROUP BY materia
     ORDER BY media DESC`,
  );
  return rows.map((r) => ({
    chave: String(r.chave),
    total: Number(r.total),
    tempoMedioMs: Math.round(Number(r.media)),
  }));
}

/** Tempo médio geral (ou de uma matéria), para o número de destaque do
 * cartão — null quando nenhuma questão da seleção tem tempo medido. */
export async function tempoMedioGeral(
  materia: string | null = null,
): Promise<{ tempoMedioMs: number; amostras: number } | null> {
  const r = await one<{ media: number | null; n: number }>(
    `SELECT AVG(tempo_ms) AS media, COUNT(*) AS n
     FROM questoes_respondidas
     WHERE tempo_ms IS NOT NULL ${materia ? "AND materia = ?" : ""}`,
    materia ? [materia] : [],
  );
  if (!r || !r.n || r.media == null) return null;
  return { tempoMedioMs: Math.round(Number(r.media)), amostras: Number(r.n) };
}

/**
 * Acerto LENTO no treino diário: quantas questões você ACERTOU gastando mais
 * que o dobro do seu tempo médio (ver condLenta), e que fatia dos seus
 * acertos cronometrados isso representa.
 *
 * O tempo por questão já era gravado em toda resposta (`tempo_ms`), mas só o
 * relatório do simulado o usava — no dia a dia, acertar em dobro do tempo
 * conta como acerto e desaparece. É um problema diferente de errar: o
 * conteúdo está lá, a fluência não, e numa prova cronometrada é o que custa
 * as últimas questões.
 */
export interface ResumoLentidao {
  /** Acertos acima de 2× o tempo médio. */
  lentas: number;
  /** Acertos com tempo medido — denominador de `pct`. */
  acertosCronometrados: number;
  /** `lentas` como % de `acertosCronometrados`. */
  pct: number;
  tempoMedioMs: number;
}

export async function resumoLentidao(materia: string | null = null): Promise<ResumoLentidao | null> {
  const r = await one<{ lentas: number; total: number; media: number | null }>(
    `SELECT SUM(CASE WHEN ${condLenta()} THEN 1 ELSE 0 END) AS lentas,
            COUNT(*)                                        AS total,
            AVG(tempo_ms)                                   AS media
     FROM questoes_respondidas
     WHERE acertou = 1 AND tempo_ms IS NOT NULL ${materia ? "AND materia = ?" : ""}`,
    materia ? [materia] : [],
  );
  if (!r || !Number(r.total)) return null;
  const total = Number(r.total);
  const lentas = Number(r.lentas ?? 0);
  return {
    lentas,
    acertosCronometrados: total,
    pct: Math.round((lentas / total) * 100),
    tempoMedioMs: Math.round(Number(r.media ?? 0)),
  };
}

/**
 * Acerto por conceito — a dimensão mais granular que o app grava (cada
 * questão pode listar vários), e a única que nenhum card de Dados usava até
 * aqui. `json_each` desaninha o array JSON de `conceitos`; `HAVING` corta
 * conceitos com poucas amostras, que só adicionariam ruído (100% ou 0% de
 * acerto em 1 questão não diz nada). Ordenado do pior para o melhor acerto —
 * é a lista de "onde treinar primeiro".
 */
export async function porConceito(
  materia: string | null,
  nivel: number | null = null,
  minimoAmostras = 3,
): Promise<Fatia[]> {
  const cond = ["1 = 1"];
  const params: unknown[] = [];
  if (materia) {
    cond.push("qr.materia = ?");
    params.push(materia);
  }
  if (nivel) {
    cond.push("qr.nivel = ?");
    params.push(nivel);
  }
  const rows = await all(
    `SELECT je.value AS chave, COUNT(*) AS total, SUM(qr.acertou) AS acertos
     FROM questoes_respondidas qr, json_each(qr.conceitos) je
     WHERE ${cond.join(" AND ")}
     GROUP BY je.value
     HAVING COUNT(*) >= ?
     ORDER BY (CAST(SUM(qr.acertou) AS REAL) / COUNT(*)) ASC, total DESC
     LIMIT 12`,
    [...params, minimoAmostras],
  );
  return rows.map((r) => {
    const total = Number(r.total);
    const acertos = Number(r.acertos);
    return {
      chave: String(r.chave),
      total,
      acertos,
      pct: total ? Math.round((acertos / total) * 100) : 0,
    };
  });
}

/**
 * Sequência de dias consecutivos com pelo menos uma questão respondida.
 * `atual` conta para trás a partir de hoje (ou de ontem, se hoje ainda não
 * teve nenhuma resposta — não queremos zerar a sequência às 00h01 de quem
 * ainda vai estudar mais tarde); `recorde` é o maior trecho contínuo já
 * alcançado. As datas vêm de `ts` (ISO), comparadas pela fatia `YYYY-MM-DD`.
 */
export async function streakDias(): Promise<{ atual: number; recorde: number; hoje: boolean }> {
  const rows = await all<{ dia: string }>(
    `SELECT DISTINCT substr(ts, 1, 10) AS dia FROM questoes_respondidas ORDER BY dia DESC`,
  );
  const dias = rows.map((r) => r.dia);
  if (!dias.length) return { atual: 0, recorde: 0, hoje: false };

  const diasSet = new Set(dias);
  const umDiaMs = 86_400_000;
  const paraChave = (d: Date) => d.toISOString().slice(0, 10);

  const hojeChave = paraChave(new Date());
  const hoje = diasSet.has(hojeChave);

  let cursor = new Date();
  if (!hoje) cursor = new Date(cursor.getTime() - umDiaMs); // começa contando de ontem
  let atual = 0;
  while (diasSet.has(paraChave(cursor))) {
    atual++;
    cursor = new Date(cursor.getTime() - umDiaMs);
  }

  // Recorde: maior trecho de dias consecutivos em todo o histórico.
  let recorde = 0;
  let corrente = 0;
  let anterior: Date | null = null;
  for (let i = dias.length - 1; i >= 0; i--) {
    const d = new Date(`${dias[i]}T00:00:00.000Z`);
    if (anterior && d.getTime() - anterior.getTime() === umDiaMs) corrente++;
    else corrente = 1;
    recorde = Math.max(recorde, corrente);
    anterior = d;
  }

  return { atual, recorde: Math.max(recorde, atual), hoje };
}

/**
 * Quantidade de questões respondidas por dia, nos últimos `dias` dias — base
 * do calendário de sequência (heatmap estilo GitHub) na aba Dados. Mesma
 * fonte de streakDias (não filtrada por matéria: é constância do estudo como
 * um todo), mas com o total por dia em vez de só a sequência atual/recorde.
 * Dias sem nenhuma resposta simplesmente não aparecem na linha — quem chama
 * preenche os buracos com 0 para montar a grade completa.
 */
export async function atividadePorDia(dias: number): Promise<{ data: string; total: number }[]> {
  const desde = new Date(Date.now() - (dias - 1) * 86_400_000).toISOString().slice(0, 10);
  const rows = await all<{ dia: string; total: number }>(
    `SELECT substr(ts, 1, 10) AS dia, COUNT(*) AS total
     FROM questoes_respondidas
     WHERE substr(ts, 1, 10) >= ?
     GROUP BY dia`,
    [desde],
  );
  return rows.map((r) => ({ data: r.dia, total: Number(r.total) }));
}

/** Tópicos (texto livre gravado em `blocos.topico`) já praticados numa
 * matéria — cruzado com TOPICOS_POR_MATERIA (lib/topicos.ts) para mostrar o
 * que nunca foi praticado. Só tem sentido para matérias com lista fixa de
 * tópicos; as demais usam tópico livre sem uma referência para comparar. */
export async function topicosPraticados(materia: string): Promise<string[]> {
  const rows = await all<{ topico: string }>(
    `SELECT DISTINCT topico FROM blocos WHERE materia = ? AND topico IS NOT NULL AND topico != ''`,
    [materia],
  );
  return rows.map((r) => r.topico);
}

/**
 * Tópicos já praticados, agrupados por matéria — versão em uma consulta só
 * de `topicosPraticados`, para cruzar o edital inteiro com o histórico sem
 * uma ida ao banco por matéria (ver lacunasDoEdital em lib/topicos.ts).
 */
export async function topicosPraticadosPorMateria(): Promise<Record<string, string[]>> {
  const rows = await all<{ materia: string; topico: string }>(
    `SELECT DISTINCT materia, topico FROM blocos WHERE topico IS NOT NULL AND topico != ''`,
  );
  const mapa: Record<string, string[]> = {};
  for (const r of rows) (mapa[r.materia] ??= []).push(r.topico);
  return mapa;
}

/** Tópico + acerto de cada questão respondida de uma matéria (granularidade
 * de questão, não de bloco) — base do heatmap de desempenho por tópico (ver
 * desempenhoPorTopico em lib/topicos.ts). Só questões cujo bloco de origem
 * gravou um tópico (texto livre ou aula/bloco específico) entram aqui. */
export async function questoesPorTopico(
  materia: string,
): Promise<{ topico: string; acertou: boolean }[]> {
  const rows = await all<{ topico: string; acertou: number }>(
    `SELECT topico, acertou FROM questoes_respondidas
     WHERE materia = ? AND topico IS NOT NULL AND topico != ''`,
    [materia],
  );
  return rows.map((r) => ({ topico: String(r.topico), acertou: toBool(r.acertou) }));
}

/** Pontuação (ver pontosResposta em lib/pontuacaoTopicos.ts) de cada questão
 * respondida de uma matéria com tópico gravado — base do sorteio ponderado de
 * tópico ao gerar bloco com "Todos os tópicos" (ver pontuarTopicos em
 * lib/topicos.ts e iniciarBloco em GerarView). */
export async function pontosPorTopico(materia: string): Promise<{ topico: string; pontos: number }[]> {
  const rows = await all<{ topico: string; acertou: number; confianca: string | null; formato: string }>(
    `SELECT topico, acertou, confianca, formato FROM questoes_respondidas
     WHERE materia = ? AND topico IS NOT NULL AND topico != ''`,
    [materia],
  );
  return rows.map((r) => ({
    topico: String(r.topico),
    pontos: pontosResposta(toBool(r.acertou), r.confianca as ConfiancaResposta, r.formato as "ce" | "mc"),
  }));
}

/** Mesma pontuação de pontosPorTopico, por conceito em vez de tópico — cada
 * questão do banco fixo grava seu assunto como único item de `conceitos` (ver
 * questaoBancoParaQuestao em lib/banco.ts), então isto dá a pontuação por
 * assunto para o sorteio ponderado em GerarBancoView (ver pontuarAssuntos). */
export async function pontosPorConceito(materia: string): Promise<{ conceito: string; pontos: number }[]> {
  const rows = await all<{ conceito: string; acertou: number; confianca: string | null; formato: string }>(
    `SELECT je.value AS conceito, qr.acertou AS acertou, qr.confianca AS confianca, qr.formato AS formato
     FROM questoes_respondidas qr, json_each(qr.conceitos) je
     WHERE qr.materia = ?`,
    [materia],
  );
  return rows.map((r) => ({
    conceito: String(r.conceito),
    pontos: pontosResposta(toBool(r.acertou), r.confianca as ConfiancaResposta, r.formato as "ce" | "mc"),
  }));
}

/** Matérias que já aparecem em qualquer registro — alimenta o filtro. */
export async function materiasComDados(): Promise<string[]> {
  const rows = await all(
    `SELECT materia FROM questoes_respondidas
     UNION SELECT materia FROM blocos
     UNION SELECT materia FROM conceitos_salvos
     ORDER BY materia COLLATE NOCASE ASC`,
  );
  return rows.map((r) => String(r.materia));
}
