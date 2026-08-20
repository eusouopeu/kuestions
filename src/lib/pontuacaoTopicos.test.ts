import { describe, expect, it, vi } from "vitest";
import { escolherPonderado, pontosResposta } from "./pontuacaoTopicos";

describe("pontosResposta", () => {
  it("2 pontos ao acertar com certeza", () => {
    expect(pontosResposta(true, "certeza", "mc")).toBe(2);
    expect(pontosResposta(true, "certeza", "ce")).toBe(2);
  });

  it("1 ponto ao acertar no chute em múltipla escolha", () => {
    expect(pontosResposta(true, "chute", "mc")).toBe(1);
  });

  it("0 pontos ao acertar no chute em Certo/Errado", () => {
    expect(pontosResposta(true, "chute", "ce")).toBe(0);
  });

  it("0 pontos ao errar, com qualquer confiança", () => {
    expect(pontosResposta(false, "certeza", "mc")).toBe(0);
    expect(pontosResposta(false, "chute", "ce")).toBe(0);
    expect(pontosResposta(false, null, "mc")).toBe(0);
  });

  it("0 pontos quando a confiança não foi perguntada", () => {
    expect(pontosResposta(true, null, "mc")).toBe(0);
  });
});

describe("escolherPonderado", () => {
  it("null com lista vazia", () => {
    expect(escolherPonderado([])).toBeNull();
  });

  it("prioriza fortemente o item de pontuação média mais baixa", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const itens = [
      { chave: "forte", pontos: 20, total: 10 }, // média 2
      { chave: "fraco", pontos: 0, total: 10 }, // média 0 (nunca acertou)
    ];
    const escolhido = escolherPonderado(itens);
    expect(escolhido?.chave).toBe("fraco");
    vi.restoreAllMocks();
  });

  it("nunca praticado (total 0) conta como média 0 — prioridade máxima", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const itens = [
      { chave: "dominado", pontos: 18, total: 9 }, // média 2
      { chave: "nunca-praticado", pontos: 0, total: 0 },
    ];
    const escolhido = escolherPonderado(itens);
    expect(escolhido?.chave).toBe("nunca-praticado");
    vi.restoreAllMocks();
  });
});
