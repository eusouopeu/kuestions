import { useEffect, useRef, useState } from "react";
import { C, campo, cartao, mono, rotulo } from "../theme";
import Botao from "./Botao";
import Chip from "./Chip";
import CampoCorpoNota from "./CampoCorpoNota";
import TextoComMarcaTexto from "./TextoComMarcaTexto";
import ResumoQuestaoRespondida from "./ResumoQuestaoRespondida";
import { apagarConceito, atualizarNota, buscarQuestaoPorId } from "../lib/repo";
import { dataCurta } from "../lib/texto";
import type { ConceitoSalvo, QuestaoRespondida } from "../lib/types";

const LARGURA_APAGAR = 76;

/**
 * Um cartão de nota, na íntegra (sem tela de detalhe própria — ver
 * comentário em NotasTab.tsx). Três modos, mutuamente exclusivos:
 *
 * - Visualização: corpo inteiro com marca-texto real (não `{{c1::…}}` cru),
 *   tags abaixo — a primeira (tag de origem) é um botão que abre/fecha a
 *   questão que originou a nota; toque em qualquer outro lugar do cartão
 *   entra em edição. Arrastar ← revela "Apagar" à direita; arrastar →
 *   esconde de novo.
 * - Edição: corpo (CampoCorpoNota) + editor de tags, que trava a tag de
 *   origem contra remoção mas permite adicionar/remover as demais.
 * - Seleção múltipla (`selecionando`): o cartão inteiro vira um botão de
 *   marcar/desmarcar, sem arrasto nem edição — mesmo papel do checkbox que
 *   já existia, só que agora mostrando o conteúdo por inteiro também.
 */
export default function NotaCard({
  conceito,
  mostrarMateria = false,
  selecionando,
  marcada,
  onToggleSelecao,
  onAtualizado,
  onApagado,
}: {
  conceito: ConceitoSalvo;
  mostrarMateria?: boolean;
  selecionando: boolean;
  marcada: boolean;
  onToggleSelecao: () => void;
  onAtualizado: (c: ConceitoSalvo) => void;
  onApagado: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [corpo, setCorpo] = useState(conceito.corpo);
  const [tags, setTags] = useState<string[]>(conceito.tags);
  const [novaTag, setNovaTag] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroEdit, setErroEdit] = useState<string | null>(null);

  const [vendoOrigem, setVendoOrigem] = useState(false);
  const [confirmandoApagar, setConfirmandoApagar] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erroApagar, setErroApagar] = useState<string | null>(null);

  const [dx, setDx] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const arrastando = useRef<number | null>(null);
  const arrasto = useRef(false);
  const base = useRef(0);

  const origem = conceito.tags[0] ?? "";
  const extras = conceito.tags.slice(1);

  function iniciarEdicao() {
    setCorpo(conceito.corpo);
    setTags(conceito.tags);
    setNovaTag("");
    setErroEdit(null);
    setEditando(true);
  }

  function adicionarTag() {
    const t = novaTag.trim();
    if (!t || tags.includes(t)) {
      setNovaTag("");
      return;
    }
    setTags((ts) => [...ts, t]);
    setNovaTag("");
  }

  function removerTag(t: string) {
    // O primeiro item (tag de origem) nunca aparece com botão de remover —
    // ver o `.slice(1)` na renderização — mas o filtro abaixo é a garantia
    // de verdade contra removê-lo por engano.
    if (t === tags[0]) return;
    setTags((ts) => ts.filter((x) => x !== t));
  }

  async function salvarEdicao() {
    setSalvando(true);
    setErroEdit(null);
    try {
      await atualizarNota(conceito.id, corpo.trim(), tags);
      onAtualizado({ ...conceito, corpo: corpo.trim(), tags });
      setEditando(false);
    } catch {
      setErroEdit("Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function apagar() {
    setApagando(true);
    try {
      await apagarConceito(conceito.id);
      onApagado();
    } catch {
      setErroApagar("Falha ao apagar.");
      setApagando(false);
    }
  }

  function down(e: React.PointerEvent<HTMLDivElement>) {
    arrastando.current = e.clientX;
    arrasto.current = false;
    base.current = revelado ? -LARGURA_APAGAR : 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* setPointerCapture não é crítico: sem ele o gesto ainda funciona */
    }
  }
  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (arrastando.current == null) return;
    const d = e.clientX - arrastando.current;
    if (Math.abs(d) > 8) arrasto.current = true;
    setDx(Math.max(-LARGURA_APAGAR, Math.min(0, base.current + d)));
  }
  function up() {
    arrastando.current = null;
    if (arrasto.current) {
      const abrir = dx < -LARGURA_APAGAR / 2;
      setRevelado(abrir);
      setDx(abrir ? -LARGURA_APAGAR : 0);
      return;
    }
    // Toque simples (sem arrasto): com o botão de apagar revelado, só fecha;
    // senão, abre a edição.
    if (revelado) {
      setRevelado(false);
      setDx(0);
    } else {
      iniciarEdicao();
    }
  }
  function cancelarArrasto() {
    arrastando.current = null;
    setDx(revelado ? -LARGURA_APAGAR : 0);
  }

  const tagsRow = (interativo: boolean) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 0, marginTop: 8 }}>
      {origem &&
        (interativo ? (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setVendoOrigem((v) => !v);
            }}
            style={{
              ...mono,
              fontSize: 11,
              background: C.canetaSoft,
              color: C.caneta,
              padding: "3px 8px",
              borderRadius: 4,
              marginRight: 6,
              marginBottom: 6,
              border: "none",
              cursor: conceito.questao_origem_id != null ? "pointer" : "default",
            }}
          >
            {origem}
            {conceito.questao_origem_id != null ? (vendoOrigem ? " ▲" : " ▾") : ""}
          </button>
        ) : (
          <Chip>{origem}</Chip>
        ))}
      {extras.map((t) => (
        <Chip key={t}>{t}</Chip>
      ))}
      {mostrarMateria && <Chip tom="neutro">{conceito.materia}</Chip>}
    </div>
  );

  if (selecionando) {
    return (
      <button
        onClick={onToggleSelecao}
        style={{
          ...cartao,
          display: "flex",
          width: "100%",
          alignItems: "flex-start",
          gap: 10,
          textAlign: "left",
          marginBottom: 8,
          cursor: "pointer",
          borderColor: marcada ? C.caneta : C.line,
          background: marcada ? C.canetaSoft : C.card,
        }}
      >
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            marginTop: 3,
            width: 16,
            height: 16,
            borderRadius: 4,
            border: `1.5px solid ${marcada ? C.caneta : C.line}`,
            background: marcada ? C.caneta : "transparent",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...mono, fontSize: 10.5, color: C.sub, marginBottom: 4 }}>
            {dataCurta(conceito.ts)}
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>
            {conceito.corpo ? <TextoComMarcaTexto texto={conceito.corpo} /> : "Sem conteúdo."}
          </p>
          {tagsRow(false)}
        </div>
      </button>
    );
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
        <button
          onClick={() => {
            setRevelado(false);
            setDx(0);
            setConfirmandoApagar(true);
          }}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: LARGURA_APAGAR,
            background: C.erro,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            ...mono,
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          Apagar
        </button>

        <div
          onPointerDown={editando ? undefined : down}
          onPointerMove={editando ? undefined : move}
          onPointerUp={editando ? undefined : up}
          onPointerCancel={editando ? undefined : cancelarArrasto}
          style={{
            ...cartao,
            position: "relative",
            zIndex: 1,
            transform: `translateX(${dx}px)`,
            transition: arrastando.current == null ? "transform .15s" : "none",
            touchAction: "pan-y",
            cursor: editando ? "default" : "pointer",
            userSelect: editando ? "auto" : "none",
          }}
        >
        {editando ? (
          <div>
            <CampoCorpoNota valor={corpo} onChange={setCorpo} minHeight={140} />

            <div style={{ height: 14 }} />
            <label style={rotulo}>Tags</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {tags[0] && (
                <span
                  style={{
                    ...mono,
                    fontSize: 11,
                    background: C.canetaSoft,
                    color: C.caneta,
                    padding: "3px 8px",
                    borderRadius: 4,
                  }}
                  title="Tag de origem — não pode ser removida"
                >
                  {tags[0]}
                </span>
              )}
              {tags.slice(1).map((t) => (
                <span
                  key={t}
                  style={{
                    ...mono,
                    fontSize: 11,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: C.canetaSoft,
                    color: C.caneta,
                    padding: "3px 6px 3px 8px",
                    borderRadius: 4,
                  }}
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removerTag(t)}
                    aria-label={`Remover tag ${t}`}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.caneta,
                      cursor: "pointer",
                      padding: 0,
                      fontSize: 13,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={{ ...campo, ...mono, fontSize: 13, flex: 1 }}
                value={novaTag}
                onChange={(e) => setNovaTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarTag();
                  }
                }}
                placeholder="Nova tag"
              />
              <Botao tipo="fantasma" onClick={adicionarTag} style={{ maxWidth: 110, flexShrink: 0 }}>
                Adicionar
              </Botao>
            </div>

            {erroEdit && (
              <div style={{ ...mono, fontSize: 12, color: C.erro, marginTop: 10 }}>{erroEdit}</div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <Botao tipo="fantasma" onClick={() => setEditando(false)} disabled={salvando} style={{ flex: 1 }}>
                Cancelar
              </Botao>
              <Botao tipo="tinta" onClick={salvarEdicao} disabled={salvando} style={{ flex: 1 }}>
                {salvando ? "Salvando…" : "Salvar alterações"}
              </Botao>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ ...mono, fontSize: 10.5, color: C.sub }}>{dataCurta(conceito.ts)}</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
              {conceito.corpo ? <TextoComMarcaTexto texto={conceito.corpo} /> : "Sem conteúdo."}
            </p>
            {tagsRow(true)}

            {vendoOrigem && conceito.questao_origem_id != null && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                style={{ marginTop: 10 }}
              >
                <QuestaoOrigem id={conceito.questao_origem_id} />
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {confirmandoApagar && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: C.erroSoft,
            border: `1.5px solid ${C.erro}`,
            borderRadius: 10,
            padding: "12px 14px",
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
            Apagar esta nota desta pasta? Não há como desfazer.
          </div>
          {erroApagar && (
            <div style={{ ...mono, fontSize: 12, color: C.erro, marginBottom: 10 }}>{erroApagar}</div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Botao
              tipo="fantasma"
              onClick={() => setConfirmandoApagar(false)}
              disabled={apagando}
              style={{ background: C.card, flex: 1 }}
            >
              Cancelar
            </Botao>
            <Botao onClick={apagar} disabled={apagando} style={{ background: C.erro, borderColor: C.erro, flex: 1 }}>
              {apagando ? "Apagando…" : "Apagar"}
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}

/** Busca a questão que originou a nota por id e delega a exibição a
 * ResumoQuestaoRespondida (compartilhado com a busca global, ver NotasTab). */
function QuestaoOrigem({ id }: { id: number }) {
  const [questao, setQuestao] = useState<QuestaoRespondida | null | undefined>(undefined);

  useEffect(() => {
    buscarQuestaoPorId(id)
      .then(setQuestao)
      .catch(() => setQuestao(null));
  }, [id]);

  if (questao === undefined) {
    return (
      <div style={{ ...mono, fontSize: 12, color: C.sub, padding: "8px 0" }}>Carregando…</div>
    );
  }
  if (questao === null) {
    return (
      <div style={{ ...mono, fontSize: 12, color: C.sub, padding: "8px 0" }}>
        Questão de origem não encontrada (pode ter sido removida).
      </div>
    );
  }

  return <ResumoQuestaoRespondida questao={questao} />;
}
