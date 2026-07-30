import { useRef, useState, type CSSProperties } from "react";
import { C, disp } from "../theme";

export type Reveal = "certo" | "errado" | null;

/**
 * Alternativa interativa, portada do artefato: toca para marcar, arrasta ←
 * para riscar e → para desriscar. O gesto e os limiares (8px para distinguir
 * toque de arrasto, 50px para acionar) são os do original.
 */
export default function Opcao({
  texto,
  big,
  tachada,
  marcada,
  reveal,
  onSelect,
  onTachar,
  onDestachar,
  style,
}: {
  texto: string;
  big?: boolean;
  tachada: boolean;
  marcada: boolean;
  reveal: Reveal;
  onSelect: () => void;
  onTachar: () => void;
  onDestachar: () => void;
  style?: CSSProperties;
}) {
  const startX = useRef<number | null>(null);
  const arrasto = useRef(false);
  const [dx, setDx] = useState(0);

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
    arrasto.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* setPointerCapture não é crítico: sem ele o gesto ainda funciona */
    }
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current == null) return;
    const d = e.clientX - startX.current;
    if (Math.abs(d) > 8) arrasto.current = true;
    setDx(Math.max(-80, Math.min(80, d)));
  };
  const up = () => {
    const d = dx;
    startX.current = null;
    setDx(0);
    if (d < -50) onTachar();
    else if (d > 50) onDestachar();
    else if (!arrasto.current) onSelect();
  };
  const cancel = () => {
    startX.current = null;
    setDx(0);
  };

  const [borda, fundo] =
    reveal === "certo"
      ? [C.ok, C.okSoft]
      : reveal === "errado"
        ? [C.erro, C.erroSoft]
        : marcada
          ? [C.caneta, C.canetaSoft]
          : [C.line, C.paper];

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{
        userSelect: "none",
        touchAction: "pan-y",
        cursor: "pointer",
        transform: `translateX(${dx}px)`,
        transition: dx === 0 ? "transform .15s" : "none",
        border: `2px solid ${borda}`,
        background: fundo,
        borderRadius: 8,
        padding: big ? "14px 0" : "11px 12px",
        textAlign: big ? "center" : "left",
        fontSize: big ? 15 : 14.5,
        fontWeight: big ? 700 : 400,
        lineHeight: 1.4,
        color: tachada
          ? C.sub
          : reveal === "certo"
            ? C.ok
            : reveal === "errado"
              ? C.erro
              : marcada
                ? C.caneta
                : C.ink,
        textDecoration: tachada ? "line-through" : "none",
        opacity: tachada ? 0.55 : 1,
        ...(big ? disp : {}),
        ...style,
      }}
    >
      {texto}
    </div>
  );
}
