/** Tabela `caderno_paginas` — páginas do editor de blocos (ver
 * src/lib/caderno/tipos.ts e src/views/notas/caderno). */
import { all, one, parseJSON, run } from "../db";
import type { BlocoCaderno, PaginaCaderno } from "../caderno/tipos";
import { agoraISO } from "./util";

function mapPagina(r: Record<string, unknown>): PaginaCaderno {
  return {
    id: Number(r.id),
    titulo: String(r.titulo ?? ""),
    icone: (r.icone as string) ?? null,
    pasta: (r.pasta as string) ?? null,
    fixada: r.fixada === 1 || r.fixada === true,
    blocos: parseJSON<BlocoCaderno[]>(r.blocos, []),
    criada_em: String(r.criada_em),
    ts: String(r.ts),
  };
}

export async function criarPagina(args: {
  titulo: string;
  pasta: string | null;
  icone?: string | null;
}): Promise<number> {
  const agora = agoraISO();
  const { lastId } = await run(
    `INSERT INTO caderno_paginas (titulo, icone, pasta, blocos, criada_em, ts)
     VALUES (?, ?, ?, '[]', ?, ?)`,
    [args.titulo, args.icone ?? null, args.pasta, agora, agora],
  );
  return lastId;
}

export async function listarPaginas(pasta: string | null = null): Promise<PaginaCaderno[]> {
  const rows = await all(
    `SELECT * FROM caderno_paginas
     ${pasta ? "WHERE pasta = ?" : ""}
     ORDER BY fixada DESC, ts DESC`,
    pasta ? [pasta] : [],
  );
  return rows.map(mapPagina);
}

export async function listarPastasCaderno(): Promise<{ pasta: string; total: number }[]> {
  const rows = await all(
    `SELECT COALESCE(pasta, '') AS pasta, COUNT(*) AS total
     FROM caderno_paginas
     GROUP BY pasta
     ORDER BY pasta COLLATE NOCASE ASC`,
  );
  return rows
    .map((r) => ({ pasta: String(r.pasta), total: Number(r.total) }))
    .filter((r) => r.pasta !== "");
}

export async function obterPagina(id: number): Promise<PaginaCaderno | null> {
  const row = await one(`SELECT * FROM caderno_paginas WHERE id = ?`, [id]);
  return row ? mapPagina(row) : null;
}

export async function salvarBlocosPagina(id: number, blocos: BlocoCaderno[]): Promise<void> {
  await run(`UPDATE caderno_paginas SET blocos = ?, ts = ? WHERE id = ?`, [
    JSON.stringify(blocos),
    agoraISO(),
    id,
  ]);
}

export async function renomearPagina(id: number, titulo: string): Promise<void> {
  await run(`UPDATE caderno_paginas SET titulo = ?, ts = ? WHERE id = ?`, [
    titulo,
    agoraISO(),
    id,
  ]);
}

export async function definirIconePagina(id: number, icone: string | null): Promise<void> {
  await run(`UPDATE caderno_paginas SET icone = ?, ts = ? WHERE id = ?`, [
    icone,
    agoraISO(),
    id,
  ]);
}

export async function alternarFixadaPagina(id: number, fixada: boolean): Promise<void> {
  await run(`UPDATE caderno_paginas SET fixada = ? WHERE id = ?`, [fixada ? 1 : 0, id]);
}

export async function moverPaginaParaPasta(id: number, pasta: string | null): Promise<void> {
  await run(`UPDATE caderno_paginas SET pasta = ?, ts = ? WHERE id = ?`, [
    pasta,
    agoraISO(),
    id,
  ]);
}

export async function apagarPagina(id: number): Promise<void> {
  await run(`DELETE FROM caderno_paginas WHERE id = ?`, [id]);
}

/** Busca por título ou pelo texto dos blocos — cobre a busca global (ver
 * BuscaGlobal.tsx) e a busca dentro do próprio caderno. Como `blocos` é o
 * JSON inteiro da página, o LIKE é impreciso na borda (pode casar um pedaço
 * de outro campo do bloco), mas simples e suficiente para achar a página. */
export async function buscarPaginasCaderno(termo: string): Promise<PaginaCaderno[]> {
  const q = termo.trim();
  if (!q) return [];
  const like = `%${q}%`;
  const rows = await all(
    `SELECT * FROM caderno_paginas
     WHERE titulo LIKE ? OR blocos LIKE ?
     ORDER BY ts DESC
     LIMIT 100`,
    [like, like],
  );
  return rows.map(mapPagina);
}

export async function contarPaginasCaderno(): Promise<number> {
  const r = await one<{ n: number }>(`SELECT COUNT(*) AS n FROM caderno_paginas`);
  return Number(r?.n ?? 0);
}
