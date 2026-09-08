import { ABAS, type Aba } from "./abas";
import { C, mono } from "../theme";
import { TAB_BAR_H } from "../theme";

export type { Aba } from "./abas";

/** Tab bar nativa própria, sem biblioteca de UI (além dos ícones, do HeroIcons). */
export default function TabBar({
  aba,
  onChange,
  badgeQuestoes = 0,
}: {
  aba: Aba;
  onChange: (a: Aba) => void;
  /** Contagem de pendências (questões + notas) exibida sobre o ícone de
   * Questões — 0/undefined não desenha nada. Opcional, ver
   * lib/badgePendencias.ts. */
  badgeQuestoes?: number;
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
            title={a.label}
            aria-current={ativo ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              position: "relative",
            }}
          >
            {a.icone(cor, 24)}
            {a.id === "questoes" && badgeQuestoes > 0 && (
              <span
                style={{
                  ...mono,
                  position: "absolute",
                  top: 2,
                  right: "50%",
                  marginRight: -20,
                  minWidth: 15,
                  height: 15,
                  padding: "0 3px",
                  borderRadius: 8,
                  background: C.erro,
                  color: "#fff",
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {badgeQuestoes > 99 ? "99+" : badgeQuestoes}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
