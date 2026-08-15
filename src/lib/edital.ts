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
