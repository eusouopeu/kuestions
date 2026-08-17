import { useState } from "react";
import { ArrowPathIcon, ClockIcon } from "@heroicons/react/24/outline";
import Shell from "../components/Shell";
import Segmented from "../components/Segmented";
import RefazerView from "./RefazerView";
import SimuladoView from "./SimuladoView";
import { Q_POR_BLOCO } from "../lib/constants";

type View = "refazer" | "simulado";

/**
 * Aba Questões: praticar conteúdo já existente — refazer o que já foi
 * respondido, ou fazer um simulado cronometrado. Montar bloco do zero
 * (gerar com IA, sortear do banco de questões ou importar) ficou na aba
 * Blocos. As duas formas ficam num seletor no topo da própria aba, não em
 * abas separadas.
 */
export default function QuestoesTab() {
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
              id: "simulado" as View,
              label: "Simulado",
              icone: (cor) => <ClockIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />,
            },
          ]}
          onChange={setView}
        />
      </div>

      {view === "refazer" && <RefazerView />}
      {view === "simulado" && <SimuladoView />}
    </Shell>
  );
}
