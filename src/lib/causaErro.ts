/**
 * Causa do erro, marcada em 1 toque depois de errar (botão-ícone na barra de
 * ações do QuestaoCard) e gravada em `questoes_respondidas.causa_erro`. A
 * distribuição na aba Dados separa erro de conteúdo ("não sabia",
 * "confundi") de erro de execução (atenção, interpretação, cálculo) — cada
 * um pede um remédio diferente.
 */
export const CAUSAS_ERRO = [
  { id: "nao-sabia", label: "Não sabia" },
  { id: "confundi", label: "Confundi conceitos" },
  { id: "atencao", label: "Falta de atenção" },
  { id: "interpretacao", label: "Interpretei errado" },
  { id: "calculo", label: "Erro de cálculo" },
] as const;

export type CausaErro = (typeof CAUSAS_ERRO)[number]["id"];

export function labelCausaErro(id: string): string {
  return CAUSAS_ERRO.find((c) => c.id === id)?.label ?? id;
}
