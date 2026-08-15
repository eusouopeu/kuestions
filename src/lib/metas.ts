/**
 * Meta semanal de blocos (qualquer tipo — gerado, do banco, importado ou
 * simulado, ver Bloco em types.ts). Preferência guardada com o mesmo
 * mecanismo de tema.ts/lembretes.ts (@capacitor/preferences); a contagem em
 * si vem de blocosNaSemana em repo.ts.
 */
import { Preferences } from "@capacitor/preferences";

const K_ATIVA = "meta-semanal-ativa";
const K_BLOCOS = "meta-semanal-blocos";
const K_POR_MATERIA = "meta-semanal-por-materia";

/** Meta razoável para quem está começando: um pouco menos de 1 bloco por dia útil. */
export const META_PADRAO_BLOCOS = 3;

export interface ConfigMeta {
  ativa: boolean;
  blocosPorSemana: number;
}

export async function getConfigMeta(): Promise<ConfigMeta> {
  try {
    const [a, b] = await Promise.all([
      Preferences.get({ key: K_ATIVA }),
      Preferences.get({ key: K_BLOCOS }),
    ]);
    return {
      ativa: a.value === "1",
      blocosPorSemana: b.value ? Number(b.value) : META_PADRAO_BLOCOS,
    };
  } catch {
    return { ativa: false, blocosPorSemana: META_PADRAO_BLOCOS };
  }
}

export async function setConfigMeta(cfg: ConfigMeta): Promise<void> {
  await Promise.all([
    Preferences.set({ key: K_ATIVA, value: cfg.ativa ? "1" : "0" }),
    Preferences.set({ key: K_BLOCOS, value: String(cfg.blocosPorSemana) }),
  ]);
}

/**
 * Metas semanais por matéria — independentes da meta geral acima: um mapa
 * matéria → blocos/semana. A presença da matéria no mapa já significa "meta
 * ativa para ela" (sem um `ativa` por entrada); removê-la do mapa desativa.
 * Serve para quem quer garantir um mínimo de prática numa matéria fraca, em
 * vez de só um total de blocos que pode se concentrar todo numa matéria forte.
 */
export async function getMetasPorMateria(): Promise<Record<string, number>> {
  try {
    const r = await Preferences.get({ key: K_POR_MATERIA });
    if (!r.value) return {};
    const obj = JSON.parse(r.value) as unknown;
    return obj && typeof obj === "object" ? (obj as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export async function setMetasPorMateria(metas: Record<string, number>): Promise<void> {
  await Preferences.set({ key: K_POR_MATERIA, value: JSON.stringify(metas) });
}
