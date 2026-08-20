import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { C, cartao, campo, disp, mono, rotulo } from "../theme";
import Shell, { Vazio } from "../components/Shell";
import Botao from "../components/Botao";
import Chip from "../components/Chip";
import {
  atividadePorDia,
  estimarNotaProvavel,
  materiasComDados,
  porConceito,
  porFormato,
  porConfianca,
  porNivel,
  porTipo,
  questoesPorTopico,
  resumo,
  resumoPorMateria,
  serieBlocos,
  streakDias,
  tempoMedioGeral,
  tempoPorMateria,
  topicosPraticados,
  type Fatia,
  type FatiaTempo,
  type Resumo,
} from "../lib/repo";
import { getPesosEdital, PRESETS_PESO_EDITAL, type PesosEdital } from "../lib/edital";
import { labelFormato, labelTipo, NIVEIS } from "../lib/constants";
import {
  agruparPorPrefixo,
  coberturaTopicos,
  desempenhoPorTopico,
  MATERIAS_COM_TOPICOS,
  type DesempenhoTopico,
  type TopicoEspecifico,
} from "../lib/topicos";

const TODAS = "__todas__";
const TODOS_NIVEIS = 0;
/** Janela do calendário de sequência (heatmap) — 15 semanas cabe inteira na
 * largura de uma tela de celular sem precisar rolar para o lado. */
const DIAS_HEATMAP = 105;

/** "1min 24s" / "38s" — formato compacto para os cartões de tempo médio. */
function formatarDuracao(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const resto = s % 60;
  return m > 0 ? `${m}min ${resto}s` : `${resto}s`;
}

/** Vermelho abaixo de 70%, azul até 90%, verde a partir daí. */
function corPct(pct: number): string {
  if (pct >= 90) return C.ok;
  if (pct >= 70) return C.caneta;
  return C.erro;
}

/** Agrupamento da "Nota provável estimada" em 3 faixas de acerto — cada uma
 * com seu próprio fundo/texto, do melhor domínio (roxo) ao mais fraco
 * (vermelho), nessa ordem fixa de exibição. */
const GRUPOS_NOTA: { rotulo: string; pertence: (pct: number) => boolean; fundo: string; cor: string }[] = [
  { rotulo: "alto", pertence: (pct) => pct >= 80, fundo: C.canetaSoft, cor: C.caneta },
  { rotulo: "medio", pertence: (pct) => pct >= 50 && pct < 80, fundo: C.okSoft, cor: C.ok },
  { rotulo: "baixo", pertence: (pct) => pct < 50, fundo: C.erroSoft, cor: C.erro },
];

function Cartao({
  titulo,
  legenda,
  children,
}: {
  titulo: string;
  legenda?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ ...cartao, padding: "14px 12px 8px", marginBottom: 12 }}>
      <div
        style={{
          ...mono,
          fontSize: 11,
          color: C.sub,
          letterSpacing: 0.8,
          marginBottom: legenda ? 2 : 10,
          paddingLeft: 4,
        }}
      >
        {titulo}
      </div>
      {legenda && (
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 10, paddingLeft: 4, lineHeight: 1.4 }}>
          {legenda}
        </div>
      )}
      {children}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: C.card,
    border: `1.5px solid ${C.line}`,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: "'Montserrat', system-ui, sans-serif",
  },
  labelStyle: { color: C.sub, fontSize: 11 },
} as const;

const eixo = {
  tick: { fontSize: 11, fill: C.sub, fontFamily: "'Montserrat', system-ui, sans-serif" },
  stroke: C.line,
} as const;

/** O `<Text>` de tick do recharts quebra rótulos longos em várias linhas
 * dentro da largura do eixo (`largura`) — sem prever isso, `alturaPorItem`
 * fixo faz linhas de categorias com nome longo (ex. conceitos) se sobrepor
 * verticalmente. Estimativa grosseira (chars por linha ~ largura/(fonte*0.6),
 * arredondado por cima) só para dimensionar o card; não precisa ser exata. */
function alturaRotuloQuebrado(nome: string, largura: number, fonte = 11): number {
  const charsPorLinha = Math.max(6, Math.floor(largura / (fonte * 0.6)));
  const linhas = Math.max(1, Math.ceil(nome.length / charsPorLinha));
  return linhas * (fonte * 1.3);
}

/** Barras de % de acerto com rótulo textual — usado em 3 dos 4 gráficos. */
function BarrasPct({
  dados,
  alturaPorItem = 34,
  larguraEixo = 84,
}: {
  dados: { nome: string; pct: number; total: number }[];
  alturaPorItem?: number;
  /** Largura do eixo Y (rótulo da categoria) — aumentar reduz quebra de
   * linha em nomes longos (ver conceito, mais abaixo). */
  larguraEixo?: number;
}) {
  // Uniforme entre as linhas (o BarChart do recharts aloca a mesma altura
  // para cada categoria) — usa o rótulo mais longo do conjunto, com uma
  // margem mínima de `alturaPorItem` para conjuntos de nomes curtos.
  const alturaMinLinha = Math.max(
    alturaPorItem,
    ...dados.map((d) => alturaRotuloQuebrado(d.nome, larguraEixo) + 16),
  );
  const altura = Math.max(120, dados.length * alturaMinLinha + 24);
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid horizontal={false} stroke={C.line} />
        <XAxis type="number" domain={[0, 100]} unit="%" {...eixo} />
        <YAxis type="category" dataKey="nome" width={larguraEixo} {...eixo} />
        <Tooltip
          {...tooltipStyle}
          formatter={(v: number, _n, p) => [
            `${v}% (${(p.payload as { total: number }).total} questões)`,
            "acerto",
          ]}
        />
        <ReferenceLine x={90} stroke={C.ok} strokeDasharray="3 3" />
        <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false}>
          {dados.map((d) => (
            <Cell key={d.nome} fill={corPct(d.pct)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Um dia do calendário de sequência: `total` null = fora da janela (célula
 * de preenchimento, só para a grade fechar em semanas completas). */
function addDiasISO(dataISO: string, n: number): string {
  const d = new Date(`${dataISO}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Calendário de sequência (heatmap estilo GitHub): uma coluna por semana,
 * uma célula por dia, mais escura quanto mais questões respondidas naquele
 * dia — visão rápida de constância que o número isolado de "sequência atual"
 * não mostra. Datas em UTC (mesma convenção de `ts`/streakDias) para não
 * desalinhar a grade por fuso horário. */
function CalendarioSequencia({ atividade, dias }: { atividade: { data: string; total: number }[]; dias: number }) {
  const porDia = new Map(atividade.map((a) => [a.data, a.total]));
  const hojeISO = new Date().toISOString().slice(0, 10);
  const inicioISO = addDiasISO(hojeISO, -(dias - 1));
  const diaDaSemana = new Date(`${inicioISO}T00:00:00.000Z`).getUTCDay();
  const inicioSemanaISO = addDiasISO(inicioISO, -diaDaSemana);

  const celulas: { chave: string; total: number | null }[] = [];
  for (let d = inicioSemanaISO; d <= hojeISO; d = addDiasISO(d, 1)) {
    celulas.push({ chave: d, total: d < inicioISO ? null : (porDia.get(d) ?? 0) });
  }
  const semanas: (typeof celulas)[] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));

  function cor(total: number | null): string {
    if (total == null) return "transparent";
    if (total === 0) return C.paper;
    if (total <= 3) return C.heat1;
    if (total <= 7) return C.heat2;
    if (total <= 14) return C.heat3;
    return C.heat4;
  }

  return (
    <div>
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "flex", gap: 3, width: "max-content" }}>
          {semanas.map((semana, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {semana.map((d) => (
                <div
                  key={d.chave}
                  title={d.total == null ? undefined : `${d.chave} · ${d.total} questão${d.total === 1 ? "" : "es"}`}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 3,
                    background: cor(d.total),
                    border: d.total === 0 ? `1px solid ${C.line}` : "none",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
        <span style={{ fontSize: 10.5, color: C.sub }}>Menos</span>
        {[0, 1, 4, 8, 15].map((t) => (
          <div
            key={t}
            style={{
              width: 11,
              height: 11,
              borderRadius: 3,
              background: cor(t),
              border: `1px solid ${C.line}`,
            }}
          />
        ))}
        <span style={{ fontSize: 10.5, color: C.sub }}>Mais</span>
      </div>
    </div>
  );
}

export default function DadosTab({
  ativa,
  onQuestoes,
  onAjustes,
}: {
  ativa: boolean;
  onQuestoes: () => void;
  onAjustes: () => void;
}) {
  const [materias, setMaterias] = useState<string[]>([]);
  const [filtro, setFiltro] = useState<string>(TODAS);
  const [filtroNivel, setFiltroNivel] = useState<number>(TODOS_NIVEIS);
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
  const [mostrarTodasPendentes, setMostrarTodasPendentes] = useState(false);
  const [heatmap, setHeatmap] = useState<DesempenhoTopico[] | null>(null);
  // Base da nota provável (acerto por matéria + pesos REAIS configurados em
  // Ajustes) separada do resultado final — o dropdown de simulação abaixo
  // recalcula `notaEstimada` (função pura) trocando só os pesos, sem
  // consultar o banco de novo nem gravar nada.
  const [porMateriaNota, setPorMateriaNota] = useState<Fatia[] | null>(null);
  const [pesosReais, setPesosReais] = useState<PesosEdital>({});
  const [presetSimulacao, setPresetSimulacao] = useState<string>("");
  const [tempoGeral, setTempoGeral] = useState<{ tempoMedioMs: number; amostras: number } | null>(
    null,
  );
  const [tempoMaterias, setTempoMaterias] = useState<FatiaTempo[]>([]);

  useEffect(() => {
    if (ativa) materiasComDados().then(setMaterias).catch(() => setMaterias([]));
  }, [ativa]);

  const carregar = useCallback(() => {
    // null = agrega todas as matérias; uma string = filtra estritamente por ela.
    const m = filtro === TODAS ? null : filtro;
    const n = filtroNivel === TODOS_NIVEIS ? null : filtroNivel;
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
      // Nota estimada só faz sentido na visão agregada — ver corpo abaixo.
      filtro === TODAS ? Promise.all([resumoPorMateria(n), getPesosEdital()]) : Promise.resolve(null),
    ])
      .then(([r, s, ni, ti, fo, co, cf, st, at, tg, tm, baseNota]) => {
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
        setPorMateriaNota(baseNota ? baseNota[0] : null);
        setPesosReais(baseNota ? baseNota[1] : {});
      })
      .catch(() => setRes(null))
      .finally(() => setCarregando(false));
  }, [filtro, filtroNivel]);

  // Além de rodar quando o filtro muda, recarrega toda vez que a aba é
  // reaberta — a aba fica montada entre trocas (ver App.tsx), então sem isto
  // um bloco respondido em outra aba não apareceria aqui sem um refresh manual.
  useEffect(() => {
    if (ativa) carregar();
  }, [ativa, carregar]);

  // Cobertura de tópicos: só existe lista fixa para comparar numa matéria
  // específica (não em "todas") e só para as que têm TOPICOS_POR_MATERIA —
  // independente do filtro de nível, que não se aplica a blocos.topico.
  useEffect(() => {
    setMostrarTodasPendentes(false);
    if (!ativa || filtro === TODAS || !MATERIAS_COM_TOPICOS.includes(filtro)) {
      setCobertura(null);
      setHeatmap(null);
      return;
    }
    topicosPraticados(filtro)
      .then((praticados) => setCobertura(coberturaTopicos(filtro, praticados)))
      .catch(() => setCobertura(null));
    questoesPorTopico(filtro)
      .then((linhas) => setHeatmap(desempenhoPorTopico(filtro, linhas)))
      .catch(() => setHeatmap(null));
  }, [ativa, filtro]);

  const semDados = !res || res.totalQuestoes === 0;
  const pctGeral = res && res.totalQuestoes ? Math.round((res.totalAcertos / res.totalQuestoes) * 100) : 0;

  // Pesos usados na nota provável: os REAIS configurados em Ajustes por
  // padrão, ou os de um preset de concurso quando o dropdown de simulação
  // está com um preset selecionado — puramente local, nunca grava nada.
  const presetSelecionado = PRESETS_PESO_EDITAL.find((p) => p.id === presetSimulacao);
  const pesosParaNota = presetSelecionado ? presetSelecionado.pesos : pesosReais;
  const notaEstimada = porMateriaNota ? estimarNotaProvavel(porMateriaNota, pesosParaNota) : null;

  const dadosNiveis = niveis.map((f) => {
    const n = Number(f.chave);
    return { nome: `N${n} · ${NIVEIS[n - 1] ?? ""}`, pct: f.pct, total: f.total };
  });

  const dadosTipos = tipos.map((f) => ({ nome: labelTipo(f.chave), pct: f.pct, total: f.total }));
  const dadosFormatos = formatos.map((f) => ({
    nome: labelFormato(f.chave),
    pct: f.pct,
    total: f.total,
  }));
  const dadosConceitos = conceitos.map((f) => ({ nome: f.chave, pct: f.pct, total: f.total }));
  const LABEL_CONFIANCA: Record<string, string> = { certeza: "Certeza", chute: "Chute" };
  const dadosConfianca = confiancas.map((f) => ({
    nome: LABEL_CONFIANCA[f.chave] ?? f.chave,
    pct: f.pct,
    total: f.total,
  }));

  return (
    <Shell titulo="Dados">
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 160px" }}>
          <label style={rotulo}>Matéria</label>
          <select style={campo} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value={TODAS}>Todas as matérias</option>
            {materias.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <label style={rotulo}>Nível de dificuldade</label>
          <select
            style={campo}
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(Number(e.target.value))}
          >
            <option value={TODOS_NIVEIS}>Todos os níveis</option>
            {NIVEIS.map((rot, i) => (
              <option key={i} value={i + 1}>
                N{i + 1} · {rot}
              </option>
            ))}
          </select>
        </div>
      </div>
      {filtroNivel !== TODOS_NIVEIS && (
        <div style={{ fontSize: 11.5, color: C.sub, marginTop: -10, marginBottom: 16, lineHeight: 1.4 }}>
          O nível filtra só as questões (totais, tipo, formato) — a evolução por bloco e blocos
          aprovados sempre consideram o bloco inteiro, não o nível.
        </div>
      )}

      {carregando ? (
        <Vazio>Calculando…</Vazio>
      ) : semDados ? (
        <Vazio>
          <p style={{ margin: "0 0 14px" }}>
            Sem dados {filtro === TODAS ? "ainda" : `para ${filtro}`}.
            <br />
            Responda um bloco na aba Blocos para ver seu desempenho aqui.
          </p>
          <Botao tipo="tinta" onClick={onQuestoes} style={{ maxWidth: 220, margin: "0 auto" }}>
            Ir para Blocos
          </Botao>
        </Vazio>
      ) : (
        <>
          {/* Totais */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {[
              { rot: "Acerto geral", val: `${pctGeral}%`, cor: corPct(pctGeral) },
              { rot: "Questões", val: String(res!.totalQuestoes), cor: C.ink },
            ].map((k) => (
              <div key={k.rot} style={{ ...cartao, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ ...disp, fontSize: 22, fontWeight: 800, color: k.cor, letterSpacing: -0.5 }}>
                  {k.val}
                </div>
                <div style={{ ...mono, fontSize: 9.5, color: C.sub, marginTop: 2, lineHeight: 1.3 }}>
                  {k.rot.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {/* Sequência de dias praticando — não é filtrada por matéria/nível:
              é uma métrica de constância do estudo como um todo. */}
          {streak && streak.recorde > 0 && (
            <div
              style={{
                ...cartao,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ ...mono, fontSize: 11, color: C.sub, letterSpacing: 0.8 }}>
                  SEQUÊNCIA ATUAL
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>
                  {streak.atual > 0
                    ? streak.hoje
                      ? "Você já praticou hoje."
                      : "Pratique hoje para manter a sequência."
                    : "Responda um bloco para começar uma sequência."}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    ...disp,
                    fontSize: 26,
                    fontWeight: 800,
                    color: streak.atual > 0 ? C.caneta : C.ink,
                    letterSpacing: -0.5,
                  }}
                >
                  {streak.atual}d
                </div>
                <div style={{ ...mono, fontSize: 9.5, color: C.sub }}>
                  RECORDE {streak.recorde}D
                </div>
              </div>
            </div>
          )}

          {/* Calendário de sequência — mesma constância "do estudo como um
              todo", não filtrada por matéria/nível (ver comentário acima). */}
          <Cartao titulo="CALENDÁRIO DE SEQUÊNCIA" legenda="Questões respondidas por dia, últimas 15 semanas.">
            <div style={{ padding: "0 4px 14px" }}>
              <CalendarioSequencia atividade={atividade} dias={DIAS_HEATMAP} />
            </div>
          </Cartao>

          {/* Nota provável estimada: acerto por matéria ponderado pelo peso
              de cada uma no edital (configurado em Ajustes) — só na visão
              agregada, onde comparar matérias com pesos diferentes faz
              sentido. */}
          {filtro === TODAS && (
            <Cartao titulo="NOTA PROVÁVEL ESTIMADA">
              <div style={{ padding: "0 4px 14px" }}>
                <select
                  style={{ ...campo, ...mono, fontSize: 12, marginBottom: 12 }}
                  value={presetSimulacao}
                  onChange={(e) => setPresetSimulacao(e.target.value)}
                >
                  <option value="">Peso configurado em Ajustes</option>
                  {PRESETS_PESO_EDITAL.map((p) => (
                    <option key={p.id} value={p.id}>
                      Simular: {p.label}
                    </option>
                  ))}
                </select>
              </div>
              {notaEstimada ? (
                <div style={{ padding: "0 4px 14px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        ...disp,
                        fontSize: 40,
                        fontWeight: 800,
                        letterSpacing: -1,
                        color: corPct(notaEstimada.notaEstimada),
                      }}
                    >
                      {notaEstimada.notaEstimada}%
                    </div>
                    <div style={{ ...mono, fontSize: 11, color: C.sub }}>
                      {notaEstimada.materiasIncluidas.length} matéria
                      {notaEstimada.materiasIncluidas.length === 1 ? "" : "s"} · {notaEstimada.amostras}{" "}
                      questões
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                    {GRUPOS_NOTA.map((grupo) => {
                      const materiasDoGrupo = notaEstimada.materiasIncluidas
                        .filter((m) => grupo.pertence(m.pct))
                        .sort((a, b) => b.pct - a.pct);
                      if (!materiasDoGrupo.length) return null;
                      return (
                        <div
                          key={grupo.rotulo}
                          style={{
                            background: grupo.fundo,
                            borderRadius: 8,
                            padding: "10px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {materiasDoGrupo.map((m) => (
                            <div
                              key={m.materia}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 8,
                                fontSize: 12.5,
                              }}
                            >
                              <span>
                                {m.materia}{" "}
                                <span style={{ ...mono, fontSize: 10.5, color: C.sub }}>
                                  (peso {m.peso})
                                </span>
                              </span>
                              <span style={{ ...mono, color: grupo.cor, flexShrink: 0, fontWeight: 600 }}>
                                {m.pct}%
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  {notaEstimada.materiasExcluidas.length > 0 && (
                    <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.4 }}>
                      Fora da conta: {notaEstimada.materiasExcluidas.map((e) => e.materia).join(", ")} (
                      {notaEstimada.materiasExcluidas[0]?.motivo === "peso-zero"
                        ? "peso zero ou amostra insuficiente"
                        : "amostra insuficiente"}
                      ).
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: C.sub, padding: "0 4px 14px", lineHeight: 1.5 }}>
                  Responda pelo menos 5 questões de alguma matéria com peso configurado (ou o peso
                  padrão) para ver uma projeção.{" "}
                  <button
                    onClick={onAjustes}
                    style={{
                      ...mono,
                      fontSize: 12,
                      background: "none",
                      border: "none",
                      color: C.caneta,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Configurar peso do edital →
                  </button>
                </div>
              )}
            </Cartao>
          )}

          {/* Evolução por bloco */}
          <Cartao
            titulo="EVOLUÇÃO — % DE ACERTO POR BLOCO"
            legenda={
              serie.length < 2
                ? "Um único bloco registrado: a linha aparece a partir do segundo."
                : "Linha tracejada = 90%, o limiar de aprovação."
            }
          >
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={serie} margin={{ top: 6, right: 12, bottom: 4, left: -18 }}>
                <CartesianGrid stroke={C.line} />
                <XAxis dataKey="i" {...eixo} />
                <YAxis domain={[0, 100]} unit="%" {...eixo} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "acerto"]} labelFormatter={(l) => `Bloco ${l}`} />
                <ReferenceLine y={90} stroke={C.ok} strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke={C.caneta}
                  strokeWidth={2}
                  dot={{ r: 3, fill: C.caneta }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Cartao>

          {/* Nível de dificuldade */}
          <Cartao
            titulo="ACERTO POR NÍVEL DE DIFICULDADE"
            legenda="Questões sem nível (importadas ou geradas do banco) não entram aqui."
          >
            {dadosNiveis.length ? (
              <BarrasPct dados={dadosNiveis} />
            ) : (
              <div style={{ fontSize: 13, color: C.sub, padding: "8px 4px 14px" }}>
                Nenhuma questão respondida com nível registrado.
              </div>
            )}
          </Cartao>

          {/* Tempo médio por questão: cronometrado em QuestaoCard. Cruza com
              acerto por matéria para separar "erra" (domínio baixo) de
              "acerta mas devagar" (fluência baixa) — dois problemas
              diferentes que pedem treino diferente. */}
          {tempoGeral && (
            <Cartao
              titulo="TEMPO MÉDIO POR QUESTÃO"
              legenda={
                filtro === TODAS && tempoMaterias.length > 1
                  ? "Do mais lento para o mais rápido. Só questões respondidas após esta versão têm tempo medido."
                  : "Só questões respondidas após esta versão têm tempo medido."
              }
            >
              <div style={{ padding: "0 4px 14px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: filtro === TODAS && tempoMaterias.length > 1 ? 12 : 0 }}>
                  <div style={{ ...disp, fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
                    {formatarDuracao(tempoGeral.tempoMedioMs)}
                  </div>
                  <div style={{ ...mono, fontSize: 11, color: C.sub }}>{tempoGeral.amostras} questões</div>
                </div>
                {filtro === TODAS && tempoMaterias.length > 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {tempoMaterias.map((t) => {
                      const maior = tempoMaterias[0]?.tempoMedioMs || 1;
                      return (
                        <div key={t.chave}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 12,
                              marginBottom: 2,
                            }}
                          >
                            <span>{t.chave}</span>
                            <span style={{ ...mono, color: C.sub, flexShrink: 0 }}>
                              {formatarDuracao(t.tempoMedioMs)}
                            </span>
                          </div>
                          <div style={{ height: 5, background: C.line, borderRadius: 3, overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.max(4, Math.round((t.tempoMedioMs / maior) * 100))}%`,
                                background: C.caneta,
                                borderRadius: 3,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Cartao>
          )}

          {/* Cobertura de tópicos: só aparece com uma matéria específica
              selecionada e que tenha lista fixa de tópicos (ver topicos.ts). */}
          {cobertura && (
            <Cartao
              titulo="COBERTURA DE TÓPICOS"
              legenda={`${cobertura.praticados.length} de ${
                cobertura.praticados.length + cobertura.pendentes.length
              } tópicos já praticados nesta matéria (aula específica ou bloco de aulas gerado).`}
            >
              {cobertura.pendentes.length === 0 ? (
                <div style={{ fontSize: 13, color: C.ok, padding: "0 4px 14px" }}>
                  Todos os tópicos já foram praticados pelo menos uma vez.
                </div>
              ) : (
                <div style={{ padding: "0 4px 14px" }}>
                  <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 8 }}>
                    Nunca praticados:
                  </div>
                  {(mostrarTodasPendentes ? cobertura.pendentes : cobertura.pendentes.slice(0, 8)).map(
                    (t) => (
                      <Chip key={t.codigo} tom="erro">
                        {t.nome}
                      </Chip>
                    ),
                  )}
                  {cobertura.pendentes.length > 8 && (
                    <button
                      onClick={() => setMostrarTodasPendentes((v) => !v)}
                      style={{
                        ...mono,
                        display: "block",
                        marginTop: 4,
                        fontSize: 11,
                        background: "none",
                        border: "none",
                        color: C.caneta,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {mostrarTodasPendentes
                        ? "Mostrar menos"
                        : `+${cobertura.pendentes.length - 8} mais`}
                    </button>
                  )}
                </div>
              )}
            </Cartao>
          )}

          {/* Heatmap tópico × desempenho: cada quadrado é uma aula, colorido
              pela % de acerto das questões respondidas cujo tópico bate com
              ela (granularidade de questão — ver desempenhoPorTopico). Tópicos
              nunca praticados ficam neutros, sem competir visualmente com os
              que já têm sinal de desempenho. */}
          {heatmap && heatmap.some((t) => t.total > 0) && (
            <Cartao
              titulo="MAPA DE CALOR — DESEMPENHO POR TÓPICO"
              legenda="Cada quadrado é uma aula; a cor é a % de acerto das questões respondidas sobre ela. Cinza = ainda não praticada."
            >
              <div style={{ padding: "0 4px 14px" }}>
                {agruparPorPrefixo(heatmap, (t) => t.codigo.split(".")[0]).map((grupo) => (
                  <div key={grupo.bloco} style={{ marginBottom: 10 }}>
                    <div style={{ ...mono, fontSize: 10.5, color: C.sub, marginBottom: 5 }}>
                      BLOCO {grupo.bloco}
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {grupo.aulas.map((t) => {
                        const praticada = t.total > 0;
                        return (
                          <div
                            key={t.codigo}
                            title={`${t.nome} — ${praticada ? `${t.pct}% (${t.total} questões)` : "nunca praticada"}`}
                            style={{
                              ...mono,
                              width: 34,
                              height: 34,
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 700,
                              flexShrink: 0,
                              cursor: "default",
                              color: praticada ? "#fff" : C.sub,
                              background: praticada ? corPct(t.pct) : C.paper,
                              border: praticada ? "none" : `1.5px dashed ${C.line}`,
                            }}
                          >
                            {t.codigo.split(".")[1]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Cartao>
          )}

          {/* Tipo de cobrança */}
          <Cartao titulo="ACERTO POR TIPO DE COBRANÇA">
            {dadosTipos.length ? (
              <BarrasPct dados={dadosTipos} />
            ) : (
              <div style={{ fontSize: 13, color: C.sub, padding: "8px 4px 14px" }}>
                Os blocos registrados não gravaram o tipo por questão.
              </div>
            )}
          </Cartao>

          {/* Formato */}
          <Cartao titulo="ACERTO POR FORMATO (CE VS MC)">
            <BarrasPct dados={dadosFormatos} alturaPorItem={40} />
          </Cartao>

          {/* Confiança — separa acerto por conhecimento de acerto por
              sorte, o que o % geral não distingue (ver QuestaoCard e
              porConfianca em repo.ts). Só existe para respostas novas
              gravadas depois deste recurso; revisão em Refazer erradas e
              simulado não perguntam confiança. */}
          <Cartao titulo="ACERTO POR CONFIANÇA">
            {dadosConfianca.length ? (
              <BarrasPct dados={dadosConfianca} alturaPorItem={40} />
            ) : (
              <div style={{ fontSize: 13, color: C.sub, padding: "8px 4px 14px" }}>
                Nenhuma resposta com autoavaliação de confiança ainda.
              </div>
            )}
          </Cartao>

          {/* Conceito — a dimensão mais granular; só mostra os que já têm
              amostra suficiente (ver porConceito em repo.ts). Nomes de
              conceito podem ser bem longos, por isso um eixo Y mais largo
              (menos quebra de linha) e altura por item calculada a partir
              do rótulo mais longo (ver alturaRotuloQuebrado) — o card fica
              alto, mas nenhuma legenda se sobrepõe. */}
          <Cartao titulo="ACERTO POR CONCEITO">
            {dadosConceitos.length ? (
              <BarrasPct dados={dadosConceitos} alturaPorItem={30} larguraEixo={175} />
            ) : (
              <div style={{ fontSize: 13, color: C.sub, padding: "8px 4px 14px" }}>
                Nenhum conceito com amostra suficiente ainda.
              </div>
            )}
          </Cartao>
        </>
      )}
    </Shell>
  );
}
