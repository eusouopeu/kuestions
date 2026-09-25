import { describe, expect, it } from "vitest";
import { lerNotasImportadas } from "./importarNotas";

describe("lerNotasImportadas", () => {
  it("aceita o formato do Prova do Crime e descarta itens inválidos", () => {
    const r = lerNotasImportadas({
      origem: "prova-do-crime", caso: "Heitor",
      notas: [
        { materia: "Direito Administrativo", corpo: "Dispensa :: até o limite – art. 75, II", tag: "prova-do-crime" },
        { materia: "", corpo: "x :: y", tag: "t" },
        { materia: "Economia", corpo: "sem separador", tag: "t" },
      ],
    });
    expect(r).toEqual({ notas: [{ materia: "Direito Administrativo", corpo: "Dispensa :: até o limite – art. 75, II", tag: "prova-do-crime" }], descartadas: 2 });
  });

  it("rejeita arquivo sem lista de notas", () => {
    expect(() => lerNotasImportadas({ questoes: [] })).toThrow(/notas/);
  });
});
