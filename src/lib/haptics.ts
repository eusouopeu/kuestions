/**
 * Feedback tátil nas ações-chave do drill (marcar, riscar, enviar, acerto/
 * erro, reportar). No navegador (`Capacitor.getPlatform() === "web"`), o
 * plugin cai para `navigator.vibrate`, que a maioria dos browsers desktop
 * ignora silenciosamente — por isso todo chamador aqui é fire-and-forget e
 * nunca precisa de tratamento de erro no ponto de uso.
 */
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

function seguro(fn: () => Promise<void>): void {
  fn().catch(() => {
    /* dispositivo sem suporte a haptics — silencioso, não é uma falha real */
  });
}

/** Toque leve: marcar/desmarcar alternativa, trocar de seletor. */
export function vibrarLeve(): void {
  seguro(() => Haptics.impact({ style: ImpactStyle.Light }));
}

/** Toque médio: riscar/desriscar alternativa, abrir modal. */
export function vibrarMedio(): void {
  seguro(() => Haptics.impact({ style: ImpactStyle.Medium }));
}

/** Resposta certa. */
export function vibrarSucesso(): void {
  seguro(() => Haptics.notification({ type: NotificationType.Success }));
}

/** Resposta errada. */
export function vibrarErro(): void {
  seguro(() => Haptics.notification({ type: NotificationType.Error }));
}

/** Ação de alerta/confirmação (reportar, abandonar bloco). */
export function vibrarAlerta(): void {
  seguro(() => Haptics.notification({ type: NotificationType.Warning }));
}
