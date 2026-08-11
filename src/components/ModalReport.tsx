import { useState } from "react";
import { C, cartao, mono } from "../theme";
import Botao from "./Botao";
import { MOTIVOS_REPORT, type MotivoReport } from "../lib/repo";

/**
 * Categoriza o motivo do report em vez de um "reportada=1" genérico — a
 * curadoria futura do banco de questões geradas por IA parte direto da causa
 * mais provável (ver migração v5 em lib/db.ts).
 */
export default function ModalReport({
  onCancelar,
  onConfirmar,
}: {
  onCancelar: () => void;
  onConfirmar: (motivo: MotivoReport) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState<MotivoReport | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    if (!motivo || enviando) return;
    setEnviando(true);
    await onConfirmar(motivo);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,39,51,.45)",
        zIndex: 300,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onCancelar}
    >
      <div
        style={{
          ...cartao,
          width: "100%",
          maxWidth: 620,
          borderRadius: "16px 16px 0 0",
          padding: "20px 18px calc(20px + env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8, marginBottom: 14 }}>
          O QUE ESTÁ ERRADO NESTA QUESTÃO?
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {MOTIVOS_REPORT.map((m) => {
            const ativo = motivo === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMotivo(m.id)}
                aria-pressed={ativo}
                style={{
                  ...mono,
                  textAlign: "left",
                  fontSize: 13.5,
                  padding: "12px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: `1.5px solid ${ativo ? C.erro : C.line}`,
                  background: ativo ? C.erroSoft : "transparent",
                  color: ativo ? C.erro : C.ink,
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Botao tipo="fantasma" onClick={onCancelar} disabled={enviando} style={{ flex: 1 }}>
            Cancelar
          </Botao>
          <Botao
            onClick={confirmar}
            disabled={!motivo || enviando}
            style={{ flex: 1, background: C.erro, borderColor: C.erro }}
          >
            {enviando ? "Enviando…" : "Reportar"}
          </Botao>
        </div>
      </div>
    </div>
  );
}
