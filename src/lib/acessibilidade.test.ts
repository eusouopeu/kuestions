import { describe, expect, it } from "vitest";
import { PROXIMA_ESCALA } from "./acessibilidade";

describe("PROXIMA_ESCALA", () => {
  it("cicla 100 -> 110 -> 125 -> 100", () => {
    expect(PROXIMA_ESCALA[100]).toBe(110);
    expect(PROXIMA_ESCALA[110]).toBe(125);
    expect(PROXIMA_ESCALA[125]).toBe(100);
  });
});
