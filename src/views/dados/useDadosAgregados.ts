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
  type CalibracaoMateria,
  type Fatia,
  type FatiaTempo,
  type Resumo,
  type ResumoConfianca,
  type ResumoCusto,
  type ResumoLentidao,
} from "../../lib/repo";
import { getPesosEdital, type PesosEdital } from "../../lib/edital";
import { getTetoMensal } from "../../lib/custo";
import {
  coberturaTopicos,
  desempenhoPorTopico,
  MATERIAS_COM_TOPICOS,
  type DesempenhoTopico,
  type TopicoEspecifico,
} from "../../lib/topicos";

/** Janela do calendário de sequência (heatmap) — 20 semanas. */
export const DIAS_HEATMAP = 140;

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

  useEffect(() => {
    if (ativa) materiasComDados().then(setMaterias).catch(() => setMaterias([]));
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
    ])
      .then(([r, s, ni, ti, fo, co, cf, st, at, tg, tm, conf, lent, cst, tt, baseNota, calibracao]) => {
        setRes(r);
        setSerie(s);
        setNiveis(ni);
        setTipos(ti);
        setFormatos(fo);
        setConceitos(co);
        setConfiancas(cf);
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
      })
      .catch(() => setRes(null))
      .finally(() => setCarregando(false));
  }, [materia, nivel]);

  useEffect(() => {
    if (ativa) carregar();
  }, [ativa, carregar]);

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
  };
}
