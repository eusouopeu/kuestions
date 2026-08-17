import { useEffect, useState } from "react";
import { ArrowUpTrayIcon, CircleStackIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { C, cartao, disp, mono } from "../theme";
import Shell from "../components/Shell";
import Segmented from "../components/Segmented";
import GerarView from "./GerarView";
import GerarBancoView from "./GerarBancoView";
import ImportarView from "./ImportarView";
import { Q_POR_BLOCO } from "../lib/constants";
import { blocosNaSemana, resumo, type Resumo } from "../lib/repo";
import { getConfigMeta, getMetasPorMateria } from "../lib/metas";

type View = "gerar" | "banco" | "importar";

/** Resumo compacto de progresso: reforço motivacional visível ao abrir a
 * aba, sem duplicar os gráficos completos da aba Dados. */
function ProgressoGeral({ onDados }: { onDados: () => void }) {
  const [res, setRes] = useState<Resumo | null>(null);
  const [meta, setMeta] = useState<{ ativa: boolean; blocosPorSemana: number } | null>(null);
  const [naSemana, setNaSemana] = useState(0);

  useEffect(() => {
    resumo(null).then(setRes).catch(() => setRes(null));
    getConfigMeta()
      .then((m) => {
        setMeta(m);
        if (m.ativa) blocosNaSemana().then(setNaSemana).catch(() => setNaSemana(0));
      })
      .catch(() => setMeta(null));
  }, []);

  const metaAtiva = meta?.ativa ?? false;
  const semDados = !res || res.totalQuestoes === 0;
  if (semDados && !metaAtiva) return null;

  const pct = res && res.totalQuestoes ? Math.round((res.totalAcertos / res.totalQuestoes) * 100) : 0;
  const metaBatida = metaAtiva && naSemana >= (meta?.blocosPorSemana ?? 0);

  return (
    <div style={{ marginBottom: 18 }}>
      {!semDados && (
        <button
          onClick={onDados}
          style={{
            ...cartao,
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            textAlign: "left",
            padding: "12px 14px",
            marginBottom: metaAtiva ? 8 : 0,
            cursor: "pointer",
          }}
        >
          <div>
            <div style={{ ...mono, fontSize: 10, color: C.sub, letterSpacing: 0.8, marginBottom: 3 }}>
              SEU PROGRESSO
            </div>
            <div style={{ ...disp, fontSize: 13.5 }}>
              {res!.blocosAprovados}/{res!.blocosTotais} blocos aprovados · {res!.totalQuestoes} questões
            </div>
          </div>
          <div
            style={{
              ...disp,
              fontSize: 22,
              fontWeight: 800,
              color: pct >= 90 ? C.ok : C.caneta,
              flexShrink: 0,
            }}
          >
            {pct}%
          </div>
        </button>
      )}

      {metaAtiva && meta && (
        <div style={{ ...cartao, padding: "12px 14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 6,
            }}
          >
            <div style={{ ...mono, fontSize: 10, color: C.sub, letterSpacing: 0.8 }}>
              META SEMANAL
            </div>
            <div style={{ ...mono, fontSize: 11.5, color: metaBatida ? C.ok : C.sub }}>
              {naSemana}/{meta.blocosPorSemana} bloco{meta.blocosPorSemana === 1 ? "" : "s"}
              {metaBatida ? " ✓" : ""}
            </div>
          </div>
          <div style={{ height: 6, background: C.line, borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.round((naSemana / meta.blocosPorSemana) * 100))}%`,
                background: metaBatida ? C.ok : C.caneta,
                borderRadius: 3,
                transition: "width 0.25s ease",
              }}
            />
          </div>
        </div>
      )}

      <MetasPorMateria />
    </div>
  );
}

/** Progresso semanal de cada matéria com meta específica configurada (ver
 * lib/metas.ts) — independente da meta geral acima, e só aparece quando o
 * usuário configurou pelo menos uma em Ajustes. Fica recolhida por padrão
 * (só um botão-resumo): expandida, uma meta por matéria já polui bastante a
 * tela de abertura da aba; o detalhe (barra por matéria) só aparece quando
 * o usuário pede. */
function MetasPorMateria() {
  const [metas, setMetas] = useState<{ materia: string; alvo: number; naSemana: number }[] | null>(
    null,
  );
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    getMetasPorMateria()
      .then(async (mapa) => {
        const entradas = Object.entries(mapa);
        if (!entradas.length) {
          setMetas([]);
          return;
        }
        const linhas = await Promise.all(
          entradas.map(async ([materia, alvo]) => ({
            materia,
            alvo,
            naSemana: await blocosNaSemana(materia).catch(() => 0),
          })),
        );
        setMetas(linhas);
      })
      .catch(() => setMetas([]));
  }, []);

  if (!metas || metas.length === 0) return null;

  const batidas = metas.filter((m) => m.naSemana >= m.alvo).length;
  const todasBatidas = batidas === metas.length;

  return (
    <div style={{ marginBottom: 18 }}>
      <button
        onClick={() => setExpandido((v) => !v)}
        aria-expanded={expandido}
        style={{
          ...cartao,
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          textAlign: "left",
          padding: "10px 12px",
          cursor: "pointer",
        }}
      >
        <span style={{ ...mono, fontSize: 10, color: C.sub, letterSpacing: 0.8 }}>
          METAS POR MATÉRIA · {metas.length}
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

      {expandido && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {metas.map((m) => {
            const batida = m.naSemana >= m.alvo;
            return (
              <div key={m.materia} style={{ ...cartao, padding: "10px 12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 5,
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, flex: 1 }}>{m.materia}</span>
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
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Aba Blocos: montar blocos novos — gerando com IA, sorteando do banco de
 * questões reais, ou importando questões prontas. Praticar conteúdo já
 * existente (refazer, simulado) fica na aba Questões. As três formas ficam
 * num seletor no topo da própria aba, não em abas separadas.
 */
export default function BlocosTab({
  onDados,
  onAjustes,
}: {
  onDados: () => void;
  onAjustes: () => void;
}) {
  const [view, setView] = useState<View>("gerar");

  return (
    <Shell kicker={`BLOCO DE ${Q_POR_BLOCO} · MÉTODO KUMON · ÁREA FISCAL`} titulo="Blocos">
      <ProgressoGeral onDados={onDados} />

      <div style={{ marginBottom: 18 }}>
        <Segmented
          valor={view}
          opcoes={[
            {
              id: "gerar" as View,
              label: "Gerar",
              icone: (cor) => <SparklesIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />,
            },
            {
              id: "banco" as View,
              label: "Do banco",
              icone: (cor) => (
                <CircleStackIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />
              ),
            },
            {
              id: "importar" as View,
              label: "Importar",
              icone: (cor) => (
                <ArrowUpTrayIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />
              ),
            },
          ]}
          onChange={setView}
        />
      </div>

      {view === "gerar" && <GerarView onDados={onDados} onAjustes={onAjustes} />}
      {view === "banco" && <GerarBancoView onAjustes={onAjustes} />}
      {view === "importar" && <ImportarView />}
    </Shell>
  );
}
