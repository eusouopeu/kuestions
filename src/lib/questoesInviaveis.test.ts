import { beforeEach, describe, expect, it, vi } from "vitest";

const armazenamento = new Map<string, string>();
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({ value: armazenamento.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => void armazenamento.set(key, value),
  },
}));

import { carregarInviaveis, ehInviavel, marcarInviavel, _resetInviaveis } from "./questoesInviaveis";
import { contarDisponiveis, garantirBanco, selecionarQuestoes, areasBanco } from "./banco";
import { montarPromptDefinir } from "./anthropic";

beforeEach(() => {
  armazenamento.clear();
  _resetInviaveis();
});

describe("questoesInviaveis", () => {
  it("persiste a marcação e recarrega depois de um reinício", async () => {
    await marcarInviavel("q-123");
    expect(ehInviavel("q-123")).toBe(true);
    _resetInviaveis();
    expect(ehInviavel("q-123")).toBe(false);
    await carregarInviaveis();
    expect(ehInviavel("q-123")).toBe(true);
  });
});

describe("banco × questões inviáveis", () => {
  it("questão marcada deixa de ser sorteada e de ser contada", async () => {
    await garantirBanco();
    const area = areasBanco()[0];
    const antes = contarDisponiveis(area, { modo: "todos" });
    const alvo = selecionarQuestoes(area, { modo: "todos" }, 5)[0];
    await marcarInviavel(alvo.id);
    expect(contarDisponiveis(area, { modo: "todos" })).toBe(antes - 1);
    const depois = selecionarQuestoes(area, { modo: "todos" }, antes);
    expect(depois.map((q) => q.id)).not.toContain(alvo.id);
  });
});

describe("montarPromptDefinir", () => {
  it("leva o termo, o contexto e pede texto puro curto", () => {
    const p = montarPromptDefinir("diferimento", "Sobre o diferimento do ICMS, é correto afirmar:", "Direito Tributário");
    expect(p).toContain("diferimento");
    expect(p).toContain("Sobre o diferimento do ICMS");
    expect(p).toContain("Direito Tributário");
    expect(p).toMatch(/sem markdown/i);
  });
});
