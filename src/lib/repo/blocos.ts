/** Tabela `blocos`: criação, fechamento e listagem de blocos de questões. */
import { all, one, parseJSON, run, toBool } from "../db";
import { talvezFazerBackupAutomatico } from "../backupAuto";
import type { Bloco, Config } from "../types";

/**
 * Um bloco só conta para estatísticas e para "últimos blocos" quando tem mais
 * de 2 questões DE VERDADE respondidas (`resposta != ''` — string vazia marca
 * questão carregada mas nunca respondida, ver QuestaoRespondida.resposta).
 * Sem isto, um bloco criado e abandonado sem nenhuma questão feita (ou só
 * 1-2) poluiria a lista e inflaria "blocos totais" — ver buscarBlocoReaproveitavel,
 * que reaproveita exatamente esses blocos em vez de criar um novo.
 */
export const COND_BLOCO_FEITO =
  "(SELECT COUNT(*) FROM questoes_respondidas qr WHERE qr.bloco_id = blocos.id AND qr.resposta != '') > 2";

export async function criarBloco(
  cfg: Config & { materia: string },
  totalQuestoes: number,
): Promise<number> {
  const { lastId } = await run(
    `INSERT INTO blocos (ts, materia, topico, tipo, formato, nivel,
                         total_acertos, total_questoes, por_sub, aprovado)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, '[]', 0)`,
    [
      new Date().toISOString(),
      cfg.materia,
      cfg.topico || null,
      cfg.tipos.join(","),
      cfg.formato,
      cfg.nivel,
      totalQuestoes,
    ],
  );
  return lastId;
}

/**
 * Bloco de IA existente com a MESMA configuração (matéria, tópico, tipo de
 * cobrança, formato e dificuldade) que ainda não foi feito, ou só teve 1-2
 * questões feitas — ver COND_BLOCO_FEITO. Reaproveitado em vez de criar um
 * bloco novo (ver iniciarBloco em GerarView), para não acumular uma lista
 * crescente de blocos abandonados quase intocados a cada nova tentativa.
 */
export async function buscarBlocoReaproveitavel(
  cfg: Config & { materia: string },
): Promise<Bloco | null> {
  const row = await one<Record<string, unknown>>(
    `SELECT * FROM blocos
     WHERE materia = ? AND IFNULL(topico,'') = IFNULL(?,'') AND tipo = ? AND formato = ? AND nivel = ?
       AND NOT ${COND_BLOCO_FEITO}
     ORDER BY ts DESC LIMIT 1`,
    [cfg.materia, cfg.topico || null, cfg.tipos.join(","), cfg.formato, cfg.nivel],
  );
  return row ? mapBloco(row) : null;
}

/** Ajusta `total_questoes` de um bloco reaproveitado (ver
 * buscarBlocoReaproveitavel) quando a quantidade escolhida desta vez difere
 * da tentativa anterior — a config combinada não inclui a quantidade. */
export async function atualizarTotalQuestoesBloco(id: number, totalQuestoes: number): Promise<void> {
  await run(`UPDATE blocos SET total_questoes = ? WHERE id = ?`, [totalQuestoes, id]);
}

export async function fecharBloco(
  blocoId: number,
  porSub: number[],
  aprovado: boolean,
): Promise<void> {
  const total = porSub.reduce((a, b) => a + b, 0);
  await run(
    `UPDATE blocos SET total_acertos = ?, por_sub = ?, aprovado = ? WHERE id = ?`,
    [total, JSON.stringify(porSub), aprovado ? 1 : 0, blocoId],
  );
  // Não aguarda: o backup automático (ver lib/backupAuto.ts) não pode atrasar
  // a transição de tela de quem acabou de fechar um bloco.
  void talvezFazerBackupAutomatico();
}

function mapBloco(r: Record<string, unknown>): Bloco {
  return {
    id: Number(r.id),
    ts: String(r.ts),
    materia: String(r.materia),
    topico: (r.topico as string) ?? null,
    tipo: String(r.tipo),
    formato: String(r.formato),
    nivel: Number(r.nivel),
    total_acertos: Number(r.total_acertos),
    total_questoes: Number(r.total_questoes),
    por_sub: parseJSON<number[]>(r.por_sub, []),
    aprovado: toBool(r.aprovado),
  };
}

export async function listarBlocos(
  materia: string | null,
  limite = 40,
): Promise<Bloco[]> {
  const rows = await all(
    `SELECT * FROM blocos
     WHERE ${COND_BLOCO_FEITO} ${materia ? "AND materia = ?" : ""}
     ORDER BY ts DESC LIMIT ?`,
    materia ? [materia, limite] : [limite],
  );
  return rows.map(mapBloco);
}

/** Blocos (qualquer origem) criados desde a segunda-feira mais recente
 * (00h00 local) — base da meta semanal (ver lib/metas.ts). Semana de
 * calendário, não janela rolante de 7 dias: reinicia sempre na segunda.
 * `materia` filtra a meta por matéria (ver getMetasPorMateria); omitido ou
 * null conta todos os blocos da semana, como antes. */
export async function blocosNaSemana(materia: string | null = null): Promise<number> {
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 = domingo
  const deltaParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
  const segunda = new Date(agora);
  segunda.setHours(0, 0, 0, 0);
  segunda.setDate(segunda.getDate() - deltaParaSegunda);
  const r = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM blocos WHERE ts >= ? AND ${COND_BLOCO_FEITO} ${materia ? "AND materia = ?" : ""}`,
    materia ? [segunda.toISOString(), materia] : [segunda.toISOString()],
  );
  return Number(r?.n ?? 0);
}
