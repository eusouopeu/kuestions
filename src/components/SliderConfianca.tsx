import { useRef, useState } from "react";
import { C, disp, mono } from "../theme";
import { LABEL_CONFIANCA, NIVEIS_CONFIANCA, type Confianca } from "../lib/pontuacaoTopicos";

export type { Confianca };

/** Abaixo disto o gesto é tratado como desistência: o botão volta ao início
 * e nada é enviado. Bem menor que a largura de uma zona (25%) para que
 * qualquer arrasto deliberado já entre na primeira faixa. */
const LIMIAR_ENVIO = 0.06;

/** Cor de cada uma das 4 faixas, na mesma ordem de NIVEIS_CONFIANCA — reaproveita
 * o degradê do calendário de sequência (heat1..heat4 em theme.ts): mesma
 * linguagem visual de "intensidade" já usada em Dados, aqui aplicada ao quanto
 * de confiança foi declarado. */
const COR_ZONA: Record<Confianca, string> = {
  chute: C.heat1,
  "chute-embasado": C.heat2,
  "quase-certeza": C.heat3,
  certeza: C.heat4,
};

/** Zona (0–3) a partir da posição (0–1) — 4 faixas iguais. */
function indiceZona(p: number): number {
  return Math.min(NIVEIS_CONFIANCA.length - 1, Math.floor(p * NIVEIS_CONFIANCA.length));
}
function zonaDe(p: number): Confianca {
  return NIVEIS_CONFIANCA[indiceZona(p)];
}

/**
 * Envio da resposta por arrasto, com o quanto você arrastou valendo como
 * declaração de confiança — substitui os dois botões separados ("Chute" e
 * "Enviar") por um gesto só, agora com QUATRO faixas em vez de duas: chute
 * total, chute embasado, quase certeza, certeza absoluta (ver
 * NIVEIS_CONFIANCA em lib/pontuacaoTopicos.ts). Granularidade extra sem
 * mudar o gesto: continua sendo arrastar e soltar, só que solto mais perto
 * do meio já distingue "não fazia ideia" de "eliminei alternativas".
 *
 * O ganho não é de espaço: com dois botões, "Chute" era o caminho mais
 * trabalhoso (botão menor, secundário) justamente para a resposta que o
 * usuário tem menos vontade de admitir, o que enviesa o dado. Aqui as quatro
 * declarações custam o mesmo gesto, e a diferença é só onde ele termina.
 */
export default function SliderConfianca({
  disabled,
  onEnviar,
}: {
  disabled?: boolean;
  onEnviar: (confianca: Confianca) => void;
}) {
  const trilhaRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  // A posição também vive num ref porque quem decide o envio é o `pointerup`,
  // e ler `p` do estado ali arrisca pegar o valor de ANTES do último
  // `pointermove` (React agrupa as atualizações). Num arrasto rápido — ou
  // sintético, sem quadros intermediários — isso cancelaria um envio que o
  // usuário completou.
  const pRef = useRef(0);
  // Mesmo motivo para o "está arrastando": `pointerdown` e `pointermove`
  // podem cair no mesmo lote de atualização do React, e aí o `pointermove`
  // ainda leria `arrastando === false` e ignoraria o movimento. O estado
  // continua existindo só para desligar a transição de CSS durante o gesto.
  const arrastandoRef = useRef(false);

  function mudarP(v: number) {
    pRef.current = v;
    setP(v);
  }

  function posicaoDe(clientX: number): number {
    const r = trilhaRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  }

  function iniciar(e: React.PointerEvent) {
    if (disabled) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* sem captura o gesto ainda funciona — mesmo tratamento de Opcao */
    }
    arrastandoRef.current = true;
    setArrastando(true);
    mudarP(posicaoDe(e.clientX));
  }

  function mover(e: React.PointerEvent) {
    if (!arrastandoRef.current || disabled) return;
    mudarP(posicaoDe(e.clientX));
  }

  function soltar() {
    if (!arrastandoRef.current) return;
    arrastandoRef.current = false;
    setArrastando(false);
    const final = pRef.current;
    if (final >= LIMIAR_ENVIO) onEnviar(zonaDe(final));
    // Volta ao início nos dois casos: se enviou, o card revela o gabarito e
    // some com a trilha; se não, o gesto foi cancelado.
    mudarP(0);
  }

  /** Teclado (navegador/desktop e leitores de tela): setas movem de faixa em
   * faixa, Enter/espaço envia com a confiança da posição atual. */
  function tecla(e: React.KeyboardEvent) {
    if (disabled) return;
    const passo = 1 / NIVEIS_CONFIANCA.length;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      mudarP(Math.min(1, pRef.current + passo));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      mudarP(Math.max(0, pRef.current - passo));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const final = pRef.current;
      if (final >= LIMIAR_ENVIO) {
        onEnviar(zonaDe(final));
        mudarP(0);
      }
    }
  }

  const armado = p >= LIMIAR_ENVIO;
  const zona = zonaDe(p);
  const corAtiva = COR_ZONA[zona];

  return (
    <div style={{ marginTop: 14, opacity: disabled ? 0.5 : 1 }}>
      <div
        ref={trilhaRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Arraste para responder: quanto mais à direita, maior a confiança na resposta"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p * 100)}
        aria-valuetext={armado ? LABEL_CONFIANCA[zona] : "Sem resposta enviada"}
        aria-disabled={disabled}
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onKeyDown={tecla}
        style={{
          position: "relative",
          height: 52,
          borderRadius: 26,
          border: `1.5px solid ${armado ? corAtiva : C.line}`,
          overflow: "hidden",
          touchAction: "none",
          cursor: disabled ? "default" : "grab",
          userSelect: "none",
          display: "flex",
        }}
      >
        {/* As 4 faixas, sempre visíveis — é a divisão do espaço em si, não um
            preenchimento de progresso. Cada uma mais clara até armar (o
            usuário ainda não confirmou nada) e em cor plena a partir do
            momento em que o arrasto passa da faixa morta inicial. */}
        {NIVEIS_CONFIANCA.map((n, i) => (
          <div
            key={n}
            style={{
              flex: 1,
              background: COR_ZONA[n],
              opacity: armado ? (i <= indiceZona(p) ? 1 : 0.28) : 0.35,
              transition: arrastando ? "none" : "opacity .15s",
              borderRight: i < NIVEIS_CONFIANCA.length - 1 ? "1.5px solid rgba(0,0,0,.18)" : "none",
            }}
          />
        ))}

        {/* Pegador — fundo neutro fixo (não a cor da faixa), para a seta
            branca continuar legível em cima de qualquer uma das 4 cores. */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: `calc(${p * 100}% - ${p * 44}px + 4px)`,
            width: 44,
            height: 42,
            borderRadius: 21,
            background: C.ink,
            border: `2px solid ${C.card}`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            pointerEvents: "none",
            transition: arrastando ? "none" : "left .15s",
            ...disp,
          }}
        >
          →
        </div>
      </div>

      {/* Legenda curta de cada faixa, sob a trilha — orienta antes mesmo do
          primeiro toque, já que a trilha em si não tem texto (ver acima). */}
      <div
        style={{
          ...mono,
          display: "flex",
          fontSize: 9.5,
          color: C.sub,
          marginTop: 5,
          textAlign: "center",
        }}
      >
        <span style={{ flex: 1 }}>chute</span>
        <span style={{ flex: 1 }}>embasado</span>
        <span style={{ flex: 1 }}>quase certeza</span>
        <span style={{ flex: 1 }}>certeza</span>
      </div>

      {/* Status dinâmico: o prompt antes de armar, o nome completo da faixa
          depois — texto sobre o fundo neutro do card, nunca sobre a trilha
          colorida, então a cor de cada faixa pode ser lida sem preocupação
          com contraste de texto em cima dela. */}
      <div
        style={{
          ...mono,
          textAlign: "center",
          fontSize: 12.5,
          fontWeight: armado ? 700 : 400,
          color: armado ? corAtiva : C.sub,
          marginTop: 6,
        }}
      >
        {armado ? `Solte: ${LABEL_CONFIANCA[zona]}` : "Arraste para responder →"}
      </div>
    </div>
  );
}
