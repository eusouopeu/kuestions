/**
 * Geração de questões via API da Anthropic.
 *
 * O prompt abaixo é o do artefato Questoes-Kumon.jsx, com três acréscimos:
 *   1. 3 questões por sub-bloco (era 5);
 *   2. tipos de cobrança selecionáveis: 2+ tipos escolhidos = sorteado por questão;
 *   3. `explicacoes_erradas` — explicação do erro de cada alternativa errada,
 *      com o mesmo nível de detalhe em CE e em MC.
 * As regras de segurança jurídica e de brevidade vêm do artefato sem mudança.
 *
 * Sobre `temperature: 0` (pedido na especificação): o parâmetro foi REMOVIDO
 * nos modelos atuais e uma requisição que o envie recebe erro 400. O controle
 * equivalente — e mais adequado a conteúdo técnico/jurídico — é adaptive
 * thinking com `effort`, que dá ao modelo espaço para executar a
 * autoverificação factual exigida no prompt antes de fechar o JSON.
 */
import Anthropic from "@anthropic-ai/sdk";
import { getApiKey, getProxyUrl } from "./secure";
import { NIVEIS, NIVEL_DESCRICOES, Q_POR_SUB, TIPOS, TIPO_IDS, type TipoId } from "./constants";
import type { Config, Questao } from "./types";

export const MODEL = "claude-sonnet-5";

export class SemCredencialError extends Error {
  constructor() {
    super("Nenhuma chave de API configurada. Abra a aba Ajustes.");
    this.name = "SemCredencialError";
  }
}

async function criarCliente(): Promise<Anthropic> {
  const [apiKey, proxyUrl] = await Promise.all([getApiKey(), getProxyUrl()]);
  if (!apiKey && !proxyUrl) throw new SemCredencialError();

  return new Anthropic({
    apiKey: apiKey || "via-proxy",
    // Um proxy próprio (ex.: Cloudflare Worker) deve expor /v1/messages.
    ...(proxyUrl ? { baseURL: proxyUrl.replace(/\/+$/, "") } : {}),
    // Obrigatório para chamadas feitas de dentro de uma WebView/browser.
    dangerouslyAllowBrowser: true,
    maxRetries: 2,
  });
}

/* ---------- Montagem do prompt ---------- */

function descricaoTipo(tipos: TipoId[]): string {
  if (tipos.length <= 1) {
    const t = TIPOS.find((x) => x.id === tipos[0]) ?? TIPOS[0];
    return `${t.label} — ${t.desc}`;
  }
  const lista = tipos
    .map((id) => {
      const t = TIPOS.find((x) => x.id === id)!;
      return `  - ${t.id}: ${t.label} — ${t.desc}`;
    })
    .join("\n");
  return `MISTURADO. Sorteie um tipo diferente para cada questão deste sub-bloco, entre:
${lista}
As ${Q_POR_SUB} questões do sub-bloco devem usar tipos de cobrança DIFERENTES entre si.`;
}

function descricaoFormato(formato: Config["formato"]): string {
  if (formato === "ce")
    return `Todas as ${Q_POR_SUB} questões em Certo/Errado ("formato":"ce").`;
  if (formato === "mc")
    return `Todas as ${Q_POR_SUB} questões em múltipla escolha com 5 alternativas A–E ("formato":"mc").`;
  return `Alternar: questões 1 e 3 em Certo/Errado ("ce"); questão 2 em múltipla escolha A–E ("mc").`;
}

/**
 * Instrução de equilíbrio do gabarito em Certo/Errado. O modelo tem viés
 * estatístico conhecido de gerar "Certo" com frequência bem maior que
 * "Errado" — ao contrário do viés de múltipla escolha (letra A), este não dá
 * para corrigir reordenando nada no cliente, porque C/E não têm "posição": a
 * própria afirmação é que precisa ser verdadeira ou falsa. A única alavanca é
 * mostrar ao modelo o histórico real do bloco e mandar corrigir o
 * desequilíbrio a cada novo sub-bloco.
 */
function instrucaoEquilibrioGabarito(gabaritosCEAnteriores: string[]): string {
  const totalC = gabaritosCEAnteriores.filter((g) => g === "C").length;
  const totalE = gabaritosCEAnteriores.filter((g) => g === "E").length;
  const historico = gabaritosCEAnteriores.length
    ? `Nos sub-blocos já gerados neste bloco: ${totalC} gabarito "Certo" e ${totalE} "Errado". `
    : "";

  return `EQUILÍBRIO DO GABARITO EM CERTO/ERRADO (obrigatório)
- Decida o valor-verdade de cada assertiva (Certo ou Errado) pelo conteúdo jurídico, nunca por hábito de gerar mais afirmações verdadeiras do que falsas — esse viés é o erro mais comum ao elaborar questões CE.
- ${historico}Se houver desequilíbrio acumulado, CORRIJA agora: prefira o gabarito menos usado até aqui neste sub-bloco.
- Nas ${Q_POR_SUB} questões CE deste sub-bloco, não deixe todas com o mesmo gabarito — varie genuinamente, a menos que o conteúdo torne isso artificial.`;
}

/** A partir daqui os distratores devem errar só por detalhe factual pontual
 * (prazo, valor, data, nome, sujeito), não por erro de conceito — ver
 * NIVEL_DESCRICOES em constants.ts. */
const NIVEL_MIN_DETALHE_PONTUAL = 4;

export function montarPrompt(
  cfg: Config & { materia: string },
  _loteIdx: number,
  padroesAnteriores: string[],
  gabaritosCEAnteriores: string[] = [],
): string {
  const temCE = cfg.formato !== "mc";
  const descNivel = NIVEL_DESCRICOES[cfg.nivel - 1];

  return `Você é elaborador de questões de concurso da área fiscal (padrão SEFAZ / bancas FCC, FGV, Cebraspe). Gere EXATAMENTE ${Q_POR_SUB} questões inéditas.

CONFIGURAÇÃO
- Matéria: ${cfg.materia}
- Tópico: ${cfg.topico ? cfg.topico : "núcleo central da matéria"}
- Tipo de cobrança: ${descricaoTipo(cfg.tipos)}
- Dificuldade (1 a 5): ${cfg.nivel} (${NIVEIS[cfg.nivel - 1]}) — ${descNivel}
- Formato: ${descricaoFormato(cfg.formato)}

LÓGICA KUMON
- As ${Q_POR_SUB} questões devem ser quase-repetitivas entre si: mesma estrutura e mesmo padrão conceitual, variando apenas casos, sujeitos, entes e valores (automatização por repetição).
${padroesAnteriores.length ? `- NÃO reutilize literalmente os padrões já usados neste bloco: ${padroesAnteriores.join("; ")}.` : ""}

${temCE ? instrucaoEquilibrioGabarito(gabaritosCEAnteriores) : ""}

QUALIDADE DOS DISTRATORES
- Toda alternativa errada deve ser PLAUSÍVEL: deve corresponder a um erro real de raciocínio, a uma confusão frequente entre institutos próximos, ou a uma troca de requisito/prazo/sujeito verossímil.
- Nunca produza alternativa manifestamente absurda, nem descartável apenas pela forma (tamanho, tom, "todas as anteriores", exageros como "sempre"/"nunca" quando gratuitos).
${
  cfg.nivel >= NIVEL_MIN_DETALHE_PONTUAL
    ? `- Neste nível, cada alternativa errada deve repetir quase todo o texto do gabarito e divergir por UM ÚNICO detalhe factual (um prazo, um valor, uma data, um nome, uma competência) — não por erro de conceito. O restante da frase deve ser idêntico ou equivalente ao correto.`
    : ""
}

EXPLICAÇÃO POR ALTERNATIVA (obrigatório)
- "comentario": por que o gabarito está correto.
- "explicacoes_erradas": objeto letra → explicação. Uma entrada para CADA alternativa errada.
  - Em múltipla escolha: as 4 letras erradas.
  - Em Certo/Errado: a única letra errada ("C" se o gabarito é "E", ou "E" se o gabarito é "C").
- Cada explicação deve nomear o ERRO ESPECÍFICO de raciocínio ou de memória que leva a marcar aquela alternativa (qual conceito foi trocado por qual, qual requisito foi ignorado, qual prazo/sujeito foi confundido). Não escreva "está incorreta" nem repita o gabarito.
- O nível de detalhe deve ser o MESMO em Certo/Errado e em múltipla escolha: a explicação da alternativa errada em CE é tão detalhada quanto a de cada distrator em MC.

SEGURANÇA JURÍDICA E AUTOVERIFICAÇÃO
- Cite dispositivo legal (ex.: "art. 150, III, b, CF/88") SOMENTE se tiver plena certeza; na dúvida, indique apenas o nome do instituto e deixe "dispositivo" como null.
- Nunca invente números de artigos, súmulas, alíquotas, prazos ou percentuais.
- Antes de fechar o JSON, revise cada questão e confirme: (a) o gabarito está factualmente correto; (b) nenhuma outra alternativa também está correta; (c) todo dispositivo citado existe e diz o que você afirmou; (d) todo número usado em cálculo fecha na conta. Se algum item não passar, corrija a questão antes de responder.

BREVIDADE (obrigatório): enunciado ≤ 45 palavras; cada alternativa ≤ 12 palavras; comentario ≤ 22 palavras; cada explicação de alternativa errada ≤ 25 palavras.

Responda APENAS com JSON válido, sem markdown, sem texto fora do JSON:
{"questoes":[{"enunciado":"...","formato":"ce" ou "mc","alternativas":["A) ...","B) ...","C) ...","D) ...","E) ..."] ou null,"gabarito":"C"/"E" ou "A"–"E","conceitos":["conceito 1","..."],"comentario":"...","explicacoes_erradas":{"A":"...","B":"..."},"dispositivo":"art. X ..." ou null,"tipo_cobranca":"abstrato"|"caso"|"calculo"|"conceito"}]}`;
}

/* ---------- Parsing tolerante ---------- */

/**
 * Extrai o JSON da resposta. Herdado do artefato, incluindo o reparo por
 * truncamento: corta até o último objeto completo do array e fecha na mão.
 */
function extrairJSON(texto: string): unknown {
  let t = texto.replace(/```json|```/g, "").trim();
  const ini = t.indexOf("{");
  const fim = t.lastIndexOf("}");
  if (ini === -1 || fim === -1) throw new Error("sem JSON");
  t = t.slice(ini, fim + 1);
  try {
    return JSON.parse(t);
  } catch (e) {
    const ult = t.lastIndexOf("}", t.lastIndexOf("},"));
    if (ult > 0) return JSON.parse(t.slice(0, ult + 1) + "]}");
    throw e;
  }
}

export function tentarParse(texto: string): { questoes?: unknown[] } {
  return extrairJSON(texto) as { questoes?: unknown[] };
}

const LETRAS_MC = ["A", "B", "C", "D", "E"];

/** Fisher-Yates. */
function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Reordena as alternativas de uma questão MC e recalcula letra a letra
 * (gabarito e explicacoes_erradas). O modelo tem viés estatístico conhecido
 * de concentrar o gabarito na letra A — em vez de tentar corrigir isso só
 * via instrução de prompt (que o modelo pode ignorar), embaralhamos a ORDEM
 * das alternativas no cliente depois de recebidas: a posição da resposta
 * certa deixa de depender do modelo e passa a ser puramente aleatória, o que
 * garante distribuição uniforme entre A–E de verdade.
 */
function embaralharAlternativas(q: Questao): Questao {
  if (q.formato !== "mc" || !q.alternativas || q.alternativas.length < 2) return q;

  const letras = LETRAS_MC.slice(0, q.alternativas.length);
  const pares = q.alternativas.map((alt, i) => ({
    letraOriginal: letras[i],
    // Remove o prefixo "A) " etc. — é reaplicado com a nova letra abaixo.
    texto: alt.replace(/^[A-E]\)\s*/, ""),
  }));
  const embaralhados = embaralhar(pares);

  const alternativas = embaralhados.map((p, i) => `${letras[i]}) ${p.texto}`);
  const mapa = new Map(embaralhados.map((p, i) => [p.letraOriginal, letras[i]]));

  const explicacoes_erradas: Record<string, string> = {};
  for (const [letraOriginal, texto] of Object.entries(q.explicacoes_erradas)) {
    const nova = mapa.get(letraOriginal);
    if (nova) explicacoes_erradas[nova] = texto;
  }

  return {
    ...q,
    alternativas,
    gabarito: mapa.get(q.gabarito) ?? q.gabarito,
    explicacoes_erradas,
  };
}

/**
 * Normaliza uma questão crua (da API, de um JSON importado ou de um formulário
 * manual — todos passam por aqui). Garante que `explicacoes_erradas` cubra
 * todas as alternativas erradas: uma entrada faltando viraria uma tela vazia
 * na revelação, então preenchemos com um texto neutro em vez de renderizar
 * nada. `formatoEsperado: "misto"` respeita o `formato` de cada questão
 * individualmente — é o que a importação usa, já que um JSON externo pode
 * misturar CE e MC livremente.
 */
export function normalizarQuestao(
  raw: unknown,
  formatoEsperado: Config["formato"],
): Questao | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;

  const enunciado = typeof q.enunciado === "string" ? q.enunciado.trim() : "";
  const gabarito = typeof q.gabarito === "string" ? q.gabarito.trim().toUpperCase() : "";
  if (!enunciado || !gabarito) return null;

  let formato: "ce" | "mc" = q.formato === "mc" ? "mc" : "ce";
  if (formatoEsperado === "ce") formato = "ce";
  if (formatoEsperado === "mc") formato = "mc";

  let alternativas: string[] | null = null;
  if (formato === "mc") {
    const arr = Array.isArray(q.alternativas)
      ? q.alternativas.filter((x): x is string => typeof x === "string")
      : [];
    if (arr.length < 2) return null; // MC sem alternativas é inaproveitável
    alternativas = arr.slice(0, 5);
  }

  const letrasValidas =
    formato === "ce" ? ["C", "E"] : LETRAS_MC.slice(0, alternativas!.length);
  if (!letrasValidas.includes(gabarito)) return null;

  const erradas = letrasValidas.filter((l) => l !== gabarito);
  const brutas =
    q.explicacoes_erradas && typeof q.explicacoes_erradas === "object"
      ? (q.explicacoes_erradas as Record<string, unknown>)
      : {};
  const explicacoes: Record<string, string> = {};
  for (const l of erradas) {
    const v = brutas[l];
    explicacoes[l] =
      typeof v === "string" && v.trim()
        ? v.trim()
        : "O modelo não detalhou o erro desta alternativa.";
  }

  const tipo = q.tipo_cobranca;
  return embaralharAlternativas({
    enunciado,
    formato,
    alternativas,
    gabarito,
    conceitos: Array.isArray(q.conceitos)
      ? q.conceitos.filter((x): x is string => typeof x === "string" && !!x.trim())
      : [],
    comentario: typeof q.comentario === "string" ? q.comentario.trim() : "",
    explicacoes_erradas: explicacoes,
    dispositivo: typeof q.dispositivo === "string" && q.dispositivo.trim() ? q.dispositivo.trim() : null,
    tipo_cobranca: TIPO_IDS.includes(tipo as TipoId) ? (tipo as TipoId) : undefined,
  });
}

/* ---------- Chamada ---------- */

async function chamar(prompt: string): Promise<string> {
  const client = await criarCliente();

  // Streaming: com adaptive thinking ligado, o raciocínio consome parte do
  // max_tokens, e um max_tokens alto sem streaming arrisca timeout de HTTP.
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 24000,
    // effort médio: equilíbrio entre a autoverificação factual pedida no
    // prompt e custo/latência por chamada — cada bloco já são 4 chamadas.
    output_config: { effort: "medium" },
    messages: [{ role: "user", content: prompt }],
  });

  const msg = await stream.finalMessage();

  if (msg.stop_reason === "refusal") {
    throw new Error(
      "O modelo recusou gerar este conteúdo. Reformule a matéria ou o tópico.",
    );
  }
  if (msg.stop_reason === "max_tokens") {
    throw new Error("Resposta truncada pelo limite de tokens. Tente novamente.");
  }

  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function mensagemDeErro(e: unknown): string {
  if (e instanceof SemCredencialError) return e.message;
  if (e instanceof Anthropic.AuthenticationError)
    return "Chave de API inválida ou expirada. Confira em Ajustes.";
  if (e instanceof Anthropic.PermissionDeniedError)
    return "Esta chave não tem acesso ao modelo. Confira em Ajustes.";
  if (e instanceof Anthropic.RateLimitError)
    return "Limite de uso da API atingido. Tente de novo em instantes.";
  if (e instanceof Anthropic.APIConnectionError)
    return "Falha de rede ao falar com a API. Verifique a conexão.";
  if (e instanceof Anthropic.APIError)
    return `Erro ${e.status ?? ""} da API: ${e.message}`;
  return e instanceof Error ? e.message : "Falha ao gerar o sub-bloco.";
}

/**
 * Gera um sub-bloco. Uma única retentativa em caso de resposta malformada,
 * como no artefato; erros de credencial não são repetidos (retentar não muda
 * o resultado e só queima uma chamada).
 */
export async function gerarSubBloco(
  cfg: Config & { materia: string },
  subIdx: number,
  padroesAnteriores: string[],
  gabaritosCEAnteriores: string[] = [],
  tentativa = 0,
): Promise<Questao[]> {
  try {
    const texto = await chamar(montarPrompt(cfg, subIdx, padroesAnteriores, gabaritosCEAnteriores));
    const obj = tentarParse(texto);
    const qs = (obj.questoes ?? [])
      .map((r) => normalizarQuestao(r, cfg.formato))
      .filter((q): q is Questao => q !== null);

    if (qs.length < Q_POR_SUB) throw new Error("questões insuficientes");
    return qs.slice(0, Q_POR_SUB);
  } catch (e) {
    if (e instanceof SemCredencialError) throw e;
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      throw new Error(mensagemDeErro(e));
    }
    if (tentativa < 1) {
      return gerarSubBloco(cfg, subIdx, padroesAnteriores, gabaritosCEAnteriores, tentativa + 1);
    }
    throw new Error(mensagemDeErro(e));
  }
}

/* ---------- Explicações para questões reais (banco de questões) ---------- */

function montarPromptExplicacoes(questoes: Questao[]): string {
  const lista = questoes
    .map((q, i) => {
      const alts = q.alternativas ? q.alternativas.join(" | ") : "C) Certo | E) Errado";
      return `${i + 1}. Enunciado: ${q.enunciado}\nAlternativas: ${alts}\nGabarito: ${q.gabarito}`;
    })
    .join("\n\n");

  return `Você é revisor de questões de concurso da área fiscal já prontas — NÃO altere enunciado, alternativas nem gabarito, eles já vêm corretos de uma prova real. Para CADA questão abaixo, na ordem em que aparecem, escreva:
- "comentario": por que o gabarito está correto.
- "explicacoes_erradas": objeto letra → explicação, uma entrada para CADA alternativa que não é o gabarito, nomeando o erro específico de raciocínio, de conceito ou de detalhe (data, prazo, valor, sujeito) que leva a marcar aquela alternativa. Não escreva "está incorreta" nem repita o gabarito.

BREVIDADE (obrigatório): comentario ≤ 22 palavras; cada explicação de alternativa errada ≤ 25 palavras.

QUESTÕES:
${lista}

Responda APENAS com JSON válido, sem markdown, sem texto fora do JSON, com EXATAMENTE ${questoes.length} itens na MESMA ORDEM das questões acima:
{"explicacoes":[{"comentario":"...","explicacoes_erradas":{"A":"...","B":"..."}}]}`;
}

/**
 * Preenche `comentario`/`explicacoes_erradas` de questões reais do banco
 * (enunciado/alternativas/gabarito ficam intocados — só a explicação é
 * gerada). Em caso de falha, devolve as questões como vieram (comentário
 * vazio, explicações com "—") em vez de travar a montagem do bloco.
 */
export async function gerarExplicacoes(questoes: Questao[]): Promise<Questao[]> {
  try {
    const texto = await chamar(montarPromptExplicacoes(questoes));
    const obj = extrairJSON(texto) as { explicacoes?: unknown[] };
    const itens = obj.explicacoes ?? [];

    return questoes.map((q, i) => {
      const item = itens[i] as Record<string, unknown> | undefined;
      const letrasErradas = LETRAS_MC.slice(0, q.alternativas?.length ?? 5).filter(
        (l) => l !== q.gabarito,
      );
      const brutas =
        item?.explicacoes_erradas && typeof item.explicacoes_erradas === "object"
          ? (item.explicacoes_erradas as Record<string, unknown>)
          : {};
      const explicacoes_erradas: Record<string, string> = {};
      for (const l of letrasErradas) {
        const v = brutas[l];
        explicacoes_erradas[l] =
          typeof v === "string" && v.trim() ? v.trim() : "O modelo não detalhou o erro desta alternativa.";
      }
      return {
        ...q,
        comentario: typeof item?.comentario === "string" ? item.comentario.trim() : q.comentario,
        explicacoes_erradas,
      };
    });
  } catch (e) {
    // Sem credencial ou credencial inválida: o usuário precisa ser avisado,
    // não receber um bloco silenciosamente sem explicações. Outras falhas
    // (parsing, timeout) degradam para o bloco sem explicação em vez de
    // travar a montagem — a questão real em si já tem valor sozinha.
    if (e instanceof SemCredencialError) throw e;
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      throw new Error(mensagemDeErro(e));
    }
    console.error("gerar explicações", e);
    return questoes;
  }
}
