/**
 * Última configuração "avançada" usada ao gerar um bloco por IA — tipo de
 * cobrança, formato e dificuldade. Esses três ficam recolhidos na tela Gerar
 * (ver GerarView) e já abrem com o que valeu no último bloco gerado, em vez de
 * voltar ao padrão a cada visita.
 */
import { Preferences } from "@capacitor/preferences";
import type { Config } from "./types";

const K_ULTIMA_CONFIG = "ultima-config-ia";

export type ConfigAvancada = Pick<Config, "tipos" | "formato" | "nivel">;

export async function salvarUltimaConfigIA(c: ConfigAvancada): Promise<void> {
  try {
    await Preferences.set({
      key: K_ULTIMA_CONFIG,
      value: JSON.stringify({ tipos: c.tipos, formato: c.formato, nivel: c.nivel }),
    });
  } catch {
    // Best-effort: não persistir só perde o pré-preenchimento.
  }
}

export async function getUltimaConfigIA(): Promise<ConfigAvancada | null> {
  try {
    const { value } = await Preferences.get({ key: K_ULTIMA_CONFIG });
    if (!value) return null;
    const c = JSON.parse(value) as Partial<ConfigAvancada>;
    if (!Array.isArray(c.tipos) || !c.tipos.length || !c.formato || !c.nivel) return null;
    return c as ConfigAvancada;
  } catch {
    return null;
  }
}
