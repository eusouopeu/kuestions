import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { C, campo, cartao, mono } from "../theme";
import { Vazio } from "./Shell";
import NotaCard from "./NotaCard";
import ResumoQuestaoRespondida from "./ResumoQuestaoRespondida";
import { buscarNotas, buscarQuestoesRespondidas } from "../lib/repo";
import type { ConceitoSalvo, QuestaoRespondida } from "../lib/types";

/**
 * Busca global em notas e em questões já respondidas (enunciado/comentário)
 * — antes vivia só dentro da aba Notas, na tela de pastas; "onde eu vi isso
 * sobre X" é a pergunta mais frequente do app e não devia exigir lembrar em
 * qual aba a resposta mora. Ícone de lupa no cabeçalho de TODA aba (ver
 * Shell.tsx), abrindo um overlay de tela cheia — não uma tela própria, para
 * não competir com a navegação por abas embaixo.
 */
export default function BuscaGlobal() {
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [notas, setNotas] = useState<ConceitoSalvo[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoRespondida[]>([]);
  const [questaoAberta, setQuestaoAberta] = useState<number | null>(null);

  useEffect(() => {
    if (!aberta) return;
    const t = termo.trim();
    if (!t) {
      setNotas([]);
      setQuestoes([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const timer = setTimeout(() => {
      Promise.all([buscarNotas(t), buscarQuestoesRespondidas(t)])
        .then(([n, q]) => {
          setNotas(n);
          setQuestoes(q);
          setQuestaoAberta(null);
        })
        .catch(() => {
          setNotas([]);
          setQuestoes([]);
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
                placeholder="Buscar em notas e em questões já respondidas…"
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
              <Vazio>Digite para buscar em notas e em questões já respondidas.</Vazio>
            ) : buscando ? (
              <Vazio>Buscando…</Vazio>
            ) : notas.length === 0 && questoes.length === 0 ? (
              <Vazio>Nada encontrado para "{termo.trim()}".</Vazio>
            ) : (
              <>
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
