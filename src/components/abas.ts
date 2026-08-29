import {
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  FolderIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { createElement, type ReactNode } from "react";

export type Aba = "blocos" | "questoes" | "notas" | "dados" | "ajustes";

export interface DefinicaoAba {
  id: Aba;
  label: string;
  icone: (cor: string, tamanho?: number) => ReactNode;
}

/**
 * Fonte única das abas, compartilhada pela tab bar de celular (TabBar.tsx) e
 * pela pílula flutuante do layout largo (NavPill.tsx) — antes o array vivia
 * dentro de TabBar e a pílula teria que duplicá-lo.
 *
 * `createElement` em vez de JSX porque este arquivo é `.ts` (não tem
 * componente nenhum, só dados).
 */
export const ABAS: DefinicaoAba[] = [
  {
    id: "blocos",
    label: "Blocos",
    icone: (cor, t = 22) =>
      createElement(RectangleStackIcon, { width: t, height: t, stroke: cor, strokeWidth: 1.8 }),
  },
  {
    id: "questoes",
    label: "Questões",
    icone: (cor, t = 22) =>
      createElement(DocumentTextIcon, { width: t, height: t, stroke: cor, strokeWidth: 1.8 }),
  },
  {
    id: "notas",
    label: "Notas",
    icone: (cor, t = 22) =>
      createElement(FolderIcon, { width: t, height: t, stroke: cor, strokeWidth: 1.8 }),
  },
  {
    id: "dados",
    label: "Dados",
    icone: (cor, t = 22) =>
      createElement(ChartBarIcon, { width: t, height: t, stroke: cor, strokeWidth: 1.8 }),
  },
  {
    id: "ajustes",
    label: "Ajustes",
    icone: (cor, t = 22) =>
      createElement(Cog6ToothIcon, { width: t, height: t, stroke: cor, strokeWidth: 1.8 }),
  },
];
