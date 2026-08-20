import { useRef } from "react";
import { C, campo, rotulo } from "../theme";
import { aplicarMarcaTexto, type CorMarcaTexto } from "../lib/texto";
import { COR_FUNDO_MARCA_TEXTO } from "./TextoComMarcaTexto";

/**
 * Campo "Corpo" da nota com dois botões de marca-texto (amarelo → cloze 1,
 * laranja → cloze 2, ver aplicarMarcaTexto em lib/texto.ts). Marcar exige
 * selecionar o trecho no textarea nativo (seleção lida via
 * `selectionStart`/`selectionEnd`) antes de tocar no botão — não há edição
 * rica, é texto puro com marcadores embutidos.
 */
export default function CampoCorpoNota({
  valor,
  onChange,
  minHeight = 130,
}: {
  valor: string;
  onChange: (v: string) => void;
  minHeight?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function marcar(cor: CorMarcaTexto) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    if (selectionStart == null || selectionEnd == null || selectionStart === selectionEnd) return;
    onChange(aplicarMarcaTexto(valor, selectionStart, selectionEnd, cor));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ ...rotulo, marginBottom: 0 }}>Corpo</label>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => marcar("amarelo")}
            title="Marca-texto amarelo — vira cloze 1 no Anki"
            aria-label="Marca-texto amarelo"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: `1.5px solid ${C.line}`,
              background: COR_FUNDO_MARCA_TEXTO.amarelo,
              cursor: "pointer",
            }}
          />
          <button
            type="button"
            onClick={() => marcar("laranja")}
            title="Marca-texto laranja — vira cloze 2 no Anki"
            aria-label="Marca-texto laranja"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: `1.5px solid ${C.line}`,
              background: COR_FUNDO_MARCA_TEXTO.laranja,
              cursor: "pointer",
            }}
          />
        </div>
      </div>

      <textarea
        ref={ref}
        style={{ ...campo, minHeight, resize: "vertical", lineHeight: 1.5 }}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
