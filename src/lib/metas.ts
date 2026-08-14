/**
 * Meta semanal de blocos (qualquer tipo — gerado, do banco, importado ou
 * simulado, ver Bloco em types.ts). Preferência guardada com o mesmo
 * mecanismo de tema.ts/lembretes.ts (@capacitor/preferences); a contagem em
 * si vem de blocosNaSemana em repo.ts.
 */
import { Preferences } from "@capacitor/preferences";

const K_ATIVA = "meta-semanal-ativa";
const K_BLOCOS = "meta-semanal-blocos";

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
