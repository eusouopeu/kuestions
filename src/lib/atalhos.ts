/**
 * Atalho do ícone do app no Android (toque longo → "Bloco rápido", ver
 * android/app/src/main/res/xml/shortcuts.xml): abre o app com a URL
 * `kuestions://bloco-rapido`. Lida aqui tanto na abertura a frio
 * (`App.getLaunchUrl`) quanto com o app já aberto (`appUrlOpen`).
 *
 * O pedido fica pendente até GerarBancoView consumi-lo (`consumirBlocoRapido`):
 * QuestoesTab troca para "Do banco" ao ouvir o pedido e a view, ao montar ou
 * já montada, inicia o bloco.
 */
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const URL_BLOCO_RAPIDO = "kuestions://bloco-rapido";

let pendente = false;
const ouvintes = new Set<() => void>();

export function pedirBlocoRapido(): void {
  pendente = true;
  ouvintes.forEach((f) => f());
}

/** true uma única vez por pedido. */
export function consumirBlocoRapido(): boolean {
  const p = pendente;
  pendente = false;
  return p;
}

/** Há pedido ainda não consumido (QuestoesTab, ao montar depois do pedido). */
export function blocoRapidoPendente(): boolean {
  return pendente;
}

export function aoPedirBlocoRapido(f: () => void): () => void {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

// A abertura a frio pode chegar pelos dois caminhos (getLaunchUrl e
// appUrlOpen) — o segundo aviso em poucos segundos é o mesmo toque.
let ultimoPedido = 0;

function tratarUrl(url: string | undefined): void {
  if (!url?.startsWith(URL_BLOCO_RAPIDO)) return;
  const agora = Date.now();
  if (agora - ultimoPedido < 3000) return;
  ultimoPedido = agora;
  pedirBlocoRapido();
}

/** Chamado uma vez no boot (App.tsx). */
export function iniciarAtalhos(): void {
  if (!Capacitor.isNativePlatform()) return;
  App.getLaunchUrl()
    .then((r) => tratarUrl(r?.url))
    .catch(() => {});
  App.addListener("appUrlOpen", (e) => tratarUrl(e.url)).catch(() => {});
}
