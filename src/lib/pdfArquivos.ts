/**
 * Armazena o BINÁRIO dos PDFs importados no leitor do Caderno (ver
 * views/notas/caderno/LeitorPdf.tsx) em `Documentos/kuestion/pdfs/` —
 * mesma pasta-raiz de lib/exportarDocumentos.ts, mas um módulo à parte
 * porque aquele só grava texto (UTF8): PDF é binário, e o plugin do
 * Capacitor usa uma API diferente (base64) da do Tauri (Uint8Array direto).
 * Só o CAMINHO relativo vai para o SQLite (tabela `pdfs`, ver repo/pdfs.ts)
 * — o binário nunca entra no banco.
 */
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { isTauri } from "@tauri-apps/api/core";
import { BaseDirectory } from "@tauri-apps/api/path";
import { mkdir as tauriMkdir, readFile as tauriReadFile, remove as tauriRemove, writeFile as tauriWriteFile } from "@tauri-apps/plugin-fs";

const PASTA_PDFS = "kuestion/pdfs";

type Plataforma = "capacitor" | "tauri" | "nenhuma";

function plataforma(): Plataforma {
  if (isTauri()) return "tauri";
  if (Capacitor.isNativePlatform()) return "capacitor";
  return "nenhuma";
}

/** Blobs mantidos em memória quando não há Filesystem nativo nem Tauri (o
 * `npm run dev` no navegador) — funcional durante a sessão, mas não
 * sobrevive a um reload. Nos dois alvos reais do app (Capacitor/Tauri) a
 * gravação é em disco de verdade, como as demais partes deste módulo. */
const blobsEmMemoria = new Map<string, Blob>();

function nomeSeguro(texto: string): string {
  const limpo = texto.trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").slice(0, 120);
  return limpo || "documento.pdf";
}

function paraBase64(bytes: Uint8Array): string {
  let binario = "";
  const tamanhoBloco = 0x8000;
  for (let i = 0; i < bytes.length; i += tamanhoBloco) {
    binario += String.fromCharCode(...bytes.subarray(i, i + tamanhoBloco));
  }
  return btoa(binario);
}

function deBase64(base64: string): Uint8Array {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/** Grava o PDF e devolve o caminho relativo (o que fica salvo em `pdfs.caminho`). */
export async function salvarPdfBinario(nomeOriginal: string, bytes: Uint8Array): Promise<string> {
  const nome = `${Date.now()}-${nomeSeguro(nomeOriginal)}`;
  const caminho = `${PASTA_PDFS}/${nome}`;
  const p = plataforma();

  if (p === "tauri") {
    await tauriMkdir(PASTA_PDFS, { baseDir: BaseDirectory.Document, recursive: true }).catch(() => {});
    await tauriWriteFile(caminho, bytes, { baseDir: BaseDirectory.Document });
    return caminho;
  }
  if (p === "capacitor") {
    await Filesystem.mkdir({ path: PASTA_PDFS, directory: Directory.Documents, recursive: true }).catch(() => {});
    await Filesystem.writeFile({ path: caminho, directory: Directory.Documents, data: paraBase64(bytes) });
    return caminho;
  }
  blobsEmMemoria.set(caminho, new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }));
  return caminho;
}

/** Devolve uma URL utilizável em `<iframe>`/pdf.js a partir do caminho salvo. */
export async function urlDoPdf(caminho: string): Promise<string> {
  const p = plataforma();
  if (p === "tauri") {
    const bytes = await tauriReadFile(caminho, { baseDir: BaseDirectory.Document });
    return URL.createObjectURL(new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }));
  }
  if (p === "capacitor") {
    const { data } = await Filesystem.readFile({ path: caminho, directory: Directory.Documents });
    const bytes = typeof data === "string" ? deBase64(data) : new Uint8Array(await (data as Blob).arrayBuffer());
    return URL.createObjectURL(new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }));
  }
  const blob = blobsEmMemoria.get(caminho);
  if (!blob) throw new Error("PDF não encontrado nesta sessão (recarregar a página o perde no navegador de desenvolvimento).");
  return URL.createObjectURL(blob);
}

export async function apagarPdfBinario(caminho: string): Promise<void> {
  const p = plataforma();
  if (p === "tauri") {
    await tauriRemove(caminho, { baseDir: BaseDirectory.Document }).catch(() => {});
    return;
  }
  if (p === "capacitor") {
    await Filesystem.deleteFile({ path: caminho, directory: Directory.Documents }).catch(() => {});
    return;
  }
  blobsEmMemoria.delete(caminho);
}
