import { describe, expect, it } from "vitest";
import { blocosTexto } from "./blocosTexto";

describe("blocosTexto", () => {
  it("separa parágrafos por linha em branco e mantém quebras internas (itens I., II.)", () => {
    const b = blocosTexto("Considere:\n\nI. um\nII. dois\n\n\nEstá correto");
    expect(b).toEqual([
      { tipo: "paragrafo", texto: "Considere:" },
      { tipo: "paragrafo", texto: "I. um\nII. dois" },
      { tipo: "paragrafo", texto: "Está correto" },
    ]);
  });

  it("reconhece tabela em linhas | … | com separador de cabeçalho, colada ou não a um parágrafo", () => {
    const b = blocosTexto("Dados:\n| Conta | Valor |\n|---|--:|\n| Caixa | 50.000 |\nCalcule.");
    expect(b).toEqual([
      { tipo: "paragrafo", texto: "Dados:" },
      { tipo: "tabela", cabecalho: ["Conta", "Valor"], linhas: [["Caixa", "50.000"]] },
      { tipo: "paragrafo", texto: "Calcule." },
    ]);
    // Sem linha separadora: tudo é corpo.
    expect(blocosTexto("| a | b |\n| c | d |")).toEqual([
      { tipo: "tabela", cabecalho: null, linhas: [["a", "b"], ["c", "d"]] },
    ]);
  });

  it("reconhece imagem em linha própria ![descrição](arquivo)", () => {
    expect(blocosTexto("Veja o gráfico.\n\n![Gráfico de oferta](SEFAZ-X-Q1-1.png)\n\nAssinale")).toEqual([
      { tipo: "paragrafo", texto: "Veja o gráfico." },
      { tipo: "imagem", arquivo: "SEFAZ-X-Q1-1.png", descricao: "Gráfico de oferta" },
      { tipo: "paragrafo", texto: "Assinale" },
    ]);
  });
});
