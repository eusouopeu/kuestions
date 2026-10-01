import { useEffect, useState, type RefObject } from "react";
import { C, campo, cartao, mono, rotulo } from "../theme";
import Botao from "./Botao";
import CampoCorpoNota from "./CampoCorpoNota";
import { salvarNota } from "../lib/repo";
import { definirTermo, mensagemDeErro } from "../lib/anthropic";
import { BookmarkIcon, LightBulbIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Selecao {
  texto: string;
  /** Coordenadas de viewport (position: fixed usa o mesmo referencial). */
  rect: DOMRect;
}

/**
 * Escuta seleção de texto dentro de `containerRef` e mostra um botão
 * flutuante "+ Salvar nota" perto do trecho selecionado. Ao tocar, abre um
 * formulário para corpo (pré-preenchido com o trecho) + tag.
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
  contexto = "",
  onSalvo,
}: {
  containerRef: RefObject<HTMLElement>;
  materia: string;
  tagPadrao: string;
  questaoOrigemId: number | null;
  /** Enunciado da questão — dá contexto ao "Definir" para o sentido certo do termo. */
  contexto?: string;
  /** Id e corpo da nota recém-gravada (o QuestaoCard lista as notas da
   * questão e vincula as salvas antes da resposta existir). */
  onSalvo?: (id: number, corpo: string) => void;
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
  // "Definir": termo capturado (mesma razão de `pendente`) + resultado da IA.
  // Só vira nota se o usuário salvar; descartar não grava nada.
  const [definindo, setDefinindo] = useState<{
    termo: string;
    texto: string | null;
    erro: string | null;
  } | null>(null);
  const [salvandoDef, setSalvandoDef] = useState(false);

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

  async function definir(termo: string) {
    setDefinindo({ termo, texto: null, erro: null });
    window.getSelection()?.removeAllRanges();
    try {
      const texto = await definirTermo(termo, contexto, materia);
      setDefinindo((d) => (d && d.termo === termo ? { ...d, texto } : d));
    } catch (e) {
      setDefinindo((d) => (d && d.termo === termo ? { ...d, erro: mensagemDeErro(e) } : d));
    }
  }

  async function salvarDefinicao() {
    if (!definindo?.texto || salvandoDef) return;
    setSalvandoDef(true);
    try {
      const corpo = `${definindo.termo} :: ${definindo.texto}`;
      const id = await salvarNota({
        materia,
        corpo,
        tag: tagPadrao || "geral",
        questaoOrigemId,
      });
      setDefinindo(null);
      onSalvo?.(id, corpo);
    } catch (e) {
      setDefinindo((d) => (d ? { ...d, erro: e instanceof Error ? e.message : "Falha ao salvar a nota." } : d));
    } finally {
      setSalvandoDef(false);
    }
  }

  function fecharTudo() {
    setPendente(null);
    setSelecao(null);
    window.getSelection()?.removeAllRanges();
  }

  return (
    <>
      {selecao && !pendente && !definindo && (
        <div
          style={{
            position: "fixed",
            top: Math.max(8, selecao.rect.top - 44),
            left: Math.min(Math.max(8, selecao.rect.left), window.innerWidth - 200),
            zIndex: 200,
            display: "flex",
            gap: 6,
          }}
        >
          <button
            onClick={() => setPendente(selecao.texto)}
            style={{
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
          <button
            onClick={() => definir(selecao.texto)}
            aria-label="Definir termo selecionado"
            title="Definir o termo selecionado com IA"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              background: C.realce,
              color: "#fff",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(28,39,51,.35)",
            }}
          >
            <LightBulbIcon width={18} height={18} />
          </button>
        </div>
      )}

      {definindo && (
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
          onClick={() => !salvandoDef && setDefinindo(null)}
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
            <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
              DEFINIÇÃO
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 10 }}>
              {definindo.termo}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: C.ink, whiteSpace: "pre-wrap" }}>
              {definindo.erro ? (
                <span style={{ ...mono, fontSize: 12, color: C.erro }}>{definindo.erro}</span>
              ) : definindo.texto ?? <span style={{ color: C.sub }}>Gerando definição…</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button
                onClick={() => setDefinindo(null)}
                disabled={salvandoDef}
                aria-label="Descartar definição"
                title="Descartar"
                style={botaoIcone(false)}
              >
                <XMarkIcon width={18} height={18} />
              </button>
              <button
                onClick={salvarDefinicao}
                disabled={!definindo.texto || salvandoDef}
                aria-label="Salvar definição como nota"
                title="Salvar como nota"
                style={{ ...botaoIcone(true), opacity: !definindo.texto || salvandoDef ? 0.5 : 1 }}
              >
                <BookmarkIcon width={18} height={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {pendente && (
        <NotaModal
          corpoInicial={pendente}
          tagInicial={tagPadrao}
          onCancelar={fecharTudo}
          onSalvar={async (corpo, tag) => {
            const id = await salvarNota({ materia, corpo, tag, questaoOrigemId });
            fecharTudo();
            onSalvo?.(id, corpo);
          }}
        />
      )}
    </>
  );
}

function botaoIcone(ativo: boolean) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 8,
    border: `1.5px solid ${ativo ? C.caneta : C.line}`,
    background: ativo ? C.canetaSoft : "transparent",
    color: ativo ? C.caneta : C.sub,
    cursor: "pointer",
  } as const;
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
  onSalvar: (corpo: string, tag: string) => Promise<void>;
}) {
  const [corpo, setCorpo] = useState(corpoInicial);
  const [tag, setTag] = useState(tagInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!corpo.trim()) {
      setErro("O corpo não pode ficar vazio.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await onSalvar(corpo.trim(), tag.trim() || "geral");
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
