import { describe, expect, it } from "vitest";
import { caracteresDaQuestao, caracteresDeLeitura } from "./banco";

describe("caracteresDeLeitura", () => {
  it("soma texto de apoio, enunciado e alternativas, colapsando espaços", () => {
    expect(
      caracteresDeLeitura({ texto_apoio: "ab", enunciado: "c  d\n", alternativas: { A: "e", B: "f" } }),
    ).toBe("abc d ef".length);
  });

  it("figura ou tabela nunca cabe em leitura curta", () => {
    expect(caracteresDeLeitura({ enunciado: "x ![Imagem](a.png)", alternativas: {} })).toBe(Infinity);
    expect(caracteresDeLeitura({ enunciado: "<table><tr></tr></table>", alternativas: {} })).toBe(Infinity);
  });
});

describe("caracteresDaQuestao", () => {
  it("conta enunciado e alternativas da Questao do app", () => {
    expect(caracteresDaQuestao({ enunciado: "abc", alternativas: ["A) x", "B) y"] })).toBe("abcA) xB) y".length);
    expect(caracteresDaQuestao({ enunciado: "Item certo.", alternativas: null })).toBe(11);
  });
});
