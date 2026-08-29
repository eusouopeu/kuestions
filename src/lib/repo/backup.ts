/** Mesclagem entre aparelhos (rec. 9 — "sync"): diferente do backup completo
 * (exportarBancoJSON/importarBancoJSON em db.ts), que SUBSTITUI tudo, aqui
 * cada linha é inserida sem apagar o que já existe localmente. Não é
 * sincronização em tempo real (o app não tem backend/conta): é um merge
 * manual, sob demanda — exporta de um aparelho, mescla no outro. */
import { all, one, run } from "../db";
import { talvezFazerBackupAutomatico } from "../backupAuto";
import { sincronizarNotasDocumentos } from "../exportarDocumentos";

export interface DumpMesclagem {
  versao: 1 | 2;
  blocos: Record<string, unknown>[];
  questoes_respondidas: Record<string, unknown>[];
  conceitos_salvos: Record<string, unknown>[];
  explicacoes_banco: Record<string, unknown>[];
  /** Só em versao 2 — ausentes em dumps antigos, tratados como []. */
  caderno_paginas?: Record<string, unknown>[];
  mapas?: Record<string, unknown>[];
  tarefas?: Record<string, unknown>[];
}

export async function exportarParaMesclagem(): Promise<string> {
  const [blocos, questoes, conceitos, explicacoes, paginas, mapas, tarefas] = await Promise.all([
    all(`SELECT * FROM blocos`),
    all(`SELECT * FROM questoes_respondidas`),
    all(`SELECT * FROM conceitos_salvos`),
    all(`SELECT * FROM explicacoes_banco`),
    all(`SELECT * FROM caderno_paginas`),
    all(`SELECT * FROM mapas`),
    all(`SELECT * FROM tarefas`),
  ]);
  const dump: DumpMesclagem = {
    versao: 2,
    blocos,
    questoes_respondidas: questoes,
    conceitos_salvos: conceitos,
    explicacoes_banco: explicacoes,
    caderno_paginas: paginas,
    mapas,
    tarefas,
  };
  return JSON.stringify(dump);
}

export interface ResultadoMesclagem {
  blocosNovos: number;
  questoesNovas: number;
  notasNovas: number;
  explicacoesNovas: number;
  paginasNovas: number;
  mapasNovos: number;
  tarefasNovas: number;
}

/**
 * Insere o conteúdo de um dump de outro aparelho SEM apagar nada local. Cada
 * tabela tem uma chave de deduplicação por CONTEÚDO — os `id` do dump não
 * servem (cada aparelho usa AUTOINCREMENT independente, então o mesmo número
 * em dois aparelhos não é a mesma linha): bloco por (materia, topico, ts,
 * total_questoes); questão respondida por (materia, enunciado, ts); nota por
 * (materia, corpo); cache de explicação do banco por banco_id (já é chave
 * natural). `bloco_id`/`questao_origem_id` são remapeados para os ids locais
 * recém-inseridos (ou ficam null quando o bloco/questão de origem não fez
 * parte deste dump).
 *
 * Sequencial (uma consulta de existência + um insert por linha), não em lote
 * — mais lento que `runBatch` em conjuntos grandes, mas é o preço de decidir
 * duplicata por conteúdo linha a linha; aceitável para uma ação manual e
 * ocasional, não um caminho quente do app.
 */
export async function mesclarBackup(json: string): Promise<ResultadoMesclagem> {
  const dump = JSON.parse(json) as DumpMesclagem;
  if (
    (dump.versao !== 1 && dump.versao !== 2) ||
    !Array.isArray(dump.blocos) ||
    !Array.isArray(dump.questoes_respondidas)
  ) {
    throw new Error("Arquivo não é um backup de mesclagem reconhecido.");
  }

  const resultado: ResultadoMesclagem = {
    blocosNovos: 0,
    questoesNovas: 0,
    notasNovas: 0,
    explicacoesNovas: 0,
    paginasNovas: 0,
    mapasNovos: 0,
    tarefasNovas: 0,
  };

  const mapaBloco = new Map<number, number>();
  for (const b of dump.blocos) {
    const oldId = Number(b.id);
    const existente = await one<{ id: number }>(
      `SELECT id FROM blocos
       WHERE materia = ? AND IFNULL(topico,'') = IFNULL(?,'') AND ts = ? AND total_questoes = ?`,
      [b.materia, b.topico ?? null, b.ts, b.total_questoes],
    );
    if (existente) {
      mapaBloco.set(oldId, existente.id);
      continue;
    }
    const { lastId } = await run(
      `INSERT INTO blocos (ts, materia, topico, tipo, formato, nivel, total_acertos, total_questoes, por_sub, aprovado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.ts, b.materia, b.topico ?? null, b.tipo, b.formato, b.nivel, b.total_acertos, b.total_questoes, b.por_sub, b.aprovado],
    );
    mapaBloco.set(oldId, lastId);
    resultado.blocosNovos++;
  }

  const mapaQuestao = new Map<number, number>();
  for (const q of dump.questoes_respondidas) {
    const oldId = Number(q.id);
    const existente = await one<{ id: number }>(
      `SELECT id FROM questoes_respondidas WHERE materia = ? AND enunciado = ? AND ts = ?`,
      [q.materia, q.enunciado, q.ts],
    );
    if (existente) {
      mapaQuestao.set(oldId, existente.id);
      continue;
    }
    const blocoIdOriginal = q.bloco_id == null ? null : Number(q.bloco_id);
    const blocoIdNovo = blocoIdOriginal == null ? null : (mapaBloco.get(blocoIdOriginal) ?? null);
    const { lastId } = await run(
      `INSERT INTO questoes_respondidas
         (bloco_id, materia, topico, sub, carga_conceitual, nivel, formato, tipo_cobranca,
          enunciado, alternativas, gabarito, resposta, acertou, revisada, caixa_leitner, proxima_revisao,
          comentario, explicacoes_erradas, conceitos, dispositivo, banco_id, tempo_ms, confianca,
          reportada, motivo_report, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        blocoIdNovo,
        q.materia,
        q.topico ?? null,
        q.sub ?? "",
        q.carga_conceitual ?? 1,
        q.nivel ?? null,
        q.formato,
        q.tipo_cobranca ?? null,
        q.enunciado,
        q.alternativas ?? null,
        q.gabarito,
        q.resposta,
        q.acertou,
        q.revisada ?? 0,
        q.caixa_leitner ?? 1,
        q.proxima_revisao ?? null,
        q.comentario ?? "",
        q.explicacoes_erradas ?? "{}",
        q.conceitos ?? "[]",
        q.dispositivo ?? null,
        q.banco_id ?? null,
        q.tempo_ms ?? null,
        q.confianca ?? null,
        q.reportada ?? 0,
        q.motivo_report ?? null,
        q.ts,
      ],
    );
    mapaQuestao.set(oldId, lastId);
    resultado.questoesNovas++;
  }

  for (const n of dump.conceitos_salvos) {
    const existente = await one<{ id: number }>(
      `SELECT id FROM conceitos_salvos WHERE materia = ? AND corpo = ?`,
      [n.materia, n.corpo],
    );
    if (existente) continue;
    const origemOriginal = n.questao_origem_id == null ? null : Number(n.questao_origem_id);
    const origemNova = origemOriginal == null ? null : (mapaQuestao.get(origemOriginal) ?? null);
    await run(
      `INSERT INTO conceitos_salvos (materia, termo, definicao, corpo, tags, questao_origem_id, caixa_leitner, proxima_revisao, ts)
       VALUES (?, '', '', ?, ?, ?, ?, ?, ?)`,
      [n.materia, n.corpo, n.tags ?? "[]", origemNova, n.caixa_leitner ?? 1, n.proxima_revisao ?? null, n.ts],
    );
    resultado.notasNovas++;
  }

  for (const e of dump.explicacoes_banco) {
    const existente = await one<{ banco_id: string }>(
      `SELECT banco_id FROM explicacoes_banco WHERE banco_id = ?`,
      [e.banco_id],
    );
    if (existente) continue;
    await run(
      `INSERT INTO explicacoes_banco (banco_id, comentario, explicacoes_erradas, ts) VALUES (?, ?, ?, ?)`,
      [e.banco_id, e.comentario ?? "", e.explicacoes_erradas ?? "{}", e.ts],
    );
    resultado.explicacoesNovas++;
  }

  for (const p of dump.caderno_paginas ?? []) {
    const existente = await one<{ id: number }>(
      `SELECT id FROM caderno_paginas WHERE titulo = ? AND criada_em = ?`,
      [p.titulo, p.criada_em],
    );
    if (existente) continue;
    await run(
      `INSERT INTO caderno_paginas (titulo, icone, pasta, fixada, blocos, criada_em, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [p.titulo, p.icone ?? null, p.pasta ?? null, p.fixada ?? 0, p.blocos ?? "[]", p.criada_em, p.ts],
    );
    resultado.paginasNovas++;
  }

  for (const m of dump.mapas ?? []) {
    const existente = await one<{ id: number }>(
      `SELECT id FROM mapas WHERE nome = ? AND ts = ?`,
      [m.nome, m.ts],
    );
    if (existente) continue;
    await run(
      `INSERT INTO mapas (nome, materia, nos, caixa_leitner, proxima_revisao, ts)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [m.nome, m.materia ?? null, m.nos ?? "[]", m.caixa_leitner ?? 1, m.proxima_revisao ?? null, m.ts],
    );
    resultado.mapasNovos++;
  }

  for (const t of dump.tarefas ?? []) {
    const existente = await one<{ id: number }>(
      `SELECT id FROM tarefas WHERE texto = ? AND criada_em = ?`,
      [t.texto, t.criada_em],
    );
    if (existente) continue;
    await run(`INSERT INTO tarefas (texto, feita, tag, criada_em) VALUES (?, ?, ?, ?)`, [
      t.texto,
      t.feita ?? 0,
      t.tag ?? null,
      t.criada_em,
    ]);
    resultado.tarefasNovas++;
  }

  if (resultado.notasNovas > 0) void sincronizarNotasDocumentos();
  void talvezFazerBackupAutomatico();
  return resultado;
}
