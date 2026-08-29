/** Dias até a próxima revisão, indexado pela caixa (1–5) alcançada ao
 * acertar — progressão inspirada no sistema de Leitner: quem acerta de novo
 * espera cada vez mais para revisar; quem erra volta à caixa 1 (vence agora).
 * Compartilhado entre questões (registrarRevisao, ver ./questoes.ts) e notas
 * (registrarRevisaoNota, ver ./notas.ts) — mesmo esquema de repetição
 * espaçada aplicado a duas tabelas diferentes. */
export const INTERVALOS_LEITNER_DIAS = [1, 3, 7, 16, 35] as const;
