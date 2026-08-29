/**
 * Saneamento e auto-layout de mapas mentais — portados de sanitizeMindmap e
 * autoLayoutNodes em SynapsePro/index.html, com os mesmos objetivos: um
 * import malformado (JSON externo, mapa corrompido) nunca deve quebrar a
 * tela, e sempre existe exatamente uma raiz alcançável por todos os nós.
 * Puro (sem DOM/React) para poder ser testado em Node.
 */
import { type NoMapa } from "./tipos";

export interface ResultadoSaneamento {
  ok: boolean;
  nos?: NoMapa[];
  erro?: string;
  curado: string[];
  precisaLayout: boolean;
}

const TAMANHOS = ["pequeno", "medio", "grande"] as const;

/**
 * Corrige um array de nós vindo de import/JSON externo: ids ausentes ou
 * duplicados, raiz ausente ou múltipla, pai inexistente ou apontando para
 * si mesmo, e ciclos (que travariam a renderização e o modo estudo em
 * recursão infinita) — cada um vira um nó órfão reanexado à raiz.
 */
export function sanearMapa(nosEntrada: unknown): ResultadoSaneamento {
  const curado: string[] = [];
  if (!Array.isArray(nosEntrada) || nosEntrada.length === 0) {
    return { ok: false, erro: "Nenhum nó encontrado.", curado, precisaLayout: false };
  }

  const nos = nosEntrada
    .filter((n): n is Record<string, unknown> => !!n && typeof n === "object" && !Array.isArray(n))
    .map((n) => ({ ...n }));
  if (nos.length === 0) {
    return { ok: false, erro: "Nenhum nó válido encontrado.", curado, precisaLayout: false };
  }
  if (nos.length < nosEntrada.length) {
    curado.push(`removidos ${nosEntrada.length - nos.length} nós inválidos`);
  }

  // ids: string numérica -> number; ids ausentes/duplicados recebem novo id.
  const normId = (v: unknown): unknown =>
    typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) : v;
  for (const n of nos) {
    n.id = normId(n.id);
    n.parent = n.parent === undefined || n.parent === "null" || n.parent === "" ? null : normId(n.parent);
  }
  const vistos = new Set<unknown>();
  let proximoId = nos.reduce(
    (m, n) => (typeof n.id === "number" && Number.isFinite(n.id) ? Math.max(m, n.id) : m),
    0,
  );
  for (const n of nos) {
    const idValido = typeof n.id === "number" && Number.isFinite(n.id);
    if (!idValido || vistos.has(n.id)) {
      n.id = ++proximoId;
      curado.push("id ausente/duplicado reatribuído");
    }
    vistos.add(n.id);
  }

  // Exatamente uma raiz (parent === null).
  let raizes = nos.filter((n) => n.parent === null);
  if (raizes.length === 0) {
    nos[0].parent = null;
    raizes = [nos[0]];
    curado.push("nenhuma raiz encontrada — o primeiro nó virou raiz");
  }
  const raiz = raizes[0];
  if (raizes.length > 1) {
    for (const r of raizes.slice(1)) r.parent = raiz.id;
    curado.push("múltiplas raízes — extras anexadas à primeira");
  }

  // Auto-referência ou pai inexistente -> vira filho da raiz.
  const idSet = new Set(nos.map((n) => n.id));
  for (const n of nos) {
    if (n.parent !== null && (n.parent === n.id || !idSet.has(n.parent))) {
      n.parent = raiz.id;
      curado.push("nó apontava para um pai inexistente");
    }
  }

  // Ciclos: qualquer nó não alcançável a partir da raiz vira filho dela.
  const filhosDe = new Map<unknown, Record<string, unknown>[]>();
  for (const n of nos) {
    if (n.parent !== null) {
      if (!filhosDe.has(n.parent)) filhosDe.set(n.parent, []);
      filhosDe.get(n.parent)!.push(n);
    }
  }
  function alcancaveis(): Set<unknown> {
    const r = new Set<unknown>([raiz.id]);
    const pilha = [raiz.id];
    while (pilha.length) {
      const atual = pilha.pop();
      for (const c of filhosDe.get(atual) ?? []) {
        if (!r.has(c.id)) {
          r.add(c.id);
          pilha.push(c.id);
        }
      }
    }
    return r;
  }
  let alcance = alcancaveis();
  let guarda = 0;
  while (alcance.size < nos.length && guarda++ <= nos.length) {
    const orfao = nos.find((n) => !alcance.has(n.id));
    if (!orfao) break;
    const antigoPai = orfao.parent;
    if (antigoPai !== null && filhosDe.has(antigoPai)) {
      const arr = filhosDe.get(antigoPai)!;
      const i = arr.indexOf(orfao);
      if (i !== -1) arr.splice(i, 1);
    }
    orfao.parent = raiz.id;
    if (!filhosDe.has(raiz.id)) filhosDe.set(raiz.id, []);
    filhosDe.get(raiz.id)!.push(orfao);
    curado.push("referência circular quebrada");
    alcance = alcancaveis();
  }

  let precisaLayout = false;
  const resultado: NoMapa[] = nos.map((n) => {
    const x = typeof n.x === "number" && Number.isFinite(n.x) ? n.x : NaN;
    const y = typeof n.y === "number" && Number.isFinite(n.y) ? n.y : NaN;
    if (Number.isNaN(x) || Number.isNaN(y)) precisaLayout = true;
    return {
      id: Number(n.id),
      texto: typeof n.text === "string" ? n.text : typeof n.texto === "string" ? n.texto : "",
      x: Number.isNaN(x) ? 0 : x,
      y: Number.isNaN(y) ? 0 : y,
      pai: n.parent === null ? null : Number(n.parent),
      cor: typeof n.cor === "string" ? n.cor : "caneta",
      tamanho: TAMANHOS.includes(n.tamanho as never) ? (n.tamanho as NoMapa["tamanho"]) : "medio",
      dica: typeof n.dica === "string" ? n.dica : undefined,
      largura: typeof n.largura === "number" ? n.largura : undefined,
      altura: typeof n.altura === "number" ? n.altura : undefined,
    };
  });

  return { ok: true, nos: resultado, curado, precisaLayout };
}

/**
 * Layout em árvore top-down: raiz no topo, filhos distribuídos
 * horizontalmente sob o pai, uma geração por nível — mesmo algoritmo de
 * autoLayoutNodes, sem depender de medir o DOM (aqui recebe a largura como
 * parâmetro, para poder rodar antes do primeiro paint).
 */
export function autoLayout(nos: NoMapa[], larguraContainer = 900): NoMapa[] {
  const raiz = nos.find((n) => n.pai === null);
  if (!raiz) return nos;

  const filhosDe = new Map<number, NoMapa[]>();
  for (const n of nos) {
    if (n.pai !== null) {
      if (!filhosDe.has(n.pai)) filhosDe.set(n.pai, []);
      filhosDe.get(n.pai)!.push(n);
    }
  }

  const V_ESPACO = 100;
  const H_ESPACO = 180;
  const visitados = new Set<number>();
  const porId = new Map(nos.map((n) => [n.id, n]));

  function posicionar(no: NoMapa, x: number, y: number) {
    if (visitados.has(no.id)) return;
    visitados.add(no.id);
    no.x = x;
    no.y = y;
    const filhos = filhosDe.get(no.id) ?? [];
    const larguraTotal = (filhos.length - 1) * H_ESPACO;
    const inicioX = x - larguraTotal / 2;
    filhos.forEach((filho, i) => posicionar(filho, inicioX + i * H_ESPACO, y + V_ESPACO));
  }
  posicionar(raiz, larguraContainer / 2 - 75, 50);

  return nos.map((n) => porId.get(n.id) ?? n);
}
