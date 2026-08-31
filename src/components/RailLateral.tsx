import { useEffect, useRef, useState } from "react";
import { CalculatorIcon, ClockIcon } from "@heroicons/react/24/outline";
import { C } from "../theme";
import { TecladoCalculadora } from "./Calculadora";
import Cronometro from "./Cronometro";
import BuscaGlobal from "./BuscaGlobal";
import BotaoTema from "./BotaoTema";
import { ABAS, type Aba } from "./abas";

export const RAIL_LARGURA = 52;
const LARGURA = RAIL_LARGURA;

/** Um ícone do rail com popover flutuante ao lado — calculadora e cronômetro
 * usam este padrão; fecha ao clicar fora ou apertar Escape. */
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
        aria-expanded={aberto}
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          border: `1.5px solid ${aberto ? C.caneta : "transparent"}`,
          background: aberto ? C.canetaSoft : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icone}
      </button>
      {aberto && (
        <div
          style={{
            position: "absolute",
            left: LARGURA + 6,
            top: 0,
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

/**
 * Rail vertical do layout largo (ver useLayoutLargo em lib/plataforma.ts):
 * busca, abas principais, calculadora e cronômetro flutuam por cima do
 * conteúdo em vez de disputar espaço com ele. As abas principais
 * (Questões/Notas/Dados/Ajustes) migraram aqui da antiga NavPill (pílula
 * flutuante no topo) — ver spec
 * docs/superpowers/specs/2026-08-30-navegacao-unificada-design.md.
 */
export default function RailLateral({
  aba,
  onChange,
}: {
  aba: Aba;
  onChange: (a: Aba) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: LARGURA,
        borderRight: `1.5px solid ${C.line}`,
        background: C.card,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "16px 7px",
      }}
    >
      <BuscaGlobal />

      <div style={{ width: 24, height: 1.5, background: C.line, margin: "4px 0" }} />

      {ABAS.map((a) => {
        const ativo = a.id === aba;
        return (
          <button
            key={a.id}
            onClick={() => onChange(a.id)}
            aria-label={a.label}
            title={a.label}
            aria-current={ativo ? "page" : undefined}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: `1.5px solid ${ativo ? C.caneta : "transparent"}`,
              background: ativo ? C.canetaSoft : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {a.icone(ativo ? C.caneta : C.sub, 19)}
          </button>
        );
      })}

      <div style={{ width: 24, height: 1.5, background: C.line, margin: "4px 0" }} />

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

      <div style={{ flex: 1 }} />

      <BotaoTema />
    </div>
  );
}
