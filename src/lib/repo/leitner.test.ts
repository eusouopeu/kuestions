import { describe, expect, it } from "vitest";
import {
  ajustarFacilidade,
  diasProximaRevisao,
  FACILIDADE_MAX,
  FACILIDADE_MIN,
  FACILIDADE_PADRAO,
} from "./leitner";

describe("ajustarFacilidade (rec. 7)", () => {
  it("aplica o delta normalmente dentro da faixa", () => {
    expect(ajustarFacilidade(FACILIDADE_PADRAO, 0.15)).toBeCloseTo(2.65);
    expect(ajustarFacilidade(FACILIDADE_PADRAO, -0.2)).toBeCloseTo(2.3);
  });

  it("nunca passa do teto nem do piso, mesmo com deltas repetidos", () => {
    expect(ajustarFacilidade(FACILIDADE_MAX, 0.15)).toBe(FACILIDADE_MAX);
    expect(ajustarFacilidade(FACILIDADE_MIN, -0.2)).toBe(FACILIDADE_MIN);
  });
});

describe("diasProximaRevisao (rec. 7)", () => {
  it("facilidade padrão devolve o dia-base da caixa, sem alteração", () => {
    expect(diasProximaRevisao(2, FACILIDADE_PADRAO)).toBe(3);
    expect(diasProximaRevisao(4, FACILIDADE_PADRAO)).toBe(16);
  });

  it("facilidade acima do padrão espaça mais que o dia-base da mesma caixa", () => {
    expect(diasProximaRevisao(4, FACILIDADE_MAX)).toBeGreaterThan(16);
  });

  it("facilidade abaixo do padrão nunca deixa o intervalo cair a menos de 1 dia", () => {
    expect(diasProximaRevisao(1, FACILIDADE_MIN)).toBeGreaterThanOrEqual(1);
  });
});
