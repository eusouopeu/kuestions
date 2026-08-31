import { describe, expect, it } from "vitest";
import { gerarArquivosFlashcards, paraFlashcard } from "./flashcards";

describe("paraFlashcard", () => {
  it("regra 1: corpo com marca-texto vira cloze tal como está", () => {
    const r = paraFlashcard({ corpo: "A {{c1::imunidade}} é {{c2::recíproca}}.", tags: ["trib"] });
    expect(r).toEqual({ tipo: "cloze", texto: "A {{c1::imunidade}} é {{c2::recíproca}}.", tag: "trib" });
  });

  it("regra 2: '::' vira frente/verso de flashcard básico", () => {
    const r = paraFlashcard({ corpo: "IPI :: Imposto sobre Produtos Industrializados", tags: ["trib"] });
    expect(r).toEqual({
      tipo: "basico",
      frente: "IPI",
      verso: "Imposto sobre Produtos Industrializados",
      tag: "trib",
    });
  });

  it("regra 2 usa só o primeiro '::' quando há mais de um", () => {
    const r = paraFlashcard({ corpo: "a :: b :: c", tags: [] });
    expect(r).toEqual({ tipo: "basico", frente: "a", verso: "b :: c", tag: "" });
  });

  it("regra 3: lista enumerada sem marca-texto nem '::' vira cloze automático", () => {
    const r = paraFlashcard({
      corpo: "1. Legalidade\n2. Anterioridade",
      tags: ["trib"],
    });
    expect(r).toEqual({
      tipo: "cloze",
      texto: "1. {{c1::Legalidade}}\n2. {{c1::Anterioridade}}",
      tag: "trib",
    });
  });

  it("marca-texto tem prioridade sobre '::' quando os dois aparecem", () => {
    const r = paraFlashcard({ corpo: "Prazo :: {{c1::30 dias}}", tags: [] });
    expect(r.tipo).toBe("cloze");
  });

  it("'::' tem prioridade sobre lista quando os dois aparecem", () => {
    const r = paraFlashcard({ corpo: "1. IPI :: imposto federal\n2. ITR :: imposto federal", tags: [] });
    expect(r).toEqual({ tipo: "basico", frente: "1. IPI", verso: "imposto federal\n2. ITR :: imposto federal", tag: "" });
  });

  it("fallback: sem nenhuma regra, vira básico com frente = corpo e verso vazio", () => {
    const r = paraFlashcard({ corpo: "Só uma anotação solta.", tags: ["geral"] });
    expect(r).toEqual({ tipo: "basico", frente: "Só uma anotação solta.", verso: "", tag: "geral" });
  });

  it("junta várias tags separadas por espaço, no mesmo formato do Anki", () => {
    const r = paraFlashcard({ corpo: "Só uma anotação solta.", tags: ["origem", "extra-1", "extra-2"] });
    expect(r.tag).toBe("origem extra-1 extra-2");
  });
});

describe("gerarArquivosFlashcards", () => {
  it("separa notas cloze e básicas em dois CSVs distintos", () => {
    const r = gerarArquivosFlashcards([
      { corpo: "{{c1::x}}", tags: ["a"] },
      { corpo: "Frente :: Verso", tags: ["b"] },
      { corpo: "1. um\n2. dois", tags: ["c"] },
    ]);
    expect(r.totalCloze).toBe(2);
    expect(r.totalBasico).toBe(1);
    expect(r.basico).toBe("Frente;Verso;b");
    expect(r.cloze).toContain("{{c1::x}};a");
    expect(r.cloze).toContain("1. {{c1::um}}");
  });

  it("devolve null para o arquivo cujo tipo não teve nenhuma nota", () => {
    const r = gerarArquivosFlashcards([{ corpo: "{{c1::x}}", tags: ["a"] }]);
    expect(r.basico).toBeNull();
    expect(r.totalBasico).toBe(0);
  });

  it("lote vazio devolve os dois arquivos nulos", () => {
    const r = gerarArquivosFlashcards([]);
    expect(r).toEqual({ cloze: null, basico: null, totalCloze: 0, totalBasico: 0 });
  });
});
