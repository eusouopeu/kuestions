import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  all: vi.fn(),
  one: vi.fn(),
  run: vi.fn(),
  runBatch: vi.fn(),
  parseJSON: (s: string) => JSON.parse(s),
  toBool: (v: unknown) => Boolean(v),
}));

import { all } from "./db";
import { materiasMenosRespondidas } from "./repo/questoes";
import { escolherMateriaSugerida } from "./materiaSugerida";

const allMock = vi.mocked(all);

describe("materiasMenosRespondidas (matéria padrão sutil)", () => {
  it("ordena candidatas por total crescente, tratando ausência de linha como 0", async () => {
    allMock.mockResolvedValueOnce([
      { materia: "Economia", total: 40 },
      { materia: "Auditoria", total: 3 },
    ]);
    const r = await materiasMenosRespondidas(["Economia", "Auditoria", "Estatística"], 5);
    // Estatística nunca respondida (0) vem antes de Auditoria (3) e Economia (40).
    expect(r).toEqual(["Estatística", "Auditoria", "Economia"]);
  });

  it("respeita o limite n mesmo com mais candidatas", async () => {
    allMock.mockResolvedValueOnce([]);
    const r = await materiasMenosRespondidas(["A", "B", "C", "D", "E", "F"], 5);
    expect(r).toHaveLength(5);
  });
});

describe("escolherMateriaSugerida", () => {
  it("sorteia sempre dentre as 5 piores, nunca fora da lista", async () => {
    allMock.mockResolvedValue([
      { materia: "Direito Tributário", total: 100 },
      { materia: "Direito Constitucional", total: 90 },
    ]);
    const candidatas = [
      "Direito Tributário",
      "Direito Constitucional",
      "Contabilidade Geral",
      "Contabilidade Pública",
      "Auditoria",
      "Finanças Públicas",
      "Matemática Financeira",
    ];
    const piores5 = new Set(["Contabilidade Geral", "Contabilidade Pública", "Auditoria", "Finanças Públicas", "Matemática Financeira"]);
    for (let i = 0; i < 20; i++) {
      const escolhida = await escolherMateriaSugerida(candidatas);
      expect(piores5.has(escolhida as string)).toBe(true);
    }
  });

  it("devolve null para lista de candidatas vazia", async () => {
    expect(await escolherMateriaSugerida([])).toBeNull();
  });
});
