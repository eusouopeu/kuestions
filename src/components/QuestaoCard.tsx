import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightStartOnRectangleIcon,
  CheckIcon,
  FlagIcon as FlagOutline,
  ExclamationTriangleIcon,
  ForwardIcon,
  PencilSquareIcon,
  SpeakerWaveIcon,
  StopIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { FlagIcon as FlagSolid } from "@heroicons/react/24/solid";
import { C, campo, cartao, disp, mono } from "../theme";
import Botao from "./Botao";
import Chip from "./Chip";
import Opcao, { type Reveal } from "./Opcao";
import SelecaoNota from "./SelecaoNota";
import SliderConfianca, { type Confianca } from "./SliderConfianca";
import Calculadora from "./Calculadora";
import TextoQuestao from "./TextoQuestao";
import { FONTE_MAX, FONTE_MIN, mudarFonteQuestao, useFonteQuestao } from "../lib/fonteQuestao";
import { BannerProveniencia, BannerTopico } from "./BannerQuestao";
import type { Questao } from "../lib/types";
import { labelTipo } from "../lib/constants";
import {
  atualizarEnunciadoRespondida,
  mesclarExplicacoesBanco,
  mesclarExplicacoesRespondida,
  reportarQuestao,
} from "../lib/repo";
import type { MotivoReport } from "../lib/repo";
import { marcarInviavel } from "../lib/questoesInviaveis";
import { gerarExplicacaoParcial, letrasExplicaveis, mensagemDeErro } from "../lib/anthropic";
import { bancoCarregado, buscarQuestaoBanco, emojiIncidencia, garantirBanco, nomeDaProva } from "../lib/banco";
import { normalizarLayoutTexto, pareceCalculo } from "../lib/texto";
import ModalReport from "./ModalReport";
import { lerEmVoz, pararLeitura, vozDisponivel } from "../lib/acessibilidade";
import { ordemEmbaralhada, rotularAlternativa } from "../lib/embaralhar";

const LETRAS = ["A", "B", "C", "D", "E"];

/** Botão-ícone da barra do enunciado (pular, ouvir) — `ativo` marca o estado
 * ligado (leitura em andamento). */
function botaoFerramentaCard(ativo: boolean) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: 8,
    border: `1.5px solid ${ativo ? C.caneta : C.line}`,
    background: ativo ? C.canetaSoft : "transparent",
    color: ativo ? C.caneta : C.sub,
    cursor: "pointer",
  } as const;
}

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
  acoesExtras,
  labelProxima,
  pedirConfianca = true,
  embaralhar = false,
  onResponder,
  onPular,
  onProxima,
  onSair,
  rotuloSair = "Sair",
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
  /** Conteúdo à esquerda da barra de rodapé do card, na mesma linha dos
   * botões-ícone de corrigir enunciado e pular (ex.: o tutor da questão na
   * revisão). */
  acoesExtras?: React.ReactNode;
  labelProxima: string;
  /** Pede a autoavaliação de confiança pelo slider (ver SliderConfianca e
   * lib/repo.ts → porConfianca) antes de revelar o gabarito. Ligado também
   * na revisão (FilaRevisaoDrill) pelo gesto único de envio, embora lá a
   * confiança recebida seja ignorada — a revisão não grava linha nova, só
   * avança a caixa de Leitner da mesma questão. */
  pedirConfianca?: boolean;
  /** Embaralha a ordem das alternativas de múltipla escolha (revisão, ver
   * FilaRevisaoDrill) para não acertar só por lembrar a letra do gabarito.
   * É só exibição: internamente as letras continuam as originais, então
   * `onResponder`, explicações gravadas e o gabarito salvo não mudam — só o
   * rótulo mostrado na tela segue a posição embaralhada. */
  embaralhar?: boolean;
  /** `tempoMs` é o tempo entre a questão aparecer e a resposta ser enviada
   * (cronometrado aqui). `confianca` é null quando `pedirConfianca` é false.
   * Devolve o id da linha gravada, para vincular a nota à questão de origem. */
  onResponder: (
    letra: string,
    acertou: boolean,
    tempoMs: number,
    confianca: Confianca | null,
  ) => Promise<number | null> | void;
  /** Pular esta questão sem responder: nada é gravado, então ela não entra
   * em estatística nem em "Refazer", e segue disponível para blocos futuros.
   * Na revisão, pular só avança a fila sem mexer na caixa de Leitner.
   * Só aparece antes de revelar o gabarito. */
  onPular?: () => void;
  onProxima: () => void;
  /** Sair do drill (ex.: "Sair da revisão") — vira o último botão-ícone da
   * barra de ações acima do card. */
  onSair?: () => void;
  /** Texto acessível/título do botão de sair (inclui contagem, se houver). */
  rotuloSair?: string;
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
  // Correção do enunciado (botão-ícone de lápis): erro de digitação ou de
  // extração no texto. Sem linha gravada ainda (primeira resposta num
  // bloco), a correção fica pendente e é persistida logo depois de
  // `onResponder` devolver o id — ver `enviar`.
  const [enunciadoAtual, setEnunciadoAtual] = useState(questao.enunciado);
  const [editandoEnunciado, setEditandoEnunciado] = useState(false);
  const [rascunhoEnunciado, setRascunhoEnunciado] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const fonte = useFonteQuestao();
  // Só para forçar um re-render quando o banco de questões carrega depois do
  // card já ter montado — acontece quando uma questão com `bancoId` aparece
  // numa tela que não passou por GerarBancoView/SimuladoView nesta sessão
  // (ex.: reabrir "Refazer erradas" direto após o boot). Sem isto, o card
  // ficaria sem o banner de proveniência até a próxima navegação.
  const [, forcarAposCargaBanco] = useState(0);
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
    setEnunciadoAtual(questao.enunciado);
    setEditandoEnunciado(false);
    // A voz não pode continuar lendo a questão anterior depois de virar a
    // página (ver lib/acessibilidade.ts).
    pararLeitura();
    setLendo(false);
    inicioRef.current = Date.now();
  }, [questao, questaoOrigemId, reportadaInicial, temNotaInicial]);

  // Sair do drill (desmontar o card) também interrompe a leitura.
  useEffect(() => () => pararLeitura(), []);

  useEffect(() => {
    if (questao.bancoId && !bancoCarregado()) {
      garantirBanco().then(() => forcarAposCargaBanco((n) => n + 1));
    }
  }, [questao.bancoId]);

  // Antes de responder: a questão depende de algo que não veio no texto (ex.:
  // imagem da prova). Sai do sorteio do banco (ver questoesInviaveis.ts), é
  // reportada se já tiver linha gravada (revisão) e a fila segue como no pular.
  async function marcarErrada() {
    try {
      if (questao.bancoId) await marcarInviavel(questao.bancoId);
      if (origemId != null && !reportada) await reportarQuestao(origemId, "enunciado");
    } catch (e) {
      console.error("marcar questão como errada", e);
    }
    onPular?.();
  }

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
        enunciado: enunciadoAtual,
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

  /** Sem slider (pedirConfianca=false), o
   * envio é o botão "Enviar" sozinho, sem pedir a autoavaliação; o valor
   * default aqui nunca é usado nesse caso porque `onResponder` recebe null
   * (ver mais abaixo). */
  async function enviar(confianca: Confianca = "certeza") {
    if (revelada || selecionada == null || enviando) return;
    setEnviando(true);
    const acertou = selecionada === questao.gabarito;
    setRevelada(true);
    const tempoMs = Date.now() - inicioRef.current;
    try {
      const id = await onResponder(selecionada, acertou, tempoMs, pedirConfianca ? confianca : null);
      if (typeof id === "number") {
        setOrigemId(id);
        if (enunciadoAtual !== questao.enunciado) {
          atualizarEnunciadoRespondida(id, enunciadoAtual).catch((e) =>
            console.error("persistir enunciado corrigido", e),
          );
        }
      }
    } catch (e) {
      // A resposta já está revelada; falha de gravação não deve travar o drill.
      console.error("gravar resposta", e);
    } finally {
      setEnviando(false);
    }
  }

  function salvarEnunciado() {
    const novo = rascunhoEnunciado.trim();
    setEditandoEnunciado(false);
    if (!novo || novo === enunciadoAtual) return;
    setEnunciadoAtual(novo);
    if (origemId != null) {
      atualizarEnunciadoRespondida(origemId, novo).catch((e) =>
        console.error("persistir enunciado corrigido", e),
      );
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
    const partes = [enunciadoAtual, ...alternativasExibidas.map((a) => a.texto)];
    if (revelada) {
      partes.push(`Gabarito: ${letraExibida(questao.gabarito)}.`);
      if (comentarioAtual) partes.push(comentarioAtual);
    }
    setLendo(true);
    lerEmVoz(partes.join(". "), () => setLendo(false));
  }

  const acertou = selecionada === questao.gabarito;

  // Ordem de exibição das alternativas: `ordem[posição] = índice original`.
  // Identidade fora da revisão; CE nunca embaralha (CERTO/ERRADO são fixos).
  const ordem = useMemo(() => {
    const n = questao.alternativas?.length ?? 0;
    if (!embaralhar || questao.formato === "ce" || n < 2) {
      return Array.from({ length: n }, (_, i) => i);
    }
    return ordemEmbaralhada(n, LETRAS.indexOf(questao.gabarito));
  }, [questao, embaralhar]);
  const embaralhada = ordem.some((orig, pos) => orig !== pos);
  const alternativasExibidas = ordem.map((orig, pos) => {
    const texto = questao.alternativas?.[orig] ?? "";
    return {
      letra: LETRAS[orig],
      texto: embaralhada ? rotularAlternativa(texto, LETRAS[pos]) : texto,
    };
  });
  /** Letra original → letra mostrada na tela (iguais sem embaralhar). */
  function letraExibida(l: string): string {
    const pos = ordem.indexOf(LETRAS.indexOf(l));
    return pos >= 0 ? LETRAS[pos] : l;
  }

  /**
   * Os dois banners do topo (ver components/BannerQuestao.tsx):
   *   - cinza (proveniência): banca · cargo · ano, só em questão de prova
   *     real, com `qb` resolvido;
   *   - roxo (tópico): assunto de que a questão trata, com o emoji de
   *     incidência na frente quando o assunto tiver uma (ver
   *     emojiIncidencia em lib/banco.ts) — o MESMO banner para questão do
   *     banco e questão gerada por IA, para que um ajuste de estilo pedido
   *     numa valha para as duas de uma vez.
   */
  const qb = questao.bancoId ? buscarQuestaoBanco(questao.bancoId) : null;
  // Na revisão a view não informa `origem` (a questão vem do banco de
  // respostas, não do fluxo que a criou) — mas `bancoId` sobrevive na
  // gravação, e ele já basta para reconhecer uma questão de prova real.
  const origemEfetiva = origem ?? (qb ? "banco" : undefined);
  const assuntoDaQuestao = qb?.assunto || assunto || questao.conceitos[0] || materia;
  const emojiDaQuestao = qb ? emojiIncidencia(qb) : null;

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
    // Na ordem em que aparecem na tela (importa quando embaralhada).
    const posicao = (l: string) => ordem.indexOf(LETRAS.indexOf(l));
    return explicaveis
      .filter((l) => l === questao.gabarito || !tachadas.includes(l))
      .sort((a, b) => posicao(a) - posicao(b));
  }, [questao, tachadas, ordem]);

  const temCalculadora = pareceCalculo(questao);

  const barraAcoes = (
    // Barra de ações num card próprio, acima da questão: letra menor/maior,
    // corrigir enunciado, pular, marcar como errada e (na revisão) sair.
    <div
      style={{
        ...cartao,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        marginBottom: 10,
      }}
    >
      <button
        onClick={() => mudarFonteQuestao(-1)}
        disabled={fonte <= FONTE_MIN}
        aria-label="Diminuir letra da questão"
        title="Diminuir letra da questão"
        style={botaoFerramentaCard(false)}
      >
        <span style={{ ...mono, fontSize: 12, fontWeight: 700 }}>A−</span>
      </button>
      <button
        onClick={() => mudarFonteQuestao(1)}
        disabled={fonte >= FONTE_MAX}
        aria-label="Aumentar letra da questão"
        title="Aumentar letra da questão"
        style={botaoFerramentaCard(false)}
      >
        <span style={{ ...mono, fontSize: 16, fontWeight: 700 }}>A+</span>
      </button>
      <div style={{ flex: 1 }} />
      {!editandoEnunciado && (
        <button
          onClick={() => {
            setRascunhoEnunciado(enunciadoAtual);
            setEditandoEnunciado(true);
          }}
          aria-label="Corrigir enunciado"
          title="Corrigir erro no enunciado desta questão"
          style={botaoFerramentaCard(false)}
        >
          <PencilSquareIcon width={17} height={17} />
        </button>
      )}
      {!revelada && !editandoEnunciado && onPular && (
        <button
          onClick={onPular}
          aria-label="Pular esta questão"
          title="Pular esta questão — não conta em nenhuma estatística"
          style={botaoFerramentaCard(false)}
        >
          <ForwardIcon width={17} height={17} />
        </button>
      )}
      {!revelada && !editandoEnunciado && onPular && (questao.bancoId || origemId != null) && (
        <button
          onClick={marcarErrada}
          aria-label="Marcar questão como errada"
          title="Marcar como errada (ex.: depende de imagem que não veio no enunciado) — sai do banco e pula"
          style={botaoFerramentaCard(false)}
        >
          <ExclamationTriangleIcon width={17} height={17} />
        </button>
      )}
      {onSair && (
        <button onClick={onSair} aria-label={rotuloSair} title={rotuloSair} style={botaoFerramentaCard(false)}>
          <ArrowRightStartOnRectangleIcon width={17} height={17} />
        </button>
      )}
    </div>
  );

  return (
    <>
    {barraAcoes}
    {/* WebkitTouchCallout suprime o menu nativo de seleção (Copiar/Traduzir/
        Buscar) do Android/iOS ao segurar o toque sobre o texto — ele compete
        visualmente com o botão "+ Salvar nota" de SelecaoNota, que abre no
        mesmo gesto. A seleção em si continua funcionando normalmente. */}
    <div ref={cardRef} style={{ ...cartao, WebkitTouchCallout: "none" } as React.CSSProperties}>
      <SelecaoNota
        containerRef={cardRef}
        materia={materia}
        tagPadrao={tagAssunto}
        questaoOrigemId={origemId}
        contexto={enunciadoAtual}
        onSalvo={() => setTemNota(true)}
      />

      {cabecalho}

      {origemEfetiva === "banco" && qb && <BannerProveniencia texto={nomeDaProva(qb)} />}
      {origemEfetiva && <BannerTopico texto={assuntoDaQuestao} emoji={emojiDaQuestao} />}
      {temNota && (
        <div style={{ marginBottom: 10 }}>
          <Chip tom="ok">📝 Nota salva</Chip>
        </div>
      )}

      {/* Texto de apoio: contexto compartilhado por várias questões da
          mesma prova (um estudo de caso, uma tabela) — algumas questões do
          banco real dependem dele para fazer sentido (ver texto_apoio em
          lib/banco.ts). É premissa, não a afirmação que a questão está
          fazendo, mas visualmente segue o mesmo estilo do enunciado — uma
          caixa cinza separada dava a impressão de não fazer parte da
          questão, especialmente em enunciados grandes. */}
      {qb?.texto_apoio && (
        <TextoQuestao
          texto={normalizarLayoutTexto(qb.texto_apoio)}
          tamanho={fonte}
          style={{ margin: `0 0 ${(1.25 / 2).toFixed(3)}em` }}
        />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "0 0 16px" }}>
        {editandoEnunciado ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <textarea
              value={rascunhoEnunciado}
              onChange={(e) => setRascunhoEnunciado(e.target.value)}
              aria-label="Enunciado da questão"
              autoFocus
              style={{ ...campo, width: "100%", minHeight: 140, fontSize: 15, lineHeight: 1.5, resize: "vertical" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
              <button
                onClick={() => setEditandoEnunciado(false)}
                aria-label="Descartar correção"
                title="Descartar correção"
                style={botaoFerramentaCard(false)}
              >
                <XMarkIcon width={17} height={17} />
              </button>
              <button
                onClick={salvarEnunciado}
                aria-label="Salvar enunciado corrigido"
                title="Salvar enunciado corrigido"
                style={botaoFerramentaCard(true)}
              >
                <CheckIcon width={17} height={17} />
              </button>
            </div>
          </div>
        ) : (
          <TextoQuestao texto={normalizarLayoutTexto(enunciadoAtual)} tamanho={fonte} style={{ flex: 1 }} />
        )}
        {vozDisponivel() && (
          <button
            onClick={alternarLeitura}
            aria-label={lendo ? "Parar leitura" : "Ouvir a questão"}
            title={lendo ? "Parar leitura" : "Ouvir enunciado e alternativas"}
            style={botaoFerramentaCard(lendo)}
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
          {alternativasExibidas.map(({ letra: l, texto }) => {
            return (
              <Opcao
                key={l}
                texto={texto}
                tamanho={fonte - 0.5}
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
              {acertou ? "✓ ACERTO" : `✗ ERRO — gabarito: ${letraExibida(questao.gabarito)}`}
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
              const rotuloLetra = questao.formato === "ce" ? (l === "C" ? "C" : "E") : letraExibida(l);

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

      {/* Linha própria para ações contextuais da view (ex.: "Tirar dúvida"
          do tutor na revisão, ver FilaRevisaoDrill). */}
      {acoesExtras && <div style={{ marginTop: 14 }}>{acoesExtras}</div>}

      {modalReport && (
        <ModalReport onCancelar={() => setModalReport(false)} onConfirmar={reportar} />
      )}
    </div>
    </>
  );
}
