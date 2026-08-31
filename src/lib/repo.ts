/**
 * Todas as queries do app, reexportadas de ./repo/* organizado por domínio —
 * este arquivo era um único módulo de ~1900 linhas cobrindo blocos, respostas,
 * notas, agregações de Dados, calibração de confiança, backup/mesclagem e uso
 * de API. A API pública (o que se importa de "../lib/repo" em todo o app) não
 * mudou: só a organização interna.
 *
 * Convenção do filtro de matéria, válida em todos os módulos: `null` = todas
 * as matérias. Cada função monta um WHERE opcional em vez de filtrar depois,
 * para que "todas" e "uma matéria" sigam exatamente o mesmo caminho de código.
 *
 * - ./repo/blocos.ts        tabela `blocos`
 * - ./repo/questoes.ts      tabela `questoes_respondidas` (respostas, fila de
 *                           revisão, cache de explicações do banco, reports)
 * - ./repo/notas.ts         tabela `conceitos_salvos`
 * - ./repo/estatisticas.ts  agregações da aba Dados
 * - ./repo/confianca.ts     calibração de confiança (erro perigoso, excesso
 *                           de confiança por matéria)
 * - ./repo/backup.ts        mesclagem entre aparelhos
 * - ./repo/usoApi.ts        tabela `uso_api` (custo/tokens)
 * - ./repo/leitner.ts       constante de repetição espaçada compartilhada
 * - ./repo/util.ts          helper compartilhado (agoraISO)
 */
export * from "./repo/blocos";
export * from "./repo/questoes";
export * from "./repo/notas";
export * from "./repo/estatisticas";
export * from "./repo/confianca";
export * from "./repo/backup";
export * from "./repo/usoApi";
export * from "./repo/caderno";
export * from "./repo/mapas";
export * from "./repo/tarefas";
export * from "./repo/pdfs";
export * from "./repo/simulados";
