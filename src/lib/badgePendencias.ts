/**
 * Selo de pendências no ícone da aba Questões (rec. 8): contagem de
 * questões + notas vencidas de revisão, mostrada direto no ícone — sem
 * precisar entrar na aba pra saber se há algo pendente hoje. Opcional
 * (padrão desligado) porque é um elemento visual permanente na navegação;
 * quem prefere a barra limpa não é forçado a olhar o número. Mesmo padrão
 * de Preferences de lib/lembretes.ts e lib/metas.ts.
 */
import { Preferences } from "@capacitor/preferences";

const K_ATIVO = "badge-pendencias-ativo";

export async function getBadgePendenciasAtivo(): Promise<boolean> {
  try {
    const { value } = await Preferences.get({ key: K_ATIVO });
    return value === "1";
  } catch {
    return false;
  }
}

export async function setBadgePendenciasAtivo(ativo: boolean): Promise<void> {
  await Preferences.set({ key: K_ATIVO, value: ativo ? "1" : "0" });
}
