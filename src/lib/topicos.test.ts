import { describe, expect, it } from "vitest";
import { lacunasDoEdital, TOPICOS_POR_MATERIA } from "./topicos";

/**
 * `lacunasDoEdital` é a peça do app que enxerga o tópico NUNCA respondido
 * dentro de uma matéria que você já estuda bem — os casos abaixo cobrem as
 * quatro regras que a tornam confiável: casar por substring, respeitar peso
 * 0, exigir a matéria já "dominada" (praticada e com acerto acima de 50%) e
 * ordenar por peso.
 */
describe("lacunasDoEdital", () => {
  const primeiroTopico = (materia: string) => TOPICOS_POR_MATERIA[materia][0].nome;

  /** Desempenho que qualifica a matéria para a lista: já praticada, acerto
   * acima do limiar. */
  const dominada = (materia: string, pct = 80, total = 20) => ({ [materia]: { total, pct } });

  it("exclui o tópico já praticado e mantém os demais, numa matéria já dominada", () => {
    const materia = "Direito Administrativo";
    const praticado = primeiroTopico(materia);
    const lacunas = lacunasDoEdital({ [materia]: [praticado] }, dominada(materia), {}, 1);
    const daMateria = lacunas.filter((l) => l.materia === materia);

    expect(daMateria.some((l) => l.nome === praticado)).toBe(false);
    expect(daMateria.length).toBe(TOPICOS_POR_MATERIA[materia].length - 1);
  });

  it("casa por substring, como o texto gravado em blocos.topico", () => {
    const materia = "Direito Administrativo";
    const nome = primeiroTopico(materia);
    // Formato real de `descricaoBloco`/`rotuloTopico`: o nome vem embutido.
    const lacunas = lacunasDoEdital(
      { [materia]: [`1.1 ${nome} (revisão)`] },
      dominada(materia),
      {},
      1,
    );

    expect(lacunas.some((l) => l.materia === materia && l.nome === nome)).toBe(false);
  });

  it("descarta matéria com peso 0 — não cai no edital", () => {
    const materia = "Direito Administrativo";
    const lacunas = lacunasDoEdital({}, dominada(materia), { [materia]: 0 }, 1);

    expect(lacunas.some((l) => l.materia === materia)).toBe(false);
  });

  it("descarta matéria nunca praticada — o ponto cego dela é a matéria inteira, não um tópico", () => {
    const materia = "Direito Administrativo";
    const lacunas = lacunasDoEdital({}, {}, {}, 1);

    expect(lacunas.some((l) => l.materia === materia)).toBe(false);
  });

  it("descarta matéria praticada mas com acerto de 50% ou menos — ainda não estudada o bastante", () => {
    const materia = "Direito Administrativo";
    const lacunas = lacunasDoEdital({}, { [materia]: { total: 20, pct: 50 } }, {}, 1);

    expect(lacunas.some((l) => l.materia === materia)).toBe(false);
  });

  it("inclui matéria praticada com acerto acima de 50%", () => {
    const materia = "Direito Administrativo";
    const lacunas = lacunasDoEdital({}, dominada(materia, 51), {}, 1);

    expect(lacunas.some((l) => l.materia === materia)).toBe(true);
  });

  it("ordena do maior peso para o menor", () => {
    const lacunas = lacunasDoEdital(
      {},
      { ...dominada("Direito Tributário"), ...dominada("Auditoria") },
      { "Direito Tributário": 5, Auditoria: 2 },
      1,
    );
    const pesos = lacunas.map((l) => l.peso);

    expect(pesos).toEqual([...pesos].sort((a, b) => b - a));
    expect(lacunas[0].materia).toBe("Direito Tributário");
  });

  it("aplica o peso padrão a matéria sem entrada no mapa", () => {
    const materia = "Direito Administrativo";
    const lacunas = lacunasDoEdital({}, dominada(materia), {}, 3);
    expect(new Set(lacunas.filter((l) => l.materia === materia).map((l) => l.peso))).toEqual(
      new Set([3]),
    );
  });
});
