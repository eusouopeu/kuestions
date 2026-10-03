import { useEffect, useRef, useState } from "react";
import { BoltIcon } from "@heroicons/react/24/outline";
import { C, campo, cartao, disp, mono, rotulo } from "../theme";
import Botao from "../components/Botao";
import EsqueletoQuestao from "../components/EsqueletoQuestao";
import Rail from "../components/Rail";
import Segmented from "../components/Segmented";
import QuestaoCard, { type Confianca } from "../components/QuestaoCard";
import { Vazio } from "../components/Shell";
import {
  anosDeArea,
  areasBanco,
  assuntosDeArea,
  blocosDeArea,
  buscarQuestaoBanco,
  contarDisponiveis,
  contarIneditas,
  descricaoFiltroBanco,
  garantirBanco,
  instituicoesDeArea,
  pesosPorAssunto,
  pontuarAssuntos,
  questaoBancoParaQuestao,
  selecionarQuestoes,
  FORMATOS_BANCO,
  TAMANHOS_TEXTO,
  TETO_CURTISSIMO,
  type FiltroBanco,
  NIVEL_BANCO,
} from "../lib/banco";
import { gerarExplicacoes, SemCredencialError } from "../lib/anthropic";
import { getPesosEdital, pesoDe } from "../lib/edital";
import { distribuirBlocoMisto, intercalar, MATERIA_MISTA } from "../lib/blocoMisto";
import { getComExplicacoesIA } from "../lib/preferenciasGeracao";
import {
  atualizarTotalQuestoesBloco,
  buscarExplicacoesBanco,
  criarBloco,
  fecharBloco,
  gravarResposta,
  idsBancoRespondidos,
  pontosPorConceito,
  resumoPorMateria,
  salvarExplicacoesBanco,
} from "../lib/repo";
import { gerarTagAssunto } from "../lib/texto";
import { escolherMateriaSugerida } from "../lib/materiaSugerida";
import { aprovadoNoBloco } from "../lib/blocoUtils";
import { Q_POR_BLOCO } from "../lib/constants";
import type { Questao, StatusSub } from "../lib/types";
import { ehInviavel } from "../lib/questoesInviaveis";
import {
  getRascunhoBanco,
  limparRascunhoBanco,
  salvarRascunhoBanco,
  type RascunhoBlocoBanco,
} from "../lib/blocoBancoRascunho";
import { getBlocoRapidoPronto, Q_BLOCO_RAPIDO, setBlocoRapidoPronto } from "../lib/blocoRapido";
import { aoPedirBlocoRapido, consumirBlocoRapido } from "../lib/atalhos";
import { getProvaAlvo, msPorQuestaoNaProva } from "../lib/prova";

type Tela = "config" | "drill" | "resultado";

/** Valor especial do dropdown "Área": bloco do dia, misturando áreas por peso
 * no edital × fraqueza (ver lib/blocoMisto.ts). */
const AREA_MISTA = "__misto__";
type Modo = "aula" | "bloco" | "todos";

/** Questões curtíssimas de várias áreas, para o bloco rápido. */
const filtroRapido: FiltroBanco = { modo: "todos", maxCaracteres: TETO_CURTISSIMO };

/** Questões geradas em bastidores em lotes de 4 (chamada única à API para
 * escrever comentário + explicações de cada alternativa errada), com a mesma
 * cascata de pré-carregamento de GerarView — o usuário raramente espera. */
const LOTE = 4;

/**
 * 4ª forma de montar um bloco na aba Questões: em vez de gerar questões
 * inéditas via IA, sorteia questões REAIS de um banco de provas anexado
 * (enunciado/alternativas/gabarito nunca são alterados) e só usa a API para
 * escrever comentário e explicação de cada alternativa errada — e mesmo isso
 * é opcional (ver `comExplicacoes`). Funciona mesmo sem chave de API
 * configurada (ou offline): a questão real em si já tem valor sozinha, só o
 * comentário/explicações ficam indisponíveis até serem geradas (na criação
 * ou sob demanda depois de responder, ver QuestaoCard).
 */
export default function GerarBancoView({ onEmDrill }: { onEmDrill?: (v: boolean) => void }) {
  const [tela, setTela] = useState<Tela>("config");

  useEffect(() => {
    onEmDrill?.(tela === "drill");
    return () => onEmDrill?.(false);
  }, [tela, onEmDrill]);
  // O JSON do banco (~1,5 MB) é carregado sob demanda (ver garantirBanco em
  // lib/banco.ts) só quando esta view monta — não faz parte do bundle
  // inicial do app. `area` começa vazio e é preenchido quando a carga
  // resolve (ver efeito abaixo).
  const [bancoPronto, setBancoPronto] = useState(false);
  const [area, setArea] = useState<string>("");
  const [modo, setModo] = useState<Modo>("todos");
  const [assunto, setAssunto] = useState<string>("");
  const [bloco, setBloco] = useState<string>("");
  // "" = todas as bancas; 0 = todos os anos — mesma convenção de área/matéria
  // "todas" já usada no resto do app.
  const [instituicao, setInstituicao] = useState<string>("");
  const [ano, setAno] = useState<number>(0);
  // Teto de texto para ler (ver TAMANHOS_TEXTO em lib/banco.ts) — não volta
  // a "Qualquer" ao trocar de área: é a situação de estudo, não do filtro.
  const [maxCaracteres, setMaxCaracteres] = useState<number>(0);
  // "" = os dois formatos; idem, não reseta ao trocar de área.
  const [formato, setFormato] = useState<"" | "mc" | "ce">("");
  const [quantidade, setQuantidade] = useState<number>(Q_POR_BLOCO);
  // Gerar comentário/explicações já na montagem do bloco, ou deixar para
  // sob demanda depois de responder — mesma ideia de GerarView. Preferência
  // única em Ajustes (ver lib/preferenciasGeracao.ts).
  const [comExplicacoes, setComExplicacoes] = useState(true);

  useEffect(() => {
    getComExplicacoesIA().then(setComExplicacoes);
  }, []);

  const [lotes, setLotes] = useState<(Questao[] | null)[]>([]);
  const [statusLote, setStatusLote] = useState<StatusSub[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [blocoId, setBlocoId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoAbandono, setConfirmandoAbandono] = useState(false);
  const [abandonando, setAbandonando] = useState(false);
  // Quantas questões deste bloco foram REALMENTE respondidas — questão
  // pulada ou nunca vista não é gravada nem contabilizada (ver
  // encerrarBloco/pularQuestao).
  const [respondidas, setRespondidas] = useState(0);
  // Soma do tempo de resposta do bloco — comparado ao tempo por questão da
  // prova no resultado (ver lib/prova.ts).
  const [tempoTotalMs, setTempoTotalMs] = useState(0);
  const [msAlvoProva, setMsAlvoProva] = useState<number | null>(null);
  // Explicação enxuta (QuestaoCard): bloco montado com teto de texto.
  const [enxuta, setEnxuta] = useState(false);
  const [rascunho, setRascunho] = useState<RascunhoBlocoBanco | null>(null);
  // A questão atual já foi respondida (gabarito revelado): o rascunho
  // retoma na seguinte, senão ela seria respondida e gravada duas vezes.
  const [respondeuAtual, setRespondeuAtual] = useState(false);
  // ids do banco fixo já respondidos em qualquer bloco anterior — usado para
  // priorizar questões inéditas (ver lib/banco.ts) e avisar quando o estoque
  // de inéditas do filtro atual está acabando.
  const [vistas, setVistas] = useState<Set<string>>(new Set());

  // Guarda a lista completa sorteada nesta rodada, para reenviar um lote que
  // falhou sem precisar sortear tudo de novo.
  const selecionadasRef = useRef<Questao[]>([]);
  // Área real de cada questão do bloco misto (mesma ordem de
  // `selecionadasRef`) — grava a resposta na área certa em vez de no rótulo
  // do bloco.
  const areasRef = useRef<string[]>([]);
  // Tópico gravado de cada questão — fixado ao montar o bloco, para não
  // depender do filtro da tela de configuração (que o rascunho não restaura).
  const topicosRef = useRef<string[]>([]);
  const materiaBlocoRef = useRef("");
  const misto = area === AREA_MISTA;

  useEffect(() => {
    garantirBanco().then(async () => {
      setBancoPronto(true);
      // Padrão sutil: abre já numa das 5 áreas com menos questões respondidas
      // (ver lib/materiaSugerida.ts), em vez de sempre a primeira da lista.
      const sugerida = await escolherMateriaSugerida(areasBanco());
      setArea((a) => a || sugerida || areasBanco()[0] || "");
    });
  }, []);

  useEffect(() => {
    setModo("todos");
    setAssunto("");
    setBloco("");
    setInstituicao("");
    setAno(0);
  }, [area]);

  useEffect(() => {
    if (tela === "config") {
      idsBancoRespondidos().then(setVistas).catch(() => setVistas(new Set()));
      getRascunhoBanco().then(setRascunho);
    }
  }, [tela]);

  // Bloco rápido pedido pelo atalho do ícone (lib/atalhos.ts): ao montar
  // (abertura a frio) ou já montada (app em segundo plano).
  const iniciarRapidoRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!bancoPronto) return;
    if (consumirBlocoRapido()) iniciarRapidoRef.current();
    return aoPedirBlocoRapido(() => {
      if (consumirBlocoRapido()) iniciarRapidoRef.current();
    });
  }, [bancoPronto]);

  // Prepara o próximo bloco rápido enquanto há rede (ver lib/blocoRapido.ts).
  const preparandoRef = useRef(false);
  useEffect(() => {
    if (!bancoPronto || tela !== "config") return;
    void prepararBlocoRapido(new Set());
  }, [bancoPronto, tela, comExplicacoes]);

  // Rascunho: grava a cada avanço do drill (lote recebido, resposta).
  useEffect(() => {
    if (tela !== "drill" || !selecionadasRef.current.length) return;
    const questoes = selecionadasRef.current.map((q, i) => lotes[Math.floor(i / LOTE)]?.[i % LOTE] ?? q);
    void salvarRascunhoBanco({
      questoes,
      areas: areasRef.current,
      topicos: topicosRef.current,
      lotesProntos: statusLote.map((st) => st === "ok"),
      materia: materiaBlocoRef.current,
      qIdx: respondeuAtual ? qIdx + 1 : qIdx,
      acertos,
      respondidas,
      tempoTotalMs,
      blocoId,
      enxuta,
    });
  }, [tela, lotes, statusLote, qIdx, respondeuAtual, acertos, respondidas, tempoTotalMs, blocoId, enxuta]);

  useEffect(() => setRespondeuAtual(false), [qIdx]);

  // `disponiveis`/`filtro` entram nas deps do efeito abaixo — precisam ser
  // calculados incondicionalmente, ANTES do `if (!bancoPronto)` mais abaixo,
  // senão este useEffect deixaria de ser chamado no primeiro render (banco
  // ainda carregando) e passaria a ser chamado depois que `bancoPronto` virar
  // true, violando a regra de hooks (mesmo número de hooks em toda renderização).
  const proveniencia = {
    ...(instituicao ? { instituicao } : {}),
    ...(ano ? { ano } : {}),
    ...(maxCaracteres ? { maxCaracteres } : {}),
    ...(formato ? { formato } : {}),
  };
  const filtroMisto: FiltroBanco = {
    modo: "todos",
    ...(maxCaracteres ? { maxCaracteres } : {}),
    ...(formato ? { formato } : {}),
  };
  const filtro: FiltroBanco =
    modo === "aula" && assunto
      ? { modo: "aula", assunto, ...proveniencia }
      : modo === "bloco" && bloco
        ? { modo: "bloco", bloco, ...proveniencia }
        : { modo: "todos", ...proveniencia };

  const disponiveis = misto
    ? areasBanco().reduce((s, a) => s + contarDisponiveis(a, filtroMisto), 0)
    : contarDisponiveis(area, filtro);
  const ineditas = misto
    ? areasBanco().reduce((s, a) => s + contarIneditas(a, filtroMisto, vistas), 0)
    : contarIneditas(area, filtro, vistas);

  useEffect(() => {
    if (disponiveis > 0) setQuantidade((q) => Math.min(q, disponiveis));
  }, [disponiveis]);

  if (!bancoPronto) {
    return <Vazio>Carregando banco de questões…</Vazio>;
  }
  if (!areasBanco().length) {
    return <Vazio>Banco de questões vazio ou não encontrado.</Vazio>;
  }

  /**
   * Antes de chamar a API, consulta o cache local (banco_id → comentário já
   * gerado, ver lib/repo.ts) — relevante porque o banco tem só ~1100
   * questões e, esgotado o estoque de inéditas de uma área, a mesma questão
   * real volta a ser sorteada e não precisa gerar a mesma explicação de novo.
   * Uma explicação já em cache aparece de graça mesmo com o toggle
   * `comExplicacoes` desligado — só a geração de uma explicação NOVA é que
   * respeita o toggle. Questões que saem sem explicação (cache ausente e
   * toggle desligado, ou sem chave de API) ficam com comentario/
   * explicacoes_erradas vazios — QuestaoCard oferece pedir a explicação sob
   * demanda depois de respondida.
   */
  async function dispararLote(i: number, todas: Questao[], nLotes: number) {
    const fatia = todas.slice(i * LOTE, i * LOTE + LOTE);
    if (!fatia.length) return;
    setStatusLote((st) => st.map((v, k) => (k === i ? "carregando" : v)));
    setErro(null);
    try {
      const idsComCache = fatia.map((q) => q.bancoId).filter((id): id is string => !!id);
      const cache = await buscarExplicacoesBanco(idsComCache);

      const semCache = fatia.filter((q) => !q.bancoId || !cache.has(q.bancoId));
      let geradas: Questao[] = [];
      if (comExplicacoes) {
        try {
          geradas = semCache.length ? await gerarExplicacoes(semCache) : [];
        } catch (e) {
          // Sem chave de API: a 4ª forma de montar bloco não depende dela
          // para funcionar (as questões já são reais, vêm prontas do banco)
          // — só o comentário/explicações ficam sem gerar, em vez de travar
          // o bloco inteiro com um erro.
          // Sem rede (academia, metrô): idem — segue sem explicação nova,
          // só com o que já estava no cache (ver lib/blocoRapido.ts).
          if (!(e instanceof SemCredencialError) && navigator.onLine) throw e;
        }
      }
      const geradasPorId = new Map(geradas.map((q) => [q.bancoId, q]));

      const qs = fatia.map((q) => {
        const doCache = q.bancoId ? cache.get(q.bancoId) : undefined;
        if (doCache) return { ...q, ...doCache };
        return (q.bancoId && geradasPorId.get(q.bancoId)) || q;
      });

      const novasParaCache = geradas
        .filter((q): q is Questao & { bancoId: string } => !!q.bancoId)
        .map((q) => ({
          bancoId: q.bancoId,
          comentario: q.comentario,
          explicacoes_erradas: q.explicacoes_erradas,
        }));
      if (novasParaCache.length) salvarExplicacoesBanco(novasParaCache).catch((e) => console.error("cache explicações", e));

      setLotes((l) => l.map((v, k) => (k === i ? qs : v)));
      setStatusLote((st) => st.map((v, k) => (k === i ? "ok" : v)));
      if (i < nLotes - 1) dispararLote(i + 1, todas, nLotes);
    } catch (e: unknown) {
      setStatusLote((st) => st.map((v, k) => (k === i ? "erro" : v)));
      setErro(e instanceof Error ? e.message : "Falha ao gerar explicações.");
    }
  }

  /** Bloco do dia: reparte `n` entre as áreas por peso × fraqueza e
   * intercala as questões (a1, b1, c1, a2…), como na prova real. */
  async function selecionarMisto(
    n: number,
    filtroAreas: FiltroBanco = filtroMisto,
    jaVistas: ReadonlySet<string> = vistas,
  ): Promise<{ questao: Questao; area: string }[]> {
    const [pesosEdital, acertoPorArea] = await Promise.all([getPesosEdital(), resumoPorMateria(null)]);
    const acerto = new Map(acertoPorArea.map((f) => [f.chave, f]));
    const distribuicao = distribuirBlocoMisto(
      areasBanco().map((a) => ({
        area: a,
        peso: pesoDe(pesosEdital, a),
        acertos: acerto.get(a)?.acertos ?? 0,
        total: acerto.get(a)?.total ?? 0,
        disponiveis: contarDisponiveis(a, filtroAreas),
      })),
      n,
    );
    const grupos = await Promise.all(
      [...distribuicao.entries()].map(async ([a, k]) => {
        let pesosAssunto: Map<string, number> | undefined;
        try {
          pesosAssunto = pesosPorAssunto(pontuarAssuntos(a, await pontosPorConceito(a)));
        } catch (e) {
          console.error("direcionar assunto por pontuação", e);
        }
        return selecionarQuestoes(a, filtroAreas, k, jaVistas, pesosAssunto).map((qb) => ({
          questao: questaoBancoParaQuestao(qb),
          area: a,
        }));
      }),
    );
    return intercalar(grupos);
  }

  async function iniciar() {
    const n = Math.min(quantidade, disponiveis);
    if (n <= 0) return;
    if (misto) {
      const itens = await selecionarMisto(n);
      if (!itens.length) return;
      const areas = itens.map((i) => i.area);
      await comecarBloco(
        itens.map((i) => i.questao),
        MATERIA_MISTA,
        `Bloco do dia: ${[...new Set(areas)].join(", ")}`,
        areas,
        areas,
        maxCaracteres > 0,
      );
      return;
    }

    // Direciona a amostragem para os assuntos mais fracos (ver
    // pontuarAssuntos/pesosPorAssunto em lib/banco.ts) sempre que o filtro
    // cobre mais de um assunto ("Todos os assuntos"/"Bloco de aulas") — não
    // restringe a quantidade disponível, só reordena a prioridade do sorteio.
    let pesos: Map<string, number> | undefined;
    try {
      const linhas = await pontosPorConceito(area);
      pesos = pesosPorAssunto(pontuarAssuntos(area, linhas));
    } catch (e) {
      console.error("direcionar assunto por pontuação", e);
    }

    const selecionadas = selecionarQuestoes(area, filtro, n, vistas, pesos).map(questaoBancoParaQuestao);
    const topico = descricaoFiltroBanco(area, filtro);
    await comecarBloco(
      selecionadas,
      area,
      topico,
      selecionadas.map(() => area),
      selecionadas.map(() => topico),
      maxCaracteres > 0,
    );
  }

  /**
   * Sorteia e guarda o próximo bloco rápido, com as explicações já no cache
   * quando há rede e o toggle de explicações está ligado — é o que deixa o
   * bloco rápido completo mesmo offline (ver lib/blocoRapido.ts). Não faz
   * nada se já houver um preparado ainda válido.
   */
  async function prepararBlocoRapido(excluir: ReadonlySet<string>) {
    if (preparandoRef.current) return;
    preparandoRef.current = true;
    try {
      const respondidos = await idsBancoRespondidos();
      const pronto = await getBlocoRapidoPronto();
      if (pronto?.length && pronto.every((id) => !respondidos.has(id) && !excluir.has(id) && !ehInviavel(id))) {
        return;
      }
      const evitar = new Set([...respondidos, ...excluir]);
      const itens = await selecionarMisto(Q_BLOCO_RAPIDO, filtroRapido, evitar);
      const ids = itens.map((i) => i.questao.bancoId).filter((id): id is string => !!id);
      if (!ids.length) return;
      if (comExplicacoes && navigator.onLine) {
        const cache = await buscarExplicacoesBanco(ids);
        const semCache = itens.map((i) => i.questao).filter((q) => q.bancoId && !cache.has(q.bancoId));
        if (semCache.length) {
          try {
            const geradas = await gerarExplicacoes(semCache);
            await salvarExplicacoesBanco(
              geradas
                .filter((q): q is Questao & { bancoId: string } => !!q.bancoId)
                .map((q) => ({ bancoId: q.bancoId, comentario: q.comentario, explicacoes_erradas: q.explicacoes_erradas })),
            );
          } catch (e) {
            // Sem chave/rede: o bloco fica preparado só com as questões.
            if (!(e instanceof SemCredencialError)) console.error("preparar bloco rápido", e);
          }
        }
      }
      await setBlocoRapidoPronto(ids);
    } catch (e) {
      console.error("preparar bloco rápido", e);
    } finally {
      preparandoRef.current = false;
    }
  }

  /** Inicia o bloco rápido: usa o preparado (explicações em cache, funciona
   * offline) ou, sem ele, sorteia na hora. Prepara o seguinte em seguida. */
  async function iniciarRapido() {
    const respondidos = await idsBancoRespondidos().catch(() => new Set<string>());
    const pronto = ((await getBlocoRapidoPronto()) ?? [])
      .filter((id) => !respondidos.has(id) && !ehInviavel(id))
      .map((id) => buscarQuestaoBanco(id))
      .filter((q): q is NonNullable<typeof q> => !!q);
    const itens =
      pronto.length >= Q_BLOCO_RAPIDO
        ? pronto.map((q) => ({ questao: questaoBancoParaQuestao(q), area: q.area }))
        : await selecionarMisto(Q_BLOCO_RAPIDO, filtroRapido, respondidos);
    if (!itens.length) return;
    await setBlocoRapidoPronto(null);
    const areas = itens.map((i) => i.area);
    await comecarBloco(
      itens.map((i) => i.questao),
      MATERIA_MISTA,
      `Bloco rápido: ${[...new Set(areas)].join(", ")}`,
      areas,
      areas,
      true,
    );
    void prepararBlocoRapido(new Set(itens.map((i) => i.questao.bancoId ?? "")));
  }
  iniciarRapidoRef.current = () => {
    // Bloco em andamento continua: o atalho não descarta o que está aberto.
    if (tela === "config") void iniciarRapido();
  };

  async function comecarBloco(
    selecionadas: Questao[],
    materiaBloco: string,
    topico: string,
    areas: string[],
    topicos: string[],
    comTetoTexto: boolean,
  ) {
    const nLotes = Math.ceil(selecionadas.length / LOTE);
    areasRef.current = areas;
    topicosRef.current = topicos;
    materiaBlocoRef.current = materiaBloco;
    setEnxuta(comTetoTexto);
    setTempoTotalMs(0);
    setRascunho(null);
    setRespondeuAtual(false);

    setLotes(Array.from({ length: nLotes }, () => null));
    setStatusLote(Array.from({ length: nLotes }, () => "idle"));
    setQIdx(0);
    setTotalQuestoes(selecionadas.length);
    setAcertos(0);
    setRespondidas(0);
    setErro(null);
    setConfirmandoAbandono(false);
    setTela("drill");

    try {
      setBlocoId(
        await criarBloco(
          // "misto": o banco real tem questões de múltipla escolha E de
          // Certo/Errado (ver questaoBancoParaQuestao em lib/banco.ts), e o
          // filtro pode trazer as duas no mesmo bloco. `nivel: 0` marca o
          // bloco como "do banco" na lista de blocos recentes — não é o
          // nível das questões, que é NIVEL_BANCO.
          { materia: materiaBloco, materiaCustom: "", topico, tipos: [], formato: "misto", nivel: 0 },
          selecionadas.length,
        ),
      );
    } catch (e) {
      console.error("criar bloco do banco", e);
      setBlocoId(null);
    }

    selecionadasRef.current = selecionadas;
    dispararLote(0, selecionadas, nLotes);
  }

  const loteAtual = Math.floor(qIdx / LOTE);
  const questao = lotes[loteAtual]?.[qIdx % LOTE] ?? null;
  const ultimaDoBloco = qIdx === totalQuestoes - 1;
  // No bloco misto cada questão é de uma área; o tópico gravado é a área.
  const areaAtual = areasRef.current[qIdx] ?? area;
  const topicoAtual = topicosRef.current[qIdx] ?? areaAtual;

  async function responder(
    letra: string,
    acertou: boolean,
    tempoMs: number,
    confianca: Confianca | null,
  ): Promise<number | null> {
    if (acertou) setAcertos((a) => a + 1);
    setRespondidas((n) => n + 1);
    setTempoTotalMs((t) => t + tempoMs);
    setRespondeuAtual(true);
    if (!questao) return null;
    return gravarResposta({
      blocoId,
      materia: areaAtual,
      topico: topicoAtual,
      // Questão de prova real conta como nível 5 (ver NIVEL_BANCO em
      // lib/banco.ts): já é o formato final cobrado por banca, sem a
      // gradação didática dos níveis 1–4 da geração por IA. O `nivel` do
      // BLOCO continua 0 — é o que distingue "bloco do banco" de "bloco
      // gerado" na lista de blocos recentes (ver GerarView).
      nivel: NIVEL_BANCO,
      questao,
      resposta: letra,
      acertou,
      tempoMs,
      confianca,
    });
  }

  async function proxima() {
    if (ultimaDoBloco) {
      await gravarFechamento();
      setTela("resultado");
      return;
    }
    setQIdx(qIdx + 1);
  }

  /** Fecha a linha do bloco com o que foi respondido de fato: `total_questoes`
   * vira o número de respondidas (questão pulada ou não alcançada não conta
   * em lugar nenhum) e a aprovação é medida sobre elas. */
  async function gravarFechamento() {
    void limparRascunhoBanco();
    getProvaAlvo()
      .then((p) => setMsAlvoProva(msPorQuestaoNaProva(p)))
      .catch(() => setMsAlvoProva(null));
    if (blocoId == null) return;
    try {
      if (respondidas !== totalQuestoes) {
        await atualizarTotalQuestoesBloco(blocoId, respondidas);
      }
      await fecharBloco(blocoId, [acertos], aprovadoNoBloco(acertos, respondidas));
    } catch (e) {
      console.error("fechar bloco do banco", e);
    }
  }

  /**
   * Encerra o bloco onde estiver. O que faltava NÃO é gravado de forma
   * alguma: não conta em estatística, não aparece em "Refazer" e as questões
   * seguem inéditas para blocos futuros (ver `vistas`/idsBancoRespondidos).
   */
  async function encerrarBloco() {
    setAbandonando(true);
    try {
      await gravarFechamento();
    } finally {
      setAbandonando(false);
      setConfirmandoAbandono(false);
      setTela(respondidas > 0 ? "resultado" : "config");
    }
  }

  /** Retoma o bloco do rascunho (app fechado no meio do drill): os lotes que
   * faltavam voltam a pedir explicação a partir do primeiro pendente. */
  function continuarRascunho(r: RascunhoBlocoBanco) {
    // Parou depois de responder a última: só falta fechar o bloco.
    if (r.qIdx >= r.questoes.length) {
      descartarRascunho();
      return;
    }
    const nLotes = Math.ceil(r.questoes.length / LOTE);
    const novosLotes = Array.from({ length: nLotes }, (_, i) =>
      r.lotesProntos[i] ? r.questoes.slice(i * LOTE, i * LOTE + LOTE) : null,
    );
    const status: StatusSub[] = novosLotes.map((l) => (l ? "ok" : "idle"));
    selecionadasRef.current = r.questoes;
    areasRef.current = r.areas;
    topicosRef.current = r.topicos;
    materiaBlocoRef.current = r.materia;
    setLotes(novosLotes);
    setStatusLote(status);
    setQIdx(r.qIdx);
    setTotalQuestoes(r.questoes.length);
    setAcertos(r.acertos);
    setRespondidas(r.respondidas);
    setTempoTotalMs(r.tempoTotalMs);
    setBlocoId(r.blocoId);
    setEnxuta(r.enxuta);
    setErro(null);
    setConfirmandoAbandono(false);
    setRascunho(null);
    setTela("drill");
    const primeiroPendente = status.indexOf("idle");
    if (primeiroPendente >= 0) dispararLote(primeiroPendente, r.questoes, nLotes);
  }

  function descartarRascunho() {
    const r = rascunho;
    setRascunho(null);
    void limparRascunhoBanco();
    // Fecha a linha do bloco com o que foi respondido, como no encerrar.
    if (r?.blocoId != null) {
      const fechar = async () => {
        if (r.respondidas !== r.questoes.length) await atualizarTotalQuestoesBloco(r.blocoId!, r.respondidas);
        await fecharBloco(r.blocoId!, [r.acertos], aprovadoNoBloco(r.acertos, r.respondidas));
      };
      fechar().catch((e) => console.error("fechar bloco descartado", e));
    }
  }

  /** Pula a questão atual sem gravar nada — mesma regra de `encerrarBloco`. */
  function pularQuestao() {
    if (ultimaDoBloco) {
      void encerrarBloco();
      return;
    }
    setQIdx(qIdx + 1);
  }

  /* ---------- CONFIG ---------- */
  if (tela === "config") {
    return (
      <div>
        {rascunho && (
          <div style={{ ...cartao, background: C.canetaSoft, borderColor: C.caneta, marginBottom: 18 }}>
            <div style={{ ...mono, fontSize: 11, color: C.caneta, letterSpacing: 0.8, marginBottom: 6 }}>
              BLOCO EM ANDAMENTO
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: "0 0 12px" }}>
              Bloco de <strong>{rascunho.materia === MATERIA_MISTA ? "várias áreas" : rascunho.materia}</strong>{" "}
              parado na questão {Math.min(rascunho.qIdx + 1, rascunho.questoes.length)}/{rascunho.questoes.length}.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <Botao tipo="fantasma" onClick={descartarRascunho} style={{ flex: 1 }}>
                Descartar
              </Botao>
              <Botao tipo="tinta" onClick={() => continuarRascunho(rascunho)} style={{ flex: 1 }}>
                Continuar
              </Botao>
            </div>
          </div>
        )}

        <Botao tipo="fantasma" onClick={() => void iniciarRapido()} style={{ marginBottom: 18 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <BoltIcon width={16} height={16} strokeWidth={1.8} />
            Bloco rápido · {Q_BLOCO_RAPIDO} questões curtíssimas
          </span>
        </Botao>

        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Área</label>
          <select style={campo} value={area} onChange={(e) => setArea(e.target.value)}>
            <option value={AREA_MISTA}>Bloco do dia — várias áreas (edital × fraqueza)</option>
            {areasBanco().map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {misto ? (
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5, margin: "-8px 0 18px" }}>
            Mistura áreas do banco, sorteadas pelo peso no edital (Ajustes) × seu erro em cada uma,
            e intercala as questões como na prova real.
          </div>
        ) : (
        <>
        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Assunto</label>
          <Segmented
            valor={modo}
            opcoes={[
              { id: "aula" as Modo, label: "Aula específica" },
              { id: "bloco" as Modo, label: "Bloco de aulas" },
              { id: "todos" as Modo, label: "Todos os assuntos" },
            ]}
            onChange={setModo}
          />
          {modo === "aula" && (
            <select
              style={{ ...campo, marginTop: 8 }}
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
            >
              <option value="">Selecione uma aula…</option>
              {assuntosDeArea(area).map((a) => (
                <option key={a.assunto} value={a.assunto}>
                  {a.assunto} ({a.total})
                </option>
              ))}
            </select>
          )}
          {modo === "bloco" && (
            <select
              style={{ ...campo, marginTop: 8 }}
              value={bloco}
              onChange={(e) => setBloco(e.target.value)}
            >
              <option value="">Selecione um bloco…</option>
              {blocosDeArea(area).map((b) => (
                <option key={b.bloco} value={b.bloco}>
                  {b.bloco} ({b.total})
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label style={rotulo}>Banca (opcional)</label>
            <select style={campo} value={instituicao} onChange={(e) => setInstituicao(e.target.value)}>
              <option value="">Todas as bancas</option>
              {instituicoesDeArea(area).map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <label style={rotulo}>Ano (opcional)</label>
            <select style={campo} value={ano} onChange={(e) => setAno(Number(e.target.value))}>
              <option value={0}>Todos os anos</option>
              {anosDeArea(area).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        </>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Tamanho do texto</label>
          <Segmented
            valor={maxCaracteres}
            opcoes={TAMANHOS_TEXTO.map((t) => ({ id: t.id as number, label: t.label }))}
            onChange={setMaxCaracteres}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={rotulo}>Formato</label>
          <Segmented
            valor={formato}
            opcoes={FORMATOS_BANCO.map((f) => ({ id: f.id as "" | "mc" | "ce", label: f.label }))}
            onChange={setFormato}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={rotulo}>Quantidade de questões</label>
          <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
            <button
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              disabled={quantidade <= 1}
              aria-label="Diminuir quantidade"
              style={stepperBotaoStyle(quantidade <= 1)}
            >
              −
            </button>
            <div
              style={{
                ...campo,
                ...disp,
                flex: 1,
                textAlign: "center",
                fontSize: 18,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Math.min(quantidade, disponiveis || quantidade)}
            </div>
            <button
              onClick={() => setQuantidade((q) => Math.min(disponiveis || 1, q + 1))}
              disabled={quantidade >= disponiveis}
              aria-label="Aumentar quantidade"
              style={stepperBotaoStyle(quantidade >= disponiveis)}
            >
              +
            </button>
          </div>
          <div style={{ ...mono, fontSize: 11, color: C.sub, marginTop: 5 }}>
            {disponiveis} {disponiveis === 1 ? "questão disponível" : "questões disponíveis"} neste
            filtro
            {disponiveis > 0 && (
              <>
                {" · "}
                <span style={{ color: ineditas > 0 ? C.ok : C.caneta }}>
                  {ineditas} inédita{ineditas === 1 ? "" : "s"}
                </span>
              </>
            )}
            .
          </div>
          {disponiveis > 0 && ineditas === 0 && (
            <div style={{ fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>
              Você já respondeu todas as questões deste filtro — o bloco vai repetir questões já
              vistas, sorteadas de novo.
            </div>
          )}
        </div>

        <Botao onClick={iniciar} tipo="tinta" disabled={disponiveis === 0}>
          Gerar bloco do banco{disponiveis ? ` (${Math.min(quantidade, disponiveis)} questões)` : ""}
        </Botao>
      </div>
    );
  }

  /* ---------- DRILL ---------- */
  if (tela === "drill") {
    const st = statusLote[loteAtual];
    return (
      <div>
        <Rail
          atual={qIdx}
          total={totalQuestoes}
          onSair={() => setConfirmandoAbandono(true)}
        />

        {st === "erro" && (
          <div
            style={{
              background: C.erroSoft,
              border: `1.5px solid ${C.erro}`,
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 10, fontSize: 14, lineHeight: 1.5 }}>
              {erro ?? "Falha ao gerar explicações."}
            </div>
            <Botao
              onClick={() => dispararLote(loteAtual, selecionadasRef.current, statusLote.length)}
              tipo="tinta"
              style={{ maxWidth: 240, margin: "0 auto" }}
            >
              Tentar de novo
            </Botao>
          </div>
        )}

        {(st === "carregando" || st === "idle") && <EsqueletoQuestao />}

        {st === "ok" && questao && (
          <QuestaoCard
            key={qIdx}
            questao={questao}
            materia={areaAtual}
            tagAssunto={gerarTagAssunto(topicoAtual)}
            assunto={topicoAtual}
            origem="banco"
            labelProxima={ultimaDoBloco ? "Ver resultado" : "Próxima questão"}
            onResponder={responder}
            onPular={pularQuestao}
            onProxima={proxima}
            explicacaoEnxuta={enxuta}
          />
        )}

        {confirmandoAbandono ? (
          <div
            style={{
              marginTop: 18,
              background: C.erroSoft,
              border: `1.5px solid ${C.erro}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 10 }}>
              Encerrar este bloco agora? As questões já respondidas ficam gravadas; as que
              faltam não são contabilizadas — não entram em estatísticas nem em "Refazer", e
              continuam inéditas para blocos futuros.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Botao
                tipo="fantasma"
                onClick={() => setConfirmandoAbandono(false)}
                disabled={abandonando}
                style={{ background: C.card }}
              >
                Cancelar
              </Botao>
              <Botao
                onClick={encerrarBloco}
                disabled={abandonando}
                style={{ background: C.erro, borderColor: C.erro }}
              >
                {abandonando ? "Encerrando…" : "Encerrar bloco"}
              </Botao>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  /* ---------- RESULTADO ---------- */
  const passou = aprovadoNoBloco(acertos, respondidas);
  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
        <div style={{ ...mono, fontSize: 12, color: C.sub, letterSpacing: 1 }}>
          RESULTADO DO BLOCO
        </div>
        <div
          style={{
            ...disp,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: -2,
            color: passou ? C.ok : C.ink,
          }}
        >
          {acertos}
          <span style={{ fontSize: 28, color: C.sub, fontWeight: 600 }}>/{respondidas}</span>
        </div>
        {respondidas > 0 && (
          <div style={{ ...mono, fontSize: 12, color: C.sub, marginTop: 4 }}>
            <span
              style={{
                color: msAlvoProva == null ? C.sub : tempoTotalMs / respondidas <= msAlvoProva ? C.ok : C.erro,
                fontWeight: 600,
              }}
            >
              {segundosLegiveis(tempoTotalMs / respondidas)} por questão
            </span>
            {msAlvoProva != null && ` · prova: ${segundosLegiveis(msAlvoProva)}`}
          </div>
        )}
      </div>

      <Botao tipo="tinta" onClick={() => setTela("config")} style={{ marginTop: 16 }}>
        Gerar outro bloco do banco
      </Botao>
    </div>
  );
}

/** "1min 24s" / "38s". */
function segundosLegiveis(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}min ${s % 60}s` : `${s}s`;
}

function stepperBotaoStyle(desabilitado: boolean) {
  return {
    ...disp,
    width: 48,
    fontSize: 22,
    fontWeight: 700,
    borderRadius: 8,
    border: `1.5px solid ${C.line}`,
    background: C.card,
    color: C.ink,
    cursor: desabilitado ? "default" : "pointer",
    opacity: desabilitado ? 0.4 : 1,
  } as const;
}
