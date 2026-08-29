import { useEffect, useRef, useState } from "react";
import {
  Bars3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { C, disp, mono } from "../../../theme";
import type { BlocoCaderno } from "../../../lib/caderno/tipos";
import TextoDeBloco from "../../../components/TextoDeBloco";
import MenuTipoBloco from "./MenuTipoBloco";

const PLACEHOLDER: Record<string, string> = {
  texto: "Escreva algo, ou / para um tipo de bloco…",
  h1: "Título 1",
  h2: "Título 2",
  bullet: "Item da lista",
  todo: "Tarefa",
  citacao: "Citação",
  codigo: "// código",
  callout: "Destaque",
  toggle: "Cabeçalho recolhível",
};

function estiloTexto(tipo: BlocoCaderno["tipo"]): React.CSSProperties {
  switch (tipo) {
    case "h1":
      return { ...disp, fontSize: 22, fontWeight: 800 };
    case "h2":
      return { ...disp, fontSize: 17, fontWeight: 700 };
    case "codigo":
      return { ...mono, fontSize: 13, background: C.paper, borderRadius: 6, padding: "8px 10px" };
    case "citacao":
      return { ...disp, fontSize: 14.5, fontStyle: "italic", color: C.sub };
    default:
      return { ...disp, fontSize: 15 };
  }
}

/** Autoresize simples: mede o scrollHeight e ajusta a altura do elemento. */
function autoAjustar(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/**
 * Um bloco do Caderno: em leitura mostra TextoDeBloco (marca-texto + links
 * de página); ao clicar, vira uma textarea auto-crescente para editar. Enter
 * cria um bloco novo abaixo; Backspace num bloco vazio funde com o anterior;
 * "/" no início do texto abre o menu de conversão de tipo — tudo delegado ao
 * pai (EditorCaderno) via callbacks, este componente só cuida do próprio
 * bloco.
 */
export default function BlocoCadernoItem({
  bloco,
  focado,
  onFocar,
  onDesfocar,
  onTexto,
  onEnter,
  onBackspaceNoInicio,
  onAlternarMarcado,
  onAlternarAberto,
  onMudarTipo,
  onDuplicar,
  onApagar,
  onMoverCima,
  onMoverBaixo,
  onAbrirLink,
  registrarRef,
  onEditarCelula,
  onAdicionarLinhaTabela,
  onAdicionarColunaTabela,
}: {
  bloco: BlocoCaderno;
  focado: boolean;
  onFocar: () => void;
  onDesfocar: () => void;
  onTexto: (texto: string) => void;
  onEnter: () => void;
  onBackspaceNoInicio: () => void;
  onAlternarMarcado: () => void;
  onAlternarAberto: () => void;
  onMudarTipo: (tipo: BlocoCaderno["tipo"]) => void;
  onDuplicar: () => void;
  onApagar: () => void;
  onMoverCima: () => void;
  onMoverBaixo: () => void;
  onAbrirLink: (titulo: string) => void;
  registrarRef: (el: HTMLTextAreaElement | null) => void;
  onEditarCelula: (linha: number, coluna: number, valor: string) => void;
  onAdicionarLinhaTabela: () => void;
  onAdicionarColunaTabela: () => void;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [ferramentasVisiveis, setFerramentasVisiveis] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (focado) {
      autoAjustar(taRef.current);
      taRef.current?.focus();
    }
  }, [focado]);

  if (bloco.tipo === "divisor") {
    return (
      <div
        onMouseEnter={() => setFerramentasVisiveis(true)}
        onMouseLeave={() => setFerramentasVisiveis(false)}
        style={{ position: "relative", padding: "10px 0" }}
      >
        <div style={{ borderTop: `1.5px dashed ${C.line}` }} />
        {ferramentasVisiveis && (
          <BarraFerramentas onDuplicar={onDuplicar} onApagar={onApagar} onMoverCima={onMoverCima} onMoverBaixo={onMoverBaixo} />
        )}
      </div>
    );
  }

  if (bloco.tipo === "tabela") {
    const celulas = bloco.celulas ?? [["", ""]];
    return (
      <div
        onMouseEnter={() => setFerramentasVisiveis(true)}
        onMouseLeave={() => setFerramentasVisiveis(false)}
        style={{ position: "relative", padding: "6px 0" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <table style={{ borderCollapse: "collapse", flex: 1 }}>
            <tbody>
              {celulas.map((linha, i) => (
                <tr key={i}>
                  {linha.map((valor, j) => (
                    <td key={j} style={{ border: `1.5px solid ${C.line}`, padding: 0 }}>
                      <input
                        value={valor}
                        onChange={(e) => onEditarCelula(i, j, e.target.value)}
                        style={{
                          ...disp,
                          fontSize: 13,
                          padding: "6px 8px",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          color: C.ink,
                          width: 110,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {ferramentasVisiveis && (
            <BarraFerramentas onDuplicar={onDuplicar} onApagar={onApagar} onMoverCima={onMoverCima} onMoverBaixo={onMoverBaixo} />
          )}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <button onClick={onAdicionarLinhaTabela} style={{ ...mono, fontSize: 10.5, color: C.sub, background: "none", border: "none", cursor: "pointer" }}>
            + linha
          </button>
          <button onClick={onAdicionarColunaTabela} style={{ ...mono, fontSize: 10.5, color: C.sub, background: "none", border: "none", cursor: "pointer" }}>
            + coluna
          </button>
        </div>
      </div>
    );
  }

  const prefixo =
    bloco.tipo === "bullet" ? (
      <span style={{ color: C.sub, marginRight: 8 }}>•</span>
    ) : bloco.tipo === "callout" ? (
      <span style={{ marginRight: 8 }}>💡</span>
    ) : bloco.tipo === "citacao" ? (
      <span style={{ borderLeft: `3px solid ${C.caneta}`, paddingLeft: 10, display: "block", width: "100%" }} />
    ) : null;

  const conteudoTexto = focado ? (
    <textarea
      ref={(el) => {
        taRef.current = el;
        registrarRef(el);
      }}
      value={bloco.texto}
      placeholder={PLACEHOLDER[bloco.tipo] ?? ""}
      onFocus={onFocar}
      onBlur={() => {
        onDesfocar();
        setMenuAberto(false);
      }}
      onInput={(e) => autoAjustar(e.currentTarget)}
      onChange={(e) => {
        onTexto(e.target.value);
        if (e.target.value === "/") setMenuAberto(true);
        else if (menuAberto && !e.target.value.startsWith("/")) setMenuAberto(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && bloco.tipo !== "codigo" && !e.shiftKey) {
          e.preventDefault();
          setMenuAberto(false);
          onEnter();
          return;
        }
        if (e.key === "Backspace" && bloco.texto === "") {
          e.preventDefault();
          onBackspaceNoInicio();
          return;
        }
        if (e.key === "Escape") setMenuAberto(false);
      }}
      rows={1}
      style={{
        width: "100%",
        resize: "none",
        border: "none",
        outline: "none",
        background: "transparent",
        color: C.ink,
        lineHeight: 1.55,
        ...estiloTexto(bloco.tipo),
      }}
    />
  ) : (
    <div
      onClick={onFocar}
      style={{
        cursor: "text",
        minHeight: 24,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        color: bloco.marcado ? C.sub : C.ink,
        textDecoration: bloco.tipo === "todo" && bloco.marcado ? "line-through" : "none",
        ...estiloTexto(bloco.tipo),
      }}
    >
      {bloco.tipo === "toggle" && !bloco.aberto ? (
        <span style={{ color: C.sub }}>
          {(bloco.texto.split("\n")[0] || "Recolhível vazio").slice(0, 80)}
          {bloco.texto.length > 80 || bloco.texto.includes("\n") ? "…" : ""}
        </span>
      ) : (
        <TextoDeBloco texto={bloco.texto} aoAbrirLink={onAbrirLink} />
      )}
    </div>
  );

  return (
    <div
      onMouseEnter={() => setFerramentasVisiveis(true)}
      onMouseLeave={() => setFerramentasVisiveis(false)}
      style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 8, padding: "3px 0" }}
    >
      {bloco.tipo === "todo" && (
        <input
          type="checkbox"
          checked={!!bloco.marcado}
          onChange={onAlternarMarcado}
          style={{ marginTop: 6, width: 15, height: 15, flexShrink: 0, accentColor: C.caneta }}
        />
      )}
      {bloco.tipo === "toggle" && (
        <button
          onClick={onAlternarAberto}
          aria-label={bloco.aberto ? "Recolher" : "Expandir"}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0 0", color: C.sub }}
        >
          {bloco.aberto ? <ChevronDownIcon width={14} height={14} /> : <ChevronRightIcon width={14} height={14} />}
        </button>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-start" }}>
        {prefixo}
        <div style={{ flex: 1, position: "relative" }}>
          {conteudoTexto}
          {menuAberto && <MenuTipoBloco onEscolher={(t) => { onMudarTipo(t); onTexto(""); setMenuAberto(false); }} />}
        </div>
      </div>

      {ferramentasVisiveis && !focado && (
        <BarraFerramentas onDuplicar={onDuplicar} onApagar={onApagar} onMoverCima={onMoverCima} onMoverBaixo={onMoverBaixo} />
      )}
    </div>
  );
}

function BarraFerramentas({
  onDuplicar,
  onApagar,
  onMoverCima,
  onMoverBaixo,
}: {
  onDuplicar: () => void;
  onApagar: () => void;
  onMoverCima: () => void;
  onMoverBaixo: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
      <button onClick={onMoverCima} aria-label="Mover para cima" style={botaoIcone}>
        <Bars3Icon width={13} height={13} style={{ transform: "rotate(180deg)" }} />
      </button>
      <button onClick={onMoverBaixo} aria-label="Mover para baixo" style={botaoIcone}>
        <Bars3Icon width={13} height={13} />
      </button>
      <button onClick={onDuplicar} aria-label="Duplicar bloco" style={botaoIcone}>
        <DocumentDuplicateIcon width={13} height={13} />
      </button>
      <button onClick={onApagar} aria-label="Apagar bloco" style={{ ...botaoIcone, color: C.erro }}>
        <TrashIcon width={13} height={13} />
      </button>
    </div>
  );
}

const botaoIcone: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 6,
  border: "none",
  background: "transparent",
  color: C.sub,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
