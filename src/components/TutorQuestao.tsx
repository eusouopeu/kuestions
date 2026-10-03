import { useEffect, useState } from "react";
import { C, campo, mono } from "../theme";
import type { Questao } from "../lib/types";
import {
  mensagemDeErro,
  MAX_PERGUNTAS_TUTOR,
  perguntarSobreQuestao,
  type TurnoTutor,
} from "../lib/anthropic";
import { getTetoMensal, situacaoTeto } from "../lib/custo";
import { resumoCusto } from "../lib/repo";

/**
 * Pergunta rápida sobre a questão aberta (rec. 11), em qualquer drill que use
 * QuestaoCard — aberta pelo botão-ícone de balão na barra de ações. Antes de
 * responder (`respondida` false) o prompt não leva gabarito nem comentário
 * (ver montarPromptTutor em lib/anthropic.ts): ajuda a entender o enunciado
 * sem entregar a questão. O histórico continua ao revelar, e as perguntas
 * seguintes já podem falar do gabarito. Teto de `MAX_PERGUNTAS_TUTOR`
 * perguntas por questão, e bloqueado quando o teto mensal de custo já
 * estourou (ver lib/custo.ts). Quem monta remonta por questão (key), o que
 * zera a conversa.
 */
export default function TutorQuestao({
  questao,
  respondida,
  textoApoio,
}: {
  questao: Questao;
  respondida: boolean;
  textoApoio?: string;
}) {
  const [historico, setHistorico] = useState<TurnoTutor[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tetoEstourado, setTetoEstourado] = useState(false);

  useEffect(() => {
    Promise.all([resumoCusto(), getTetoMensal()])
      .then(([c, t]) => setTetoEstourado(situacaoTeto(c.mes, t) === "estourado"))
      .catch(() => setTetoEstourado(false));
  }, []);

  const atingiuTeto = historico.length >= MAX_PERGUNTAS_TUTOR;

  async function enviar() {
    const texto = pergunta.trim();
    if (!texto || enviando || atingiuTeto) return;
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await perguntarSobreQuestao(questao, historico, texto, { respondida, textoApoio });
      setHistorico((h) => [...h, { pergunta: texto, resposta }]);
      setPergunta("");
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ flexBasis: "100%", paddingTop: 4 }}>
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
            autoFocus
            placeholder={respondida ? "Ex.: por que a B está errada?" : "Ex.: o que é fato gerador?"}
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

      {!respondida && !historico.length && (
        <div style={{ ...mono, fontSize: 10.5, color: C.sub, marginTop: 6 }}>
          Antes de responder, a IA não diz o gabarito.
        </div>
      )}
      {erro && <div style={{ fontSize: 12, color: C.erro, marginTop: 8 }}>{erro}</div>}
    </div>
  );
}
