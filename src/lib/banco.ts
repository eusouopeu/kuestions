/**
 * Banco de questões reais de concurso (kuestion_db_1.json, 332 questões
 * SEFAZ-SE/2025 e outras), usado pela 4ª forma de montar blocos na aba
 * Questões: em vez de gerar questões inéditas via API, sorteia questões
 * reais já formuladas por banca. Só enunciado, alternativas e gabarito vêm
 * do banco — comentário e explicações por alternativa são gerados à parte
 * (ver gerarExplicacoes em lib/anthropic.ts), porque a fonte não os traz.
 */
import banco from "../data/banco_questoes.json";
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

// A fonte tem pelo menos um registro corrompido (gabarito null, ver
// SEFAZ-PA-2021-Q085) — descartado aqui, na única leitura do arquivo, em vez
// de em cada função que consome BANCO. Sem isso, `questaoBancoParaQuestao`
// quebra ao chamar `.trim()` num gabarito nulo assim que esse registro é
// sorteado (mais provável em filtros amplos, como "todos os assuntos" de uma
// área inteira — caso do Simulado).
const BANCO = (banco as QuestaoBanco[]).filter(
  (q) => typeof q.gabarito === "string" && q.gabarito.trim() !== "",
);

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

/**
 * Sorteia até `quantidade` questões do filtro, sem repetição dentro da própria
 * rodada. O banco é fixo (não se repõe) — `vistas` (ids já respondidos em
 * qualquer bloco anterior, ver idsBancoRespondidos em lib/repo.ts) separa as
 * questões em inéditas e já vistas, e prioriza as inéditas; só entra questão
 * já vista se não houver inéditas suficientes para completar `quantidade`.
 */
export function selecionarQuestoes(
  area: string,
  filtro: FiltroBanco,
  quantidade: number,
  vistas: ReadonlySet<string> = new Set(),
): QuestaoBanco[] {
  const todas = questoesFiltradas(area, filtro);
  const ineditas = embaralhar(todas.filter((q) => !vistas.has(q.id)));
  const jaVistas = embaralhar(todas.filter((q) => vistas.has(q.id)));
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
  const alternativas = letras.map((l) => `${l}) ${q.alternativas[l]}`);
  return {
    enunciado: q.enunciado,
    formato: "mc",
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
