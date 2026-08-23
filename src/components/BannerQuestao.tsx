import { C, mono } from "../theme";

/**
 * Os dois banners que identificam uma questão, no topo do card — separados
 * porque são informações de natureza diferente: de ONDE a questão veio
 * (prova real: banca, cargo, ano) versus SOBRE O QUE ela trata (assunto).
 *
 * `BannerTopico` é o MESMO componente para questão do banco real e questão
 * gerada por IA — qualquer ajuste visual pedido para um vale para o outro
 * automaticamente, sem precisar lembrar de replicar a mudança em dois
 * lugares. `BannerProveniencia` só faz sentido para questão de prova real
 * (a IA não tem banca/cargo/ano) e por isso não tem equivalente do lado IA.
 */

/** Banner cinza: instituição · cargo · ano — só em questão de prova real. */
export function BannerProveniencia({ texto }: { texto: string }) {
  return (
    <div
      style={{
        ...mono,
        fontSize: 11,
        lineHeight: 1.4,
        color: C.sub,
        background: C.paper,
        border: `1.5px solid ${C.line}`,
        borderRadius: 8,
        padding: "6px 10px",
        marginBottom: 6,
      }}
    >
      {texto}
    </div>
  );
}

/**
 * Banner roxo: assunto/tópico da questão, com o emoji de incidência na
 * frente quando houver (ver emojiIncidencia em lib/banco.ts) — presente em
 * TODA questão com origem conhecida, banco ou IA.
 */
export function BannerTopico({ texto, emoji }: { texto: string; emoji?: string | null }) {
  return (
    <div
      style={{
        ...mono,
        fontSize: 11,
        lineHeight: 1.4,
        color: C.caneta,
        background: C.canetaSoft,
        borderRadius: 8,
        padding: "6px 10px",
        marginBottom: 6,
      }}
    >
      {emoji ? `${emoji} ` : ""}
      {texto}
    </div>
  );
}
