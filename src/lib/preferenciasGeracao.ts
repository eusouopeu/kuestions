/**
 * Preferência única (Ajustes) para "gerar comentário/explicações de IA já na
 * criação do bloco" — antes era um toggle repetido em cada tela de geração
 * (GerarView, GerarBancoView), que resetava para o padrão a cada visita.
 * Guardado com o mesmo mecanismo de tema.ts/lembretes.ts (@capacitor/preferences).
 */
import { Preferences } from "@capacitor/preferences";

const K_COM_EXPLICACOES = "geracao-com-explicacoes-ia";

export async function getComExplicacoesIA(): Promise<boolean> {
  const { value } = await Preferences.get({ key: K_COM_EXPLICACOES });
  return value == null ? true : value === "1";
}

export async function setComExplicacoesIA(v: boolean): Promise<void> {
  await Preferences.set({ key: K_COM_EXPLICACOES, value: v ? "1" : "0" });
}
