/**
 * Importa notas geradas fora do app (hoje: exportação "Notas p/ kuestions" do
 * Prova do Crime). Formato: { origem, caso, notas: [{ materia, corpo, tag }] }.
 * `corpo` precisa do separador "::" de flashcard básico (ver lib/flashcards.ts).
 * Item inválido é descartado e contado, não trava o resto (mesma política do
 * import de questões).
 */
import { salvarNota } from "./repo/notas";

export interface NotaImportada { materia: string; corpo: string; tag: string }

export function lerNotasImportadas(raw: unknown): { notas: NotaImportada[]; descartadas: number } {
  const lista = (raw as { notas?: unknown })?.notas;
  if (!Array.isArray(lista)) throw new Error("Arquivo sem a lista \"notas\".");
  const notas: NotaImportada[] = [];
  for (const item of lista) {
    const o = (item ?? {}) as Record<string, unknown>;
    const materia = typeof o.materia === "string" ? o.materia.trim() : "";
    const corpo = typeof o.corpo === "string" ? o.corpo.trim() : "";
    const tag = typeof o.tag === "string" && o.tag.trim() ? o.tag.trim() : "importada";
    if (materia && corpo.includes("::")) notas.push({ materia, corpo, tag });
  }
  return { notas, descartadas: lista.length - notas.length };
}

export async function importarNotas(notas: NotaImportada[]): Promise<number> {
  for (const n of notas) await salvarNota({ ...n, questaoOrigemId: null });
  return notas.length;
}
