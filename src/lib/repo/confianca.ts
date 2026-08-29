/** Calibração de confiança: cruza a autoavaliação do slider (ver
 * SliderConfianca) com o acerto real — separa quem sabe de quem chuta, e
 * identifica o excesso de confiança (marcar "certeza" e errar mesmo assim). */
import { all, one } from "../db";
import { COND_PENDENTE } from "./questoes";
import { agoraISO } from "./util";

/**
 * Questão em que o usuário arrastou o slider até "certeza absoluta" (o
 * extremo direito, ver NIVEIS_CONFIANCA em lib/pontuacaoTopicos.ts) ANTES de
 * revelar o gabarito e mesmo assim errou. É o erro mais caro numa prova de
 * verdade: sem dúvida percebida, o candidato não revisaria aquele ponto nem
 * no dia anterior. Só o extremo conta aqui de propósito — "quase certeza"
 * ainda é dúvida reconhecida, não é esse erro. Vira prioridade de revisão
 * (ver listarErradas, que ordena esses primeiro) e um indicador próprio na
 * aba Dados.
 */
const COND_ERRO_PERIGOSO = "acertou = 0 AND confianca = 'certeza'";

export interface ResumoConfianca {
  /** Respostas com autoavaliação registrada (base dos percentuais). */
  comConfianca: number;
  /** Marcou "certeza absoluta" e errou. */
  perigosos: number;
  /** Marcou "certeza absoluta" (acertando ou não). */
  certezas: number;
  /** Marcou "chute total" e acertou — o outro lado da má calibração. */
  sorte: number;
  /** % de excesso de confiança: perigosos / certezas. */
  pctExcessoConfianca: number;
}

export async function resumoConfianca(materia: string | null = null): Promise<ResumoConfianca> {
  const cond = ["confianca IS NOT NULL"];
  const params: unknown[] = [];
  if (materia) {
    cond.push("materia = ?");
    params.push(materia);
  }
  const linha = await one<{
    total: number;
    perigosos: number;
    certezas: number;
    sorte: number;
  }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN acertou = 0 AND confianca = 'certeza' THEN 1 ELSE 0 END) AS perigosos,
            SUM(CASE WHEN confianca = 'certeza' THEN 1 ELSE 0 END) AS certezas,
            SUM(CASE WHEN acertou = 1 AND confianca = 'chute' THEN 1 ELSE 0 END) AS sorte
     FROM questoes_respondidas WHERE ${cond.join(" AND ")}`,
    params,
  );
  const certezas = Number(linha?.certezas ?? 0);
  const perigosos = Number(linha?.perigosos ?? 0);
  return {
    comConfianca: Number(linha?.total ?? 0),
    perigosos,
    certezas,
    sorte: Number(linha?.sorte ?? 0),
    pctExcessoConfianca: certezas ? Math.round((perigosos / certezas) * 100) : 0,
  };
}

/** Quantos erros perigosos ainda estão pendentes de revisão — a contagem que
 * o botão de revisão prioritária exibe. */
export async function contarErrosPerigososPendentes(materia: string | null = null): Promise<number> {
  const cond = [COND_ERRO_PERIGOSO, COND_PENDENTE];
  const params: unknown[] = [agoraISO()];
  if (materia) {
    cond.splice(1, 0, "materia = ?");
    params.unshift(materia);
  }
  const linha = await one<{ total: number }>(
    `SELECT COUNT(*) AS total FROM questoes_respondidas WHERE ${cond.join(" AND ")}`,
    params,
  );
  return Number(linha?.total ?? 0);
}

export interface CalibracaoMateria {
  materia: string;
  certezas: number;
  perigosos: number;
  pctExcessoConfianca: number;
}

/** Mínimo de "certezas" (respostas marcadas com confiança máxima) para uma
 * matéria entrar no ranking — abaixo disso, 1 erro já vira 100% de excesso e
 * não diz nada sobre o hábito de autoavaliação naquela matéria. */
const MINIMO_CERTEZAS_CALIBRACAO = 5;

/**
 * `resumoConfianca` já cruza confiança declarada × acerto real, mas só
 * agregado (uma matéria de cada vez, ou tudo junto). O que faltava era
 * comparar matérias entre si: "em Tributário você é bem calibrado; em
 * Contabilidade superestima 25 pontos" é uma informação acionável que o
 * agregado sozinho não mostra. Ordenado do pior para o melhor calibrado —
 * mesma convenção de porConceito (onde treinar/recalibrar primeiro).
 */
export async function resumoConfiancaPorMateria(): Promise<CalibracaoMateria[]> {
  const rows = await all<{ materia: string; certezas: number; perigosos: number }>(
    `SELECT materia,
            SUM(CASE WHEN confianca = 'certeza' THEN 1 ELSE 0 END) AS certezas,
            SUM(CASE WHEN acertou = 0 AND confianca = 'certeza' THEN 1 ELSE 0 END) AS perigosos
     FROM questoes_respondidas
     WHERE confianca IS NOT NULL
     GROUP BY materia
     HAVING certezas >= ?
     ORDER BY (CAST(perigosos AS REAL) / certezas) DESC`,
    [MINIMO_CERTEZAS_CALIBRACAO],
  );
  return rows.map((r) => {
    const certezas = Number(r.certezas);
    const perigosos = Number(r.perigosos);
    return {
      materia: String(r.materia),
      certezas,
      perigosos,
      pctExcessoConfianca: certezas ? Math.round((perigosos / certezas) * 100) : 0,
    };
  });
}
