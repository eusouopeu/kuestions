import { useRef } from "react";
import { C, campo, rotulo } from "../theme";
import { aplicarMarcaTexto, segmentarMarcaTexto, type CorMarcaTexto } from "../lib/texto";

/** Cor de fundo/texto de cada marca-texto — literais (não `C.*`) porque um
 * marcador amarelo/laranja precisa continuar reconhecível tanto no tema claro
 * quanto no escuro, ao contrário do resto da paleta. */
const COR_FUNDO: Record<CorMarcaTexto, string> = { amarelo: "#FFE58A", laranja: "#FFB870" };
const COR_TEXTO: Record<CorMarcaTexto, string> = { amarelo: "#1c1c1c", laranja: "#1c1c1c" };

/**
 * Campo "Corpo" da nota com dois botões de marca-texto (amarelo → cloze 1,
 * laranja → cloze 2, ver aplicarMarcaTexto em lib/texto.ts) e uma prévia
 * abaixo do textarea mostrando os trechos marcados coloridos, em vez da
 * sintaxe crua `{{c1::…}}` do Anki. Marcar exige selecionar o trecho no
 * textarea nativo (seleção lida via `selectionStart`/`selectionEnd`) antes de
 * tocar no botão — não há edição rica, é texto puro com marcadores embutidos.
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

  const segmentos = segmentarMarcaTexto(valor);
  const temMarcacao = segmentos.some((s) => s.cor);

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
              background: COR_FUNDO.amarelo,
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
              background: COR_FUNDO.laranja,
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

      <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>
        Selecione um trecho acima e toque num marca-texto para virar cloze na exportação para
        flashcards. Um "=" na linha vira frente/verso; uma lista numerada vira cloze automático.
      </div>

      {temMarcacao && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 12px",
            borderRadius: 8,
            border: `1.5px dashed ${C.line}`,
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {segmentos.map((s, i) =>
            s.cor ? (
              <mark
                key={i}
                style={{
                  background: COR_FUNDO[s.cor],
                  color: COR_TEXTO[s.cor],
                  borderRadius: 3,
                  padding: "0 2px",
                }}
              >
                {s.texto}
              </mark>
            ) : (
              <span key={i}>{s.texto}</span>
            ),
          )}
        </div>
      )}
    </div>
  );
}
