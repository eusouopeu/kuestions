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
import {
  materiasComDados,
  porFormato,
  porNivel,
  porTipo,
  resumo,
  serieBlocos,
  type Fatia,
  type Resumo,
} from "../lib/repo";
import { labelFormato, labelTipo, NIVEIS } from "../lib/constants";

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
  const [niveis, setNiveis] = useState<Fatia[]>([]);
  const [tipos, setTipos] = useState<Fatia[]>([]);
  const [formatos, setFormatos] = useState<Fatia[]>([]);

  useEffect(() => {
    if (ativa) materiasComDados().then(setMaterias).catch(() => setMaterias([]));
  }, [ativa]);

  const carregar = useCallback(() => {
    // null = agrega todas as matérias; uma string = filtra estritamente por ela.
    const m = filtro === TODAS ? null : filtro;
    const n = filtroNivel === TODOS_NIVEIS ? null : filtroNivel;
    setCarregando(true);
    Promise.all([resumo(m, n), serieBlocos(m), porNivel(m), porTipo(m, n), porFormato(m, n)])
      .then(([r, s, ni, ti, fo]) => {
        setRes(r);
        setSerie(s);
        setNiveis(ni);
        setTipos(ti);
        setFormatos(fo);
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
        </>
      )}
    </Shell>
  );
}
