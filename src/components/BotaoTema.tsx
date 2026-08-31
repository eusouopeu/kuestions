import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { C } from "../theme";
import { getTema, setTema, type Tema } from "../lib/tema";

const PROXIMO_TEMA: Record<Tema, Tema> = {
  sistema: "claro",
  claro: "escuro",
  escuro: "sistema",
};

/** Botão-ícone de tema (sol/lua), ciclo sistema → claro → escuro. Usado no
 * rail lateral (desktop, ver RailLateral.tsx) e no topo da tela no mobile
 * (ver Shell.tsx) — mesmo componente, mesmo estado persistido em
 * lib/tema.ts. */
export default function BotaoTema() {
  const [tema, setTemaLocal] = useState<Tema>("sistema");

  useEffect(() => {
    getTema().then(setTemaLocal);
  }, []);

  async function alternar() {
    const atual = await getTema();
    const proximo = PROXIMO_TEMA[atual];
    await setTema(proximo);
    setTemaLocal(proximo);
  }

  const escuro =
    tema === "escuro" ||
    (tema === "sistema" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={alternar}
      aria-label={`Tema: ${tema}. Clique para alternar.`}
      title={`Tema: ${tema}`}
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
      {escuro ? (
        <MoonIcon width={19} height={19} stroke={C.sub} strokeWidth={1.8} />
      ) : (
        <SunIcon width={19} height={19} stroke={C.sub} strokeWidth={1.8} />
      )}
    </button>
  );
}
