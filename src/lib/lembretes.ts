/**
 * Lembrete diário de revisão (rec. 8): notificação local pedindo para abrir
 * o app e ver o que venceu na fila de repetição espaçada. Só faz sentido em
 * nativo — não existe notificação local persistente no navegador (o que
 * existe, Web Notifications, não sobrevive o app fechado), então cada função
 * aqui vira no-op fora de Capacitor. Sem rede, sem backend: é só um alarme
 * agendado no próprio aparelho (`@capacitor/local-notifications`).
 *
 * O texto é genérico ("veja o que venceu hoje"), não a contagem exata — o
 * plugin agenda um alarme do sistema local, sem execução em segundo plano
 * para recalcular a contagem no momento do disparo; tentar aproximar isso
 * geraria um número desatualizado, pior que nenhum número.
 */
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const K_ATIVO = "lembrete-diario-ativo";
const K_HORA = "lembrete-diario-hora";
const ID_NOTIFICACAO = 1001;
const HORA_PADRAO = 9;

export async function getLembreteAtivo(): Promise<boolean> {
  const { value } = await Preferences.get({ key: K_ATIVO });
  return value === "1";
}

export async function getHoraLembrete(): Promise<number> {
  const { value } = await Preferences.get({ key: K_HORA });
  return value == null ? HORA_PADRAO : Number(value);
}

/** Liga/desliga o lembrete: agenda (ou cancela) o alarme do sistema e só
 * então persiste a preferência — se o agendamento falhar (permissão negada),
 * a tela sabe pelo erro lançado e não marca como ativo. */
export async function setLembreteDiario(ativo: boolean, hora: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    await Preferences.set({ key: K_ATIVO, value: ativo ? "1" : "0" });
    await Preferences.set({ key: K_HORA, value: String(hora) });
    return;
  }
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  if (!ativo) {
    await LocalNotifications.cancel({ notifications: [{ id: ID_NOTIFICACAO }] });
    await Preferences.set({ key: K_ATIVO, value: "0" });
    return;
  }
  const permissao = await LocalNotifications.requestPermissions();
  if (permissao.display !== "granted") {
    throw new Error("Permissão de notificação negada — ative em Ajustes do sistema.");
  }
  await LocalNotifications.schedule({
    notifications: [
      {
        id: ID_NOTIFICACAO,
        title: "Revisão pendente",
        body: "Abra o kuestions para ver o que venceu na fila de hoje.",
        schedule: { on: { hour: hora, minute: 0 }, allowWhileIdle: true },
      },
    ],
  });
  await Preferences.set({ key: K_ATIVO, value: "1" });
  await Preferences.set({ key: K_HORA, value: String(hora) });
}
