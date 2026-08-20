import { C, mono } from "../theme";
import { dataCurta } from "../lib/texto";
import type { QuestaoRespondida } from "../lib/types";

const LETRAS = ["A", "B", "C", "D", "E"];

/**
 * Resumo somente-leitura de uma questão já respondida — não é o QuestaoCard
 * interativo do drill (a questão já foi respondida em algum momento
 * passado); só mostra enunciado, gabarito e o que o usuário marcou. Usado
 * tanto pela "questão de origem" de uma nota (NotaCard) quanto pelos
 * resultados de questão na busca global (NotasTab).
 */
export default function ResumoQuestaoRespondida({
  questao,
  comBorda = true,
}: {
  questao: QuestaoRespondida;
  /** Borda tracejada no topo — faz sentido quando encaixado sob outro
   * conteúdo (nota); a busca global já separa os cartões sozinha. */
  comBorda?: boolean;
}) {
  return (
    <div style={comBorda ? { borderTop: `1.5px dashed ${C.line}`, paddingTop: 10 } : undefined}>
      <div style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.8, marginBottom: 8 }}>
        {questao.materia.toUpperCase()} · {dataCurta(questao.ts)}
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.55, margin: "0 0 10px" }}>{questao.enunciado}</p>

      {questao.formato === "mc" && questao.alternativas ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
          {questao.alternativas.map((alt, i) => {
            const l = LETRAS[i];
            const ehGabarito = l === questao.gabarito;
            const ehResposta = l === questao.resposta;
            return (
              <div
                key={l}
                style={{
                  fontSize: 13,
                  padding: "5px 8px",
                  borderRadius: 6,
                  background: ehGabarito ? C.okSoft : ehResposta ? C.erroSoft : "transparent",
                  color: ehGabarito ? C.ok : ehResposta ? C.erro : C.ink,
                }}
              >
                {alt}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ ...mono, fontSize: 12.5, marginBottom: 10, color: C.sub }}>
          Gabarito: {questao.gabarito === "C" ? "CERTO" : "ERRADO"} · Sua resposta:{" "}
          {questao.resposta ? (questao.resposta === "C" ? "CERTO" : "ERRADO") : "—"}
        </div>
      )}

      <div
        style={{
          ...mono,
          fontSize: 11.5,
          fontWeight: 600,
          color: questao.acertou ? C.ok : C.erro,
          marginBottom: questao.comentario ? 8 : 0,
        }}
      >
        {questao.resposta ? (questao.acertou ? "✓ Você acertou" : "✗ Você errou") : "Não respondida"}
      </div>

      {questao.comentario && (
        <p style={{ fontSize: 13, lineHeight: 1.5, color: C.sub, margin: 0 }}>{questao.comentario}</p>
      )}
    </div>
  );
}
