/**
 * Marcação inline do Caderno: `[[Título]]` como link entre páginas, por cima
 * da marca-texto `{{c1::}}`/`{{c2::}}` que já existe (ver lib/texto.ts).
 * Puro (sem React) para poder ser testado e reutilizado tanto no render de
 * leitura quanto ao extrair links de uma página inteira.
 */
export interface SegmentoBloco {
  tipo: "texto" | "link";
  texto: string;
}

const RE_LINK = /\[\[([^[\]]+)\]\]/g;

/** Quebra um texto em trechos normais e links `[[Título]]`, na ordem em que
 * aparecem — o segmento "texto" ainda pode conter marca-texto `{{c1::}}`,
 * que é responsabilidade de TextoComMarcaTexto renderizar por cima. */
export function segmentarLinksDePagina(texto: string): SegmentoBloco[] {
  const partes: SegmentoBloco[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(RE_LINK)) {
    const inicio = m.index ?? 0;
    if (inicio > ultimo) partes.push({ tipo: "texto", texto: texto.slice(ultimo, inicio) });
    partes.push({ tipo: "link", texto: m[1].trim() });
    ultimo = inicio + m[0].length;
  }
  if (ultimo < texto.length) partes.push({ tipo: "texto", texto: texto.slice(ultimo) });
  if (partes.length === 0) partes.push({ tipo: "texto", texto: "" });
  return partes;
}

/** Todos os títulos de página referenciados por `[[Título]]` num texto,
 * sem duplicatas — usado para popular um índice de "páginas ligadas". */
export function extrairLinksDePagina(texto: string): string[] {
  const vistos = new Set<string>();
  for (const m of texto.matchAll(RE_LINK)) {
    const titulo = m[1].trim();
    if (titulo) vistos.add(titulo);
  }
  return [...vistos];
}
