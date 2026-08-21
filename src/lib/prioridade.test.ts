import { describe, expect, it } from "vitest";
import { priorizar, type EntradaPrioridade } from "./prioridade";

const AGORA = new Date("2026-08-20T12:00:00.000Z").getTime();
const diasAtras = (n: number) => new Date(AGORA - n * 86_400_000).toISOString();

describe("priorizar", () => {
  it("põe a matéria de maior peso na frente quando o resto é igual", () => {
    const entradas: EntradaPrioridade[] = [
      { materia: "A", pct: 60, total: 50, ultimaPratica: diasAtras(3) },
      { materia: "B", pct: 60, total: 50, ultimaPratica: diasAtras(3) },
    ];
    const [primeiro] = priorizar(entradas, { A: 1, B: 5 }, AGORA);
    expect(primeiro.materia).toBe("B");
  });

  it("põe a matéria mais fraca na frente quando peso e atraso são iguais", () => {
    const entradas: EntradaPrioridade[] = [
      { materia: "Forte", pct: 95, total: 50, ultimaPratica: diasAtras(3) },
      { materia: "Fraca", pct: 45, total: 50, ultimaPratica: diasAtras(3) },
    ];
    const [primeiro] = priorizar(entradas, { Forte: 3, Fraca: 3 }, AGORA);
    expect(primeiro.materia).toBe("Fraca");
  });

  it("desempata pelo atraso quando peso e acerto são iguais", () => {
    const entradas: EntradaPrioridade[] = [
      { materia: "Recente", pct: 70, total: 50, ultimaPratica: diasAtras(0) },
      { materia: "Parada", pct: 70, total: 50, ultimaPratica: diasAtras(20) },
    ];
    const [primeiro] = priorizar(entradas, { Recente: 3, Parada: 3 }, AGORA);
    expect(primeiro.materia).toBe("Parada");
  });

  it("descarta matéria com peso 0, por mais fraca e esquecida que esteja", () => {
    const entradas: EntradaPrioridade[] = [
      { materia: "Fora do edital", pct: 10, total: 100, ultimaPratica: null },
      { materia: "No edital", pct: 90, total: 100, ultimaPratica: diasAtras(0) },
    ];
    const r = priorizar(entradas, { "Fora do edital": 0, "No edital": 2 }, AGORA);
    expect(r.map((p) => p.materia)).toEqual(["No edital"]);
  });

  it("não trata amostra pequena como fraqueza comprovada", () => {
    const entradas: EntradaPrioridade[] = [
      { materia: "Pouca amostra", pct: 0, total: 3, ultimaPratica: diasAtras(1) },
      { materia: "Fraca de verdade", pct: 30, total: 60, ultimaPratica: diasAtras(1) },
    ];
    const [primeiro] = priorizar(entradas, { "Pouca amostra": 3, "Fraca de verdade": 3 }, AGORA);
    expect(primeiro.materia).toBe("Fraca de verdade");
  });

  it("trata matéria nunca praticada como atraso máximo e explica o motivo", () => {
    const [p] = priorizar(
      [{ materia: "Nova", pct: 0, total: 0, ultimaPratica: null }],
      { Nova: 4 },
      AGORA,
    );
    expect(p.diasSemPraticar).toBeNull();
    expect(p.motivo).toContain("nunca praticada");
    expect(p.motivo).toContain("peso 4");
  });
});
