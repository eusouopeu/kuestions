/**
 * Fila de estudo (revisão ativa) do mapa mental — portado de buildDFSList e
 * handleAnswer em SynapsePro/index.html. Puro (sem DOM/React) para poder ser
 * testado em Node; MapaMental.tsx só chama estas funções e renderiza o
 * estado que elas devolvem.
 */
import type { NoMapa } from "./tipos";

/**
 * Ordem DFS a partir da raiz, pai antes dos filhos, um filho por vez antes
 * de avançar para o próximo — preserva a estrutura da árvore em vez de uma
 * ordem arbitrária. A raiz nunca entra na fila: ela é sempre mostrada como
 * contexto (a pergunta), nunca é o alvo a lembrar.
 */
export function construirFilaDFS(nos: NoMapa[], filtroIds: Set<number> | null = null): number[] {
  const raiz = nos.find((n) => n.pai === null);
  if (!raiz) return [];
  const porPai = new Map<number, NoMapa[]>();
  for (const n of nos) {
    if (n.pai !== null) {
      if (!porPai.has(n.pai)) porPai.set(n.pai, []);
      porPai.get(n.pai)!.push(n);
    }
  }
  const resultado: number[] = [];
  const visitados = new Set<number>();
  function dfs(id: number) {
    if (visitados.has(id)) return; // guarda contra ciclo
    visitados.add(id);
    if (!filtroIds || filtroIds.has(id)) resultado.push(id);
    for (const filho of porPai.get(id) ?? []) dfs(filho.id);
  }
  dfs(raiz.id);
  const i = resultado.indexOf(raiz.id);
  if (i !== -1) resultado.splice(i, 1);
  return resultado;
}

export function embaralhar<T>(lista: T[]): T[] {
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export type Penalidade = "logo" | "depois" | "nenhuma";

export interface EstadoFilaEstudo {
  fila: number[];
  filaErradas: number[];
}

/**
 * Aplica o resultado de uma resposta à fila. "logo" reinsere o nó 3
 * posições à frente na fila atual (repete em pouco tempo); "depois" manda
 * para o final, depois que a fila principal esvaziar (repete no fim da
 * sessão); "nenhuma" só descarta.
 */
export function responder(
  estado: EstadoFilaEstudo,
  acertou: boolean,
  penalidade: Penalidade,
): EstadoFilaEstudo {
  const [id, ...resto] = estado.fila;
  if (id === undefined) return estado;
  if (acertou) return { fila: resto, filaErradas: estado.filaErradas };
  if (penalidade === "logo") {
    const pos = Math.min(3, resto.length);
    const nova = [...resto.slice(0, pos), id, ...resto.slice(pos)];
    return { fila: nova, filaErradas: estado.filaErradas };
  }
  if (penalidade === "depois") {
    return { fila: resto, filaErradas: [...estado.filaErradas, id] };
  }
  return { fila: resto, filaErradas: estado.filaErradas };
}

/** Quando a fila principal esvazia mas há erradas pendentes ("depois"), elas
 * viram a nova fila principal — mesmo comportamento de presentQuestion no
 * SynapsePro. */
export function talvezReciclarErradas(
  estado: EstadoFilaEstudo,
  ordem: "sequencial" | "aleatoria",
): EstadoFilaEstudo {
  if (estado.fila.length > 0 || estado.filaErradas.length === 0) return estado;
  const recicladas = ordem === "aleatoria" ? embaralhar(estado.filaErradas) : estado.filaErradas;
  return { fila: recicladas, filaErradas: [] };
}
