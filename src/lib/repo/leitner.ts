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
