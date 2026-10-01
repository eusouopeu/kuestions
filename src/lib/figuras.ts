/**
 * Figuras das provas (gráficos, diagramas, tabelas complexas recortadas do
 * PDF) — ficam em banco/imagens/ e são referenciadas no texto da questão por
 * "![descrição](arquivo)". O glob as empacota como assets do build; nada é
 * baixado de fora.
 */
const IMAGENS = import.meta.glob("../../banco/imagens/*.{png,jpg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const URL_POR_ARQUIVO = new Map(
  Object.entries(IMAGENS).map(([caminho, url]) => [caminho.slice(caminho.lastIndexOf("/") + 1), url]),
);

/** URL empacotada da figura `arquivo` (nome em banco/imagens/), ou undefined. */
export function urlFigura(arquivo: string): string | undefined {
  return URL_POR_ARQUIVO.get(arquivo);
}
