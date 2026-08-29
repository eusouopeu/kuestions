import { ABAS, type Aba } from "./abas";
import { C, mono } from "../theme";

/**
 * Navegação do layout largo (desktop/tablet, ver useLayoutLargo em
 * lib/plataforma.ts): pílula flutuante centralizada no topo, no lugar da tab
 * bar fixa embaixo usada no celular. Mesmas abas, mesma fonte (ABAS) — só
 * muda onde e como aparecem.
 */
export default function NavPill({
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
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        gap: 2,
        padding: 4,
        background: C.card,
        border: `1.5px solid ${C.line}`,
        borderRadius: 999,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      {ABAS.map((a) => {
        const ativo = a.id === aba;
        return (
          <button
            key={a.id}
            onClick={() => onChange(a.id)}
            aria-label={a.label}
            aria-current={ativo ? "page" : undefined}
            style={{
              ...mono,
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
              fontWeight: ativo ? 600 : 400,
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: ativo ? C.realce : "transparent",
              color: ativo ? "#fff" : C.ink,
              transition: "background .12s, color .12s",
              whiteSpace: "nowrap",
            }}
          >
            {a.icone(ativo ? "#fff" : C.sub, 17)}
            {a.label}
          </button>
        );
      })}
    </nav>
  );
}
