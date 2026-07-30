import { useEffect, useState } from "react";
import { C, campo, cartao, mono, rotulo } from "../theme";
import Shell from "../components/Shell";
import Botao from "../components/Botao";
import {
  getApiKey,
  getProxyUrl,
  pareceApiKey,
  setApiKey,
  setProxyUrl,
} from "../lib/secure";
import { MODEL } from "../lib/anthropic";

/**
 * Configuração da credencial. A chave é digitada pelo usuário e guardada
 * localmente (Preferences → SharedPreferences/UserDefaults do app). Nunca vai
 * para o bundle nem sai do aparelho, exceto na chamada à própria API.
 */
export default function AjustesTab() {
  const [chave, setChave] = useState("");
  const [proxy, setProxy] = useState("");
  const [visivel, setVisivel] = useState(false);
  const [status, setStatus] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    Promise.all([getApiKey(), getProxyUrl()])
      .then(([k, p]) => {
        setChave(k);
        setProxy(p);
      })
      .finally(() => setCarregado(true));
  }, []);

  async function salvar() {
    const k = chave.trim();
    const p = proxy.trim();

    if (!k && !p) {
      setStatus({ tom: "erro", texto: "Informe uma chave de API ou uma URL de backend." });
      return;
    }
    if (k && !pareceApiKey(k)) {
      setStatus({
        tom: "erro",
        texto: "A chave não parece válida — deve começar com sk-ant-.",
      });
      return;
    }
    if (p && !/^https:\/\//i.test(p)) {
      setStatus({ tom: "erro", texto: "A URL do backend precisa usar https://." });
      return;
    }

    try {
      await Promise.all([setApiKey(k), setProxyUrl(p)]);
      setStatus({ tom: "ok", texto: "Salvo. Já pode gerar questões." });
    } catch {
      setStatus({ tom: "erro", texto: "Falha ao guardar a credencial." });
    }
  }

  async function limpar() {
    await Promise.all([setApiKey(""), setProxyUrl("")]);
    setChave("");
    setProxy("");
    setStatus({ tom: "ok", texto: "Credenciais removidas do aparelho." });
  }

  return (
    <Shell kicker="CONFIGURAÇÃO" titulo="Ajustes">
      <div style={{ marginBottom: 18 }}>
        <label style={rotulo}>Chave de API da Anthropic</label>
        <input
          style={{ ...campo, ...mono, fontSize: 13 }}
          type={visivel ? "text" : "password"}
          placeholder="sk-ant-…"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={chave}
          onChange={(e) => {
            setChave(e.target.value);
            setStatus(null);
          }}
        />
        <button
          onClick={() => setVisivel((v) => !v)}
          style={{
            ...mono,
            marginTop: 6,
            fontSize: 11,
            background: "none",
            border: "none",
            color: C.caneta,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {visivel ? "Ocultar" : "Mostrar"} chave
        </button>
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>
          Gere uma chave em console.anthropic.com → API Keys. Ela fica guardada apenas neste
          aparelho e é enviada só para a API da Anthropic.
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={rotulo}>Backend próprio (opcional)</label>
        <input
          style={{ ...campo, ...mono, fontSize: 13 }}
          placeholder="https://meu-worker.workers.dev"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={proxy}
          onChange={(e) => {
            setProxy(e.target.value);
            setStatus(null);
          }}
        />
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>
          Se preenchido, o app fala com esta URL em vez de api.anthropic.com — o backend precisa
          expor <code style={{ ...mono, fontSize: 12 }}>/v1/messages</code>. Deixe vazio para usar a
          chave acima diretamente. Veja <code style={{ ...mono, fontSize: 12 }}>proxy/</code> no
          repositório.
        </div>
      </div>

      {status && (
        <div
          style={{
            background: status.tom === "ok" ? C.okSoft : C.erroSoft,
            border: `1.5px solid ${status.tom === "ok" ? C.ok : C.erro}`,
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {status.texto}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Botao tipo="tinta" onClick={salvar} disabled={!carregado}>
          Salvar
        </Botao>
        {(chave || proxy) && (
          <Botao tipo="fantasma" onClick={limpar} style={{ color: C.erro }}>
            Remover credenciais
          </Botao>
        )}
      </div>

      <div style={{ ...cartao, padding: "12px 14px", marginTop: 22 }}>
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 6 }}>
          GERAÇÃO
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
          Modelo: <code style={{ ...mono, fontSize: 12, color: C.ink }}>{MODEL}</code>
          <br />
          Raciocínio adaptativo com esforço médio, equilibrando a autoverificação factual do
          conteúdo jurídico e contábil com custo e latência por chamada.
        </div>
      </div>
    </Shell>
  );
}
