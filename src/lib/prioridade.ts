/**
 * "Estudar o que mais importa agora": decide sozinho qual matéria merece o
 * próximo bloco, em vez de deixar a escolha inteiramente manual.
 *
 * Combina as três variáveis que o app já grava, e que isoladas enganam:
 *
 *   - PESO no edital (ver lib/edital.ts) — estudar bem o que quase não cai
 *     não move a nota;
 *   - FRAQUEZA (100 − % de acerto) — o que já está dominado rende pouco;
 *   - ATRASO desde a última prática — matéria forte esquecida volta a cair,
 *     e a fraqueza sozinha nunca mostra isso.
 *
 * Multiplicar (em vez de somar) é proposital: peso 0 ("não cai no meu
 * edital") zera a prioridade por mais fraca e esquecida que a matéria esteja.
 *
 * Função pura, sem SQL — mesmo padrão de sugestao.ts e pontuacaoTopicos.ts.
 * Quem busca os dados é GerarView (ver `carregarPrioridades`).
 */
import { PESO_MAX, PESO_PADRAO } from "./edital";

export interface EntradaPrioridade {
  materia: string;
  /** % de acerto (0–100) no histórico da matéria. */
  pct: number;
  /** Questões respondidas — amostra pequena não permite concluir fraqueza. */
  total: number;
  /** ISO da resposta mais recente desta matéria; null = nunca praticada. */
  ultimaPratica: string | null;
}

export interface Prioridade {
  materia: string;
  /** Score relativo — só serve para ordenar, não tem unidade. */
  score: number;
  /** Frase pronta explicando por que esta matéria ficou no topo. */
  motivo: string;
  pct: number;
  total: number;
  peso: number;
  diasSemPraticar: number | null;
}

/** Abaixo disso o % de acerto é ruído: 1 bloco de 12 com 2 erros não prova
 * fraqueza. A matéria ainda concorre, mas pela via do atraso, não da nota. */
const MIN_AMOSTRA = 12;

/** Teto do fator de atraso: a partir de ~3 semanas parada, a matéria já está
 * no máximo de urgência — sem teto, uma matéria nunca praticada dominaria
 * para sempre o ranking por acumular dias indefinidamente. */
const DIAS_ATRASO_MAX = 21;

/** Fraqueza usada quando ainda não há amostra: nem "dominada" nem
 * "desesperadora" — o meio, para a decisão ficar por conta de peso e atraso. */
const FRAQUEZA_SEM_AMOSTRA = 50;

function diasDesde(iso: string | null, agora: number): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((agora - t) / 86_400_000));
}

/**
 * Ordena as matérias da mais urgente para a menos. `agoraMs` é injetável para
 * o teste não depender do relógio.
 */
export function priorizar(
  entradas: EntradaPrioridade[],
  pesos: Record<string, number>,
  agoraMs: number = Date.now(),
): Prioridade[] {
  const resultado = entradas.map((e) => {
    const peso = pesos[e.materia] ?? PESO_PADRAO;
    const dias = diasDesde(e.ultimaPratica, agoraMs);

    const fraqueza = e.total >= MIN_AMOSTRA ? 100 - e.pct : FRAQUEZA_SEM_AMOSTRA;
    // Nunca praticada conta como atraso máximo: é o caso mais urgente de
    // todos numa matéria que pesa no edital.
    const atrasoBruto = dias == null ? DIAS_ATRASO_MAX : Math.min(dias, DIAS_ATRASO_MAX);
    // 1 (praticada hoje) a 2 (parada há 3+ semanas) — o atraso modula, não
    // domina: quem manda no ranking continua sendo peso × fraqueza.
    const fatorAtraso = 1 + atrasoBruto / DIAS_ATRASO_MAX;

    const score = (peso / PESO_MAX) * Math.max(fraqueza, 1) * fatorAtraso;

    return {
      materia: e.materia,
      score: Math.round(score * 10) / 10,
      motivo: montarMotivo(e, peso, dias),
      pct: e.pct,
      total: e.total,
      peso,
      diasSemPraticar: dias,
    };
  });

  return resultado
    .filter((p) => p.peso > 0)
    .sort((a, b) => b.score - a.score || a.materia.localeCompare(b.materia));
}

function montarMotivo(e: EntradaPrioridade, peso: number, dias: number | null): string {
  const partes: string[] = [`peso ${peso} no edital`];

  if (e.total >= MIN_AMOSTRA) partes.push(`${e.pct}% de acerto`);
  else if (e.total > 0) partes.push(`só ${e.total} questão${e.total === 1 ? "" : "ões"} respondida${e.total === 1 ? "" : "s"}`);
  else partes.push("nunca praticada");

  if (dias == null) {
    // já dito acima ("nunca praticada")
  } else if (dias === 0) partes.push("praticada hoje");
  else partes.push(`sem prática há ${dias} dia${dias === 1 ? "" : "s"}`);

  return partes.join(" · ");
}
