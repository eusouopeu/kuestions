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
