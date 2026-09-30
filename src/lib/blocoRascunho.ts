/**
 * Rascunho do bloco em andamento em GerarView (geração via IA), persistido a
 * cada avanço — sub-bloco recebido, resposta gravada — para sobreviver ao
 * app sendo fechado/morto no meio do drill. Sem isto, o único jeito de não
 * perder o que já foi PAGO na API era "abandonar" explicitamente (que já
 * salva as questões não respondidas como erradas, ver abandonarBloco em
 * GerarView) — mas um fechamento sem esse gesto explícito (troca de app,
 * sistema matando o processo em segundo plano) perdia tudo em memória.
 *
 * Guardado via @capacitor/preferences (mesmo mecanismo de tema.ts/metas.ts),
 * um rascunho POR BLOCO (chave = `blocoId`): começar outro bloco não apaga o
 * que ficou pela metade, que segue retomável a partir de "Últimos blocos".
 */
import { Preferences } from "@capacitor/preferences";
import type { Config, Questao, StatusSub } from "./types";

const K_RASCUNHO_LEGADO = "bloco-rascunho";
const K_RASCUNHOS = "bloco-rascunhos";
/** Teto de rascunhos guardados — os mais antigos caem primeiro. */
const MAX_RASCUNHOS = 10;

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
  /** Quantas questões foram de fato respondidas (questão pulada não conta,
   * ver pularQuestao em GerarView) — ausente em rascunhos anteriores a
   * "pular questão", onde `qIdx` equivalia a isso. */
  respondidas?: number;
  blocoId: number | null;
  comExplicacoes: boolean;
  ts: string;
}

async function lerTodos(): Promise<RascunhoBloco[]> {
  try {
    const { value } = await Preferences.get({ key: K_RASCUNHOS });
    const lista: RascunhoBloco[] = value ? JSON.parse(value) : [];
    // Formato antigo (um único rascunho): migra na primeira leitura.
    const { value: legado } = await Preferences.get({ key: K_RASCUNHO_LEGADO });
    if (legado) {
      const antigo = JSON.parse(legado) as RascunhoBloco;
      if (!lista.some((r) => r.blocoId === antigo.blocoId)) lista.push(antigo);
      await gravarTodos(lista);
      await Preferences.remove({ key: K_RASCUNHO_LEGADO });
    }
    return lista;
  } catch {
    return [];
  }
}

async function gravarTodos(lista: RascunhoBloco[]): Promise<void> {
  const recentes = [...lista].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, MAX_RASCUNHOS);
  await Preferences.set({ key: K_RASCUNHOS, value: JSON.stringify(recentes) });
}

export async function salvarRascunho(r: Omit<RascunhoBloco, "ts">): Promise<void> {
  try {
    const outros = (await lerTodos()).filter((x) => x.blocoId !== r.blocoId);
    await gravarTodos([...outros, { ...r, ts: new Date().toISOString() }]);
  } catch {
    // Best-effort: falha ao persistir o rascunho não pode travar o drill.
  }
}

/** Rascunho mais recente — o do bloco que estava aberto quando o app fechou. */
export async function getRascunho(): Promise<RascunhoBloco | null> {
  const todos = await lerTodos();
  return todos.sort((a, b) => b.ts.localeCompare(a.ts))[0] ?? null;
}

/** Todos os rascunhos guardados, por `blocoId` — base do "retomar" em Últimos blocos. */
export async function getRascunhosPorBloco(): Promise<Map<number, RascunhoBloco>> {
  const mapa = new Map<number, RascunhoBloco>();
  for (const r of await lerTodos()) if (r.blocoId != null) mapa.set(r.blocoId, r);
  return mapa;
}

/** Remove o rascunho do bloco `blocoId` (bloco fechado, encerrado ou descartado). */
export async function limparRascunho(blocoId: number | null): Promise<void> {
  try {
    const restantes = (await lerTodos()).filter((r) => r.blocoId !== blocoId);
    await gravarTodos(restantes);
  } catch {
    // idem salvarRascunho
  }
}
