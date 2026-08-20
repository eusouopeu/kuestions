/**
 * Classifica o CORPO de uma nota em um de dois formatos de exportação, na
 * ordem abaixo (a coluna Tags do CSV recebe todas as `tags` da nota,
 * separadas por espaço — mesmo formato de tags do Anki). Cada regra é
 * checada só se a anterior não se aplicou:
 *
 * 1. Marca-texto (ver `aplicarMarcaTexto`/`segmentarMarcaTexto` em texto.ts):
 *    o corpo já contém `{{c1::…}}` (amarelo) e/ou `{{c2::…}}` (laranja) —
 *    exporta como Cloze do Anki, texto tal como está.
 * 2. Frente/verso: o corpo tem um "=" — tudo antes vira a frente de um
 *    flashcard Básico, tudo depois vira o verso (primeiro "=" encontrado).
 * 3. Lista enumerada: sem marca-texto nem "=", mas o corpo é uma lista (ver
 *    `contarItensLista`) — vira Cloze automático (`converterListaParaCloze`),
 *    com o marcador de cada item visível e o conteúdo em c1.
 *
 * Sem nenhuma das três, cai no fallback: Básico com a frente = corpo inteiro
 * e o verso em branco.
 *
 * Funções puras (sem SQL/API) — fáceis de testar isoladamente.
 */
import { contarItensLista, converterListaParaCloze } from "./texto";
import { paraCSV } from "./exportar";

export interface FlashcardCloze {
  tipo: "cloze";
  texto: string;
  tag: string;
}

export interface FlashcardBasico {
  tipo: "basico";
  frente: string;
  verso: string;
  tag: string;
}

export type Flashcard = FlashcardCloze | FlashcardBasico;

const RE_TEM_CLOZE = /\{\{c[12]::/;

export function paraFlashcard(nota: { corpo: string; tags: string[] }): Flashcard {
  const corpo = nota.corpo.trim();
  const tag = nota.tags.join(" ");

  if (RE_TEM_CLOZE.test(corpo)) {
    return { tipo: "cloze", texto: corpo, tag };
  }

  const idxIgual = corpo.indexOf("=");
  if (idxIgual !== -1) {
    return {
      tipo: "basico",
      frente: corpo.slice(0, idxIgual).trim(),
      verso: corpo.slice(idxIgual + 1).trim(),
      tag,
    };
  }

  if (contarItensLista(corpo) > 0) {
    const clozed = converterListaParaCloze(corpo);
    if (clozed) return { tipo: "cloze", texto: clozed, tag };
  }

  return { tipo: "basico", frente: corpo, verso: "", tag };
}

export interface ArquivosFlashcards {
  /** CSV pronto para o tipo de nota "Cloze" do Anki (colunas: Texto, Tags) — null quando nenhuma nota caiu nessa classificação. */
  cloze: string | null;
  /** CSV pronto para o tipo de nota "Básico" do Anki (colunas: Frente, Verso, Tags) — null quando nenhuma nota caiu nessa classificação. */
  basico: string | null;
  totalCloze: number;
  totalBasico: number;
}

/**
 * Classifica um lote de notas e monta os dois CSVs de exportação. Cloze e
 * Básico saem em arquivos separados porque são tipos de nota diferentes no
 * Anki — um único CSV misturando as duas formas exigiria duas importações
 * manuais com mapeamentos de coluna diferentes de qualquer forma.
 */
export function gerarArquivosFlashcards(notas: { corpo: string; tags: string[] }[]): ArquivosFlashcards {
  const clozes: string[][] = [];
  const basicos: string[][] = [];
  for (const nota of notas) {
    const fc = paraFlashcard(nota);
    if (fc.tipo === "cloze") clozes.push([fc.texto, fc.tag]);
    else basicos.push([fc.frente, fc.verso, fc.tag]);
  }
  return {
    cloze: clozes.length ? paraCSV(clozes) : null,
    basico: basicos.length ? paraCSV(basicos) : null,
    totalCloze: clozes.length,
    totalBasico: basicos.length,
  };
}
