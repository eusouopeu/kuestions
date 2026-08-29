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
  ts: string;
}

function mapPdf(r: Record<string, unknown>): RegistroPdf {
  return {
    id: Number(r.id),
    nome: String(r.nome ?? ""),
    caminho: String(r.caminho ?? ""),
    pagina: Number(r.pagina ?? 1),
    ts: String(r.ts),
  };
}

export async function registrarPdf(nome: string, caminho: string): Promise<number> {
  const { lastId } = await run(
    `INSERT INTO pdfs (nome, caminho, ts) VALUES (?, ?, ?)`,
    [nome, caminho, agoraISO()],
  );
  return lastId;
}

export async function listarPdfs(): Promise<RegistroPdf[]> {
  const rows = await all(`SELECT * FROM pdfs ORDER BY ts DESC`);
  return rows.map(mapPdf);
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
