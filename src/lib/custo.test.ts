import { describe, expect, it } from "vitest";
import { calcularCusto, formatarUSD, situacaoTeto, MULT_CACHE_LEITURA } from "./custo";

describe("calcularCusto", () => {
  it("cobra entrada e saída pelo preço do modelo", () => {
    // 1M de entrada + 1M de saída no Sonnet 5: 3 + 15
    const c = calcularCusto("claude-sonnet-5", {
      entrada: 1_000_000,
      saida: 1_000_000,
      cacheEscrita: 0,
      cacheLeitura: 0,
    });
    expect(c).toBeCloseTo(18, 6);
  });

  it("cobra leitura de cache a 10% do preço de entrada", () => {
    const lido = calcularCusto("claude-sonnet-5", {
      entrada: 0,
      saida: 0,
      cacheEscrita: 0,
      cacheLeitura: 1_000_000,
    });
    const cheio = calcularCusto("claude-sonnet-5", {
      entrada: 1_000_000,
      saida: 0,
      cacheEscrita: 0,
      cacheLeitura: 0,
    });
    expect(lido).toBeCloseTo(cheio * MULT_CACHE_LEITURA, 6);
  });

  it("cobra escrita de cache acima do preço de entrada", () => {
    const escrita = calcularCusto("claude-sonnet-5", {
      entrada: 0,
      saida: 0,
      cacheEscrita: 1_000_000,
      cacheLeitura: 0,
    });
    expect(escrita).toBeCloseTo(3.75, 6);
  });

  it("estima modelo desconhecido em vez de devolver zero", () => {
    const c = calcularCusto("modelo-que-ainda-nao-existe", {
      entrada: 1_000_000,
      saida: 0,
      cacheEscrita: 0,
      cacheLeitura: 0,
    });
    expect(c).toBeGreaterThan(0);
  });
});

describe("formatarUSD", () => {
  it("não mostra gasto real como se fosse gratuito", () => {
    expect(formatarUSD(0.0004)).toBe("< $0,01");
    expect(formatarUSD(0)).toBe("$0,00");
    expect(formatarUSD(1.5)).toBe("$1,50");
  });
});

describe("situacaoTeto", () => {
  it("só avisa a partir de 80% do teto", () => {
    expect(situacaoTeto(5, 0)).toBe("sem-teto");
    expect(situacaoTeto(5, 10)).toBe("ok");
    expect(situacaoTeto(8, 10)).toBe("perto");
    expect(situacaoTeto(10, 10)).toBe("estourado");
  });
});
