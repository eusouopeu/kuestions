import { describe, expect, it } from "vitest";
import {
  gabaritosCEDe,
  localizarQuestao,
  padroesDe,
  tamanhosSubs,
} from "./blocoUtils";
import type { Questao } from "./types";

function q(over: Partial<Questao> = {}): Questao {
  return {
    enunciado: "e",
    formato: "ce",
    alternativas: null,
    gabarito: "C",
    conceitos: [],
    comentario: "",
    explicacoes_erradas: {},
    dispositivo: null,
    ...over,
  };
}

describe("padroesDe", () => {
  it("resume os conceitos de cada lote anterior, sem repetir", () => {
    const subs = [
      [q({ conceitos: ["imunidade", "imunidade", "competência"] })],
      [q({ conceitos: ["anterioridade"] })],
      null,
    ];
    expect(padroesDe(subs, 2)).toEqual([
      "Lote 1: imunidade, competência",
      "Lote 2: anterioridade",
    ]);
  });

  it("ignora lotes ainda não carregados e não olha para a frente", () => {
    const subs = [null, [q({ conceitos: ["x"] })]];
    expect(padroesDe(subs, 1)).toEqual([]);
  });

  it("limita a 4 conceitos por lote", () => {
    const subs = [[q({ conceitos: ["a", "b", "c", "d", "e"] })]];
    expect(padroesDe(subs, 1)).toEqual(["Lote 1: a, b, c, d"]);
  });
});

describe("gabaritosCEDe", () => {
  it("coleta só os gabaritos de Certo/Errado dos lotes anteriores", () => {
    const subs = [
      [q({ gabarito: "C" }), q({ formato: "mc", gabarito: "B" }), q({ gabarito: "E" })],
      [q({ gabarito: "E" })],
    ];
    expect(gabaritosCEDe(subs, 2)).toEqual(["C", "E", "E"]);
    expect(gabaritosCEDe(subs, 1)).toEqual(["C", "E"]);
  });
});

describe("tamanhosSubs", () => {
  it("divide em sub-blocos cheios quando a quantidade é múltipla", () => {
    expect(tamanhosSubs(12, 3)).toEqual([3, 3, 3, 3]);
  });

  it("equilibra o resto em vez de deixar um sub-bloco de 1 questão", () => {
    expect(tamanhosSubs(13, 3)).toEqual([3, 3, 3, 2, 2]);
    expect(tamanhosSubs(4, 3)).toEqual([2, 2]);
  });

  it("nunca devolve bloco vazio", () => {
    expect(tamanhosSubs(1, 3)).toEqual([1]);
    expect(tamanhosSubs(0, 3)).toEqual([1]);
  });
});

describe("localizarQuestao", () => {
  it("mapeia a posição global para sub-bloco e índice", () => {
    const t = [3, 2, 2];
    expect(localizarQuestao(t, 0)).toEqual({ sub: 0, pos: 0 });
    expect(localizarQuestao(t, 3)).toEqual({ sub: 1, pos: 0 });
    expect(localizarQuestao(t, 6)).toEqual({ sub: 2, pos: 1 });
  });

  it("devolve null fora do bloco", () => {
    expect(localizarQuestao([3, 2], 5)).toBeNull();
    expect(localizarQuestao([3, 2], -1)).toBeNull();
  });
});
