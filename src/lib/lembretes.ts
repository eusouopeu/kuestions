/**
 * Lembrete diário de prática (notificação local, via @capacitor/local-
 * notifications). Preferência (ativo/hora) guardada com o mesmo mecanismo de
 * tema.ts/secure.ts (@capacitor/preferences). No navegador (dev), o plugin
 * não tem implementação web para agendamento recorrente — degrada para
 * "indisponível" em vez de quebrar a tela de Ajustes.
 */
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";

const K_ATIVO = "lembrete-ativo";
const K_HORA = "lembrete-hora";
const ID_NOTIFICACAO = 1001;
const HORA_PADRAO = 19;

export interface ConfigLembrete {
  ativo: boolean;
  hora: number; // 0–23
}

/** Só o nativo (Android/iOS) agenda notificação recorrente de verdade. */
export const lembreteDisponivel = Capacitor.isNativePlatform();

export async function getConfigLembrete(): Promise<ConfigLembrete> {
  try {
    const [a, h] = await Promise.all([
      Preferences.get({ key: K_ATIVO }),
      Preferences.get({ key: K_HORA }),
    ]);
    return {
      ativo: a.value === "1",
      hora: h.value ? Number(h.value) : HORA_PADRAO,
    };
  } catch {
    return { ativo: false, hora: HORA_PADRAO };
  }
}

async function agendar(hora: number): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: ID_NOTIFICACAO }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: ID_NOTIFICACAO,
        title: "Hora de praticar",
        body: "Um bloco de 12 questões mantém sua sequência no Kuestions.",
        schedule: { on: { hour: hora, minute: 0 }, repeats: true, allowWhileIdle: true },
      },
    ],
  });
}

/**
 * Liga/desliga e/ou muda o horário do lembrete. Ligar pede permissão de
 * notificação na hora — se o usuário negar, a preferência não é salva como
 * ativa (devolve `false` para a tela avisar).
 */
export async function setConfigLembrete(cfg: ConfigLembrete): Promise<boolean> {
  if (!lembreteDisponivel) return false;

  if (!cfg.ativo) {
    await LocalNotifications.cancel({ notifications: [{ id: ID_NOTIFICACAO }] });
    await Promise.all([
      Preferences.set({ key: K_ATIVO, value: "0" }),
      Preferences.set({ key: K_HORA, value: String(cfg.hora) }),
    ]);
    return true;
  }

  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return false;

  await agendar(cfg.hora);
  await Promise.all([
    Preferences.set({ key: K_ATIVO, value: "1" }),
    Preferences.set({ key: K_HORA, value: String(cfg.hora) }),
  ]);
  return true;
}
