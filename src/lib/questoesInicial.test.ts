import { describe, expect, it } from "vitest";
import { escolherViewInicial } from "./questoesInicial";

describe("escolherViewInicial", () => {
  it("abre em banco quando não há credencial", () => {
    expect(escolherViewInicial(false)).toBe("banco");
  });

  it("abre em gerar quando há credencial", () => {
    expect(escolherViewInicial(true)).toBe("gerar");
  });
});
