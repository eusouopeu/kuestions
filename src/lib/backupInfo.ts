/**
 * Data do último backup exportado (ver exportarBancoJSON em db.ts), só para
 * lembrar o usuário quando já faz tempo — o app não faz upload automático
 * para nenhum lugar, então isto é a única forma de saber se o backup está
 * desatualizado. Mesmo mecanismo de guarda de tema.ts/secure.ts.
 */
import { Preferences } from "@capacitor/preferences";

const K_ULTIMO_BACKUP = "ultimo-backup-ts";

/** Dias sem backup a partir dos quais a tela de Ajustes mostra o aviso. */
export const DIAS_PARA_AVISO_BACKUP = 14;

export async function registrarBackupFeito(): Promise<void> {
  try {
    await Preferences.set({ key: K_ULTIMO_BACKUP, value: new Date().toISOString() });
  } catch {
    // Não bloqueia o fluxo de exportação por causa disto — o backup em si já
    // foi gerado e entregue ao usuário quando isto é chamado.
  }
}

/** Dias desde o último backup, ou null se nunca houve um. */
export async function diasDesdeUltimoBackup(): Promise<number | null> {
  try {
    const { value } = await Preferences.get({ key: K_ULTIMO_BACKUP });
    if (!value) return null;
    const ms = Date.now() - new Date(value).getTime();
    return Math.floor(ms / 86_400_000);
  } catch {
    return null;
  }
}
