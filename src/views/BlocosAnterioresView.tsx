import { useCallback, useEffect, useState } from "react";
import { C, cartao, disp, mono } from "../theme";
import FilaRevisaoDrill from "../components/FilaRevisaoDrill";
import { Vazio } from "../components/Shell";
import { contarTodasPorMateria, idsComNota, listarTodasPorMateria, registrarRevisao } from "../lib/repo";
import type { QuestaoRespondida } from "../lib/types";

/** Tamanho do lote carregado por vez — mesma razão de RefazerView. */
const LOTE = 150;

/**
 * Blocos anteriores: reabre TODAS as questões (certas e erradas) já
 * respondidas de uma matéria, agrupadas em blocos já fechados — gerados por
 * IA, importados ou montados do banco de questões (o Simulado nunca cria um
 * bloco de verdade, então fica fora daqui). Diferente de Refazer erradas,
 * que só traz o que você errou; aqui é releitura do bloco inteiro.
 *
 * Só uma matéria por vez, sem agrupamento alternativo por bloco específico
 * nem uma opção "todas as matérias de uma vez" — a lista por matéria já
 * cobre o caso de uso sem precisar de mais uma escolha na tela.
 */
export default function BlocosAnterioresView() {
  const [materias, setMaterias] = useState<{ materia: string; total: number }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [materiaAberta, setMateriaAberta] = useState<string | null>(null);
  const [fila, setFila] = useState<QuestaoRespondida[] | null>(null);
  const [temMaisLotes, setTemMaisLotes] = useState(false);
  const [carregandoLote, setCarregandoLote] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revisadasAgora, setRevisadasAgora] = useState(0);
  const [comNota, setComNota] = useState<Set<number>>(new Set());

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    contarTodasPorMateria()
      .then(setMaterias)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao ler o histórico."))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(recarregar, [recarregar]);

  async function abrir(materia: string) {
    setErro(null);
    try {
      const qs = await listarTodasPorMateria(materia, { limite: LOTE });
      if (!qs.length) {
        setErro("Nenhuma questão nesta matéria.");
        return;
      }
      setMateriaAberta(materia);
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

  async function carregarProximoLote(): Promise<QuestaoRespondida[]> {
    if (!temMaisLotes || carregandoLote || !materiaAberta) return [];
    setCarregandoLote(true);
    try {
      const proximas = await listarTodasPorMateria(materiaAberta, {
        limite: LOTE,
        offset: fila?.length ?? 0,
      });
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
    setMateriaAberta(null);
    setTemMaisLotes(false);
    setComNota(new Set());
    recarregar();
  }

  if (fila) {
    return (
      <FilaRevisaoDrill
        fila={fila}
        idx={idx}
        labelFonte={materiaAberta ?? ""}
        temMaisLotes={temMaisLotes}
        carregandoLote={carregandoLote}
        comNota={comNota}
        revisadasAgora={revisadasAgora}
        onResponder={async (_letra, acertou) => {
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

  return (
    <div>
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
      ) : materias.length === 0 ? (
        <Vazio>
          Nenhum bloco fechado ainda.
          <br />
          Gere, importe ou monte um bloco do banco de questões — toda resposta fica gravada aqui.
        </Vazio>
      ) : (
        <>
          <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
            POR MATÉRIA
          </div>
          {materias.map((m) => (
            <button
              key={m.materia}
              onClick={() => abrir(m.materia)}
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
      )}
    </div>
  );
}
