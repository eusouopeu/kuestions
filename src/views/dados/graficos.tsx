/**
 * Gráficos e cartões visuais da aba Dados, extraídos de DadosTab.tsx — a view
 * concentrava carregamento, agregação e desenho num arquivo só, e o desenho é
 * a parte que não depende de nada do estado da tela. Aqui só entram
 * componentes puros (recebem os dados prontos) e os helpers de medida que
 * eles usam.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { C } from "../../theme";
import { LIMIAR_APROVACAO } from "../../lib/constants";

export const LIMIAR_APROVACAO_PCT = LIMIAR_APROVACAO * 100;

/** Vermelho abaixo de 60%, azul até 80% (o limiar de aprovação, ver
 * LIMIAR_APROVACAO), verde a partir daí. */
export function corPct(pct: number): string {
  if (pct >= LIMIAR_APROVACAO_PCT) return C.ok;
  if (pct >= LIMIAR_APROVACAO_PCT - 20) return C.caneta;
  return C.erro;
}

export const tooltipStyle = {
  contentStyle: {
    background: C.card,
    border: `1.5px solid ${C.line}`,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: "'Montserrat', system-ui, sans-serif",
  },
  labelStyle: { color: C.sub, fontSize: 11 },
} as const;

export const eixo = {
  tick: { fontSize: 11, fill: C.sub, fontFamily: "'Montserrat', system-ui, sans-serif" },
  stroke: C.line,
} as const;

/** O `<Text>` de tick do recharts quebra rótulos longos em várias linhas
 * dentro da largura do eixo (`largura`) — sem prever isso, `alturaPorItem`
 * fixo faz linhas de categorias com nome longo (ex. conceitos) se sobrepor
 * verticalmente. Estimativa grosseira (chars por linha ~ largura/(fonte*0.6),
 * arredondado por cima) só para dimensionar o card; não precisa ser exata. */
export function alturaRotuloQuebrado(nome: string, largura: number, fonte = 11): number {
  const charsPorLinha = Math.max(6, Math.floor(largura / (fonte * 0.6)));
  const linhas = Math.max(1, Math.ceil(nome.length / charsPorLinha));
  return linhas * (fonte * 1.3);
}

/**
 * Barras de % de acerto com rótulo textual — o mesmo componente, com a mesma
 * `larguraEixo`, em TODOS os gráficos de barra horizontal da aba (nível,
 * tipo, formato, confiança e conceito). "Acerto por conceito" chegou a
 * calcular uma largura de eixo sob medida para caber nomes longos numa linha
 * só; o efeito colateral era comer até 190px da largura do cartão, deixando
 * aquele gráfico com metade da área de plotagem dos outros. Rótulo longo
 * agora quebra em várias linhas (a altura da linha já é calculada a partir
 * disso, ver alturaRotuloQuebrado) e a barra fica com a mesma extensão
 * lateral dos demais.
 */
export function BarrasPct({
  dados,
  alturaPorItem = 34,
  larguraEixo = 96,
}: {
  dados: { nome: string; pct: number; total: number }[];
  alturaPorItem?: number;
  /** Largura do eixo Y (rótulo da categoria). 96px é o mínimo em que a
   * palavra isolada mais longa dos conjuntos atuais ("Procedimentos") cabe
   * sem ser cortada — o recharts quebra o rótulo por espaços, mas não parte
   * palavra, então uma coluna mais estreita corta letra. Igual em todos os
   * gráficos de barra da aba, de propósito: é o que dá a todos a mesma área
   * de plotagem. */
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
        <ReferenceLine x={LIMIAR_APROVACAO_PCT} stroke={C.ok} strokeDasharray="3 3" />
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
export function addDiasISO(dataISO: string, n: number): string {
  const d = new Date(`${dataISO}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Calendário de sequência (heatmap estilo GitHub): uma coluna por semana,
 * uma célula por dia, mais escura quanto mais questões respondidas naquele
 * dia — visão rápida de constância que o número isolado de "sequência atual"
 * não mostra. Datas em UTC (mesma convenção de `ts`/streakDias) para não
 * desalinhar a grade por fuso horário. */
export function CalendarioSequencia({ atividade, dias }: { atividade: { data: string; total: number }[]; dias: number }) {
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
