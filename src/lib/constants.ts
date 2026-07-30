/**
 * Constantes de domínio. MATERIAS, TIPOS, FORMATOS, NIVEIS e SUB_LETRAS vêm
 * de Questoes-Kumon.jsx sem alteração, exceto o novo tipo `misturado`.
 */

export const MATERIAS = [
  "Direito Tributário",
  "Direito Constitucional",
  "Contabilidade Geral",
  "Contabilidade Avançada",
  "Legislação Tributária Estadual (BA)",
  "Direito Administrativo",
  "Auditoria",
  "Administração Financeira e Orçamentária",
  "Matemática Financeira",
] as const;

export type TipoId =
  | "abstrato"
  | "caso"
  | "dispositivo"
  | "calculo"
  | "conceito"
  | "misturado";

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
    id: "dispositivo",
    label: "Dispositivo cabível",
    desc: "identificação do dispositivo ou instituto jurídico cabível na situação exposta",
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
  {
    id: "misturado",
    label: "Misturado",
    desc: "sorteia entre os tipos acima a cada questão, dentro do mesmo sub-bloco",
  },
];

/** Os tipos que `misturado` pode sortear (ele mesmo fica de fora). */
export const TIPOS_SORTEAVEIS: TipoId[] = [
  "abstrato",
  "caso",
  "dispositivo",
  "calculo",
  "conceito",
];

export type FormatoId = "ce" | "mc" | "misto";

export const FORMATOS: { id: FormatoId; label: string }[] = [
  { id: "ce", label: "Certo / Errado" },
  { id: "mc", label: "Múltipla escolha" },
  { id: "misto", label: "Misto" },
];

export const NIVEIS = [
  "Introdutório",
  "Básico",
  "Intermediário",
  "Avançado",
  "Banca pesada",
] as const;

export const SUB_LETRAS = ["A", "B", "C", "D"] as const;

/** 4 sub-blocos × 3 questões = 12 por bloco. */
export const Q_POR_SUB = 3;
export const N_SUBS = 4;
export const Q_POR_BLOCO = Q_POR_SUB * N_SUBS; // 12

/**
 * Aprovação em ≥ 90% de acerto. Com 12 questões, 90% = 10,8 → exige 11.
 * Mantém o critério do artefato (18/20 = 90%) na nova contagem.
 */
export const MIN_APROVACAO = Math.ceil(Q_POR_BLOCO * 0.9); // 11

export function labelTipo(id: string): string {
  return TIPOS.find((t) => t.id === id)?.label ?? id;
}

export function labelFormato(id: string): string {
  return FORMATOS.find((f) => f.id === id)?.label ?? id;
}
