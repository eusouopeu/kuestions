import { describe, it, expect } from "vitest";
import { normalizarLayoutTexto, resumirEmLinha } from "./texto";
import { questaoBancoParaQuestao } from "./banco";

describe("normalizarLayoutTexto", () => {
  it("preserva quebras simples e duplas (itens I, II, III e tabelas do enunciado)", () => {
    const enunciado =
      "Considere as afirmativas:\n\nI. primeira\nII. segunda\nIII. terceira";
    expect(normalizarLayoutTexto(enunciado)).toBe(enunciado);
  });

  it("limpa espaços no fim das linhas e colapsa 3+ linhas em branco em duas, mantendo o recuo", () => {
    // O recuo no começo da linha é preservado (indentação de item/tabela faz
    // parte do layout); só o espaço ao fim e as pontas do texto somem.
    expect(normalizarLayoutTexto("  a   \n   \n\n\n b \n\n")).toBe("a\n\n b");
  });
});

describe("resumirEmLinha", () => {
  it("colapsa quebras em espaço para as prévias de 2 linhas", () => {
    expect(resumirEmLinha("I. um\nII. dois\n\nIII. três")).toBe("I. um II. dois III. três");
  });
});

describe("questaoBancoParaQuestao", () => {
  it("mantém as quebras de linha do enunciado e das alternativas do banco", () => {
    const q = questaoBancoParaQuestao({
      id: "X-1",
      instituicao: "SEFAZ-BA",
      ano: 2025,
      cargo: "Auditor",
      area: "Contabilidade Geral",
      assunto: "Balanço",
      numero_original: 1,
      enunciado: "Analise:\n\nconta\nsaldo\ncaixa\n10",
      alternativas: { A: "linha 1\nlinha 2", B: "b" },
      gabarito: "A",
    } as never);
    expect(q.enunciado).toContain("\n\nconta\nsaldo");
    expect(q.alternativas?.[0]).toBe("A) linha 1\nlinha 2");
  });
});
