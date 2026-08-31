/** Tabela `pdfs` — metadados dos PDFs importados no leitor do Caderno (ver
 * src/views/notas/caderno/LeitorPdf.tsx). O arquivo em si fica em
 * Documentos/kuestion/pdfs (ver lib/exportarDocumentos.ts); aqui só o
 * caminho relativo e a última página aberta. */
import { all, one, run } from "../db";
import { agoraISO } from "./util";

export interface RegistroPdf {
  id: number;
  nome: string;
  caminho: string;
  pagina: number;
  pasta: string | null;
  ts: string;
}

function mapPdf(r: Record<string, unknown>): RegistroPdf {
  return {
    id: Number(r.id),
    nome: String(r.nome ?? ""),
    caminho: String(r.caminho ?? ""),
    pagina: Number(r.pagina ?? 1),
    pasta: (r.pasta as string) ?? null,
    ts: String(r.ts),
  };
}

export async function registrarPdf(nome: string, caminho: string, pasta: string | null = null): Promise<number> {
  const { lastId } = await run(
    `INSERT INTO pdfs (nome, caminho, pasta, ts) VALUES (?, ?, ?, ?)`,
    [nome, caminho, pasta, agoraISO()],
  );
  return lastId;
}

export async function listarPdfs(pasta: string | null = null): Promise<RegistroPdf[]> {
  const rows = await all(
    `SELECT * FROM pdfs ${pasta ? "WHERE pasta = ?" : ""} ORDER BY ts DESC`,
    pasta ? [pasta] : [],
  );
  return rows.map(mapPdf);
}

export async function listarPastasPdfs(): Promise<{ pasta: string; total: number }[]> {
  const rows = await all(
    `SELECT COALESCE(pasta, '') AS pasta, COUNT(*) AS total
     FROM pdfs
     GROUP BY pasta
     ORDER BY pasta COLLATE NOCASE ASC`,
  );
  return rows
    .map((r) => ({ pasta: String(r.pasta), total: Number(r.total) }))
    .filter((r) => r.pasta !== "");
}

export async function moverPdfParaPasta(id: number, pasta: string | null): Promise<void> {
  await run(`UPDATE pdfs SET pasta = ?, ts = ? WHERE id = ?`, [pasta, agoraISO(), id]);
}

export async function obterPdf(id: number): Promise<RegistroPdf | null> {
  const row = await one(`SELECT * FROM pdfs WHERE id = ?`, [id]);
  return row ? mapPdf(row) : null;
}

export async function salvarPaginaAtualPdf(id: number, pagina: number): Promise<void> {
  await run(`UPDATE pdfs SET pagina = ?, ts = ? WHERE id = ?`, [pagina, agoraISO(), id]);
}

export async function apagarPdf(id: number): Promise<void> {
  await run(`DELETE FROM pdfs WHERE id = ?`, [id]);
}
