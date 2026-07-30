import { useCallback, useEffect, useState } from "react";
import { C, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import QuestaoCard from "../components/QuestaoCard";
import Segmented from "../components/Segmented";
import { Vazio } from "../components/Shell";
import { contarErradasPorMateria, listarErradas, marcarRevisada } from "../lib/repo";
import { gerarTagAssunto } from "../lib/texto";
import type { QuestaoRespondida } from "../lib/types";

/**
 * Refazer erradas. Não chama a API: relê as questões já gravadas em
 * `questoes_respondidas` com acertou = 0 e as reapresenta com as mesmas
 * interações do drill de geração. Acertar aqui marca a questão como revisada.
 */
export default function RefazerView() {
  const [soPendentes, setSoPendentes] = useState(true);
  const [pastas, setPastas] = useState<{ materia: string; total: number; pendentes: number }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [materia, setMateria] = useState<string | null>(null);
  const [fila, setFila] = useState<QuestaoRespondida[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revisadasAgora, setRevisadasAgora] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    setCarregando(true);
    contarErradasPorMateria(soPendentes)
      .then(setPastas)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao ler o histórico."))
      .finally(() => setCarregando(false));
  }, [soPendentes]);

  useEffect(recarregar, [recarregar]);

  async function abrir(m: string | null) {
    setErro(null);
    try {
      const qs = await listarErradas(m, soPendentes);
      if (!qs.length) {
        setErro("Nenhuma questão errada nesse filtro.");
        return;
      }
      setMateria(m);
      setFila(qs);
      setIdx(0);
      setRevisadasAgora(0);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar as questões.");
    }
  }

  function sair() {
    setFila(null);
    setMateria(null);
    recarregar();
  }

  /* ---------- Drill de revisão ---------- */
  if (fila) {
    const q = fila[idx];
    const ultima = idx === fila.length - 1;

    // Agrupamento por conceito dentro da matéria: mostra o tema em revisão,
    // que é o que orienta o usuário a estudar por assunto e não por ordem.
    const tema = q.conceitos.slice(0, 3).join(" · ");

    return (
      <div>
        <div style={{ ...mono, fontSize: 12, color: C.sub, textAlign: "center", marginBottom: 6 }}>
          Revisão {idx + 1}/{fila.length} · {materia ?? "todas as matérias"}
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
              SUB-BLOCO {q.sub} · CARGA {q.carga_conceitual}
              {q.carga_conceitual === 4 ? "+" : ""} · VOCÊ MARCOU {q.resposta}
              {q.revisada ? " · JÁ REVISADA" : ""}
            </div>
          }
          labelProxima={ultima ? "Encerrar revisão" : "Próxima questão"}
          onResponder={async (_letra, acertou) => {
            // Não apaga do histórico de erros: só marca como revisada, para o
            // filtro "só pendentes" e para os gráficos manterem o registro.
            if (acertou && !q.revisada) {
              try {
                await marcarRevisada(q.id);
                setRevisadasAgora((n) => n + 1);
              } catch (e) {
                console.error("marcar revisada", e);
              }
            }
            return q.id;
          }}
          onProxima={() => {
            if (ultima) sair();
            else setIdx(idx + 1);
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

  /* ---------- Seleção de matéria ---------- */
  const totalGeral = pastas.reduce((a, b) => a + b.total, 0);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
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
      ) : pastas.length === 0 ? (
        <Vazio>
          Nenhuma questão errada registrada{soPendentes ? " e pendente de revisão" : ""}.
          <br />
          Gere um bloco na aba Questões — toda resposta fica gravada aqui.
        </Vazio>
      ) : (
        <>
          <Botao tipo="tinta" onClick={() => abrir(null)} style={{ marginBottom: 14 }}>
            Todas as matérias · {totalGeral} {totalGeral === 1 ? "questão" : "questões"}
          </Botao>

          <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
            POR MATÉRIA
          </div>

          {pastas.map((p) => (
            <button
              key={p.materia}
              onClick={() => abrir(p.materia)}
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
      )}
    </div>
  );
}
