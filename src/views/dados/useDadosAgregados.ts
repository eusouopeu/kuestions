/**
 * Todo o carregamento e a agregação da aba Dados, tirados de DadosTab.tsx —
 * que juntava três responsabilidades num arquivo só (buscar, calcular e
 * desenhar). Aqui fica a primeira: recebe os filtros da tela e devolve os
 * dados prontos. O desenho está em ./graficos.tsx.
 *
 * Recarrega quando o filtro muda E quando a aba é reaberta — a aba fica
 * montada entre trocas (ver App.tsx), então sem isto um bloco respondido em
 * outra aba não apareceria aqui sem um refresh manual.
 */
import { useCallback, useEffect, useState } from "react";
import {
  atividadePorDia,
  distribuicaoCaixaLeitner,
  materiasComDados,
  porConceito,
  porConfianca,
  porFormato,
  porNivel,
  porTipo,
  questoesPorTopico,
  resumo,
  resumoConfianca,
  resumoConfiancaPorMateria,
  resumoCusto,
  resumoLentidao,
  resumoPorMateria,
  serieBlocos,
  streakDias,
  tempoMedioGeral,
  tempoPorMateria,
  topicosPraticados,
  listarSimulados,
  idsBancoRespondidos,
  porCausaErro,
  questoesPorMateriaRecentes,
  respostasComTexto,
  respostasDoBanco,
  totalRespondidas,
  type CalibracaoMateria,
  type Fatia,
  type FatiaTempo,
  type RegistroSimulado,
  type Resumo,
  type ResumoConfianca,
  type ResumoCusto,
  type ResumoLentidao,
} from "../../lib/repo";
import { getPesosEdital, type PesosEdital } from "../../lib/edital";
import { getTetoMensal } from "../../lib/custo";
import { getProvaAlvo, type ProvaAlvo } from "../../lib/prova";
import {
  areasBanco,
  buscarQuestaoBanco,
  caracteresDaQuestao,
  contarIneditas,
  garantirBanco,
  TETO_CURTISSIMO,
  TETO_CURTO,
} from "../../lib/banco";
import { bancaDe } from "../../lib/bancas";
import {
  coberturaTopicos,
  desempenhoPorTopico,
  MATERIAS_COM_TOPICOS,
  type DesempenhoTopico,
  type TopicoEspecifico,
} from "../../lib/topicos";

/** Janela do calendário de sequência (heatmap) — 20 semanas. */
export const DIAS_HEATMAP = 140;

/** Janela do cartão "Tempo × edital". */
export const DIAS_ALOCACAO = 30;

/** Acerto por banca a partir das respostas a questões do banco fixo — a
 * banca vem de lib/bancas.ts (precisa do banco carregado). */
function agruparPorBanca(linhas: { bancoId: string; acertou: boolean }[]): Fatia[] {
  const mapa = new Map<string, { total: number; acertos: number }>();
  for (const l of linhas) {
    const q = buscarQuestaoBanco(l.bancoId);
    if (!q) continue;
    const b = bancaDe(q);
    const atual = mapa.get(b) ?? { total: 0, acertos: 0 };
    atual.total++;
    if (l.acertou) atual.acertos++;
    mapa.set(b, atual);
  }
  return [...mapa.entries()]
    .map(([chave, v]) => ({ chave, ...v, pct: Math.round((v.acertos / v.total) * 100) }))
    .sort((a, b) => b.total - a.total);
}

/** Faixas do cartão "Acerto por tamanho do texto" — os mesmos tetos do
 * seletor "Tamanho do texto" do bloco do banco. */
const FAIXAS_TAMANHO = [
  { chave: `Curtíssima ≤${TETO_CURTISSIMO}`, ate: TETO_CURTISSIMO },
  { chave: `Curta ≤${TETO_CURTO}`, ate: TETO_CURTO },
  { chave: "Média ≤1.200", ate: 1200 },
  { chave: "Longa", ate: Infinity },
];

function agruparPorTamanho(
  linhas: { enunciado: string; alternativas: string[] | null; bancoId?: string; acertou: boolean }[],
): Fatia[] {
  const contagem = FAIXAS_TAMANHO.map(() => ({ total: 0, acertos: 0 }));
  for (const l of linhas) {
    const n = caracteresDaQuestao(l);
    const i = FAIXAS_TAMANHO.findIndex((f) => n <= f.ate);
    contagem[i].total++;
    if (l.acertou) contagem[i].acertos++;
  }
  return FAIXAS_TAMANHO.map((f, i) => ({
    chave: f.chave,
    ...contagem[i],
    pct: contagem[i].total ? Math.round((contagem[i].acertos / contagem[i].total) * 100) : 0,
  })).filter((f) => f.total > 0);
}

export function useDadosAgregados({
  ativa,
  /** null = agrega todas as matérias; uma string = filtra estritamente. */
  materia,
  /** null = todos os níveis. */
  nivel,
}: {
  ativa: boolean;
  materia: string | null;
  nivel: number | null;
}) {
  const [materias, setMaterias] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [res, setRes] = useState<Resumo | null>(null);
  const [serie, setSerie] = useState<{ i: number; pct: number }[]>([]);
  const [niveis, setNiveis] = useState<Fatia[]>([]);
  const [tipos, setTipos] = useState<Fatia[]>([]);
  const [formatos, setFormatos] = useState<Fatia[]>([]);
  const [confiancas, setConfiancas] = useState<Fatia[]>([]);
  const [caixaLeitner, setCaixaLeitner] = useState<Fatia[]>([]);
  const [atividade, setAtividade] = useState<{ data: string; total: number }[]>([]);
  const [conceitos, setConceitos] = useState<Fatia[]>([]);
  const [streak, setStreak] = useState<{ atual: number; recorde: number; hoje: boolean } | null>(
    null,
  );
  const [cobertura, setCobertura] = useState<{
    praticados: TopicoEspecifico[];
    pendentes: TopicoEspecifico[];
  } | null>(null);
  const [heatmap, setHeatmap] = useState<DesempenhoTopico[] | null>(null);
  // Base da nota provável (acerto por matéria + pesos REAIS configurados em
  // Ajustes) separada do resultado final — o dropdown de simulação da tela
  // recalcula a nota (função pura) trocando só os pesos, sem consultar o
  // banco de novo nem gravar nada.
  const [porMateriaNota, setPorMateriaNota] = useState<Fatia[] | null>(null);
  const [pesosReais, setPesosReais] = useState<PesosEdital>({});
  const [tempoGeral, setTempoGeral] = useState<{ tempoMedioMs: number; amostras: number } | null>(
    null,
  );
  const [tempoMaterias, setTempoMaterias] = useState<FatiaTempo[]>([]);
  // Calibração de confiança (ver resumoConfianca em repo.ts) e gasto de API
  // (ver lib/custo.ts) — nenhum dos dois é filtrado por nível: um é sobre o
  // hábito de autoavaliação, o outro é dinheiro da conta, não desempenho.
  const [confiancaResumo, setConfiancaResumo] = useState<ResumoConfianca | null>(null);
  // Calibração de confiança por matéria (ver resumoConfiancaPorMateria em
  // repo.ts) — só faz sentido na visão agregada ("todas"), onde comparar o
  // excesso de confiança entre matérias é o ponto (mesmo critério de
  // porMateriaNota, que também só existe com m === null).
  const [calibracaoPorMateria, setCalibracaoPorMateria] = useState<CalibracaoMateria[]>([]);
  const [custo, setCusto] = useState<ResumoCusto | null>(null);
  // Acerto lento (ver resumoLentidao em repo.ts) — o problema que o placar
  // conta como acerto.
  const [lentidao, setLentidao] = useState<ResumoLentidao | null>(null);
  const [teto, setTeto] = useState(0);
  // Histórico de simulados (ver repo/simulados.ts) — não é filtrado por
  // matéria/nível, cada prova já mistura várias áreas; carrega junto com
  // `materias`, uma vez por ativação da aba.
  const [simulados, setSimulados] = useState<RegistroSimulado[]>([]);
  const [causasErro, setCausasErro] = useState<{ fatias: Fatia[]; naoClassificadas: number }>({
    fatias: [],
    naoClassificadas: 0,
  });
  const [bancas, setBancas] = useState<Fatia[]>([]);
  const [porTamanho, setPorTamanho] = useState<Fatia[]>([]);
  // Ritmo/prova/alocação: não filtrados por matéria/nível (constância e
  // planejamento do estudo como um todo, como a sequência).
  const [alocacaoRecente, setAlocacaoRecente] = useState<Record<string, number>>({});
  const [prova, setProva] = useState<ProvaAlvo>({ data: null, metaQuestoes: null, minutosPorQuestao: null });
  const [feitasTotal, setFeitasTotal] = useState(0);
  const [ineditasBanco, setIneditasBanco] = useState<number | null>(null);
  const [areasDoBanco, setAreasDoBanco] = useState<string[]>([]);

  useEffect(() => {
    if (ativa) materiasComDados().then(setMaterias).catch(() => setMaterias([]));
  }, [ativa]);

  useEffect(() => {
    if (ativa) listarSimulados().then(setSimulados).catch(() => setSimulados([]));
  }, [ativa]);

  const carregar = useCallback(() => {
    const m = materia;
    const n = nivel;
    setCarregando(true);
    Promise.all([
      resumo(m, n),
      serieBlocos(m),
      porNivel(m),
      porTipo(m, n),
      porFormato(m, n),
      porConceito(m, n),
      porConfianca(m, n),
      distribuicaoCaixaLeitner(m),
      streakDias(),
      atividadePorDia(DIAS_HEATMAP),
      tempoMedioGeral(m),
      tempoPorMateria(),
      resumoConfianca(m),
      resumoLentidao(m),
      resumoCusto(),
      getTetoMensal(),
      // Nota estimada e calibração por matéria só fazem sentido na visão agregada.
      m === null ? Promise.all([resumoPorMateria(n), getPesosEdital()]) : Promise.resolve(null),
      m === null ? resumoConfiancaPorMateria() : Promise.resolve([]),
      porCausaErro(m, n),
      questoesPorMateriaRecentes(DIAS_ALOCACAO),
      getProvaAlvo(),
      totalRespondidas(),
    ])
      .then(([r, s, ni, ti, fo, co, cf, caixa, st, at, tg, tm, conf, lent, cst, tt, baseNota, calibracao, causas, aloc, pv, feitas]) => {
        setRes(r);
        setSerie(s);
        setNiveis(ni);
        setTipos(ti);
        setFormatos(fo);
        setConceitos(co);
        setConfiancas(cf);
        setCaixaLeitner(caixa);
        setStreak(st);
        setAtividade(at);
        setTempoGeral(tg);
        setTempoMaterias(tm);
        setConfiancaResumo(conf);
        setLentidao(lent);
        setCusto(cst);
        setTeto(tt);
        setPorMateriaNota(baseNota ? baseNota[0] : null);
        setPesosReais(baseNota ? baseNota[1] : {});
        setCalibracaoPorMateria(calibracao);
        setCausasErro(causas);
        setAlocacaoRecente(aloc);
        setProva(pv);
        setFeitasTotal(feitas);
      })
      .catch(() => setRes(null))
      .finally(() => setCarregando(false));
  }, [materia, nivel]);

  useEffect(() => {
    if (ativa) carregar();
  }, [ativa, carregar]);

  // Tudo que depende do JSON do banco fixo (carregado sob demanda, ver
  // garantirBanco): acerto por banca, inéditas restantes (alvo padrão da
  // projeção até a prova) e lista de áreas (universo do "Tempo × edital").
  useEffect(() => {
    if (!ativa) return;
    let vivo = true;
    Promise.all([
      garantirBanco(),
      respostasDoBanco(materia, nivel),
      idsBancoRespondidos(),
      respostasComTexto(materia, nivel),
    ])
      .then(([, linhas, vistas, comTexto]) => {
        if (!vivo) return;
        setBancas(agruparPorBanca(linhas));
        setPorTamanho(agruparPorTamanho(comTexto));
        const areas = areasBanco();
        setAreasDoBanco(areas);
        setIneditasBanco(areas.reduce((s, a) => s + contarIneditas(a, { modo: "todos" }, vistas), 0));
      })
      .catch(() => {
        if (vivo) setBancas([]);
      });
    return () => {
      vivo = false;
    };
  }, [ativa, materia, nivel]);

  // Cobertura e heatmap de tópicos: só existe lista fixa para comparar numa
  // matéria específica (não em "todas") e só para as que têm
  // TOPICOS_POR_MATERIA — independente do filtro de nível, que não se aplica
  // a blocos.topico.
  useEffect(() => {
    if (!ativa || materia === null || !MATERIAS_COM_TOPICOS.includes(materia)) {
      setCobertura(null);
      setHeatmap(null);
      return;
    }
    topicosPraticados(materia)
      .then((praticados) => setCobertura(coberturaTopicos(materia, praticados)))
      .catch(() => setCobertura(null));
    questoesPorTopico(materia)
      .then((linhas) => setHeatmap(desempenhoPorTopico(materia, linhas)))
      .catch(() => setHeatmap(null));
  }, [ativa, materia]);

  return {
    materias,
    carregando,
    res,
    serie,
    niveis,
    tipos,
    formatos,
    confiancas,
    caixaLeitner,
    conceitos,
    atividade,
    streak,
    cobertura,
    heatmap,
    porMateriaNota,
    pesosReais,
    tempoGeral,
    tempoMaterias,
    confiancaResumo,
    calibracaoPorMateria,
    lentidao,
    custo,
    teto,
    simulados,
    causasErro,
    bancas,
    porTamanho,
    alocacaoRecente,
    prova,
    feitasTotal,
    ineditasBanco,
    areasDoBanco,
  };
}
