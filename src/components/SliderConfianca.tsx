import { useRef, useState } from "react";
import { C, disp, mono } from "../theme";

export type Confianca = "certeza" | "chute";

/** Abaixo disto o gesto é tratado como desistência: o botão volta ao início
 * e nada é enviado. Sem essa faixa morta, um toque acidental na trilha
 * enviaria a questão. */
const LIMIAR_ENVIO = 0.15;

/** Fronteira entre as duas zonas de confiança. Acima da metade da trilha o
 * envio conta como "certeza"; abaixo, como "chute" (ver `confianca` em
 * lib/types.ts e o cartão ERRO PERIGOSO na aba Dados, que cruza "certeza"
 * com erro). */
const LIMIAR_CERTEZA = 0.55;

function zonaDe(p: number): Confianca {
  return p >= LIMIAR_CERTEZA ? "certeza" : "chute";
}

/**
 * Envio da resposta por arrasto, com o quanto você arrastou valendo como
 * declaração de confiança — substitui os dois botões separados ("Chute" e
 * "Enviar") por um gesto só.
 *
 * O ganho não é de espaço: com dois botões, "Chute" era o caminho mais
 * trabalhoso (botão menor, secundário) justamente para a resposta que o
 * usuário tem menos vontade de admitir, o que enviesa o dado. Aqui as duas
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

  /** Teclado (navegador/desktop e leitores de tela): setas movem, Enter/espaço
   * envia com a confiança da posição atual. */
  function tecla(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      mudarP(Math.min(1, pRef.current + 0.1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      mudarP(Math.max(0, pRef.current - 0.1));
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
  const corAtiva = zona === "certeza" ? C.ok : C.sub;

  const rotulo = !armado
    ? "Arraste para responder →"
    : zona === "certeza"
      ? "Solte: tenho certeza"
      : "Solte: foi chute";

  return (
    <div style={{ marginTop: 14, opacity: disabled ? 0.5 : 1 }}>
      <div
        ref={trilhaRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Arraste para responder: à esquerda foi chute, à direita tenho certeza"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p * 100)}
        aria-valuetext={armado ? (zona === "certeza" ? "Certeza" : "Chute") : "Sem resposta enviada"}
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
          background: C.paper,
          overflow: "hidden",
          touchAction: "none",
          cursor: disabled ? "default" : "grab",
          userSelect: "none",
        }}
      >
        {/* Marca da fronteira "chute → certeza": sem ela o usuário não teria
            como saber onde a declaração muda. */}
        <div
          style={{
            position: "absolute",
            left: `${LIMIAR_CERTEZA * 100}%`,
            top: 8,
            bottom: 8,
            width: 1.5,
            background: C.line,
          }}
        />
        {/* Rastro preenchido até a posição atual. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${p * 100}%`,
            background: armado ? (zona === "certeza" ? C.okSoft : C.canetaSoft) : "transparent",
            transition: arrastando ? "none" : "width .15s",
          }}
        />
        <div
          style={{
            ...mono,
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12.5,
            color: armado ? corAtiva : C.sub,
            pointerEvents: "none",
          }}
        >
          {rotulo}
        </div>
        {/* Pegador. */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: `calc(${p * 100}% - ${p * 44}px + 4px)`,
            width: 44,
            height: 42,
            borderRadius: 21,
            background: armado ? corAtiva : C.caneta,
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

      <div
        style={{
          ...mono,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10.5,
          color: C.sub,
          marginTop: 5,
        }}
      >
        <span>chute</span>
        <span>certeza</span>
      </div>
    </div>
  );
}
