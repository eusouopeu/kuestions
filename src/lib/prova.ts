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
}

const VAZIA: ProvaAlvo = { data: null, metaQuestoes: null };

export async function getProvaAlvo(): Promise<ProvaAlvo> {
  try {
    const r = await Preferences.get({ key: K_PROVA });
    if (!r.value) return VAZIA;
    const o = JSON.parse(r.value) as Partial<ProvaAlvo>;
    const data = typeof o.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.data) ? o.data : null;
    const meta = Number(o.metaQuestoes);
    return { data, metaQuestoes: Number.isFinite(meta) && meta > 0 ? Math.round(meta) : null };
  } catch {
    return VAZIA;
  }
}

export async function setProvaAlvo(p: ProvaAlvo): Promise<void> {
  await Preferences.set({ key: K_PROVA, value: JSON.stringify(p) });
}
