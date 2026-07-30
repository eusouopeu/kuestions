import type { ReactNode } from "react";
import { C, mono } from "../theme";

export type Tom = "neutro" | "ok" | "erro";

const CORES: Record<Tom, [string, string]> = {
  neutro: [C.canetaSoft, C.caneta],
  ok: [C.okSoft, C.ok],
  erro: [C.erroSoft, C.erro],
};

/** Chip estático (dispositivo legal, rótulos). */
export default function Chip({
  children,
  tom = "neutro",
}: {
  children: ReactNode;
  tom?: Tom;
}) {
  const [bg, fg] = CORES[tom];
  return (
    <span
      style={{
        ...mono,
        fontSize: 11,
        background: bg,
        color: fg,
        padding: "3px 8px",
        borderRadius: 4,
        marginRight: 6,
        marginBottom: 6,
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}
