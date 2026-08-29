/**
 * Detecção de plataforma e de largura de tela.
 *
 * O layout largo (rail lateral + pílula de navegação no topo, em vez da tab
 * bar de celular) é decidido pela LARGURA, não pela plataforma: assim ele
 * aparece no `npm run dev` do navegador e num tablet em paisagem, e dá para
 * testá-lo sem compilar o Tauri. `isDesktop()` existe à parte porque algumas
 * decisões (tamanho de janela, caminho de filesystem) dependem do runtime e
 * não do tamanho da janela.
 */
import { useEffect, useState } from "react";

/** Roda dentro do app Tauri (desktop), e não no navegador nem no WebView. */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Abaixo disto o app usa o layout de celular, inalterado. */
const LARGURA_MINIMA = 900;

const CONSULTA = `(min-width: ${LARGURA_MINIMA}px)`;

/** Leitura síncrona, para o primeiro render já sair no layout certo. */
function larguraAtual(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(CONSULTA).matches;
}

export function useLayoutLargo(): boolean {
  const [largo, setLargo] = useState(larguraAtual);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(CONSULTA);
    const aoMudar = (e: MediaQueryListEvent) => setLargo(e.matches);
    mq.addEventListener("change", aoMudar);
    // A janela pode ter sido redimensionada entre o primeiro render e este
    // efeito (redimensionamento do Tauri no boot, rotação de tablet).
    setLargo(mq.matches);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  return largo;
}
