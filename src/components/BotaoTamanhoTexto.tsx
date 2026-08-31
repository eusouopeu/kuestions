import { useEffect, useState } from "react";
import { C, mono } from "../theme";
import { getEscala, setEscala, PROXIMA_ESCALA, type Escala } from "../lib/acessibilidade";

/** Botão-ícone de tamanho de texto, ciclo 100 → 110 → 125 → 100 (ver
 * lib/acessibilidade.ts). Ícone "Aa" customizado — heroicons não tem ícone
 * de tamanho de fonte. Usado no topo da tela no mobile (ver Shell.tsx). */
export default function BotaoTamanhoTexto() {
  const [escala, setEscalaLocal] = useState<Escala>(100);

  useEffect(() => {
    getEscala().then(setEscalaLocal);
  }, []);

  async function alternar() {
    const proxima = PROXIMA_ESCALA[escala];
    await setEscala(proxima);
    setEscalaLocal(proxima);
  }

  return (
    <button
      onClick={alternar}
      aria-label={`Tamanho de texto: ${escala}%. Clique para alternar.`}
      title={`Tamanho de texto: ${escala}%`}
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        border: "1.5px solid transparent",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ ...mono, display: "flex", alignItems: "baseline", gap: 1, color: C.sub }}>
        <span style={{ fontSize: 11, fontWeight: 700 }}>A</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>A</span>
      </span>
    </button>
  );
}
