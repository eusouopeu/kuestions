/**
 * Backend fino OPCIONAL (opção 1 da especificação).
 *
 * O app funciona sem isto: por padrão o usuário cola a própria chave em
 * Ajustes e o app fala direto com a API. Use este Worker se quiser que a chave
 * fique no servidor — necessário se o app for distribuído a outras pessoas.
 *
 * Deploy:
 *   1. npm i -g wrangler && wrangler login
 *   2. wrangler deploy proxy/cloudflare-worker.js --name kumon-fiscal-proxy
 *   3. wrangler secret put ANTHROPIC_API_KEY      (cole a chave sk-ant-…)
 *   4. wrangler secret put APP_TOKEN              (um segredo qualquer, veja abaixo)
 *   5. No app, em Ajustes → "Backend próprio", cole a URL do Worker
 *      (ex.: https://kumon-fiscal-proxy.SEU-SUBDOMINIO.workers.dev)
 *      e ponha o APP_TOKEN no campo "Chave de API".
 *
 * Por que APP_TOKEN: um Worker aberto na internet que repassa sua chave é uma
 * conta da Anthropic de graça para quem descobrir a URL. O app já envia o
 * conteúdo do campo "Chave de API" no header x-api-key, então usamos esse
 * campo como token de acesso ao Worker — o app não precisa de mudança alguma.
 */

const ALLOWED_PATHS = new Set(["/v1/messages"]);
const UPSTREAM = "https://api.anthropic.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    if (request.method !== "POST") return cors(json({ error: "Método não permitido." }, 405));
    if (!ALLOWED_PATHS.has(url.pathname)) {
      return cors(json({ error: `Rota não permitida: ${url.pathname}` }, 404));
    }
    if (!env.ANTHROPIC_API_KEY) {
      return cors(json({ error: "ANTHROPIC_API_KEY não configurada no Worker." }, 500));
    }

    // Autenticação do app contra o Worker (ver comentário acima).
    if (env.APP_TOKEN) {
      const enviado = request.headers.get("x-api-key") ?? "";
      if (!seguroIgual(enviado, env.APP_TOKEN)) {
        return cors(json({ error: "Não autorizado." }, 401));
      }
    }

    const upstream = await fetch(`${UPSTREAM}${url.pathname}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": request.headers.get("anthropic-version") ?? "2023-06-01",
        // Repassa betas quando o app pedir algum.
        ...(request.headers.get("anthropic-beta")
          ? { "anthropic-beta": request.headers.get("anthropic-beta") }
          : {}),
      },
      body: request.body,
      // Necessário para repassar o corpo como stream em runtimes fetch.
      duplex: "half",
    });

    // Streaming passa direto: o app usa messages.stream().
    return cors(
      new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") ?? "application/json",
          ...(upstream.headers.get("cache-control")
            ? { "cache-control": upstream.headers.get("cache-control") }
            : {}),
        },
      }),
    );
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function cors(res) {
  const h = new Headers(res.headers);
  // A WebView do Capacitor usa origem https://localhost (Android) ou
  // capacitor://localhost (iOS); ambas contam como origem opaca, daí o "*".
  h.set("access-control-allow-origin", "*");
  h.set(
    "access-control-allow-headers",
    "content-type, x-api-key, anthropic-version, anthropic-beta, anthropic-dangerous-direct-browser-access",
  );
  h.set("access-control-allow-methods", "POST, OPTIONS");
  h.set("access-control-max-age", "86400");
  return new Response(res.body, { status: res.status, headers: h });
}

/** Comparação em tempo constante, para não vazar o token por timing. */
function seguroIgual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
