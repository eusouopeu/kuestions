import { describe, expect, it } from "vitest";
import { estimarNotaProvavel, preverAprovacao, type Fatia } from "./repo";

describe("preverAprovacao", () => {
  it("devolve null com menos de 4 amostras", () => {
    expect(preverAprovacao([{ i: 1, pct: 50 }, { i: 2, pct: 60 }])).toBeNull();
  });

  it("detecta tendência subindo e projeta blocos até 90%", () => {
    const serie = [
      { i: 1, pct: 60 },
      { i: 2, pct: 68 },
      { i: 3, pct: 76 },
      { i: 4, pct: 84 },
    ];
    const r = preverAprovacao(serie);
    expect(r).not.toBeNull();
    expect(r?.tendencia).toBe("subindo");
    expect(r?.jaAlcancada).toBe(false);
    expect(r?.blocosAteAlvo).toBeGreaterThan(0);
  });

  it("marca jaAlcancada quando o último bloco já passou de 90%", () => {
    const serie = [
      { i: 1, pct: 88 },
      { i: 2, pct: 90 },
      { i: 3, pct: 91 },
      { i: 4, pct: 92 },
    ];
    const r = preverAprovacao(serie);
    expect(r?.jaAlcancada).toBe(true);
    expect(r?.blocosAteAlvo).toBeNull();
  });

  it("classifica como estável quando a inclinação é pequena", () => {
    const serie = [
      { i: 1, pct: 70 },
      { i: 2, pct: 71 },
      { i: 3, pct: 70 },
      { i: 4, pct: 71 },
    ];
    const r = preverAprovacao(serie);
    expect(r?.tendencia).toBe("estavel");
    expect(r?.blocosAteAlvo).toBeNull();
  });
});

describe("estimarNotaProvavel", () => {
  const base: Fatia[] = [
    { chave: "Direito Tributário", total: 20, acertos: 16, pct: 80 },
    { chave: "Auditoria", total: 10, acertos: 5, pct: 50 },
    { chave: "Estatística", total: 2, acertos: 2, pct: 100 },
  ];

  it("pondera pelo peso do edital e exclui peso zero e poucas amostras", () => {
    const r = estimarNotaProvavel(base, { "Direito Tributário": 4, Auditoria: 1, Estatística: 3 }, 5);
    expect(r).not.toBeNull();
    expect(r?.materiasExcluidas).toEqual([{ materia: "Estatística", motivo: "poucas-amostras" }]);
    expect(r?.materiasIncluidas.map((m) => m.materia)).toEqual(["Direito Tributário", "Auditoria"]);
    // (80*4 + 50*1) / 5 = 74
    expect(r?.notaEstimada).toBe(74);
    expect(r?.amostras).toBe(30);
  });

  it("matéria com peso 0 ('não cai') não entra no cálculo", () => {
    const r = estimarNotaProvavel(base, { "Direito Tributário": 0, Auditoria: 1 }, 5);
    expect(r?.materiasExcluidas).toContainEqual({ materia: "Direito Tributário", motivo: "peso-zero" });
    expect(r?.notaEstimada).toBe(50);
  });

  it("devolve null quando nenhuma matéria sobra após os filtros", () => {
    const r = estimarNotaProvavel(base, {}, 100);
    expect(r).toBeNull();
  });

  it("matéria sem peso configurado usa peso padrão 1", () => {
    const r = estimarNotaProvavel([{ chave: "X", total: 10, acertos: 7, pct: 70 }], {}, 5);
    expect(r?.materiasIncluidas[0].peso).toBe(1);
    expect(r?.notaEstimada).toBe(70);
  });
});
