import type { ReactNode } from "react";
import { C, disp, TAB_BAR_H } from "../theme";

/** Cabeçalho + coluna centrada de 620px, como no artefato. */
export default function Shell({
  titulo,
  children,
}: {
  titulo: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: `0 16px ${TAB_BAR_H + 28}px` }}>
      <header
        style={{
          padding: "22px 0 6px",
          borderBottom: `1.5px solid ${C.ink}`,
          marginBottom: 18,
        }}
      >
        <h1
          style={{
            ...disp,
            fontSize: 26,
            fontWeight: 800,
            margin: "0 0 10px",
            letterSpacing: -0.5,
          }}
        >
          {titulo}
        </h1>
      </header>
      {children}
    </div>
  );
}

/** Estado vazio padrão. */
export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "44px 20px",
        color: C.sub,
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}
