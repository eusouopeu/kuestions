import { describe, expect, it } from "vitest";
import {
  aplicarMarcaTexto,
  contarItensLista,
  converterListaParaCloze,
  gerarTagAssunto,
  pareceCalculo,
  segmentarMarcaTexto,
  slugify,
} from "./texto";

describe("gerarTagAssunto", () => {
  it("resume a até 3 palavras significativas, sem acento, hifenizadas", () => {
    expect(gerarTagAssunto("Imunidade Tributária Recíproca dos entes")).toBe(
      "imunidade-tributaria-reciproca",
    );
  });

  it("cai em 'geral' quando só sobram stopwords", () => {
    expect(gerarTagAssunto("de a e")).toBe("geral");
  });
});

describe("slugify", () => {
  it("remove acentos e espaços, minúsculo", () => {
    expect(slugify("Direito Tributário — Bloco 2")).toBe("direito-tributario-bloco-2");
  });
});

describe("contarItensLista", () => {
  it("reconhece lista numerada com pelo menos 2 itens", () => {
    expect(contarItensLista("1. primeiro\n2. segundo\n3. terceiro")).toBe(3);
  });

  it("não confunde uma linha só (citação de artigo) com lista", () => {
    expect(contarItensLista("1. Compete à União instituir impostos sobre…")).toBe(0);
  });

  it("devolve 0 para texto sem marcadores", () => {
    expect(contarItensLista("Texto corrido sem lista nenhuma.")).toBe(0);
  });
});

describe("converterListaParaCloze", () => {
  it("mantém o marcador visível e esconde o conteúdo em c1", () => {
    const r = converterListaParaCloze("1. Legalidade\n2. Anterioridade\n3. Irretroatividade");
    expect(r).toBe("1. {{c1::Legalidade}}\n2. {{c1::Anterioridade}}\n3. {{c1::Irretroatividade}}");
  });

  it("devolve null quando não há lista reconhecível", () => {
    expect(converterListaParaCloze("Só uma frase qualquer.")).toBeNull();
  });

  it("preserva linhas em branco entre itens", () => {
    const r = converterListaParaCloze("- item um\n\n- item dois");
    expect(r).toBe("- {{c1::item um}}\n\n- {{c1::item dois}}");
  });
});

describe("aplicarMarcaTexto", () => {
  it("envolve o trecho selecionado em {{c1::…}} para amarelo", () => {
    const corpo = "O prazo é de 30 dias.";
    const r = aplicarMarcaTexto(corpo, corpo.indexOf("30 dias"), corpo.indexOf("30 dias") + 7, "amarelo");
    expect(r).toBe("O prazo é de {{c1::30 dias}}.");
  });

  it("usa {{c2::…}} para laranja", () => {
    const corpo = "Prazo de 30 dias.";
    const r = aplicarMarcaTexto(corpo, 9, 16, "laranja");
    expect(r).toBe("Prazo de {{c2::30 dias}}.");
  });

  it("não altera o corpo quando não há seleção (início === fim)", () => {
    expect(aplicarMarcaTexto("abc", 1, 1, "amarelo")).toBe("abc");
  });

  it("aceita início/fim invertidos (seleção de trás para frente)", () => {
    const corpo = "abcdef";
    expect(aplicarMarcaTexto(corpo, 4, 1, "amarelo")).toBe("a{{c1::bcd}}ef");
  });
});

describe("segmentarMarcaTexto", () => {
  it("quebra em segmentos simples e marcados, preservando a cor de cada cloze", () => {
    const segs = segmentarMarcaTexto("Antes {{c1::amarelo}} meio {{c2::laranja}} depois");
    expect(segs).toEqual([
      { texto: "Antes ", cor: null },
      { texto: "amarelo", cor: "amarelo" },
      { texto: " meio ", cor: null },
      { texto: "laranja", cor: "laranja" },
      { texto: " depois", cor: null },
    ]);
  });

  it("texto sem marcação vira um único segmento", () => {
    expect(segmentarMarcaTexto("sem marca nenhuma")).toEqual([
      { texto: "sem marca nenhuma", cor: null },
    ]);
  });
});

describe("pareceCalculo", () => {
  it("aceita quando a própria geração declarou o tipo", () => {
    expect(pareceCalculo({ enunciado: "Sem número nenhum.", tipo_cobranca: "calculo" })).toBe(true);
  });

  it("aceita texto com dois números e marcador monetário", () => {
    expect(
      pareceCalculo({
        enunciado: "Mercadoria de R$ 2.000,00 com alíquota de 18%. Qual o ICMS devido?",
      }),
    ).toBe(true);
  });

  it("recusa questão de literalidade com citação de dispositivo", () => {
    expect(
      pareceCalculo({
        enunciado: "Nos termos do art. 150, III, b, da CF/88, é vedado cobrar tributos no mesmo exercício.",
      }),
    ).toBe(false);
  });

  it("recusa texto com um número só", () => {
    expect(pareceCalculo({ enunciado: "A alíquota é de 18%." })).toBe(false);
  });
});
