/**
 * Tabela `blocos_pendentes` (rec. 12, migração 18): fila de blocos gerados
 * em SEGUNDO PLANO, com a chave de API, enquanto o usuário está online e
 * dentro do teto de custo — servidos instantaneamente (sem chamada de API,
 * inclusive offline) na próxima vez que "Gerar bloco" for aberto com a
 * mesma configuração. Orquestração (quando pré-gerar, com qual config) fica
 * em lib/preGeracao.ts; aqui só o CRUD da fila.
 *
 * `materia`/`topico` são colunas próprias (facilita filtrar); o resto da
 * config (tipos, formato, nível) e as questões em si ficam serializados —
 * a fila nunca tem mais que MAX_BLOCOS_PENDENTES linhas (ver preGeracao.ts),
 * então comparar em JS depois de filtrar por matéria/tópico é barato o
 * bastante para não justificar `json_extract` na query.
 */
import { all, one, parseJSON, run } from "../db";
import type { Config, Questao } from "../types";
import { agoraISO } from "./util";

export interface BlocoPendente {
  id: number;
  config: Config & { materia: string };
  questoes: Questao[];
  ts: string;
}

function mapBlocoPendente(r: Record<string, unknown>): BlocoPendente {
  return {
    id: Number(r.id),
    config: parseJSON<Config & { materia: string }>(r.config, {
      materia: String(r.materia),
      materiaCustom: "",
      topico: (r.topico as string) ?? "",
      tipos: ["abstrato"],
      formato: "misto",
      nivel: 3,
    }),
    questoes: parseJSON<Questao[]>(r.questoes, []),
    ts: String(r.ts),
  };
}

export async function criarBlocoPendente(
  cfg: Config & { materia: string },
  questoes: Questao[],
): Promise<void> {
  await run(
    `INSERT INTO blocos_pendentes (materia, topico, config, questoes, ts) VALUES (?, ?, ?, ?, ?)`,
    [cfg.materia, cfg.topico || null, JSON.stringify(cfg), JSON.stringify(questoes), agoraISO()],
  );
}

/** Mesma comparação de configuração usada para reaproveitar um bloco (ver
 * buscarBlocoReaproveitavel em ./blocos.ts): matéria, tópico, tipos (a
 * mesma combinação, independente de ordem), formato e nível. */
function mesmaConfig(a: Config & { materia: string }, b: Config & { materia: string }): boolean {
  const tiposA = [...a.tipos].sort().join(",");
  const tiposB = [...b.tipos].sort().join(",");
  return (
    a.materia === b.materia &&
    (a.topico || "") === (b.topico || "") &&
    tiposA === tiposB &&
    a.formato === b.formato &&
    a.nivel === b.nivel
  );
}

/** Bloco pendente com a MESMA configuração (mesmo critério de
 * buscarBlocoReaproveitavel), consumido (removido da fila) e devolvido —
 * ou null se não houver nenhum. */
export async function buscarBlocoPendente(
  cfg: Config & { materia: string },
): Promise<BlocoPendente | null> {
  const rows = await all(
    `SELECT * FROM blocos_pendentes WHERE materia = ? AND IFNULL(topico,'') = IFNULL(?,'') ORDER BY ts ASC`,
    [cfg.materia, cfg.topico || null],
  );
  const candidato = rows.map(mapBlocoPendente).find((b) => mesmaConfig(b.config, cfg));
  if (!candidato) return null;
  await run(`DELETE FROM blocos_pendentes WHERE id = ?`, [candidato.id]);
  return candidato;
}

/** Qualquer bloco pendente, sem exigir config igual — fallback OFFLINE (ver
 * iniciarBloco em GerarView): sem rede, estudar um bloco pronto de outra
 * config vale mais que travar sem nenhum. O mais antigo primeiro (FIFO),
 * pra fila não acumular sempre o mesmo bloco velho sem uso. */
export async function buscarQualquerBlocoPendente(): Promise<BlocoPendente | null> {
  const row = await one<Record<string, unknown>>(
    `SELECT * FROM blocos_pendentes ORDER BY ts ASC LIMIT 1`,
  );
  if (!row) return null;
  const bloco = mapBlocoPendente(row);
  await run(`DELETE FROM blocos_pendentes WHERE id = ?`, [bloco.id]);
  return bloco;
}

export async function contarBlocosPendentes(): Promise<number> {
  const r = await one<{ n: number }>(`SELECT COUNT(*) AS n FROM blocos_pendentes`);
  return Number(r?.n ?? 0);
}
