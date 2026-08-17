import type { ReactNode } from "react";
import { C, mono } from "../theme";

/**
 * Seletor de duas ou mais views. Usado no topo da aba Questões (Gerar novas /
 * Refazer erradas) e como filtro de ordenação na aba Notas. `icone` é
 * opcional — só a aba Questões usa, para diferenciar visualmente seus 4
 * modos (que não são abas de verdade, e por isso pedem um reforço além do
 * texto para o usuário situar-se rápido em qual fluxo está).
 */
export default function Segmented<T extends string>({
  valor,
  opcoes,
  onChange,
}: {
  valor: T;
  opcoes: { id: T; label: string; icone?: (cor: string) => ReactNode }[];
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: 0,
        border: `1.5px solid ${C.line}`,
        borderRadius: 8,
        overflow: "hidden",
        background: C.card,
      }}
    >
      {opcoes.map((o) => {
        const ativo = o.id === valor;
        const cor = ativo ? "#fff" : C.ink;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(o.id)}
            style={{
              ...mono,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              flex: 1,
              fontSize: 12,
              fontWeight: ativo ? 600 : 400,
              padding: o.icone ? "9px 4px 8px" : "10px 6px",
              border: "none",
              cursor: "pointer",
              background: ativo ? C.realce : "transparent",
              color: cor,
              transition: "background .12s",
            }}
          >
            {o.icone?.(cor)}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
