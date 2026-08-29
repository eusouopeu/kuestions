/**
 * Modelo de dados do Mapa mental (ver src/views/notas/mapas). Portado quase
 * literalmente do SynapsePro (index.html) — o modelo lá já era bom e
 * serializável; o que muda é a camada de render (React + SVG em vez de DOM
 * imperativo + canvas, ver MapaMental.tsx).
 */
export interface NoMapa {
  id: number;
  texto: string;
  x: number;
  y: number;
  pai: number | null;
  /** Token de cor de theme.ts (ex.: "caneta"), não hex cru. */
  cor: string;
  tamanho: "pequeno" | "medio" | "grande";
  /** Usada no modo estudo: dica opcional mostrada antes de revelar o nó. */
  dica?: string;
  /** Redimensionamento manual — quando ausente, o tamanho é calculado do texto. */
  largura?: number;
  altura?: number;
}

export interface Mapa {
  id: number;
  nome: string;
  materia: string | null;
  nos: NoMapa[];
  caixa_leitner: number;
  proxima_revisao: string | null;
  ts: string;
}

export function novoNoMapa(args: {
  id: number;
  texto: string;
  x: number;
  y: number;
  pai: number | null;
}): NoMapa {
  return {
    id: args.id,
    texto: args.texto,
    x: args.x,
    y: args.y,
    pai: args.pai,
    cor: "caneta",
    tamanho: args.pai == null ? "grande" : "medio",
  };
}
