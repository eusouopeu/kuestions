import { useCallback, useEffect, useState } from "react";
import { FolderIcon } from "@heroicons/react/24/outline";
import { C, campo, cartao, disp, mono, rotulo } from "../theme";
import Shell, { Vazio } from "../components/Shell";
import Segmented from "../components/Segmented";
import Botao from "../components/Botao";
import Chip from "../components/Chip";
import {
  apagarConceito,
  atualizarNota,
  buscarNotas,
  contarNotasPendentesPorMateria,
  listarConceitos,
  listarNotasPendentes,
  listarPastas,
  registrarRevisaoNota,
} from "../lib/repo";
import { exportarArquivo, paraCSV } from "../lib/exportar";
import { contarItensLista, slugify } from "../lib/texto";
import type { ConceitoSalvo } from "../lib/types";

type Ordem = "data" | "alfabetica";

function dataCurta(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/** Banco de notas: pastas por matéria → lista → detalhe editável. */
export default function NotasTab({
  ativa,
  onQuestoes,
}: {
  ativa: boolean;
  onQuestoes: () => void;
}) {
  const [pastas, setPastas] = useState<{ materia: string; total: number }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [pasta, setPasta] = useState<string | null>(null);
  // Revisão ativa por repetição espaçada das notas salvas (ver
  // registrarRevisaoNota em repo.ts) — `null` = fora do modo revisão;
  // `{ materia: null }` = revisão cruzando todas as matérias.
  const [revisando, setRevisando] = useState<{ materia: string | null } | null>(null);
  const [pendentesPorMateria, setPendentesPorMateria] = useState<
    { materia: string; total: number; pendentes: number }[]
  >([]);
  const [ordem, setOrdem] = useState<Ordem>("data");
  const [itens, setItens] = useState<ConceitoSalvo[]>([]);
  const [aberto, setAberto] = useState<ConceitoSalvo | null>(null);
  const [exportando, setExportando] = useState(false);
  const [erroExport, setErroExport] = useState<string | null>(null);
  const [csvExportado, setCsvExportado] = useState(false);

  // Busca cross-matéria: só ativa na tela de pastas (pasta === null). Mantida
  // separada da navegação em pastas para que voltar do detalhe de uma nota
  // aberta a partir de um resultado de busca preserve o texto buscado.
  const [busca, setBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState<ConceitoSalvo[]>([]);

  // Seleção múltipla dentro de uma pasta, para apagar/exportar um subconjunto
  // sem precisar ir nota por nota.
  const [selecionando, setSelecionando] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [confirmandoApagarSelecionadas, setConfirmandoApagarSelecionadas] = useState(false);
  const [apagandoSelecionadas, setApagandoSelecionadas] = useState(false);

  const carregarPastas = useCallback(() => {
    setCarregando(true);
    Promise.all([listarPastas(), contarNotasPendentesPorMateria()])
      .then(([p, pend]) => {
        setPastas(p);
        setPendentesPorMateria(pend);
      })
      .catch(() => {
        setPastas([]);
        setPendentesPorMateria([]);
      })
      .finally(() => setCarregando(false));
  }, []);

  // Dispara na montagem inicial e toda vez que o usuário reabre esta aba —
  // como as abas agora ficam montadas (ver App.tsx), sem isto uma nota salva
  // em Questões não apareceria aqui até um refresh manual.
  useEffect(() => {
    if (ativa) carregarPastas();
  }, [ativa, carregarPastas]);

  const carregarItens = useCallback(() => {
    if (!pasta) return;
    listarConceitos(pasta, ordem).then(setItens).catch(() => setItens([]));
  }, [pasta, ordem]);

  useEffect(carregarItens, [carregarItens]);

  // Sai do modo de seleção sempre que a lista muda de baixo (troca de pasta
  // ou de ordenação) — uma seleção antiga não deve sobreviver a isso.
  useEffect(() => {
    setSelecionando(false);
    setSelecionados(new Set());
    setConfirmandoApagarSelecionadas(false);
  }, [pasta, ordem]);

  // Debounce simples: evita uma consulta a cada tecla digitada.
  useEffect(() => {
    const termo = busca.trim();
    if (!termo) {
      setResultadosBusca([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const t = setTimeout(() => {
      buscarNotas(termo)
        .then(setResultadosBusca)
        .catch(() => setResultadosBusca([]))
        .finally(() => setBuscando(false));
    }, 250);
    return () => clearTimeout(t);
  }, [busca]);

  async function exportarCSV(itensParaExportar: ConceitoSalvo[], nomeBase: string) {
    if (!itensParaExportar.length || exportando) return;
    setExportando(true);
    setErroExport(null);
    setCsvExportado(false);
    try {
      const linhas = itensParaExportar.map((n) => {
        const nItens = contarItensLista(n.corpo);
        const titulo = nItens > 0 ? `${n.titulo} (${nItens})` : n.titulo;
        return [titulo, n.corpo, n.tag];
      });
      await exportarArquivo(`flashcards-${slugify(nomeBase)}.csv`, paraCSV(linhas));
      setCsvExportado(true);
      setTimeout(() => setCsvExportado(false), 2500);
    } catch (e) {
      setErroExport(e instanceof Error ? e.message : "Falha ao exportar.");
    } finally {
      setExportando(false);
    }
  }

  function alternarSelecao(id: number) {
    setSelecionados((s) => {
      const novo = new Set(s);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function apagarSelecionadas() {
    setApagandoSelecionadas(true);
    try {
      for (const id of selecionados) {
        try {
          await apagarConceito(id);
        } catch (e) {
          console.error("apagar nota selecionada", e);
        }
      }
      setConfirmandoApagarSelecionadas(false);
      setSelecionando(false);
      setSelecionados(new Set());
      carregarItens();
      carregarPastas();
    } finally {
      setApagandoSelecionadas(false);
    }
  }

  /* ---------- Revisão ativa (repetição espaçada) ---------- */
  if (revisando) {
    return (
      <Shell kicker="NOTAS" titulo="Revisão">
        <RevisaoNotas
          materia={revisando.materia}
          onSair={() => {
            setRevisando(null);
            carregarPastas();
          }}
        />
      </Shell>
    );
  }

  /* ---------- Detalhe ---------- */
  if (aberto) {
    return (
      <Shell kicker="NOTAS" titulo={aberto.titulo}>
        <Detalhe
          conceito={aberto}
          onVoltar={() => setAberto(null)}
          onSalvo={(c) => {
            setAberto(c);
            carregarItens();
            setResultadosBusca((rs) => rs.map((r) => (r.id === c.id ? c : r)));
          }}
          onApagado={() => {
            setAberto(null);
            carregarItens();
            carregarPastas();
            setResultadosBusca((rs) => rs.filter((r) => r.id !== aberto.id));
          }}
        />
      </Shell>
    );
  }

  /* ---------- Lista de uma pasta ---------- */
  if (pasta) {
    const todasSelecionadas = itens.length > 0 && selecionados.size === itens.length;
    const pendentesPasta = pendentesPorMateria.find((p) => p.materia === pasta)?.pendentes ?? 0;
    return (
      <Shell kicker={`NOTAS · ${itens.length} NOTA${itens.length === 1 ? "" : "S"}`} titulo={pasta}>
        {pendentesPasta > 0 && (
          <Botao
            tipo="tinta"
            onClick={() => setRevisando({ materia: pasta })}
            style={{ marginBottom: 14 }}
          >
            Revisar pendentes desta pasta · {pendentesPasta}
          </Botao>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={rotulo}>Ordenar</label>
          <Segmented
            valor={ordem}
            opcoes={[
              { id: "data" as Ordem, label: "Mais recentes" },
              { id: "alfabetica" as Ordem, label: "A–Z" },
            ]}
            onChange={setOrdem}
          />
        </div>

        {itens.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {selecionando ? (
              <div
                style={{
                  ...cartao,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() =>
                    setSelecionados(todasSelecionadas ? new Set() : new Set(itens.map((i) => i.id)))
                  }
                  style={{
                    ...mono,
                    fontSize: 11.5,
                    background: "none",
                    border: "none",
                    color: C.caneta,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {todasSelecionadas ? "Desmarcar todas" : "Selecionar todas"}
                </button>
                <span style={{ ...mono, fontSize: 11.5, color: C.sub }}>
                  {selecionados.size} selecionada{selecionados.size === 1 ? "" : "s"}
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => {
                      setSelecionando(false);
                      setSelecionados(new Set());
                    }}
                    style={{
                      ...mono,
                      fontSize: 11.5,
                      background: "none",
                      border: "none",
                      color: C.sub,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Botao
                  tipo="fantasma"
                  onClick={() => exportarCSV(itens, pasta)}
                  disabled={exportando}
                  style={csvExportado ? { borderColor: C.ok, color: C.ok, flex: 1 } : { flex: 1 }}
                >
                  {exportando
                    ? "Exportando…"
                    : csvExportado
                      ? "✓ Exportado"
                      : `Exportar flashcards (CSV) · ${itens.length}`}
                </Botao>
                <Botao tipo="fantasma" onClick={() => setSelecionando(true)} style={{ maxWidth: 120 }}>
                  Selecionar
                </Botao>
              </div>
            )}
            {erroExport && (
              <div style={{ ...mono, fontSize: 11.5, color: C.erro, marginTop: 6 }}>
                {erroExport}
              </div>
            )}
          </div>
        )}

        {selecionando && selecionados.size > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <Botao
              tipo="fantasma"
              onClick={() => exportarCSV(itens.filter((i) => selecionados.has(i.id)), pasta)}
              disabled={exportando}
              style={{ flex: 1 }}
            >
              Exportar seleção ({selecionados.size})
            </Botao>
            <Botao
              onClick={() => setConfirmandoApagarSelecionadas(true)}
              style={{ flex: 1, background: C.erro, borderColor: C.erro }}
            >
              Apagar seleção
            </Botao>
          </div>
        )}

        {confirmandoApagarSelecionadas && (
          <div
            style={{
              background: C.erroSoft,
              border: `1.5px solid ${C.erro}`,
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
              Apagar {selecionados.size} nota{selecionados.size === 1 ? "" : "s"} selecionada
              {selecionados.size === 1 ? "" : "s"}? Não há como desfazer.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Botao
                tipo="fantasma"
                onClick={() => setConfirmandoApagarSelecionadas(false)}
                disabled={apagandoSelecionadas}
                style={{ background: C.card }}
              >
                Cancelar
              </Botao>
              <Botao
                onClick={apagarSelecionadas}
                disabled={apagandoSelecionadas}
                style={{ background: C.erro, borderColor: C.erro }}
              >
                {apagandoSelecionadas ? "Apagando…" : "Apagar"}
              </Botao>
            </div>
          </div>
        )}

        {itens.length === 0 ? (
          <Vazio>Esta pasta está vazia.</Vazio>
        ) : (
          itens.map((c) => {
            const marcada = selecionados.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => (selecionando ? alternarSelecao(c.id) : setAberto(c))}
                style={{
                  ...cartao,
                  display: "flex",
                  width: "100%",
                  alignItems: "flex-start",
                  gap: 10,
                  textAlign: "left",
                  padding: "12px 14px",
                  marginBottom: 8,
                  cursor: "pointer",
                  borderColor: marcada ? C.caneta : C.line,
                  background: marcada ? C.canetaSoft : C.card,
                }}
              >
                {selecionando && (
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
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "baseline",
                    }}
                  >
                    <span style={{ ...disp, fontSize: 15, fontWeight: 600 }}>{c.titulo}</span>
                    <span style={{ ...mono, fontSize: 10.5, color: C.sub, flexShrink: 0 }}>
                      {dataCurta(c.ts)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: C.sub,
                      marginTop: 4,
                      lineHeight: 1.45,
                      // Trecho do corpo: 2 linhas, o resto no detalhe.
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {c.corpo || "Sem conteúdo."}
                  </div>
                  {c.tag && (
                    <div style={{ marginTop: 6 }}>
                      <Chip>{c.tag}</Chip>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}

        <button
          onClick={() => setPasta(null)}
          style={{
            ...mono,
            marginTop: 18,
            fontSize: 12,
            background: "none",
            border: "none",
            color: C.sub,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          ← Todas as pastas
        </button>
      </Shell>
    );
  }

  /* ---------- Pastas / busca ---------- */
  const buscaAtiva = busca.trim().length > 0;
  const totalPendentes = pendentesPorMateria.reduce((a, p) => a + p.pendentes, 0);

  return (
    <Shell kicker="BANCO DE NOTAS" titulo="Notas">
      {totalPendentes > 0 && !buscaAtiva && (
        <Botao
          tipo="tinta"
          onClick={() => setRevisando({ materia: null })}
          style={{ marginBottom: 14 }}
        >
          Revisar notas pendentes · {totalPendentes}
        </Botao>
      )}

      {pastas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input
            style={campo}
            placeholder="Buscar em título, corpo ou tag…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      )}

      {buscaAtiva ? (
        buscando ? (
          <Vazio>Buscando…</Vazio>
        ) : resultadosBusca.length === 0 ? (
          <Vazio>Nenhuma nota encontrada para "{busca.trim()}".</Vazio>
        ) : (
          <>
            <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
              {resultadosBusca.length} RESULTADO{resultadosBusca.length === 1 ? "" : "S"}
            </div>
            {resultadosBusca.map((c) => (
              <button
                key={c.id}
                onClick={() => setAberto(c)}
                style={{
                  ...cartao,
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ ...disp, fontSize: 15, fontWeight: 600 }}>{c.titulo}</span>
                  <span style={{ ...mono, fontSize: 10.5, color: C.sub, flexShrink: 0 }}>
                    {dataCurta(c.ts)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.sub,
                    marginTop: 4,
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {c.corpo || "Sem conteúdo."}
                </div>
                <div style={{ marginTop: 6 }}>
                  <Chip tom="neutro">{c.materia}</Chip>
                  {c.tag && <Chip>{c.tag}</Chip>}
                </div>
              </button>
            ))}
          </>
        )
      ) : carregando ? (
        <Vazio>Carregando…</Vazio>
      ) : pastas.length === 0 ? (
        <Vazio>
          <p style={{ margin: "0 0 14px" }}>
            Nenhuma nota salva ainda.
            <br />
            Ao responder uma questão, selecione um trecho de texto para salvá-lo aqui.
          </p>
          <Botao tipo="tinta" onClick={onQuestoes} style={{ maxWidth: 220, margin: "0 auto" }}>
            Ir para Questões
          </Botao>
        </Vazio>
      ) : (
        pastas.map((p) => (
          <button
            key={p.materia}
            onClick={() => setPasta(p.materia)}
            style={{
              ...cartao,
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              textAlign: "left",
              padding: "14px",
              marginBottom: 8,
              cursor: "pointer",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FolderIcon width={20} height={20} stroke={C.caneta} strokeWidth={1.8} />
              <span style={{ ...disp, fontSize: 15, fontWeight: 600 }}>{p.materia}</span>
            </span>
            <span style={{ ...mono, fontSize: 12, color: C.sub }}>{p.total}</span>
          </button>
        ))
      )}
    </Shell>
  );
}

/* ---------- Detalhe / edição ---------- */

function Detalhe({
  conceito,
  onVoltar,
  onSalvo,
  onApagado,
}: {
  conceito: ConceitoSalvo;
  onVoltar: () => void;
  onSalvo: (c: ConceitoSalvo) => void;
  onApagado: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(conceito.titulo);
  const [corpo, setCorpo] = useState(conceito.corpo);
  const [tag, setTag] = useState(conceito.tag);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    const t = titulo.trim();
    if (!t) {
      setErro("O título não pode ficar vazio.");
      return;
    }
    setErro(null);
    try {
      const tagFinal = tag.trim() || "geral";
      await atualizarNota(conceito.id, t, corpo.trim(), tagFinal);
      onSalvo({ ...conceito, titulo: t, corpo: corpo.trim(), tag: tagFinal });
      setEditando(false);
    } catch {
      setErro("Falha ao salvar.");
    }
  }

  if (editando) {
    return (
      <div>
        <div style={{ marginBottom: 14 }}>
          <label style={rotulo}>Título</label>
          <input style={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={rotulo}>Corpo</label>
          <textarea
            style={{ ...campo, minHeight: 160, resize: "vertical", lineHeight: 1.5 }}
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={rotulo}>Tag</label>
          <input style={{ ...campo, ...mono, fontSize: 13 }} value={tag} onChange={(e) => setTag(e.target.value)} />
        </div>
        {erro && (
          <div style={{ ...mono, fontSize: 12, color: C.erro, marginBottom: 10 }}>{erro}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Botao tipo="tinta" onClick={salvar}>
            Salvar alterações
          </Botao>
          <Botao
            tipo="fantasma"
            onClick={() => {
              setTitulo(conceito.titulo);
              setCorpo(conceito.corpo);
              setTag(conceito.tag);
              setErro(null);
              setEditando(false);
            }}
          >
            Cancelar
          </Botao>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...cartao, marginBottom: 14 }}>
        <div style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
          {conceito.materia.toUpperCase()} · {dataCurta(conceito.ts)}
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>
          {conceito.corpo || "Sem conteúdo. Toque em Editar para escrever."}
        </p>
        {conceito.tag && <Chip>{conceito.tag}</Chip>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Botao tipo="fantasma" onClick={() => setEditando(true)}>
          Editar
        </Botao>

        {confirmando ? (
          <div
            style={{
              background: C.erroSoft,
              border: `1.5px solid ${C.erro}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
              Apagar “{conceito.titulo}” desta pasta? Não há como desfazer.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Botao
                tipo="fantasma"
                onClick={() => setConfirmando(false)}
                style={{ background: C.card }}
              >
                Cancelar
              </Botao>
              <Botao
                onClick={async () => {
                  try {
                    await apagarConceito(conceito.id);
                    onApagado();
                  } catch {
                    setErro("Falha ao apagar.");
                    setConfirmando(false);
                  }
                }}
                style={{ background: C.erro, borderColor: C.erro }}
              >
                Apagar
              </Botao>
            </div>
          </div>
        ) : (
          <Botao tipo="fantasma" onClick={() => setConfirmando(true)} style={{ color: C.erro }}>
            Apagar nota
          </Botao>
        )}

        {erro && <div style={{ ...mono, fontSize: 12, color: C.erro }}>{erro}</div>}
      </div>

      <button
        onClick={onVoltar}
        style={{
          ...mono,
          marginTop: 18,
          fontSize: 12,
          background: "none",
          border: "none",
          color: C.sub,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        ← Voltar à lista
      </button>
    </div>
  );
}

/* ---------- Revisão ativa (repetição espaçada) ---------- */

/**
 * Flashcard virado: mostra o título, o usuário se autoavalia antes de virar
 * ("lembrei" / "não lembrei" do conteúdo), então revela o corpo. Mesmo
 * esquema de caixas de Leitner de "Refazer erradas" (ver
 * registrarRevisaoNota em repo.ts), aplicado à nota em vez à questão de
 * origem — permite revisar ativamente sem depender do Anki.
 */
function RevisaoNotas({
  materia,
  onSair,
}: {
  materia: string | null;
  onSair: () => void;
}) {
  const [fila, setFila] = useState<ConceitoSalvo[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [lembradas, setLembradas] = useState(0);
  const [avaliando, setAvaliando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarNotasPendentes(materia, { limite: 100 })
      .then((qs) => {
        if (!qs.length) {
          setErro("Nenhuma nota pendente de revisão neste filtro.");
          return;
        }
        setFila(qs);
      })
      .catch(() => setErro("Falha ao carregar as notas."));
  }, [materia]);

  if (erro) {
    return (
      <div>
        <Vazio>{erro}</Vazio>
        <Botao tipo="fantasma" onClick={onSair} style={{ marginTop: 12 }}>
          Voltar
        </Botao>
      </div>
    );
  }
  if (!fila) return <Vazio>Carregando…</Vazio>;

  const nota = fila[idx];
  const ultima = idx === fila.length - 1;

  async function avaliar(lembrou: boolean) {
    if (avaliando) return;
    setAvaliando(true);
    try {
      await registrarRevisaoNota(nota.id, lembrou);
      if (lembrou) setLembradas((n) => n + 1);
    } catch (e) {
      console.error("registrar revisão de nota", e);
    } finally {
      setAvaliando(false);
    }
    if (ultima) {
      onSair();
      return;
    }
    setRevelado(false);
    setIdx((i) => i + 1);
  }

  return (
    <div>
      <div style={{ ...mono, fontSize: 12, color: C.sub, textAlign: "center", marginBottom: 14 }}>
        Revisão {idx + 1}/{fila.length} · {materia ?? "todas as matérias"}
      </div>

      <div style={{ ...cartao, minHeight: 180, display: "flex", flexDirection: "column" }}>
        <div style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.8, marginBottom: 10 }}>
          {nota.materia.toUpperCase()}
          {nota.tag ? ` · ${nota.tag}` : ""}
        </div>
        <div style={{ ...disp, fontSize: 18, fontWeight: 700 }}>{nota.titulo}</div>
        {revelado && (
          <p
            style={{
              fontSize: 14.5,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              margin: "14px 0 0",
              paddingTop: 12,
              borderTop: `1.5px dashed ${C.line}`,
            }}
          >
            {nota.corpo || "Sem conteúdo."}
          </p>
        )}
      </div>

      {!revelado ? (
        <Botao onClick={() => setRevelado(true)} style={{ marginTop: 16 }}>
          Mostrar conteúdo
        </Botao>
      ) : (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Botao
            tipo="fantasma"
            onClick={() => avaliar(false)}
            disabled={avaliando}
            style={{ flex: 1, color: C.erro }}
          >
            Não lembrei
          </Botao>
          <Botao onClick={() => avaliar(true)} disabled={avaliando} style={{ flex: 1 }}>
            Lembrei
          </Botao>
        </div>
      )}

      <button
        onClick={onSair}
        style={{
          ...mono,
          marginTop: 18,
          fontSize: 12,
          background: "none",
          border: "none",
          color: C.sub,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Sair da revisão{lembradas ? ` (${lembradas} lembrada${lembradas > 1 ? "s" : ""})` : ""}
      </button>
    </div>
  );
}
