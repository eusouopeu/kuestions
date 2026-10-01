import { describe, expect, it } from "vitest";
import { calcularRitmo, projetarAteProva, alocacaoVsEdital } from "./ritmo";
import { distribuirBlocoMisto, intercalar } from "./blocoMisto";

describe("calcularRitmo", () => {
  const hoje = "2026-10-10";
  it("soma os últimos 7 dias (hoje incluso), projeta 1 ano e compara com os 7 anteriores", () => {
    const r = calcularRitmo(
      [
        { data: "2026-10-10", total: 20 },
        { data: "2026-10-04", total: 50 }, // 7º dia da janela atual
        { data: "2026-10-03", total: 35 }, // 1º da janela anterior
        { data: "2026-09-27", total: 0 },
        { data: "2026-09-26", total: 999 }, // fora das duas janelas
      ],
      hoje,
    );
    expect(r.ultimos7).toBe(70);
    expect(r.anteriores7).toBe(35);
    expect(r.porDia).toBeCloseTo(10);
    expect(r.porAno).toBe(3650);
    expect(r.variacaoPct).toBe(100);
  });

  it("sem semana anterior, variação é null (não há base de comparação)", () => {
    const r = calcularRitmo([{ data: "2026-10-09", total: 7 }], hoje);
    expect(r.variacaoPct).toBeNull();
    expect(r.porAno).toBe(365);
  });
});

describe("projetarAteProva", () => {
  it("conta dias até a prova e o ritmo diário necessário para a meta restante", () => {
    const p = projetarAteProva({ hoje: "2026-10-01", dataProva: "2026-10-31", porDia: 10, restantes: 600 });
    expect(p.dias).toBe(30);
    expect(p.projetadas).toBe(300);
    expect(p.necessarioPorDia).toBe(20);
  });

  it("prova passada ou hoje: zero dias e nada necessário", () => {
    const p = projetarAteProva({ hoje: "2026-10-01", dataProva: "2026-09-01", porDia: 10, restantes: 600 });
    expect(p.dias).toBe(0);
    expect(p.necessarioPorDia).toBeNull();
  });
});

describe("alocacaoVsEdital", () => {
  it("compara fatia de questões com fatia de peso e ignora matéria peso 0 sem prática", () => {
    const r = alocacaoVsEdital(
      { "Direito Tributário": 10, Economia: 30 },
      { "Direito Tributário": 3, Economia: 1, Estatística: 0 },
      ["Direito Tributário", "Economia", "Estatística"],
    );
    const dt = r.find((x) => x.materia === "Direito Tributário")!;
    expect(dt.pctQuestoes).toBe(25);
    expect(dt.pctEdital).toBe(75);
    expect(dt.situacao).toBe("abaixo");
    expect(r.find((x) => x.materia === "Economia")!.situacao).toBe("acima");
    expect(r.some((x) => x.materia === "Estatística")).toBe(false);
    // Maior déficit primeiro.
    expect(r[0].materia).toBe("Direito Tributário");
  });
});

describe("distribuirBlocoMisto", () => {
  it("reparte n entre áreas pelo peso × fraqueza, respeitando o disponível", () => {
    const d = distribuirBlocoMisto(
      [
        { area: "A", peso: 5, acertos: 2, total: 10, disponiveis: 100 }, // fraca e pesada
        { area: "B", peso: 1, acertos: 9, total: 10, disponiveis: 100 }, // forte e leve
        { area: "C", peso: 0, acertos: 0, total: 0, disponiveis: 100 }, // peso 0: fora
        { area: "D", peso: 5, acertos: 0, total: 0, disponiveis: 1 }, // limitada pelo estoque
      ],
      10,
    );
    const total = [...d.values()].reduce((s, v) => s + v, 0);
    expect(total).toBe(10);
    expect(d.get("C") ?? 0).toBe(0);
    expect(d.get("D") ?? 0).toBeLessThanOrEqual(1);
    expect(d.get("A")!).toBeGreaterThan(d.get("B") ?? 0);
  });

  it("intercala as áreas em vez de agrupá-las", () => {
    const r = intercalar([
      ["a1", "a2", "a3"],
      ["b1"],
      ["c1", "c2"],
    ]);
    expect(r).toEqual(["a1", "b1", "c1", "a2", "c2", "a3"]);
  });
});
