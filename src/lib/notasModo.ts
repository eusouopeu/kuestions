/**
 * Modo de visão selecionado na aba Notas (Conceitos/Caderno/Mapas/Tarefas —
 * ver Segmented no topo de NotasTab.tsx), persistido no mesmo mecanismo de
 * tema.ts/preferenciasGeracao.ts para sobreviver a reabrir o app.
 */
import { Preferences } from "@capacitor/preferences";

export type ModoNotas = "conceitos" | "caderno" | "mapas" | "tarefas";

const K_MODO = "notas-modo-visao";
const VALIDOS: ModoNotas[] = ["conceitos", "caderno", "mapas", "tarefas"];

export async function getModoNotas(): Promise<ModoNotas> {
  const { value } = await Preferences.get({ key: K_MODO });
  return VALIDOS.includes(value as ModoNotas) ? (value as ModoNotas) : "conceitos";
}

export async function setModoNotas(m: ModoNotas): Promise<void> {
  await Preferences.set({ key: K_MODO, value: m });
}
