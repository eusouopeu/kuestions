/**
 * Propaga correções do banco fixo (banco/kuestion_db_1.json) para questões
 * já respondidas. Cada linha de `questoes_respondidas` guarda uma cópia de
 * enunciado/alternativas/gabarito do momento em que foi respondida — é essa
 * cópia que Refazer/Blocos anteriores/fila unificada mostram. Sem isto, uma
 * correção feita no banco só valeria para questões ainda inéditas.
 *
 * Só as três colunas de conteúdo mudam. Tudo o que é histórico de
 * desempenho (resposta, acertou, revisada, caixa_leitner, proxima_revisao,
 * facilidade, tempo_ms, confianca, ts, bloco_id) nunca é tocado: uma
 * questão marcada como errada continua errada nas estatísticas mesmo que o
 * gabarito seja corrigido depois; só a próxima revisão passa a corrigir pelo
 * gabarito novo.
 *
 * Enunciado corrigido pelo usuário (lápis do QuestaoCard, marcado em
 * `enunciado_editado`) tem prioridade sobre o do banco. Linhas anteriores à
 * migração 19 chegam com a marca NULL: se o texto diverge do banco em alguma
 * palavra, assume-se correção do usuário (conservador) e a marca vira 1;
 * diferença só de espaços/quebras de linha é formatação refeita no banco
 * (ex.: linha em branco antes de itens I., II.) e é atualizada.
 *
 * Roda no boot só quando o JSON embutido muda (`__BANCO_VERSAO__`, hash do
 * arquivo calculado no build — ver vite.config.ts), para não carregar os
 * ~4 MB do banco a cada abertura do app.
 */
import { Preferences } from "@capacitor/preferences";
import { buscarQuestaoBanco, garantirBanco, questaoBancoParaQuestao, type QuestaoBanco } from "./banco";
import { all, runBatch } from "./db";

const CHAVE_VERSAO = "banco-versao-sincronizada";

export interface LinhaSync {
  id: number;
  banco_id: string;
  enunciado: string;
  alternativas: string | null;
  gabarito: string;
  enunciado_editado: number | null;
  banco_hash: string | null;
}

export interface AtualizacaoSync {
  id: number;
  banco_id: string;
  enunciado: string;
  alternativas: string | null;
  gabarito: string;
  enunciado_editado: number;
  banco_hash: string;
  /** Gabarito/alternativas mudaram: a explicação em cache (explicacoes_banco)
   * foi gerada para o conteúdo antigo. */
  limparCacheExplicacao: boolean;
}

/** FNV-1a 32 bits — só identifica versão de conteúdo, não é criptográfico. */
export function hashConteudo(enunciado: string, alternativas: string | null, gabarito: string): string {
  const s = `${enunciado}\u0000${alternativas ?? ""}\u0000${gabarito}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

const semEspacos = (s: string) => s.replace(/\s+/g, "");

export function planejarSincronizacao(
  linhas: LinhaSync[],
  buscar: (id: string) => QuestaoBanco | null,
): AtualizacaoSync[] {
  const plano: AtualizacaoSync[] = [];
  for (const l of linhas) {
    const q = buscar(l.banco_id);
    if (!q) continue;
    const conv = questaoBancoParaQuestao(q);
    const alternativas = conv.alternativas ? JSON.stringify(conv.alternativas) : null;
    const hash = hashConteudo(conv.enunciado, alternativas, conv.gabarito);
    if (l.banco_hash === hash) continue;
    const editado = l.enunciado_editado ?? (semEspacos(l.enunciado) !== semEspacos(conv.enunciado) ? 1 : 0);
    plano.push({
      id: l.id,
      banco_id: l.banco_id,
      enunciado: editado ? l.enunciado : conv.enunciado,
      alternativas,
      gabarito: conv.gabarito,
      enunciado_editado: editado,
      banco_hash: hash,
      limparCacheExplicacao: l.gabarito !== conv.gabarito || l.alternativas !== alternativas,
    });
  }
  return plano;
}

let emAndamento: Promise<void> | null = null;

/** Chamar no boot, depois do getDB(). Silencioso: falha só loga e tenta de
 * novo no próximo boot. Uma execução por vez — o efeito de boot pode disparar
 * duas vezes (StrictMode) e dois runBatch simultâneos colidem na transação. */
export function sincronizarRespondidasComBanco(): Promise<void> {
  emAndamento ??= sincronizar();
  return emAndamento;
}

async function sincronizar(): Promise<void> {
  try {
    const { value } = await Preferences.get({ key: CHAVE_VERSAO });
    if (value === __BANCO_VERSAO__) return;
    await garantirBanco();
    const linhas = await all<LinhaSync>(
      `SELECT id, banco_id, enunciado, alternativas, gabarito, enunciado_editado, banco_hash
         FROM questoes_respondidas WHERE banco_id IS NOT NULL`,
    );
    const plano = planejarSincronizacao(linhas, buscarQuestaoBanco);
    const limpar = [...new Set(plano.filter((u) => u.limparCacheExplicacao).map((u) => u.banco_id))];
    await runBatch([
      ...plano.map((u) => ({
        sql: `UPDATE questoes_respondidas
                 SET enunciado = ?, alternativas = ?, gabarito = ?, enunciado_editado = ?, banco_hash = ?
               WHERE id = ?`,
        params: [u.enunciado, u.alternativas, u.gabarito, u.enunciado_editado, u.banco_hash, u.id],
      })),
      ...limpar.map((id) => ({ sql: `DELETE FROM explicacoes_banco WHERE banco_id = ?`, params: [id] })),
    ]);
    await Preferences.set({ key: CHAVE_VERSAO, value: __BANCO_VERSAO__ });
  } catch (e) {
    console.error("sincronizar questões respondidas com o banco", e);
  }
}
