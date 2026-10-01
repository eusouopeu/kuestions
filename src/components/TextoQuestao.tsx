import type { CSSProperties } from "react";
import { C, mono } from "../theme";
import { blocosTexto } from "../lib/blocosTexto";
import { buscarQuestaoBanco } from "../lib/banco";
import { useFonteQuestao } from "../lib/fonteQuestao";
import { normalizarLayoutTexto } from "../lib/texto";
import type { Questao } from "../lib/types";

/**
 * Figuras das provas (gráficos, diagramas, tabelas complexas recortadas do
 * PDF) — ficam em banco/imagens/ e são referenciadas no texto da questão por
 * "![descrição](arquivo)". O glob as empacota como assets do build; nada é
 * baixado de fora.
 */
const IMAGENS = import.meta.glob("../../banco/imagens/*.{png,jpg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const URL_POR_ARQUIVO = new Map(
  Object.entries(IMAGENS).map(([caminho, url]) => [caminho.slice(caminho.lastIndexOf("/") + 1), url]),
);

/** Entrelinha do parágrafo; o espaço entre parágrafos é meia linha. */
const ENTRELINHA = 1.25;

/**
 * Texto de questão (enunciado, texto de apoio, alternativa) com as regras
 * de apresentação: entrelinha 1,25 dentro do parágrafo, meia linha entre
 * parágrafos, quebras simples preservadas (itens I., II.), tabelas em grade
 * e figuras (ver lib/blocosTexto.ts).
 */
export default function TextoQuestao({
  texto,
  tamanho,
  style,
}: {
  texto: string;
  tamanho: number;
  style?: CSSProperties;
}) {
  const blocos = blocosTexto(texto);
  const espaco = `${(ENTRELINHA / 2).toFixed(3)}em`;
  return (
    <div style={{ fontSize: tamanho, lineHeight: ENTRELINHA, minWidth: 0, ...style }}>
      {blocos.map((b, i) => {
        const margem = i === blocos.length - 1 ? 0 : espaco;
        if (b.tipo === "paragrafo") {
          return (
            <p key={i} style={{ margin: `0 0 ${margem}`, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {b.texto}
            </p>
          );
        }
        if (b.tipo === "imagem") {
          const url = URL_POR_ARQUIVO.get(b.arquivo);
          return url ? (
            <img
              key={i}
              src={url}
              alt={b.descricao}
              style={{
                display: "block",
                maxWidth: "100%",
                height: "auto",
                margin: `0 0 ${margem}`,
                // Recorte do PDF tem fundo branco: no tema escuro, uma moldura
                // clara evita um retângulo "estourado" colado no texto.
                background: "#fff",
                borderRadius: 6,
                padding: 4,
              }}
            />
          ) : (
            <p key={i} style={{ ...mono, fontSize: "0.8em", color: C.erro, margin: `0 0 ${margem}` }}>
              [figura ausente: {b.arquivo}]
            </p>
          );
        }
        return (
          <div key={i} style={{ overflowX: "auto", margin: `0 0 ${margem}` }}>
            <table style={{ borderCollapse: "collapse", fontSize: "0.9em", lineHeight: 1.2 }}>
              {b.cabecalho && (
                <thead>
                  <tr>
                    {b.cabecalho.map((c, j) => (
                      <th key={j} style={celula(true)}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {b.linhas.map((l, k) => (
                  <tr key={k}>
                    {l.map((c, j) => (
                      <td key={j} style={celula(false, c)}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function celula(cabecalho: boolean, conteudo = ""): CSSProperties {
  // Valor numérico (R$ 1.234,56, -25.000, 12%) alinha à direita, como na prova.
  const numerico = /^[-−(]?\s*(R\$\s*)?[\d.,]+\)?\s*%?$/.test(conteudo);
  return {
    border: `1px solid ${C.line}`,
    padding: "4px 7px",
    textAlign: cabecalho ? "center" : numerico ? "right" : "left",
    fontWeight: cabecalho ? 600 : 400,
    background: cabecalho ? C.paper : "transparent",
    whiteSpace: numerico ? "nowrap" : "normal",
    verticalAlign: "top",
  };
}

/**
 * Enunciado de questão do banco com o texto de apoio compartilhado (grupos
 * "considere o texto a seguir para as questões X a Y") logo acima, na letra
 * escolhida pelo usuário — para telas que não usam o QuestaoCard (Simulado).
 */
export function EnunciadoComApoio({ questao, style }: { questao: Questao; style?: CSSProperties }) {
  const fonte = useFonteQuestao();
  const apoio = questao.bancoId ? buscarQuestaoBanco(questao.bancoId)?.texto_apoio : undefined;
  return (
    <div style={style}>
      {apoio && (
        <TextoQuestao
          texto={normalizarLayoutTexto(apoio)}
          tamanho={fonte}
          style={{ margin: `0 0 ${(ENTRELINHA / 2).toFixed(3)}em` }}
        />
      )}
      <TextoQuestao texto={normalizarLayoutTexto(questao.enunciado)} tamanho={fonte} />
    </div>
  );
}
