/**
 * Data da prova e meta de questões até ela (Ajustes → Prova). Alimenta o
 * cartão "Até a prova" da aba Dados (ver projetarAteProva em lib/ritmo.ts).
 * Mesmo mecanismo de Preferences de metas.ts/edital.ts.
 */
import { Preferences } from "@capacitor/preferences";

const K_PROVA = "prova-alvo";

export interface ProvaAlvo {
  /** "AAAA-MM-DD"; null = não definida. */
  data: string | null;
  /** Total de questões que se quer ter feito até a prova; null = usar as
   * inéditas do banco como alvo. */
  metaQuestoes: number | null;
  /** Tempo disponível por questão na prova, em minutos; null = padrão
   * (`MINUTOS_POR_QUESTAO_PADRAO`). Comparado ao tempo médio de resposta
   * (aba Dados, resultado do bloco do banco). */
  minutosPorQuestao: number | null;
}

/** ~3 min por questão: duração típica das provas de auditor fiscal estadual
 * dividida pelo número de questões. Ajustável em Ajustes → Prova. */
export const MINUTOS_POR_QUESTAO_PADRAO = 3;

export function msPorQuestaoNaProva(p: Pick<ProvaAlvo, "minutosPorQuestao">): number {
  return (p.minutosPorQuestao ?? MINUTOS_POR_QUESTAO_PADRAO) * 60_000;
}

const VAZIA: ProvaAlvo = { data: null, metaQuestoes: null, minutosPorQuestao: null };

export async function getProvaAlvo(): Promise<ProvaAlvo> {
  try {
    const r = await Preferences.get({ key: K_PROVA });
    if (!r.value) return VAZIA;
    const o = JSON.parse(r.value) as Partial<ProvaAlvo>;
    const data = typeof o.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.data) ? o.data : null;
    const meta = Number(o.metaQuestoes);
    const minutos = Number(o.minutosPorQuestao);
    return {
      data,
      metaQuestoes: Number.isFinite(meta) && meta > 0 ? Math.round(meta) : null,
      minutosPorQuestao: Number.isFinite(minutos) && minutos > 0 ? minutos : null,
    };
  } catch {
    return VAZIA;
  }
}

export async function setProvaAlvo(p: ProvaAlvo): Promise<void> {
  await Preferences.set({ key: K_PROVA, value: JSON.stringify(p) });
}
