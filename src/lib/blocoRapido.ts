/**
 * Bloco rápido: 5 questões curtíssimas do banco (até TETO_CURTISSIMO
 * caracteres, sem figura nem tabela), de várias áreas — para a fila do
 * mercado ou o intervalo entre séries. Abre pelo botão em "Do banco" ou pelo
 * atalho do ícone do app no Android (ver lib/atalhos.ts).
 *
 * Funciona sem internet: as questões vêm do JSON embutido no app, e o
 * PRÓXIMO bloco rápido fica preparado com antecedência (ids em Preferences +
 * explicações no cache `explicacoes_banco`), gerado enquanto há rede. Na
 * academia sem sinal, o bloco abre já com o comentário de cada questão.
 */
import { Preferences } from "@capacitor/preferences";

const K = "bloco-rapido-pronto";

export const Q_BLOCO_RAPIDO = 5;

/** ids do banco do próximo bloco rápido já preparado, ou null. */
export async function getBlocoRapidoPronto(): Promise<string[] | null> {
  try {
    const { value } = await Preferences.get({ key: K });
    const ids = value ? (JSON.parse(value) as unknown) : null;
    return Array.isArray(ids) && ids.every((i) => typeof i === "string") ? ids : null;
  } catch {
    return null;
  }
}

export async function setBlocoRapidoPronto(ids: string[] | null): Promise<void> {
  try {
    if (ids) await Preferences.set({ key: K, value: JSON.stringify(ids) });
    else await Preferences.remove({ key: K });
  } catch {
    // Sem bloco preparado, o bloco rápido sorteia na hora — só perde as
    // explicações offline.
  }
}
