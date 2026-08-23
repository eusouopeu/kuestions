import { describe, expect, it } from "vitest";
import { lacunasDoEdital, TOPICOS_POR_MATERIA } from "./topicos";

/**
 * `lacunasDoEdital` é a única peça do app que enxerga o tópico NUNCA
 * respondido — `prioridade.ts` ordena por fraqueza (100 − % de acerto), que
 * é indefinida sem nenhuma resposta. Por isso os casos abaixo cobrem as
 * três regras que a tornam confiável: casar por substring, respeitar peso 0
 * e ordenar por peso.
 */
describe("lacunasDoEdital", () => {
  const primeiroTopico = (materia: string) => TOPICOS_POR_MATERIA[materia][0].nome;

  it("exclui o tópico já praticado e mantém os demais", () => {
    const materia = "Direito Administrativo";
    const praticado = primeiroTopico(materia);
    const lacunas = lacunasDoEdital({ [materia]: [praticado] }, {}, 1);
    const daMateria = lacunas.filter((l) => l.materia === materia);

    expect(daMateria.some((l) => l.nome === praticado)).toBe(false);
    expect(daMateria.length).toBe(TOPICOS_POR_MATERIA[materia].length - 1);
  });

  it("casa por substring, como o texto gravado em blocos.topico", () => {
    const materia = "Direito Administrativo";
    const nome = primeiroTopico(materia);
    // Formato real de `descricaoBloco`/`rotuloTopico`: o nome vem embutido.
    const lacunas = lacunasDoEdital({ [materia]: [`1.1 ${nome} (revisão)`] }, {}, 1);

    expect(lacunas.some((l) => l.materia === materia && l.nome === nome)).toBe(false);
  });

  it("descarta matéria com peso 0 — não cai no edital", () => {
    const materia = "Direito Administrativo";
    const lacunas = lacunasDoEdital({}, { [materia]: 0 }, 1);

    expect(lacunas.some((l) => l.materia === materia)).toBe(false);
  });

  it("ordena do maior peso para o menor", () => {
    const lacunas = lacunasDoEdital({}, { "Direito Tributário": 5, Auditoria: 2 }, 1);
    const pesos = lacunas.map((l) => l.peso);

    expect(pesos).toEqual([...pesos].sort((a, b) => b - a));
    expect(lacunas[0].materia).toBe("Direito Tributário");
  });

  it("aplica o peso padrão a matéria sem entrada no mapa", () => {
    const lacunas = lacunasDoEdital({}, {}, 3);
    expect(new Set(lacunas.map((l) => l.peso))).toEqual(new Set([3]));
  });
});
