import { useState } from "react";
import { CalculatorIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { C, disp, mono } from "../theme";
import { calcular, formatarResultado } from "../lib/calculadora";
import { guardarExpressaoCalculadora, lerExpressaoCalculadora } from "../lib/calculadoraEstado";

/**
 * Calculadora em duas linhas: uma de entrada e uma de resultado.
 *
 * Não há mais teclado próprio de 20 teclas — ele ocupava metade da tela do
 * celular justamente quando o enunciado precisava ser lido junto. A digitação
 * é pelo teclado virtual do próprio sistema (`inputMode="text"`, para ter os
 * operadores e parênteses além dos dígitos), e o motor já aceita a notação
 * brasileira digitada (vírgula decimal, "%", "*" ou "×"; ver
 * lib/calculadora.ts).
 *
 * A expressão vive fora do componente (lib/calculadoraEstado.ts): fechar a
 * calculadora e reabrir devolve a conta onde ela estava.
 */
export function TecladoCalculadora() {
  const [expr, setExpr] = useState(lerExpressaoCalculadora);
  const resultado = calcular(expr);

  function alterar(valor: string) {
    setExpr(valor);
    guardarExpressaoCalculadora(valor);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          value={expr}
          onChange={(e) => alterar(e.target.value)}
          // O teclado numérico puro do celular não tem "(", ")" nem "%", que
          // aparecem em conta de prova — daí o teclado de texto.
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="1200*18%"
          aria-label="Expressão da calculadora"
          style={{
            ...mono,
            flex: 1,
            minWidth: 0,
            fontSize: 15,
            color: C.ink,
            textAlign: "right",
            border: `1.5px solid ${C.line}`,
            borderRadius: 8,
            padding: "9px 10px",
            background: C.paper,
          }}
        />
        <button
          onClick={() => alterar("")}
          aria-label="Limpar"
          title="Limpar"
          disabled={expr === ""}
          style={{
            flexShrink: 0,
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1.5px solid ${expr === "" ? C.line : C.erro}`,
            background: "transparent",
            color: expr === "" ? C.sub : C.erro,
            cursor: expr === "" ? "default" : "pointer",
            opacity: expr === "" ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <XMarkIcon width={16} height={16} strokeWidth={2} />
        </button>
      </div>

      <div
        style={{
          ...disp,
          fontSize: 18,
          fontWeight: 600,
          marginTop: 6,
          padding: "0 44px 0 2px",
          color: resultado == null ? C.sub : C.caneta,
          textAlign: "right",
        }}
      >
        {resultado == null ? "—" : `= ${formatarResultado(resultado)}`}
      </div>
    </div>
  );
}

/**
 * Calculadora embutida, aberta embaixo das questões de cálculo (ver
 * `pareceCalculo` em lib/texto.ts). Existe para não obrigar a sair do app no
 * meio de uma questão de apuração: alternar para a calculadora do sistema
 * esconde o enunciado, e voltar cobra reler tudo.
 *
 * Começa recolhida — a questão continua sendo o conteúdo principal do card.
 */
export default function Calculadora() {
  const [aberta, setAberta] = useState(false);

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
          <TecladoCalculadora />
        </div>
      )}
    </div>
  );
}
