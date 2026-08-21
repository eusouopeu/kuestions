import { segmentarMarcaTexto, type CorMarcaTexto } from "../lib/texto";

/** Cor de fundo/texto de cada marca-texto — literais (não `C.*`) porque um
 * marcador amarelo/laranja precisa continuar reconhecível tanto no tema claro
 * quanto no escuro, ao contrário do resto da paleta. */
export const COR_FUNDO_MARCA_TEXTO: Record<CorMarcaTexto, string> = {
  amarelo: "#FFE58A",
  laranja: "#FFB870",
};
export const COR_TEXTO_MARCA_TEXTO: Record<CorMarcaTexto, string> = {
  amarelo: "#1c1c1c",
  laranja: "#1c1c1c",
};

/**
 * Renderiza o corpo de uma nota com os trechos marcados (`{{c1::…}}`/
 * `{{c2::…}}`, ver texto.ts) como marca-texto de verdade, em vez da sintaxe
 * crua do Anki — usado tanto na prévia de CampoCorpoNota (editando) quanto na
 * visualização normal de uma nota (NotaCard).
 */
export default function TextoComMarcaTexto({
  texto,
  ocultar = false,
}: {
  texto: string;
  /** Esconde o conteúdo marcado atrás de uma tarja, preservando a largura
   * aproximada do trecho — é a "frente" do flashcard cloze na revisão dentro
   * do app (ver RevisaoNotas), o mesmo comportamento do Anki. */
  ocultar?: boolean;
}) {
  const segmentos = segmentarMarcaTexto(texto);
  return (
    <>
      {segmentos.map((s, i) =>
        s.cor ? (
          <mark
            key={i}
            style={{
              background: COR_FUNDO_MARCA_TEXTO[s.cor],
              color: ocultar ? "transparent" : COR_TEXTO_MARCA_TEXTO[s.cor],
              borderRadius: 3,
              padding: "0 2px",
              ...(ocultar
                ? { userSelect: "none" as const, textShadow: "none" }
                : {}),
            }}
          >
            {ocultar ? "•".repeat(Math.max(3, Math.min(s.texto.length, 40))) : s.texto}
          </mark>
        ) : (
          <span key={i}>{s.texto}</span>
        ),
      )}
    </>
  );
}
