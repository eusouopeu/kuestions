import { useCallback, useEffect, useState } from "react";
import { C, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import QuestaoCard from "../components/QuestaoCard";
import Segmented from "../components/Segmented";
import { Vazio } from "../components/Shell";
import {
  contarErradasPorConceito,
  contarErradasPorMateria,
  idsComNota,
  listarErradas,
  listarErradasPorConceito,
  registrarRevisao,
} from "../lib/repo";
import { gerarTagAssunto } from "../lib/texto";
import type { QuestaoRespondida } from "../lib/types";

/** Tamanho do lote carregado por vez — evita trazer para a memória de uma
 * só vez um histórico de erradas que só cresce (ver listarErradas). */
const LOTE = 150;

function dataCurta(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/**
 * Refazer erradas. Não chama a API: relê as questões já gravadas em
 * `questoes_respondidas` com acertou = 0 e as reapresenta com as mesmas
 * interações do drill de geração. Acertar aqui marca a questão como revisada.
 */
/** Fonte da fila aberta: por matéria (comportamento original, `valor = null`
 * agrega tudo) ou por conceito (novo — ataca o ponto específico que quebra,
 * em vez de misturar conceitos fortes e fracos da mesma matéria). */
type FonteFila = { tipo: "materia"; valor: string | null } | { tipo: "conceito"; valor: string };

export default function RefazerView() {
  const [soPendentes, setSoPendentes] = useState(true);
  const [agrupamento, setAgrupamento] = useState<"materia" | "conceito">("materia");
  const [pastas, setPastas] = useState<{ materia: string; total: number; pendentes: number }[]>([]);
  const [conceitos, setConceitos] = useState<
    { conceito: string; total: number; pendentes: number }[]
  >([]);
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

  const recarregar = useCallback(() => {
    setCarregando(true);
    Promise.all([contarErradasPorMateria(soPendentes), contarErradasPorConceito(soPendentes)])
      .then(([p, c]) => {
        setPastas(p);
        setConceitos(c);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao ler o histórico."))
      .finally(() => setCarregando(false));
  }, [soPendentes]);

  useEffect(recarregar, [recarregar]);

  function buscarPagina(f: FonteFila, opts: { limite?: number; offset?: number }) {
    return f.tipo === "conceito"
      ? listarErradasPorConceito(f.valor, soPendentes, opts)
      : listarErradas(f.valor, soPendentes, opts);
  }

  async function abrir(f: FonteFila) {
    setErro(null);
    try {
      const qs = await buscarPagina(f, { limite: LOTE });
      if (!qs.length) {
        setErro("Nenhuma questão errada nesse filtro.");
        return;
      }
      setFonte(f);
      setFila(qs);
      setTemMaisLotes(qs.length === LOTE);
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

    return (
      <div>
        <div style={{ ...mono, fontSize: 12, color: C.sub, textAlign: "center", marginBottom: 6 }}>
          Revisão {idx + 1}/{fila.length} ·{" "}
          {fonte?.tipo === "conceito" ? fonte.valor : (fonte?.valor ?? "todas as matérias")}
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
            // Não apaga do histórico de erros: registra o resultado na caixa
            // de Leitner da questão — acertar empurra a próxima aparição para
            // mais longe (repetição espaçada); errar de novo zera a caixa e a
            // questão volta a ficar pendente imediatamente.
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

  /* ---------- Seleção de matéria/conceito ---------- */
  const totalGeral = pastas.reduce((a, b) => a + b.total, 0);
  const semDados = pastas.length === 0;

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={rotulo}>Filtro</label>
        <Segmented
          valor={soPendentes ? "pend" : "todas"}
          opcoes={[
            { id: "pend", label: "Só pendentes de revisão" },
            { id: "todas", label: "Todas as erradas" },
          ]}
          onChange={(v) => setSoPendentes(v === "pend")}
        />
      </div>

      {!semDados && (
        <div style={{ marginBottom: 16 }}>
          <label style={rotulo}>Agrupar por</label>
          <Segmented
            valor={agrupamento}
            opcoes={[
              { id: "materia" as const, label: "Matéria" },
              { id: "conceito" as const, label: "Conceito — onde treinar" },
            ]}
            onChange={setAgrupamento}
          />
          {agrupamento === "conceito" && (
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>
              Cada fila reúne erradas do mesmo conceito, mesmo que de matérias diferentes — ataca o
              ponto específico que quebra, em vez do erro genérico da matéria inteira.
            </div>
          )}
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
          Nenhuma questão errada registrada{soPendentes ? " e pendente de revisão" : ""}.
          <br />
          Gere um bloco na aba Questões — toda resposta fica gravada aqui.
        </Vazio>
      ) : agrupamento === "materia" ? (
        <>
          <Botao
            tipo="tinta"
            onClick={() => abrir({ tipo: "materia", valor: null })}
            style={{ marginBottom: 14 }}
          >
            Todas as matérias · {totalGeral} {totalGeral === 1 ? "questão" : "questões"}
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
