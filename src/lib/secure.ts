/**
 * Guarda a chave de API do usuário via @capacitor/preferences, que no Android
 * usa SharedPreferences do sandbox do app e no iOS o UserDefaults do app —
 * ambos privados ao app e não legíveis por outros processos.
 *
 * A chave NUNCA aparece no bundle: só existe se o usuário a colar em Ajustes.
 */
import { Preferences } from "@capacitor/preferences";

const K_API_KEY = "anthropic-api-key";
const K_PROXY_URL = "anthropic-proxy-url";

async function get(key: string): Promise<string> {
  try {
    const { value } = await Preferences.get({ key });
    return value ?? "";
  } catch {
    // Se o plugin falhar (ambiente inesperado), degrada para localStorage em
    // vez de deixar o app inutilizável — mesma vida útil, mesmo escopo de origem.
    return localStorage.getItem(key) ?? "";
  }
}

async function set(key: string, value: string): Promise<void> {
  const v = value.trim();
  try {
    if (v) await Preferences.set({ key, value: v });
    else await Preferences.remove({ key });
  } catch {
    if (v) localStorage.setItem(key, v);
    else localStorage.removeItem(key);
  }
}

export const getApiKey = () => get(K_API_KEY);
export const setApiKey = (v: string) => set(K_API_KEY, v);

/**
 * URL de backend opcional. Se preenchida, o app fala com ela em vez de
 * api.anthropic.com — permite migrar para um Cloudflare Worker depois, sem
 * mexer no código do app.
 */
export const getProxyUrl = () => get(K_PROXY_URL);
export const setProxyUrl = (v: string) => set(K_PROXY_URL, v);

export async function temCredencial(): Promise<boolean> {
  const [k, p] = await Promise.all([getApiKey(), getProxyUrl()]);
  return Boolean(k || p);
}

export function pareceApiKey(k: string): boolean {
  return /^sk-ant-[\w-]{10,}$/.test(k.trim());
}
