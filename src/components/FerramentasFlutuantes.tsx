import { useEffect, useRef, useState } from "react";
import { CalculatorIcon, ClockIcon } from "@heroicons/react/24/outline";
import { C } from "../theme";
import { TecladoCalculadora } from "./Calculadora";
import Cronometro from "./Cronometro";

function ItemComPopover({
  icone,
  rotulo,
  largura,
  children,
}: {
  icone: React.ReactNode;
  rotulo: string;
  largura: number;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setAberto((a) => !a)}
        aria-label={rotulo}
        title={rotulo}
        aria-expanded={aberto}
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          border: `1.5px solid ${aberto ? C.caneta : C.line}`,
          background: aberto ? C.canetaSoft : C.card,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {icone}
      </button>
      {aberto && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 44,
            width: largura,
            background: C.card,
            border: `1.5px solid ${C.line}`,
            borderRadius: 12,
            padding: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
            zIndex: 60,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Botões de calculadora e cronômetro, sem posicionamento — usado tanto
 * flutuando no desktop (FerramentasFlutuantes) quanto fixo na barra superior
 * da aba Questões no mobile (ver QuestoesTab.tsx). */
export function BotoesFerramentas() {
  return (
    <>
      <ItemComPopover
        icone={<CalculatorIcon width={19} height={19} stroke={C.sub} strokeWidth={1.8} />}
        rotulo="Calculadora"
        largura={220}
      >
        <TecladoCalculadora />
      </ItemComPopover>

      <ItemComPopover
        icone={<ClockIcon width={19} height={19} stroke={C.sub} strokeWidth={1.8} />}
        rotulo="Cronômetro"
        largura={140}
      >
        <Cronometro />
      </ItemComPopover>
    </>
  );
}

/** Calculadora e cronômetro flutuando no canto superior direito do layout
 * largo (desktop) — antes viviam no RailLateral; migrados pra cá pra liberar
 * o rail só pra navegação. */
export default function FerramentasFlutuantes() {
  return (
    <div
      style={{
        position: "fixed",
        top: 14,
        right: 14,
        zIndex: 50,
        display: "flex",
        gap: 6,
      }}
    >
      <BotoesFerramentas />
    </div>
  );
}
