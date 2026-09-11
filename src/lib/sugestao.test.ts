import { describe, expect, it } from "vitest";
import { sugerirNivel } from "./sugestao";

describe("sugerirNivel (rec. 8: média dos últimos blocos, não só o último)", () => {
  it("sem histórico, não sugere nada", () => {
    expect(sugerirNivel([])).toBeNull();
  });

  it("um bloco reprovado isolado NÃO derruba a sugestão se os 2 anteriores foram bons", () => {
    // Mais recente primeiro (mesma ordem de listarBlocos) — 1 reprovado após
    // 2 aprovados ainda mantém a média ponderada acima do limiar.
    const r = sugerirNivel([
      { nivel: 3, total_acertos: 6, total_questoes: 12, aprovado: false },
      { nivel: 3, total_acertos: 11, total_questoes: 12, aprovado: true },
      { nivel: 3, total_acertos: 11, total_questoes: 12, aprovado: true },
    ]);
    expect(r?.nivel).toBe(4);
  });

  it("três blocos ruins seguidos sugere manter o nível", () => {
    const r = sugerirNivel([
      { nivel: 3, total_acertos: 5, total_questoes: 12, aprovado: false },
      { nivel: 3, total_acertos: 6, total_questoes: 12, aprovado: false },
      { nivel: 3, total_acertos: 7, total_questoes: 12, aprovado: false },
    ]);
    expect(r?.nivel).toBe(3);
    expect(r?.motivo).toContain("abaixo de 80%");
  });

  it("já no nível máximo e com boa média, sugere manter nível 5", () => {
    const r = sugerirNivel([{ nivel: 5, total_acertos: 12, total_questoes: 12, aprovado: true }]);
    expect(r?.nivel).toBe(5);
  });

  it("bloco sem questões (total_questoes 0) é ignorado, não conta como reprovação", () => {
    const r = sugerirNivel([
      { nivel: 2, total_acertos: 0, total_questoes: 0, aprovado: false },
      { nivel: 2, total_acertos: 11, total_questoes: 12, aprovado: true },
    ]);
    expect(r?.nivel).toBe(3);
  });
});
