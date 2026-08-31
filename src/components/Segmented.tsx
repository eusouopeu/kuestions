import type { ReactNode } from "react";
import { C, mono } from "../theme";

/**
 * Seletor de duas ou mais views. Usado no topo da aba Questões (Gerar novas /
 * Refazer erradas) e como filtro de ordenação na aba Notas. `icone` é
 * opcional — só a aba Questões usa, para diferenciar visualmente seus
 * modos (que não são abas de verdade, e por isso pedem um reforço além do
 * texto para o usuário situar-se rápido em qual fluxo está).
 *
 * `iconeApenas` esconde o texto do label (mantido como `title`/`aria-label`
 * para acessibilidade) — usado pela aba Questões unificada, que tem 6
 * opções e precisa caber numa pílula só sem estourar a largura no mobile.
 */
// `T extends string | number`: além dos ids textuais (abas, ordenação), a
// escala da interface em Ajustes usa números (100/110/125) como id.
export default function Segmented<T extends string | number>({
  valor,
  opcoes,
  onChange,
  iconeApenas = false,
}: {
  valor: T;
  opcoes: { id: T; label: string; icone?: (cor: string) => ReactNode }[];
  onChange: (id: T) => void;
  iconeApenas?: boolean;
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
            aria-label={o.label}
            title={iconeApenas ? o.label : undefined}
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
            {!iconeApenas && o.label}
          </button>
        );
      })}
    </div>
  );
}
