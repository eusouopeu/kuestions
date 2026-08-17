import type { CSSProperties, ReactNode } from "react";
import { C, disp } from "../theme";

type Tipo = "primario" | "fantasma" | "tinta";

/** Botão do artefato: 1.5px de borda, raio 8, leve scale no press. */
export default function Botao({
  children,
  onClick,
  tipo = "primario",
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  tipo?: Tipo;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    ...disp,
    fontWeight: 600,
    fontSize: 15,
    padding: "12px 18px",
    borderRadius: 8,
    cursor: disabled ? "default" : "pointer",
    border: "1.5px solid",
    opacity: disabled ? 0.5 : 1,
    transition: "transform .08s",
    width: "100%",
  };
  const temas: Record<Tipo, CSSProperties> = {
    primario: { background: C.caneta, borderColor: C.caneta, color: "#fff" },
    fantasma: { background: "transparent", borderColor: C.line, color: C.ink },
    tinta: { background: C.realce, borderColor: C.realce, color: "#fff" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...temas[tipo], ...style }}
      onPointerDown={(e) => {
        e.currentTarget.style.transform = "scale(.985)";
      }}
      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}
