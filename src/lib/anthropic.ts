/**
 * Geração de questões via API da Anthropic.
 *
 * O prompt abaixo é o do artefato Questoes-Kumon.jsx, com três acréscimos:
 *   1. 3 questões por sub-bloco (era 5);
 *   2. tipos de cobrança selecionáveis: 2+ tipos escolhidos = sorteado por questão;
 *   3. `explicacoes_erradas` — explicação do erro de cada alternativa errada
 *      em múltipla escolha. Em Certo/Errado não há: o item afirma uma coisa
 *      só, e o comentário do gabarito já é a explicação inteira.
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

function descricaoTipo(tipos: TipoId[], nQuestoes: number): string {
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
As ${nQuestoes} questões do sub-bloco devem usar tipos de cobrança DIFERENTES entre si.`;
}

function descricaoFormato(formato: Config["formato"], nQuestoes: number): string {
  if (formato === "ce")
    return `Todas as ${nQuestoes} questões em Certo/Errado ("formato":"ce").`;
  if (formato === "mc")
    return `Todas as ${nQuestoes} questões em múltipla escolha com 5 alternativas A–E ("formato":"mc").`;
  return `Alternar entre os dois formatos: questões de ordem ímpar em Certo/Errado ("ce"); as de ordem par em múltipla escolha A–E ("mc").`;
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
function instrucaoEquilibrioGabarito(gabaritosCEAnteriores: string[], nQuestoes: number): string {
  const totalC = gabaritosCEAnteriores.filter((g) => g === "C").length;
  const totalE = gabaritosCEAnteriores.filter((g) => g === "E").length;
  const historico = gabaritosCEAnteriores.length
    ? `Nos sub-blocos já gerados neste bloco: ${totalC} gabarito "Certo" e ${totalE} "Errado". `
    : "";

  return `EQUILÍBRIO DO GABARITO EM CERTO/ERRADO (obrigatório)
- Decida o valor-verdade de cada assertiva (Certo ou Errado) pelo conteúdo jurídico, nunca por hábito de gerar mais afirmações verdadeiras do que falsas — esse viés é o erro mais comum ao elaborar questões CE.
- ${historico}Se houver desequilíbrio acumulado, CORRIJA agora: prefira o gabarito menos usado até aqui neste sub-bloco.
- Nas questões CE deste sub-bloco (são ${nQuestoes} questões no total), não deixe todas com o mesmo gabarito — varie genuinamente, a menos que o conteúdo torne isso artificial.`;
}

/** A partir daqui os distratores devem errar só por detalhe factual pontual
 * (prazo, valor, data, nome, sujeito), não por erro de conceito — ver
 * NIVEL_DESCRICOES em constants.ts. */
const NIVEL_MIN_DETALHE_PONTUAL = 4;

/**
 * O prompt de cada sub-bloco é montado em TRÊS partes, do mais estável para o
 * mais volátil, porque o prompt caching é casamento de PREFIXO: qualquer byte
 * que mude invalida tudo que vem depois.
 *
 *   1. `metodo`  — regras do método Kumon, qualidade de distrator, segurança
 *      jurídica, brevidade e schema de resposta. Não depende de matéria,
 *      tópico, nível nem formato: é idêntico entre blocos DIFERENTES e entre
 *      sessões, então o cache continua valendo do bloco de ontem para o de
 *      hoje (dentro da janela do cache), não só entre os 4 sub-blocos de um
 *      mesmo bloco.
 *   2. `config`  — matéria/tópico/tipo/nível/formato: muda a cada bloco, mas
 *      é igual nos 4 sub-blocos dele.
 *   3. `dinamico` — o que muda a cada sub-bloco (padrões já usados,
 *      equilíbrio do gabarito C/E). Nunca cacheado.
 *
 * `chamar` marca 1 e 2 com `cache_control`. Se `metodo` sozinho não atingir o
 * mínimo cacheável do modelo (~1024 tokens), aquele primeiro ponto de corte
 * simplesmente não gera entrada de cache — o segundo (metodo+config)
 * continua valendo, que é exatamente o comportamento anterior a esta divisão.
 */
export interface PromptPartes {
  metodo: string;
  config: string;
  dinamico: string;
}

export function montarPrompt(
  cfg: Config & { materia: string },
  _loteIdx: number,
  padroesAnteriores: string[],
  gabaritosCEAnteriores: string[] = [],
  comExplicacoes = true,
  nQuestoes: number = Q_POR_SUB,
): PromptPartes {
  const temCE = cfg.formato !== "mc";
  const descNivel = NIVEL_DESCRICOES[cfg.nivel - 1];

  // 1) Método: idêntico para qualquer matéria/nível/formato — só varia com
  // `comExplicacoes` (uma preferência que muda raramente). É o prefixo longo
  // que se quer manter em cache entre blocos e sessões.
  const metodo = `Você é elaborador de questões de concurso da área fiscal (padrão SEFAZ / bancas FCC, FGV, Cebraspe). Gere questões inéditas na quantidade EXATA indicada na CONFIGURAÇÃO mais adiante, seguindo as regras abaixo.

LÓGICA KUMON
- As questões de um mesmo sub-bloco devem ser quase-repetitivas entre si: mesma estrutura e mesmo padrão conceitual, variando apenas casos, sujeitos, entes e valores (automatização por repetição).

QUALIDADE DOS DISTRATORES
- Toda alternativa errada deve ser PLAUSÍVEL: deve corresponder a um erro real de raciocínio, a uma confusão frequente entre institutos próximos, ou a uma troca de requisito/prazo/sujeito verossímil.
- Nunca produza alternativa manifestamente absurda, nem descartável apenas pela forma (tamanho, tom, "todas as anteriores", exageros como "sempre"/"nunca" quando gratuitos).
${
  comExplicacoes
    ? `
EXPLICAÇÃO (obrigatório)
- "comentario": por que o gabarito está correto. Em Certo/Errado é a ÚNICA explicação: um item de CE afirma uma coisa só, então explicar "por que Certo" e "por que não Errado" seria a mesma frase escrita duas vezes — diga o que torna a afirmação verdadeira ou falsa, nomeando o conceito, o requisito ou o detalhe (prazo, valor, sujeito) que decide.
- "explicacoes_erradas": objeto letra → explicação, APENAS em múltipla escolha — uma entrada para cada uma das 4 letras erradas. Em Certo/Errado, devolva um objeto vazio {}.
- Cada explicação de alternativa errada deve nomear o ERRO ESPECÍFICO de raciocínio ou de memória que leva a marcar aquela alternativa (qual conceito foi trocado por qual, qual requisito foi ignorado, qual prazo/sujeito foi confundido). Não escreva "está incorreta" nem repita o gabarito.
`
    : ""
}
SEGURANÇA JURÍDICA E AUTOVERIFICAÇÃO
- Cite dispositivo legal (ex.: "art. 150, III, b, CF/88") SOMENTE se tiver plena certeza; na dúvida, indique apenas o nome do instituto e deixe "dispositivo" como null.
- Nunca invente números de artigos, súmulas, alíquotas, prazos ou percentuais.
- Antes de fechar o JSON, revise cada questão e confirme: (a) o gabarito está factualmente correto; (b) nenhuma outra alternativa também está correta; (c) todo dispositivo citado existe e diz o que você afirmou; (d) todo número usado em cálculo fecha na conta. Se algum item não passar, corrija a questão antes de responder.

BREVIDADE (obrigatório): enunciado ≤ 45 palavras; cada alternativa ≤ 12 palavras${comExplicacoes ? "; comentario ≤ 22 palavras; cada explicação de alternativa errada ≤ 25 palavras" : ""}.`;

  // 2) Configuração do bloco: igual nos sub-blocos dele, diferente do bloco
  // seguinte. Fecha com o formato de resposta, que precisa vir depois das
  // regras e o mais perto possível do fim do prompt.
  const config = `
CONFIGURAÇÃO
- Quantidade: EXATAMENTE ${nQuestoes} questão${nQuestoes === 1 ? "" : "ões"}
- Matéria: ${cfg.materia}
- Tópico: ${cfg.topico ? cfg.topico : "núcleo central da matéria"}
- Tipo de cobrança: ${descricaoTipo(cfg.tipos, nQuestoes)}
- Dificuldade (1 a 5): ${cfg.nivel} (${NIVEIS[cfg.nivel - 1]}) — ${descNivel}
- Formato: ${descricaoFormato(cfg.formato, nQuestoes)}
${
  cfg.nivel >= NIVEL_MIN_DETALHE_PONTUAL
    ? `- Neste nível, cada alternativa errada deve repetir quase todo o texto do gabarito e divergir por UM ÚNICO detalhe factual (um prazo, um valor, uma data, um nome, uma competência) — não por erro de conceito. O restante da frase deve ser idêntico ou equivalente ao correto.`
    : ""
}
Responda APENAS com JSON válido, sem markdown, sem texto fora do JSON:
{"questoes":[{"enunciado":"...","formato":"ce" ou "mc","alternativas":["A) ...","B) ...","C) ...","D) ...","E) ..."] ou null,"gabarito":"C"/"E" ou "A"–"E","conceitos":["conceito 1","..."]${comExplicacoes ? ',"comentario":"...","explicacoes_erradas":{"A":"...","B":"..."}' : ""},"dispositivo":"art. X ..." ou null,"tipo_cobranca":"abstrato"|"caso"|"calculo"|"conceito"}]}`;

  const dinamico = [
    padroesAnteriores.length
      ? `NÃO reutilize literalmente os padrões já usados neste bloco: ${padroesAnteriores.join("; ")}.`
      : "",
    temCE ? instrucaoEquilibrioGabarito(gabaritosCEAnteriores, nQuestoes) : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { metodo, config, dinamico };
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
  comExplicacoes = true,
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
  // Quando o toggle "explicações de IA" está desligado (ver GerarView/
  // GerarBancoView), o prompt nem pede comentario/explicacoes_erradas — a
  // questão fica sem explicação até o usuário pedir sob demanda (ver
  // gerarExplicacaoParcial), então aqui não preenchemos placeholder nenhum.
  // Em Certo/Errado não há explicação por alternativa: o comentário do
  // gabarito já é a explicação do item inteiro (ver EXPLICAÇÃO em
  // montarPrompt e letrasExplicaveis abaixo).
  const explicacoes: Record<string, string> = {};
  if (comExplicacoes && formato === "mc") {
    for (const l of erradas) {
      const v = brutas[l];
      explicacoes[l] =
        typeof v === "string" && v.trim()
          ? v.trim()
          : "O modelo não detalhou o erro desta alternativa.";
    }
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
    comentario: comExplicacoes && typeof q.comentario === "string" ? q.comentario.trim() : "",
    explicacoes_erradas: explicacoes,
    dispositivo: typeof q.dispositivo === "string" && q.dispositivo.trim() ? q.dispositivo.trim() : null,
    tipo_cobranca: TIPO_IDS.includes(tipo as TipoId) ? (tipo as TipoId) : undefined,
  });
}

/* ---------- Chamada ---------- */

/**
 * Aceita tanto um prompt simples (`gerarExplicacoes`, chamada avulsa sem
 * repetição) quanto as três partes de `montarPrompt` (`gerarSubBloco`, uma
 * chamada por sub-bloco). Nesse caso há DOIS pontos de corte de cache: um
 * depois do método (prefixo que sobrevive à troca de matéria e de bloco) e
 * outro depois da configuração (idêntico entre os sub-blocos de um bloco).
 * Da 2ª chamada em diante a API cobra esses prefixos como leitura de cache
 * (0,1× o preço de entrada) em vez de reprocessá-los.
 *
 * Toda chamada concluída registra tokens e custo em `uso_api` (ver
 * registrarUsoApi em repo.ts) — falha de gravação nunca derruba a geração:
 * perder o registro de custo é menos grave que perder o bloco pago.
 */
async function chamar(
  prompt: string | PromptPartes,
  effort: "low" | "medium" = "medium",
  origem = "outra",
): Promise<string> {
  const client = await criarCliente();

  const content: Anthropic.TextBlockParam[] =
    typeof prompt === "string"
      ? [{ type: "text", text: prompt }]
      : [
          { type: "text", text: prompt.metodo, cache_control: { type: "ephemeral" } },
          { type: "text", text: prompt.config, cache_control: { type: "ephemeral" } },
          ...(prompt.dinamico ? [{ type: "text" as const, text: prompt.dinamico }] : []),
        ];

  // Streaming: com adaptive thinking ligado, o raciocínio consome parte do
  // max_tokens, e um max_tokens alto sem streaming arrisca timeout de HTTP.
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 24000,
    // effort médio: equilíbrio entre a autoverificação factual pedida no
    // prompt e custo/latência por chamada — cada bloco já são 4 chamadas.
    // effort baixo é usado só na explicação avulsa sob demanda (ver
    // gerarExplicacaoParcial): uma tarefa pequena e bem definida, sem a
    // autoverificação de uma questão inteira.
    output_config: { effort },
    messages: [{ role: "user", content }],
  });

  const msg = await stream.finalMessage();

  try {
    const { registrarUsoApi } = await import("./repo");
    await registrarUsoApi({
      modelo: MODEL,
      origem,
      uso: {
        entrada: msg.usage.input_tokens ?? 0,
        saida: msg.usage.output_tokens ?? 0,
        cacheEscrita: msg.usage.cache_creation_input_tokens ?? 0,
        cacheLeitura: msg.usage.cache_read_input_tokens ?? 0,
      },
    });
  } catch (e) {
    console.error("registrar uso da API", e);
  }

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

export function mensagemDeErro(e: unknown): string {
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
  comExplicacoes = true,
  /** Quantas questões este sub-bloco deve ter — os sub-blocos deixaram de
   * ter tamanho fixo quando a quantidade do bloco passou a variar de 1 em 1
   * (ver tamanhosSubs em lib/blocoUtils.ts). */
  nQuestoes: number = Q_POR_SUB,
  tentativa = 0,
): Promise<Questao[]> {
  try {
    const texto = await chamar(
      montarPrompt(cfg, subIdx, padroesAnteriores, gabaritosCEAnteriores, comExplicacoes, nQuestoes),
      "medium",
      "sub-bloco",
    );
    const obj = tentarParse(texto);
    const qs = (obj.questoes ?? [])
      .map((r) => normalizarQuestao(r, cfg.formato, comExplicacoes))
      .filter((q): q is Questao => q !== null);

    if (qs.length < nQuestoes) throw new Error("questões insuficientes");
    return qs.slice(0, nQuestoes);
  } catch (e) {
    if (e instanceof SemCredencialError) throw e;
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      throw new Error(mensagemDeErro(e));
    }
    if (tentativa < 1) {
      return gerarSubBloco(
        cfg,
        subIdx,
        padroesAnteriores,
        gabaritosCEAnteriores,
        comExplicacoes,
        nQuestoes,
        tentativa + 1,
      );
    }
    throw new Error(mensagemDeErro(e));
  }
}

/* ---------- Explicações para questões reais (banco de questões) ---------- */

/** Quantas explicações já geradas do mesmo assunto entram como contexto
 * cacheado. Alto o bastante para o prefixo passar do mínimo cacheável do
 * modelo (~1024 tokens) e baixo o bastante para não dominar o prompt. */
const MAX_EXPLICACOES_CONTEXTO = 8;

/**
 * Contexto reaproveitável do assunto: as explicações que este app já gerou
 * para OUTRAS questões do MESMO assunto do banco fixo (ver `explicacoes_banco`
 * em lib/repo.ts). Vai como bloco cacheado do prompt, e é a razão de existir:
 * as ~1.350 questões do banco se repetem por assunto, então da segunda vez que
 * um assunto é praticado esse prefixo é cobrado como leitura de cache (0,1× o
 * token de entrada) em vez de reprocessado — além de dar ao modelo o padrão de
 * explicação já usado naquele assunto.
 *
 * A ordem é estável (ids ordenados, ver `idsDoAssunto`) porque o cache é
 * casamento de prefixo byte a byte: embaralhar aqui zeraria o ganho.
 */
async function contextoDoAssunto(questoes: Questao[]): Promise<string> {
  const doBanco = questoes.filter((q) => q.bancoId);
  if (!doBanco.length) return "";
  try {
    const { idsDoAssunto, buscarQuestaoBanco } = await import("./banco");
    const { buscarExplicacoesBanco } = await import("./repo");

    const assuntos = [...new Set(doBanco.flatMap((q) => q.conceitos))].sort();
    const noBloco = new Set(doBanco.map((q) => q.bancoId));
    const candidatos = assuntos.flatMap(idsDoAssunto).filter((id) => !noBloco.has(id));
    if (!candidatos.length) return "";

    const cache = await buscarExplicacoesBanco(candidatos);
    const linhas: string[] = [];
    for (const id of candidatos) {
      const exp = cache.get(id);
      const q = buscarQuestaoBanco(id);
      if (!exp?.comentario || !q) continue;
      const erradas = Object.entries(exp.explicacoes_erradas)
        .map(([l, t]) => `  ${l}: ${t}`)
        .join("\n");
      linhas.push(
        `[${q.assunto}] ${q.enunciado}\nGabarito ${q.gabarito} — ${exp.comentario}${erradas ? `\n${erradas}` : ""}`,
      );
      if (linhas.length >= MAX_EXPLICACOES_CONTEXTO) break;
    }
    if (!linhas.length) return "";
    return `EXPLICAÇÕES JÁ ESCRITAS PARA ESTE MESMO ASSUNTO (referência de conteúdo e de estilo — não as repita literalmente, não as reescreva, não as mencione na resposta):\n\n${linhas.join("\n\n")}`;
  } catch (e) {
    console.error("montar contexto de assunto", e);
    return "";
  }
}

function listaDeQuestoes(questoes: Questao[]): string {
  return questoes
    .map((q, i) => {
      const alts = q.alternativas ? q.alternativas.join(" | ") : "C) Certo | E) Errado";
      return `${i + 1}. Enunciado: ${q.enunciado}\nAlternativas: ${alts}\nGabarito: ${q.gabarito}`;
    })
    .join("\n\n");
}

/**
 * Regras da geração de explicações — sem a lista de questões e sem a
 * contagem delas, para que o texto seja IDÊNTICO em toda chamada e possa ser
 * o primeiro bloco cacheado do prompt (ver `chamar`). O que muda de um bloco
 * para outro (as questões) vai na parte dinâmica.
 */
const REGRAS_EXPLICACOES = `Você é revisor de questões de concurso da área fiscal já prontas — NÃO altere enunciado, alternativas nem gabarito, eles já vêm corretos de uma prova real. Para CADA questão listada mais adiante, na ordem em que aparece, escreva:
- "comentario": por que o gabarito está correto. Em Certo/Errado (alternativas "C) Certo | E) Errado") é a ÚNICA explicação pedida: diga o que torna a afirmação do enunciado verdadeira ou falsa, nomeando o conceito, o requisito ou o detalhe que decide.
- "explicacoes_erradas": objeto letra → explicação, APENAS em múltipla escolha — uma entrada para cada alternativa que não é o gabarito, nomeando o erro específico de raciocínio, de conceito ou de detalhe (data, prazo, valor, sujeito) que leva a marcar aquela alternativa. Não escreva "está incorreta" nem repita o gabarito. Em Certo/Errado, devolva {}.

BREVIDADE (obrigatório): comentario ≤ 22 palavras; cada explicação de alternativa errada ≤ 25 palavras.

Responda APENAS com JSON válido, sem markdown, sem texto fora do JSON, com EXATAMENTE UM item por questão listada, na MESMA ORDEM em que elas aparecem:
{"explicacoes":[{"comentario":"...","explicacoes_erradas":{"A":"...","B":"..."}}]}`;

/** Bloco dinâmico: as questões deste bloco, que nunca se repetem entre
 * chamadas e por isso ficam fora de qualquer corte de cache. */
function blocoQuestoesExplicar(questoes: Questao[]): string {
  return `QUESTÕES A EXPLICAR (${questoes.length}, nesta ordem):\n\n${listaDeQuestoes(questoes)}`;
}

/**
 * Preenche `comentario`/`explicacoes_erradas` de questões reais do banco
 * (enunciado/alternativas/gabarito ficam intocados — só a explicação é
 * gerada). Em caso de falha, devolve as questões como vieram (comentário
 * vazio, explicações com "—") em vez de travar a montagem do bloco.
 */
export async function gerarExplicacoes(questoes: Questao[]): Promise<Questao[]> {
  try {
    // Com contexto de assunto disponível, o prompt vai em três partes para
    // que as duas primeiras sejam cacheadas (ver `chamar` e
    // `contextoDoAssunto`): regras fixas → contexto do assunto → as questões
    // deste bloco. Sem contexto, mantém-se o prompt único de antes.
    const contexto = await contextoDoAssunto(questoes);
    const prompt = contexto
      ? { metodo: REGRAS_EXPLICACOES, config: contexto, dinamico: blocoQuestoesExplicar(questoes) }
      : `${REGRAS_EXPLICACOES}\n\n${blocoQuestoesExplicar(questoes)}`;
    const texto = await chamar(prompt, "medium", "explicações do bloco");
    const obj = extrairJSON(texto) as { explicacoes?: unknown[] };
    const itens = obj.explicacoes ?? [];

    return questoes.map((q, i) => {
      const item = itens[i] as Record<string, unknown> | undefined;
      // CE não tem explicação por alternativa (ver REGRAS_EXPLICACOES);
      // e o corte por `alternativas.length` evita pedir letra D/E numa MC de
      // 4 alternativas.
      const letrasErradas =
        q.formato === "ce"
          ? []
          : LETRAS_MC.slice(0, q.alternativas?.length ?? 5).filter((l) => l !== q.gabarito);
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

/* ---------- Explicação avulsa, sob demanda ---------- */

/** Letras que o usuário já pode escolher para explicar (gabarito incluso —
 * ele pode querer saber por que a certa está certa, não só por que as
 * outras estão erradas). */
export function letrasExplicaveis(questao: Questao): string[] {
  // Em CE, a única explicação é a do gabarito (ver EXPLICAÇÃO em
  // montarPrompt): pedir "por que C está errada" quando o gabarito é E é
  // pedir a mesma frase invertida, e custa outra chamada à API.
  return questao.formato === "ce"
    ? [questao.gabarito]
    : LETRAS_MC.slice(0, questao.alternativas?.length ?? 5);
}

function montarPromptExplicacaoParcial(questao: Questao, letras: string[]): string {
  const alts = questao.alternativas ? questao.alternativas.join(" | ") : "C) Certo | E) Errado";
  const pedidos = letras
    .map((l) =>
      l === questao.gabarito
        ? `${l} — é o GABARITO: explique por que está CERTA`
        : `${l} — explique por que está ERRADA`,
    )
    .join("\n- ");

  return `Você é revisor de uma questão de concurso da área fiscal já pronta — NÃO altere enunciado, alternativas nem gabarito. O usuário respondeu a questão e pediu explicação só das alternativas abaixo, porque ficou com dúvida especificamente nelas — pode ir um pouco mais fundo que numa explicação padrão de bloco inteiro, mas continua sendo texto para tela de celular, não um parágrafo de livro.

ENUNCIADO: ${questao.enunciado}
ALTERNATIVAS: ${alts}
GABARITO: ${questao.gabarito}

EXPLICAR SOMENTE:
- ${pedidos}

Para a alternativa-gabarito, explique por que ela está correta. Para as demais, nomeie o erro específico de raciocínio, conceito ou detalhe (data, prazo, valor, sujeito) que leva a marcá-la — não escreva "está incorreta" nem repita o gabarito.

BREVIDADE (obrigatório): cada explicação ≤ 35 palavras — um pouco mais detalhada que a de um bloco inteiro (que é ≤ 25), mas sem passar de ~4 linhas na tela de um app mobile.

Responda APENAS com JSON válido, sem markdown, com uma entrada para CADA letra pedida acima e nenhuma outra:
{"explicacoes":{"<LETRA>":"..."}}`;
}

/**
 * Explicação sob demanda de uma ou mais alternativas de UMA questão já
 * respondida — usada quando o bloco/simulado foi montado sem explicações de
 * IA (ver toggle em GerarView/GerarBancoView) ou quando faltou explicar
 * alguma alternativa específica. Chamada minúscula e barata (`effort: low`,
 * uma questão só) comparada a gerar explicação do bloco inteiro — é
 * literalmente o ponto do recurso: gastar tokens só no que o usuário de
 * fato quer entender.
 */
export async function gerarExplicacaoParcial(
  questao: Questao,
  letras: string[],
): Promise<{ comentario?: string; explicacoes_erradas: Record<string, string> }> {
  const texto = await chamar(montarPromptExplicacaoParcial(questao, letras), "low", "explicação sob demanda");
  const obj = extrairJSON(texto) as { explicacoes?: Record<string, unknown> };
  const brutas = obj.explicacoes && typeof obj.explicacoes === "object" ? obj.explicacoes : {};

  let comentario: string | undefined;
  const explicacoes_erradas: Record<string, string> = {};
  for (const l of letras) {
    const v = brutas[l];
    const texto2 = typeof v === "string" && v.trim() ? v.trim() : "O modelo não detalhou esta alternativa.";
    if (l === questao.gabarito) comentario = texto2;
    else explicacoes_erradas[l] = texto2;
  }
  return { comentario, explicacoes_erradas };
}
