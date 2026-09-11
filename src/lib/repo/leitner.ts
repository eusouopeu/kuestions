/** Dias até a próxima revisão, indexado pela caixa (1–5) alcançada ao
 * acertar — progressão inspirada no sistema de Leitner: quem acerta de novo
 * espera cada vez mais para revisar; quem erra volta à caixa 1 (vence agora).
 * Compartilhado entre questões (registrarRevisao, ver ./questoes.ts) e notas
 * (registrarRevisaoNota, ver ./notas.ts) — mesmo esquema de repetição
 * espaçada aplicado a duas tabelas diferentes. */
export const INTERVALOS_LEITNER_DIAS = [1, 3, 7, 16, 35] as const;

/** Teto de caixa para uma questão de ERRO PERIGOSO (errou marcando
 * "certeza") sendo revisada em "Refazer": mesmo acertando de novo, nunca
 * passa da caixa 3 (7 dias) — ela nunca alcança os intervalos de 16/35 dias
 * dos acertos comuns. É o erro que não se autocorrige sozinho (a pessoa não
 * percebeu a dúvida na hora), então continua voltando num ciclo curto até o
 * padrão de erro sumir, em vez de sair de circulação como qualquer acerto. */
export const CAIXA_MAX_ERRO_PERIGOSO = 3;

/**
 * Fator de facilidade por questão (rec. 7, inspirado em SM-2/FSRS): antes
 * `INTERVALOS_LEITNER_DIAS` dava o MESMO intervalo pra questão trivial e pra
 * questão que a pessoa erra sempre — só a caixa distinguia as duas, e a
 * caixa reseta pra 1 a cada erro, então uma questão difícil que volta a ser
 * errada nunca se diferenciava de uma nova. `facilidade` persiste por
 * questão (`questoes_respondidas.facilidade`, migração 18) e multiplica o
 * dia-base da caixa: mais fácil = intervalo maior que o dia-base; mais
 * difícil = intervalo menor, mesmo na mesma caixa.
 *
 * Escala em torno de `FACILIDADE_PADRAO` (facilidade == padrão → intervalo
 * igual ao dia-base, comportamento anterior a esta mudança). Cada evento
 * desloca por um fator fixo (mesmo espírito do avanço modulado de caixa em
 * `registrarRevisao`, ver ./questoes.ts) em vez de recalcular do zero.
 */
export const FACILIDADE_PADRAO = 2.5;
export const FACILIDADE_MIN = 1.3;
export const FACILIDADE_MAX = 3.5;

/** Delta de facilidade por evento de revisão — mesmos três sinais que já
 * modulavam o avanço de caixa (rec. 6): erro, acerto lento (fluência baixa,
 * mesmo acertando) e acerto com confiança "certeza" (domínio já demonstrado
 * antes da revisão). Acerto comum não desloca a facilidade. */
export const DELTA_FACILIDADE_ERRO = -0.2;
export const DELTA_FACILIDADE_LENTO = -0.15;
export const DELTA_FACILIDADE_CERTEZA = 0.15;

/** Nova facilidade após um evento, sempre dentro de [FACILIDADE_MIN,
 * FACILIDADE_MAX] — sem teto/piso, um único erro (ou uma sequência de
 * acertos "certeza") desregularia o intervalo pra um extremo sem volta. */
export function ajustarFacilidade(atual: number, delta: number): number {
  return Math.max(FACILIDADE_MIN, Math.min(FACILIDADE_MAX, atual + delta));
}

/** Dias até a próxima revisão para uma caixa+facilidade dados: o dia-base da
 * caixa (`INTERVALOS_LEITNER_DIAS`) escalado pela razão entre a facilidade
 * atual e `FACILIDADE_PADRAO`. Nunca menos de 1 dia — uma facilidade no
 * piso não pode fazer a questão vencer no mesmo instante em que foi
 * revisada, o que a tiraria do sentido de "revisão espaçada". */
export function diasProximaRevisao(caixa: number, facilidade: number): number {
  const idx = Math.min(Math.max(caixa, 1), INTERVALOS_LEITNER_DIAS.length) - 1;
  const diaBase = INTERVALOS_LEITNER_DIAS[idx];
  return Math.max(1, Math.round(diaBase * (facilidade / FACILIDADE_PADRAO)));
}
