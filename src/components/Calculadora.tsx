import { useState } from "react";
import { BackspaceIcon, CalculatorIcon } from "@heroicons/react/24/outline";
import { C, disp, mono } from "../theme";
import { calcular, formatarResultado } from "../lib/calculadora";

/** Uma tecla do teclado: rótulo exibido, texto inserido na expressão e peso
 * visual (operadores e ações destacados do bloco numérico). */
type Tecla = {
  rotulo: string;
  insere?: string;
  acao?: "limpar" | "apagar" | "igual";
  tom?: "op" | "acao";
};

const TECLAS: Tecla[] = [
  { rotulo: "C", acao: "limpar", tom: "acao" },
  { rotulo: "(", insere: "(", tom: "op" },
  { rotulo: ")", insere: ")", tom: "op" },
  { rotulo: "÷", insere: "÷", tom: "op" },

  { rotulo: "7", insere: "7" },
  { rotulo: "8", insere: "8" },
  { rotulo: "9", insere: "9" },
  { rotulo: "×", insere: "×", tom: "op" },

  { rotulo: "4", insere: "4" },
  { rotulo: "5", insere: "5" },
  { rotulo: "6", insere: "6" },
  { rotulo: "−", insere: "-", tom: "op" },

  { rotulo: "1", insere: "1" },
  { rotulo: "2", insere: "2" },
  { rotulo: "3", insere: "3" },
  { rotulo: "+", insere: "+", tom: "op" },

  { rotulo: "0", insere: "0" },
  { rotulo: ",", insere: "," },
  { rotulo: "%", insere: "%", tom: "op" },
  { rotulo: "^", insere: "^", tom: "op" },
];

/**
 * Calculadora embutida, aberta embaixo das questões de cálculo (ver
 * `pareceCalculo` em lib/texto.ts). Existe para não obrigar a sair do app no
 * meio de uma questão de apuração: alternar para a calculadora do sistema
 * esconde o enunciado, e voltar cobra reler tudo.
 *
 * Começa recolhida — a questão continua sendo o conteúdo principal do card —
 * e o resultado é recalculado a cada tecla (ver `calcular`, que devolve null
 * em expressão incompleta em vez de exibir erro a cada dígito).
 */
export default function Calculadora() {
  const [aberta, setAberta] = useState(false);
  const [expr, setExpr] = useState("");

  const resultado = calcular(expr);

  function teclar(t: Tecla) {
    if (t.acao === "limpar") return setExpr("");
    if (t.acao === "apagar") return setExpr((e) => e.slice(0, -1));
    if (t.acao === "igual") {
      // "=" fixa o resultado como nova expressão, para encadear contas.
      if (resultado != null) setExpr(String(resultado).replace(".", ","));
      return;
    }
    if (t.insere) setExpr((e) => e + t.insere);
  }

  return (
    <div style={{ marginTop: 12, borderTop: `1.5px dashed ${C.line}`, paddingTop: 12 }}>
      <button
        onClick={() => setAberta((a) => !a)}
        aria-expanded={aberta}
        style={{
          ...mono,
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          fontSize: 11,
          letterSpacing: 0.8,
          color: C.sub,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <CalculatorIcon width={14} height={14} />
        CALCULADORA
        <span style={{ marginLeft: "auto", fontSize: 12 }}>{aberta ? "▾" : "▸"}</span>
      </button>

      {aberta && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              border: `1.5px solid ${C.line}`,
              borderRadius: 8,
              padding: "8px 10px",
              marginBottom: 8,
              background: C.paper,
              minHeight: 52,
            }}
          >
            <div
              style={{
                ...mono,
                fontSize: 15,
                color: C.ink,
                wordBreak: "break-all",
                minHeight: 20,
                textAlign: "right",
              }}
            >
              {expr || "0"}
            </div>
            <div
              style={{
                ...disp,
                fontSize: 18,
                fontWeight: 600,
                color: resultado == null ? C.sub : C.caneta,
                textAlign: "right",
              }}
            >
              {resultado == null ? "—" : `= ${formatarResultado(resultado)}`}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {TECLAS.map((t) => (
              <button
                key={t.rotulo}
                onClick={() => teclar(t)}
                style={{
                  ...disp,
                  fontSize: 16,
                  fontWeight: 600,
                  padding: "12px 0",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: `1.5px solid ${t.tom === "acao" ? C.erro : C.line}`,
                  background: t.tom === "op" ? C.canetaSoft : "transparent",
                  color: t.tom === "acao" ? C.erro : t.tom === "op" ? C.caneta : C.ink,
                }}
              >
                {t.rotulo}
              </button>
            ))}

            <button
              onClick={() => teclar({ rotulo: "⌫", acao: "apagar" })}
              aria-label="Apagar último caractere"
              style={{
                ...disp,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 0",
                borderRadius: 8,
                cursor: "pointer",
                border: `1.5px solid ${C.line}`,
                background: "transparent",
                color: C.ink,
              }}
            >
              <BackspaceIcon width={18} height={18} />
            </button>

            <button
              onClick={() => teclar({ rotulo: "=", acao: "igual" })}
              disabled={resultado == null}
              style={{
                ...disp,
                gridColumn: "span 3",
                fontSize: 16,
                fontWeight: 600,
                padding: "12px 0",
                borderRadius: 8,
                cursor: resultado == null ? "default" : "pointer",
                border: `1.5px solid ${C.caneta}`,
                background: C.caneta,
                color: "#fff",
                opacity: resultado == null ? 0.5 : 1,
              }}
            >
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
