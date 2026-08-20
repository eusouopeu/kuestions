import { useCallback, useEffect, useState } from "react";
import { C, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import FilaRevisaoDrill from "../components/FilaRevisaoDrill";
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
import type { QuestaoRespondida } from "../lib/types";

/** Tamanho do lote carregado por vez — evita trazer para a memória de uma
 * só vez um histórico de erradas que só cresce (ver listarErradas). */
const LOTE = 150;

/**
 * Refazer erradas. Não chama a API: relê questões já gravadas em
 * `questoes_respondidas` e as reapresenta com as mesmas interações do drill
 * de geração. Dois filtros — "Pendentes de revisão" / "Todas as erradas" —,
 * agrupáveis por matéria ou por conceito. ("Blocos anteriores" é outra aba,
 * ver BlocosAnterioresView — TODAS as questões de um bloco fechado, não só
 * as erradas, é um caso de uso diferente o bastante para não caber neste
 * mesmo seletor.)
 *
 * Em qualquer filtro, acertar de novo avança a caixa de Leitner da questão
 * (repetição espaçada); errar reseta e a devolve à fila de pendentes.
 */
type Filtro = "pend" | "todas";
type AgrupamentoErradas = "materia" | "conceito";

/** Fonte da fila aberta. */
type FonteFila = { tipo: "materia"; valor: string | null } | { tipo: "conceito"; valor: string };

export default function RefazerView() {
  const [filtro, setFiltro] = useState<Filtro>("pend");
  const [agrupErradas, setAgrupErradas] = useState<AgrupamentoErradas>("materia");
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

  const soPendentes = filtro === "pend";

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
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
    if (f.tipo === "conceito") return listarErradasPorConceito(f.valor, soPendentes, opts);
    return listarErradas(f.valor, soPendentes, opts);
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
    const labelFonte = fonte?.tipo === "conceito" ? fonte.valor : (fonte?.valor ?? "todas as matérias");
    return (
      <FilaRevisaoDrill
        fila={fila}
        idx={idx}
        labelFonte={labelFonte}
        mostrarTema
        temMaisLotes={temMaisLotes}
        carregandoLote={carregandoLote}
        comNota={comNota}
        revisadasAgora={revisadasAgora}
        onResponder={async (_letra, acertou) => {
          // Não apaga do histórico: registra o resultado na caixa de
          // Leitner da questão — acertar empurra a próxima aparição para
          // mais longe (repetição espaçada); errar de novo zera a caixa e a
          // questão volta a ficar pendente imediatamente.
          const q = fila[idx];
          try {
            await registrarRevisao(q.id, acertou);
            if (acertou) setRevisadasAgora((n) => n + 1);
          } catch (e) {
            console.error("registrar revisão", e);
          }
          return q.id;
        }}
        onProxima={async () => {
          const ultima = idx === fila.length - 1 && !temMaisLotes;
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
        onSair={sair}
      />
    );
  }

  /* ---------- Seleção ---------- */
  const semDados = pastas.length === 0;

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={rotulo}>Filtro</label>
        <Segmented
          valor={filtro}
          opcoes={[
            { id: "pend" as Filtro, label: "Pendentes de revisão" },
            { id: "todas" as Filtro, label: "Todas as erradas" },
          ]}
          onChange={setFiltro}
        />
      </div>

      {!semDados && (
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
          Gere um bloco na aba Blocos — toda resposta fica gravada aqui.
        </Vazio>
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
