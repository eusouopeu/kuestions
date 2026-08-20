import { useState } from "react";
import { ArrowPathIcon, ClockIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import Shell from "../components/Shell";
import Segmented from "../components/Segmented";
import RefazerView from "./RefazerView";
import BlocosAnterioresView from "./BlocosAnterioresView";
import SimuladoView from "./SimuladoView";

type View = "refazer" | "simulado" | "blocos-anteriores";

/**
 * Aba Questões: praticar conteúdo já existente — refazer o que já foi
 * respondido, reabrir blocos anteriores inteiros, ou fazer um simulado
 * cronometrado. Montar bloco do zero (gerar com IA, sortear do banco de
 * questões ou importar) ficou na aba Blocos. As três formas ficam num
 * seletor no topo da própria aba, não em abas separadas.
 */
export default function QuestoesTab() {
  const [view, setView] = useState<View>("refazer");

  return (
    <Shell titulo="Questões">
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
            {
              id: "blocos-anteriores" as View,
              label: "Blocos anteriores",
              icone: (cor) => <RectangleStackIcon width={16} height={16} stroke={cor} strokeWidth={1.8} />,
            },
          ]}
          onChange={setView}
        />
      </div>

      {view === "refazer" && <RefazerView />}
      {view === "simulado" && <SimuladoView />}
      {view === "blocos-anteriores" && <BlocosAnterioresView />}
    </Shell>
  );
}
