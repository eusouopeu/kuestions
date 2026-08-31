import type { ReactNode } from "react";
import { C, disp, TAB_BAR_H } from "../theme";
import BuscaGlobal from "./BuscaGlobal";
import BotaoTema from "./BotaoTema";
import BotaoTamanhoTexto from "./BotaoTamanhoTexto";
import { useLayoutLargo } from "../lib/plataforma";

/** Cabeçalho + coluna centrada, 620px no celular / 980px no layout largo
 * (desktop, ver useLayoutLargo). A lupa de busca global (ver BuscaGlobal.tsx)
 * fica aqui, não numa aba específica — busca em notas e questões já
 * respondidas é útil de qualquer tela do app, e antes só existia dentro da
 * aba Notas. No layout largo a busca já vive no rail lateral (RailLateral),
 * então não duplica aqui. */
export default function Shell({
  titulo,
  children,
}: {
  titulo: ReactNode;
  children: ReactNode;
}) {
  const largo = useLayoutLargo();
  return (
    <div
      style={{
        maxWidth: largo ? 980 : 620,
        margin: "0 auto",
        padding: largo ? `56px 24px ${TAB_BAR_H}px` : `0 16px ${TAB_BAR_H + 28}px`,
      }}
    >
      <header
        style={{
          padding: "22px 0 6px",
          borderBottom: `1.5px solid ${C.ink}`,
          marginBottom: 18,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <h1
          style={{
            ...disp,
            fontSize: 26,
            fontWeight: 800,
            margin: "0 0 10px",
            letterSpacing: -0.5,
          }}
        >
          {titulo}
        </h1>
        {!largo && (
          <div style={{ marginTop: 2, flexShrink: 0, display: "flex", gap: 4 }}>
            <BuscaGlobal />
            <BotaoTema />
            <BotaoTamanhoTexto />
          </div>
        )}
      </header>
      {children}
    </div>
  );
}

/** Estado vazio padrão. */
export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "44px 20px",
        color: C.sub,
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}
