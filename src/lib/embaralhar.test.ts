import { describe, expect, it } from "vitest";
import { ordemEmbaralhada } from "./embaralhar";
import { Q_POR_BLOCO, Q_POR_SUB } from "./constants";
import { tamanhosSubs } from "./blocoUtils";

describe("ordemEmbaralhada", () => {
  it("devolve uma permutação válida de 0..n-1", () => {
    for (let i = 0; i < 50; i++) {
      const ordem = ordemEmbaralhada(5, 2);
      expect([...ordem].sort()).toEqual([0, 1, 2, 3, 4]);
    }
    expect(ordemEmbaralhada(1, 0)).toEqual([0]);
  });

  it("nunca deixa o gabarito na mesma letra de antes", () => {
    for (let gab = 0; gab < 5; gab++) {
      for (let i = 0; i < 100; i++) {
        const ordem = ordemEmbaralhada(5, gab);
        // ordem[posição exibida] = índice original; a posição original do
        // gabarito não pode continuar exibindo o próprio gabarito.
        expect(ordem[gab]).not.toBe(gab);
      }
    }
  });
});

describe("tamanho padrão do bloco", () => {
  it("é 10 questões, repartidas em sub-blocos que somam 10", () => {
    expect(Q_POR_BLOCO).toBe(10);
    expect(tamanhosSubs(Q_POR_BLOCO, Q_POR_SUB).reduce((a, b) => a + b, 0)).toBe(10);
  });
});
