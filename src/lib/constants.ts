/**
 * Constantes de domínio. MATERIAS, TIPOS, FORMATOS, NIVEIS e SUB_LETRAS vêm
 * de Questoes-Kumon.jsx sem alteração. A configuração de bloco seleciona um
 * SUBCONJUNTO de TIPOS (`Config.tipos`, ver types.ts): 1 tipo = fixo; 2+ =
 * sorteado por questão entre os selecionados, dentro do mesmo sub-bloco.
 */

export const MATERIAS = [
  "Direito Tributário",
  "Direito Constitucional",
  "Contabilidade Geral",
  "Contabilidade Avançada",
  "Contabilidade Pública",
  "Legislação Tributária Estadual (BA)",
  "Direito Administrativo",
  "Auditoria",
  "AFO",
  "Matemática Financeira",
  "Economia",
  "Estatística",
  "Português",
  "Informática",
] as const;

/**
 * MATERIAS em ordem alfabética, para os dropdowns — a ordem de declaração
 * acima é a herdada do artefato (por importância no edital) e continua
 * valendo para o padrão (`MATERIAS[0]`), mas numa lista de 14 itens procurar
 * uma matéria específica é mais rápido em ordem alfabética. É a mesma ordem
 * já usada em AREAS_BANCO (ver lib/banco.ts).
 */
export const MATERIAS_ORDENADAS: string[] = [...MATERIAS].sort((a, b) =>
  a.localeCompare(b, "pt-BR"),
);

export type TipoId = "abstrato" | "caso" | "calculo" | "conceito";

export const TIPOS: { id: TipoId; label: string; desc: string }[] = [
  {
    id: "abstrato",
    label: "Literalidade em abstrato",
    desc: "cobrança direta do texto de leis, normas e regras, em abstrato",
  },
  {
    id: "caso",
    label: "Norma em caso concreto",
    desc: "aplicação de leis/normas/regras a casos concretos (subsunção)",
  },
  {
    id: "calculo",
    label: "Cálculo concreto",
    desc: "resolução numérica de caso concreto (apuração, lançamentos, juros, valores)",
  },
  {
    id: "conceito",
    label: "Conceitos e classificações",
    desc: "distinção entre conceitos, espécies e classificações da matéria",
  },
];

export const TIPO_IDS: TipoId[] = TIPOS.map((t) => t.id);

export type FormatoId = "ce" | "mc" | "misto";

export const FORMATOS: { id: FormatoId; label: string }[] = [
  { id: "ce", label: "Certo / Errado" },
  { id: "mc", label: "Múltipla escolha" },
  { id: "misto", label: "Misto" },
];

/**
 * Progressão renumerada: o antigo nível 3 (Intermediário) virou o novo nível
 * 2; o antigo nível 5 (Banca pesada) virou o novo nível 3. Isso abre espaço
 * para dois patamares mais difíceis que qualquer coisa gerada antes (4 e 5),
 * nos quais o conteúdo cobrado já não muda — só a distância entre o gabarito
 * e os distratores encolhe, até sobrar apenas um detalhe pontual (prazo,
 * data, nome, número) separando certo de errado.
 */
export const NIVEIS = [
  "Introdutório",
  "Básico",
  "Intermediário",
  "Avançado",
  "Banca pesada",
] as const;

/** Descrição longa de cada nível, usada no prompt de geração (ver
 * montarPrompt em lib/anthropic.ts) — orienta não só o assunto mas o tipo de
 * erro que separa o gabarito dos distratores em cada patamar. */
export const NIVEL_DESCRICOES: string[] = [
  "conceitos centrais da matéria; alternativas erradas divergem do gabarito por erro de conceito, claramente identificável por quem estudou o básico do tópico.",
  "mesmo core da matéria, com mais detalhe de regra; alternativas erradas ainda divergem por erro de conceito ou de regra, não por detalhe factual isolado.",
  "domínio do tópico inteiro, incluindo exceções e regras correlatas; alternativas erradas exigem reconhecer a exceção certa, não só a regra geral.",
  "alternativas erradas repetem quase todo o texto do gabarito, divergindo por UM detalhe factual específico (um prazo, um valor, um sujeito, uma competência) — o resto da frase é idêntico ou equivalente ao correto.",
  "nível de banca pesada: alternativas quase idênticas ao gabarito, erradas só por um detalhe minúsculo (uma data, um nome, um número, uma palavra que inverte o sentido) — a pegadinha clássica de prova difícil.",
];

export const SUB_LETRAS = ["A", "B", "C", "D"] as const;

/** 4 sub-blocos × 3 questões = 12 por bloco. */
export const Q_POR_SUB = 3;
export const N_SUBS = 4;
export const Q_POR_BLOCO = Q_POR_SUB * N_SUBS; // 12

/** Aprovação em ≥ 80% de acerto (ver minAprovacaoAtual em GerarView.tsx e o
 * mesmo limiar em GerarBancoView/ImportarView). */
export const LIMIAR_APROVACAO = 0.8;

export function labelTipo(id: string): string {
  return TIPOS.find((t) => t.id === id)?.label ?? id;
}

export function labelFormato(id: string): string {
  return FORMATOS.find((f) => f.id === id)?.label ?? id;
}
