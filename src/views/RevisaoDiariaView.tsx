import { useEffect, useState } from "react";
import { Vazio } from "../components/Shell";
import FilaRevisaoDrill from "../components/FilaRevisaoDrill";
import RevisaoNotas from "./notas/RevisaoNotas";
import { idsComNota, listarErradas, registrarRevisao } from "../lib/repo";
import type { QuestaoRespondida } from "../lib/types";

/** Lote único, sem paginação (rec. 1) — "vence hoje" é para zerar de uma
 * sentada; quem tem mais que isso pendente já tem um problema maior que
 * paginação resolveria. */
const LOTE_MAXIMO = 150;

/**
 * Fila única "vence hoje" (rec. 1): antes, revisar questões (aba Questões →
 * Refazer) e revisar notas (aba Notas → Revisão) eram duas entradas
 * separadas, mesmo usando o mesmo esquema de Leitner (ver
 * lib/repo/leitner.ts) para as duas tabelas. Aqui as duas fases correm em
 * sequência dentro de UM fluxo: primeiro as questões pendentes (mistura
 * todas as matérias — o objetivo é zerar a fila, não escolher uma pasta),
 * depois as notas pendentes, reaproveitando RevisaoNotas como está.
 */
export default function RevisaoDiariaView({ onSair }: { onSair: () => void }) {
  const [fase, setFase] = useState<"carregando" | "questoes" | "notas">("carregando");
  const [fila, setFila] = useState<QuestaoRespondida[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revisadas, setRevisadas] = useState(0);
  const [comNota, setComNota] = useState<Set<number>>(new Set());
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarErradas(null, "pendentes", { limite: LOTE_MAXIMO })
      .then((qs) => {
        if (!qs.length) {
          setFase("notas");
          return;
        }
        setFila(qs);
        setFase("questoes");
        idsComNota(qs.map((q) => q.id))
          .then(setComNota)
          .catch(() => setComNota(new Set()));
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar as questões."));
  }, []);

  if (erro) return <Vazio>{erro}</Vazio>;
  if (fase === "carregando") return <Vazio>Carregando fila do dia…</Vazio>;
  if (fase === "notas") return <RevisaoNotas materia={null} onSair={onSair} />;

  const qs = fila!;
  const ultima = idx === qs.length - 1;

  return (
    <FilaRevisaoDrill
      fila={qs}
      idx={idx}
      labelFonte="vence hoje"
      mostrarTema
      temMaisLotes={false}
      carregandoLote={false}
      comNota={comNota}
      revisadasAgora={revisadas}
      onResponder={async (_letra, acertou, tempoMs) => {
        const q = qs[idx];
        try {
          await registrarRevisao(q.id, acertou, tempoMs);
          if (acertou) setRevisadas((n) => n + 1);
        } catch (e) {
          console.error("registrar revisão", e);
        }
        return q.id;
      }}
      onProxima={() => {
        if (ultima) {
          setFase("notas");
          return;
        }
        setIdx((i) => i + 1);
      }}
      onSair={onSair}
    />
  );
}
