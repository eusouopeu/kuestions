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
  materiasComDados,
  porConceito,
  porFormato,
  porNivel,
  porTipo,
  preverAprovacao,
  questoesPorTopico,
  resumo,
  serieBlocos,
  streakDias,
  topicosPraticados,
  type Fatia,
  type Previsao,
  type Resumo,
} from "../lib/repo";
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

/** Vermelho abaixo de 70%, azul até 90%, verde a partir daí. */
function corPct(pct: number): string {
  if (pct >= 90) return C.ok;
  if (pct >= 70) return C.caneta;
  return C.erro;
}

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
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  },
  labelStyle: { color: C.sub, fontSize: 11 },
} as const;

const eixo = {
  tick: { fontSize: 11, fill: C.sub, fontFamily: "'IBM Plex Mono', ui-monospace, monospace" },
  stroke: C.line,
} as const;

/** Barras de % de acerto com rótulo textual — usado em 3 dos 4 gráficos. */
function BarrasPct({
  dados,
  alturaPorItem = 34,
}: {
  dados: { nome: string; pct: number; total: number }[];
  alturaPorItem?: number;
}) {
  const altura = Math.max(120, dados.length * alturaPorItem + 24);
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 4 }}>
        <CartesianGrid horizontal={false} stroke={C.line} />
        <XAxis type="number" domain={[0, 100]} unit="%" {...eixo} />
        <YAxis type="category" dataKey="nome" width={104} {...eixo} />
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

export default function DadosTab({
  ativa,
  onQuestoes,
}: {
  ativa: boolean;
  onQuestoes: () => void;
}) {
  const [materias, setMaterias] = useState<string[]>([]);
  const [filtro, setFiltro] = useState<string>(TODAS);
  const [filtroNivel, setFiltroNivel] = useState<number>(TODOS_NIVEIS);
  const [carregando, setCarregando] = useState(true);
  const [res, setRes] = useState<Resumo | null>(null);
  const [serie, setSerie] = useState<{ i: number; pct: number }[]>([]);
  const [previsao, setPrevisao] = useState<Previsao | null>(null);
  const [niveis, setNiveis] = useState<Fatia[]>([]);
  const [tipos, setTipos] = useState<Fatia[]>([]);
  const [formatos, setFormatos] = useState<Fatia[]>([]);
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
      streakDias(),
    ])
      .then(([r, s, ni, ti, fo, co, st]) => {
        setRes(r);
        setSerie(s);
        setPrevisao(preverAprovacao(s));
        setNiveis(ni);
        setTipos(ti);
        setFormatos(fo);
        setConceitos(co);
        setStreak(st);
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

  return (
    <Shell kicker="DESEMPENHO" titulo="Dados">
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
            Responda um bloco na aba Questões para ver seu desempenho aqui.
          </p>
          <Botao tipo="tinta" onClick={onQuestoes} style={{ maxWidth: 220, margin: "0 auto" }}>
            Ir para Questões
          </Botao>
        </Vazio>
      ) : (
        <>
          {/* Totais */}
          <div
            style={{
              display: "grid",
              // 2×2 em tela de telefone; 4 colunas a partir de ~480px. Com
              // auto-fit/96px o quarto cartão ficava órfão numa linha só dele.
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {[
              { rot: "Acerto geral", val: `${pctGeral}%`, cor: corPct(pctGeral) },
              { rot: "Questões", val: String(res!.totalQuestoes), cor: C.ink },
              {
                rot: "Blocos aprovados",
                val: `${res!.blocosAprovados}/${res!.blocosTotais}`,
                cor: C.ink,
              },
              { rot: "Conceitos salvos", val: String(res!.conceitosSalvos), cor: C.caneta },
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

          {/* Previsão: regressão linear simples sobre a mesma série do
              gráfico acima — projeta quantos blocos faltam, no ritmo atual,
              para cruzar 90% de acerto. Só aparece com amostra suficiente
              (ver MIN_AMOSTRAS_PREVISAO em repo.ts). */}
          {previsao && (
            <Cartao titulo="PREVISÃO DE APROVAÇÃO">
              <div style={{ padding: "0 4px 14px", fontSize: 13.5, lineHeight: 1.55 }}>
                {previsao.jaAlcancada ? (
                  <span style={{ color: C.ok }}>
                    Último bloco já cruzou 90% de acerto — mantenha o ritmo.
                  </span>
                ) : previsao.tendencia === "subindo" && previsao.blocosAteAlvo != null ? (
                  <>
                    No ritmo atual de evolução (últimos {previsao.amostras} blocos), você cruza 90% em
                    aproximadamente{" "}
                    <strong style={{ color: C.caneta }}>
                      {previsao.blocosAteAlvo} bloco{previsao.blocosAteAlvo === 1 ? "" : "s"}
                    </strong>
                    .
                  </>
                ) : previsao.tendencia === "descendo" ? (
                  <span style={{ color: C.erro }}>
                    A % de acerto vem caindo nos últimos {previsao.amostras} blocos — vale revisar antes
                    de subir o nível.
                  </span>
                ) : (
                  <span style={{ color: C.sub }}>
                    A % de acerto está estável nos últimos {previsao.amostras} blocos — sem tendência
                    clara de subida ainda.
                  </span>
                )}
              </div>
            </Cartao>
          )}

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

          {/* Conceito — a dimensão mais granular; só mostra os que já têm
              amostra suficiente (ver porConceito em repo.ts). */}
          <Cartao
            titulo="ACERTO POR CONCEITO — ONDE TREINAR PRIMEIRO"
            legenda="Só conceitos com pelo menos 3 questões respondidas, do pior para o melhor acerto."
          >
            {dadosConceitos.length ? (
              <BarrasPct dados={dadosConceitos} alturaPorItem={30} />
            ) : (
              <div style={{ fontSize: 13, color: C.sub, padding: "8px 4px 14px" }}>
                Nenhum conceito com amostra suficiente ainda.
              </div>
            )}
          </Cartao>

          {/* Formato */}
          <Cartao titulo="ACERTO POR FORMATO (CE VS MC)">
            <BarrasPct dados={dadosFormatos} alturaPorItem={40} />
          </Cartao>
        </>
      )}
    </Shell>
  );
}
