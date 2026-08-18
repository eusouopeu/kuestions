import { useEffect, useState, type RefObject } from "react";
import { C, campo, cartao, mono, rotulo } from "../theme";
import Botao from "./Botao";
import CampoCorpoNota from "./CampoCorpoNota";
import { salvarNota } from "../lib/repo";

interface Selecao {
  texto: string;
  /** Coordenadas de viewport (position: fixed usa o mesmo referencial). */
  rect: DOMRect;
}

/**
 * Escuta seleção de texto dentro de `containerRef` e mostra um botão
 * flutuante "+ Salvar nota" perto do trecho selecionado. Ao tocar, abre um
 * formulário para título + corpo (pré-preenchido com o trecho) + tag.
 *
 * `selectionchange` é global (não há evento de seleção por elemento), então
 * cada seleção é filtrada por `container.contains(range.commonAncestorContainer)`
 * — só reage a seleções que começam dentro deste card. As alternativas
 * (Opcao) já têm `userSelect: "none"` para não conflitar com o gesto de
 * arrastar-para-riscar, então só o texto em prosa (enunciado, comentário,
 * explicações) fica selecionável.
 */
export default function SelecaoNota({
  containerRef,
  materia,
  tagPadrao,
  questaoOrigemId,
  onSalvo,
}: {
  containerRef: RefObject<HTMLElement>;
  materia: string;
  tagPadrao: string;
  questaoOrigemId: number | null;
  onSalvo?: () => void;
}) {
  const [selecao, setSelecao] = useState<Selecao | null>(null);
  // Texto CAPTURADO no momento do toque no botão — deliberadamente separado
  // de `selecao`. Tocar em QUALQUER elemento da página (inclusive este botão)
  // conta, para o navegador, como um clique fora do trecho selecionado, e o
  // comportamento padrão é colapsar a seleção — o que dispara um
  // `selectionchange` e zeraria `selecao` bem no meio do clique. Se o modal
  // dependesse de `selecao` continuar preenchida, ele nunca chegaria a abrir:
  // o texto some no exato instante em que o usuário toca para salvá-lo.
  const [pendente, setPendente] = useState<string | null>(null);

  useEffect(() => {
    function recalcular() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelecao(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setSelecao(null);
        return;
      }
      const texto = sel.toString().trim();
      if (!texto) {
        setSelecao(null);
        return;
      }
      setSelecao({ texto, rect: range.getBoundingClientRect() });
    }

    document.addEventListener("selectionchange", recalcular);
    // Criar a seleção (Range/addRange, ou o próprio long-press no celular)
    // pode fazer o navegador rolar a tela sozinho para trazer o trecho
    // selecionado para a viewport — então esconder o popup em QUALQUER
    // scroll o fazia sumir quase no mesmo instante em que aparecia. Em vez
    // de esconder, recalculamos a posição a partir da seleção ainda válida;
    // some sozinho só quando a seleção de fato deixa de existir.
    window.addEventListener("scroll", recalcular, true);
    return () => {
      document.removeEventListener("selectionchange", recalcular);
      window.removeEventListener("scroll", recalcular, true);
    };
  }, [containerRef]);

  function fecharTudo() {
    setPendente(null);
    setSelecao(null);
    window.getSelection()?.removeAllRanges();
  }

  return (
    <>
      {selecao && !pendente && (
        <button
          onClick={() => setPendente(selecao.texto)}
          style={{
            position: "fixed",
            top: Math.max(8, selecao.rect.top - 44),
            left: Math.min(Math.max(8, selecao.rect.left), window.innerWidth - 152),
            zIndex: 200,
            ...mono,
            fontSize: 12,
            fontWeight: 600,
            background: C.realce,
            color: "#fff",
            padding: "9px 14px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(28,39,51,.35)",
          }}
        >
          + Salvar nota
        </button>
      )}

      {pendente && (
        <NotaModal
          corpoInicial={pendente}
          tagInicial={tagPadrao}
          onCancelar={fecharTudo}
          onSalvar={async (titulo, corpo, tag) => {
            await salvarNota({ materia, titulo, corpo, tag, questaoOrigemId });
            fecharTudo();
            onSalvo?.();
          }}
        />
      )}
    </>
  );
}

function NotaModal({
  corpoInicial,
  tagInicial,
  onCancelar,
  onSalvar,
}: {
  corpoInicial: string;
  tagInicial: string;
  onCancelar: () => void;
  onSalvar: (titulo: string, corpo: string, tag: string) => Promise<void>;
}) {
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState(corpoInicial);
  const [tag, setTag] = useState(tagInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!titulo.trim()) {
      setErro("Dê um título para a nota.");
      return;
    }
    if (!corpo.trim()) {
      setErro("O corpo não pode ficar vazio.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await onSalvar(titulo.trim(), corpo.trim(), tag.trim() || "geral");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar a nota.");
      setSalvando(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,39,51,.45)",
        zIndex: 300,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onCancelar}
    >
      <div
        style={{
          ...cartao,
          width: "100%",
          maxWidth: 620,
          maxHeight: "82vh",
          overflowY: "auto",
          borderRadius: "16px 16px 0 0",
          padding: "20px 18px calc(20px + env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 14 }}>
          NOVA NOTA
        </div>

        <label style={rotulo}>Título</label>
        {/* eslint-disable-next-line jsx-a11y/no-autofocus -- abrir o teclado direto no campo principal é o ponto do modal */}
        <input
          autoFocus
          style={campo}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="ex.: Hipóteses de suspensão da exigibilidade"
        />

        <div style={{ height: 14 }} />
        <CampoCorpoNota valor={corpo} onChange={setCorpo} />

        <div style={{ height: 14 }} />
        <label style={rotulo}>Tag</label>
        <input
          style={{ ...campo, ...mono, fontSize: 13 }}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>
          Assunto do bloco, resumido — usado como tag na exportação para flashcards.
        </div>

        {erro && (
          <div style={{ ...mono, fontSize: 12, color: C.erro, marginTop: 10 }}>{erro}</div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <Botao tipo="fantasma" onClick={onCancelar} style={{ flex: 1 }}>
            Cancelar
          </Botao>
          <Botao tipo="tinta" onClick={salvar} disabled={salvando} style={{ flex: 1 }}>
            {salvando ? "Salvando…" : "Salvar nota"}
          </Botao>
        </div>
      </div>
    </div>
  );
}
