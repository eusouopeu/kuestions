/**
 * Identidade visual herdada de Questoes-Kumon.jsx — paleta `C` e as duas
 * famílias tipográficas (Archivo para display, IBM Plex Mono para rótulos).
 * Valores idênticos ao artefato: nada aqui foi reajustado.
 */
import type { CSSProperties } from "react";

export const C = {
  paper: "#F6F5F0",
  card: "#FFFFFF",
  ink: "#1C2733",
  caneta: "#2044C4",
  canetaSoft: "#E8EDFB",
  ok: "#157A45",
  okSoft: "#E4F2EA",
  erro: "#B23A2F",
  erroSoft: "#F8E9E7",
  line: "#DDDACF",
  sub: "#6B7280",
} as const;

export const mono: CSSProperties = {
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
};

export const disp: CSSProperties = {
  fontFamily: "'Archivo', system-ui, sans-serif",
};

/** Rótulo de campo: mono, minúsculo→caixa alta, cinza. */
export const rotulo: CSSProperties = {
  ...mono,
  fontSize: 11,
  color: C.sub,
  letterSpacing: 0.8,
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
};

/** Input/select padrão: borda de 1.5px, como os cartões. */
export const campo: CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 8,
  border: `1.5px solid ${C.line}`,
  background: C.card,
  fontSize: 15,
  color: C.ink,
  ...disp,
};

/** Cartão: fundo branco, borda de 1.5px, raio 12. */
export const cartao: CSSProperties = {
  background: C.card,
  border: `1.5px solid ${C.line}`,
  borderRadius: 12,
  padding: "18px 16px",
};

/** Altura da tab bar, usada como padding inferior nas telas roláveis. */
export const TAB_BAR_H = 58;
