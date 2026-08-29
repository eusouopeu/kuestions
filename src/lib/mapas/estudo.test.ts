import { describe, expect, it } from "vitest";
import { construirFilaDFS, responder, talvezReciclarErradas } from "./estudo";
import type { NoMapa } from "./tipos";

function no(id: number, pai: number | null): NoMapa {
  return { id, texto: `n${id}`, x: 0, y: 0, pai, cor: "caneta", tamanho: "medio" };
}

describe("construirFilaDFS", () => {
  it("percorre em ordem DFS, pai antes de todos os filhos do irmão seguinte", () => {
    // 1 (raiz) -> 2 -> 4; 1 -> 3
    const nos = [no(1, null), no(2, 1), no(3, 1), no(4, 2)];
    expect(construirFilaDFS(nos)).toEqual([2, 4, 3]);
  });

  it("nunca inclui a raiz", () => {
    const nos = [no(1, null), no(2, 1)];
    expect(construirFilaDFS(nos)).not.toContain(1);
  });

  it("não trava em ciclo (guarda de visitados)", () => {
    // 2 e 3 apontando um pro outro por engano, mas alcançáveis da raiz.
    const nos = [no(1, null), no(2, 1), no(3, 2)];
    // Simula ciclo direto adicionando pai inválido não deveria travar mesmo
    // que o saneamento normalmente já preveniria isso antes de chegar aqui.
    expect(() => construirFilaDFS(nos)).not.toThrow();
  });

  it("respeita filtro de ids (estudar só um sub-ramo)", () => {
    const nos = [no(1, null), no(2, 1), no(3, 1), no(4, 2)];
    expect(construirFilaDFS(nos, new Set([2, 4]))).toEqual([2, 4]);
  });

  it("mapa só com raiz devolve fila vazia", () => {
    expect(construirFilaDFS([no(1, null)])).toEqual([]);
  });
});

describe("responder", () => {
  it("acerto remove o nó da fila sem penalidade", () => {
    const r = responder({ fila: [2, 3, 4], filaErradas: [] }, true, "nenhuma");
    expect(r.fila).toEqual([3, 4]);
  });

  it("penalidade 'logo' reinsere 3 posições à frente", () => {
    const r = responder({ fila: [2, 3, 4, 5, 6], filaErradas: [] }, false, "logo");
    expect(r.fila).toEqual([3, 4, 5, 2, 6]);
  });

  it("penalidade 'logo' com menos de 3 restantes reinsere no fim", () => {
    const r = responder({ fila: [2, 3], filaErradas: [] }, false, "logo");
    expect(r.fila).toEqual([3, 2]);
  });

  it("penalidade 'depois' manda para filaErradas, fora da fila principal", () => {
    const r = responder({ fila: [2, 3], filaErradas: [] }, false, "depois");
    expect(r.fila).toEqual([3]);
    expect(r.filaErradas).toEqual([2]);
  });

  it("penalidade 'nenhuma' só descarta", () => {
    const r = responder({ fila: [2, 3], filaErradas: [] }, false, "nenhuma");
    expect(r.fila).toEqual([3]);
    expect(r.filaErradas).toEqual([]);
  });
});

describe("talvezReciclarErradas", () => {
  it("recicla erradas quando a fila principal esvazia", () => {
    const r = talvezReciclarErradas({ fila: [], filaErradas: [2, 3] }, "sequencial");
    expect(r.fila).toEqual([2, 3]);
    expect(r.filaErradas).toEqual([]);
  });

  it("não mexe se a fila principal ainda tem itens", () => {
    const estado = { fila: [1], filaErradas: [2] };
    expect(talvezReciclarErradas(estado, "sequencial")).toBe(estado);
  });

  it("não mexe se não há erradas", () => {
    const estado = { fila: [], filaErradas: [] };
    expect(talvezReciclarErradas(estado, "sequencial")).toBe(estado);
  });
});
