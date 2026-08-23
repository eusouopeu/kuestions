import { useEffect, useMemo, useRef, useState } from "react";
import { FlagIcon as FlagOutline, SpeakerWaveIcon, StopIcon } from "@heroicons/react/24/outline";
import { FlagIcon as FlagSolid, SparklesIcon } from "@heroicons/react/24/solid";
import { C, cartao, disp, mono } from "../theme";
import Botao from "./Botao";
import Chip from "./Chip";
import Opcao, { type Reveal } from "./Opcao";
import SelecaoNota from "./SelecaoNota";
import SliderConfianca, { type Confianca } from "./SliderConfianca";
import Calculadora from "./Calculadora";
import type { Questao } from "../lib/types";
import { labelTipo } from "../lib/constants";
import { mesclarExplicacoesBanco, mesclarExplicacoesRespondida, reportarQuestao } from "../lib/repo";
import type { MotivoReport } from "../lib/repo";
import { gerarExplicacaoParcial, letrasExplicaveis, mensagemDeErro } from "../lib/anthropic";
import { buscarQuestaoBanco, nomeDaProva } from "../lib/banco";
import { pareceCalculo } from "../lib/texto";
import ModalReport from "./ModalReport";
import { lerEmVoz, pararLeitura, vozDisponivel } from "../lib/acessibilidade";

const LETRAS = ["A", "B", "C", "D", "E"];

export type { Confianca };

export type OrigemQuestao = "ia" | "banco" | "importada";

/**
 * Uma questão: enunciado, alternativas com toque/arrasto, revelação com
 * comentário do gabarito e explicação das alternativas que ainda estavam em
 * jogo (ver `letrasParaExplicar`).
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
  assunto,
  questaoOrigemId,
  reportadaInicial,
  temNotaInicial,
  origem,
  cabecalho,
  labelProxima,
  pedirConfianca = true,
  onResponder,
  onProxima,
}: {
  questao: Questao;
  materia: string;
  /** Assunto do bloco de origem, já resumido (ver gerarTagAssunto). */
  tagAssunto: string;
  /** Assunto por extenso, como o usuário o vê (tópico do bloco, aula do
   * banco) — vai para a tag de origem no topo do card. Só a versão
   * hifenizada (`tagAssunto`) serve para exportação de flashcard, não para
   * leitura. */
  assunto?: string;
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
  /** Pergunta "certeza"/"chute" antes de revelar o gabarito (ver
   * lib/repo.ts → porConfianca) — só faz sentido numa resposta nova, gravada
   * de verdade; desligado em Refazer erradas (que não grava uma linha nova,
   * só avança a caixa de Leitner da mesma questão). */
  pedirConfianca?: boolean;
  /** `tempoMs` é o tempo entre a questão aparecer e a resposta ser enviada
   * (cronometrado aqui). `confianca` é null quando `pedirConfianca` é false.
   * Devolve o id da linha gravada, para vincular a nota à questão de origem. */
  onResponder: (
    letra: string,
    acertou: boolean,
    tempoMs: number,
    confianca: Confianca | null,
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
  // Cópia local do comentário/explicações — a questão pode chegar sem
  // nenhuma explicação (bloco gerado com o toggle "explicações de IA"
  // desligado, ver GerarView/GerarBancoView) e ganhar explicações aos
  // poucos, conforme o usuário seleciona alternativas específicas abaixo.
  const [comentarioAtual, setComentarioAtual] = useState(questao.comentario);
  const [explicacoesAtuais, setExplicacoesAtuais] = useState(questao.explicacoes_erradas);
  const [selecionadasExplicar, setSelecionadasExplicar] = useState<Set<string>>(new Set());
  const [gerandoExplicacao, setGerandoExplicacao] = useState(false);
  const [erroExplicacao, setErroExplicacao] = useState<string | null>(null);
  // Leitura em voz alta (ver lib/acessibilidade.ts) — permite acompanhar o
  // enunciado sem olhar a tela. Só aparece onde a WebView tem síntese de voz.
  const [lendo, setLendo] = useState(false);
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
    setComentarioAtual(questao.comentario);
    setExplicacoesAtuais(questao.explicacoes_erradas);
    setSelecionadasExplicar(new Set());
    setGerandoExplicacao(false);
    setErroExplicacao(null);
    // A voz não pode continuar lendo a questão anterior depois de virar a
    // página (ver lib/acessibilidade.ts).
    pararLeitura();
    setLendo(false);
    inicioRef.current = Date.now();
  }, [questao, questaoOrigemId, reportadaInicial, temNotaInicial]);

  // Sair do drill (desmontar o card) também interrompe a leitura.
  useEffect(() => () => pararLeitura(), []);

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

  function alternarSelecaoExplicar(l: string) {
    setSelecionadasExplicar((s) => {
      const novo = new Set(s);
      if (novo.has(l)) novo.delete(l);
      else novo.add(l);
      return novo;
    });
  }

  /** Pede explicação só das alternativas marcadas — a questão pode ter sido
   * gerada sem nenhuma explicação (toggle desligado) ou já ter algumas e
   * faltar outras; em ambos os casos, só as letras selecionadas agora são
   * enviadas ao modelo (chamada pequena e barata, ver gerarExplicacaoParcial
   * em anthropic.ts). Persiste o resultado tanto na resposta gravada quanto,
   * se a questão vier do banco fixo, no cache compartilhado por banco_id. */
  async function explicarSelecionadas() {
    if (!selecionadasExplicar.size || gerandoExplicacao) return;
    setGerandoExplicacao(true);
    setErroExplicacao(null);
    const letras = [...selecionadasExplicar];
    try {
      const questaoAtual: Questao = {
        ...questao,
        comentario: comentarioAtual,
        explicacoes_erradas: explicacoesAtuais,
      };
      const { comentario, explicacoes_erradas } = await gerarExplicacaoParcial(questaoAtual, letras);
      if (comentario !== undefined) setComentarioAtual(comentario);
      setExplicacoesAtuais((prev) => ({ ...prev, ...explicacoes_erradas }));
      setSelecionadasExplicar(new Set());

      if (origemId != null) {
        mesclarExplicacoesRespondida(origemId, comentario, explicacoes_erradas).catch((e) =>
          console.error("persistir explicação sob demanda", e),
        );
      }
      if (questao.bancoId) {
        mesclarExplicacoesBanco(questao.bancoId, comentario, explicacoes_erradas).catch((e) =>
          console.error("persistir explicação sob demanda (banco)", e),
        );
      }
    } catch (e) {
      setErroExplicacao(mensagemDeErro(e));
    } finally {
      setGerandoExplicacao(false);
    }
  }

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

  /** A prerrogativa é ter certeza — `confianca` só vira "chute" quando o
   * próprio botão "Chute" (ao lado de "Enviar") é o que dispara o envio. */
  async function enviar(confianca: Confianca = "certeza") {
    if (revelada || selecionada == null || enviando) return;
    setEnviando(true);
    const acertou = selecionada === questao.gabarito;
    setRevelada(true);
    const tempoMs = Date.now() - inicioRef.current;
    try {
      const id = await onResponder(selecionada, acertou, tempoMs, pedirConfianca ? confianca : null);
      if (typeof id === "number") setOrigemId(id);
    } catch (e) {
      // A resposta já está revelada; falha de gravação não deve travar o drill.
      console.error("gravar resposta", e);
    } finally {
      setEnviando(false);
    }
  }

  /** Lê o que está visível na tela: antes de revelar, enunciado e
   * alternativas; depois, também o gabarito e o comentário — que é o trecho
   * que interessa ouvir na revisão. */
  function alternarLeitura() {
    if (lendo) {
      pararLeitura();
      setLendo(false);
      return;
    }
    const partes = [questao.enunciado, ...(questao.alternativas ?? [])];
    if (revelada) {
      partes.push(`Gabarito: ${questao.gabarito}.`);
      if (comentarioAtual) partes.push(comentarioAtual);
    }
    setLendo(true);
    lerEmVoz(partes.join(". "), () => setLendo(false));
  }

  const acertou = selecionada === questao.gabarito;

  /**
   * Tag de origem: nome da prova real (banca · cargo · ano) ou o ícone de IA,
   * seguido do assunto de que a questão trata. "Gerada por IA" e "Banco real"
   * sozinhos diziam de onde veio, mas não sobre o quê — e é o assunto que
   * situa a questão quando ela aparece fora do bloco em que foi criada.
   */
  const qb = questao.bancoId ? buscarQuestaoBanco(questao.bancoId) : null;
  // Na revisão a view não informa `origem` (a questão vem do banco de
  // respostas, não do fluxo que a criou) — mas `bancoId` sobrevive na
  // gravação, e ele já basta para reconhecer uma questão de prova real.
  const origemEfetiva = origem ?? (qb ? "banco" : undefined);
  const assuntoDaQuestao = qb?.assunto || assunto || questao.conceitos[0] || materia;
  const rotuloOrigem =
    origemEfetiva === "banco"
      ? `${qb ? nomeDaProva(qb) : "Prova real"} – ${assuntoDaQuestao}`
      : origemEfetiva === "ia"
        ? `– ${assuntoDaQuestao}`
        : `Importada – ${assuntoDaQuestao}`;

  /**
   * Quais alternativas entram na lista de explicações depois de revelar.
   * Em CE é só o gabarito (ver letrasExplicaveis em lib/anthropic.ts: o item
   * afirma uma coisa só). Em múltipla escolha, o gabarito mais as
   * alternativas que continuaram em jogo — as que o usuário RISCOU já foram
   * descartadas conscientemente, e explicá-las gasta leitura (e tokens, se
   * pedidas sob demanda) com um erro que ele não cometeria.
   */
  const letrasParaExplicar = useMemo(() => {
    const explicaveis = letrasExplicaveis(questao);
    if (questao.formato === "ce") return explicaveis;
    return explicaveis.filter((l) => l === questao.gabarito || !tachadas.includes(l));
  }, [questao, tachadas]);

  const temCalculadora = pareceCalculo(questao);

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

      {(origemEfetiva || temNota) && (
        <div style={{ marginBottom: 10 }}>
          {origemEfetiva && (
            <Chip tom={origemEfetiva === "banco" ? "ok" : "neutro"}>
              {origemEfetiva === "ia" && (
                <SparklesIcon
                  width={12}
                  height={12}
                  style={{ verticalAlign: -1.5, marginRight: 4 }}
                />
              )}
              {rotuloOrigem}
            </Chip>
          )}
          {temNota && <Chip tom="ok">📝 Nota salva</Chip>}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "0 0 16px" }}>
        <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, flex: 1 }}>{questao.enunciado}</p>
        {vozDisponivel() && (
          <button
            onClick={alternarLeitura}
            aria-label={lendo ? "Parar leitura" : "Ouvir a questão"}
            title={lendo ? "Parar leitura" : "Ouvir enunciado e alternativas"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: 8,
              border: `1.5px solid ${lendo ? C.caneta : C.line}`,
              background: lendo ? C.canetaSoft : "transparent",
              color: lendo ? C.caneta : C.sub,
              cursor: "pointer",
            }}
          >
            {lendo ? <StopIcon width={17} height={17} /> : <SpeakerWaveIcon width={17} height={17} />}
          </button>
        )}
      </div>

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

      {/* Questão de conta: calculadora embutida logo abaixo das alternativas,
          para não trocar de app no meio do raciocínio (ver pareceCalculo em
          lib/texto.ts). Continua disponível depois de revelar — conferir a
          conta contra o comentário é parte da correção. */}
      {temCalculadora && <Calculadora />}

      {!revelada && (
        <div>
          {pedirConfianca ? (
            // Um gesto só no lugar dos botões "Chute" e "Enviar": o quanto
            // você arrasta É a declaração de confiança (ver SliderConfianca).
            <SliderConfianca disabled={selecionada == null || enviando} onEnviar={enviar} />
          ) : (
            <Botao
              onClick={() => enviar("certeza")}
              disabled={selecionada == null || enviando}
              style={{ marginTop: 14 }}
            >
              Enviar
            </Botao>
          )}
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

          {/* Explicação por alternativa — comentário do gabarito e erro de
              cada errada, unificados numa lista. Alternativas ainda sem
              explicação (bloco gerado com o toggle desligado, ver
              GerarView/GerarBancoView) viram uma linha de checkbox: o
              usuário escolhe só o que quer entender e pede sob demanda,
              numa chamada pequena e barata (ver gerarExplicacaoParcial). */}
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
              {questao.formato === "ce" ? "EXPLICAÇÃO DO GABARITO" : "EXPLICAÇÃO POR ALTERNATIVA"}
            </div>
            {letrasParaExplicar.map((l) => {
              const ehGabarito = l === questao.gabarito;
              const texto = ehGabarito ? comentarioAtual : explicacoesAtuais?.[l];
              const rotuloLetra = questao.formato === "ce" ? (l === "C" ? "C" : "E") : l;

              if (texto) {
                return (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      gap: 8,
                      padding: "7px 0",
                      borderTop: `1px solid ${C.line}`,
                      // Destaca a que o usuário marcou.
                      background: !ehGabarito && selecionada === l ? C.erroSoft : "transparent",
                    }}
                  >
                    <span
                      style={{
                        ...mono,
                        fontSize: 12,
                        fontWeight: 600,
                        color: ehGabarito ? C.ok : selecionada === l ? C.erro : C.sub,
                        minWidth: 16,
                      }}
                    >
                      {rotuloLetra}
                    </span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.45, flex: 1 }}>{texto}</span>
                  </div>
                );
              }

              const marcada = selecionadasExplicar.has(l);
              return (
                <label
                  key={l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 0",
                    borderTop: `1px solid ${C.line}`,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={marcada}
                    onChange={() => alternarSelecaoExplicar(l)}
                    style={{ flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
                  />
                  <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: C.sub, minWidth: 16 }}>
                    {rotuloLetra}
                  </span>
                  <span style={{ fontSize: 12.5, color: C.sub, flex: 1, fontStyle: "italic" }}>
                    {ehGabarito
                      ? questao.formato === "ce"
                        ? "Por que este é o gabarito — toque para pedir explicação"
                        : "Por que está certa — toque para pedir explicação"
                      : "Ainda não explicada — toque para pedir explicação"}
                  </span>
                </label>
              );
            })}

            {selecionadasExplicar.size > 0 && (
              <Botao
                tipo="fantasma"
                onClick={explicarSelecionadas}
                disabled={gerandoExplicacao}
                style={{ marginTop: 10 }}
              >
                {gerandoExplicacao
                  ? "Gerando explicação…"
                  : `Explicar ${selecionadasExplicar.size} selecionada${selecionadasExplicar.size === 1 ? "" : "s"}`}
              </Botao>
            )}
            {erroExplicacao && (
              <div style={{ ...mono, fontSize: 11.5, color: C.erro, marginTop: 8 }}>{erroExplicacao}</div>
            )}
          </div>

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
