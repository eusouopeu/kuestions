/**
 * Acessibilidade: escala da interface e leitura em voz alta.
 *
 * ESCALA — todo o app dimensiona em px absolutos (estilos inline, ver
 * theme.ts), então mudar a fonte-raiz não escalaria nada. O que escala tudo
 * de uma vez, inclusive os alvos de toque, é a propriedade `zoom` no
 * elemento raiz (suportada por Chrome/Android WebView e por WebKit/iOS).
 * Guardada com o mesmo mecanismo de tema.ts: Preferences como fonte de
 * verdade e um espelho síncrono em localStorage para aplicar antes do
 * primeiro paint, sem "salto" de tamanho na abertura.
 *
 * VOZ — leitura do enunciado/comentário pela Web Speech API, disponível na
 * WebView das duas plataformas. Serve para revisar em deslocamento, sem
 * encarar a tela. Não é gravação nem chamada de API: síntese local do
 * aparelho, sem custo e sem rede.
 */
import { Preferences } from "@capacitor/preferences";

export type Escala = 100 | 110 | 125;

export const ESCALAS: { valor: Escala; label: string }[] = [
  { valor: 100, label: "Padrão" },
  { valor: 110, label: "Grande" },
  { valor: 125, label: "Maior" },
];

const K_ESCALA = "escala-interface";

function ehEscala(v: unknown): v is Escala {
  return v === 100 || v === 110 || v === 125;
}

export function aplicarEscala(e: Escala): void {
  // `zoom` não está na tipagem de CSSStyleDeclaration em todos os alvos de
  // TS — setProperty evita depender disso.
  document.documentElement.style.setProperty("zoom", e === 100 ? "" : String(e / 100));
  localStorage.setItem(K_ESCALA, String(e));
}

/** Leitura síncrona (localStorage) — usada só no boot, antes do 1º paint. */
export function escalaInicial(): Escala {
  const v = Number(localStorage.getItem(K_ESCALA));
  return ehEscala(v) ? v : 100;
}

export async function getEscala(): Promise<Escala> {
  try {
    const { value } = await Preferences.get({ key: K_ESCALA });
    const n = Number(value);
    return ehEscala(n) ? n : escalaInicial();
  } catch {
    return escalaInicial();
  }
}

export async function setEscala(e: Escala): Promise<void> {
  aplicarEscala(e);
  try {
    await Preferences.set({ key: K_ESCALA, value: String(e) });
  } catch {
    // localStorage (via aplicarEscala) já cobre o fallback.
  }
}

/* ---------- Leitura em voz alta ---------- */

export function vozDisponivel(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Interrompe qualquer leitura em andamento. Chamado antes de iniciar outra
 * (duas falas simultâneas ficam ininteligíveis) e ao trocar de questão. */
export function pararLeitura(): void {
  if (vozDisponivel()) window.speechSynthesis.cancel();
}

/**
 * Lê o texto em voz alta em pt-BR. `onFim` avisa quem chamou para devolver o
 * botão ao estado normal — inclusive quando a leitura é cancelada, senão o
 * botão ficaria preso em "lendo" para sempre.
 */
export function lerEmVoz(texto: string, onFim?: () => void): void {
  if (!vozDisponivel() || !texto.trim()) {
    onFim?.();
    return;
  }
  pararLeitura();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  fala.rate = 1;
  fala.onend = () => onFim?.();
  fala.onerror = () => onFim?.();
  window.speechSynthesis.speak(fala);
}
