import { C, mono } from "../theme";
import { segmentarLinksDePagina } from "../lib/caderno/marcacao";
import TextoComMarcaTexto from "./TextoComMarcaTexto";

/**
 * Render de leitura de um bloco do Caderno: marca-texto `{{c1::}}` (via
 * TextoComMarcaTexto, já usado em notas) por cima de `[[Título]]` como link
 * clicável entre páginas. Só usado quando o bloco NÃO está sendo editado —
 * ver BlocoCaderno.tsx, que alterna para uma textarea ao focar.
 */
export default function TextoDeBloco({
  texto,
  aoAbrirLink,
}: {
  texto: string;
  aoAbrirLink?: (titulo: string) => void;
}) {
  if (!texto) return <span style={{ color: C.sub }}>Vazio — clique para escrever</span>;
  const segmentos = segmentarLinksDePagina(texto);
  return (
    <>
      {segmentos.map((s, i) =>
        s.tipo === "link" ? (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              aoAbrirLink?.(s.texto);
            }}
            style={{
              ...mono,
              display: "inline",
              fontSize: "inherit",
              fontWeight: 600,
              color: C.caneta,
              background: C.canetaSoft,
              border: "none",
              borderRadius: 4,
              padding: "0 4px",
              cursor: aoAbrirLink ? "pointer" : "default",
            }}
          >
            {s.texto}
          </button>
        ) : (
          <TextoComMarcaTexto key={i} texto={s.texto} />
        ),
      )}
    </>
  );
}
