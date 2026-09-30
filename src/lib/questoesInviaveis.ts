/**
 * Questões do banco fixo marcadas pelo usuário como impossíveis de resolver
 * (dependem de imagem/figura da prova que não veio para o JSON). Ficam fora
 * do sorteio (ver `questoesFiltradas` em banco.ts). Guardado só no aparelho,
 * com o mesmo mecanismo de preferenciasGeracao.ts (@capacitor/preferences) —
 * não mexe em `questoes_respondidas`, já que a questão nem chegou a ser
 * respondida.
 */
import { Preferences } from "@capacitor/preferences";

const CHAVE = "banco-questoes-inviaveis";
let ids = new Set<string>();

export function ehInviavel(id: string): boolean {
  return ids.has(id);
}

/** Lê a lista gravada — chamar uma vez no boot (App.tsx). */
export async function carregarInviaveis(): Promise<void> {
  try {
    const { value } = await Preferences.get({ key: CHAVE });
    const lista = value ? (JSON.parse(value) as unknown) : [];
    ids = new Set(Array.isArray(lista) ? lista.filter((x): x is string => typeof x === "string") : []);
  } catch (e) {
    console.error("carregar questões inviáveis", e);
  }
}

export async function marcarInviavel(id: string): Promise<void> {
  ids.add(id);
  await Preferences.set({ key: CHAVE, value: JSON.stringify([...ids]) });
}

/** Só para testes. */
export function _resetInviaveis(): void {
  ids = new Set();
}
