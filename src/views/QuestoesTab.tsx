import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CircleStackIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { C, cartao, disp, mono } from "../theme";
import Shell from "../components/Shell";
import Segmented from "../components/Segmented";
import GerarView from "./GerarView";
import GerarBancoView from "./GerarBancoView";
import RefazerView from "./RefazerView";
import ImportarView from "./ImportarView";
import { Q_POR_BLOCO } from "../lib/constants";
import { resumo, type Resumo } from "../lib/repo";

type View = "gerar" | "banco" | "importar" | "refazer";

/** Resumo compacto de progresso: reforço motivacional visível ao abrir a
 * aba, sem duplicar os gráficos completos da aba Dados. */
function ProgressoGeral({ onDados }: { onDados: () => void }) {
  const [res, setRes] = useState<Resumo | null>(null);

  useEffect(() => {
    resumo(null).then(setRes).catch(() => setRes(null));
  }, []);

  if (!res || res.totalQuestoes === 0) return null;

  const pct = Math.round((res.totalAcertos / res.totalQuestoes) * 100);

  return (
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
        marginBottom: 18,
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ ...mono, fontSize: 10, color: C.sub, letterSpacing: 0.8, marginBottom: 3 }}>
          SEU PROGRESSO
        </div>
        <div style={{ ...disp, fontSize: 13.5 }}>
          {res.blocosAprovados}/{res.blocosTotais} blocos aprovados · {res.totalQuestoes} questões
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
  );
}

/**
 * Aba Questões. As quatro views ficam num seletor no topo da própria aba —
 * não são abas separadas, conforme a especificação.
 */
export default function QuestoesTab({
  onDados,
  onAjustes,
}: {
  onDados: () => void;
  onAjustes: () => void;
}) {
  const [view, setView] = useState<View>("gerar");

  return (
    <Shell
      kicker={`BLOCO DE ${Q_POR_BLOCO} · MÉTODO KUMON · ÁREA FISCAL`}
      titulo="Questões"
    >
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
            {
              id: "refazer" as View,
              label: "Refazer erradas",
              icone: (cor) => <ArrowPathIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />,
            },
          ]}
          onChange={setView}
        />
      </div>

      {view === "gerar" && <GerarView onDados={onDados} onAjustes={onAjustes} />}
      {view === "banco" && <GerarBancoView onAjustes={onAjustes} />}
      {view === "importar" && <ImportarView />}
      {view === "refazer" && <RefazerView />}
    </Shell>
  );
}
