/**
 * Contas puras da aba Dados ligadas a ritmo de estudo: o card "Ritmo"
 * (projeção anual pelos últimos 7 dias + tendência contra os 7 anteriores),
 * a projeção até a data da prova (ver lib/prova.ts) e a comparação entre o
 * tempo dedicado a cada matéria e o peso dela no edital (ver lib/edital.ts).
 *
 * Datas em "AAAA-MM-DD" UTC, mesma convenção de atividadePorDia
 * (repo/estatisticas.ts), que agrupa por `substr(ts, 1, 10)` de um ISO UTC.
 */
import { pesoDe, type PesosEdital } from "./edital";

const DIA_MS = 86_400_000;

/** Data `n` dias antes de `dataISO` (n negativo = depois). */
function diasAntes(dataISO: string, n: number): string {
  return new Date(Date.parse(`${dataISO}T00:00:00Z`) - n * DIA_MS).toISOString().slice(0, 10);
}

/** Dias inteiros de `de` até `ate` (negativo se `ate` já passou). */
export function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / DIA_MS);
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface Ritmo {
  /** Questões nos últimos 7 dias, hoje incluso. */
  ultimos7: number;
  /** Questões nos 7 dias anteriores a esses. */
  anteriores7: number;
  porDia: number;
  porAno: number;
  /** Variação % de `ultimos7` sobre `anteriores7`; null sem base (semana
   * anterior zerada). */
  variacaoPct: number | null;
}

export function calcularRitmo(atividade: { data: string; total: number }[], hoje: string): Ritmo {
  const inicioAtual = diasAntes(hoje, 6);
  const inicioAnterior = diasAntes(hoje, 13);
  let ultimos7 = 0;
  let anteriores7 = 0;
  for (const d of atividade) {
    if (d.data > hoje) continue;
    if (d.data >= inicioAtual) ultimos7 += d.total;
    else if (d.data >= inicioAnterior) anteriores7 += d.total;
  }
  const porDia = ultimos7 / 7;
  return {
    ultimos7,
    anteriores7,
    porDia,
    porAno: Math.round(porDia * 365),
    variacaoPct: anteriores7 > 0 ? Math.round(((ultimos7 - anteriores7) / anteriores7) * 100) : null,
  };
}

export interface ProjecaoProva {
  /** Dias até a prova (0 se hoje ou já passou). */
  dias: number;
  /** Questões que cabem até lá no ritmo atual. */
  projetadas: number;
  /** Questões/dia para zerar `restantes` até a prova; null sem dias. */
  necessarioPorDia: number | null;
}

export function projetarAteProva(args: {
  hoje: string;
  dataProva: string;
  porDia: number;
  /** Quanto ainda falta (meta − feitas, ou inéditas do banco). */
  restantes: number;
}): ProjecaoProva {
  const dias = Math.max(0, diasEntre(args.hoje, args.dataProva));
  return {
    dias,
    projetadas: Math.round(args.porDia * dias),
    necessarioPorDia: dias > 0 ? Math.ceil(Math.max(0, args.restantes) / dias) : null,
  };
}

export interface AlocacaoMateria {
  materia: string;
  questoes: number;
  /** Fatia das questões do período dedicada à matéria. */
  pctQuestoes: number;
  /** Fatia do peso total do edital. */
  pctEdital: number;
  situacao: "abaixo" | "ok" | "acima";
}

/** Abaixo de 60% da fatia do edital = negligenciada; acima de 150% = sobra. */
const LIMITE_ABAIXO = 0.6;
const LIMITE_ACIMA = 1.5;

/**
 * Tempo (questões respondidas no período) vs. peso no edital, por matéria.
 * Universo = `materias` (as do edital/banco) + qualquer matéria praticada;
 * matéria com peso 0 e sem prática fica de fora. Ordena pelo maior déficit
 * (edital − prática) primeiro.
 */
export function alocacaoVsEdital(
  contagens: Record<string, number>,
  pesos: PesosEdital,
  materias: string[],
): AlocacaoMateria[] {
  const universo = new Set([...materias, ...Object.keys(contagens)]);
  const linhas = [...universo]
    .map((materia) => ({ materia, questoes: contagens[materia] ?? 0, peso: pesoDe(pesos, materia) }))
    .filter((l) => l.peso > 0 || l.questoes > 0);
  const totalQ = linhas.reduce((s, l) => s + l.questoes, 0);
  const totalP = linhas.reduce((s, l) => s + l.peso, 0);
  return linhas
    .map((l) => {
      const pctQuestoes = totalQ ? Math.round((l.questoes / totalQ) * 100) : 0;
      const pctEdital = totalP ? Math.round((l.peso / totalP) * 100) : 0;
      const razao = pctEdital ? pctQuestoes / pctEdital : pctQuestoes > 0 ? Infinity : 1;
      const situacao: AlocacaoMateria["situacao"] =
        razao < LIMITE_ABAIXO ? "abaixo" : razao > LIMITE_ACIMA ? "acima" : "ok";
      return { materia: l.materia, questoes: l.questoes, pctQuestoes, pctEdital, situacao };
    })
    .sort((a, b) => b.pctEdital - b.pctQuestoes - (a.pctEdital - a.pctQuestoes));
}
