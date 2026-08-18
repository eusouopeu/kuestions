import { useCallback, useEffect, useState } from "react";
import { C, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import QuestaoCard from "../components/QuestaoCard";
import Segmented from "../components/Segmented";
import { Vazio } from "../components/Shell";
import {
  contarErradasPorConceito,
  contarErradasPorMateria,
  contarTodasPorMateria,
  idsComNota,
  listarBlocos,
  listarErradas,
  listarErradasPorConceito,
  listarPorBloco,
  listarTodasPorMateria,
  registrarRevisao,
} from "../lib/repo";
import { gerarTagAssunto } from "../lib/texto";
import type { Bloco, QuestaoRespondida } from "../lib/types";

/** Tamanho do lote carregado por vez — evita trazer para a memória de uma
 * só vez um histórico de erradas que só cresce (ver listarErradas). */
const LOTE = 150;

function dataCurta(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function dataComAno(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** De onde veio um bloco — heurística a partir de colunas já existentes
 * (nenhuma coluna de origem dedicada): a 4ª forma de montar bloco (banco de
 * questões reais, ver GerarBancoView) sempre grava `nivel = 0`; a
 * importação sempre grava `tipos: []` (então `tipo` fica vazio) com nível
 * fixo; geração por IA sempre tem ao menos um tipo selecionado. */
function origemBloco(b: Bloco): string {
  if (b.nivel === 0) return "Banco de questões";
  if (!b.tipo) return "Importado";
  return "Gerado com IA";
}

/**
 * Refazer. Não chama a API: relê questões já gravadas em
 * `questoes_respondidas` e as reapresenta com as mesmas interações do drill
 * de geração. Três filtros:
 * - "Pendentes de revisão" / "Todas as erradas": só erradas, com ou sem o
 *   filtro de repetição espaçada — comportamento original de "Refazer
 *   erradas", agrupável por matéria ou por conceito.
 * - "Blocos anteriores": TODAS as questões (certas e erradas) de blocos já
 *   fechados — gerados por IA, importados ou montados do banco de questões
 *   (o Simulado nunca cria um bloco de verdade, então fica fora daqui) —,
 *   agrupável por matéria ou reabrindo um bloco específico inteiro.
 * Em qualquer filtro, acertar de novo avança a caixa de Leitner da questão
 * (repetição espaçada); errar reseta e a devolve à fila de pendentes.
 */
type Filtro = "pend" | "todas" | "blocos";
type AgrupamentoErradas = "materia" | "conceito";
type AgrupamentoBlocos = "materia" | "bloco";

/** Fonte da fila aberta. */
type FonteFila =
  | { tipo: "materia"; valor: string | null }
  | { tipo: "conceito"; valor: string }
  | { tipo: "bloco-materia"; valor: string | null }
  | { tipo: "bloco"; valor: number; label: string };

export default function RefazerView() {
  const [filtro, setFiltro] = useState<Filtro>("pend");
  const [agrupErradas, setAgrupErradas] = useState<AgrupamentoErradas>("materia");
  const [agrupBlocos, setAgrupBlocos] = useState<AgrupamentoBlocos>("materia");
  const [pastas, setPastas] = useState<{ materia: string; total: number; pendentes: number }[]>([]);
  const [conceitos, setConceitos] = useState<
    { conceito: string; total: number; pendentes: number }[]
  >([]);
  const [materiasBlocos, setMateriasBlocos] = useState<{ materia: string; total: number }[]>([]);
  const [blocosAnteriores, setBlocosAnteriores] = useState<Bloco[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [fonte, setFonte] = useState<FonteFila | null>(null);
  const [fila, setFila] = useState<QuestaoRespondida[] | null>(null);
  const [temMaisLotes, setTemMaisLotes] = useState(false);
  const [carregandoLote, setCarregandoLote] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revisadasAgora, setRevisadasAgora] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  // ids de questoes_respondidas com nota já salva, para o selo "nota salva"
  // no card — buscado em lote (1 consulta por página) em vez de por questão.
  const [comNota, setComNota] = useState<Set<number>>(new Set());

  const soPendentes = filtro === "pend";

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    const tarefa =
      filtro === "blocos"
        ? Promise.all([contarTodasPorMateria(), listarBlocos(null, 500)]).then(([m, b]) => {
            setMateriasBlocos(m);
            setBlocosAnteriores(b);
          })
        : Promise.all([contarErradasPorMateria(soPendentes), contarErradasPorConceito(soPendentes)]).then(
            ([p, c]) => {
              setPastas(p);
              setConceitos(c);
            },
          );
    tarefa
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao ler o histórico."))
      .finally(() => setCarregando(false));
  }, [filtro, soPendentes]);

  useEffect(recarregar, [recarregar]);

  function buscarPagina(f: FonteFila, opts: { limite?: number; offset?: number }) {
    if (f.tipo === "conceito") return listarErradasPorConceito(f.valor, soPendentes, opts);
    if (f.tipo === "materia") return listarErradas(f.valor, soPendentes, opts);
    if (f.tipo === "bloco-materia") return listarTodasPorMateria(f.valor, opts);
    return listarPorBloco(f.valor); // bloco específico: conjunto pequeno, sem paginação
  }

  async function abrir(f: FonteFila) {
    setErro(null);
    try {
      const qs = await buscarPagina(f, { limite: LOTE });
      if (!qs.length) {
        setErro("Nenhuma questão nesse filtro.");
        return;
      }
      setFonte(f);
      setFila(qs);
      setTemMaisLotes(f.tipo !== "bloco" && qs.length === LOTE);
      setIdx(0);
      setRevisadasAgora(0);
      idsComNota(qs.map((q) => q.id))
        .then(setComNota)
        .catch(() => setComNota(new Set()));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar as questões.");
    }
  }

  /** Busca o próximo lote e o anexa à fila em vez de recarregar tudo do zero —
   * é o que torna a paginação de listarErradas/listarErradasPorConceito
   * transparente para quem revisa. */
  async function carregarProximoLote(): Promise<QuestaoRespondida[]> {
    if (!temMaisLotes || carregandoLote || !fonte) return [];
    setCarregandoLote(true);
    try {
      const proximas = await buscarPagina(fonte, { limite: LOTE, offset: fila?.length ?? 0 });
      setFila((f) => (f ? [...f, ...proximas] : proximas));
      setTemMaisLotes(proximas.length === LOTE);
      idsComNota(proximas.map((q) => q.id))
        .then((novos) => setComNota((s) => new Set([...s, ...novos])))
        .catch(() => {});
      return proximas;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar mais questões.");
      return [];
    } finally {
      setCarregandoLote(false);
    }
  }

  function sair() {
    setFila(null);
    setFonte(null);
    setTemMaisLotes(false);
    setComNota(new Set());
    recarregar();
  }

  /* ---------- Drill de revisão ---------- */
  if (fila) {
    const q = fila[idx];
    const ultima = idx === fila.length - 1 && !temMaisLotes;

    // Agrupamento por conceito dentro da matéria: mostra o tema em revisão,
    // que é o que orienta o usuário a estudar por assunto e não por ordem.
    const tema = q.conceitos.slice(0, 3).join(" · ");
    const labelFonte =
      fonte?.tipo === "conceito"
        ? fonte.valor
        : fonte?.tipo === "bloco"
          ? fonte.label
          : (fonte?.valor ?? "todas as matérias");

    return (
      <div>
        <div style={{ ...mono, fontSize: 12, color: C.sub, textAlign: "center", marginBottom: 6 }}>
          Revisão {idx + 1}/{fila.length} · {labelFonte}
        </div>
        <div
          style={{
            ...mono,
            fontSize: 11,
            color: C.caneta,
            textAlign: "center",
            marginBottom: 14,
            minHeight: 14,
          }}
        >
          {tema}
        </div>

        <QuestaoCard
          key={q.id}
          questao={q}
          materia={q.materia}
          tagAssunto={gerarTagAssunto(q.topico || q.materia)}
          questaoOrigemId={q.id}
          reportadaInicial={q.reportada}
          temNotaInicial={comNota.has(q.id)}
          cabecalho={
            <div
              style={{
                ...mono,
                fontSize: 10.5,
                color: C.sub,
                letterSpacing: 0.8,
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              {q.nivel != null ? `NÍVEL ${q.nivel} · ` : ""}
              {q.resposta ? `VOCÊ MARCOU ${q.resposta}` : "NÃO RESPONDIDA"}
              {q.revisada
                ? ` · CAIXA ${q.caixa_leitner}/5${
                    q.proxima_revisao && new Date(q.proxima_revisao) > new Date()
                      ? ` · PRÓXIMA EM ${dataCurta(q.proxima_revisao)}`
                      : " · VENCIDA"
                  }`
                : ""}
            </div>
          }
          labelProxima={
            ultima ? "Encerrar revisão" : carregandoLote ? "Carregando…" : "Próxima questão"
          }
          onResponder={async (_letra, acertou) => {
            // Não apaga do histórico: registra o resultado na caixa de
            // Leitner da questão — acertar empurra a próxima aparição para
            // mais longe (repetição espaçada); errar de novo zera a caixa e a
            // questão volta a ficar pendente imediatamente. Vale também para
            // "Blocos anteriores": reabrir um bloco antigo também atualiza a
            // repetição espaçada de cada questão nele.
            try {
              await registrarRevisao(q.id, acertou);
              if (acertou) setRevisadasAgora((n) => n + 1);
            } catch (e) {
              console.error("registrar revisão", e);
            }
            return q.id;
          }}
          onProxima={async () => {
            if (ultima) {
              sair();
              return;
            }
            if (idx === fila.length - 1 && temMaisLotes) {
              const proximas = await carregarProximoLote();
              if (!proximas.length) {
                // Falhou ou não havia mais nada, apesar do sinal anterior.
                sair();
                return;
              }
            }
            setIdx(idx + 1);
          }}
        />

        <button
          onClick={sair}
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
          Sair da revisão{revisadasAgora ? ` (${revisadasAgora} revisada${revisadasAgora > 1 ? "s" : ""})` : ""}
        </button>
      </div>
    );
  }

  /* ---------- Seleção ---------- */
  const semDadosErradas = pastas.length === 0;
  const semDadosBlocos = blocosAnteriores.length === 0;
  const semDados = filtro === "blocos" ? semDadosBlocos : semDadosErradas;

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={rotulo}>Filtro</label>
        <Segmented
          valor={filtro}
          opcoes={[
            { id: "pend" as Filtro, label: "Pendentes de revisão" },
            { id: "todas" as Filtro, label: "Todas as erradas" },
            { id: "blocos" as Filtro, label: "Blocos anteriores" },
          ]}
          onChange={setFiltro}
        />
      </div>

      {!semDados && filtro !== "blocos" && (
        <div style={{ marginBottom: 16 }}>
          <label style={rotulo}>Agrupar por</label>
          <Segmented
            valor={agrupErradas}
            opcoes={[
              { id: "materia" as const, label: "Matéria" },
              { id: "conceito" as const, label: "Conceito — onde treinar" },
            ]}
            onChange={setAgrupErradas}
          />
          {agrupErradas === "conceito" && (
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>
              Cada fila reúne erradas do mesmo conceito, mesmo que de matérias diferentes — ataca o
              ponto específico que quebra, em vez do erro genérico da matéria inteira.
            </div>
          )}
        </div>
      )}

      {!semDados && filtro === "blocos" && (
        <div style={{ marginBottom: 16 }}>
          <label style={rotulo}>Agrupar por</label>
          <Segmented
            valor={agrupBlocos}
            opcoes={[
              { id: "materia" as const, label: "Matéria" },
              { id: "bloco" as const, label: "Bloco" },
            ]}
            onChange={setAgrupBlocos}
          />
        </div>
      )}

      {erro && (
        <div
          style={{
            background: C.erroSoft,
            border: `1.5px solid ${C.erro}`,
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {erro}
        </div>
      )}

      {carregando ? (
        <Vazio>Lendo histórico…</Vazio>
      ) : semDados ? (
        <Vazio>
          {filtro === "blocos" ? (
            <>
              Nenhum bloco fechado ainda.
              <br />
              Gere, importe ou monte um bloco do banco de questões — toda resposta fica gravada
              aqui.
            </>
          ) : (
            <>
              Nenhuma questão errada registrada{soPendentes ? " e pendente de revisão" : ""}.
              <br />
              Gere um bloco na aba Blocos — toda resposta fica gravada aqui.
            </>
          )}
        </Vazio>
      ) : filtro === "blocos" ? (
        agrupBlocos === "materia" ? (
          <>
            <Botao
              tipo="tinta"
              onClick={() => abrir({ tipo: "bloco-materia", valor: null })}
              style={{ marginBottom: 14 }}
            >
              Todas as matérias ·{" "}
              {materiasBlocos.reduce((a, b) => a + b.total, 0)}{" "}
              {materiasBlocos.reduce((a, b) => a + b.total, 0) === 1 ? "questão" : "questões"}
            </Botao>

            <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
              POR MATÉRIA
            </div>

            {materiasBlocos.map((m) => (
              <button
                key={m.materia}
                onClick={() => abrir({ tipo: "bloco-materia", valor: m.materia })}
                style={{
                  ...cartao,
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                  padding: "12px 14px",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <span style={{ ...disp, fontSize: 14.5, fontWeight: 600 }}>{m.materia}</span>
                <span style={{ ...mono, fontSize: 12, color: C.sub }}>{m.total}</span>
              </button>
            ))}
          </>
        ) : (
          <>
            <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
              {blocosAnteriores.length} BLOCO{blocosAnteriores.length === 1 ? "" : "S"}
            </div>
            {blocosAnteriores.map((b) => (
              <button
                key={b.id}
                onClick={() =>
                  abrir({
                    tipo: "bloco",
                    valor: b.id,
                    label: `${b.materia} · ${dataCurta(b.ts)}`,
                  })
                }
                style={{
                  ...cartao,
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  textAlign: "left",
                  padding: "12px 14px",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...disp, fontSize: 14.5, fontWeight: 600 }}>{b.materia}</div>
                  <div style={{ ...mono, fontSize: 10.5, color: C.sub, marginTop: 2 }}>
                    {origemBloco(b)} · {dataComAno(b.ts)}
                  </div>
                </div>
                <span
                  style={{
                    ...mono,
                    fontSize: 12,
                    color: b.aprovado ? C.ok : C.sub,
                    flexShrink: 0,
                  }}
                >
                  {b.total_acertos}/{b.total_questoes}
                </span>
              </button>
            ))}
          </>
        )
      ) : agrupErradas === "materia" ? (
        <>
          <Botao
            tipo="tinta"
            onClick={() => abrir({ tipo: "materia", valor: null })}
            style={{ marginBottom: 14 }}
          >
            Todas as matérias · {pastas.reduce((a, b) => a + b.total, 0)}{" "}
            {pastas.reduce((a, b) => a + b.total, 0) === 1 ? "questão" : "questões"}
          </Botao>

          <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
            POR MATÉRIA
          </div>

          {pastas.map((p) => (
            <button
              key={p.materia}
              onClick={() => abrir({ tipo: "materia", valor: p.materia })}
              style={{
                ...cartao,
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "left",
                padding: "12px 14px",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <span style={{ ...disp, fontSize: 14.5, fontWeight: 600 }}>{p.materia}</span>
              <span style={{ ...mono, fontSize: 12, color: C.erro }}>
                {p.total}
                {!soPendentes && p.pendentes !== p.total ? ` · ${p.pendentes} pend.` : ""}
              </span>
            </button>
          ))}
        </>
      ) : conceitos.length === 0 ? (
        <Vazio>Nenhum conceito pendente de revisão neste filtro.</Vazio>
      ) : (
        <>
          <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
            POR CONCEITO — {conceitos.length} conceito{conceitos.length === 1 ? "" : "s"}
          </div>

          {conceitos.map((c) => (
            <button
              key={c.conceito}
              onClick={() => abrir({ tipo: "conceito", valor: c.conceito })}
              style={{
                ...cartao,
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "left",
                padding: "12px 14px",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <span style={{ ...disp, fontSize: 14.5, fontWeight: 600 }}>{c.conceito}</span>
              <span style={{ ...mono, fontSize: 12, color: C.erro }}>
                {c.total}
                {!soPendentes && c.pendentes !== c.total ? ` · ${c.pendentes} pend.` : ""}
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
