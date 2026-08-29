/**
 * Modelo de dados do Caderno (editor de blocos, ver src/views/notas/caderno).
 * Portado do editor do SynapsePro (web_notebook/index.html), mas com uma
 * mudança deliberada: lá cada bloco guarda `innerHTML` cru, editado com
 * `document.execCommand` — legado que exige sanitização e é frágil em
 * WebView. Aqui cada bloco guarda TEXTO PURO com marcação inline própria
 * (**negrito**, *itálico*, `código`, {{c1::oculto}}, [[Página]]), a mesma
 * marcação que TextoComMarcaTexto já entende — sem HTML armazenado, sem
 * sanitização, e ganha de graça o "cover" de revisão ativa do SynapsePro
 * (a marca {{c1::}} já esconde/revela).
 */
export type TipoBloco =
  | "texto"
  | "h1"
  | "h2"
  | "bullet"
  | "todo"
  | "citacao"
  | "codigo"
  | "divisor"
  | "tabela"
  | "callout"
  | "toggle";

export interface BlocoCaderno {
  id: string;
  tipo: TipoBloco;
  /** Marcação inline — vazio em blocos "divisor". */
  texto: string;
  /** Só em blocos "todo". */
  marcado?: boolean;
  /** Só em blocos "toggle": recolhido por padrão ao reabrir a página. */
  aberto?: boolean;
  /** Só em blocos "toggle": os blocos aninhados dentro dele. */
  corpo?: BlocoCaderno[];
  /** Só em blocos "tabela": linhas de células, cada célula em marcação inline. */
  celulas?: string[][];
}

export interface PaginaCaderno {
  id: number;
  titulo: string;
  icone: string | null;
  /** Matéria (ver MATERIAS em lib/constants.ts) ou pasta livre; null = sem pasta. */
  pasta: string | null;
  fixada: boolean;
  blocos: BlocoCaderno[];
  criada_em: string;
  ts: string;
}

export function novoBloco(tipo: TipoBloco = "texto"): BlocoCaderno {
  return { id: crypto.randomUUID(), tipo, texto: "" };
}
