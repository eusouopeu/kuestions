import { describe, expect, it } from "vitest";
import { gabaritosCEDe, padroesDe, questoesNaoRespondidas } from "./blocoUtils";
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

describe("questoesNaoRespondidas", () => {
  const subs = [
    [q({ enunciado: "1" }), q({ enunciado: "2" }), q({ enunciado: "3" })],
    [q({ enunciado: "4" }), q({ enunciado: "5" }), q({ enunciado: "6" })],
  ];

  it("inclui a questão atual quando ela ainda não foi registrada", () => {
    const r = questoesNaoRespondidas({
      subs,
      qIdx: 4,
      totalQuestoes: 6,
      qPorSub: 3,
      respondidaAtual: false,
    });
    expect(r.map((x) => x.enunciado)).toEqual(["5", "6"]);
  });

  it("pula a questão atual quando ela já foi respondida", () => {
    const r = questoesNaoRespondidas({
      subs,
      qIdx: 4,
      totalQuestoes: 6,
      qPorSub: 3,
      respondidaAtual: true,
    });
    expect(r.map((x) => x.enunciado)).toEqual(["6"]);
  });

  it("não inventa questões de lotes ainda não carregados", () => {
    const r = questoesNaoRespondidas({
      subs: [subs[0], null],
      qIdx: 0,
      totalQuestoes: 6,
      qPorSub: 3,
      respondidaAtual: true,
    });
    expect(r.map((x) => x.enunciado)).toEqual(["2", "3"]);
  });
});
