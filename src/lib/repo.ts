/**
 * Todas as queries do app. A agregação da aba Dados é feita em SQL (GROUP BY)
 * em vez de carregar o histórico inteiro na memória — é a razão de o app usar
 * SQLite e não Preferences.
 *
 * Convenção do filtro de matéria: `null` = todas as matérias. Cada função
 * monta um WHERE opcional em vez de filtrar depois, para que "todas" e
 * "uma matéria" sigam exatamente o mesmo caminho de código.
 */
import { all, one, parseJSON, run, runBatch, toBool } from "./db";
import { talvezFazerBackupAutomatico } from "./backupAuto";
import type {
  Bloco,
  ConceitoSalvo,
  Config,
  Questao,
  QuestaoRespondida,
} from "./types";

/* ---------- Blocos ---------- */

export async function criarBloco(
  cfg: Config & { materia: string },
  totalQuestoes: number,
): Promise<number> {
  const { lastId } = await run(
    `INSERT INTO blocos (ts, materia, topico, tipo, formato, nivel,
                         total_acertos, total_questoes, por_sub, aprovado)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, '[]', 0)`,
    [
      new Date().toISOString(),
      cfg.materia,
      cfg.topico || null,
      cfg.tipos.join(","),
      cfg.formato,
      cfg.nivel,
      totalQuestoes,
    ],
  );
  return lastId;
}

export async function fecharBloco(
  blocoId: number,
  porSub: number[],
  aprovado: boolean,
): Promise<void> {
  const total = porSub.reduce((a, b) => a + b, 0);
  await run(
    `UPDATE blocos SET total_acertos = ?, por_sub = ?, aprovado = ? WHERE id = ?`,
    [total, JSON.stringify(porSub), aprovado ? 1 : 0, blocoId],
  );
  // Não aguarda: o backup automático (ver lib/backupAuto.ts) não pode atrasar
  // a transição de tela de quem acabou de fechar um bloco.
  void talvezFazerBackupAutomatico();
}

function mapBloco(r: Record<string, unknown>): Bloco {
  return {
    id: Number(r.id),
    ts: String(r.ts),
    materia: String(r.materia),
    topico: (r.topico as string) ?? null,
    tipo: String(r.tipo),
    formato: String(r.formato),
    nivel: Number(r.nivel),
    total_acertos: Number(r.total_acertos),
    total_questoes: Number(r.total_questoes),
    por_sub: parseJSON<number[]>(r.por_sub, []),
    aprovado: toBool(r.aprovado),
  };
}

export async function listarBlocos(
  materia: string | null,
  limite = 40,
): Promise<Bloco[]> {
  const rows = await all(
    `SELECT * FROM blocos
     ${materia ? "WHERE materia = ?" : ""}
     ORDER BY ts DESC LIMIT ?`,
    materia ? [materia, limite] : [limite],
  );
  return rows.map(mapBloco);
}

/* ---------- Questões respondidas ---------- */

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
}): Promise<number> {
  const { questao: q } = args;
  const { lastId } = await run(
    `INSERT INTO questoes_respondidas
       (bloco_id, materia, topico, sub, carga_conceitual, nivel, formato, tipo_cobranca,
        enunciado, alternativas, gabarito, resposta, acertou, revisada,
        comentario, explicacoes_erradas, conceitos, dispositivo, banco_id, tempo_ms, ts)
     VALUES (?, ?, ?, '', 1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
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
      q.comentario ?? "",
      JSON.stringify(q.explicacoes_erradas ?? {}),
      JSON.stringify(q.conceitos ?? []),
      q.dispositivo ?? null,
      q.bancoId ?? null,
      args.tempoMs ?? null,
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
          enunciado, alternativas, gabarito, resposta, acertou, revisada,
          comentario, explicacoes_erradas, conceitos, dispositivo, banco_id, tempo_ms, ts)
       VALUES (?, ?, ?, '', 1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
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
        q.comentario ?? "",
        JSON.stringify(q.explicacoes_erradas ?? {}),
        JSON.stringify(q.conceitos ?? []),
        q.dispositivo ?? null,
        q.bancoId ?? null,
        args.tempoMs ?? null,
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
const COND_PENDENTE = "(revisada = 0 OR (proxima_revisao IS NOT NULL AND proxima_revisao <= ?))";
const agoraISO = () => new Date().toISOString();

/**
 * Erradas agrupáveis por matéria — base da view "Refazer erradas". Sem
 * `opts.limite`, carrega tudo (compatível com quem já chamava assim); com
 * limite, ativa paginação — RefazerView usa isso para não trazer para a
 * memória de uma vez um histórico de erros que só cresce com o tempo.
 */
export async function listarErradas(
  materia: string | null,
  soPendentes: boolean,
  opts: { limite?: number; offset?: number } = {},
): Promise<QuestaoRespondida[]> {
  const cond = ["acertou = 0"];
  const params: unknown[] = [];
  if (materia) {
    cond.push("materia = ?");
    params.push(materia);
  }
  if (soPendentes) {
    cond.push(COND_PENDENTE);
    params.push(agoraISO());
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

/** Contagem de erradas por matéria, para os cartões de seleção. */
export async function contarErradasPorMateria(
  soPendentes: boolean,
): Promise<{ materia: string; total: number; pendentes: number }[]> {
  const rows = await all(
    `SELECT materia,
            COUNT(*)                                       AS total,
            SUM(CASE WHEN ${COND_PENDENTE} THEN 1 ELSE 0 END) AS pendentes
     FROM questoes_respondidas
     WHERE acertou = 0 ${soPendentes ? `AND ${COND_PENDENTE}` : ""}
     GROUP BY materia
     ORDER BY total DESC`,
    soPendentes ? [agoraISO(), agoraISO()] : [agoraISO()],
  );
  return rows.map((r) => ({
    materia: String(r.materia),
    total: Number(r.total),
    pendentes: Number(r.pendentes),
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
  soPendentes: boolean,
  materia: string | null = null,
): Promise<{ conceito: string; total: number; pendentes: number }[]> {
  const condPendenteQr = "(qr.revisada = 0 OR (qr.proxima_revisao IS NOT NULL AND qr.proxima_revisao <= ?))";
  const cond = ["qr.acertou = 0"];
  const paramsWhere: unknown[] = [];
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
     ${soPendentes ? `HAVING pendentes > 0` : ""}
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
  soPendentes: boolean,
  opts: { limite?: number; offset?: number } = {},
): Promise<QuestaoRespondida[]> {
  const cond = ["qr.acertou = 0", "EXISTS (SELECT 1 FROM json_each(qr.conceitos) je WHERE je.value = ?)"];
  const params: unknown[] = [conceito];
  if (soPendentes) {
    cond.push(COND_PENDENTE);
    params.push(agoraISO());
  }
  const { limite, offset = 0 } = opts;
  const rows = await all(
    `SELECT qr.* FROM questoes_respondidas qr
     WHERE ${cond.join(" AND ")}
     ORDER BY qr.ts DESC
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

/** Todas as questões de UM bloco específico, na ordem em que apareceram —
 * base do agrupamento "Bloco" dentro do filtro "Blocos anteriores" de
 * Refazer, que reabre um bloco já fechado (gerado por IA, importado ou
 * montado do banco de questões) inteiro para nova prática. */
export async function listarPorBloco(blocoId: number): Promise<QuestaoRespondida[]> {
  const rows = await all(`SELECT * FROM questoes_respondidas WHERE bloco_id = ? ORDER BY id ASC`, [
    blocoId,
  ]);
  return rows.map(mapQuestao);
}

/** Dias até a próxima revisão, indexado pela caixa (1–5) alcançada ao
 * acertar — progressão inspirada no sistema de Leitner: quem acerta de novo
 * espera cada vez mais para revisar; quem erra volta à caixa 1 (vence agora). */
export const INTERVALOS_LEITNER_DIAS = [1, 3, 7, 16, 35] as const;

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

/* ---------- Notas (conceitos_salvos) ---------- */

/**
 * Salva uma nota criada a partir de um trecho selecionado na questão. Sem
 * dedup: título é escolhido pelo próprio usuário a cada seleção, então duas
 * notas com o mesmo título (partes diferentes de uma mesma questão, por
 * exemplo) são um caso de uso legítimo, não um erro a prevenir.
 *
 * `termo`/`definicao` são espelhados com `titulo`/`corpo`: essas colunas do
 * fluxo antigo (chip de conceito) continuam `NOT NULL` no schema — a v2 não
 * as apaga (ver comentário em db.ts) — então todo INSERT novo precisa
 * preenchê-las mesmo sem mais lê-las.
 */
export async function salvarNota(args: {
  materia: string;
  titulo: string;
  corpo: string;
  tag: string;
  questaoOrigemId: number | null;
}): Promise<number> {
  const { lastId } = await run(
    `INSERT INTO conceitos_salvos (materia, termo, definicao, titulo, corpo, tag, questao_origem_id, ts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      args.materia,
      args.titulo,
      args.corpo,
      args.titulo,
      args.corpo,
      args.tag,
      args.questaoOrigemId,
      new Date().toISOString(),
    ],
  );
  return lastId;
}

function mapNota(r: Record<string, unknown>): ConceitoSalvo {
  return {
    id: Number(r.id),
    materia: String(r.materia),
    titulo: String(r.titulo ?? ""),
    corpo: String(r.corpo ?? ""),
    tag: String(r.tag ?? ""),
    questao_origem_id:
      r.questao_origem_id == null ? null : Number(r.questao_origem_id),
    caixa_leitner: Number(r.caixa_leitner ?? 1),
    proxima_revisao: (r.proxima_revisao as string) ?? null,
    ts: String(r.ts),
  };
}

/** Notas "pendentes" de revisão ativa: nunca revisadas (proxima_revisao NULL,
 * o estado de toda nota nova) ou cuja `proxima_revisao` já venceu — mesmo
 * critério de COND_PENDENTE, mas sem depender de `acertou`/`revisada`, que
 * não existem para notas. */
const COND_PENDENTE_NOTA = "(proxima_revisao IS NULL OR proxima_revisao <= ?)";

export async function contarNotasPendentes(materia: string | null = null): Promise<number> {
  const cond = [COND_PENDENTE_NOTA];
  const params: unknown[] = [agoraISO()];
  if (materia) {
    cond.push("materia = ?");
    params.push(materia);
  }
  const r = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM conceitos_salvos WHERE ${cond.join(" AND ")}`,
    params,
  );
  return Number(r?.n ?? 0);
}

/** Contagem de notas pendentes por matéria, para os cartões de seleção da
 * revisão ativa (mesmo papel de contarErradasPorMateria para questões). */
export async function contarNotasPendentesPorMateria(): Promise<
  { materia: string; total: number; pendentes: number }[]
> {
  const rows = await all(
    `SELECT materia,
            COUNT(*) AS total,
            SUM(CASE WHEN ${COND_PENDENTE_NOTA} THEN 1 ELSE 0 END) AS pendentes
     FROM conceitos_salvos
     GROUP BY materia
     ORDER BY materia COLLATE NOCASE ASC`,
    [agoraISO()],
  );
  return rows.map((r) => ({
    materia: String(r.materia),
    total: Number(r.total),
    pendentes: Number(r.pendentes),
  }));
}

/** Fila de notas pendentes para a revisão ativa — mais antigas primeiro
 * (mesma lógica de "o que está esperando há mais tempo entra primeiro"). */
export async function listarNotasPendentes(
  materia: string | null,
  opts: { limite?: number } = {},
): Promise<ConceitoSalvo[]> {
  const cond = [COND_PENDENTE_NOTA];
  const params: unknown[] = [agoraISO()];
  if (materia) {
    cond.push("materia = ?");
    params.push(materia);
  }
  const { limite } = opts;
  const rows = await all(
    `SELECT * FROM conceitos_salvos
     WHERE ${cond.join(" AND ")}
     ORDER BY ts ASC
     ${limite ? "LIMIT ?" : ""}`,
    limite ? [...params, limite] : params,
  );
  return rows.map(mapNota);
}

/**
 * Registra o resultado de uma revisão ativa de nota ("lembrei" / "não
 * lembrei") — mesmo esquema de caixas de Leitner de registrarRevisao, só que
 * sem o conceito de "acertar/errar uma resposta": aqui é autoavaliação.
 */
export async function registrarRevisaoNota(id: number, lembrou: boolean): Promise<void> {
  if (!lembrou) {
    await run(
      `UPDATE conceitos_salvos SET caixa_leitner = 1, proxima_revisao = NULL WHERE id = ?`,
      [id],
    );
    return;
  }
  const row = await one<{ caixa: number }>(
    `SELECT caixa_leitner AS caixa FROM conceitos_salvos WHERE id = ?`,
    [id],
  );
  const novaCaixa = Math.min((row?.caixa ?? 1) + 1, INTERVALOS_LEITNER_DIAS.length);
  const dias = INTERVALOS_LEITNER_DIAS[novaCaixa - 1];
  const proxima = new Date(Date.now() + dias * 86_400_000).toISOString();
  await run(
    `UPDATE conceitos_salvos SET caixa_leitner = ?, proxima_revisao = ? WHERE id = ?`,
    [novaCaixa, proxima, id],
  );
}

/** Pastas da aba Notas: uma por matéria que já tenha alguma nota salva. */
export async function listarPastas(): Promise<
  { materia: string; total: number }[]
> {
  const rows = await all(
    `SELECT materia, COUNT(*) AS total
     FROM conceitos_salvos
     GROUP BY materia
     ORDER BY materia COLLATE NOCASE ASC`,
  );
  return rows.map((r) => ({
    materia: String(r.materia),
    total: Number(r.total),
  }));
}

export async function listarConceitos(
  materia: string,
  ordem: "data" | "alfabetica",
): Promise<ConceitoSalvo[]> {
  const rows = await all(
    `SELECT * FROM conceitos_salvos
     WHERE materia = ?
     ORDER BY ${ordem === "data" ? "ts DESC" : "titulo COLLATE NOCASE ASC"}`,
    [materia],
  );
  return rows.map(mapNota);
}

/**
 * Busca notas por título, corpo ou tag, em todas as matérias — a ordenação
 * por data/A-Z de listarConceitos já cobre uma pasta; isto cobre "onde
 * salvei aquilo" quando o usuário não lembra em qual matéria.
 */
export async function buscarNotas(termo: string): Promise<ConceitoSalvo[]> {
  const q = termo.trim();
  if (!q) return [];
  const like = `%${q}%`;
  const rows = await all(
    `SELECT * FROM conceitos_salvos
     WHERE titulo LIKE ? OR corpo LIKE ? OR tag LIKE ?
     ORDER BY ts DESC
     LIMIT 100`,
    [like, like, like],
  );
  return rows.map(mapNota);
}

export async function atualizarNota(
  id: number,
  titulo: string,
  corpo: string,
  tag: string,
): Promise<void> {
  await run(
    `UPDATE conceitos_salvos SET titulo = ?, corpo = ?, tag = ? WHERE id = ?`,
    [titulo, corpo, tag, id],
  );
}

export async function apagarConceito(id: number): Promise<void> {
  await run(`DELETE FROM conceitos_salvos WHERE id = ?`, [id]);
}

/** ids de `questoes_respondidas` (de `ids`) que já têm ao menos uma nota
 * vinculada — usado para mostrar um selo "nota salva" ao revisitar a questão
 * (ex.: em "Refazer erradas"), sem precisar de uma consulta por questão. */
export async function idsComNota(ids: number[]): Promise<Set<number>> {
  if (!ids.length) return new Set();
  const placeholders = ids.map(() => "?").join(",");
  const rows = await all<{ questao_origem_id: number }>(
    `SELECT DISTINCT questao_origem_id FROM conceitos_salvos
     WHERE questao_origem_id IN (${placeholders})`,
    ids,
  );
  return new Set(rows.map((r) => Number(r.questao_origem_id)));
}

export async function contarConceitos(materia: string | null): Promise<number> {
  const r = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM conceitos_salvos ${materia ? "WHERE materia = ?" : ""}`,
    materia ? [materia] : [],
  );
  return Number(r?.n ?? 0);
}

/* ---------- Agregações da aba Dados ---------- */

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
       FROM blocos ${materia ? "WHERE materia = ?" : ""}`,
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
     WHERE total_questoes > 0 ${materia ? "AND materia = ?" : ""}
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
  coluna: "nivel" | "tipo_cobranca" | "formato",
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
  // sentido (o filtro já é a coluna agrupada) — só se aplica a tipo/formato.
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

/** Blocos (qualquer origem) criados desde a segunda-feira mais recente
 * (00h00 local) — base da meta semanal (ver lib/metas.ts). Semana de
 * calendário, não janela rolante de 7 dias: reinicia sempre na segunda.
 * `materia` filtra a meta por matéria (ver getMetasPorMateria); omitido ou
 * null conta todos os blocos da semana, como antes. */
export async function blocosNaSemana(materia: string | null = null): Promise<number> {
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 = domingo
  const deltaParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
  const segunda = new Date(agora);
  segunda.setHours(0, 0, 0, 0);
  segunda.setDate(segunda.getDate() - deltaParaSegunda);
  const r = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM blocos WHERE ts >= ? ${materia ? "AND materia = ?" : ""}`,
    materia ? [segunda.toISOString(), materia] : [segunda.toISOString()],
  );
  return Number(r?.n ?? 0);
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

/* ---------- Questões reportadas ---------- */

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
