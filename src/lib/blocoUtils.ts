/**
 * Funções puras do drill de geração, extraídas de GerarView (que passava de
 * 970 linhas misturando estado, efeitos, chamadas de API e layout). Tudo aqui
 * recebe os sub-blocos já carregados e devolve texto/listas — sem estado, sem
 * SQL, sem API — o que também as torna testáveis isoladamente
 * (blocoUtils.test.ts).
 */
import type { Questao } from "./types";

/**
 * Divide `quantidade` questões em sub-blocos de no máximo `qPorSub` — uma
 * chamada à API por sub-bloco (ver dispararSub em GerarView). Antes a
 * quantidade só podia variar de `qPorSub` em `qPorSub` justamente porque o
 * tamanho era fixo; aqui o resto é distribuído entre os primeiros
 * sub-blocos, para nunca sobrar um sub-bloco de 1 questão quando dá para
 * equilibrar (13 → [3,3,3,2,2], não [3,3,3,3,1]).
 */
export function tamanhosSubs(quantidade: number, qPorSub: number): number[] {
  const total = Math.max(1, Math.floor(quantidade));
  const nSubs = Math.max(1, Math.ceil(total / qPorSub));
  const base = Math.floor(total / nSubs);
  const resto = total % nSubs;
  return Array.from({ length: nSubs }, (_, i) => base + (i < resto ? 1 : 0));
}

/**
 * Posição global (0..total-1) → sub-bloco e índice dentro dele. Substitui a
 * aritmética `Math.floor(idx / qPorSub)`, que só funcionava com sub-blocos
 * todos do mesmo tamanho. Devolve null para índice fora do bloco.
 */
export function localizarQuestao(
  tamanhos: number[],
  idx: number,
): { sub: number; pos: number } | null {
  if (idx < 0) return null;
  let resta = idx;
  for (let sub = 0; sub < tamanhos.length; sub++) {
    if (resta < tamanhos[sub]) return { sub, pos: resta };
    resta -= tamanhos[sub];
  }
  return null;
}

/** Máximo de conceitos citados por lote na instrução anti-repetição — o
 * prompt precisa lembrar o modelo do que já foi usado, não listar tudo. */
const MAX_CONCEITOS_POR_LOTE = 4;

/**
 * Conceitos já usados nos lotes anteriores, um resumo por lote, para o prompt
 * pedir padrões diferentes (ver montarPrompt em anthropic.ts).
 */
export function padroesDe(subs: (Questao[] | null)[], ate: number): string[] {
  const p: string[] = [];
  for (let i = 0; i < ate; i++) {
    const s = subs[i];
    if (s) {
      const cs = [...new Set(s.flatMap((q) => q.conceitos))].slice(0, MAX_CONCEITOS_POR_LOTE);
      if (cs.length) p.push(`Lote ${i + 1}: ${cs.join(", ")}`);
    }
  }
  return p;
}

/**
 * Gabaritos de Certo/Errado já gerados nos sub-blocos anteriores deste bloco
 * — repassado ao prompt para corrigir o viés do modelo em favor de "Certo"
 * (ver instrucaoEquilibrioGabarito em anthropic.ts).
 */
export function gabaritosCEDe(subs: (Questao[] | null)[], ate: number): string[] {
  const g: string[] = [];
  for (let i = 0; i < ate; i++) {
    const s = subs[i];
    if (s) for (const q of s) if (q.formato === "ce") g.push(q.gabarito);
  }
  return g;
}

/**
 * Questões já geradas mas que nunca chegaram a ser respondidas: a atual (se
 * ainda não foi registrada) e todas as dos lotes já carregados à frente. O
 * abandono grava essas como erradas em vez de descartá-las, para caírem em
 * "Refazer erradas" na próxima visita — questão gerada é questão paga.
 */
export function questoesNaoRespondidas(args: {
  subs: (Questao[] | null)[];
  qIdx: number;
  /** Tamanho de cada sub-bloco (ver tamanhosSubs) — a soma é o total do bloco. */
  tamanhos: number[];
  /** A questão em `qIdx` já foi respondida/reportada nesta sessão? */
  respondidaAtual: boolean;
}): Questao[] {
  const { subs, qIdx, tamanhos, respondidaAtual } = args;
  const totalQuestoes = tamanhos.reduce((a, b) => a + b, 0);
  const em = (idx: number) => {
    const loc = localizarQuestao(tamanhos, idx);
    return loc ? subs[loc.sub]?.[loc.pos] : undefined;
  };
  const pendentes: Questao[] = [];
  const atual = em(qIdx);
  if (atual && !respondidaAtual) pendentes.push(atual);
  for (let idx = qIdx + 1; idx < totalQuestoes; idx++) {
    const q = em(idx);
    if (q) pendentes.push(q);
  }
  return pendentes;
}
