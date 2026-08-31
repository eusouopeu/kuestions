import { C } from "../theme";
import BuscaGlobal from "./BuscaGlobal";
import BotaoTema from "./BotaoTema";
import { ABAS, type Aba } from "./abas";

export const RAIL_LARGURA = 52;
const LARGURA = RAIL_LARGURA;

/**
 * Rail vertical do layout largo (ver useLayoutLargo em lib/plataforma.ts):
 * busca e abas principais flutuam por cima do conteúdo em vez de disputar
 * espaço com ele. Calculadora e cronômetro migraram pra
 * FerramentasFlutuantes.tsx (canto superior direito). As abas principais
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

      <div style={{ flex: 1 }} />

      <BotaoTema />
    </div>
  );
}
