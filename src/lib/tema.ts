/**
 * Preferência de tema (claro/escuro/sistema). A fonte de verdade é
 * @capacitor/preferences (mesmo mecanismo de secure.ts), com um espelho
 * síncrono em localStorage só para aplicar o tema ANTES do primeiro paint —
 * sem isso, a leitura assíncrona do Preferences deixaria a tela piscar no
 * claro por um instante mesmo com o escuro escolhido.
 */
import { Preferences } from "@capacitor/preferences";

export type Tema = "sistema" | "claro" | "escuro";

const K_TEMA = "tema-preferido";

function corBarra(t: Tema): string {
  const escuro =
    t === "escuro" ||
    (t === "sistema" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  return escuro ? "#14181C" : "#F6F5F0";
}

/** Aplica no <html> e atualiza a cor da barra do navegador/status bar. */
export function aplicarTema(t: Tema): void {
  if (t === "sistema") document.documentElement.removeAttribute("data-tema");
  else document.documentElement.setAttribute("data-tema", t);

  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", corBarra(t));
  localStorage.setItem(K_TEMA, t);
}

/** Leitura síncrona (localStorage) — usada só no boot, antes do 1º paint. */
export function temaInicial(): Tema {
  const v = localStorage.getItem(K_TEMA);
  return v === "claro" || v === "escuro" ? v : "sistema";
}

export async function getTema(): Promise<Tema> {
  try {
    const { value } = await Preferences.get({ key: K_TEMA });
    return value === "claro" || value === "escuro" ? value : "sistema";
  } catch {
    return temaInicial();
  }
}

export async function setTema(t: Tema): Promise<void> {
  aplicarTema(t);
  try {
    await Preferences.set({ key: K_TEMA, value: t });
  } catch {
    // localStorage (via aplicarTema) já cobre o fallback.
  }
}
