/**
 * Rascunho do bloco em andamento em GerarView (geração via IA), persistido a
 * cada avanço — sub-bloco recebido, resposta gravada — para sobreviver ao
 * app sendo fechado/morto no meio do drill. Sem isto, o único jeito de não
 * perder o que já foi PAGO na API era "abandonar" explicitamente (que já
 * salva as questões não respondidas como erradas, ver abandonarBloco em
 * GerarView) — mas um fechamento sem esse gesto explícito (troca de app,
 * sistema matando o processo em segundo plano) perdia tudo em memória.
 *
 * Guardado via @capacitor/preferences (mesmo mecanismo de tema.ts/metas.ts) —
 * um único rascunho por vez, porque só existe um drill ativo por vez.
 */
import { Preferences } from "@capacitor/preferences";
import type { Config, Questao, StatusSub } from "./types";

const K_RASCUNHO = "bloco-rascunho";

export interface RascunhoBloco {
  cfg: Config & { materia: string };
  subs: (Questao[] | null)[];
  /** Tamanho de cada sub-bloco (ver tamanhosSubs em lib/blocoUtils.ts) —
   * persistido junto porque desde que a quantidade do bloco varia de 1 em 1
   * ele não é mais dedutível de `subs.length * Q_POR_SUB`. Ausente nos
   * rascunhos gravados antes disso; GerarView cai no tamanho fixo nesse caso. */
  tamanhos?: number[];
  statusSub: StatusSub[];
  qIdx: number;
  acertos: number[];
  blocoId: number | null;
  comExplicacoes: boolean;
  ts: string;
}

export async function salvarRascunho(r: Omit<RascunhoBloco, "ts">): Promise<void> {
  try {
    await Preferences.set({
      key: K_RASCUNHO,
      value: JSON.stringify({ ...r, ts: new Date().toISOString() }),
    });
  } catch {
    // Best-effort: falha ao persistir o rascunho não pode travar o drill.
  }
}

export async function getRascunho(): Promise<RascunhoBloco | null> {
  try {
    const { value } = await Preferences.get({ key: K_RASCUNHO });
    if (!value) return null;
    return JSON.parse(value) as RascunhoBloco;
  } catch {
    return null;
  }
}

export async function limparRascunho(): Promise<void> {
  try {
    await Preferences.remove({ key: K_RASCUNHO });
  } catch {
    // idem salvarRascunho
  }
}
