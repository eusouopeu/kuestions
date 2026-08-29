import { describe, expect, it } from "vitest";
import { extrairLinksDePagina, segmentarLinksDePagina } from "./marcacao";

describe("segmentarLinksDePagina", () => {
  it("texto sem link vira um único segmento", () => {
    expect(segmentarLinksDePagina("olá mundo")).toEqual([{ tipo: "texto", texto: "olá mundo" }]);
  });

  it("texto vazio devolve um segmento vazio (round-trip seguro)", () => {
    expect(segmentarLinksDePagina("")).toEqual([{ tipo: "texto", texto: "" }]);
  });

  it("separa um link no meio do texto", () => {
    expect(segmentarLinksDePagina("veja [[Imunidades]] no edital")).toEqual([
      { tipo: "texto", texto: "veja " },
      { tipo: "link", texto: "Imunidades" },
      { tipo: "texto", texto: " no edital" },
    ]);
  });

  it("link no início e no fim, sem texto sobrando nas pontas", () => {
    expect(segmentarLinksDePagina("[[A]] e [[B]]")).toEqual([
      { tipo: "link", texto: "A" },
      { tipo: "texto", texto: " e " },
      { tipo: "link", texto: "B" },
    ]);
  });

  it("aparas espaço dentro dos colchetes", () => {
    expect(segmentarLinksDePagina("[[  Com espaço  ]]")).toEqual([
      { tipo: "link", texto: "Com espaço" },
    ]);
  });

  it("round-trip: concatenar os segmentos reconstrói o texto original (fora do trim do link)", () => {
    const original = "a [[B]] c [[D]] e";
    const segs = segmentarLinksDePagina(original);
    const reconstruido = segs.map((s) => (s.tipo === "link" ? `[[${s.texto}]]` : s.texto)).join("");
    expect(reconstruido).toBe(original);
  });
});

describe("extrairLinksDePagina", () => {
  it("extrai títulos sem duplicatas", () => {
    expect(extrairLinksDePagina("[[A]] e [[B]] e [[A]] de novo")).toEqual(["A", "B"]);
  });

  it("nenhum link -> lista vazia", () => {
    expect(extrairLinksDePagina("sem links aqui")).toEqual([]);
  });
});
