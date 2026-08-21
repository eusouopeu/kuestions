/**
 * Custo da API: tabela de preços, cálculo por chamada e teto mensal.
 *
 * O app gasta a conta pessoal do usuário na Anthropic (cada bloco de 12
 * questões são 4 chamadas, ver gerarSubBloco em anthropic.ts) e até aqui não
 * havia nenhum lugar onde ver quanto isso custa. `calcularCusto` transforma o
 * `usage` devolvido pela API em dólares; quem grava é `registrarUsoApi` em
 * repo.ts (tabela `uso_api`, migração 12).
 *
 * Os preços são por milhão de tokens, conforme a tabela pública da Anthropic.
 * Cache tem preço próprio: escrever no cache custa 1,25× o token de entrada e
 * ler custa 0,1× — é o que torna o prompt caching de anthropic.ts vantajoso.
 * Sonnet 5 está com preço promocional de entrada ($2/$10) até 31/08/2026; a
 * tabela usa o preço cheio de propósito, para o valor exibido nunca ficar
 * ABAIXO do que a fatura vai cobrar.
 */
import { Preferences } from "@capacitor/preferences";

/** Preço em dólares por milhão de tokens. */
export interface PrecoModelo {
  entrada: number;
  saida: number;
}

const PRECOS: Record<string, PrecoModelo> = {
  "claude-sonnet-5": { entrada: 3, saida: 15 },
  "claude-opus-5": { entrada: 5, saida: 25 },
  "claude-haiku-4-5": { entrada: 1, saida: 5 },
};

/** Modelo desconhecido (trocado numa versão futura sem atualizar a tabela)
 * cai no preço do Sonnet — melhor uma estimativa aproximada do que zero, que
 * daria a impressão falsa de que aquela chamada foi gratuita. */
const PRECO_PADRAO = PRECOS["claude-sonnet-5"];

export const MULT_CACHE_ESCRITA = 1.25;
export const MULT_CACHE_LEITURA = 0.1;

export function precoDoModelo(modelo: string): PrecoModelo {
  return PRECOS[modelo] ?? PRECO_PADRAO;
}

/** Os quatro contadores de `message.usage` que têm preço distinto. */
export interface UsoTokens {
  entrada: number;
  saida: number;
  cacheEscrita: number;
  cacheLeitura: number;
}

/** Custo em dólares de uma chamada. */
export function calcularCusto(modelo: string, uso: UsoTokens): number {
  const p = precoDoModelo(modelo);
  const porMilhao =
    uso.entrada * p.entrada +
    uso.saida * p.saida +
    uso.cacheEscrita * p.entrada * MULT_CACHE_ESCRITA +
    uso.cacheLeitura * p.entrada * MULT_CACHE_LEITURA;
  return porMilhao / 1_000_000;
}

/** "$0,42" / "$1,03" — o custo por bloco é de centavos, então 2 casas bastam,
 * mas valores muito pequenos viram "< $0,01" em vez de "$0,00" (que leria
 * como gratuito). */
export function formatarUSD(valor: number): string {
  if (valor > 0 && valor < 0.005) return "< $0,01";
  return `$${valor.toFixed(2).replace(".", ",")}`;
}

/** Mês corrente no mesmo formato de `substr(ts,1,7)` usado na agregação. */
export function mesAtual(): string {
  return new Date().toISOString().slice(0, 7);
}

/* ---------- Teto mensal ---------- */

const K_TETO = "custo-teto-mensal";

/** 0 = sem teto (só acompanha o gasto, nunca bloqueia). */
export const TETO_PADRAO = 0;

export async function getTetoMensal(): Promise<number> {
  try {
    const { value } = await Preferences.get({ key: K_TETO });
    const n = value ? Number(value) : TETO_PADRAO;
    return Number.isFinite(n) && n >= 0 ? n : TETO_PADRAO;
  } catch {
    return TETO_PADRAO;
  }
}

export async function setTetoMensal(valor: number): Promise<void> {
  await Preferences.set({ key: K_TETO, value: String(Math.max(0, valor)) });
}

export type SituacaoTeto = "sem-teto" | "ok" | "perto" | "estourado";

/** Situação do gasto do mês diante do teto — "perto" a partir de 80%, o
 * mesmo ponto em que faz sentido avisar antes de disparar um bloco novo. */
export function situacaoTeto(gastoMes: number, teto: number): SituacaoTeto {
  if (!teto) return "sem-teto";
  if (gastoMes >= teto) return "estourado";
  if (gastoMes >= teto * 0.8) return "perto";
  return "ok";
}
