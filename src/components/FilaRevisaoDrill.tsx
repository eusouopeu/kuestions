import { useEffect, useState, type ComponentProps } from "react";
import { C, campo, mono } from "../theme";
import QuestaoCard from "./QuestaoCard";
import { gerarTagAssunto } from "../lib/texto";
import type { QuestaoRespondida } from "../lib/types";
import {
  mensagemDeErro,
  MAX_PERGUNTAS_TUTOR,
  perguntarSobreQuestao,
  type TurnoTutor,
} from "../lib/anthropic";
import { getTetoMensal, situacaoTeto } from "../lib/custo";
import { resumoCusto } from "../lib/repo";

/**
 * Tutor da questão (rec. 11): pergunta livre sobre a questão aberta, só
 * dentro do drill de REVISÃO (RefazerView, BlocosAnterioresView e a fila
 * diária unificada — todos passam por aqui). Não existe ao responder pela
 * primeira vez (GerarView, GerarBancoView, ImportarView, SimuladoView usam
 * QuestaoCard direto, sem passar por FilaRevisaoDrill) — lá o objetivo é
 * treinar, não tirar dúvida assistida. Teto de `MAX_PERGUNTAS_TUTOR`
 * perguntas por questão (ver anthropic.ts) e bloqueado quando o teto mensal
 * de custo já estourou (mesmo critério de outras chamadas à API, ver
 * lib/custo.ts).
 */
function TutorQuestao({ questao }: { questao: QuestaoRespondida }) {
  const [aberto, setAberto] = useState(false);
  const [historico, setHistorico] = useState<TurnoTutor[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tetoEstourado, setTetoEstourado] = useState(false);

  // Reseta a conversa ao trocar de questão — o histórico é por questão, não
  // por sessão de revisão inteira.
  useEffect(() => {
    setAberto(false);
    setHistorico([]);
    setPergunta("");
    setErro(null);
  }, [questao.id]);

  useEffect(() => {
    if (!aberto) return;
    Promise.all([resumoCusto(), getTetoMensal()])
      .then(([c, t]) => setTetoEstourado(situacaoTeto(c.mes, t) === "estourado"))
      .catch(() => setTetoEstourado(false));
  }, [aberto]);

  const atingiuTeto = historico.length >= MAX_PERGUNTAS_TUTOR;

  async function enviar() {
    const texto = pergunta.trim();
    if (!texto || enviando || atingiuTeto) return;
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await perguntarSobreQuestao(questao, historico, texto);
      setHistorico((h) => [...h, { pergunta: texto, resposta }]);
      setPergunta("");
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        style={{
          ...mono,
          marginTop: 12,
          fontSize: 11.5,
          background: "none",
          border: `1px dashed ${C.line}`,
          borderRadius: 8,
          padding: "8px 10px",
          width: "100%",
          color: C.sub,
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        Tirar dúvida sobre esta questão
      </button>
    );
  }

  return (
    <div style={{ marginTop: 12, border: `1px solid ${C.line}`, borderRadius: 10, padding: 10 }}>
      <div style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.6, marginBottom: 8 }}>
        TUTOR DA QUESTÃO
      </div>

      {historico.map((t, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{t.pergunta}</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3, lineHeight: 1.5 }}>{t.resposta}</div>
        </div>
      ))}

      {tetoEstourado ? (
        <div style={{ fontSize: 12, color: C.erro }}>
          Teto mensal de custo atingido — ajuste em Ajustes → API e custo.
        </div>
      ) : atingiuTeto ? (
        <div style={{ fontSize: 12, color: C.sub }}>
          Limite de {MAX_PERGUNTAS_TUTOR} perguntas por questão atingido.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar();
            }}
            placeholder="Ex.: por que a B está errada?"
            disabled={enviando}
            style={{ ...campo, flex: 1, fontSize: 12.5, padding: "8px 10px" }}
          />
          <button
            onClick={enviar}
            disabled={enviando || !pergunta.trim()}
            style={{
              ...mono,
              fontSize: 11.5,
              padding: "0 12px",
              borderRadius: 8,
              border: "none",
              background: C.caneta,
              color: "#fff",
              cursor: enviando || !pergunta.trim() ? "default" : "pointer",
              opacity: enviando || !pergunta.trim() ? 0.6 : 1,
            }}
          >
            {enviando ? "…" : "Perguntar"}
          </button>
        </div>
      )}

      {erro && <div style={{ fontSize: 12, color: C.erro, marginTop: 8 }}>{erro}</div>}
    </div>
  );
}

/** Sem ano — a data de próxima revisão está sempre a poucas semanas, ano
 * seria ruído (diferente da data de uma nota, que pode ser de anos atrás). */
function dataCurta(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/**
 * Uma questão de uma fila de revisão (repetição espaçada), com o mesmo
 * cabeçalho de caixa de Leitner e o mesmo rodapé "Sair da revisão" —
 * compartilhado entre RefazerView (pendentes/todas as erradas) e
 * BlocosAnterioresView (reabrir um bloco/matéria inteiro). Quem chama já
 * decide a fonte da fila e a paginação; este componente só renderiza a
 * questão atual e delega os avanços.
 */
export default function FilaRevisaoDrill({
  fila,
  idx,
  labelFonte,
  mostrarTema = false,
  temMaisLotes,
  carregandoLote,
  comNota,
  revisadasAgora,
  onResponder,
  onProxima,
  onSair,
}: {
  fila: QuestaoRespondida[];
  idx: number;
  labelFonte: string;
  /** Linha extra com os 3 primeiros conceitos da questão — só faz sentido
   * quando a fila é de erradas (agrupadas por matéria/conceito); reabrir um
   * bloco antigo não tem esse recorte. */
  mostrarTema?: boolean;
  temMaisLotes: boolean;
  carregandoLote: boolean;
  comNota: Set<number>;
  revisadasAgora: number;
  onResponder: ComponentProps<typeof QuestaoCard>["onResponder"];
  onProxima: () => void;
  onSair: () => void;
}) {
  const q = fila[idx];
  const ultima = idx === fila.length - 1 && !temMaisLotes;
  const tema = mostrarTema ? q.conceitos.slice(0, 3).join(" · ") : "";

  return (
    <div>
      <div style={{ ...mono, fontSize: 12, color: C.sub, textAlign: "center", marginBottom: 6 }}>
        Revisão {idx + 1}/{fila.length} · {labelFonte}
      </div>
      {mostrarTema && (
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
      )}

      <QuestaoCard
        key={q.id}
        questao={q}
        materia={q.materia}
        tagAssunto={gerarTagAssunto(q.topico || q.materia)}
        assunto={q.topico || q.materia}
        questaoOrigemId={q.id}
        reportadaInicial={q.reportada}
        temNotaInicial={comNota.has(q.id)}
        pedirConfianca={false}
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
            {/* Propositalmente SEM "você marcou X": mostrar a resposta dada
                antes de revelar o gabarito permite reconhecer a alternativa
                pela posição em vez de raciocinar de novo, o que é exatamente
                o que a revisão deveria evitar. A resposta continua gravada
                no banco (QuestaoRespondida.resposta) para as estatísticas —
                só não aparece aqui. */}
            {[
              q.nivel != null ? `NÍVEL ${q.nivel}` : null,
              q.revisada
                ? `CAIXA ${q.caixa_leitner}/5${
                    q.proxima_revisao && new Date(q.proxima_revisao) > new Date()
                      ? ` · PRÓXIMA EM ${dataCurta(q.proxima_revisao)}`
                      : " · VENCIDA"
                  }`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        }
        labelProxima={ultima ? "Encerrar revisão" : carregandoLote ? "Carregando…" : "Próxima questão"}
        onResponder={onResponder}
        onProxima={onProxima}
      />

      <TutorQuestao questao={q} />

      <button
        onClick={onSair}
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
