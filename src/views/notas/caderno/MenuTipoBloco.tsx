import { C, mono } from "../../../theme";
import type { TipoBloco } from "../../../lib/caderno/tipos";

const OPCOES: { tipo: TipoBloco; rotulo: string; icone: string }[] = [
  { tipo: "texto", rotulo: "Texto", icone: "¶" },
  { tipo: "h1", rotulo: "Título 1", icone: "H1" },
  { tipo: "h2", rotulo: "Título 2", icone: "H2" },
  { tipo: "bullet", rotulo: "Lista", icone: "•" },
  { tipo: "todo", rotulo: "Tarefa", icone: "☐" },
  { tipo: "citacao", rotulo: "Citação", icone: "❝" },
  { tipo: "codigo", rotulo: "Código", icone: "</>" },
  { tipo: "callout", rotulo: "Destaque", icone: "💡" },
  { tipo: "toggle", rotulo: "Recolhível", icone: "▸" },
  { tipo: "tabela", rotulo: "Tabela", icone: "▦" },
  { tipo: "divisor", rotulo: "Divisor", icone: "—" },
];

/** Menu "/" de conversão de tipo de bloco — abre ancorado no bloco que
 * chamou, fecha ao escolher ou ao clicar fora (ver EditorCaderno.tsx). */
export default function MenuTipoBloco({ onEscolher }: { onEscolher: (tipo: TipoBloco) => void }) {
  return (
    <div
      style={{
        position: "absolute",
        zIndex: 40,
        top: "100%",
        left: 0,
        marginTop: 4,
        width: 180,
        maxHeight: 260,
        overflowY: "auto",
        background: C.card,
        border: `1.5px solid ${C.line}`,
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
        padding: 6,
      }}
    >
      {OPCOES.map((o) => (
        <button
          key={o.tipo}
          // Sem isto, o mousedown tira o foco da textarea ANTES do onClick
          // disparar — o onBlur dela fecha o menu (menuAberto=false) e o
          // clique nunca chega a acontecer. Padrão usual para dropdowns
          // ancorados num campo de texto.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onEscolher(o.tipo)}
          style={{
            ...mono,
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "8px 8px",
            borderRadius: 6,
            border: "none",
            background: "transparent",
            color: C.ink,
            fontSize: 12.5,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ width: 22, textAlign: "center", color: C.sub, fontSize: 11 }}>{o.icone}</span>
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
