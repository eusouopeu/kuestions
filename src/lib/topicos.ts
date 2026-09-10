/**
 * Tópicos específicos por matéria, extraídos dos planos de estudo (coluna "#"
 * + "Tarefas" das linhas do tipo Aula — Questões e simulados ficam de fora,
 * ver `docs/` / `Bancos de dados/Planos de estudo/*.md`). Alimenta o dropdown
 * de "Tópico específico" em GerarView no lugar do texto livre, só para as
 * matérias abaixo; as demais continuam com o campo aberto.
 *
 * Cada matéria é uma lista de blocos (`DEFINICOES_MATERIA`), cada bloco com
 * um título e as aulas que o compõem, na ordem do plano — o código de cada
 * aula ("<bloco>.<aula>", ex. "2.3") é derivado dessa posição, não copiado
 * do "#" bruto do plano (que numera Aula/Questões juntas e varia de fonte
 * pra fonte). Título e contagem de aulas do bloco (ex. Direito Tributário
 * Bloco 1 — Sistema Tributário Nacional: Conceitos e Princípios, 5 aulas)
 * batem com o campo `bloco`/`assunto` do banco de questões real (ver
 * `src/data/banco_questoes.json` e `lib/banco.ts`) nas matérias em que os
 * dois se sobrepõem — mesma fonte (Estratégia Concursos, curso SEFAZ-BA).
 */

export interface TopicoEspecifico {
  /** "<bloco>.<aula>", ex.: "1.1". */
  codigo: string;
  nome: string;
}

interface DefinicaoBloco {
  titulo: string;
  /** Nomes das aulas do bloco, na ordem do plano — o código de cada uma
   * ("<bloco>.<posição>") é gerado a partir do índice aqui, não digitado. */
  aulas: string[];
}

/** Gera `TopicoEspecifico[]` (com código "<bloco>.<aula>") e o título de
 * cada bloco a partir da lista declarativa de blocos de uma matéria. */
function definirMateria(blocos: DefinicaoBloco[]): {
  topicos: TopicoEspecifico[];
  titulosBloco: Record<string, string>;
} {
  const topicos: TopicoEspecifico[] = [];
  const titulosBloco: Record<string, string> = {};
  blocos.forEach((b, i) => {
    const numeroBloco = String(i + 1);
    titulosBloco[numeroBloco] = b.titulo;
    b.aulas.forEach((nome, j) => {
      topicos.push({ codigo: `${numeroBloco}.${j + 1}`, nome });
    });
  });
  return { topicos, titulosBloco };
}

const DEFINICOES_MATERIA: Record<string, DefinicaoBloco[]> = {
  "Direito Administrativo": [
    {
      titulo: "Fundamentos e Poderes Administrativos",
      aulas: [
        "Princípios do Direito Administrativo",
        "Estado, Governo e Direito Administrativo",
        "Poderes Administrativos",
      ],
    },
    {
      titulo: "Atos Administrativos",
      aulas: ["Ato Administrativo: Conceito e Atributos", "Ato Administrativo: Espécies e Invalidação"],
    },
    {
      titulo: "Organização Administrativa e Entidades",
      aulas: [
        "Organização Administrativa",
        "Lei das Estatais (Lei 13.303/2016)",
        "Entidades Paraestatais e Parcerias (Lei 13.019/2014)",
      ],
    },
    {
      titulo: "Agentes Públicos e Licitações/Contratos",
      aulas: [
        "Agentes Públicos",
        "Licitações — Lei 14.133/2021 (Parte I)",
        "Licitações — Lei 14.133/2021 (Parte II)",
        "Contrato Administrativo e Convênios",
      ],
    },
    {
      titulo: "Serviços Públicos e Parcerias",
      aulas: ["Serviços Públicos (Lei 8.987/1995)", "Parceria Público-Privada (Lei 11.079/2004)"],
    },
    {
      titulo: "Responsabilidade, Controle e Improbidade",
      aulas: [
        "Responsabilidade Civil do Estado",
        "Controle da Administração Pública",
        "Improbidade Administrativa (Lei 8.429/1992)",
      ],
    },
    {
      titulo: "Bens Públicos e Intervenção na Propriedade",
      aulas: ["Bens Públicos", "Intervenção do Estado na Propriedade Privada"],
    },
    // Título não vem do banco de questões (zero questões reais cobrem este
    // bloco — conteúdo específico do edital estadual da Bahia).
    {
      titulo: "Legislação Estadual (BA) e Revisão Final",
      aulas: [
        "Convênios e Contratos de Repasse",
        "Revisão Acelerada e Resumo",
        "Processo Administrativo (Lei Estadual)",
        "CE-BA: Arts. 89 e 90 (Direito Constitucional)",
        "Lei Estadual 14.63/2023 — Licitações e Contratos",
        "Legislação Estadual — Leis 12.949/2014 e 9.290/2004",
      ],
    },
  ],

  "Direito Constitucional": [
    {
      titulo: "Teoria Constitucional e Direitos Fundamentais",
      aulas: [
        "Teoria da Constituição e Poder Constituinte",
        "Princípios Fundamentais e Teoria Geral dos DF",
        "Direitos e Deveres Individuais e Coletivos I",
        "Direitos e Deveres Individuais e Coletivos II",
        "Direitos Sociais",
      ],
    },
    {
      titulo: "Nacionalidade e Direitos Políticos",
      aulas: ["Nacionalidade", "Direitos Políticos", "Partidos Políticos"],
    },
    {
      titulo: "Organização do Estado e Administração Pública",
      aulas: ["Organização do Estado (Art. 18 a 36)", "Administração Pública"],
    },
    {
      titulo: "Organização dos Poderes",
      aulas: [
        "Poder Legislativo",
        "Processo Legislativo",
        "Poder Executivo",
        "Poder Judiciário",
        "Funções Essenciais à Justiça",
      ],
    },
    {
      titulo: "Defesa do Estado, Tributação e Ordem Econômico-Social",
      aulas: [
        "Defesa do Estado e das Instituições Democráticas",
        "Sistema Tributário Nacional",
        "Orçamento e Finanças",
        "Ordem Econômica e Financeira",
        "Ordem Social",
      ],
    },
    {
      titulo: "Controle de Constitucionalidade",
      aulas: ["Controle de Constitucionalidade"],
    },
  ],

  "Estatística": [
    {
      titulo: "Estatística Descritiva Univariada",
      aulas: [
        "Apresentação de Dados",
        "Medidas de Posição: Médias",
        "Medidas Separatrizes ou Quantis",
        "Medidas de Posição: Moda",
        "Medidas de Variabilidade ou Dispersão",
      ],
    },
    {
      titulo: "Combinatória e Probabilidade",
      aulas: ["Análise Combinatória", "Probabilidade"],
    },
    {
      titulo: "Variáveis Aleatórias e Distribuições",
      aulas: [
        "Variáveis Aleatórias Discretas",
        "Distribuições Discretas de Probabilidade",
        "Variáveis Aleatórias e Distribuições Contínuas",
        "Distribuições Conjuntas e Momentos de Variáveis Aleatórias",
      ],
    },
    {
      titulo: "Inferência Estatística",
      aulas: ["Teoria da Amostragem", "Estimação Pontual e Intervalar", "Testes de Hipóteses", "Análise de Variância"],
    },
    {
      titulo: "Regressão, Séries Temporais e Análise Multivariada",
      aulas: [
        "Regressão Linear Simples",
        "Regressão Linear Múltipla",
        "Séries Temporais",
        "Análise Multivariada",
        "Análise Bidimensional",
      ],
    },
  ],

  "Direito Tributário": [
    {
      titulo: "Sistema Tributário Nacional: Conceitos e Princípios",
      aulas: [
        "Conceito, Espécies e Classificação dos Tributos",
        "Princípios Tributários",
        "Imunidades Tributárias",
        "Competência Tributária",
        "Legislação Tributária",
      ],
    },
    {
      titulo: "Obrigação e Crédito Tributário",
      aulas: [
        "Obrigação Tributária",
        "Responsabilidade Tributária",
        "Crédito Tributário: Constituição e Lançamento",
        "Suspensão da Exigibilidade do Crédito Tributário",
        "Extinção do Crédito Tributário",
        "Exclusão do Crédito Tributário",
        "Garantias e Privilégios do Crédito Tributário",
      ],
    },
    {
      titulo: "Administração Tributária e Tributos em Espécie",
      aulas: [
        "Administração Tributária e Fiscalização",
        "Tributos de Competência da União",
        "Tributos de Competência dos Estados",
        "Tributos de Competência dos Municípios",
      ],
    },
    {
      titulo: "Reforma Tributária e Regimes Especiais",
      aulas: [
        "IBS — Imposto sobre Bens e Serviços",
        "CBS — Contribuição sobre Bens e Serviços",
        "Repartição de Receitas Tributárias",
        "Simples Nacional",
      ],
    },
  ],

  "Economia": [
    {
      titulo: "Microeconomia: Fundamentos e Consumidor",
      aulas: ["Fundamentos de Economia", "Elasticidades", "Microeconomia: Teoria do Consumidor"],
    },
    {
      titulo: "Microeconomia: Produção e Estruturas de Mercado",
      aulas: [
        "Teoria da Produção",
        "Teoria dos Custos",
        "Teoria dos Mercados: Concorrência Perfeita",
        "Teoria dos Mercados: Monopólio",
        "Teoria dos Mercados: Oligopólio e Concorrência Monopolística",
      ],
    },
    {
      titulo: "Bem-Estar, Externalidades e Contabilidade Nacional",
      aulas: ["Bens Públicos, Bem-Estar Social e Meio Ambiente", "Macroeconomia: Contabilidade Nacional"],
    },
    {
      titulo: "Macroeconomia: Modelos e Política Econômica",
      aulas: [
        "O Modelo Keynesiano Simples",
        "Sistema Monetário e Mercado Financeiro",
        "Modelo IS-LM e Políticas Fiscal e Monetária",
        "Modelo AO-DA e Inflação",
      ],
    },
    {
      titulo: "Setor Externo",
      aulas: ["Balanço de Pagamentos", "Política Cambial: Câmbio Fixo e Câmbio Flutuante"],
    },
  ],

  "Finanças Públicas": [
    {
      titulo: "Orçamento Público: Fundamentos e Instrumentos",
      aulas: [
        "Orçamento Público: Conceito, Técnicas e Natureza Jurídica",
        "O Orçamento Público no Brasil: PPA, LDO e LOA",
        "Princípios Orçamentários",
      ],
    },
    {
      titulo: "Ciclo Orçamentário, Créditos e Classificações",
      aulas: [
        "Ciclo Orçamentário e Processo de Orçamentação",
        "Créditos Ordinários e Adicionais",
        "Classificações Orçamentárias e Estrutura Programática",
      ],
    },
    {
      titulo: "Receita e Despesa Pública",
      aulas: [
        "Receita Pública: Conceito, Classificações e Fontes",
        "Despesa Pública: Conceito e Classificações",
        "Estágios da Receita e da Despesa",
      ],
    },
    {
      titulo: "Lei de Responsabilidade Fiscal (LRF)",
      aulas: [
        "LRF Parte I: Introdução, Disposições Preliminares e Planejamento",
        "LRF Parte II: Despesa Pública, DOCC e Despesas com Pessoal",
        "LRF Parte III: Transparência, Controle, Gestão Patrimonial e Transferências",
        "LRF Parte IV: Dívida, Endividamento e Disposições Finais",
      ],
    },
  ],

  "Matemática Financeira": [
    {
      titulo: "Juros e Taxas",
      aulas: ["Juros Compostos", "Operações de Desconto", "Taxas"],
    },
    {
      titulo: "Equivalência e Aplicações Financeiras",
      aulas: ["Equivalência de Capitais", "Análise de Investimentos", "Sistemas de Amortização"],
    },
    {
      titulo: "Matemática Básica Aplicada",
      aulas: ["Sistemas de Unidades e Medidas", "Sistemas de Numeração"],
    },
  ],

  "Auditoria": [
    {
      titulo: "Fundamentos e Normas Gerais de Auditoria",
      aulas: [
        "Conceitos Iniciais de Auditoria (NBC TA 200)",
        "Auditoria Interna (NBC TI 01/PI 01)",
        "Planejamento e Documentação (NBC TA 300/230)",
      ],
    },
    {
      titulo: "Procedimentos, Evidências e Amostragem",
      aulas: [
        "Procedimentos e Evidências de Auditoria (NBC TA 500/505/520)",
        "Amostragem em Auditoria (NBC TA 530)",
        "Materialidade, Risco e Fraude (NBC TA 320/240)",
      ],
    },
    {
      titulo: "Relatório, Controle Interno e Situações Especiais",
      aulas: [
        "Relatório de Auditoria (NBC TA 700/705/706)",
        "Controle Interno (NBC TA 315/265)",
        "Continuidade, Estimativas e Eventos Subsequentes (NBC TA 540/550/560/570)",
        "Representações Formais (NBC TA 580)",
        "Distorções e Resposta a Riscos (NBC TA 450/330)",
        "Uso de Especialistas e Auditoria Interna (NBC TA 610/620)",
      ],
    },
    {
      titulo: "Procedimentos Específicos e Auditoria no Setor Público",
      aulas: [
        "Procedimentos em Áreas Específicas das DCs — Parte I",
        "Procedimentos em Áreas Específicas das DCs — Parte II",
        "Auditoria Fiscal — Parte I",
        "Auditoria Fiscal — Parte II",
        "NBC TSP — Estrutura Conceitual",
      ],
    },
  ],

  "Informática": [
    {
      titulo: "Redes de Computadores",
      aulas: [
        "Redes: Conceitos e Tecnologias (Parte 1)",
        "Redes: Acesso Remoto e Wireless (Parte 2)",
        "Redes: Intranet",
      ],
    },
    {
      titulo: "Segurança da Informação",
      aulas: [
        "Segurança da Informação: Malwares e Crimes Digitais (Parte 1)",
        "Segurança da Informação (Parte 2)",
        "Segurança da Informação (Parte 3)",
      ],
    },
    {
      titulo: "Banco de Dados e Modelagem",
      aulas: [
        "Banco de Dados: Conceitos Básicos",
        "Modelo Conceitual",
        "Modelo Relacional",
        "Modelagem de Dados e SQL",
      ],
    },
    {
      titulo: "Business Intelligence e Big Data",
      aulas: ["BI: Data Warehouse e Data Mart", "Data Mining", "Big Data"],
    },
    {
      titulo: "Gestão de Processos e Engenharia de Software",
      aulas: [
        "Gestão de Processos: Modelagem (BPM)",
        "BPMN e Técnicas de Análise de Processos",
        "Gerência de Requisitos de Software",
      ],
    },
    {
      titulo: "Ferramentas Corporativas e Web",
      aulas: [
        "Gerenciamento Eletrônico de Documentos (GED)",
        "Portais Corporativos e Colaborativos",
        "Web Services",
      ],
    },
    {
      titulo: "Gestão e Governança de TI",
      aulas: ["Gerência de Projetos (PMBOK 7ª ed.)", "Governança de TI (PETI, SWOT, BSC)"],
    },
  ],

  "Contabilidade Pública": [
    {
      titulo: "MCASP — Procedimentos e Plano de Contas",
      aulas: [
        "MCASP: Proc. Orçamentários (I)",
        "MCASP: Proc. Orçamentários (II)",
        "MCASP: Proc. Patrimoniais (I)",
        "MCASP: Proc. Patrimoniais (II)",
        "MCASP: Proc. Patrimoniais (III)",
        "MCASP: Plano de Contas (PCASP)",
        "MCASP: Proc. Específicos (PDF)",
      ],
    },
    {
      titulo: "NBC TSP — Normas Vigentes",
      aulas: ["NBC TSP — Estrutura Conceitual", "NBC TSP — Tópicos Vigentes", "NBC TSP — Tópicos Vigentes II (PDF)"],
    },
    {
      titulo: "Balanços e Demonstrações Contábeis (Lei 4.320/64)",
      aulas: [
        "Balanço Orçamentário",
        "Balanço Financeiro",
        "Balanço Patrimonial (BP)",
        "Variações Patrimoniais (DVP)",
        "DFC, DMPL e Notas Explicativas",
        "Título IX — Lei 4.320/64",
      ],
    },
    {
      titulo: "LRF e Princípios Aplicados ao Setor Público",
      aulas: ["LRF (I): RREO e RGF", "LRF (II)", "Princípios"],
    },
  ],

  "Contabilidade Geral": [
    {
      titulo: "Fundamentos: Patrimônio, Escrituração e Regimes",
      aulas: [
        "Patrimônio: Equação, Atos/Fatos, Contas",
        "Plano de Contas, Partidas Dobradas e Livros",
        "Competência x Caixa; Apuração do Resultado",
      ],
    },
    {
      titulo: "Balanço Patrimonial (BP)",
      aulas: [
        "BP — Ativo Circulante (AC)",
        "BP — Estoques",
        "BP — Ativo Não Circulante (ANC)",
        "BP — Ativo Imobilizado",
        "BP — Passivo",
        "BP — Operações Diversas",
        "BP — PL, Parte I",
        "BP — PL, Parte II",
      ],
    },
    {
      titulo: "Demonstrações Complementares e Princípios",
      aulas: [
        "DRE e Resultado Abrangente (DRA)",
        "DLPA e DMPL",
        "DFC (Direto e Indireto)",
        "DVA — Valor Adicionado",
        "Princípios Contábeis (CFC)",
      ],
    },
    {
      titulo: "CPCs — Pronunciamentos Técnicos",
      aulas: [
        "CPC 00 — Estrutura Conceitual",
        "CPC 01 — Impairment",
        "CPC 04 — Intangível",
        "CPC 25 — Provisões e Contingências",
        "CPC 26 — Apresentação das DCs",
        "CPC 27 — Imobilizado",
        "CPC 18 — Equivalência Patrimonial",
        "CPC 16 — Estoques",
        "CPC 12 — Ajuste a Valor Presente",
        "CPC 47 — Receita de Contrato",
        "CPC 48 — Instrumentos Financeiros",
      ],
    },
  ],
};

export const TOPICOS_POR_MATERIA: Record<string, TopicoEspecifico[]> = {};
/** Título de cada bloco por matéria, chaveado pelo número do bloco (ex.
 * `TITULOS_BLOCO_POR_MATERIA["Economia"]["2"]`) — usado por `rotuloBloco`. */
export const TITULOS_BLOCO_POR_MATERIA: Record<string, Record<string, string>> = {};

for (const [materia, blocos] of Object.entries(DEFINICOES_MATERIA)) {
  const { topicos, titulosBloco } = definirMateria(blocos);
  TOPICOS_POR_MATERIA[materia] = topicos;
  TITULOS_BLOCO_POR_MATERIA[materia] = titulosBloco;
}

/** "[<código>] <nome>", ex. "[1.2] Elasticidades". */
export function rotuloTopico(t: TopicoEspecifico): string {
  return `[${t.codigo}] ${t.nome}`;
}

export interface BlocoDeAulas<T extends TopicoEspecifico = TopicoEspecifico> {
  /** Primeiro segmento do código, ex. "1" em "1.3". */
  bloco: string;
  /** Título do bloco (ver `TITULOS_BLOCO_POR_MATERIA`) — ausente quando
   * `agruparPorPrefixo` é chamado fora do contexto de uma matéria com
   * blocos titulados (ex. heatmap de Dados). */
  titulo?: string;
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
 * antes do "."), com título (ver TITULOS_BLOCO_POR_MATERIA), para a seleção
 * "bloco de aulas" em vez de aula única. */
export function blocosDeMateria(materia: string): BlocoDeAulas[] {
  const topicos = TOPICOS_POR_MATERIA[materia];
  if (!topicos) return [];
  return agruparPorPrefixo(topicos, (t) => t.codigo.split(".")[0]).map((b) => ({
    ...b,
    titulo: TITULOS_BLOCO_POR_MATERIA[materia]?.[b.bloco],
  }));
}

/** Rótulo de um bloco para o dropdown: "[<número>] <título> (<n> aulas)". */
export function rotuloBloco(b: BlocoDeAulas): string {
  const titulo = b.titulo ? ` ${b.titulo}` : "";
  return `[${b.bloco}]${titulo} (${b.aulas.length} aula${b.aulas.length > 1 ? "s" : ""})`;
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
  const titulo = b.titulo ? ` — ${b.titulo}` : "";
  return `Bloco ${b.bloco}${titulo} (aulas ${b.aulas[0].codigo}–${b.aulas[b.aulas.length - 1].codigo}): ${b.aulas
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
