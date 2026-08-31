/** Tabela `simulados` — um registro por prova cronometrada fechada em
 * SimuladoView. As respostas individuais já ficam em `questoes_respondidas`
 * (mesmo mecanismo de qualquer bloco), mas reconstruir "qual foi a nota
 * ponderada desta prova" a partir delas exigiria recalcular a projeção toda
 * vez; aqui fica o resultado já pronto, para a evolução em Dados. */
import { all, run } from "../db";
import { agoraISO } from "./util";

export interface RegistroSimulado {
  id: number;
  /** Nota ponderada pelo peso do edital (ver estimarNotaProvavel) — null
   * quando nenhuma matéria teve amostra suficiente para entrar no cálculo. */
  notaEstimada: number | null;
  totalQuestoes: number;
  acertos: number;
  emBranco: number;
  tempoTotalMs: number;
  ts: string;
}

function mapSimulado(r: Record<string, unknown>): RegistroSimulado {
  return {
    id: Number(r.id),
    notaEstimada: r.nota_estimada == null ? null : Number(r.nota_estimada),
    totalQuestoes: Number(r.total_questoes),
    acertos: Number(r.acertos),
    emBranco: Number(r.em_branco),
    tempoTotalMs: Number(r.tempo_total_ms),
    ts: String(r.ts),
  };
}

export async function gravarSimulado(args: {
  notaEstimada: number | null;
  totalQuestoes: number;
  acertos: number;
  emBranco: number;
  tempoTotalMs: number;
}): Promise<void> {
  await run(
    `INSERT INTO simulados (nota_estimada, total_questoes, acertos, em_branco, tempo_total_ms, ts)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [args.notaEstimada, args.totalQuestoes, args.acertos, args.emBranco, args.tempoTotalMs, agoraISO()],
  );
}

/** Histórico completo, do mais antigo para o mais recente — ordem que o
 * gráfico de evolução em Dados espera (mesma convenção de evolucaoPorBloco). */
export async function listarSimulados(): Promise<RegistroSimulado[]> {
  const rows = await all(`SELECT * FROM simulados ORDER BY ts ASC`);
  return rows.map(mapSimulado);
}
