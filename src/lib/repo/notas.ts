/** Tabela `conceitos_salvos`: notas criadas por seleção de texto, revisão
 * ativa (repetição espaçada) e a busca/nuvem de tags da aba Notas. */
import { all, one, parseJSON, run } from "../db";
import { sincronizarNotasDocumentos } from "../exportarDocumentos";
import type { ConceitoSalvo } from "../types";
import { INTERVALOS_LEITNER_DIAS } from "./leitner";
import { agoraISO } from "./util";

/**
 * Salva uma nota criada a partir de um trecho selecionado na questão. Sem
 * dedup: corpo é escolhido pelo próprio usuário a cada seleção, então duas
 * notas com o mesmo corpo (partes diferentes de uma mesma questão, por
 * exemplo) são um caso de uso legítimo, não um erro a prevenir.
 *
 * `tag` vira o único item inicial de `tags` — a "tag de origem" travada
 * contra remoção (ver atualizarNota). `termo`/`definicao`/`titulo` são
 * colunas do fluxo antigo (chip de conceito / nota com título) que
 * continuam `NOT NULL` no schema sem DEFAULT (ver comentário em db.ts);
 * ficam com string vazia em todo INSERT novo, sem serem mais lidas.
 */
export async function salvarNota(args: {
  materia: string;
  corpo: string;
  tag: string;
  questaoOrigemId: number | null;
}): Promise<number> {
  const { lastId } = await run(
    `INSERT INTO conceitos_salvos (materia, termo, definicao, corpo, tags, questao_origem_id, ts)
     VALUES (?, '', '', ?, ?, ?, ?)`,
    [
      args.materia,
      args.corpo,
      JSON.stringify([args.tag]),
      args.questaoOrigemId,
      new Date().toISOString(),
    ],
  );
  // Não aguarda: mantém o espelho em Documentos/kuestion (ver
  // lib/exportarDocumentos.ts) atualizado sem atrasar quem salvou a nota.
  void sincronizarNotasDocumentos();
  return lastId;
}

function mapNota(r: Record<string, unknown>): ConceitoSalvo {
  return {
    id: Number(r.id),
    materia: String(r.materia),
    corpo: String(r.corpo ?? ""),
    tags: parseJSON<string[]>(r.tags, []),
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

/**
 * Tags de todas as notas, com contagem — base da nuvem de tags da aba Notas
 * (ver NotasTab), uma visão cruzando matérias que a navegação por pasta não
 * oferece: a mesma tag pode aparecer em notas de matérias diferentes.
 * `json_each` desaninha o array JSON de `tags` (mesmo mecanismo de
 * contarErradasPorConceito para o array `conceitos` de questoes_respondidas).
 */
export async function listarTagsComContagem(): Promise<{ tag: string; total: number }[]> {
  const rows = await all<{ tag: string; total: number }>(
    `SELECT je.value AS tag, COUNT(*) AS total
     FROM conceitos_salvos, json_each(conceitos_salvos.tags) je
     GROUP BY je.value
     ORDER BY total DESC, tag COLLATE NOCASE ASC`,
  );
  return rows.map((r) => ({ tag: String(r.tag), total: Number(r.total) }));
}

/** Todas as notas com uma tag específica, em qualquer matéria — o que a
 * nuvem de tags abre ao tocar numa tag. */
export async function listarNotasPorTag(tag: string): Promise<ConceitoSalvo[]> {
  const rows = await all(
    `SELECT conceitos_salvos.* FROM conceitos_salvos, json_each(conceitos_salvos.tags) je
     WHERE je.value = ?
     ORDER BY ts DESC`,
    [tag],
  );
  return rows.map(mapNota);
}

export async function listarConceitos(
  materia: string,
  ordem: "data" | "alfabetica",
): Promise<ConceitoSalvo[]> {
  const rows = await all(
    `SELECT * FROM conceitos_salvos
     WHERE materia = ?
     ORDER BY ${ordem === "data" ? "ts DESC" : "corpo COLLATE NOCASE ASC"}`,
    [materia],
  );
  return rows.map(mapNota);
}

/**
 * Busca notas por corpo ou tags, em todas as matérias — a ordenação por
 * data/A-Z de listarConceitos já cobre uma pasta; isto cobre "onde salvei
 * aquilo" quando o usuário não lembra em qual matéria. `tags` é buscada como
 * texto bruto do array JSON — impreciso na borda (ex.: casaria uma tag que
 * seja substring de outra), mas simples e suficiente para achar a nota.
 */
export async function buscarNotas(termo: string): Promise<ConceitoSalvo[]> {
  const q = termo.trim();
  if (!q) return [];
  const like = `%${q}%`;
  const rows = await all(
    `SELECT * FROM conceitos_salvos
     WHERE corpo LIKE ? OR tags LIKE ?
     ORDER BY ts DESC
     LIMIT 100`,
    [like, like],
  );
  return rows.map(mapNota);
}

export async function atualizarNota(id: number, corpo: string, tags: string[]): Promise<void> {
  await run(`UPDATE conceitos_salvos SET corpo = ?, tags = ? WHERE id = ?`, [
    corpo,
    JSON.stringify(tags),
    id,
  ]);
  void sincronizarNotasDocumentos();
}

export async function apagarConceito(id: number): Promise<void> {
  await run(`DELETE FROM conceitos_salvos WHERE id = ?`, [id]);
  void sincronizarNotasDocumentos();
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
