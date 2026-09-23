import { describe, it, expect } from "vitest";
import { aprovadoNoBloco } from "./blocoUtils";
import { lerExpressaoCalculadora, guardarExpressaoCalculadora } from "./calculadoraEstado";
import { calcular } from "./calculadora";

describe("aprovadoNoBloco (bloco encerrado antes do fim)", () => {
  it("julga pelo que foi respondido, não pelo tamanho original do bloco", () => {
    // Bloco de 10 questões encerrado na 5ª, com 4 acertos em 4 respondidas:
    // aprovado — as 6 não respondidas não contam contra.
    expect(aprovadoNoBloco(4, 4)).toBe(true);
    expect(aprovadoNoBloco(4, 10)).toBe(false);
  });

  it("bloco sem nenhuma questão respondida não é aprovado", () => {
    expect(aprovadoNoBloco(0, 0)).toBe(false);
  });
});

describe("estado da calculadora entre fechar e reabrir", () => {
  it("mantém a expressão digitada depois de fechada", () => {
    guardarExpressaoCalculadora("1200*18%");
    expect(lerExpressaoCalculadora()).toBe("1200*18%");
  });

  it("calcula a expressão digitada no teclado nativo (/, *, ponto decimal)", () => {
    expect(calcular("15/3+2*4")).toBe(13);
    expect(calcular(lerExpressaoCalculadora())).toBe(216);
  });
});
