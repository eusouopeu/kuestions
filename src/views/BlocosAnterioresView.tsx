import { useCallback, useEffect, useState } from "react";
import { C, cartao, disp, mono } from "../theme";
import FilaRevisaoDrill from "../components/FilaRevisaoDrill";
import { Vazio } from "../components/Shell";
import { contarTodasPorMateria, listarTodasPorMateria, registrarRevisao } from "../lib/repo";
import { useFilaRevisao } from "./useFilaRevisao";

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
 *
 * A paginação/avanço da fila é compartilhada com RefazerView (ver
 * useFilaRevisao.ts) — aqui a "fonte" é só a matéria (string).
 */
export default function BlocosAnterioresView() {
  const [materias, setMaterias] = useState<{ materia: string; total: number }[]>([]);
  const [carregando, setCarregando] = useState(true);

  const { fonte: materiaAberta, fila, temMaisLotes, carregandoLote, idx, revisadasAgora, comNota, erro, setErro, abrir, sair, proxima, registrarRevisadaAgora } =
    useFilaRevisao<string>((materia, opts) => listarTodasPorMateria(materia, opts));

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    contarTodasPorMateria()
      .then(setMaterias)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao ler o histórico."))
      .finally(() => setCarregando(false));
  }, [setErro]);

  useEffect(recarregar, [recarregar]);

  function sairERecarregar() {
    sair();
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
