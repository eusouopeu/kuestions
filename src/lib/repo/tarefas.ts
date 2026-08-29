/** Tabela `tarefas` — lista de tarefas do Caderno (ver src/views/notas/TarefasView.tsx),
 * portada de web_notebook/todo.html. Item manual, distinto das metas semanais
 * automáticas de lib/metas.ts (ver comentário em TarefasView). */
import { all, one, run } from "../db";
import { agoraISO } from "./util";

export interface Tarefa {
  id: number;
  texto: string;
  feita: boolean;
  tag: string | null;
  criada_em: string;
}

function mapTarefa(r: Record<string, unknown>): Tarefa {
  return {
    id: Number(r.id),
    texto: String(r.texto ?? ""),
    feita: r.feita === 1 || r.feita === true,
    tag: (r.tag as string) ?? null,
    criada_em: String(r.criada_em),
  };
}

export async function criarTarefa(texto: string, tag: string | null = null): Promise<number> {
  const { lastId } = await run(
    `INSERT INTO tarefas (texto, tag, criada_em) VALUES (?, ?, ?)`,
    [texto, tag, agoraISO()],
  );
  return lastId;
}

export async function listarTarefas(): Promise<Tarefa[]> {
  const rows = await all(`SELECT * FROM tarefas ORDER BY feita ASC, criada_em DESC`);
  return rows.map(mapTarefa);
}

export async function alternarTarefa(id: number, feita: boolean): Promise<void> {
  await run(`UPDATE tarefas SET feita = ? WHERE id = ?`, [feita ? 1 : 0, id]);
}

export async function apagarTarefa(id: number): Promise<void> {
  await run(`DELETE FROM tarefas WHERE id = ?`, [id]);
}

export async function contarTarefasPendentes(): Promise<number> {
  const r = await one<{ n: number }>(`SELECT COUNT(*) AS n FROM tarefas WHERE feita = 0`);
  return Number(r?.n ?? 0);
}
