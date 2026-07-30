import { useEffect, useRef, useState } from "react";
import { C, cartao, disp, mono } from "../theme";
import Botao from "./Botao";
import Chip from "./Chip";
import Opcao, { type Reveal } from "./Opcao";
import SelecaoNota from "./SelecaoNota";
import type { Questao } from "../lib/types";
import { labelTipo } from "../lib/constants";

const LETRAS = ["A", "B", "C", "D", "E"];

/**
 * Uma questão: enunciado, alternativas com toque/arrasto, revelação com
 * comentário do gabarito e explicação de CADA alternativa errada.
 *
 * Salvar nota: o usuário seleciona qualquer trecho de texto do card (o
 * enunciado, o comentário, as explicações) e um botão flutuante oferece
 * "+ Salvar nota" — ver SelecaoNota. Os chips de conceito abaixo são só
 * informativos agora; a ação de salvar migrou para a seleção de texto.
 *
 * O componente não decide o que vem depois — quem sequencia é a view.
 */
export default function QuestaoCard({
  questao,
  materia,
  tagAssunto,
  questaoOrigemId,
  cabecalho,
  labelProxima,
  onResponder,
  onProxima,
}: {
  questao: Questao;
  materia: string;
  /** Assunto do bloco de origem, já resumido (ver gerarTagAssunto). */
  tagAssunto: string;
  /** id em questoes_respondidas, quando já existe (modo revisão). */
  questaoOrigemId?: number | null;
  cabecalho?: React.ReactNode;
  labelProxima: string;
  /** Devolve o id da linha gravada, para vincular a nota à questão de origem. */
  onResponder: (letra: string, acertou: boolean) => Promise<number | null> | void;
  onProxima: () => void;
}) {
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [revelada, setRevelada] = useState(false);
  const [tachadas, setTachadas] = useState<string[]>([]);
  const [origemId, setOrigemId] = useState<number | null>(questaoOrigemId ?? null);
  const [enviando, setEnviando] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Reset ao trocar de questão: sem isso a seleção da anterior vazaria.
  useEffect(() => {
    setSelecionada(null);
    setRevelada(false);
    setTachadas([]);
    setOrigemId(questaoOrigemId ?? null);
    setEnviando(false);
  }, [questao, questaoOrigemId]);

  const letrasValidas =
    questao.formato === "ce"
      ? ["C", "E"]
      : LETRAS.slice(0, questao.alternativas?.length ?? 5);

  function selecionar(l: string) {
    if (revelada || tachadas.includes(l)) return;
    setSelecionada(l);
  }
  function tachar(l: string) {
    if (revelada) return;
    setTachadas((t) => (t.includes(l) ? t : [...t, l]));
    setSelecionada((s) => (s === l ? null : s));
  }
  function destachar(l: string) {
    setTachadas((t) => t.filter((x) => x !== l));
  }

  async function enviar() {
    if (revelada || selecionada == null || enviando) return;
    setEnviando(true);
    const acertou = selecionada === questao.gabarito;
    setRevelada(true);
    try {
      const id = await onResponder(selecionada, acertou);
      if (typeof id === "number") setOrigemId(id);
    } catch (e) {
      // A resposta já está revelada; falha de gravação não deve travar o drill.
      console.error("gravar resposta", e);
    } finally {
      setEnviando(false);
    }
  }

  const acertou = selecionada === questao.gabarito;

  return (
    <div ref={cardRef} style={cartao}>
      <SelecaoNota
        containerRef={cardRef}
        materia={materia}
        tagPadrao={tagAssunto}
        questaoOrigemId={origemId}
      />

      {cabecalho}

      <p style={{ fontSize: 16, lineHeight: 1.55, margin: "0 0 16px" }}>
        {questao.enunciado}
      </p>

      {questao.formato === "ce" ? (
        <div style={{ display: "flex", gap: 10 }}>
          {/* Padronizado do artefato: ERRADO à esquerda, CERTO sempre à direita. */}
          {([["E", "ERRADO"], ["C", "CERTO"]] as const).map(([l, rot]) => (
            <Opcao
              key={l}
              texto={rot}
              big
              style={{ flex: 1 }}
              tachada={tachadas.includes(l)}
              marcada={!revelada && selecionada === l}
              reveal={
                revelada
                  ? questao.gabarito === l
                    ? "certo"
                    : selecionada === l
                      ? "errado"
                      : null
                  : (null as Reveal)
              }
              onSelect={() => selecionar(l)}
              onTachar={() => tachar(l)}
              onDestachar={() => destachar(l)}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(questao.alternativas ?? []).map((alt, i) => {
            const l = LETRAS[i];
            return (
              <Opcao
                key={l}
                texto={alt}
                tachada={tachadas.includes(l)}
                marcada={!revelada && selecionada === l}
                reveal={
                  revelada
                    ? questao.gabarito === l
                      ? "certo"
                      : selecionada === l
                        ? "errado"
                        : null
                    : (null as Reveal)
                }
                onSelect={() => selecionar(l)}
                onTachar={() => tachar(l)}
                onDestachar={() => destachar(l)}
              />
            );
          })}
        </div>
      )}

      {!revelada && (
        <div>
          <Botao onClick={enviar} disabled={selecionada == null} style={{ marginTop: 14 }}>
            Enviar resposta
          </Botao>
          <div
            style={{
              ...mono,
              fontSize: 10.5,
              color: C.sub,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Toque para marcar · deslize ← para riscar · deslize → para desfazer
            <br />
            Selecione um trecho de texto para salvar como nota
          </div>
        </div>
      )}

      {revelada && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1.5px dashed ${C.line}` }}>
          <div
            style={{
              ...mono,
              fontSize: 13,
              fontWeight: 600,
              color: acertou ? C.ok : C.erro,
              marginBottom: 8,
            }}
          >
            {acertou ? "✓ ACERTO" : `✗ ERRO — gabarito: ${questao.gabarito}`}
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 12px" }}>
            {questao.comentario}
          </p>

          {/* Explicação por alternativa errada — mesmo detalhe em CE e MC. */}
          {letrasValidas.filter((l) => l !== questao.gabarito).length > 0 && (
            <div style={{ margin: "0 0 12px" }}>
              <div
                style={{
                  ...mono,
                  fontSize: 10.5,
                  color: C.sub,
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                POR QUE AS OUTRAS ESTÃO ERRADAS
              </div>
              {letrasValidas
                .filter((l) => l !== questao.gabarito)
                .map((l) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      gap: 8,
                      padding: "7px 0",
                      borderTop: `1px solid ${C.line}`,
                      // Destaca a que o usuário marcou.
                      background: selecionada === l ? C.erroSoft : "transparent",
                    }}
                  >
                    <span
                      style={{
                        ...mono,
                        fontSize: 12,
                        fontWeight: 600,
                        color: selecionada === l ? C.erro : C.sub,
                        minWidth: 16,
                      }}
                    >
                      {questao.formato === "ce" ? (l === "C" ? "C" : "E") : l}
                    </span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.45, flex: 1 }}>
                      {questao.explicacoes_erradas?.[l] ?? "—"}
                    </span>
                  </div>
                ))}
            </div>
          )}

          <div>
            {questao.dispositivo && <Chip>{questao.dispositivo}</Chip>}
            {questao.tipo_cobranca && <Chip tom="neutro">{labelTipo(questao.tipo_cobranca)}</Chip>}
          </div>

          {questao.conceitos.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div
                style={{
                  ...mono,
                  fontSize: 10.5,
                  color: C.sub,
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                CONCEITOS DESTA QUESTÃO
              </div>
              {questao.conceitos.map((cc) => (
                <Chip key={cc}>{cc}</Chip>
              ))}
            </div>
          )}

          <Botao onClick={onProxima} style={{ marginTop: 14, ...disp }}>
            {labelProxima}
          </Botao>
        </div>
      )}
    </div>
  );
}
