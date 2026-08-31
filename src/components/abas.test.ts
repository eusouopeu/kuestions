import { describe, expect, it } from "vitest";
import { ABAS } from "./abas";

describe("ABAS", () => {
  it("tem 4 abas, sem 'blocos', na ordem questoes/notas/dados/ajustes", () => {
    expect(ABAS.map((a) => a.id)).toEqual(["questoes", "notas", "dados", "ajustes"]);
  });
});
