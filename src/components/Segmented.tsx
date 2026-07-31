import { C, mono } from "../theme";

/**
 * Seletor de duas ou mais views. Usado no topo da aba Questões (Gerar novas /
 * Refazer erradas) e como filtro de ordenação na aba Notas.
 */
export default function Segmented<T extends string>({
  valor,
  opcoes,
  onChange,
}: {
  valor: T;
  opcoes: { id: T; label: string }[];
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
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(o.id)}
            style={{
              ...mono,
              flex: 1,
              fontSize: 12,
              fontWeight: ativo ? 600 : 400,
              padding: "10px 6px",
              border: "none",
              cursor: "pointer",
              background: ativo ? C.realce : "transparent",
              color: ativo ? "#fff" : C.ink,
              transition: "background .12s",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
