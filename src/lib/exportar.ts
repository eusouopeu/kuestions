/**
 * Exportação de arquivos gerados no app (CSV de flashcards, por ora).
 *
 * No nativo (Android/iOS), um `<a download>` com Blob não funciona de forma
 * confiável dentro de uma WebView — não há UI de downloads por trás dela.
 * O caminho idiomático do Capacitor é escrever o arquivo com
 * `@capacitor/filesystem` e abrir a folha de compartilhamento nativa com
 * `@capacitor/share`, deixando o próprio usuário escolher onde salvar
 * (Drive, Arquivos, e-mail, WhatsApp…).
 *
 * No navegador (dev), o caminho de sempre (Blob + `<a download>`) funciona e
 * é mais simples — não precisa da folha de compartilhamento.
 */
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/** Formata um array de linhas (cada uma um array de campos) como CSV RFC4180. */
export function paraCSV(linhas: string[][]): string {
  const campo = (v: string) => {
    const precisaAspas = /[";\n\r]/.test(v);
    const escapado = v.replace(/"/g, '""');
    return precisaAspas ? `"${escapado}"` : escapado;
  };
  return linhas.map((l) => l.map(campo).join(";")).join("\r\n");
}

/**
 * Grava `conteudo` em um arquivo e o entrega ao usuário: folha de
 * compartilhamento nativa no Android/iOS, download direto no navegador.
 */
export async function exportarArquivo(
  nomeArquivo: string,
  conteudo: string,
  mime = "text/csv",
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const gravado = await Filesystem.writeFile({
      path: nomeArquivo,
      data: conteudo,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({
      title: nomeArquivo,
      url: gravado.uri,
      dialogTitle: "Exportar",
    });
    return;
  }

  // ﻿: BOM UTF-8, para o Excel/Anki no Windows não interpretarem
  // acentos como Latin-1.
  const blob = new Blob(["﻿" + conteudo], { type: `${mime};charset=utf-8` });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Converte bytes para base64 em pedaços — passar o array inteiro de uma vez
 * para `String.fromCharCode(...bytes)` estoura a pilha em arquivos maiores
 * que uns 100 KB (limite de argumentos de função do motor JS). */
function bytesParaBase64(bytes: Uint8Array): string {
  const TAMANHO_PEDACO = 8192;
  let binario = "";
  for (let i = 0; i < bytes.length; i += TAMANHO_PEDACO) {
    binario += String.fromCharCode(...bytes.subarray(i, i + TAMANHO_PEDACO));
  }
  return btoa(binario);
}

/** Mesma entrega de `exportarArquivo`, para conteúdo binário (ver
 * lib/apkg.ts) — no nativo, `Filesystem.writeFile` sem `encoding` espera
 * base64; no navegador/Tauri, o Blob recebe os bytes direto. */
export async function exportarArquivoBinario(
  nomeArquivo: string,
  bytes: Uint8Array,
  mime: string,
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const gravado = await Filesystem.writeFile({
      path: nomeArquivo,
      data: bytesParaBase64(bytes),
      directory: Directory.Cache,
    });
    await Share.share({
      title: nomeArquivo,
      url: gravado.uri,
      dialogTitle: "Exportar",
    });
    return;
  }

  // O cast é só de tipo: lib.dom exige que o ArrayBuffer por trás do
  // Uint8Array não seja um SharedArrayBuffer (nunca é o caso aqui — os bytes
  // vêm sempre de um `new Uint8Array(...)` fresco em zip.ts/apkg.ts).
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(a.href);
}
