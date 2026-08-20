/**
 * Identidade visual: paleta `C` (roxo como cor primária, fundo branco/cinza
 * no tema claro — inspirada no Estratégia) e uma família tipográfica só,
 * Montserrat, sem serifa nem monoespaçado.
 *
 * Os valores em si (claro e escuro) vivem em styles.css como variáveis CSS —
 * aqui só os nomes das variáveis, para que o tema escuro funcione em todo
 * componente que já usa C.paper/C.ink/etc. sem precisar tocar em nenhum deles.
 */
import type { CSSProperties } from "react";

export const C = {
  paper: "var(--paper)",
  card: "var(--card)",
  ink: "var(--ink)",
  caneta: "var(--caneta)",
  canetaSoft: "var(--caneta-soft)",
  ok: "var(--ok)",
  okSoft: "var(--ok-soft)",
  erro: "var(--erro)",
  erroSoft: "var(--erro-soft)",
  line: "var(--line)",
  sub: "var(--sub)",
  /** Preenchimento sólido sempre emparelhado com texto branco fixo — ver o
   * comentário de --realce em styles.css antes de reaproveitar `ink` aqui. */
  realce: "var(--realce)",
  /** Degradê roxo do calendário de sequência (heatmap) — ver styles.css. */
  heat1: "var(--heat-1)",
  heat2: "var(--heat-2)",
  heat3: "var(--heat-3)",
  heat4: "var(--heat-4)",
} as const;

// Uma família só (Montserrat) para todo o app — sem serifa, sem monoespaçado.
// `mono` continua existindo como token separado (rótulos, chips, datas usam
// peso/tamanho/letter-spacing diferentes de `disp`), só a fonte em si mudou.
const SANS = "'Montserrat', system-ui, -apple-system, sans-serif";

export const mono: CSSProperties = {
  fontFamily: SANS,
};

export const disp: CSSProperties = {
  fontFamily: SANS,
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
