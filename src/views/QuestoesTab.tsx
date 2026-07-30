import { useState } from "react";
import Shell from "../components/Shell";
import Segmented from "../components/Segmented";
import GerarView from "./GerarView";
import RefazerView from "./RefazerView";
import ImportarView from "./ImportarView";
import { Q_POR_BLOCO } from "../lib/constants";

type View = "gerar" | "importar" | "refazer";

/**
 * Aba Questões. As três views ficam num seletor no topo da própria aba — não
 * são abas separadas, conforme a especificação.
 */
export default function QuestoesTab({ onDados }: { onDados: () => void }) {
  const [view, setView] = useState<View>("gerar");

  return (
    <Shell
      kicker={`BLOCO DE ${Q_POR_BLOCO} · MÉTODO KUMON · ÁREA FISCAL`}
      titulo="Questões"
    >
      <div style={{ marginBottom: 18 }}>
        <Segmented
          valor={view}
          opcoes={[
            { id: "gerar" as View, label: "Gerar" },
            { id: "importar" as View, label: "Importar" },
            { id: "refazer" as View, label: "Refazer erradas" },
          ]}
          onChange={setView}
        />
      </div>

      {view === "gerar" && <GerarView onDados={onDados} />}
      {view === "importar" && <ImportarView />}
      {view === "refazer" && <RefazerView />}
    </Shell>
  );
}
