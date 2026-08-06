import { C, mono } from "../theme";

/**
 * Barra de progresso linear do bloco — substituiu o trilho de carga
 * conceitual A–D (removido: a progressão de complexidade estrutural entre
 * sub-blocos não estava rendendo questões perceptivelmente diferentes, então
 * deixou de fazer sentido expor essa divisão ao usuário). A geração ainda
 * roda em lotes de `Q_POR_SUB` nos bastidores (ver dispararSub em
 * GerarView.tsx) só por latência da API — aqui só importa o total.
 */
export default function Rail({ atual, total }: { atual: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((atual / total) * 100)) : 0;
  return (
    <div style={{ padding: "10px 0 2px" }}>
      <div
        style={{
          height: 6,
          background: C.line,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: C.caneta,
            borderRadius: 3,
            transition: "width 0.25s ease",
          }}
        />
      </div>
      <div
        style={{
          ...mono,
          fontSize: 11,
          color: C.sub,
          textAlign: "center",
          marginTop: 6,
        }}
      >
        {atual}/{total}
      </div>
    </div>
  );
}
