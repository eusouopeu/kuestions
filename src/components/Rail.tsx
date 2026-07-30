import { C, mono } from "../theme";
import { Q_POR_SUB, SUB_LETRAS } from "../lib/constants";

/**
 * Trilho de carga conceitual A–D: a assinatura visual do artefato. O número de
 * barrinhas empilhadas em cada letra é a quantidade de conceitos mobilizados
 * em paralelo naquele sub-bloco (1 → 4+).
 */
export default function Rail({
  atual,
  resultados,
}: {
  /** Índice do sub-bloco ativo; -1 para o estado neutro da tela de config. */
  atual: number;
  /** Acertos por sub-bloco já concluído; null onde ainda não houve. */
  resultados?: (number | null)[];
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "10px 0 2px",
      }}
    >
      {SUB_LETRAS.map((l, i) => {
        const estado = i < atual ? "feito" : i === atual ? "ativo" : "futuro";
        const cor = estado === "feito" ? C.ink : estado === "ativo" ? C.caneta : C.line;
        return (
          <div key={l} style={{ textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: 2,
                alignItems: "center",
                minHeight: 34,
              }}
            >
              {Array.from({ length: i + 1 }).map((_, k) => (
                <div
                  key={k}
                  style={{
                    width: 16,
                    height: 6,
                    borderRadius: 1.5,
                    background: estado === "futuro" ? "transparent" : cor,
                    border: `1.5px solid ${cor}`,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                ...mono,
                fontSize: 11,
                marginTop: 4,
                color: cor,
                fontWeight: estado === "ativo" ? 600 : 400,
              }}
            >
              {l}
              {resultados && resultados[i] != null ? ` ${resultados[i]}/${Q_POR_SUB}` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
