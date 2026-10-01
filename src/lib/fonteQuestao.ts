/**
 * Tamanho da letra do enunciado/alternativas das questões, ajustado pelos
 * botões-ícone A−/A+ da barra de ações do QuestaoCard. Independente da
 * escala geral do app (Ajustes): mexe só no texto da questão. Vale para todos
 * os cards abertos ao mesmo tempo (store com assinantes) e persiste no
 * aparelho (@capacitor/preferences).
 */
import { useSyncExternalStore } from "react";
import { Preferences } from "@capacitor/preferences";

const CHAVE = "fonte-questao";
export const FONTE_PADRAO = 14.5;
export const FONTE_MIN = 11.5;
export const FONTE_MAX = 22.5;
const PASSO = 1;

let atual = FONTE_PADRAO;
const assinantes = new Set<() => void>();
let carregada = false;

function avisar() {
  assinantes.forEach((f) => f());
}

async function carregar() {
  if (carregada) return;
  carregada = true;
  try {
    const { value } = await Preferences.get({ key: CHAVE });
    const n = value == null ? NaN : Number(value);
    if (Number.isFinite(n)) {
      atual = Math.min(FONTE_MAX, Math.max(FONTE_MIN, n));
      avisar();
    }
  } catch (e) {
    console.error("carregar tamanho da fonte da questão", e);
  }
}

export function mudarFonteQuestao(delta: -1 | 1): void {
  const novo = Math.min(FONTE_MAX, Math.max(FONTE_MIN, atual + delta * PASSO));
  if (novo === atual) return;
  atual = novo;
  avisar();
  Preferences.set({ key: CHAVE, value: String(novo) }).catch((e) =>
    console.error("salvar tamanho da fonte da questão", e),
  );
}

/** Tamanho atual do enunciado, em px (alternativas usam o mesmo valor). */
export function useFonteQuestao(): number {
  return useSyncExternalStore(
    (f) => {
      assinantes.add(f);
      void carregar();
      return () => assinantes.delete(f);
    },
    () => atual,
  );
}
