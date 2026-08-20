import { useCallback, useEffect, useState } from "react";
import { FolderIcon } from "@heroicons/react/24/outline";
import { C, campo, cartao, disp, mono } from "../theme";
import Shell, { Vazio } from "../components/Shell";
import Segmented from "../components/Segmented";
import Botao from "../components/Botao";
import NotaCard from "../components/NotaCard";
import {
  apagarConceito,
  buscarNotas,
  buscarQuestoesRespondidas,
  contarNotasPendentesPorMateria,
  listarConceitos,
  listarNotasPendentes,
  listarNotasPorTag,
  listarPastas,
  listarTagsComContagem,
  registrarRevisaoNota,
} from "../lib/repo";
import { exportarArquivo, exportarArquivoBinario } from "../lib/exportar";
import { gerarArquivosFlashcards } from "../lib/flashcards";
import { slugify } from "../lib/texto";
import TextoComMarcaTexto from "../components/TextoComMarcaTexto";
import ResumoQuestaoRespondida from "../components/ResumoQuestaoRespondida";
import type { ConceitoSalvo, QuestaoRespondida } from "../lib/types";

/** Banco de notas: pastas por matéria → lista, cada nota por inteiro (ver
 * NotaCard) — não há mais uma tela de detalhe separada: visualizar, editar,
 * ver a questão de origem e apagar acontecem tudo dentro do próprio cartão
 * da nota, na lista. */
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

  // Nuvem de tags: outra forma de navegar as notas, cruzando matérias (a
  // mesma tag pode aparecer em notas de matérias diferentes) — alternativa à
  // navegação por pasta, só na tela de topo (pasta === null, busca inativa).
  const [modoTop, setModoTop] = useState<"pastas" | "tags">("pastas");
  const [tags, setTags] = useState<{ tag: string; total: number }[]>([]);
  const [carregandoTags, setCarregandoTags] = useState(false);
  const [tagAberta, setTagAberta] = useState<string | null>(null);
  const [itensTag, setItensTag] = useState<ConceitoSalvo[] | null>(null);
  // Revisão ativa por repetição espaçada das notas salvas (ver
  // registrarRevisaoNota em repo.ts) — `null` = fora do modo revisão;
  // `{ materia: null }` = revisão cruzando todas as matérias.
  const [revisando, setRevisando] = useState<{ materia: string | null } | null>(null);
  const [pendentesPorMateria, setPendentesPorMateria] = useState<
    { materia: string; total: number; pendentes: number }[]
  >([]);
  const [itens, setItens] = useState<ConceitoSalvo[]>([]);
  const [exportando, setExportando] = useState(false);
  const [erroExport, setErroExport] = useState<string | null>(null);
  const [csvExportado, setCsvExportado] = useState(false);
  const [exportandoApkg, setExportandoApkg] = useState(false);
  const [apkgExportado, setApkgExportado] = useState(false);

  // Busca global (notas + questões já respondidas — enunciado/comentário):
  // só ativa na tela de pastas (pasta === null). Mantida separada da
  // navegação em pastas para que trocar de pasta não perca o texto buscado.
  const [busca, setBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState<ConceitoSalvo[]>([]);
  const [resultadosQuestoes, setResultadosQuestoes] = useState<QuestaoRespondida[]>([]);
  const [questaoAberta, setQuestaoAberta] = useState<number | null>(null);

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
    listarConceitos(pasta, "data").then(setItens).catch(() => setItens([]));
  }, [pasta]);

  useEffect(carregarItens, [carregarItens]);

  // Nuvem de tags: carrega só quando o modo está ativo (evita uma consulta
  // extra em toda visita à aba para quem nunca usa essa vista).
  useEffect(() => {
    if (!ativa || pasta || modoTop !== "tags") return;
    setCarregandoTags(true);
    listarTagsComContagem()
      .then(setTags)
      .catch(() => setTags([]))
      .finally(() => setCarregandoTags(false));
  }, [ativa, pasta, modoTop]);

  function abrirTag(tag: string) {
    setTagAberta(tag);
    setItensTag(null);
    listarNotasPorTag(tag)
      .then(setItensTag)
      .catch(() => setItensTag([]));
  }

  // Sai do modo de seleção sempre que a pasta muda — uma seleção antiga não
  // deve sobreviver a isso.
  useEffect(() => {
    setSelecionando(false);
    setSelecionados(new Set());
    setConfirmandoApagarSelecionadas(false);
  }, [pasta]);

  // Debounce simples: evita uma consulta a cada tecla digitada. Busca em
  // paralelo nas duas fontes (notas e questões respondidas) — ver
  // buscarNotas/buscarQuestoesRespondidas em repo.ts.
  useEffect(() => {
    const termo = busca.trim();
    if (!termo) {
      setResultadosBusca([]);
      setResultadosQuestoes([]);
      setQuestaoAberta(null);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const t = setTimeout(() => {
      Promise.all([buscarNotas(termo), buscarQuestoesRespondidas(termo)])
        .then(([notas, questoes]) => {
          setResultadosBusca(notas);
          setResultadosQuestoes(questoes);
          setQuestaoAberta(null);
        })
        .catch(() => {
          setResultadosBusca([]);
          setResultadosQuestoes([]);
        })
        .finally(() => setBuscando(false));
    }, 250);
    return () => clearTimeout(t);
  }, [busca]);

  /**
   * Exporta só o CORPO de cada nota (não o título — ver lib/flashcards.ts): é
   * classificado em Cloze (marca-texto ou lista enumerada) ou Básico
   * (frente/verso por "=", ou fallback frente-só) e sai em até dois arquivos
   * CSV, um por tipo de nota do Anki — misturar os dois formatos num único
   * CSV exigiria de qualquer forma duas importações manuais no Anki.
   */
  async function exportarCSV(itensParaExportar: ConceitoSalvo[], nomeBase: string) {
    if (!itensParaExportar.length || exportando) return;
    setExportando(true);
    setErroExport(null);
    setCsvExportado(false);
    try {
      const { cloze, basico } = gerarArquivosFlashcards(itensParaExportar);
      const slug = slugify(nomeBase);
      if (basico) await exportarArquivo(`flashcards-basico-${slug}.csv`, basico);
      if (cloze) await exportarArquivo(`flashcards-cloze-${slug}.csv`, cloze);
      setCsvExportado(true);
      setTimeout(() => setCsvExportado(false), 2500);
    } catch (e) {
      setErroExport(e instanceof Error ? e.message : "Falha ao exportar.");
    } finally {
      setExportando(false);
    }
  }

  /**
   * Exporta um único .apkg — o formato de import nativo do Anki (ver
   * lib/apkg.ts) — em vez de dois CSVs: cloze e básico misturados no mesmo
   * arquivo, cada nota já com o notetype certo, uma importação só.
   */
  async function exportarApkg(itensParaExportar: ConceitoSalvo[], nomeBase: string) {
    if (!itensParaExportar.length || exportandoApkg) return;
    setExportandoApkg(true);
    setErroExport(null);
    setApkgExportado(false);
    try {
      const { gerarApkg } = await import("../lib/apkg");
      const bytes = await gerarApkg(itensParaExportar, nomeBase);
      const slug = slugify(nomeBase);
      await exportarArquivoBinario(`kuestions-${slug}.apkg`, bytes, "application/octet-stream");
      setApkgExportado(true);
      setTimeout(() => setApkgExportado(false), 2500);
    } catch (e) {
      setErroExport(e instanceof Error ? e.message : "Falha ao exportar .apkg.");
    } finally {
      setExportandoApkg(false);
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
      <Shell titulo="Revisão">
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

  /* ---------- Notas de uma tag (nuvem de tags) ---------- */
  if (tagAberta) {
    return (
      <Shell titulo={tagAberta}>
        <button
          onClick={() => {
            setTagAberta(null);
            setItensTag(null);
          }}
          style={{
            ...mono,
            display: "block",
            marginBottom: 14,
            fontSize: 12,
            background: "none",
            border: "none",
            color: C.sub,
            cursor: "pointer",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          ← Nuvem de tags
        </button>

        {itensTag === null ? (
          <Vazio>Carregando…</Vazio>
        ) : itensTag.length === 0 ? (
          <Vazio>Nenhuma nota com esta tag.</Vazio>
        ) : (
          itensTag.map((c) => (
            <NotaCard
              key={c.id}
              conceito={c}
              mostrarMateria
              selecionando={false}
              marcada={false}
              onToggleSelecao={() => {}}
              onAtualizado={(atualizado) => {
                setItensTag((is) => (is ? is.map((i) => (i.id === atualizado.id ? atualizado : i)) : is));
              }}
              onApagado={() => {
                setItensTag((is) => (is ? is.filter((i) => i.id !== c.id) : is));
              }}
            />
          ))
        )}
      </Shell>
    );
  }

  /* ---------- Lista de uma pasta ---------- */
  if (pasta) {
    const todasSelecionadas = itens.length > 0 && selecionados.size === itens.length;
    const pendentesPasta = pendentesPorMateria.find((p) => p.materia === pasta)?.pendentes ?? 0;
    return (
      <Shell titulo={pasta}>
        <button
          onClick={() => setPasta(null)}
          style={{
            ...mono,
            display: "block",
            marginBottom: 14,
            fontSize: 12,
            background: "none",
            border: "none",
            color: C.sub,
            cursor: "pointer",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          ← Todas as pastas
        </button>

        {pendentesPasta > 0 && (
          <Botao
            tipo="tinta"
            onClick={() => setRevisando({ materia: pasta })}
            style={{ marginBottom: 14 }}
          >
            Revisar pendentes desta pasta · {pendentesPasta}
          </Botao>
        )}

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
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Botao
                    tipo="fantasma"
                    onClick={() => exportarCSV(itens, pasta)}
                    disabled={exportando}
                    style={csvExportado ? { borderColor: C.ok, color: C.ok, flex: 1 } : { flex: 1 }}
                  >
                    {exportando ? "Exportando…" : csvExportado ? "✓ Exportado" : `CSV · ${itens.length}`}
                  </Botao>
                  <Botao
                    tipo="fantasma"
                    onClick={() => exportarApkg(itens, pasta)}
                    disabled={exportandoApkg}
                    style={apkgExportado ? { borderColor: C.ok, color: C.ok, flex: 1 } : { flex: 1 }}
                  >
                    {exportandoApkg ? "Exportando…" : apkgExportado ? "✓ Exportado" : `.apkg · ${itens.length}`}
                  </Botao>
                </div>
                <Botao tipo="fantasma" onClick={() => setSelecionando(true)}>
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
          itens.map((c) => (
            <NotaCard
              key={c.id}
              conceito={c}
              selecionando={selecionando}
              marcada={selecionados.has(c.id)}
              onToggleSelecao={() => alternarSelecao(c.id)}
              onAtualizado={(atualizado) => {
                setItens((is) => is.map((i) => (i.id === atualizado.id ? atualizado : i)));
              }}
              onApagado={() => {
                carregarItens();
                carregarPastas();
              }}
            />
          ))
        )}
      </Shell>
    );
  }

  /* ---------- Pastas / busca ---------- */
  const buscaAtiva = busca.trim().length > 0;
  const totalPendentes = pendentesPorMateria.reduce((a, p) => a + p.pendentes, 0);

  return (
    <Shell titulo="Notas">
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
            placeholder="Buscar em notas e em questões já respondidas…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      )}

      {buscaAtiva ? (
        buscando ? (
          <Vazio>Buscando…</Vazio>
        ) : resultadosBusca.length === 0 && resultadosQuestoes.length === 0 ? (
          <Vazio>Nada encontrado para "{busca.trim()}".</Vazio>
        ) : (
          <>
            {resultadosBusca.length > 0 && (
              <div style={{ marginBottom: resultadosQuestoes.length > 0 ? 22 : 0 }}>
                <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
                  NOTAS · {resultadosBusca.length}
                </div>
                {resultadosBusca.map((c) => (
                  <NotaCard
                    key={c.id}
                    conceito={c}
                    mostrarMateria
                    selecionando={false}
                    marcada={false}
                    onToggleSelecao={() => {}}
                    onAtualizado={(atualizado) => {
                      setResultadosBusca((rs) => rs.map((r) => (r.id === atualizado.id ? atualizado : r)));
                    }}
                    onApagado={() => {
                      setResultadosBusca((rs) => rs.filter((r) => r.id !== c.id));
                      carregarPastas();
                    }}
                  />
                ))}
              </div>
            )}

            {resultadosQuestoes.length > 0 && (
              <div>
                <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
                  QUESTÕES RESPONDIDAS · {resultadosQuestoes.length}
                </div>
                {resultadosQuestoes.map((q) => {
                  const aberta = questaoAberta === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setQuestaoAberta((atual) => (atual === q.id ? null : q.id))}
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
                      {aberta ? (
                        <ResumoQuestaoRespondida questao={q} comBorda={false} />
                      ) : (
                        <>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "baseline",
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ ...mono, fontSize: 10.5, color: C.sub }}>
                              {q.materia.toUpperCase()}
                            </span>
                            <span style={{ ...mono, fontSize: 10.5, color: q.acertou ? C.ok : C.erro, flexShrink: 0 }}>
                              {q.acertou ? "✓ acertou" : "✗ errou"}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 13.5,
                              lineHeight: 1.45,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {q.enunciado}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
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
            Ir para Blocos
          </Botao>
        </Vazio>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <Segmented
              valor={modoTop}
              opcoes={[
                { id: "pastas" as const, label: "Pastas" },
                { id: "tags" as const, label: "Nuvem de tags" },
              ]}
              onChange={setModoTop}
            />
          </div>

          {modoTop === "pastas" ? (
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
          ) : carregandoTags ? (
            <Vazio>Carregando…</Vazio>
          ) : tags.length === 0 ? (
            <Vazio>Nenhuma tag ainda.</Vazio>
          ) : (
            <NuvemDeTags tags={tags} onAbrir={abrirTag} />
          )}
        </>
      )}
    </Shell>
  );
}

/** Nuvem de tags: outra forma de navegar as notas, cruzando matérias — o
 * tamanho de cada tag é proporcional a quantas notas a usam (min 12px, max
 * 26px). Tocar abre a lista de notas com aquela tag (ver abrirTag). */
function NuvemDeTags({
  tags,
  onAbrir,
}: {
  tags: { tag: string; total: number }[];
  onAbrir: (tag: string) => void;
}) {
  const totais = tags.map((t) => t.total);
  const max = Math.max(...totais);
  const min = Math.min(...totais);

  function tamanho(total: number): number {
    if (max === min) return 15;
    return Math.round(12 + ((total - min) / (max - min)) * 14);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {tags.map((t) => (
        <button
          key={t.tag}
          onClick={() => onAbrir(t.tag)}
          title={`${t.total} nota${t.total === 1 ? "" : "s"}`}
          style={{
            ...mono,
            fontSize: tamanho(t.total),
            fontWeight: t.total >= (min + max) / 2 ? 700 : 400,
            padding: "5px 10px",
            borderRadius: 8,
            border: `1.5px solid ${C.line}`,
            background: C.card,
            color: C.caneta,
            cursor: "pointer",
          }}
        >
          {t.tag}
        </button>
      ))}
    </div>
  );
}

/* ---------- Revisão ativa (repetição espaçada) ---------- */

/**
 * Flashcard virado: mostra matéria e tags, o usuário se autoavalia antes de
 * virar ("lembrei" / "não lembrei" do conteúdo), então revela o corpo. Mesmo
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
        <div style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.8 }}>
          {nota.materia.toUpperCase()}
          {nota.tags.length ? ` · ${nota.tags.join(" · ")}` : ""}
        </div>
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
            {nota.corpo ? <TextoComMarcaTexto texto={nota.corpo} /> : "Sem conteúdo."}
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
