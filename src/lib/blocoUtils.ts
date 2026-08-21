/**
 * Funções puras do drill de geração, extraídas de GerarView (que passava de
 * 970 linhas misturando estado, efeitos, chamadas de API e layout). Tudo aqui
 * recebe os sub-blocos já carregados e devolve texto/listas — sem estado, sem
 * SQL, sem API — o que também as torna testáveis isoladamente
 * (blocoUtils.test.ts).
 */
import type { Questao } from "./types";

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
  totalQuestoes: number;
  qPorSub: number;
  /** A questão em `qIdx` já foi respondida/reportada nesta sessão? */
  respondidaAtual: boolean;
}): Questao[] {
  const { subs, qIdx, totalQuestoes, qPorSub, respondidaAtual } = args;
  const pendentes: Questao[] = [];
  const atual = subs[Math.floor(qIdx / qPorSub)]?.[qIdx % qPorSub];
  if (atual && !respondidaAtual) pendentes.push(atual);
  for (let idx = qIdx + 1; idx < totalQuestoes; idx++) {
    const q = subs[Math.floor(idx / qPorSub)]?.[idx % qPorSub];
    if (q) pendentes.push(q);
  }
  return pendentes;
}
