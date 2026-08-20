/**
 * Pontuação de domínio por tópico/assunto, calculada a partir do histórico de
 * respostas — usada para direcionar a geração de blocos (IA e banco de
 * questões) quando o usuário deixa "todos os tópicos"/"todos os assuntos"
 * marcado, em vez de tratar essa opção como neutra. Funções puras, sem SQL —
 * mesmo padrão de sugerirNivel (lib/sugestao.ts) e preverAprovacao (lib/repo.ts).
 */

export type ConfiancaResposta = "certeza" | "chute" | null;

/**
 * Pontos de uma única resposta: 2 = acertou com certeza; 1 = acertou no
 * chute em múltipla escolha (a única combinação de chute que é informativa —
 * 1/5 de chance contra 1/2 em Certo/Errado); 0 = errou, ou acertou no chute
 * em Certo/Errado (chance alta demais para indicar domínio real).
 */
export function pontosResposta(
  acertou: boolean,
  confianca: ConfiancaResposta,
  formato: "ce" | "mc",
): number {
  if (!acertou) return 0;
  if (confianca === "certeza") return 2;
  if (confianca === "chute" && formato === "mc") return 1;
  return 0;
}

export interface ItemPontuado {
  pontos: number;
  total: number;
}

/** Nunca deixa o peso de um item já dominado zerar de vez — ele continua
 * podendo ser sorteado, só com chance bem menor que um tópico fraco. */
const PESO_MINIMO = 0.15;
/** Acima da pontuação média máxima possível (2), para que um tópico nunca
 * praticado (média 0) já comece com peso alto, não zero. */
const MEDIA_MAIS_ALTA = 2.1;

/**
 * Sorteio ponderado: quanto menor a pontuação média de um item (tópico ou
 * assunto mais fraco, ou nunca praticado — que conta como média 0), maior a
 * chance de ser escolhido. Não exclui os já dominados, só reduz sua chance.
 */
export function escolherPonderado<T extends ItemPontuado>(itens: T[]): T | null {
  if (!itens.length) return null;
  const pesos = itens.map((it) => {
    const media = it.total ? it.pontos / it.total : 0;
    return Math.max(PESO_MINIMO, MEDIA_MAIS_ALTA - media);
  });
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  let r = Math.random() * somaPesos;
  for (let i = 0; i < itens.length; i++) {
    r -= pesos[i];
    if (r <= 0) return itens[i];
  }
  return itens[itens.length - 1];
}

/** Peso (não normalizado) de um único item, para amostragem ponderada sem
 * reposição (ver amostraPonderada em lib/banco.ts) — mesma fórmula de
 * escolherPonderado, exposta à parte porque ali o sorteio é por item
 * individual (cada questão), não por tópico/assunto agregado. */
export function pesoPonderado(it: ItemPontuado): number {
  const media = it.total ? it.pontos / it.total : 0;
  return Math.max(PESO_MINIMO, MEDIA_MAIS_ALTA - media);
}
