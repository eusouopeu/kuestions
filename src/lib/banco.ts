/**
 * Banco de questões reais de concurso (kuestion_db_1.json, ~1.350 questões de
 * SEFAZ estaduais, ISS-RJ, TCE-PI e RFB), usado pela 4ª forma de montar
 * blocos na aba Blocos: em vez de gerar questões inéditas via API, sorteia
 * questões reais já formuladas por banca. Só enunciado, alternativas e
 * gabarito vêm do banco — comentário e explicações são gerados à parte (ver
 * gerarExplicacoes em lib/anthropic.ts), porque a fonte não os traz.
 *
 * A fonte tem os dois formatos: múltipla escolha A–E e Certo/Errado (nesta,
 * `alternativas` é exatamente {C: "Certo", E: "Errado"}) — ver
 * `questaoBancoParaQuestao`, que traduz um e outro para o `Questao` do app.
 */
import banco from "../data/banco_questoes.json";
import { pesoPonderado } from "./pontuacaoTopicos";
import type { Questao } from "./types";

export interface QuestaoBanco {
  id: string;
  instituicao: string;
  ano: number;
  cargo: string;
  area: string;
  assunto: string;
  numero_original: number;
  enunciado: string;
  alternativas: Record<string, string>;
  gabarito: string;
}

// Registros sem gabarito utilizável (null na fonte, ou "X" de questão anulada
// pela banca) já são descartados na fusão do arquivo, mas o filtro fica aqui
// também: é a única leitura do JSON, e sem ele `questaoBancoParaQuestao`
// quebraria ao chamar `.trim()` num gabarito nulo assim que o registro fosse
// sorteado.
const BANCO = (banco as QuestaoBanco[]).filter(
  (q) =>
    typeof q.gabarito === "string" &&
    q.gabarito.trim() !== "" &&
    q.gabarito.trim().toUpperCase() !== "X",
);

/** Índice por id — usado por `buscarQuestaoBanco`, a ponte que o card usa
 * para saber de que prova veio a questão a partir só do `bancoId` (o único
 * campo de proveniência que sobrevive em `questoes_respondidas`). */
const POR_ID = new Map(BANCO.map((q) => [q.id, q]));

/** ids de todas as questões de um assunto, em ordem estável (ordenada) —
 * base do contexto cacheado de explicações por assunto (ver
 * `contextoDoAssunto` em lib/anthropic.ts), onde a ORDEM importa: o prompt
 * caching é casamento de prefixo byte a byte, então o mesmo assunto tem de
 * produzir sempre a mesma sequência. */
export function idsDoAssunto(assunto: string): string[] {
  return BANCO.filter((q) => q.assunto === assunto)
    .map((q) => q.id)
    .sort();
}

/** Questão do banco pelo id, ou null. */
export function buscarQuestaoBanco(id: string): QuestaoBanco | null {
  return POR_ID.get(id) ?? null;
}

/**
 * Nome da prova de origem, para a tag do card: instituição + cargo + ano.
 * O cargo entra porque a mesma banca/ano pode ter provas distintas
 * (ex. SEFAZ-RJ 2025 tem "Fiscal de Rendas" e "Conhecimentos Gerais").
 */
export function nomeDaProva(q: QuestaoBanco): string {
  return [q.instituicao, q.cargo, q.ano].filter(Boolean).join(" · ");
}

/**
 * Toda questão de prova real conta como nível 5: são questões efetivamente
 * cobradas por banca, no formato final, sem a gradação didática dos níveis
 * 1–4 da geração por IA (ver NIVEL_DESCRICOES em lib/constants.ts). Fixar em
 * 5 — em vez do `null` de antes — é o que faz o banco real aparecer nos
 * gráficos por nível e contar como prática de nível máximo.
 */
export const NIVEL_BANCO = 5;

/** Áreas do banco, independentes de MATERIAS — a fonte usa rótulos próprios
 * (ex. "Noções de Informática") que nem sempre batem com os da geração por
 * IA, então evitamos um mapeamento manual sujeito a divergir. */
export const AREAS_BANCO: string[] = [...new Set(BANCO.map((q) => q.area))].sort((a, b) =>
  a.localeCompare(b, "pt-BR"),
);

function questoesDeArea(area: string): QuestaoBanco[] {
  return BANCO.filter((q) => q.area === area);
}

/** Prefixo de `assunto` antes do " - " (ex. "BP — Ativo Imobilizado" em
 * "BP — Ativo Imobilizado - Depreciação") — é o "bloco de aulas" do banco. */
function prefixoAssunto(assunto: string): string {
  const i = assunto.indexOf(" - ");
  return i === -1 ? assunto : assunto.slice(0, i).trim();
}

export interface BlocoDeAssuntos {
  bloco: string;
  assuntos: string[];
  total: number;
}

/** Blocos de assunto de uma área, com a contagem de questões de cada um —
 * alimenta o dropdown "Bloco de aulas" na view "Do banco". */
export function blocosDeArea(area: string): BlocoDeAssuntos[] {
  const grupos = new Map<string, { assuntos: Set<string>; total: number }>();
  for (const q of questoesDeArea(area)) {
    const chave = prefixoAssunto(q.assunto);
    const atual = grupos.get(chave);
    if (atual) {
      atual.assuntos.add(q.assunto);
      atual.total++;
    } else {
      grupos.set(chave, { assuntos: new Set([q.assunto]), total: 1 });
    }
  }
  return [...grupos.entries()]
    .map(([bloco, v]) => ({ bloco, assuntos: [...v.assuntos], total: v.total }))
    .sort((a, b) => a.bloco.localeCompare(b.bloco, "pt-BR"));
}

export interface AssuntoComTotal {
  assunto: string;
  total: number;
}

/** Assuntos (aulas) distintos de uma área, com contagem — para a seleção
 * "Aula específica". */
export function assuntosDeArea(area: string): AssuntoComTotal[] {
  const contagem = new Map<string, number>();
  for (const q of questoesDeArea(area)) contagem.set(q.assunto, (contagem.get(q.assunto) ?? 0) + 1);
  return [...contagem.entries()]
    .map(([assunto, total]) => ({ assunto, total }))
    .sort((a, b) => a.assunto.localeCompare(b.assunto, "pt-BR"));
}

export interface AssuntoPontuado extends AssuntoComTotal {
  pontos: number;
  /** Quantas respostas dadas contam para essa pontuação — não confundir com
   * `total`, que é a contagem de questões DISPONÍVEIS no banco. */
  respondidas: number;
}

/**
 * Cruza os assuntos de uma área com a pontuação por resposta (ver
 * pontosResposta em lib/pontuacaoTopicos.ts e pontosPorConceito em
 * lib/repo.ts — cada questão do banco grava seu `assunto` como único item de
 * `conceitos`, ver questaoBancoParaQuestao abaixo) — usado para direcionar a
 * amostragem quando o usuário deixa "Todos os assuntos"/"Bloco de aulas"
 * marcado em GerarBancoView.
 */
export function pontuarAssuntos(
  area: string,
  linhas: { conceito: string; pontos: number }[],
): AssuntoPontuado[] {
  return assuntosDeArea(area).map((a) => {
    const doAssunto = linhas.filter((l) => l.conceito === a.assunto);
    return {
      ...a,
      respondidas: doAssunto.length,
      pontos: doAssunto.reduce((s, l) => s + l.pontos, 0),
    };
  });
}

/** Filtro adicional de proveniência, combinável com qualquer `modo` — banca
 * (instituição) e/ou ano da prova, aplicados por cima do filtro de assunto. */
interface FiltroProveniencia {
  instituicao?: string;
  ano?: number;
}

export type FiltroBanco = (
  | { modo: "aula"; assunto: string }
  | { modo: "bloco"; bloco: string }
  | { modo: "todos" }
) &
  FiltroProveniencia;

/** Instituições (bancas) com questões numa área, ordenadas alfabeticamente —
 * alimenta o dropdown "Banca" na view "Do banco". */
export function instituicoesDeArea(area: string): string[] {
  return [...new Set(questoesDeArea(area).map((q) => q.instituicao))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

/** Anos com questões numa área, do mais recente para o mais antigo. */
export function anosDeArea(area: string): number[] {
  return [...new Set(questoesDeArea(area).map((q) => q.ano))].sort((a, b) => b - a);
}

function questoesFiltradas(area: string, filtro: FiltroBanco): QuestaoBanco[] {
  let qs = questoesDeArea(area);
  if (filtro.modo === "aula") qs = qs.filter((q) => q.assunto === filtro.assunto);
  else if (filtro.modo === "bloco") qs = qs.filter((q) => prefixoAssunto(q.assunto) === filtro.bloco);
  if (filtro.instituicao) qs = qs.filter((q) => q.instituicao === filtro.instituicao);
  if (filtro.ano) qs = qs.filter((q) => q.ano === filtro.ano);
  return qs;
}

/** Quantas questões o filtro atual tem disponíveis — usado para avisar o
 * usuário antes de pedir mais questões do que existem. */
export function contarDisponiveis(area: string, filtro: FiltroBanco): number {
  return questoesFiltradas(area, filtro).length;
}

/** Fisher-Yates — mesma lógica de lib/anthropic.ts (não exportada de lá). */
function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Mapa assunto → peso de sorteio (ver pesoPonderado em
 * lib/pontuacaoTopicos.ts), a partir da pontuação por assunto (ver
 * pontuarAssuntos). */
export function pesosPorAssunto(pontuados: AssuntoPontuado[]): Map<string, number> {
  return new Map(
    pontuados.map((p) => [p.assunto, pesoPonderado({ pontos: p.pontos, total: p.respondidas })]),
  );
}

/**
 * Amostragem ponderada sem reposição (algoritmo A-ES de Efraimidis-Spirakis):
 * cada item recebe uma chave aleatória elevada ao inverso do seu peso — quanto
 * maior o peso, mais essa chave tende a 1 — e os `quantidade` maiores vencem.
 * Equivalente a `embaralhar` quando todo peso é igual.
 */
function amostraPonderada<T>(itens: T[], peso: (item: T) => number, quantidade: number): T[] {
  return itens
    .map((item) => ({ item, chave: Math.random() ** (1 / Math.max(peso(item), 1e-6)) }))
    .sort((a, b) => b.chave - a.chave)
    .slice(0, quantidade)
    .map((c) => c.item);
}

/**
 * Sorteia até `quantidade` questões do filtro, sem repetição dentro da própria
 * rodada. O banco é fixo (não se repõe) — `vistas` (ids já respondidos em
 * qualquer bloco anterior, ver idsBancoRespondidos em lib/repo.ts) separa as
 * questões em inéditas e já vistas, e prioriza as inéditas; só entra questão
 * já vista se não houver inéditas suficientes para completar `quantidade`.
 *
 * `pesosAssunto`, quando informado (ver pesosPorAssunto), direciona a
 * amostragem para os assuntos mais fracos — usado quando o filtro cobre mais
 * de um assunto ("Todos os assuntos"/"Bloco de aulas" em GerarBancoView),
 * sem restringir a quantidade disponível a um único assunto.
 */
export function selecionarQuestoes(
  area: string,
  filtro: FiltroBanco,
  quantidade: number,
  vistas: ReadonlySet<string> = new Set(),
  pesosAssunto?: Map<string, number>,
): QuestaoBanco[] {
  const todas = questoesFiltradas(area, filtro);
  const sortear = (qs: QuestaoBanco[]) =>
    pesosAssunto ? amostraPonderada(qs, (q) => pesosAssunto.get(q.assunto) ?? 1, qs.length) : embaralhar(qs);
  const ineditas = sortear(todas.filter((q) => !vistas.has(q.id)));
  const jaVistas = sortear(todas.filter((q) => vistas.has(q.id)));
  return [...ineditas, ...jaVistas].slice(0, quantidade);
}

/** Quantas questões do filtro atual o usuário ainda não respondeu — usado
 * para avisar quando o "estoque" de inéditas está acabando. */
export function contarIneditas(area: string, filtro: FiltroBanco, vistas: ReadonlySet<string>): number {
  return questoesFiltradas(area, filtro).filter((q) => !vistas.has(q.id)).length;
}

/** Descrição do filtro para `Config.topico` — vai para `questoes_respondidas.topico`. */
export function descricaoFiltroBanco(area: string, filtro: FiltroBanco): string {
  const base =
    filtro.modo === "aula" ? filtro.assunto : filtro.modo === "bloco" ? `Bloco: ${filtro.bloco}` : area;
  const proveniencia = [filtro.instituicao, filtro.ano ? String(filtro.ano) : null]
    .filter(Boolean)
    .join(" ");
  return proveniencia ? `${base} (${proveniencia})` : base;
}

/**
 * Converte uma questão do banco (só enunciado/alternativas/gabarito) num
 * `Questao` do app. `comentario`/`explicacoes_erradas` ficam vazios aqui —
 * são preenchidos depois via `gerarExplicacoes` (lib/anthropic.ts), que só
 * justifica o gabarito já dado, sem alterar enunciado/alternativas/gabarito.
 */
export function questaoBancoParaQuestao(q: QuestaoBanco): Questao {
  const letras = Object.keys(q.alternativas).sort();
  // Certo/Errado na fonte é exatamente {C: "Certo", E: "Errado"} — vira o
  // formato "ce" do app (alternativas null; o card desenha CERTO/ERRADO).
  // Sem isto, uma questão CE apareceria como múltipla escolha de duas
  // alternativas, e o gabarito "C"/"E" seria lido como a letra C ou E de MC.
  const ehCE = letras.length === 2 && letras[0] === "C" && letras[1] === "E";
  const alternativas = ehCE ? null : letras.map((l) => `${l}) ${q.alternativas[l]}`);
  return {
    enunciado: q.enunciado,
    formato: ehCE ? "ce" : "mc",
    alternativas,
    gabarito: q.gabarito.trim().toUpperCase(),
    conceitos: [q.assunto],
    comentario: "",
    explicacoes_erradas: {},
    dispositivo: null,
    tipo_cobranca: undefined,
    bancoId: q.id,
  };
}
