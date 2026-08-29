import { ABAS, type Aba } from "./abas";
import { C, mono } from "../theme";
import { TAB_BAR_H } from "../theme";

export type { Aba } from "./abas";

/** Tab bar nativa própria, sem biblioteca de UI (além dos ícones, do HeroIcons). */
export default function TabBar({
  aba,
  onChange,
}: {
  aba: Aba;
  onChange: (a: Aba) => void;
}) {
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: TAB_BAR_H,
        // Respeita a home bar do iPhone e a barra de gestos do Android.
        paddingBottom: "env(safe-area-inset-bottom)",
        background: C.card,
        borderTop: `1.5px solid ${C.line}`,
        display: "flex",
        zIndex: 50,
      }}
    >
      {ABAS.map((a) => {
        const ativo = a.id === aba;
        const cor = ativo ? C.caneta : C.sub;
        return (
          <button
            key={a.id}
            onClick={() => onChange(a.id)}
            aria-label={a.label}
            aria-current={ativo ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {a.icone(cor)}
            <span style={{ ...mono, fontSize: 10, color: cor, fontWeight: ativo ? 600 : 400 }}>
              {a.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
