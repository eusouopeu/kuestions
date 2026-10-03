import type { ComponentProps } from "react";
import { C, mono } from "../theme";
import QuestaoCard from "./QuestaoCard";
import { gerarTagAssunto } from "../lib/texto";
import type { QuestaoRespondida } from "../lib/types";

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
 * cabeçalho de caixa de Leitner e o mesmo botão-ícone "Sair da revisão" (na
 * barra de ações acima do card) —
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
  explicacaoEnxuta = false,
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
  /** Revisão "só curtas": explicação reduzida à primeira frase (ver QuestaoCard). */
  explicacaoEnxuta?: boolean;
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
        causaErroInicial={q.causa_erro}
        embaralhar
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
        // Pular na revisão: avança sem registrar nada — a caixa de Leitner
        // não muda e a questão continua pendente.
        onPular={onProxima}
        onProxima={onProxima}
        explicacaoEnxuta={explicacaoEnxuta}
        onSair={onSair}
        rotuloSair={`Sair da revisão${revisadasAgora ? ` (${revisadasAgora} revisada${revisadasAgora > 1 ? "s" : ""})` : ""}`}
      />

    </div>
  );
}
