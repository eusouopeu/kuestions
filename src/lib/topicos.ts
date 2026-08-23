/**
 * Tópicos específicos por matéria, extraídos dos planos de estudo (coluna "#"
 * + "Tarefas" das linhas do tipo Aula — Questões e simulados ficam de fora).
 * Alimenta o dropdown de "Tópico específico" em GerarView no lugar do texto
 * livre, só para as matérias abaixo; as demais continuam com o campo aberto.
 */

export interface TopicoEspecifico {
  /** "<bloco>.<aula>", ex.: "1.1". */
  codigo: string;
  nome: string;
}

/** Ordena por bloco e depois por aula, numericamente (não lexicograficamente). */
function ordenarPorCodigo(a: TopicoEspecifico, b: TopicoEspecifico): number {
  const [blocoA, aulaA] = a.codigo.split(".").map(Number);
  const [blocoB, aulaB] = b.codigo.split(".").map(Number);
  return blocoA - blocoB || aulaA - aulaB;
}

function topicos(lista: [string, string][]): TopicoEspecifico[] {
  return lista.map(([codigo, nome]) => ({ codigo, nome })).sort(ordenarPorCodigo);
}

export const TOPICOS_POR_MATERIA: Record<string, TopicoEspecifico[]> = {
  "Direito Administrativo": topicos([
    ["1.1", "Princípios do Direito Administrativo"],
    ["1.2", "Estado, Governo e Direito Administrativo"],
    ["1.3", "Poderes Administrativos"],
    ["2.1", "Ato Administrativo: Conceito e Atributos"],
    ["2.2", "Ato Administrativo: Espécies e Invalidação"],
    ["3.1", "Organização Administrativa"],
    ["3.2", "Lei das Estatais (Lei 13.303/2016)"],
    ["3.3", "Entidades Paraestatais e Parcerias (Lei 13.019/2014)"],
    ["4.1", "Agentes Públicos"],
    ["4.2", "Licitações — Lei 14.133/2021 (Parte I)"],
    ["4.3", "Licitações — Lei 14.133/2021 (Parte II)"],
    ["4.4", "Contrato Administrativo e Convênios"],
    ["5.1", "Serviços Públicos (Lei 8.987/1995)"],
    ["5.2", "Parceria Público-Privada (Lei 11.079/2004)"],
    ["6.1", "Responsabilidade Civil do Estado"],
    ["6.2", "Controle da Administração Pública"],
    ["6.3", "Improbidade Administrativa (Lei 8.429/1992)"],
    ["7.1", "Bens Públicos"],
    ["7.2", "Intervenção do Estado na Propriedade Privada"],
    ["8.1", "Convênios e Contratos de Repasse"],
    ["8.2", "Revisão Acelerada e Resumo"],
    ["8.3", "Processo Administrativo (Lei Estadual)"],
    ["8.4", "CE-BA: Arts. 89 e 90 (Direito Constitucional)"],
    ["8.5", "Lei Estadual 14.63/2023 — Licitações e Contratos"],
    ["8.6", "Legislação Estadual — Leis 12.949/2014 e 9.290/2004"],
  ]),

  "Direito Constitucional": topicos([
    ["1.1", "Teoria da Constituição e Poder Constituinte"],
    ["1.2", "Princípios Fundamentais e Teoria Geral dos DF"],
    ["1.3", "Direitos e Deveres Individuais e Coletivos I"],
    ["1.4", "Direitos e Deveres Individuais e Coletivos II"],
    ["1.5", "Direitos Sociais"],
    ["2.1", "Nacionalidade"],
    ["2.2", "Direitos Políticos"],
    ["2.3", "Partidos Políticos"],
    ["3.1", "Organização do Estado (Art. 18 a 36)"],
    ["3.2", "Administração Pública"],
    ["4.1", "Poder Legislativo"],
    ["4.2", "Processo Legislativo"],
    ["4.3", "Poder Executivo"],
    ["4.4", "Poder Judiciário"],
    ["4.5", "Funções Essenciais à Justiça"],
    ["5.1", "Defesa do Estado e das Instituições Democráticas"],
    ["5.2", "Sistema Tributário Nacional"],
    ["5.3", "Orçamento e Finanças"],
    ["5.4", "Ordem Econômica e Financeira"],
    ["5.5", "Ordem Social"],
    ["6.1", "Controle de Constitucionalidade"],
  ]),

  "Estatística": topicos([
    ["1.1", "Apresentação de Dados"],
    ["1.2", "Medidas de Posição: Médias"],
    ["1.3", "Medidas Separatrizes ou Quantis"],
    ["1.4", "Medidas de Posição: Moda"],
    ["1.5", "Medidas de Variabilidade ou Dispersão"],
    ["2.1", "Análise Combinatória"],
    ["2.2", "Probabilidade"],
    ["3.1", "Variáveis Aleatórias Discretas"],
    ["3.2", "Distribuições Discretas de Probabilidade"],
    ["3.3", "Variáveis Aleatórias e Distribuições Contínuas"],
    ["3.4", "Distribuições Conjuntas e Momentos de Variáveis Aleatórias"],
    ["4.1", "Teoria da Amostragem"],
    ["4.2", "Estimação Pontual e Intervalar"],
    ["4.3", "Testes de Hipóteses"],
    ["4.4", "Análise de Variância"],
    ["5.1", "Regressão Linear Simples"],
    ["5.2", "Regressão Linear Múltipla"],
    ["5.3", "Séries Temporais"],
    ["5.4", "Análise Multivariada"],
    ["5.5", "Análise Bidimensional"],
  ]),

  "Direito Tributário": topicos([
    ["1.1", "Conceito, Espécies e Classificação dos Tributos"],
    ["1.2", "Princípios Tributários"],
    ["1.3", "Imunidades Tributárias"],
    ["1.4", "Competência Tributária"],
    ["1.5", "Legislação Tributária"],
    ["2.1", "Obrigação Tributária"],
    ["2.2", "Responsabilidade Tributária"],
    ["2.3", "Crédito Tributário: Constituição e Lançamento"],
    ["2.4", "Suspensão da Exigibilidade do Crédito Tributário"],
    ["2.5", "Extinção do Crédito Tributário"],
    ["2.6", "Exclusão do Crédito Tributário"],
    ["2.7", "Garantias e Privilégios do Crédito Tributário"],
    ["3.1", "Administração Tributária e Fiscalização"],
    ["3.2", "Tributos de Competência da União"],
    ["3.3", "Tributos de Competência dos Estados"],
    ["3.4", "Tributos de Competência dos Municípios"],
    ["4.1", "IBS — Imposto sobre Bens e Serviços"],
    ["4.2", "CBS — Contribuição sobre Bens e Serviços"],
    ["4.3", "Repartição de Receitas Tributárias"],
    ["4.4", "Simples Nacional"],
  ]),

  Economia: topicos([
    ["1.1", "Fundamentos de Economia"],
    ["1.2", "Elasticidades"],
    ["1.3", "Microeconomia: Teoria do Consumidor"],
    ["2.1", "Teoria da Produção"],
    ["2.2", "Teoria dos Custos"],
    ["2.3", "Teoria dos Mercados: Concorrência Perfeita"],
    ["2.4", "Teoria dos Mercados: Monopólio"],
    ["2.5", "Teoria dos Mercados: Oligopólio e Concorrência Monopolística"],
    ["3.1", "Bens Públicos, Bem-Estar Social e Meio Ambiente"],
    ["3.2", "Macroeconomia: Contabilidade Nacional"],
    ["4.1", "O Modelo Keynesiano Simples"],
    ["4.2", "Sistema Monetário e Mercado Financeiro"],
    ["4.3", "Modelo IS-LM e Políticas Fiscal e Monetária"],
    ["4.4", "Modelo AO-DA e Inflação"],
    ["5.1", "Balanço de Pagamentos"],
    ["5.2", "Política Cambial: Câmbio Fixo e Câmbio Flutuante"],
  ]),
};

export function rotuloTopico(t: TopicoEspecifico): string {
  return `${t.codigo} ${t.nome}`;
}

export interface BlocoDeAulas<T extends TopicoEspecifico = TopicoEspecifico> {
  /** Primeiro segmento do código, ex. "1" em "1.3". */
  bloco: string;
  aulas: T[];
}

/** Agrupa uma lista já ordenada de tópicos pelo prefixo antes do primeiro
 * ".", preservando a ordem (a fonte já vem ordenada por bloco/aula). Genérico
 * em T (⊇ TopicoEspecifico) para preservar campos extras do chamador — ex.
 * DesempenhoTopico no heatmap de Dados. */
export function agruparPorPrefixo<T extends TopicoEspecifico>(
  itens: T[],
  prefixoDe: (t: T) => string,
): BlocoDeAulas<T>[] {
  const grupos = new Map<string, T[]>();
  for (const item of itens) {
    const chave = prefixoDe(item);
    const atual = grupos.get(chave);
    if (atual) atual.push(item);
    else grupos.set(chave, [item]);
  }
  return [...grupos.entries()].map(([bloco, aulas]) => ({ bloco, aulas }));
}

/** Blocos de aulas de uma matéria (agrupa TOPICOS_POR_MATERIA pelo número
 * antes do "."), para a seleção "bloco de aulas" em vez de aula única. */
export function blocosDeMateria(materia: string): BlocoDeAulas[] {
  const topicos = TOPICOS_POR_MATERIA[materia];
  if (!topicos) return [];
  return agruparPorPrefixo(topicos, (t) => t.codigo.split(".")[0]);
}

/** Rótulo de um bloco para o dropdown, ex. "Bloco 2 (4 aulas)". */
export function rotuloBloco(b: BlocoDeAulas): string {
  return `Bloco ${b.bloco} (${b.aulas.length} aula${b.aulas.length > 1 ? "s" : ""})`;
}

/**
 * Cruza a lista fixa de tópicos de uma matéria com o que já foi praticado
 * (strings livres de `blocos.topico`, ver repo.ts `topicosPraticados`) — por
 * substring, porque tanto `rotuloTopico` (aula específica) quanto
 * `descricaoBloco` (bloco de aulas) embutem `t.nome` por extenso na string
 * gravada. Só faz sentido para matérias com TOPICOS_POR_MATERIA definido; as
 * demais usam tópico livre, sem uma lista fixa para comparar.
 */
export function coberturaTopicos(
  materia: string,
  topicosPraticados: string[],
): { praticados: TopicoEspecifico[]; pendentes: TopicoEspecifico[] } | null {
  const lista = TOPICOS_POR_MATERIA[materia];
  if (!lista) return null;
  const praticados: TopicoEspecifico[] = [];
  const pendentes: TopicoEspecifico[] = [];
  for (const t of lista) {
    const visto = topicosPraticados.some((s) => s.includes(t.nome));
    (visto ? praticados : pendentes).push(t);
  }
  return { praticados, pendentes };
}

/** Matérias com lista fixa de tópicos — alimenta o seletor do card de
 * cobertura em Dados (só faz sentido oferecer o filtro para estas). */
export const MATERIAS_COM_TOPICOS: string[] = Object.keys(TOPICOS_POR_MATERIA);

export interface DesempenhoTopico extends TopicoEspecifico {
  total: number;
  acertos: number;
  pct: number;
}

/**
 * Cruza a lista fixa de tópicos com o desempenho POR QUESTÃO (não por bloco,
 * como coberturaTopicos acima) — alimenta o heatmap de Dados. Mesmo
 * casamento por substring: os textos gravados em `questoes_respondidas.topico`
 * (rotuloTopico / descricaoBloco) embutem `t.nome` por extenso.
 */
export function desempenhoPorTopico(
  materia: string,
  linhas: { topico: string; acertou: boolean }[],
): DesempenhoTopico[] | null {
  const lista = TOPICOS_POR_MATERIA[materia];
  if (!lista) return null;
  return lista.map((t) => {
    const doTopico = linhas.filter((l) => l.topico.includes(t.nome));
    const total = doTopico.length;
    const acertos = doTopico.filter((l) => l.acertou).length;
    return { ...t, total, acertos, pct: total ? Math.round((acertos / total) * 100) : 0 };
  });
}

export interface TopicoPontuado extends TopicoEspecifico {
  pontos: number;
  total: number;
}

/**
 * Cruza a lista fixa de tópicos de uma matéria com a pontuação por resposta
 * (ver pontosResposta em lib/pontuacaoTopicos.ts e pontosPorTopico em
 * lib/repo.ts) — mesmo casamento por substring de desempenhoPorTopico, usado
 * para escolher (por sorteio ponderado) qual tópico direcionar quando o
 * usuário deixa "Todos os tópicos" marcado em GerarView.
 */
export function pontuarTopicos(
  materia: string,
  linhas: { topico: string; pontos: number }[],
): TopicoPontuado[] | null {
  const lista = TOPICOS_POR_MATERIA[materia];
  if (!lista) return null;
  return lista.map((t) => {
    const doTopico = linhas.filter((l) => l.topico.includes(t.nome));
    return {
      ...t,
      total: doTopico.length,
      pontos: doTopico.reduce((a, l) => a + l.pontos, 0),
    };
  });
}

/** String descritiva do bloco inteiro, usada como `Config.topico` ao
 * escolher "Bloco de aulas" — vai direto para o prompt como texto livre. */
export function descricaoBloco(b: BlocoDeAulas): string {
  return `Bloco ${b.bloco} (aulas ${b.aulas[0].codigo}–${b.aulas[b.aulas.length - 1].codigo}): ${b.aulas
    .map((a) => a.nome)
    .join("; ")}`;
}

/** Um tópico do edital que nunca recebeu uma questão. */
export interface LacunaEdital extends TopicoEspecifico {
  materia: string;
  /** Peso da matéria no edital (ver lib/edital.ts) — é o que ordena a lista. */
  peso: number;
}

/** Abaixo disto a matéria ainda não está "estudada o bastante" para caber
 * nesta lista — ver `lacunasDoEdital`. */
const PCT_MINIMO_MATERIA_DOMINADA = 50;

/**
 * Tópicos do edital com ZERO prática, mas SÓ dentro de matérias em que a
 * fraqueza já foi trabalhada: pelo menos uma questão respondida e acerto
 * geral acima de `PCT_MINIMO_MATERIA_DOMINADA`.
 *
 * Sem esse filtro, a lista inteira de uma matéria nunca sequer aberta virava
 * "lacuna" — tecnicamente verdade (zero prática em cada tópico dela), mas
 * inútil como sugestão: se você não estudou a matéria, faltam TODOS os
 * tópicos, não um em especial, e a sugestão certa ali é "estude a matéria",
 * não "responda estas questões". Esta lista serve para o caso mais
 * cirúrgico: matéria que você já domina no geral, mas com um ponto cego
 * específico dentro dela.
 *
 * Função pura: recebe o que já foi praticado por matéria (ver
 * topicosPraticadosPorMateria em lib/repo.ts), o acerto geral por matéria
 * (ver resumoPorMateria em lib/repo.ts) e os pesos (getPesosEdital). Matéria
 * com peso 0 ("não cai no meu edital") também fica de fora.
 */
export function lacunasDoEdital(
  praticadosPorMateria: Record<string, string[]>,
  acertoPorMateria: Record<string, { total: number; pct: number }>,
  pesos: Record<string, number>,
  pesoPadrao: number,
): LacunaEdital[] {
  const lacunas: LacunaEdital[] = [];
  for (const [materia, lista] of Object.entries(TOPICOS_POR_MATERIA)) {
    const peso = pesos[materia] ?? pesoPadrao;
    if (peso <= 0) continue;
    const desempenho = acertoPorMateria[materia];
    if (!desempenho || desempenho.total === 0) continue;
    if (desempenho.pct <= PCT_MINIMO_MATERIA_DOMINADA) continue;
    const praticados = praticadosPorMateria[materia] ?? [];
    for (const t of lista) {
      if (praticados.some((s) => s.includes(t.nome))) continue;
      lacunas.push({ ...t, materia, peso });
    }
  }
  return lacunas.sort(
    (a, b) =>
      b.peso - a.peso ||
      a.materia.localeCompare(b.materia, "pt-BR") ||
      a.codigo.localeCompare(b.codigo, "pt-BR"),
  );
}
