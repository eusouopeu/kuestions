/**
 * Rascunho do bloco "Do banco" em andamento (GerarBancoView), gravado a cada
 * avanço — lote de explicações recebido, resposta gravada — para sobreviver
 * ao app ser fechado ou morto pelo Android no meio do drill (fila do
 * mercado, academia). Um só rascunho: começar outro bloco do banco o
 * substitui. Mesmo mecanismo de lib/blocoRascunho.ts (GerarView), em chave
 * própria porque o formato é outro (lista plana de questões, área e tópico
 * por questão, sem sub-blocos).
 */
import { Preferences } from "@capacitor/preferences";
import type { Questao } from "./types";

const K = "bloco-banco-rascunho";

export interface RascunhoBlocoBanco {
  /** Questões do bloco, já com as explicações dos lotes carregados. */
  questoes: Questao[];
  /** Área real e tópico gravado de cada questão (mesma ordem de `questoes`). */
  areas: string[];
  topicos: string[];
  /** Lote de explicações já resolvido (ver LOTE em GerarBancoView). */
  lotesProntos: boolean[];
  /** Matéria da linha de `blocos` (área ou MATERIA_MISTA), para o aviso de retomar. */
  materia: string;
  qIdx: number;
  acertos: number;
  respondidas: number;
  tempoTotalMs: number;
  blocoId: number | null;
  enxuta: boolean;
  ts: string;
}

export async function getRascunhoBanco(): Promise<RascunhoBlocoBanco | null> {
  try {
    const { value } = await Preferences.get({ key: K });
    return value ? (JSON.parse(value) as RascunhoBlocoBanco) : null;
  } catch {
    return null;
  }
}

export async function salvarRascunhoBanco(r: Omit<RascunhoBlocoBanco, "ts">): Promise<void> {
  try {
    await Preferences.set({ key: K, value: JSON.stringify({ ...r, ts: new Date().toISOString() }) });
  } catch {
    // Best-effort: falha ao persistir não pode travar o drill.
  }
}

export async function limparRascunhoBanco(): Promise<void> {
  try {
    await Preferences.remove({ key: K });
  } catch {
    // idem
  }
}
