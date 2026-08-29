import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { C, campo, cartao, mono } from "../theme";
import { Vazio } from "./Shell";
import NotaCard from "./NotaCard";
import ResumoQuestaoRespondida from "./ResumoQuestaoRespondida";
import { buscarMapas, buscarNotas, buscarPaginasCaderno, buscarQuestoesRespondidas } from "../lib/repo";
import type { ConceitoSalvo, QuestaoRespondida } from "../lib/types";
import type { PaginaCaderno } from "../lib/caderno/tipos";
import type { Mapa } from "../lib/mapas/tipos";

/**
 * Busca global em notas, páginas do caderno, mapas mentais e questões já
 * respondidas — antes vivia só dentro da aba Notas, na tela de pastas;
 * "onde eu vi isso sobre X" é a pergunta mais frequente do app e não devia
 * exigir lembrar em qual aba a resposta mora. Ícone de lupa no cabeçalho de
 * TODA aba (ver Shell.tsx) e no rail lateral do layout largo
 * (RailLateral.tsx), abrindo um overlay de tela cheia — não uma tela
 * própria, para não competir com a navegação por abas.
 *
 * `aoAbrirPagina`/`aoAbrirMapa` são opcionais: quando ausentes (uso atual),
 * o resultado só mostra o título/trecho — a navegação para dentro do
 * caderno/mapa é responsabilidade de quem monta a tela de Notas.
 */
export default function BuscaGlobal({
  aoAbrirPagina,
  aoAbrirMapa,
}: {
  aoAbrirPagina?: (id: number) => void;
  aoAbrirMapa?: (id: number) => void;
} = {}) {
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [notas, setNotas] = useState<ConceitoSalvo[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoRespondida[]>([]);
  const [paginas, setPaginas] = useState<PaginaCaderno[]>([]);
  const [mapas, setMapas] = useState<Mapa[]>([]);
  const [questaoAberta, setQuestaoAberta] = useState<number | null>(null);

  useEffect(() => {
    if (!aberta) return;
    const t = termo.trim();
    if (!t) {
      setNotas([]);
      setQuestoes([]);
      setPaginas([]);
      setMapas([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const timer = setTimeout(() => {
      Promise.all([buscarNotas(t), buscarQuestoesRespondidas(t), buscarPaginasCaderno(t), buscarMapas(t)])
        .then(([n, q, p, m]) => {
          setNotas(n);
          setQuestoes(q);
          setPaginas(p);
          setMapas(m);
          setQuestaoAberta(null);
        })
        .catch(() => {
          setNotas([]);
          setQuestoes([]);
          setPaginas([]);
          setMapas([]);
        })
        .finally(() => setBuscando(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [termo, aberta]);

  function fechar() {
    setAberta(false);
    setTermo("");
    setNotas([]);
    setQuestoes([]);
    setPaginas([]);
    setMapas([]);
    setQuestaoAberta(null);
  }

  return (
    <>
      <button
        onClick={() => setAberta(true)}
        aria-label="Buscar em notas e questões"
        title="Buscar em notas e em questões já respondidas"
        style={{
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: 8,
          border: `1.5px solid ${C.line}`,
          background: C.card,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MagnifyingGlassIcon width={18} height={18} stroke={C.ink} strokeWidth={1.8} />
      </button>

      {aberta && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: C.paper,
            zIndex: 200,
            overflowY: "auto",
          }}
        >
          <div style={{ maxWidth: 620, margin: "0 auto", padding: "16px 16px 40px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18 }}>
              <input
                autoFocus
                style={{ ...campo, flex: 1 }}
                placeholder="Buscar em notas, caderno, mapas e questões já respondidas…"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
              />
              <button
                onClick={fechar}
                aria-label="Fechar busca"
                style={{
                  flexShrink: 0,
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  border: `1.5px solid ${C.line}`,
                  background: C.card,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <XMarkIcon width={18} height={18} stroke={C.sub} strokeWidth={1.8} />
              </button>
            </div>

            {!termo.trim() ? (
              <Vazio>Digite para buscar em notas, caderno, mapas e questões já respondidas.</Vazio>
            ) : buscando ? (
              <Vazio>Buscando…</Vazio>
            ) : notas.length === 0 && questoes.length === 0 && paginas.length === 0 && mapas.length === 0 ? (
              <Vazio>Nada encontrado para "{termo.trim()}".</Vazio>
            ) : (
              <>
                {paginas.length > 0 && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
                      CADERNO · {paginas.length}
                    </div>
                    {paginas.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => aoAbrirPagina?.(p.id)}
                        style={{
                          ...cartao,
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 14px",
                          marginBottom: 8,
                          cursor: aoAbrirPagina ? "pointer" : "default",
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.titulo || "Sem título"}</div>
                        {p.pasta && (
                          <div style={{ ...mono, fontSize: 10.5, color: C.sub, marginTop: 2 }}>
                            {p.pasta.toUpperCase()}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {mapas.length > 0 && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
                      MAPAS · {mapas.length}
                    </div>
                    {mapas.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => aoAbrirMapa?.(m.id)}
                        style={{
                          ...cartao,
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 14px",
                          marginBottom: 8,
                          cursor: aoAbrirMapa ? "pointer" : "default",
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{m.nome}</div>
                        {m.materia && (
                          <div style={{ ...mono, fontSize: 10.5, color: C.sub, marginTop: 2 }}>
                            {m.materia.toUpperCase()}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {notas.length > 0 && (
                  <div style={{ marginBottom: questoes.length > 0 ? 22 : 0 }}>
                    <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
                      NOTAS · {notas.length}
                    </div>
                    {notas.map((c) => (
                      <NotaCard
                        key={c.id}
                        conceito={c}
                        mostrarMateria
                        selecionando={false}
                        marcada={false}
                        onToggleSelecao={() => {}}
                        onAtualizado={(atualizado) => {
                          setNotas((ns) => ns.map((n) => (n.id === atualizado.id ? atualizado : n)));
                        }}
                        onApagado={() => {
                          setNotas((ns) => ns.filter((n) => n.id !== c.id));
                        }}
                      />
                    ))}
                  </div>
                )}

                {questoes.length > 0 && (
                  <div>
                    <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
                      QUESTÕES RESPONDIDAS · {questoes.length}
                    </div>
                    {questoes.map((q) => {
                      const abertaQ = questaoAberta === q.id;
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
                          {abertaQ ? (
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
                                <span
                                  style={{
                                    ...mono,
                                    fontSize: 10.5,
                                    color: q.acertou ? C.ok : C.erro,
                                    flexShrink: 0,
                                  }}
                                >
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
