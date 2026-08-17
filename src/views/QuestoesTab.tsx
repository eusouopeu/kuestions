import { useState } from "react";
import { ArrowPathIcon, CircleStackIcon, ClockIcon } from "@heroicons/react/24/outline";
import Shell from "../components/Shell";
import Segmented from "../components/Segmented";
import GerarBancoView from "./GerarBancoView";
import RefazerView from "./RefazerView";
import SimuladoView from "./SimuladoView";
import { Q_POR_BLOCO } from "../lib/constants";

type View = "banco" | "refazer" | "simulado";

/**
 * Aba Questões: praticar conteúdo já existente — refazer o que já foi
 * respondido, montar bloco do banco de questões reais, ou fazer um simulado
 * cronometrado. Montar bloco do zero (gerar com IA ou importar) ficou na aba
 * Blocos. As três formas ficam num seletor no topo da própria aba, não em
 * abas separadas.
 */
export default function QuestoesTab({ onAjustes }: { onAjustes: () => void }) {
  const [view, setView] = useState<View>("refazer");

  return (
    <Shell kicker={`BLOCO DE ${Q_POR_BLOCO} · MÉTODO KUMON · ÁREA FISCAL`} titulo="Questões">
      <div style={{ marginBottom: 18 }}>
        <Segmented
          valor={view}
          opcoes={[
            {
              id: "refazer" as View,
              label: "Refazer",
              icone: (cor) => <ArrowPathIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />,
            },
            {
              id: "banco" as View,
              label: "Do banco",
              icone: (cor) => (
                <CircleStackIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />
              ),
            },
            {
              id: "simulado" as View,
              label: "Simulado",
              icone: (cor) => <ClockIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />,
            },
          ]}
          onChange={setView}
        />
      </div>

      {view === "refazer" && <RefazerView />}
      {view === "banco" && <GerarBancoView onAjustes={onAjustes} />}
      {view === "simulado" && <SimuladoView />}
    </Shell>
  );
}
