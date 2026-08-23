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

/** Mesmo marcador de RE_ITEM_LISTA, mas capturando "marcador+espaço" (grupo 1,
 * mantido visível ao converter para cloze) separado do resto da linha (grupo
 * 2, o que vira o conteúdo escondido) — ver `converterListaParaCloze`. */
const RE_ITEM_LISTA_CAPTURA = /^(\s*(?:[-*•‣·]|\d+[.)]|\([a-z0-9]+\)|[a-z][.)])\s+)(.*)$/i;

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

/**
 * Converte uma lista enumerada em texto de cloze do Anki: o marcador de cada
 * item ("1.", "-", "a)"...) continua visível, e o conteúdo do item vira
 * `{{c1::conteúdo}}` — todos os itens no MESMO grupo de cloze (c1), então o
 * Anki esconde/revela a lista inteira de uma vez, não item a item. Devolve
 * `null` quando o texto não tem uma lista reconhecível (mesmo critério de
 * `contarItensLista`, ≥2 linhas com marcador) — quem chama decide o fallback.
 */
export function converterListaParaCloze(texto: string): string | null {
  if (contarItensLista(texto) === 0) return null;
  return texto
    .split(/\r?\n/)
    .map((linhaOriginal) => {
      const l = linhaOriginal.trim();
      const m = l.match(RE_ITEM_LISTA_CAPTURA);
      if (!m) return linhaOriginal;
      const [, marcador, conteudo] = m;
      return conteudo ? `${marcador}{{c1::${conteudo}}}` : linhaOriginal;
    })
    .join("\n");
}

export type CorMarcaTexto = "amarelo" | "laranja";

/** Marcador de cloze do Anki para cada cor de marca-texto — amarelo é sempre
 * o primeiro grupo revelado (c1), laranja o segundo (c2). */
const CLOZE_DA_COR: Record<CorMarcaTexto, string> = { amarelo: "c1", laranja: "c2" };

/**
 * Envolve `corpo.slice(inicio, fim)` num marcador de cloze do Anki
 * (`{{c1::…}}` para amarelo, `{{c2::…}}` para laranja) — usado pelos botões
 * de marca-texto na edição/criação de nota. O texto já sai com a sintaxe do
 * Anki embutida, então a exportação para flashcards (ver lib/flashcards.ts)
 * não precisa reinterpretar cor nenhuma: só verifica se `{{c1::` ou `{{c2::`
 * já está no corpo. Sem seleção (`inicio === fim`), devolve o corpo intacto.
 */
export function aplicarMarcaTexto(
  corpo: string,
  inicio: number,
  fim: number,
  cor: CorMarcaTexto,
): string {
  if (inicio === fim) return corpo;
  const [de, ate] = inicio < fim ? [inicio, fim] : [fim, inicio];
  const antes = corpo.slice(0, de);
  const selecionado = corpo.slice(de, ate);
  const depois = corpo.slice(ate);
  return `${antes}{{${CLOZE_DA_COR[cor]}::${selecionado}}}${depois}`;
}

export interface SegmentoMarcaTexto {
  texto: string;
  cor: CorMarcaTexto | null;
}

const RE_CLOZE = /\{\{(c1|c2)::([\s\S]*?)\}\}/g;
const COR_DO_CLOZE: Record<string, CorMarcaTexto> = { c1: "amarelo", c2: "laranja" };

/** Quebra o corpo da nota em segmentos de texto simples e trechos marcados
 * (`{{c1::…}}`/`{{c2::…}}`), para renderizar uma prévia colorida da nota sem
 * expor a sintaxe crua do Anki na tela de edição. Não altera o texto salvo —
 * só como esses segmentos aparecem. */
export function segmentarMarcaTexto(corpo: string): SegmentoMarcaTexto[] {
  const segmentos: SegmentoMarcaTexto[] = [];
  let ultimo = 0;
  for (const m of corpo.matchAll(RE_CLOZE)) {
    const inicio = m.index ?? 0;
    if (inicio > ultimo) segmentos.push({ texto: corpo.slice(ultimo, inicio), cor: null });
    segmentos.push({ texto: m[2], cor: COR_DO_CLOZE[m[1]] });
    ultimo = inicio + m[0].length;
  }
  if (ultimo < corpo.length) segmentos.push({ texto: corpo.slice(ultimo), cor: null });
  return segmentos;
}

/** Data curta ("18/08/26") a partir de um ISO — usado nos cartões de nota e
 * de questão de origem. Data inválida/ausente vira "—" em vez de "Invalid
 * Date" na tela. */
export function dataCurta(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/** Nome de arquivo seguro a partir de um texto livre (ex.: nome da matéria). */
export function slugify(texto: string): string {
  const s = semAcento(texto.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "arquivo";
}

/**
 * A questão exige conta? Decide se a calculadora embutida aparece embaixo do
 * card (ver Calculadora em components/) — alternar para a calculadora do
 * celular no meio de uma questão de apuração é sair do app e perder o
 * enunciado de vista.
 *
 * Dois caminhos, porque só o primeiro é confiável e ele nem sempre existe:
 *   1. `tipo_cobranca === "calculo"` — a própria geração declarou (ver TIPOS
 *      em lib/constants.ts). Questão de prova real e questão importada não
 *      têm esse campo;
 *   2. heurística sobre o texto: dois ou mais números E um marcador de conta
 *      (R$, %, ou vocabulário de cálculo). Exigir os dois evita ligar a
 *      calculadora em questão de literalidade que só cita "art. 150, III".
 */
const MARCADORES_CALCULO =
  /\b(al[ií]quota|juros?|montante|base de c[áa]lculo|apura[çc][ãa]o|deprecia[çc][ãa]o|amortiza[çc][ãa]o|desconto|acr[ée]scimo|multa|corre[çc][ãa]o monet[áa]ria|saldo|valor presente|valor futuro|taxa|percentual|propor[çc][ãa]o|m[ée]dia|d[ée]bito|cr[ée]dito)\b/i;

export function pareceCalculo(questao: {
  enunciado: string;
  alternativas?: string[] | null;
  tipo_cobranca?: string;
}): boolean {
  if (questao.tipo_cobranca === "calculo") return true;

  const texto = [questao.enunciado, ...(questao.alternativas ?? [])].join(" ");
  // Números "de conta": exclui os que vêm colados a "art.", "inciso" etc. só
  // pelo volume — dois ou mais números soltos num texto com marcador de
  // cálculo é sinal suficiente, e um falso positivo custa uma seção
  // recolhida, não um erro.
  const numeros = texto.match(/\d[\d.,]*/g) ?? [];
  if (numeros.length < 2) return false;
  return /R\$|%/.test(texto) || MARCADORES_CALCULO.test(texto);
}
