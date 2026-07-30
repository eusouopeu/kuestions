/**
 * Utilitários de texto puros, sem chamada à API — usados tanto para calcular
 * a tag de uma nota (assunto do bloco, resumido a até 3 palavras) quanto para
 * detectar listas no corpo de uma nota na exportação para flashcards.
 */

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "a", "o", "os", "as", "para",
  "com", "sem", "um", "uma", "uns", "umas", "no", "na", "nos", "nas", "ou",
  "ao", "aos", "à", "às", "por", "que", "se", "seu", "sua", "seus", "suas",
]);

/** Remove acentos: decompõe (NFD) e descarta os diacríticos combinantes (U+0300–U+036F). */
function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Resume um texto (o tópico digitado na geração, ou a matéria como fallback)
 * a no máximo 3 palavras significativas, em minúsculas, ligadas por hífen —
 * formato pronto para virar tag de exportação (ex.: Anki).
 *
 * Puramente local (sem chamada à API): é chamado a cada nota salva, então uma
 * chamada de rede aqui seria custo e latência desnecessários para o que é,
 * na prática, uma normalização de string.
 */
export function gerarTagAssunto(texto: string): string {
  const palavras = semAcento(texto.toLowerCase())
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length > 1 && !STOPWORDS.has(p));

  const tag = palavras.slice(0, 3).join("-");
  return tag || "geral";
}

/** Um marcador de item de lista: "- ", "* ", "1. ", "1) ", "(1) ", "a) ". */
const RE_ITEM_LISTA = /^\s*(?:[-*•‣·]|\d+[.)]|\([a-z0-9]+\)|[a-z][.)])\s+/i;

/**
 * Conta quantas linhas do texto parecem itens de uma lista (ordenada ou não).
 * Exige pelo menos 2 linhas com marcador para não confundir uma frase solta
 * que por acaso começa com "1." (ex.: citação de artigo de lei) com uma lista.
 * Devolve 0 quando não há lista reconhecível.
 */
export function contarItensLista(texto: string): number {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const itens = linhas.filter((l) => RE_ITEM_LISTA.test(l));
  return itens.length >= 2 ? itens.length : 0;
}

/** Nome de arquivo seguro a partir de um texto livre (ex.: nome da matéria). */
export function slugify(texto: string): string {
  const s = semAcento(texto.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "arquivo";
}
