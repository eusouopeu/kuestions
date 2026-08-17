import { useEffect, useState } from "react";
import { C, mono } from "../theme";

/**
 * Aviso discreto de "sem conexão", baseado em `navigator.onLine` + eventos
 * `online`/`offline` do WebView — sem depender do plugin `@capacitor/network`
 * (não é dependência do projeto). Hoje a única forma de descobrir que caiu o
 * sinal era abrir "Gerar", esperar o timeout e ler um `APIConnectionError`;
 * Simulado e Refazer erradas não dependem da API, então o aviso deixa isso
 * explícito em vez de deixar o usuário concluir sozinho.
 */
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const marcarOnline = () => setOnline(true);
    const marcarOffline = () => setOnline(false);
    window.addEventListener("online", marcarOnline);
    window.addEventListener("offline", marcarOffline);
    return () => {
      window.removeEventListener("online", marcarOnline);
      window.removeEventListener("offline", marcarOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      style={{
        ...mono,
        fontSize: 11.5,
        textAlign: "center",
        padding: "7px 14px",
        color: C.sub,
        background: C.canetaSoft,
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      Sem conexão — Simulado e Refazer erradas continuam funcionando.
    </div>
  );
}
