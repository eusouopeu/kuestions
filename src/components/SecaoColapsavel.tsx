import type { ReactNode } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { C, cartao, mono } from "../theme";

/**
 * Seção colapsável de Ajustes (ver AjustesTab): usa <details>/<summary>
 * nativos por acessibilidade de graça (teclado, leitor de tela), mas
 * controlados via `aberta`/`onToggle` para que a busca da tela possa forçar
 * a expansão de uma seção sem depender do usuário clicar nela.
 */
export default function SecaoColapsavel({
  titulo,
  badge,
  aberta,
  onToggle,
  children,
}: {
  titulo: string;
  /** Contador opcional ao lado do título — visível mesmo com a seção fechada
   * (ex.: quantidade de questões reportadas), para não esconder um aviso
   * atrás de um toque extra. */
  badge?: number;
  aberta: boolean;
  onToggle: (aberta: boolean) => void;
  children: ReactNode;
}) {
  return (
    <details
      style={{ ...cartao, padding: 0, marginTop: 14, overflow: "hidden" }}
      open={aberta}
      onToggle={(e) => onToggle((e.target as HTMLDetailsElement).open)}
    >
      <summary
        style={{
          ...mono,
          fontSize: 11,
          color: C.sub,
          letterSpacing: 0.8,
          padding: "14px 16px",
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>
          {titulo}
          {badge ? ` · ${badge}` : ""}
        </span>
        <ChevronDownIcon
          width={16}
          height={16}
          style={{
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: aberta ? "rotate(180deg)" : "none",
          }}
        />
      </summary>
      <div style={{ padding: "0 16px 16px" }}>{children}</div>
    </details>
  );
}
