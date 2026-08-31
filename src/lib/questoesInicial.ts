/**
 * Decide a sub-view inicial da aba Questões unificada (ver
 * views/QuestoesTab.tsx). Sem credencial de API, "Gerar com IA" é a única
 * das 6 sub-views que não funciona — a aba abre em "Do banco", que
 * funciona offline e sem credencial nenhuma (ver lib/banco.ts).
 */
export type ViewQuestoes =
  | "gerar"
  | "banco"
  | "importar"
  | "refazer"
  | "simulado"
  | "blocos-anteriores";

export function escolherViewInicial(temCredencial: boolean): ViewQuestoes {
  return temCredencial ? "gerar" : "banco";
}
