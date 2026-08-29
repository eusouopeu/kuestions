import { useCallback, useEffect, useState } from "react";
import { C, cartao, disp, mono, rotulo } from "../theme";
import FilaRevisaoDrill from "../components/FilaRevisaoDrill";
import Segmented from "../components/Segmented";
import { Vazio } from "../components/Shell";
import {
  contarErradasPorConceito,
  contarErradasPorMateria,
  listarErradas,
  listarErradasPorConceito,
  registrarRevisao,
  type EscopoRevisao,
} from "../lib/repo";
import { useFilaRevisao } from "./useFilaRevisao";

/**
 * Refazer. Não chama a API: relê questões já gravadas em
 * `questoes_respondidas` e as reapresenta com as mesmas interações do drill
 * de geração. Dois filtros, agrupáveis por matéria ou por conceito:
 *
 *   - "Vencidas hoje": a fila de repetição espaçada — o que está vencido
 *     agora, ERRADO OU CERTO. Acertar não tira mais a questão do circuito:
 *     ela volta na caixa seguinte de Leitner (ver agendamentoInicial e
 *     registrarRevisao em lib/repo.ts), cada vez mais espaçada;
 *   - "Todas as erradas": a lista de erros do histórico, vencidos ou não.
 *
 * ("Blocos anteriores" é outra aba, ver BlocosAnterioresView — TODAS as
 * questões de um bloco fechado, não só as vencidas. A paginação/avanço da
 * fila é compartilhada entre as duas, ver useFilaRevisao.ts.)
 *
 * A ordem da fila prioriza o que mais precisa de atenção: errada antes de
 * certa, erro perigoso antes de erro comum, acerto lento antes de acerto
 * rápido (ver ordemRevisao em lib/repo.ts).
 */
type Filtro = EscopoRevisao;
type AgrupamentoErradas = "materia" | "conceito";

/** Fonte da fila aberta. */
type FonteFila = { tipo: "materia"; valor: string } | { tipo: "conceito"; valor: string };

export default function RefazerView() {
  const [filtro, setFiltro] = useState<Filtro>("pendentes");
  const [agrupErradas, setAgrupErradas] = useState<AgrupamentoErradas>("materia");
  const [pastas, setPastas] = useState<
    { materia: string; total: number; pendentes: number; erradas: number }[]
  >([]);
  const [conceitos, setConceitos] = useState<
    { conceito: string; total: number; pendentes: number }[]
  >([]);
  const [carregando, setCarregando] = useState(true);

  const {
    fonte,
    fila,
    temMaisLotes,
    carregandoLote,
    idx,
    revisadasAgora,
    comNota,
    erro,
    setErro,
    abrir,
    sair,
    proxima,
    registrarRevisadaAgora,
  } = useFilaRevisao<FonteFila>((f, opts) =>
    f.tipo === "conceito" ? listarErradasPorConceito(f.valor, filtro, opts) : listarErradas(f.valor, filtro, opts),
  );

  const soPendentes = filtro === "pendentes";

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    Promise.all([contarErradasPorMateria(filtro), contarErradasPorConceito(filtro)])
      .then(([p, c]) => {
        setPastas(p);
        setConceitos(c);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao ler o histórico."))
      .finally(() => setCarregando(false));
  }, [filtro, setErro]);

  useEffect(recarregar, [recarregar]);

  function sairERecarregar() {
    sair();
    recarregar();
  }

  /* ---------- Drill de revisão ---------- */
  if (fila) {
    const labelFonte = fonte?.valor ?? "";
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
            if (acertou) registrarRevisadaAgora();
          } catch (e) {
            console.error("registrar revisão", e);
          }
          return q.id;
        }}
        onProxima={() => proxima(sairERecarregar)}
        onSair={sairERecarregar}
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
            { id: "pendentes" as Filtro, label: "Vencidas hoje" },
            { id: "erradas" as Filtro, label: "Todas as erradas" },
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
              { id: "conceito" as const, label: "Conceito" },
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
          {soPendentes
            ? "Nada vencido para revisar hoje. Volte quando a próxima caixa de Leitner abrir."
            : "Nenhuma questão errada registrada."}
          <br />
          Gere um bloco na aba Blocos — toda resposta fica gravada aqui.
        </Vazio>
      ) : agrupErradas === "materia" ? (
        <>
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
                {soPendentes
                  ? p.erradas > 0
                    ? ` · ${p.erradas} errada${p.erradas === 1 ? "" : "s"}`
                    : ""
                  : p.pendentes !== p.total
                    ? ` · ${p.pendentes} pend.`
                    : ""}
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
