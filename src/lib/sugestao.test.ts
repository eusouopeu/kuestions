import { describe, expect, it } from "vitest";
import { sugerirNivel } from "./sugestao";

describe("sugerirNivel", () => {
  it("sem histórico, não sugere nada", () => {
    expect(sugerirNivel(null)).toBeNull();
  });

  it("bloco aprovado sugere subir um nível", () => {
    const r = sugerirNivel({ nivel: 2, total_acertos: 11, total_questoes: 12, aprovado: true });
    expect(r?.nivel).toBe(3);
    expect(r?.motivo).toContain("11/12");
  });

  it("já no nível máximo e aprovado, sugere manter nível 5", () => {
    const r = sugerirNivel({ nivel: 5, total_acertos: 12, total_questoes: 12, aprovado: true });
    expect(r?.nivel).toBe(5);
  });

  it("bloco reprovado sugere repetir o mesmo nível", () => {
    const r = sugerirNivel({ nivel: 3, total_acertos: 8, total_questoes: 12, aprovado: false });
    expect(r?.nivel).toBe(3);
    expect(r?.motivo).toContain("abaixo de 90%");
  });

  it("bloco sem questões (total_questoes 0) não sugere nada", () => {
    expect(sugerirNivel({ nivel: 3, total_acertos: 0, total_questoes: 0, aprovado: false })).toBeNull();
  });
});
