import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarrasPct,
  CalendarioSequencia,
  corPct,
  eixo,
  LIMIAR_APROVACAO_PCT,
  tooltipStyle,
} from "./dados/graficos";
import { C, cartao, campo, disp, mono, rotulo } from "../theme";
import Shell, { Vazio } from "../components/Shell";
import Botao from "../components/Botao";
import Chip from "../components/Chip";
import { estimarNotaProvavel } from "../lib/repo";
import { useDadosAgregados, DIAS_HEATMAP } from "./dados/useDadosAgregados";
import { PRESETS_PESO_EDITAL } from "../lib/edital";
import { formatarUSD, situacaoTeto } from "../lib/custo";
import { labelFormato, labelTipo, NIVEIS } from "../lib/constants";
import { agruparPorPrefixo } from "../lib/topicos";

const TODAS = "__todas__";
const TODOS_NIVEIS = 0;

/** "1min 24s" / "38s" — formato compacto para os cartões de tempo médio. */
function formatarDuracao(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const resto = s % 60;
  return m > 0 ? `${m}min ${resto}s` : `${resto}s`;
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
          fontWeight: 700,
          color: C.caneta,
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

export default function DadosTab({
  ativa,
  onQuestoes,
  onAjustes,
}: {
  ativa: boolean;
  onQuestoes: () => void;
  onAjustes: () => void;
}) {
  const [filtro, setFiltro] = useState<string>(TODAS);
  const [filtroNivel, setFiltroNivel] = useState<number>(TODOS_NIVEIS);
  const [presetSimulacao, setPresetSimulacao] = useState<string>("");
  const [mostrarTodasPendentes, setMostrarTodasPendentes] = useState(false);

  // Busca e agregação vivem no hook (ver ./dados/useDadosAgregados.ts); aqui
  // ficam só os filtros da tela e o desenho.
  const {
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
    lentidao,
    custo,
    teto,
  } = useDadosAgregados({
    ativa,
    materia: filtro === TODAS ? null : filtro,
    nivel: filtroNivel === TODOS_NIVEIS ? null : filtroNivel,
  });

  // A lista de pendentes recolhe sozinha ao trocar de matéria — o estado de
  // "ver todas" era da matéria anterior.
  useEffect(() => {
    setMostrarTodasPendentes(false);
  }, [filtro]);

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
          {/* Totais + sequência, os três numa linha só: são os indicadores
              de leitura instantânea da aba, e empilhados empurravam todo o
              resto para baixo da dobra. A sequência não é filtrada por
              matéria/nível — é constância do estudo como um todo. */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {[
              { rot: "Acerto geral", val: `${pctGeral}%`, cor: corPct(pctGeral), sub: "" },
              { rot: "Questões", val: String(res!.totalQuestoes), cor: C.ink, sub: "" },
              ...(streak && streak.recorde > 0
                ? [
                    {
                      rot: "Sequência",
                      val: `${streak.atual}d`,
                      cor: streak.atual > 0 ? C.caneta : C.ink,
                      sub: `RECORDE ${streak.recorde}D`,
                    },
                  ]
                : []),
            ].map((k) => (
              <div key={k.rot} style={{ ...cartao, padding: "12px 8px", textAlign: "center" }}>
                <div style={{ ...disp, fontSize: 22, fontWeight: 800, color: k.cor, letterSpacing: -0.5 }}>
                  {k.val}
                </div>
                <div style={{ ...mono, fontSize: 9.5, color: C.sub, marginTop: 2, lineHeight: 1.3 }}>
                  {k.rot.toUpperCase()}
                </div>
                {k.sub && (
                  <div style={{ ...mono, fontSize: 9, color: C.sub, marginTop: 1 }}>{k.sub}</div>
                )}
              </div>
            ))}
          </div>

          {/* Calendário de sequência — mesma constância "do estudo como um
              todo", não filtrada por matéria/nível (ver comentário acima). */}
          <Cartao titulo="CALENDÁRIO DE SEQUÊNCIA" legenda="Questões respondidas por dia, últimas 20 semanas.">
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
                : `Linha tracejada = ${LIMIAR_APROVACAO_PCT}%, o limiar de aprovação.`
            }
          >
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={serie} margin={{ top: 6, right: 12, bottom: 4, left: -18 }}>
                <CartesianGrid stroke={C.line} />
                <XAxis dataKey="i" {...eixo} />
                <YAxis domain={[0, 100]} unit="%" {...eixo} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "acerto"]} labelFormatter={(l) => `Bloco ${l}`} />
                <ReferenceLine y={LIMIAR_APROVACAO_PCT} stroke={C.ok} strokeDasharray="3 3" />
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

          {/* Erro perigoso: marcou "certeza" e errou. É o erro que não se
              revisa sozinho — sem dúvida percebida, o candidato não volta
              naquele ponto nem na véspera. A fila de "Refazer erradas" já
              coloca esses primeiro (ver listarErradas em repo.ts); aqui o
              número existe para o hábito ficar visível. */}
          {confiancaResumo && confiancaResumo.certezas > 0 && (
            <Cartao
              titulo="ERRO PERIGOSO"
              legenda="Questões que você marcou com certeza e mesmo assim errou — entram primeiro na fila de revisão."
            >
              <div style={{ display: "flex", gap: 8, padding: "0 4px 14px" }}>
                {[
                  {
                    rot: "Erros com certeza",
                    val: String(confiancaResumo.perigosos),
                    cor: confiancaResumo.perigosos > 0 ? C.erro : C.ok,
                  },
                  {
                    rot: "Excesso de confiança",
                    val: `${confiancaResumo.pctExcessoConfianca}%`,
                    cor: corPct(100 - confiancaResumo.pctExcessoConfianca),
                  },
                  {
                    rot: "Acertos no chute",
                    val: String(confiancaResumo.sorte),
                    cor: C.ink,
                  },
                ].map((k) => (
                  <div
                    key={k.rot}
                    style={{
                      flex: 1,
                      border: `1.5px solid ${C.line}`,
                      borderRadius: 8,
                      padding: "10px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ ...disp, fontSize: 20, fontWeight: 800, color: k.cor }}>{k.val}</div>
                    <div style={{ ...mono, fontSize: 9, color: C.sub, marginTop: 2, lineHeight: 1.3 }}>
                      {k.rot.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: C.sub, padding: "0 4px 14px", lineHeight: 1.45 }}>
                {confiancaResumo.perigosos === 0
                  ? "Nenhum erro com certeza no histórico — sua percepção de dúvida está calibrada."
                  : `${confiancaResumo.pctExcessoConfianca}% do que você marcou com certeza deu errado. Numa prova, esse é o erro que passa despercebido na revisão.`}
              </div>
            </Cartao>
          )}

          {/* Acerto lento: o tempo por questão já era gravado em toda
              resposta, mas só o relatório do simulado o usava. Acertar
              gastando o dobro do tempo é fluência baixa — o único problema
              que o placar registra como acerto. */}
          {lentidao && lentidao.acertosCronometrados > 0 && (
            <Cartao
              titulo="ACERTO LENTO"
              legenda="Questões que você acertou gastando mais que o dobro do seu tempo médio — entram na frente dos outros acertos na fila de revisão."
            >
              <div style={{ display: "flex", gap: 8, padding: "0 4px 14px" }}>
                {[
                  {
                    rot: "Acertos lentos",
                    val: String(lentidao.lentas),
                    cor: lentidao.lentas > 0 ? C.caneta : C.ok,
                  },
                  {
                    rot: "Dos seus acertos",
                    val: `${lentidao.pct}%`,
                    cor: corPct(100 - lentidao.pct),
                  },
                  {
                    rot: "Tempo médio",
                    val: `${Math.round(lentidao.tempoMedioMs / 1000)}s`,
                    cor: C.ink,
                  },
                ].map((k) => (
                  <div
                    key={k.rot}
                    style={{
                      flex: 1,
                      border: `1.5px solid ${C.line}`,
                      borderRadius: 8,
                      padding: "10px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ ...disp, fontSize: 20, fontWeight: 800, color: k.cor }}>{k.val}</div>
                    <div style={{ ...mono, fontSize: 9, color: C.sub, marginTop: 2, lineHeight: 1.3 }}>
                      {k.rot.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: C.sub, padding: "0 4px 14px", lineHeight: 1.45 }}>
                {lentidao.lentas === 0
                  ? "Nenhum acerto acima do dobro do seu tempo médio — o conteúdo que você domina, você resolve rápido."
                  : `${lentidao.pct}% dos seus acertos levaram mais que o dobro do seu tempo médio. Numa prova cronometrada, é o que custa as últimas questões.`}
              </div>
            </Cartao>
          )}

          {/* Custo da API: o app gasta a conta pessoal do usuário na
              Anthropic (4 chamadas por bloco gerado). Sem isto, o gasto só
              aparecia na fatura. `cacheLeituraMes` mostra o efeito do prompt
              caching de anthropic.ts — tokens que NÃO foram cobrados cheios. */}
          {custo && custo.total > 0 && (
            <Cartao titulo="CUSTO DA API" legenda="Gasto na sua chave da Anthropic. O teto mensal é configurado em Ajustes.">
              <div style={{ display: "flex", gap: 8, padding: "0 4px 12px" }}>
                {[
                  {
                    rot: "Este mês",
                    val: formatarUSD(custo.mes),
                    cor:
                      situacaoTeto(custo.mes, teto) === "estourado"
                        ? C.erro
                        : situacaoTeto(custo.mes, teto) === "perto"
                          ? C.caneta
                          : C.ink,
                  },
                  { rot: "Desde o início", val: formatarUSD(custo.total), cor: C.ink },
                  { rot: "Chamadas no mês", val: String(custo.chamadasMes), cor: C.ink },
                ].map((k) => (
                  <div
                    key={k.rot}
                    style={{
                      flex: 1,
                      border: `1.5px solid ${C.line}`,
                      borderRadius: 8,
                      padding: "10px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ ...disp, fontSize: 18, fontWeight: 800, color: k.cor }}>{k.val}</div>
                    <div style={{ ...mono, fontSize: 9, color: C.sub, marginTop: 2, lineHeight: 1.3 }}>
                      {k.rot.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: C.sub, padding: "0 4px 14px", lineHeight: 1.45 }}>
                {teto > 0
                  ? `Teto de ${formatarUSD(teto)}/mês — ${Math.min(100, Math.round((custo.mes / teto) * 100))}% usado.`
                  : "Sem teto mensal configurado."}
                {custo.cacheLeituraMes > 0 &&
                  ` ${Math.round(
                    (custo.cacheLeituraMes / Math.max(1, custo.cacheLeituraMes + custo.entradaMes)) * 100,
                  )}% dos tokens de entrada do mês vieram do cache (10% do preço).`}
              </div>
            </Cartao>
          )}

          {/* Conceito — a dimensão mais granular; só mostra os que já têm
              amostra suficiente (ver porConceito em repo.ts). Nomes de
              conceito podem ser bem longos, por isso um eixo Y mais largo
              (menos quebra de linha) e altura por item calculada a partir
              do rótulo mais longo (ver alturaRotuloQuebrado) — o card fica
              alto, mas nenhuma legenda se sobrepõe. */}
          <Cartao titulo="ACERTO POR CONCEITO">
            {dadosConceitos.length ? (
              <BarrasPct dados={dadosConceitos} alturaPorItem={30} />
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
