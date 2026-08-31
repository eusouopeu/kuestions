/**
 * Metas semanais de blocos — um único mapa `matéria → blocos por semana`, em
 * que a chave especial `META_GERAL` é a meta de blocos de QUALQUER matéria.
 *
 * Antes eram dois mecanismos independentes: uma "meta semanal" geral (com
 * flag `ativa` e um número) e um mapa de metas por matéria. Mas meta geral é
 * meta por matéria com a matéria em branco — dois estados, duas seções em
 * Ajustes e duas leituras em QuestoesTab para a mesma pergunta ("quantos blocos
 * por semana?"). Aqui a presença da chave no mapa já significa "meta ativa";
 * remover a chave desativa, exatamente como o mapa por matéria sempre fez.
 *
 * Qualquer bloco conta — gerado, do banco, importado ou simulado (ver Bloco em
 * types.ts); a contagem vem de blocosNaSemana em repo.ts.
 */
import { Preferences } from "@capacitor/preferences";

const K_METAS = "metas-semanais";

// Chaves do formato antigo, lidas uma única vez na migração abaixo.
const K_ANTIGA_ATIVA = "meta-semanal-ativa";
const K_ANTIGA_BLOCOS = "meta-semanal-blocos";
const K_ANTIGA_POR_MATERIA = "meta-semanal-por-materia";

/** Chave da meta que vale para o total de blocos, de qualquer matéria. Não
 * colide com nome de matéria por causa do prefixo `__`. */
export const META_GERAL = "__todas";

/** Meta razoável para quem está começando: um pouco menos de 1 bloco por dia útil. */
export const META_PADRAO_BLOCOS = 3;

export type Metas = Record<string, number>;

function objetoDe(valor: string | null | undefined): Metas {
  if (!valor) return {};
  try {
    const obj = JSON.parse(valor) as unknown;
    if (!obj || typeof obj !== "object") return {};
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .map(([k, v]) => [k, Number(v)] as const)
        .filter(([, v]) => Number.isFinite(v) && v > 0),
    );
  } catch {
    return {};
  }
}

/**
 * Converte o formato antigo (flag + número + mapa separado) no mapa único.
 * Roda só quando a chave nova ainda não existe; grava o resultado para não
 * repetir a leitura das três chaves antigas a cada abertura.
 */
async function migrarFormatoAntigo(): Promise<Metas> {
  const [ativa, blocos, porMateria] = await Promise.all([
    Preferences.get({ key: K_ANTIGA_ATIVA }),
    Preferences.get({ key: K_ANTIGA_BLOCOS }),
    Preferences.get({ key: K_ANTIGA_POR_MATERIA }),
  ]);
  const metas = objetoDe(porMateria.value);
  if (ativa.value === "1") {
    metas[META_GERAL] = Number(blocos.value) || META_PADRAO_BLOCOS;
  }
  if (Object.keys(metas).length) await setMetas(metas);
  return metas;
}

export async function getMetas(): Promise<Metas> {
  try {
    const r = await Preferences.get({ key: K_METAS });
    if (r.value) return objetoDe(r.value);
    return await migrarFormatoAntigo();
  } catch {
    return {};
  }
}

export async function setMetas(metas: Metas): Promise<void> {
  await Preferences.set({ key: K_METAS, value: JSON.stringify(metas) });
}

/** Rótulo de uma chave de meta para exibição. */
export function rotuloMeta(chave: string): string {
  return chave === META_GERAL ? "Todas as matérias" : chave;
}
