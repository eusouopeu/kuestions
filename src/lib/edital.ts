/**
 * Peso de cada matéria/área no edital do concurso alvo — um número de 0 a 5
 * (0 = "não cai", 5 = maior peso), configurado em Ajustes. Usado em dois
 * lugares: para ponderar a nota provável estimada (ver estimarNotaProvavel em
 * lib/repo.ts) e para distribuir as questões do simulado cronometrado
 * proporcionalmente ao peso em vez de por disponibilidade (ver SimuladoView).
 *
 * Guardado como um mapa livre nome→peso (mesmo mecanismo de Preferences de
 * metas.ts/lembretes.ts) em vez de amarrado a MATERIAS ou AREAS_BANCO: os
 * dois conjuntos têm rótulos que não batem 1:1 (ver comentário em
 * lib/banco.ts), então um mapa por string cobre os dois sem precisar de
 * mapeamento manual entre eles. Uma matéria sem entrada no mapa conta peso
 * PESO_PADRAO (equivalente a "todas pesam igual", o comportamento anterior a
 * esta configuração existir).
 */
import { Preferences } from "@capacitor/preferences";

const K_PESOS = "edital-pesos";

export type PesosEdital = Record<string, number>;

export const PESO_PADRAO = 1;
export const PESO_MAX = 5;

export async function getPesosEdital(): Promise<PesosEdital> {
  try {
    const r = await Preferences.get({ key: K_PESOS });
    if (!r.value) return {};
    const obj = JSON.parse(r.value) as unknown;
    return obj && typeof obj === "object" ? (obj as PesosEdital) : {};
  } catch {
    return {};
  }
}

export async function setPesosEdital(pesos: PesosEdital): Promise<void> {
  await Preferences.set({ key: K_PESOS, value: JSON.stringify(pesos) });
}

/** Peso de uma matéria, com o padrão aplicado quando não configurada. */
export function pesoDe(pesos: PesosEdital, materia: string): number {
  const v = pesos[materia];
  return v == null ? PESO_PADRAO : v;
}

/**
 * Presets de peso por matéria de concursos reais de Auditor Fiscal (SEFAZ
 * estaduais), para distribuir o Simulado cronometrado sem exigir que o
 * usuário monte os pesos na mão em Ajustes → Peso do edital (esses continuam
 * disponíveis via o toggle "Peso personalizado" em SimuladoView). Valores
 * aproximados a partir do padrão de editais anteriores dessas bancas — não
 * são uma fonte oficial, e o usuário pode sempre sobrepor com "Peso
 * personalizado". "Padrão" (mapa vazio) faz `pesoDe` devolver PESO_PADRAO
 * para toda matéria, ou seja, todas pesam igual.
 */
export interface PresetPesoEdital {
  id: string;
  label: string;
  pesos: PesosEdital;
}

export const PRESETS_PESO_EDITAL: PresetPesoEdital[] = [
  { id: "padrao", label: "Padrão — todas as matérias com o mesmo peso", pesos: {} },
  {
    id: "sefaz-sp",
    label: "SEFAZ-SP",
    pesos: {
      "Direito Tributário": 5,
      "Contabilidade Geral": 3,
      "Contabilidade Pública": 3,
      "Direito Administrativo": 3,
      "Direito Constitucional": 2,
      Auditoria: 4,
      Economia: 2,
      "Finanças Públicas": 3,
      Estatística: 1,
      "Matemática Financeira": 2,
      "Noções de Informática": 1,
    },
  },
  {
    id: "sefaz-rj",
    label: "SEFAZ-RJ",
    pesos: {
      "Direito Tributário": 5,
      "Contabilidade Geral": 4,
      "Contabilidade Pública": 3,
      "Direito Administrativo": 2,
      "Direito Constitucional": 3,
      Auditoria: 3,
      Economia: 2,
      "Finanças Públicas": 3,
      Estatística: 2,
      "Matemática Financeira": 1,
      "Noções de Informática": 1,
    },
  },
  {
    id: "sefaz-sc",
    label: "SEFAZ-SC",
    pesos: {
      "Direito Tributário": 5,
      "Contabilidade Geral": 4,
      "Contabilidade Pública": 4,
      "Direito Administrativo": 3,
      "Direito Constitucional": 2,
      Auditoria: 3,
      Economia: 1,
      "Finanças Públicas": 2,
      Estatística: 1,
      "Matemática Financeira": 1,
      "Noções de Informática": 2,
    },
  },
  {
    id: "sefaz-ba",
    label: "SEFAZ-BA",
    pesos: {
      "Direito Tributário": 5,
      "Contabilidade Geral": 3,
      "Contabilidade Pública": 3,
      "Direito Administrativo": 3,
      "Direito Constitucional": 3,
      Auditoria: 4,
      Economia: 2,
      "Finanças Públicas": 3,
      Estatística: 1,
      "Matemática Financeira": 1,
      "Noções de Informática": 1,
    },
  },
  {
    id: "sefaz-pe",
    label: "SEFAZ-PE",
    pesos: {
      "Direito Tributário": 5,
      "Contabilidade Geral": 4,
      "Contabilidade Pública": 3,
      "Direito Administrativo": 2,
      "Direito Constitucional": 2,
      Auditoria: 3,
      Economia: 2,
      "Finanças Públicas": 2,
      Estatística: 1,
      "Matemática Financeira": 1,
      "Noções de Informática": 2,
    },
  },
];
