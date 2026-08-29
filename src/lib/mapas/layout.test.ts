import { describe, expect, it } from "vitest";
import { autoLayout, sanearMapa } from "./layout";

describe("sanearMapa", () => {
  it("rejeita entrada vazia ou sem array de nós", () => {
    expect(sanearMapa(null).ok).toBe(false);
    expect(sanearMapa([]).ok).toBe(false);
    expect(sanearMapa("não é array").ok).toBe(false);
  });

  it("aceita um mapa simples válido", () => {
    const r = sanearMapa([
      { id: 1, text: "Raiz", x: 0, y: 0, parent: null },
      { id: 2, text: "Filho", x: 10, y: 10, parent: 1 },
    ]);
    expect(r.ok).toBe(true);
    expect(r.nos).toHaveLength(2);
    expect(r.curado).toEqual([]);
  });

  it("promove o primeiro nó a raiz quando nenhum pai é null", () => {
    const r = sanearMapa([
      { id: 1, text: "A", parent: 2 },
      { id: 2, text: "B", parent: 1 },
    ]);
    expect(r.ok).toBe(true);
    expect(r.nos!.find((n) => n.pai === null)).toBeTruthy();
    expect(r.curado.some((m) => m.includes("raiz"))).toBe(true);
  });

  it("reanexa nó órfão apontando para pai inexistente", () => {
    const r = sanearMapa([
      { id: 1, text: "Raiz", parent: null },
      { id: 2, text: "Órfão", parent: 999 },
    ]);
    expect(r.ok).toBe(true);
    const orfao = r.nos!.find((n) => n.id === 2);
    expect(orfao?.pai).toBe(1);
    expect(r.curado.some((m) => m.includes("inexistente"))).toBe(true);
  });

  it("quebra ciclo entre dois nós reanexando à raiz", () => {
    const r = sanearMapa([
      { id: 1, text: "Raiz", parent: null },
      { id: 2, text: "A", parent: 3 },
      { id: 3, text: "B", parent: 2 },
    ]);
    expect(r.ok).toBe(true);
    // Ambos alcançáveis a partir da raiz — sem ciclo.
    const porId = new Map(r.nos!.map((n) => [n.id, n]));
    function alcancavel(id: number): boolean {
      let atual: number | null = id;
      let guarda = 0;
      while (atual !== null && guarda++ < 10) {
        if (atual === 1) return true;
        atual = porId.get(atual)?.pai ?? null;
      }
      return false;
    }
    expect(alcancavel(2)).toBe(true);
    expect(alcancavel(3)).toBe(true);
  });

  it("reatribui id duplicado", () => {
    const r = sanearMapa([
      { id: 1, text: "Raiz", parent: null },
      { id: 1, text: "Duplicado", parent: 1 },
    ]);
    expect(r.ok).toBe(true);
    const ids = r.nos!.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marca precisaLayout quando x/y ausentes", () => {
    const r = sanearMapa([
      { id: 1, text: "Raiz", parent: null },
      { id: 2, text: "Filho", parent: 1 },
    ]);
    expect(r.precisaLayout).toBe(true);
  });
});

describe("autoLayout", () => {
  it("não sobrepõe nós irmãos", () => {
    const nos = [
      { id: 1, texto: "Raiz", x: 0, y: 0, pai: null, cor: "caneta", tamanho: "grande" as const },
      { id: 2, texto: "A", x: 0, y: 0, pai: 1, cor: "caneta", tamanho: "medio" as const },
      { id: 3, texto: "B", x: 0, y: 0, pai: 1, cor: "caneta", tamanho: "medio" as const },
    ];
    const posicionados = autoLayout(nos, 900);
    const a = posicionados.find((n) => n.id === 2)!;
    const b = posicionados.find((n) => n.id === 3)!;
    expect(a.x).not.toBe(b.x);
    expect(a.y).toBe(b.y);
  });

  it("posiciona a raiz no topo, filhos abaixo", () => {
    const nos = [
      { id: 1, texto: "Raiz", x: 0, y: 0, pai: null, cor: "caneta", tamanho: "grande" as const },
      { id: 2, texto: "Filho", x: 0, y: 0, pai: 1, cor: "caneta", tamanho: "medio" as const },
    ];
    const posicionados = autoLayout(nos, 900);
    const raiz = posicionados.find((n) => n.id === 1)!;
    const filho = posicionados.find((n) => n.id === 2)!;
    expect(filho.y).toBeGreaterThan(raiz.y);
  });
});
