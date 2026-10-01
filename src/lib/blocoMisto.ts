/**
 * "Bloco do dia" (GerarBancoView): um bloco do banco que mistura várias
 * áreas, sorteadas por peso no edital × fraqueza — prática intercalada, como
 * na prova real, em vez de um bloco de matéria única.
 */

/** Rótulo do bloco misto em `blocos.materia` — as questões em si gravam a
 * área real de cada uma em `questoes_respondidas.materia`. */
export const MATERIA_MISTA = "Bloco do dia (misto)";

export interface AreaMisto {
  area: string;
  /** Peso no edital (lib/edital.ts, 0–5). 0 = não entra. */
  peso: number;
  acertos: number;
  total: number;
  /** Questões disponíveis no banco para esta área (teto de quantas sortear). */
  disponiveis: number;
}

/** Fraqueza com prior de Laplace: área nunca respondida vale 0,5; o piso
 * evita zerar uma área dominada (ela ainda aparece de vez em quando). */
function fraqueza(a: AreaMisto): number {
  return Math.max(0.15, (a.total - a.acertos + 1) / (a.total + 2));
}

/**
 * Quantas questões de cada área: `n` sorteios ponderados por peso ×
 * fraqueza, cada área limitada ao próprio estoque. `rand` injetável para
 * teste (o padrão é Math.random).
 */
export function distribuirBlocoMisto(
  areas: AreaMisto[],
  n: number,
  rand: () => number = Math.random,
): Map<string, number> {
  const restante = new Map(areas.map((a) => [a.area, a.disponiveis]));
  const peso = new Map(areas.map((a) => [a.area, a.peso > 0 ? a.peso * fraqueza(a) : 0]));
  const saida = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const elegiveis = areas.filter((a) => (peso.get(a.area) ?? 0) > 0 && (restante.get(a.area) ?? 0) > 0);
    if (!elegiveis.length) break;
    const soma = elegiveis.reduce((s, a) => s + peso.get(a.area)!, 0);
    let r = rand() * soma;
    let escolhida = elegiveis[elegiveis.length - 1];
    for (const a of elegiveis) {
      r -= peso.get(a.area)!;
      if (r <= 0) {
        escolhida = a;
        break;
      }
    }
    saida.set(escolhida.area, (saida.get(escolhida.area) ?? 0) + 1);
    restante.set(escolhida.area, restante.get(escolhida.area)! - 1);
  }
  return saida;
}

/** Round-robin entre os grupos: a1, b1, c1, a2, … — evita duas questões
 * seguidas da mesma área enquanto houver alternativa. */
export function intercalar<T>(grupos: T[][]): T[] {
  const saida: T[] = [];
  const max = Math.max(0, ...grupos.map((g) => g.length));
  for (let i = 0; i < max; i++) {
    for (const g of grupos) if (i < g.length) saida.push(g[i]);
  }
  return saida;
}
