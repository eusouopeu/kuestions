import { useEffect, useRef, useState } from "react";
import { ArrowPathIcon, PauseIcon, PlayIcon } from "@heroicons/react/24/outline";
import { C, disp, mono } from "../theme";

const K_RESTANTE = "cronometro-restante-s";
const K_DURACAO = "cronometro-duracao-s";
const PADRAO_S = 25 * 60;

function lerNumero(chave: string, padrao: number): number {
  const v = Number(localStorage.getItem(chave));
  return Number.isFinite(v) && v > 0 ? v : padrao;
}

function formatar(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/**
 * Timer pomodoro do rail lateral (layout largo) — item do design de
 * referência sem equivalente anterior no app. Estado persiste em
 * localStorage (não @capacitor/preferences: é efêmero por sessão de estudo,
 * não uma preferência) para sobreviver a um recarregamento acidental sem
 * perder a contagem.
 */
export default function Cronometro() {
  const [duracao] = useState(() => lerNumero(K_DURACAO, PADRAO_S));
  const [restante, setRestante] = useState(() => lerNumero(K_RESTANTE, PADRAO_S));
  const [rodando, setRodando] = useState(false);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    localStorage.setItem(K_RESTANTE, String(restante));
  }, [restante]);

  useEffect(() => {
    if (!rodando) return;
    intervalo.current = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          setRodando(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalo.current) clearInterval(intervalo.current);
    };
  }, [rodando]);

  function alternar() {
    if (restante <= 0) setRestante(duracao);
    setRodando((r) => !r);
  }

  function reiniciar() {
    setRodando(false);
    setRestante(duracao);
  }

  return (
    <div style={{ padding: "14px 12px", textAlign: "center" }}>
      <div style={{ ...disp, fontSize: 20, fontWeight: 700, color: C.ink, letterSpacing: 0.5 }}>
        {formatar(restante)}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10 }}>
        <button
          onClick={alternar}
          aria-label={rodando ? "Pausar" : "Iniciar"}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: `1.5px solid ${C.line}`,
            background: rodando ? C.canetaSoft : C.caneta,
            color: rodando ? C.caneta : "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {rodando ? <PauseIcon width={15} height={15} /> : <PlayIcon width={15} height={15} />}
        </button>
        <button
          onClick={reiniciar}
          aria-label="Reiniciar"
          style={{
            ...mono,
            width: 30,
            height: 30,
            borderRadius: 8,
            border: `1.5px solid ${C.line}`,
            background: "transparent",
            color: C.sub,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowPathIcon width={14} height={14} />
        </button>
      </div>
    </div>
  );
}
