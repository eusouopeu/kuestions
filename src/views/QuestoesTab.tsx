import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CircleStackIcon,
  ClockIcon,
  RectangleStackIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { C, cartao, mono } from "../theme";
import Shell from "../components/Shell";
import Segmented from "../components/Segmented";
import GerarView from "./GerarView";
import GerarBancoView from "./GerarBancoView";
import ImportarView from "./ImportarView";
import RefazerView from "./RefazerView";
import SimuladoView from "./SimuladoView";
import BlocosAnterioresView from "./BlocosAnterioresView";
import { blocosNaSemana } from "../lib/repo";
import { getMetas, META_GERAL, rotuloMeta } from "../lib/metas";
import { temCredencial } from "../lib/secure";
import { escolherViewInicial, type ViewQuestoes } from "../lib/questoesInicial";

/**
 * Progresso das metas semanais configuradas em Ajustes (ver lib/metas.ts) —
 * a meta geral ("Todas as matérias") e as por matéria vêm do MESMO mapa, e
 * por isso aparecem na mesma lista, com a geral no topo. Some inteira quando
 * não há nenhuma meta configurada.
 *
 * Recolhida por padrão quando há mais de uma: expandida, uma barra por meta
 * já domina a tela de abertura da aba.
 */
function MetasSemanais() {
  const [metas, setMetas] = useState<{ chave: string; alvo: number; naSemana: number }[] | null>(
    null,
  );
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    getMetas()
      .then(async (mapa) => {
        const entradas = Object.entries(mapa).sort(([a], [b]) =>
          a === META_GERAL ? -1 : b === META_GERAL ? 1 : a.localeCompare(b, "pt-BR"),
        );
        setMetas(
          await Promise.all(
            entradas.map(async ([chave, alvo]) => ({
              chave,
              alvo,
              naSemana: await blocosNaSemana(chave === META_GERAL ? null : chave).catch(() => 0),
            })),
          ),
        );
      })
      .catch(() => setMetas([]));
  }, []);

  if (!metas || metas.length === 0) return null;

  const batidas = metas.filter((m) => m.naSemana >= m.alvo).length;
  const todasBatidas = batidas === metas.length;
  const aberto = expandido || metas.length === 1;

  const barra = (m: { chave: string; alvo: number; naSemana: number }) => {
    const batida = m.naSemana >= m.alvo;
    return (
      <div key={m.chave} style={{ padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 5,
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, flex: 1 }}>{rotuloMeta(m.chave)}</span>
          <span style={{ ...mono, fontSize: 11, color: batida ? C.ok : C.sub, flexShrink: 0 }}>
            {m.naSemana}/{m.alvo} bloco{m.alvo === 1 ? "" : "s"}
            {batida ? " ✓" : ""}
          </span>
        </div>
        <div style={{ height: 5, background: C.line, borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, Math.round((m.naSemana / m.alvo) * 100))}%`,
              background: batida ? C.ok : C.caneta,
              borderRadius: 3,
              transition: "width 0.25s ease",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ ...cartao, padding: "10px 12px", marginTop: 8, marginBottom: 18 }}>
      {metas.length > 1 ? (
        <button
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            textAlign: "left",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <span style={{ ...mono, fontSize: 10, color: C.sub, letterSpacing: 0.8 }}>
            METAS SEMANAIS · {metas.length}
          </span>
          <span
            style={{
              ...mono,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: todasBatidas ? C.ok : C.sub,
              flexShrink: 0,
            }}
          >
            {batidas}/{metas.length} batida{metas.length === 1 ? "" : "s"}
            {todasBatidas ? " ✓" : ""}
            <span style={{ fontSize: 9 }}>{expandido ? "▲" : "▼"}</span>
          </span>
        </button>
      ) : (
        <span style={{ ...mono, fontSize: 10, color: C.sub, letterSpacing: 0.8 }}>
          METAS SEMANAIS
        </span>
      )}

      {aberto && <div style={{ marginTop: 8 }}>{metas.map(barra)}</div>}
    </div>
  );
}

/**
 * Aba Questões, unificada (ex-Blocos + ex-Questões, ver spec
 * docs/superpowers/specs/2026-08-30-navegacao-unificada-design.md): monta
 * bloco novo (Gerar/Do banco/Importar) e pratica o que já existe
 * (Refazer/Simulado/Blocos anteriores) num único seletor de 6 opções,
 * ícone-apenas — cabe numa pílula só sem estourar largura no mobile.
 */
export default function QuestoesTab({
  onDados,
  onAjustes,
}: {
  onDados: () => void;
  onAjustes: () => void;
}) {
  const [view, setView] = useState<ViewQuestoes>("gerar");

  useEffect(() => {
    temCredencial()
      .then((tem) => setView(escolherViewInicial(tem)))
      .catch(() => {});
  }, []);

  return (
    <Shell titulo="Questões">
      <MetasSemanais />

      <div style={{ marginBottom: 18 }}>
        <Segmented
          valor={view}
          iconeApenas
          opcoes={[
            {
              id: "gerar",
              label: "Gerar",
              icone: (cor) => <SparklesIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />,
            },
            {
              id: "banco",
              label: "Do banco",
              icone: (cor) => (
                <CircleStackIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />
              ),
            },
            {
              id: "importar",
              label: "Importar",
              icone: (cor) => (
                <ArrowUpTrayIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />
              ),
            },
            {
              id: "refazer",
              label: "Refazer",
              icone: (cor) => <ArrowPathIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />,
            },
            {
              id: "simulado",
              label: "Simulado",
              icone: (cor) => <ClockIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />,
            },
            {
              id: "blocos-anteriores",
              label: "Blocos anteriores",
              icone: (cor) => (
                <RectangleStackIcon width={18} height={18} stroke={cor} strokeWidth={1.8} />
              ),
            },
          ]}
          onChange={setView}
        />
      </div>

      {view === "gerar" && <GerarView onDados={onDados} onAjustes={onAjustes} />}
      {view === "banco" && <GerarBancoView />}
      {view === "importar" && <ImportarView />}
      {view === "refazer" && <RefazerView />}
      {view === "simulado" && <SimuladoView />}
      {view === "blocos-anteriores" && <BlocosAnterioresView />}
    </Shell>
  );
}
