import { XMarkIcon } from "@heroicons/react/24/outline";
import { C, mono } from "../theme";

/**
 * Barra de progresso linear do bloco — substituiu o trilho de carga
 * conceitual A–D (removido: a progressão de complexidade estrutural entre
 * sub-blocos não estava rendendo questões perceptivelmente diferentes, então
 * deixou de fazer sentido expor essa divisão ao usuário). A geração ainda
 * roda em lotes de `Q_POR_SUB` nos bastidores (ver dispararSub em
 * GerarView.tsx) só por latência da API — aqui só importa o total.
 */
/**
 * `onSair`, quando informado, desenha um botão de saída fixo ao lado da barra
 * — sempre visível no topo do drill, sem depender de rolar até o fim do
 * card para abandonar o bloco (o link antigo ficava depois da questão
 * inteira, invisível em blocos de MC longos numa tela pequena).
 */
export default function Rail({
  atual,
  total,
  onSair,
}: {
  atual: number;
  total: number;
  onSair?: () => void;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((atual / total) * 100)) : 0;
  return (
    <div style={{ padding: "10px 0 2px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1 }}>
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
      {onSair && (
        <button
          onClick={onSair}
          aria-label="Abandonar bloco"
          title="Abandonar bloco"
          style={{
            flexShrink: 0,
            width: 30,
            height: 30,
            borderRadius: 8,
            border: `1.5px solid ${C.line}`,
            background: C.card,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <XMarkIcon width={16} height={16} stroke={C.sub} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
