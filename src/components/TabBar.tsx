import {
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { C, mono } from "../theme";
import { TAB_BAR_H } from "../theme";

export type Aba = "questoes" | "notas" | "dados" | "ajustes";

/** Tab bar nativa própria, sem biblioteca de UI (além dos ícones, do HeroIcons). */
const ABAS: { id: Aba; label: string; icone: (cor: string) => JSX.Element }[] = [
  {
    id: "questoes",
    label: "Questões",
    icone: (cor) => <DocumentTextIcon width={22} height={22} stroke={cor} strokeWidth={1.8} />,
  },
  {
    id: "notas",
    label: "Notas",
    icone: (cor) => <FolderIcon width={22} height={22} stroke={cor} strokeWidth={1.8} />,
  },
  {
    id: "dados",
    label: "Dados",
    icone: (cor) => <ChartBarIcon width={22} height={22} stroke={cor} strokeWidth={1.8} />,
  },
  {
    id: "ajustes",
    label: "Ajustes",
    icone: (cor) => <Cog6ToothIcon width={22} height={22} stroke={cor} strokeWidth={1.8} />,
  },
];

export default function TabBar({
  aba,
  onChange,
}: {
  aba: Aba;
  onChange: (a: Aba) => void;
}) {
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: TAB_BAR_H,
        // Respeita a home bar do iPhone e a barra de gestos do Android.
        paddingBottom: "env(safe-area-inset-bottom)",
        background: C.card,
        borderTop: `1.5px solid ${C.line}`,
        display: "flex",
        zIndex: 50,
      }}
    >
      {ABAS.map((a) => {
        const ativo = a.id === aba;
        const cor = ativo ? C.caneta : C.sub;
        return (
          <button
            key={a.id}
            onClick={() => onChange(a.id)}
            aria-current={ativo ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {a.icone(cor)}
            <span style={{ ...mono, fontSize: 10, color: cor, fontWeight: ativo ? 600 : 400 }}>
              {a.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
