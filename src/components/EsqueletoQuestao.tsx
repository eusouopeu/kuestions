import { C, cartao, mono } from "../theme";

/**
 * Skeleton no formato de QuestaoCard, mostrado enquanto o próximo sub-bloco
 * gera. Substitui o texto solto "Gerando mais questões…" — como a geração é
 * em cascata (o próximo lote já carrega enquanto o atual é respondido), o
 * usuário raramente vê isto por mais de um instante, mas quando vê, o layout
 * já antecipa o formato do card seguinte em vez de saltar.
 */
export default function EsqueletoQuestao() {
  return (
    <div style={cartao} aria-busy="true" aria-label="Gerando próxima questão">
      <div style={barra(0.92, 16)} />
      <div style={barra(0.98, 16)} />
      <div style={{ ...barra(0.6, 16), marginBottom: 18 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            style={{
              height: 42,
              borderRadius: 8,
              border: `1.5px solid ${C.line}`,
              background: C.paper,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div style={onda} />
          </div>
        ))}
      </div>

      <div
        style={{
          ...mono,
          fontSize: 11,
          color: C.sub,
          textAlign: "center",
          marginTop: 16,
        }}
      >
        Gerando próxima questão…
      </div>

      <style>{`
        @keyframes esqueleto-onda {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function barra(largura: number, altura: number) {
  return {
    height: altura,
    width: `${largura * 100}%`,
    borderRadius: 4,
    background: C.line,
    opacity: 0.5,
    marginBottom: 8,
  };
}

const onda = {
  position: "absolute" as const,
  inset: 0,
  background: `linear-gradient(90deg, transparent, ${C.card}66, transparent)`,
  animation: "esqueleto-onda 1.3s ease-in-out infinite",
};
