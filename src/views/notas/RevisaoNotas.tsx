import { useEffect, useState } from "react";
import { C, cartao, mono } from "../../theme";
import Botao from "../../components/Botao";
import { Vazio } from "../../components/Shell";
import TextoComMarcaTexto from "../../components/TextoComMarcaTexto";
import { listarNotasPendentes, registrarRevisaoNota } from "../../lib/repo";
import { paraFlashcard } from "../../lib/flashcards";
import type { ConceitoSalvo } from "../../lib/types";

/**
 * Revisão ativa das notas por repetição espaçada (mesmas caixas de Leitner de
 * "Refazer erradas" — ver registrarRevisaoNota em repo.ts), para revisar
 * dentro do app sem depender do Anki.
 *
 * A frente e o verso do cartão saem da MESMA classificação usada na
 * exportação (`paraFlashcard` em lib/flashcards.ts), e não mais do corpo
 * inteiro escondido atrás de um botão: uma nota "termo = definição" abre
 * mostrando só o termo, e uma nota com marca-texto abre com os trechos
 * marcados tarjados — que é o que o usuário vê depois no Anki. Antes, os dois
 * modelos eram ignorados aqui (a frente era só matéria + tags), então revisar
 * no app não treinava a mesma recuperação que o cartão exportado.
 */
export default function RevisaoNotas({
  materia,
  onSair,
}: {
  materia: string | null;
  onSair: () => void;
}) {
  const [fila, setFila] = useState<ConceitoSalvo[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [lembradas, setLembradas] = useState(0);
  const [avaliando, setAvaliando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarNotasPendentes(materia, { limite: 100 })
      .then((qs) => {
        if (!qs.length) {
          setErro("Nenhuma nota pendente de revisão neste filtro.");
          return;
        }
        setFila(qs);
      })
      .catch(() => setErro("Falha ao carregar as notas."));
  }, [materia]);

  if (erro) {
    return (
      <div>
        <Vazio>{erro}</Vazio>
        <Botao tipo="fantasma" onClick={onSair} style={{ marginTop: 12 }}>
          Voltar
        </Botao>
      </div>
    );
  }
  if (!fila) return <Vazio>Carregando…</Vazio>;

  const nota = fila[idx];
  const ultima = idx === fila.length - 1;
  const cartaoFlash = paraFlashcard(nota);

  async function avaliar(lembrou: boolean) {
    if (avaliando) return;
    setAvaliando(true);
    try {
      await registrarRevisaoNota(nota.id, lembrou);
      if (lembrou) setLembradas((n) => n + 1);
    } catch (e) {
      console.error("registrar revisão de nota", e);
    } finally {
      setAvaliando(false);
    }
    if (ultima) {
      onSair();
      return;
    }
    setRevelado(false);
    setIdx((i) => i + 1);
  }

  const estiloTexto = {
    fontSize: 14.5,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
    margin: "12px 0 0",
  };

  return (
    <div>
      <div style={{ ...mono, fontSize: 12, color: C.sub, textAlign: "center", marginBottom: 14 }}>
        Revisão {idx + 1}/{fila.length} · {materia ?? "todas as matérias"}
      </div>

      <div style={{ ...cartao, minHeight: 180, display: "flex", flexDirection: "column" }}>
        <div style={{ ...mono, fontSize: 10.5, color: C.sub, letterSpacing: 0.8 }}>
          {nota.materia.toUpperCase()}
          {nota.tags.length ? ` · ${nota.tags.join(" · ")}` : ""}
          {` · ${cartaoFlash.tipo === "cloze" ? "CLOZE" : "FRENTE/VERSO"}`}
        </div>

        {cartaoFlash.tipo === "cloze" ? (
          // Cloze: o mesmo texto nas duas faces — tarjado antes de revelar,
          // com o marca-texto normal depois.
          <p key={revelado ? "revelado" : "oculto"} style={estiloTexto}>
            <TextoComMarcaTexto texto={cartaoFlash.texto} ocultar={!revelado} />
          </p>
        ) : (
          <>
            <p style={estiloTexto}>
              <TextoComMarcaTexto texto={cartaoFlash.frente} />
            </p>
            {revelado && (
              <p
                style={{
                  ...estiloTexto,
                  paddingTop: 12,
                  borderTop: `1.5px dashed ${C.line}`,
                }}
              >
                {cartaoFlash.verso ? (
                  <TextoComMarcaTexto texto={cartaoFlash.verso} />
                ) : (
                  <span style={{ color: C.sub }}>
                    Esta nota não tem verso — para virar pergunta/resposta, edite-a e separe os
                    dois lados com "=", ou marque o trecho a esconder com o marca-texto.
                  </span>
                )}
              </p>
            )}
          </>
        )}
      </div>

      {!revelado ? (
        <Botao onClick={() => setRevelado(true)} style={{ marginTop: 16 }}>
          {cartaoFlash.tipo === "cloze" ? "Revelar" : "Mostrar resposta"}
        </Botao>
      ) : (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Botao
            tipo="fantasma"
            onClick={() => avaliar(false)}
            disabled={avaliando}
            style={{ flex: 1, color: C.erro }}
          >
            Não lembrei
          </Botao>
          <Botao onClick={() => avaliar(true)} disabled={avaliando} style={{ flex: 1 }}>
            Lembrei
          </Botao>
        </div>
      )}

      <button
        onClick={onSair}
        style={{
          ...mono,
          marginTop: 18,
          fontSize: 12,
          background: "none",
          border: "none",
          color: C.sub,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Sair da revisão{lembradas ? ` (${lembradas} lembrada${lembradas > 1 ? "s" : ""})` : ""}
      </button>
    </div>
  );
}
