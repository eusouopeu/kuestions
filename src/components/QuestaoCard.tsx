import { useEffect, useRef, useState } from "react";
import { FlagIcon as FlagOutline } from "@heroicons/react/24/outline";
import { FlagIcon as FlagSolid } from "@heroicons/react/24/solid";
import { C, cartao, disp, mono } from "../theme";
import Botao from "./Botao";
import Chip from "./Chip";
import Opcao, { type Reveal } from "./Opcao";
import SelecaoNota from "./SelecaoNota";
import type { Questao } from "../lib/types";
import { labelTipo } from "../lib/constants";
import { reportarQuestao } from "../lib/repo";
import type { MotivoReport } from "../lib/repo";
import ModalReport from "./ModalReport";

const LETRAS = ["A", "B", "C", "D", "E"];

export type OrigemQuestao = "ia" | "banco" | "importada";

const ROTULO_ORIGEM: Record<OrigemQuestao, string> = {
  ia: "Gerada por IA",
  banco: "Banco real · explicação por IA",
  importada: "Importada",
};

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
  reportadaInicial,
  temNotaInicial,
  origem,
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
  /** Já reportada em uma sessão anterior (modo revisão — QuestaoRespondida.reportada). */
  reportadaInicial?: boolean;
  /** Já existe uma nota vinculada a esta questão (ver idsComNota em repo.ts) —
   * só faz sentido no modo revisão, onde `questaoOrigemId` já existe antes de
   * qualquer resposta nesta sessão. */
  temNotaInicial?: boolean;
  /** De onde a questão veio — não persistido, então só aparece no drill em
   * que a questão foi criada (Gerar/Do banco/Importar), não na revisão de
   * erradas. Ajuda a calibrar confiança: só o comentário do modo "banco" é
   * gerado por IA, o resto da questão é uma prova real. */
  origem?: OrigemQuestao;
  cabecalho?: React.ReactNode;
  labelProxima: string;
  /** `tempoMs` é o tempo entre a questão aparecer e a resposta ser enviada
   * (cronometrado aqui). Devolve o id da linha gravada, para vincular a nota
   * à questão de origem. */
  onResponder: (
    letra: string,
    acertou: boolean,
    tempoMs: number,
  ) => Promise<number | null> | void;
  onProxima: () => void;
}) {
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [revelada, setRevelada] = useState(false);
  const [tachadas, setTachadas] = useState<string[]>([]);
  const [origemId, setOrigemId] = useState<number | null>(questaoOrigemId ?? null);
  const [enviando, setEnviando] = useState(false);
  const [reportada, setReportada] = useState(reportadaInicial ?? false);
  const [reportando, setReportando] = useState(false);
  const [modalReport, setModalReport] = useState(false);
  const [temNota, setTemNota] = useState(temNotaInicial ?? false);
  const cardRef = useRef<HTMLDivElement>(null);
  // Início da cronometragem desta questão — reseta junto com o resto ao
  // trocar de questão (ver o mesmo efeito abaixo).
  const inicioRef = useRef(Date.now());

  // Reset ao trocar de questão: sem isso a seleção da anterior vazaria.
  useEffect(() => {
    setSelecionada(null);
    setRevelada(false);
    setTachadas([]);
    setOrigemId(questaoOrigemId ?? null);
    setEnviando(false);
    setReportada(reportadaInicial ?? false);
    setReportando(false);
    setModalReport(false);
    setTemNota(temNotaInicial ?? false);
    inicioRef.current = Date.now();
  }, [questao, questaoOrigemId, reportadaInicial, temNotaInicial]);

  async function reportar(motivo: MotivoReport) {
    if (reportada || reportando || origemId == null) return;
    setReportando(true);
    try {
      await reportarQuestao(origemId, motivo);
      setReportada(true);
      setModalReport(false);
    } catch (e) {
      console.error("reportar questão", e);
    } finally {
      setReportando(false);
    }
  }

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
    const tempoMs = Date.now() - inicioRef.current;
    try {
      const id = await onResponder(selecionada, acertou, tempoMs);
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
    // WebkitTouchCallout suprime o menu nativo de seleção (Copiar/Traduzir/
    // Buscar) do Android/iOS ao segurar o toque sobre o texto — ele compete
    // visualmente com o botão "+ Salvar nota" de SelecaoNota, que abre no
    // mesmo gesto. A seleção em si continua funcionando normalmente.
    <div ref={cardRef} style={{ ...cartao, WebkitTouchCallout: "none" } as React.CSSProperties}>
      <SelecaoNota
        containerRef={cardRef}
        materia={materia}
        tagPadrao={tagAssunto}
        questaoOrigemId={origemId}
        onSalvo={() => setTemNota(true)}
      />

      {cabecalho}

      {(origem || temNota) && (
        <div style={{ marginBottom: 10 }}>
          {origem && <Chip tom={origem === "banco" ? "ok" : "neutro"}>{ROTULO_ORIGEM[origem]}</Chip>}
          {temNota && <Chip tom="ok">📝 Nota salva</Chip>}
        </div>
      )}

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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                ...mono,
                fontSize: 13,
                fontWeight: 600,
                color: acertou ? C.ok : C.erro,
              }}
            >
              {acertou ? "✓ ACERTO" : `✗ ERRO — gabarito: ${questao.gabarito}`}
            </div>

            {origemId != null && (
              <button
                onClick={() => setModalReport(true)}
                disabled={reportada || reportando}
                aria-label={
                  reportada
                    ? "Questão já reportada"
                    : "Reportar erro nesta questão"
                }
                title={
                  reportada
                    ? "Questão reportada — obrigado pelo aviso"
                    : "Reportar erro no enunciado ou no gabarito desta questão"
                }
                style={{
                  ...mono,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  padding: "5px 8px",
                  borderRadius: 6,
                  border: `1.5px solid ${reportada ? C.erro : C.line}`,
                  background: reportada ? C.erroSoft : "transparent",
                  color: reportada ? C.erro : C.sub,
                  cursor: reportada || reportando ? "default" : "pointer",
                  flexShrink: 0,
                }}
              >
                {reportada ? (
                  <FlagSolid width={14} height={14} />
                ) : (
                  <FlagOutline width={14} height={14} />
                )}
                {reportada ? "Reportada" : reportando ? "Enviando…" : "Questão errada"}
              </button>
            )}
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

      {modalReport && (
        <ModalReport onCancelar={() => setModalReport(false)} onConfirmar={reportar} />
      )}
    </div>
  );
}
