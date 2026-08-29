/** Tabela `questoes_respondidas`: gravação de respostas, fila de revisão
 * (repetição espaçada), cache de explicações do banco fixo e reports. */
import { all, one, parseJSON, run, runBatch, toBool } from "../db";
import type { ConfiancaResposta } from "../pontuacaoTopicos";
import type { Questao, QuestaoRespondida } from "../types";
import { INTERVALOS_LEITNER_DIAS } from "./leitner";
import { agoraISO } from "./util";

/**
 * Agendamento da PRIMEIRA revisão de uma resposta recém-gravada.
 *
 * Errada (ou não respondida): caixa 1, `proxima_revisao = NULL` — vencida
 * agora, aparece na próxima visita a "pendentes".
 *
 * Certa: caixa 2, revisão marcada para daqui a INTERVALOS_LEITNER_DIAS[1]
 * dias. Antes, acertar uma vez tirava a questão do circuito para sempre —
 * repetição espaçada é exatamente o contrário disso: o que você acertou
 * volta, só que mais tarde a cada acerto (ver registrarRevisao).
 */
function agendamentoInicial(acertou: boolean): { caixa: number; proxima: string | null } {
  if (!acertou) return { caixa: 1, proxima: null };
  const dias = INTERVALOS_LEITNER_DIAS[1];
  return { caixa: 2, proxima: new Date(Date.now() + dias * 86_400_000).toISOString() };
}

export async function gravarResposta(args: {
  blocoId: number | null;
  materia: string;
  /** Tópico do bloco de origem (cfg.topico) — usado para calcular a tag da nota na revisão. */
  topico: string | null;
  /** Nível de dificuldade (1–5) do bloco de origem; null quando não se aplica
   * (importação, geração a partir do banco de questões reais). */
  nivel: number | null;
  questao: Questao;
  /** "" grava a questão como não respondida (bloco abandonado antes de
   * chegar nela) — sempre acompanhado de `acertou: false`. */
  resposta: string;
  acertou: boolean;
  /** Tempo entre a questão aparecer e a resposta ser enviada, em ms — ver
   * QuestaoCard. Ausente/null quando a origem não mede (ex.: simulado). */
  tempoMs?: number | null;
  /** Autoavaliação de confiança, registrada antes de revelar o gabarito (ver
   * QuestaoCard) — ausente/null quando o fluxo não pergunta. */
  confianca?: ConfiancaResposta;
}): Promise<number> {
  const { questao: q } = args;
  const { lastId } = await run(
    `INSERT INTO questoes_respondidas
       (bloco_id, materia, topico, sub, carga_conceitual, nivel, formato, tipo_cobranca,
        enunciado, alternativas, gabarito, resposta, acertou, revisada, caixa_leitner, proxima_revisao,
        comentario, explicacoes_erradas, conceitos, dispositivo, banco_id, tempo_ms, confianca, ts)
     VALUES (?, ?, ?, '', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      args.blocoId,
      args.materia,
      args.topico || null,
      args.nivel,
      q.formato,
      q.tipo_cobranca ?? null,
      q.enunciado,
      q.alternativas ? JSON.stringify(q.alternativas) : null,
      q.gabarito,
      args.resposta,
      args.acertou ? 1 : 0,
      args.acertou ? 1 : 0,
      agendamentoInicial(args.acertou).caixa,
      agendamentoInicial(args.acertou).proxima,
      q.comentario ?? "",
      JSON.stringify(q.explicacoes_erradas ?? {}),
      JSON.stringify(q.conceitos ?? []),
      q.dispositivo ?? null,
      q.bancoId ?? null,
      args.tempoMs ?? null,
      args.confianca ?? null,
      new Date().toISOString(),
    ],
  );
  return lastId;
}

/**
 * Mesma gravação de `gravarResposta`, para várias respostas de uma vez, numa
 * única transação (ver `runBatch` em db.ts) — usado pelo Simulado, que grava
 * até 120 questões de uma vez ao finalizar e não pode pagar um flush completo
 * do banco por questão (perceptível como travamento na tela "Gravando…").
 */
export async function gravarRespostasEmLote(
  itens: Parameters<typeof gravarResposta>[0][],
): Promise<void> {
  if (!itens.length) return;
  const statements = itens.map((args) => {
    const q = args.questao;
    return {
      sql: `INSERT INTO questoes_respondidas
         (bloco_id, materia, topico, sub, carga_conceitual, nivel, formato, tipo_cobranca,
          enunciado, alternativas, gabarito, resposta, acertou, revisada, caixa_leitner, proxima_revisao,
          comentario, explicacoes_erradas, conceitos, dispositivo, banco_id, tempo_ms, confianca, ts)
       VALUES (?, ?, ?, '', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        args.blocoId,
        args.materia,
        args.topico || null,
        args.nivel,
        q.formato,
        q.tipo_cobranca ?? null,
        q.enunciado,
        q.alternativas ? JSON.stringify(q.alternativas) : null,
        q.gabarito,
        args.resposta,
        args.acertou ? 1 : 0,
        args.acertou ? 1 : 0,
        agendamentoInicial(args.acertou).caixa,
        agendamentoInicial(args.acertou).proxima,
        q.comentario ?? "",
        JSON.stringify(q.explicacoes_erradas ?? {}),
        JSON.stringify(q.conceitos ?? []),
        q.dispositivo ?? null,
        q.bancoId ?? null,
        args.tempoMs ?? null,
        args.confianca ?? null,
        new Date().toISOString(),
      ],
    };
  });
  await runBatch(statements);
}

function mapQuestao(r: Record<string, unknown>): QuestaoRespondida {
  return {
    id: Number(r.id),
    bloco_id: r.bloco_id == null ? null : Number(r.bloco_id),
    materia: String(r.materia),
    topico: (r.topico as string) ?? null,
    nivel: r.nivel == null ? null : Number(r.nivel),
    formato: String(r.formato) as "ce" | "mc",
    tipo_cobranca: (r.tipo_cobranca as QuestaoRespondida["tipo_cobranca"]) ?? undefined,
    enunciado: String(r.enunciado),
    alternativas: parseJSON<string[] | null>(r.alternativas, null),
    gabarito: String(r.gabarito),
    resposta: String(r.resposta),
    acertou: toBool(r.acertou),
    revisada: toBool(r.revisada),
    caixa_leitner: Number(r.caixa_leitner ?? 1),
    proxima_revisao: (r.proxima_revisao as string) ?? null,
    reportada: toBool(r.reportada),
    motivo_report: (r.motivo_report as string) ?? null,
    tempo_ms: r.tempo_ms == null ? null : Number(r.tempo_ms),
    comentario: (r.comentario as string) ?? "",
    explicacoes_erradas: parseJSON<Record<string, string>>(
      r.explicacoes_erradas,
      {},
    ),
    conceitos: parseJSON<string[]>(r.conceitos, []),
    dispositivo: (r.dispositivo as string) ?? null,
    confianca: (r.confianca as QuestaoRespondida["confianca"]) ?? null,
    // Proveniência da questão real: é o que permite ao card mostrar de que
    // prova ela veio também na revisão, onde não há mais a view de origem
    // para informar isso (ver QuestaoCard → buscarQuestaoBanco).
    bancoId: (r.banco_id as string) ?? undefined,
    ts: String(r.ts),
  };
}

/**
 * Repetição espaçada (caixas de Leitner) para "Refazer erradas": uma errada
 * "pendente" é a que nunca foi revisada com sucesso (`revisada = 0`) OU cuja
 * `proxima_revisao` já venceu. `?` no meio da condição recebe o timestamp de
 * corte (ver `agoraISO`) — comparação lexicográfica funciona porque
 * `toISOString()` produz strings que ordenam igual às datas que representam.
 */
export const COND_PENDENTE = "(revisada = 0 OR (proxima_revisao IS NOT NULL AND proxima_revisao <= ?))";

/**
 * O que entra na fila de revisão.
 *
 *   - "pendentes": tudo que está vencido HOJE — errado ou certo. Acertar uma
 *     questão passou a agendá-la (caixa 2, ver `gravarResposta` e a migração
 *     13); antes, acertar uma vez tirava a questão do circuito para sempre,
 *     que é o oposto do que repetição espaçada faz.
 *   - "erradas": só o que foi errado, vencido ou não — a lista de erros do
 *     histórico, que continua sendo uma pergunta legítima e diferente.
 *
 * Questão carregada e nunca respondida (`resposta = ''`, bloco abandonado)
 * conta como errada: é o que a torna revisável depois.
 */
export type EscopoRevisao = "pendentes" | "erradas";

function condEscopo(escopo: EscopoRevisao, prefixo = ""): { sql: string; params: unknown[] } {
  const p = prefixo ? `${prefixo}.` : "";
  if (escopo === "erradas") return { sql: `${p}acertou = 0`, params: [] };
  const cond = COND_PENDENTE.replace(/revisada/g, `${p}revisada`).replace(
    /proxima_revisao/g,
    `${p}proxima_revisao`,
  );
  return { sql: cond, params: [agoraISO()] };
}

/**
 * Acerto LENTO: acertou gastando mais que o dobro do seu tempo médio. É o
 * mesmo corte do relatório do simulado (ver RelatorioSimulado), aplicado
 * agora ao treino diário — acertar em dobro do tempo é fluência baixa, um
 * problema que o placar conta como acerto e que por isso nunca aparecia
 * sozinho. O `prefixo` qualifica só as colunas da linha em avaliação: a
 * média interna é sobre a tabela inteira e não pode ser correlacionada com
 * a linha de fora, senão viraria "tempo > 2 × ele mesmo" (nunca verdadeiro).
 */
export function condLenta(prefixo = ""): string {
  const p = prefixo ? `${prefixo}.` : "";
  return `(${p}tempo_ms IS NOT NULL AND ${p}tempo_ms > 2 * (SELECT AVG(tempo_ms) FROM questoes_respondidas WHERE tempo_ms IS NOT NULL))`;
}

/**
 * Ordem da fila de revisão, da questão que mais precisa de atenção para a
 * que menos precisa: errada antes de certa; dentro das erradas, o erro
 * perigoso (marcou "certeza" e errou — ver resumoConfianca) primeiro;
 * dentro das certas, o acerto lento antes do acerto rápido.
 */
function ordemRevisao(prefixo = ""): string {
  const p = prefixo ? `${prefixo}.` : "";
  return `${p}acertou ASC,
     (CASE WHEN ${p}acertou = 0 AND ${p}confianca = 'certeza' THEN 0 ELSE 1 END),
     (CASE WHEN ${p}acertou = 1 AND ${condLenta(prefixo)} THEN 0 ELSE 1 END),
     ${p}ts DESC`;
}

/**
 * Erradas agrupáveis por matéria — base da view "Refazer erradas". Sem
 * `opts.limite`, carrega tudo (compatível com quem já chamava assim); com
 * limite, ativa paginação — RefazerView usa isso para não trazer para a
 * memória de uma vez um histórico de erros que só cresce com o tempo.
 */
export async function listarErradas(
  materia: string | null,
  escopo: EscopoRevisao,
  opts: { limite?: number; offset?: number } = {},
): Promise<QuestaoRespondida[]> {
  const e = condEscopo(escopo);
  const cond = [e.sql];
  const params: unknown[] = [...e.params];
  if (materia) {
    cond.push("materia = ?");
    params.push(materia);
  }

  const { limite, offset = 0 } = opts;
  const rows = await all(
    `SELECT * FROM questoes_respondidas
     WHERE ${cond.join(" AND ")}
     ORDER BY ${ordemRevisao()}
     ${limite ? "LIMIT ? OFFSET ?" : ""}`,
    limite ? [...params, limite, offset] : params,
  );
  return rows.map(mapQuestao);
}

/** Contagem de erradas por matéria, para os cartões de seleção. */
export async function contarErradasPorMateria(
  escopo: EscopoRevisao,
): Promise<{ materia: string; total: number; pendentes: number; erradas: number }[]> {
  const e = condEscopo(escopo);
  const rows = await all(
    `SELECT materia,
            COUNT(*)                                          AS total,
            SUM(CASE WHEN ${COND_PENDENTE} THEN 1 ELSE 0 END) AS pendentes,
            SUM(CASE WHEN acertou = 0 THEN 1 ELSE 0 END)      AS erradas
     FROM questoes_respondidas
     WHERE ${e.sql}
     GROUP BY materia
     ORDER BY total DESC`,
    [agoraISO(), ...e.params],
  );
  return rows.map((r) => ({
    materia: String(r.materia),
    total: Number(r.total),
    pendentes: Number(r.pendentes),
    erradas: Number(r.erradas),
  }));
}

/**
 * Erradas agrupadas por conceito em vez de por matéria — a granularidade que
 * "Refazer erradas" ainda não oferecia: agrupar por matéria mistura conceitos
 * fortes e fracos da mesma matéria na mesma fila; agrupar por conceito deixa
 * o usuário atacar exatamente o ponto que quebra, cruzando com o card
 * "Acerto por conceito" da aba Dados (ver porConceito). `json_each` desaninha
 * o array de `conceitos` de cada questão errada.
 */
export async function contarErradasPorConceito(
  escopo: EscopoRevisao,
  materia: string | null = null,
): Promise<{ conceito: string; total: number; pendentes: number }[]> {
  const condPendenteQr = "(qr.revisada = 0 OR (qr.proxima_revisao IS NOT NULL AND qr.proxima_revisao <= ?))";
  const e = condEscopo(escopo, "qr");
  const cond = [e.sql];
  const paramsWhere: unknown[] = [...e.params];
  if (materia) {
    cond.push("qr.materia = ?");
    paramsWhere.push(materia);
  }
  // A ordem dos parâmetros segue a ordem textual dos "?" na query: o do SELECT
  // (dentro do CASE) vem antes de qualquer "?" do WHERE.
  const rows = await all(
    `SELECT je.value AS conceito,
            COUNT(*) AS total,
            SUM(CASE WHEN ${condPendenteQr} THEN 1 ELSE 0 END) AS pendentes
     FROM questoes_respondidas qr, json_each(qr.conceitos) je
     WHERE ${cond.join(" AND ")}
     GROUP BY je.value
     ORDER BY pendentes DESC, total DESC`,
    [agoraISO(), ...paramsWhere],
  );
  return rows.map((r) => ({
    conceito: String(r.conceito),
    total: Number(r.total),
    pendentes: Number(r.pendentes),
  }));
}

/** Erradas de um conceito específico (ver contarErradasPorConceito) — mesma
 * paginação de listarErradas, para não trazer um histórico inteiro de vez. */
export async function listarErradasPorConceito(
  conceito: string,
  escopo: EscopoRevisao,
  opts: { limite?: number; offset?: number } = {},
): Promise<QuestaoRespondida[]> {
  const e = condEscopo(escopo, "qr");
  const cond = [e.sql, "EXISTS (SELECT 1 FROM json_each(qr.conceitos) je WHERE je.value = ?)"];
  const params: unknown[] = [...e.params, conceito];
  const { limite, offset = 0 } = opts;
  const rows = await all(
    `SELECT qr.* FROM questoes_respondidas qr
     WHERE ${cond.join(" AND ")}
     ORDER BY ${ordemRevisao("qr")}
     ${limite ? "LIMIT ? OFFSET ?" : ""}`,
    limite ? [...params, limite, offset] : params,
  );
  return rows.map(mapQuestao);
}

/**
 * Contagem por matéria de TODAS as questões já respondidas dentro de um
 * bloco de verdade (certas e erradas) — base do agrupamento "Matéria" dentro
 * do filtro "Blocos anteriores" de Refazer. `bloco_id IS NOT NULL` é o que
 * distingue isto de `contarErradasPorMateria`: exclui respostas do Simulado
 * (que nunca cria um bloco, ver SimuladoView) e não se limita a erradas.
 */
export async function contarTodasPorMateria(): Promise<{ materia: string; total: number }[]> {
  const rows = await all(
    `SELECT materia, COUNT(*) AS total
     FROM questoes_respondidas
     WHERE bloco_id IS NOT NULL
     GROUP BY materia
     ORDER BY total DESC`,
  );
  return rows.map((r) => ({ materia: String(r.materia), total: Number(r.total) }));
}

/** Todas as questões (certas e erradas) de blocos de verdade, de uma matéria
 * ou de todas — par de `contarTodasPorMateria`, com a mesma paginação de
 * `listarErradas` para não trazer um histórico grande de uma vez. */
export async function listarTodasPorMateria(
  materia: string | null,
  opts: { limite?: number; offset?: number } = {},
): Promise<QuestaoRespondida[]> {
  const cond = ["bloco_id IS NOT NULL"];
  const params: unknown[] = [];
  if (materia) {
    cond.push("materia = ?");
    params.push(materia);
  }
  const { limite, offset = 0 } = opts;
  const rows = await all(
    `SELECT * FROM questoes_respondidas
     WHERE ${cond.join(" AND ")}
     ORDER BY ts DESC
     ${limite ? "LIMIT ? OFFSET ?" : ""}`,
    limite ? [...params, limite, offset] : params,
  );
  return rows.map(mapQuestao);
}

/** Uma questão respondida específica, pelo id — usado para "Ver questão de
 * origem" a partir de uma nota (conceitos_salvos.questao_origem_id). null
 * quando o id não existe mais (não deveria acontecer, já que a FK é
 * ON DELETE SET NULL, mas a nota pode ter sido salva antes dessa garantia). */
export async function buscarQuestaoPorId(id: number): Promise<QuestaoRespondida | null> {
  const row = await one<Record<string, unknown>>(
    `SELECT * FROM questoes_respondidas WHERE id = ?`,
    [id],
  );
  return row ? mapQuestao(row) : null;
}

/**
 * Busca em enunciado e comentário de questões já respondidas — metade da
 * busca global da aba Notas (ver buscarNotas para a outra metade). Mais
 * recentes primeiro, mesmo critério de buscarNotas.
 */
export async function buscarQuestoesRespondidas(termo: string): Promise<QuestaoRespondida[]> {
  const q = termo.trim();
  if (!q) return [];
  const like = `%${q}%`;
  const rows = await all(
    `SELECT * FROM questoes_respondidas
     WHERE enunciado LIKE ? OR comentario LIKE ?
     ORDER BY ts DESC
     LIMIT 100`,
    [like, like],
  );
  return rows.map(mapQuestao);
}

/**
 * Registra o resultado de uma revisão em "Refazer erradas" e reagenda a
 * próxima aparição da questão nessa fila: acertar avança uma caixa de Leitner
 * e empurra `proxima_revisao` para a frente (progressivamente mais longe);
 * errar de novo derruba para a caixa 1 com `proxima_revisao = NULL`, ou seja,
 * vencida agora — a questão volta a aparecer na próxima visita a "pendentes".
 */
export async function registrarRevisao(id: number, acertou: boolean): Promise<void> {
  if (!acertou) {
    await run(
      `UPDATE questoes_respondidas SET revisada = 0, caixa_leitner = 1, proxima_revisao = NULL WHERE id = ?`,
      [id],
    );
    return;
  }
  const row = await one<{ caixa: number }>(
    `SELECT caixa_leitner AS caixa FROM questoes_respondidas WHERE id = ?`,
    [id],
  );
  const novaCaixa = Math.min((row?.caixa ?? 1) + 1, INTERVALOS_LEITNER_DIAS.length);
  const dias = INTERVALOS_LEITNER_DIAS[novaCaixa - 1];
  const proxima = new Date(Date.now() + dias * 86_400_000).toISOString();
  await run(
    `UPDATE questoes_respondidas SET revisada = 1, caixa_leitner = ?, proxima_revisao = ? WHERE id = ?`,
    [novaCaixa, proxima, id],
  );
}

/** ids de banco_questoes.json (lib/banco.ts) já usados em algum bloco
 * respondido — usado para priorizar questões inéditas ao sortear do banco
 * fixo, que não se repõe (ver selecionarQuestoes em lib/banco.ts). */
export async function idsBancoRespondidos(): Promise<Set<string>> {
  const rows = await all<{ banco_id: string }>(
    `SELECT DISTINCT banco_id FROM questoes_respondidas WHERE banco_id IS NOT NULL`,
  );
  return new Set(rows.map((r) => r.banco_id));
}

export interface ExplicacaoBanco {
  comentario: string;
  explicacoes_erradas: Record<string, string>;
}

/** Comentário/explicações já geradas para questões do banco fixo (banco_id),
 * indexadas pelo próprio banco_id — ver `explicacoes_banco` em db.ts. */
export async function buscarExplicacoesBanco(
  ids: string[],
): Promise<Map<string, ExplicacaoBanco>> {
  const unicos = [...new Set(ids)];
  if (!unicos.length) return new Map();
  const placeholders = unicos.map(() => "?").join(",");
  const rows = await all<{ banco_id: string; comentario: string; explicacoes_erradas: string }>(
    `SELECT banco_id, comentario, explicacoes_erradas FROM explicacoes_banco WHERE banco_id IN (${placeholders})`,
    unicos,
  );
  return new Map(
    rows.map((r) => [
      r.banco_id,
      { comentario: r.comentario, explicacoes_erradas: parseJSON(r.explicacoes_erradas, {}) },
    ]),
  );
}

/** Grava (ou substitui) o comentário/explicações de questões do banco fixo,
 * numa única transação — chamado depois de toda geração via API. */
export async function salvarExplicacoesBanco(
  itens: { bancoId: string; comentario: string; explicacoes_erradas: Record<string, string> }[],
): Promise<void> {
  if (!itens.length) return;
  await runBatch(
    itens.map((it) => ({
      sql: `INSERT INTO explicacoes_banco (banco_id, comentario, explicacoes_erradas, ts)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(banco_id) DO UPDATE SET
              comentario = excluded.comentario,
              explicacoes_erradas = excluded.explicacoes_erradas,
              ts = excluded.ts`,
      params: [it.bancoId, it.comentario, JSON.stringify(it.explicacoes_erradas), new Date().toISOString()],
    })),
  );
}

/**
 * Grava a explicação de uma ou mais alternativas geradas SOB DEMANDA (ver
 * gerarExplicacaoParcial em anthropic.ts) numa questão já respondida —
 * MESCLA com o que já existir em vez de sobrescrever, porque o usuário pode
 * pedir explicação de alternativas diferentes em momentos diferentes.
 * `comentario` só é atualizado quando informado (gabarito foi uma das
 * letras pedidas desta vez).
 */
export async function mesclarExplicacoesRespondida(
  id: number,
  comentario: string | undefined,
  novasExplicacoes: Record<string, string>,
): Promise<void> {
  const row = await one<{ comentario: string; explicacoes_erradas: string }>(
    `SELECT comentario, explicacoes_erradas FROM questoes_respondidas WHERE id = ?`,
    [id],
  );
  if (!row) return;
  const atuais = parseJSON<Record<string, string>>(row.explicacoes_erradas, {});
  const mescladas = { ...atuais, ...novasExplicacoes };
  await run(`UPDATE questoes_respondidas SET comentario = ?, explicacoes_erradas = ? WHERE id = ?`, [
    comentario ?? row.comentario,
    JSON.stringify(mescladas),
    id,
  ]);
}

/** Mesma mescla de `mesclarExplicacoesRespondida`, para o cache de
 * explicações do banco fixo (`explicacoes_banco`) — assim uma explicação
 * pedida sob demanda para uma questão do banco também fica pronta da
 * próxima vez que ela for sorteada (ver buscarExplicacoesBanco). */
export async function mesclarExplicacoesBanco(
  bancoId: string,
  comentario: string | undefined,
  novasExplicacoes: Record<string, string>,
): Promise<void> {
  const cache = await buscarExplicacoesBanco([bancoId]);
  const atual = cache.get(bancoId);
  await salvarExplicacoesBanco([
    {
      bancoId,
      comentario: comentario ?? atual?.comentario ?? "",
      explicacoes_erradas: { ...(atual?.explicacoes_erradas ?? {}), ...novasExplicacoes },
    },
  ]);
}

export type MotivoReport = "gabarito" | "enunciado" | "duplicada" | "outro";

export const MOTIVOS_REPORT: { id: MotivoReport; label: string }[] = [
  { id: "gabarito", label: "Gabarito errado" },
  { id: "enunciado", label: "Enunciado confuso ou incompleto" },
  { id: "duplicada", label: "Questão duplicada" },
  { id: "outro", label: "Outro motivo" },
];

/** Sinaliza que a questão em si (enunciado/gabarito) está errada — não o
 * desempenho do usuário. Serve para depois revisar o que o modelo gerou mal.
 * `motivo` categoriza a causa mais provável, para orientar a curadoria. */
export async function reportarQuestao(id: number, motivo: MotivoReport): Promise<void> {
  await run(`UPDATE questoes_respondidas SET reportada = 1, motivo_report = ? WHERE id = ?`, [
    motivo,
    id,
  ]);
}

export interface QuestaoReportada {
  id: number;
  materia: string;
  enunciado: string;
  motivo_report: string | null;
  ts: string;
}

/** Lista de questões sinalizadas como erradas (enunciado/gabarito), para
 * curadoria em Ajustes — sem isto o report ficava gravado no banco sem
 * nenhuma tela para lê-lo de volta. */
export async function listarReportadas(): Promise<QuestaoReportada[]> {
  const rows = await all(
    `SELECT id, materia, enunciado, motivo_report, ts
     FROM questoes_respondidas
     WHERE reportada = 1
     ORDER BY ts DESC`,
  );
  return rows.map((r) => ({
    id: Number(r.id),
    materia: String(r.materia),
    enunciado: String(r.enunciado),
    motivo_report: (r.motivo_report as string) ?? null,
    ts: String(r.ts),
  }));
}

/** Marca um report como já revisado pelo usuário (curadoria feita) — some da
 * lista de pendentes; a questão em si e seu histórico de resposta continuam
 * intactos, só o sinalizador de report é limpo. */
export async function resolverReport(id: number): Promise<void> {
  await run(
    `UPDATE questoes_respondidas SET reportada = 0, motivo_report = NULL WHERE id = ?`,
    [id],
  );
}
