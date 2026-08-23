import { describe, expect, it } from "vitest";
import { calcular, formatarResultado, normalizarExpressao } from "./calculadora";

describe("normalizarExpressao", () => {
  it("aceita a notação numérica brasileira", () => {
    expect(normalizarExpressao("1.234,56")).toBe("1234.56");
  });

  it("traduz os símbolos do teclado da calculadora", () => {
    expect(normalizarExpressao("6 × 2 ÷ 3")).toBe("6*2/3");
  });
});

describe("calcular", () => {
  it("respeita a precedência dos operadores", () => {
    expect(calcular("2+3*4")).toBe(14);
    expect(calcular("(2+3)*4")).toBe(20);
  });

  it("trata % como divisão por 100", () => {
    expect(calcular("18%*2000")).toBe(360);
    expect(calcular("2000-18%*2000")).toBe(1640);
  });

  it("resolve o menos unário", () => {
    expect(calcular("-5+2")).toBe(-3);
    expect(calcular("3*(-2)")).toBe(-6);
  });

  it("eleva à potência com associatividade à direita", () => {
    expect(calcular("2^3^2")).toBe(512);
    expect(calcular("1000*1,05^2")).toBeCloseTo(1102.5, 6);
  });

  it("devolve null em expressão incompleta em vez de lançar", () => {
    expect(calcular("12+")).toBeNull();
    expect(calcular("")).toBeNull();
    expect(calcular("(2+3")).toBeNull();
  });

  it("devolve null na divisão por zero", () => {
    expect(calcular("5/0")).toBeNull();
  });

  it("não executa código arbitrário", () => {
    expect(calcular("alert(1)")).toBeNull();
  });
});

describe("formatarResultado", () => {
  it("corta o ruído de ponto flutuante", () => {
    expect(formatarResultado(0.1 + 0.2)).toBe("0,3");
  });

  it("usa o separador de milhar brasileiro", () => {
    expect(formatarResultado(1234.5)).toBe("1.234,5");
  });
});
