/** Tabela `uso_api`: custo e consumo de tokens de cada chamada à Anthropic. */
import { one, run } from "../db";
import { calcularCusto, mesAtual, type UsoTokens } from "../custo";
import { Q_POR_SUB } from "../constants";

/**
 * Uma linha por chamada concluída à API (ver `chamar` em anthropic.ts). O
 * custo é calculado na hora da gravação e persistido junto: se a tabela de
 * preços de lib/custo.ts mudar, o histórico continua refletindo o que de fato
 * foi cobrado na época.
 */
export async function registrarUsoApi(args: {
  modelo: string;
  /** Rótulo curto do que motivou a chamada ("sub-bloco", "explicação"…) —
   * permite ver depois onde o dinheiro está indo. */
  origem: string;
  uso: UsoTokens;
}): Promise<void> {
  const custo = calcularCusto(args.modelo, args.uso);
  await run(
    `INSERT INTO uso_api
       (ts, modelo, origem, tokens_entrada, tokens_saida, cache_escrita, cache_leitura, custo_usd)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      new Date().toISOString(),
      args.modelo,
      args.origem,
      args.uso.entrada,
      args.uso.saida,
      args.uso.cacheEscrita,
      args.uso.cacheLeitura,
      custo,
    ],
  );
}

export interface ResumoCusto {
  /** Gasto do mês corrente, em dólares. */
  mes: number;
  /** Gasto acumulado desde a instalação. */
  total: number;
  /** Chamadas no mês corrente. */
  chamadasMes: number;
  /** Tokens lidos do cache no mês — quanto o prompt caching está poupando. */
  cacheLeituraMes: number;
  /** Tokens de entrada cobrados cheios no mês, para comparar com o de cima. */
  entradaMes: number;
}

export async function resumoCusto(): Promise<ResumoCusto> {
  const mes = mesAtual();
  const linhaMes = await one<{
    custo: number | null;
    chamadas: number;
    cache: number | null;
    entrada: number | null;
  }>(
    `SELECT SUM(custo_usd) AS custo, COUNT(*) AS chamadas,
            SUM(cache_leitura) AS cache, SUM(tokens_entrada) AS entrada
     FROM uso_api WHERE substr(ts, 1, 7) = ?`,
    [mes],
  );
  const linhaTotal = await one<{ custo: number | null }>(
    `SELECT SUM(custo_usd) AS custo FROM uso_api`,
  );
  return {
    mes: Number(linhaMes?.custo ?? 0),
    total: Number(linhaTotal?.custo ?? 0),
    chamadasMes: Number(linhaMes?.chamadas ?? 0),
    cacheLeituraMes: Number(linhaMes?.cache ?? 0),
    entradaMes: Number(linhaMes?.entrada ?? 0),
  };
}

/** Custo médio de um bloco gerado, para estimar o preço do próximo antes de
 * disparar. Usa as chamadas de sub-bloco dos últimos 30 dias (as únicas com
 * volume previsível) e devolve null sem amostra suficiente. */
export async function custoMedioPorBloco(questoesPorBloco: number): Promise<number | null> {
  const linha = await one<{ custo: number | null; chamadas: number }>(
    `SELECT SUM(custo_usd) AS custo, COUNT(*) AS chamadas
     FROM uso_api
     WHERE origem = 'sub-bloco' AND ts >= ?`,
    [new Date(Date.now() - 30 * 86_400_000).toISOString()],
  );
  const chamadas = Number(linha?.chamadas ?? 0);
  if (chamadas < 2) return null;
  const custoPorSub = Number(linha?.custo ?? 0) / chamadas;
  return custoPorSub * (questoesPorBloco / Q_POR_SUB);
}
