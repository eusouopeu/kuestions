/** Tabela `mapas` — mapas mentais (ver src/lib/mapas/tipos.ts e
 * src/views/notas/mapas). Revisão ativa usa o mesmo esquema de caixas de
 * Leitner de notas e questões (ver ./leitner.ts). */
import { all, one, parseJSON, run } from "../db";
import type { Mapa, NoMapa } from "../mapas/tipos";
import { INTERVALOS_LEITNER_DIAS } from "./leitner";
import { agoraISO } from "./util";

function mapMapa(r: Record<string, unknown>): Mapa {
  return {
    id: Number(r.id),
    nome: String(r.nome ?? ""),
    materia: (r.materia as string) ?? null,
    nos: parseJSON<NoMapa[]>(r.nos, []),
    caixa_leitner: Number(r.caixa_leitner ?? 1),
    proxima_revisao: (r.proxima_revisao as string) ?? null,
    ts: String(r.ts),
  };
}

export async function criarMapa(args: {
  nome: string;
  materia: string | null;
  nos: NoMapa[];
}): Promise<number> {
  const { lastId } = await run(
    `INSERT INTO mapas (nome, materia, nos, ts) VALUES (?, ?, ?, ?)`,
    [args.nome, args.materia, JSON.stringify(args.nos), agoraISO()],
  );
  return lastId;
}

export async function listarMapas(materia: string | null = null): Promise<Mapa[]> {
  const rows = await all(
    `SELECT * FROM mapas ${materia ? "WHERE materia = ?" : ""} ORDER BY ts DESC`,
    materia ? [materia] : [],
  );
  return rows.map(mapMapa);
}

export async function obterMapa(id: number): Promise<Mapa | null> {
  const row = await one(`SELECT * FROM mapas WHERE id = ?`, [id]);
  return row ? mapMapa(row) : null;
}

export async function salvarNosMapa(id: number, nos: NoMapa[]): Promise<void> {
  await run(`UPDATE mapas SET nos = ?, ts = ? WHERE id = ?`, [
    JSON.stringify(nos),
    agoraISO(),
    id,
  ]);
}

export async function renomearMapa(id: number, nome: string): Promise<void> {
  await run(`UPDATE mapas SET nome = ?, ts = ? WHERE id = ?`, [nome, agoraISO(), id]);
}

export async function apagarMapa(id: number): Promise<void> {
  await run(`DELETE FROM mapas WHERE id = ?`, [id]);
}

export async function buscarMapas(termo: string): Promise<Mapa[]> {
  const q = termo.trim();
  if (!q) return [];
  const like = `%${q}%`;
  const rows = await all(
    `SELECT * FROM mapas WHERE nome LIKE ? OR nos LIKE ? ORDER BY ts DESC LIMIT 100`,
    [like, like],
  );
  return rows.map(mapMapa);
}

/** Mesmo esquema de repetição espaçada de registrarRevisaoNota (repo/notas.ts):
 * "lembrei"/"não lembrei" ao fim do modo estudo do mapa (ver EstudoMapa.tsx). */
export async function registrarRevisaoMapa(id: number, lembrou: boolean): Promise<void> {
  if (!lembrou) {
    await run(`UPDATE mapas SET caixa_leitner = 1, proxima_revisao = NULL WHERE id = ?`, [id]);
    return;
  }
  const row = await one<{ caixa: number }>(
    `SELECT caixa_leitner AS caixa FROM mapas WHERE id = ?`,
    [id],
  );
  const novaCaixa = Math.min((row?.caixa ?? 1) + 1, INTERVALOS_LEITNER_DIAS.length);
  const dias = INTERVALOS_LEITNER_DIAS[novaCaixa - 1];
  const proxima = new Date(Date.now() + dias * 86_400_000).toISOString();
  await run(`UPDATE mapas SET caixa_leitner = ?, proxima_revisao = ? WHERE id = ?`, [
    novaCaixa,
    proxima,
    id,
  ]);
}

const COND_PENDENTE_MAPA = "(proxima_revisao IS NULL OR proxima_revisao <= ?)";

export async function contarMapasPendentes(): Promise<number> {
  const r = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM mapas WHERE ${COND_PENDENTE_MAPA}`,
    [agoraISO()],
  );
  return Number(r?.n ?? 0);
}
