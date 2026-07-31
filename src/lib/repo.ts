/**
 * Todas as queries do app. A agregação da aba Dados é feita em SQL (GROUP BY)
 * em vez de carregar o histórico inteiro na memória — é a razão de o app usar
 * SQLite e não Preferences.
 *
 * Convenção do filtro de matéria: `null` = todas as matérias. Cada função
 * monta um WHERE opcional em vez de filtrar depois, para que "todas" e
 * "uma matéria" sigam exatamente o mesmo caminho de código.
 */
import { all, one, parseJSON, run, toBool } from "./db";
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
  sub: string;
  cargaConceitual: number;
  questao: Questao;
  resposta: string;
  acertou: boolean;
}): Promise<number> {
  const { questao: q } = args;
  const { lastId } = await run(
    `INSERT INTO questoes_respondidas
       (bloco_id, materia, topico, sub, carga_conceitual, formato, tipo_cobranca,
        enunciado, alternativas, gabarito, resposta, acertou, revisada,
        comentario, explicacoes_erradas, conceitos, dispositivo, ts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
    [
      args.blocoId,
      args.materia,
      args.topico || null,
      args.sub,
      args.cargaConceitual,
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
      new Date().toISOString(),
    ],
  );
  return lastId;
}

function mapQuestao(r: Record<string, unknown>): QuestaoRespondida {
  return {
    id: Number(r.id),
    bloco_id: r.bloco_id == null ? null : Number(r.bloco_id),
    materia: String(r.materia),
    topico: (r.topico as string) ?? null,
    sub: String(r.sub),
    carga_conceitual: Number(r.carga_conceitual),
    formato: String(r.formato) as "ce" | "mc",
    tipo_cobranca: (r.tipo_cobranca as QuestaoRespondida["tipo_cobranca"]) ?? undefined,
    enunciado: String(r.enunciado),
    alternativas: parseJSON<string[] | null>(r.alternativas, null),
    gabarito: String(r.gabarito),
    resposta: String(r.resposta),
    acertou: toBool(r.acertou),
    revisada: toBool(r.revisada),
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

/** Erradas agrupáveis por matéria — base da view "Refazer erradas". */
export async function listarErradas(
  materia: string | null,
  soPendentes: boolean,
): Promise<QuestaoRespondida[]> {
  const cond = ["acertou = 0"];
  const params: unknown[] = [];
  if (materia) {
    cond.push("materia = ?");
    params.push(materia);
  }
  if (soPendentes) cond.push("revisada = 0");

  const rows = await all(
    `SELECT * FROM questoes_respondidas
     WHERE ${cond.join(" AND ")}
     ORDER BY ts DESC`,
    params,
  );
  return rows.map(mapQuestao);
}

/** Contagem de erradas por matéria, para os cartões de seleção. */
export async function contarErradasPorMateria(
  soPendentes: boolean,
): Promise<{ materia: string; total: number; pendentes: number }[]> {
  const rows = await all(
    `SELECT materia,
            COUNT(*)                                AS total,
            SUM(CASE WHEN revisada = 0 THEN 1 ELSE 0 END) AS pendentes
     FROM questoes_respondidas
     WHERE acertou = 0 ${soPendentes ? "AND revisada = 0" : ""}
     GROUP BY materia
     ORDER BY total DESC`,
  );
  return rows.map((r) => ({
    materia: String(r.materia),
    total: Number(r.total),
    pendentes: Number(r.pendentes),
  }));
}

export async function marcarRevisada(id: number): Promise<void> {
  await run(`UPDATE questoes_respondidas SET revisada = 1 WHERE id = ?`, [id]);
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
    ts: String(r.ts),
  };
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

export async function resumo(materia: string | null): Promise<Resumo> {
  const q = await one<{ n: number; a: number }>(
    `SELECT COUNT(*) AS n, SUM(acertou) AS a
     FROM questoes_respondidas ${materia ? "WHERE materia = ?" : ""}`,
    materia ? [materia] : [],
  );
  const b = await one<{ n: number; ap: number }>(
    `SELECT COUNT(*) AS n, SUM(aprovado) AS ap
     FROM blocos ${materia ? "WHERE materia = ?" : ""}`,
    materia ? [materia] : [],
  );
  return {
    totalQuestoes: Number(q?.n ?? 0),
    totalAcertos: Number(q?.a ?? 0),
    blocosAprovados: Number(b?.ap ?? 0),
    blocosTotais: Number(b?.n ?? 0),
    conceitosSalvos: await contarConceitos(materia),
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
  coluna: "carga_conceitual" | "tipo_cobranca" | "formato" | "sub",
  materia: string | null,
): Promise<Fatia[]> {
  const rows = await all(
    `SELECT ${coluna} AS chave, COUNT(*) AS total, SUM(acertou) AS acertos
     FROM questoes_respondidas
     WHERE ${coluna} IS NOT NULL ${materia ? "AND materia = ?" : ""}
     GROUP BY ${coluna}
     ORDER BY ${coluna} ASC`,
    materia ? [materia] : [],
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

export const porCarga = (m: string | null) => agrupar("carga_conceitual", m);
export const porTipo = (m: string | null) => agrupar("tipo_cobranca", m);
export const porFormato = (m: string | null) => agrupar("formato", m);

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
