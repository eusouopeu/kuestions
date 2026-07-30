import { C, mono } from "../theme";
import { TAB_BAR_H } from "../theme";

export type Aba = "questoes" | "notas" | "dados" | "ajustes";

/**
 * Tab bar nativa própria, sem biblioteca de UI. Ícones são SVG inline (24px)
 * para não puxar um pacote de ícones só por quatro glifos.
 */
const ABAS: { id: Aba; label: string; icone: (cor: string) => JSX.Element }[] = [
  {
    id: "questoes",
    label: "Questões",
    icone: (cor) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "notas",
    label: "Notas",
    icone: (cor) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      </svg>
    ),
  },
  {
    id: "dados",
    label: "Dados",
    icone: (cor) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "ajustes",
    label: "Ajustes",
    icone: (cor) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" strokeLinecap="round" />
      </svg>
    ),
  },
];

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
