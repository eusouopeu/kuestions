#!/usr/bin/env python3
"""SEFAZ-ES 2022 (FGV) - Consultor do Tesouro Estadual (manha comum + tardes Contabeis e Economicas)."""
import json, collections, re
from common import make

INST, ANO = 'SEFAZ-ES', 2022
CARGO = 'Consultor do Tesouro Estadual'

LP, MRL, INF, EST = ('Língua Portuguesa', 'Matemática e Raciocínio Lógico',
                     'Noções de Informática', 'Estatística')
FIN, CPU, CTB, ECO = 'Finanças Públicas', 'Contabilidade Pública', 'Contabilidade Geral', 'Economia'
DADM, DCON, DTRI = 'Direito Administrativo', 'Direito Constitucional', 'Direito Tributário'

BI = {2: '[2] Segurança da Informação (3 aulas)', 6: '[6] Ferramentas Corporativas e Web (3 aulas)'}
BE = {1: '[1] Estatística Descritiva Univariada (5 aulas)', 2: '[2] Combinatória e Probabilidade (2 aulas)',
      3: '[3] Variáveis Aleatórias e Distribuições (4 aulas)', 4: '[4] Inferência Estatística (4 aulas)',
      5: '[5] Regressão, Séries Temporais e Análise Multivariada (5 aulas)'}
BF = {1: '[1] Orçamento Público: Fundamentos e Instrumentos (3 aulas)',
      2: '[2] Ciclo Orçamentário, Créditos e Classificações (3 aulas)',
      3: '[3] Receita e Despesa Pública (3 aulas)', 4: '[4] Lei de Responsabilidade Fiscal (LRF) (4 aulas)'}
BP = {1: '[1] MCASP — Procedimentos e Plano de Contas (7 aulas)', 2: '[2] NBC TSP — Normas Vigentes (3 aulas)',
      3: '[3] Balanços e Demonstrações Contábeis (Lei 4.320/64) (6 aulas)',
      4: '[4] LRF e Princípios Aplicados ao Setor Público (3 aulas)'}
BA_ = {1: '[1] Fundamentos e Poderes Administrativos (3 aulas)', 4: '[4] Agentes Públicos e Licitações/Contratos (4 aulas)',
       6: '[6] Responsabilidade, Controle e Improbidade (3 aulas)', 7: '[7] Bens Públicos e Intervenção na Propriedade (2 aulas)'}
BC = {1: '[1] Teoria Constitucional e Direitos Fundamentais (5 aulas)',
      3: '[3] Organização do Estado e Administração Pública (2 aulas)',
      5: '[5] Defesa do Estado, Tributação e Ordem Econômico-Social (5 aulas)'}
BT = {1: '[1] Sistema Tributário Nacional: Conceitos e Princípios (5 aulas)', 2: '[2] Obrigação e Crédito Tributário (7 aulas)',
      3: '[3] Administração Tributária e Tributos em Espécie (4 aulas)'}
BK = {2: '[2] Balanço Patrimonial (BP) (8 aulas)', 3: '[3] Demonstrações Complementares e Princípios (5 aulas)',
      4: '[4] CPCs — Pronunciamentos Técnicos (11 aulas)', 5: '[5] Contabilidade de Custos e Gerencial'}
BEC = {1: '[1] Microeconomia: Fundamentos e Consumidor (3 aulas)', 2: '[2] Microeconomia: Produção e Estruturas de Mercado (5 aulas)',
       3: '[3] Bem-Estar, Externalidades e Contabilidade Nacional (2 aulas)', 4: '[4] Macroeconomia: Modelos e Política Econômica (4 aulas)',
       5: '[5] Setor Externo (2 aulas)'}

M = {
    1: (LP, 'Interpretação de Texto', ''), 2: (LP, 'Interpretação de Texto', ''), 3: (LP, 'Interpretação de Texto', ''),
    4: (LP, 'Interpretação de Texto', ''), 5: (LP, 'Pontuação', ''), 6: (LP, 'Estrutura do Texto Argumentativo', ''),
    7: (LP, 'Reescrita e Coesão Textual', ''), 8: (LP, 'Interpretação de Texto', ''),
    9: (LP, 'Reescrita de Frase - Sinonímia', ''), 10: (LP, 'Semântica - Comparação', ''),
    11: (MRL, 'Raciocínio Lógico-Matemático', ''), 12: (MRL, 'Lógica Proposicional', ''), 13: (MRL, 'Lógica Proposicional', ''),
    # 14: depende de figura
    15: (MRL, 'Raciocínio Lógico-Matemático', ''), 16: (MRL, 'Lógica Proposicional', ''),
    17: (MRL, 'Teoria dos Conjuntos - Diagrama de Venn', ''), 18: (MRL, 'Porcentagem', ''),
    19: (MRL, 'Regra de Três / Trabalho', ''), 20: (MRL, 'Raciocínio Lógico — Combinatória', ''),
    21: (INF, 'Ferramentas Corporativas - Formatos de Arquivo de Imagem', BI[6]),
    22: (INF, 'Windows 10 - Áreas de Trabalho Virtuais', BI[6]),
    # 23, 24: dependem da planilha em imagem
    25: (INF, 'Ferramentas de Produtividade - MS Excel', BI[6]), 26: (INF, 'Ferramentas de Produtividade - MS Word', BI[6]),
    27: (INF, 'Ferramentas de Produtividade - MS Word', BI[6]), 28: (INF, 'Ferramentas de Produtividade - MS Word', BI[6]),
    29: (INF, 'Internet - Cookies', BI[6]), 30: (INF, 'Segurança da Informação - HTTPS', BI[2]),
    31: (EST, 'Probabilidade', BE[2]), 32: (EST, 'Medidas Separatrizes ou Quantis', BE[1]),
    33: (EST, 'Distribuições Discretas de Probabilidade', BE[3]), 34: (EST, 'Estimação Pontual e Intervalar', BE[4]),
    35: (EST, 'Estimação Pontual e Intervalar', BE[4]), 36: (EST, 'Séries Temporais', BE[5]),
    37: (EST, 'Testes de Hipóteses', BE[4]),
    # 38: depende de tabela em imagem
    39: (EST, 'Regressão Linear Simples', BE[5]), 40: (EST, 'Variáveis Aleatórias e Distribuições Contínuas', BE[3]),
    41: (FIN, 'Receita Pública: Conceito, Classificações e Fontes', BF[3]),
    42: (FIN, 'Receita Pública: Conceito, Classificações e Fontes', BF[3]),
    43: (FIN, 'Estágios da Receita e da Despesa', BF[3]), 44: (FIN, 'Despesa Pública: Conceito e Classificações', BF[3]),
    45: (FIN, 'Estágios da Receita e da Despesa', BF[3]), 46: (FIN, 'Créditos Ordinários e Adicionais', BF[2]),
    47: (FIN, 'Renúncia de Receita e Incentivos Fiscais', BF[4]),
    48: (FIN, 'LRF Parte II: Despesa Pública, DOCC e Despesas com Pessoal', BF[4]),
    49: (FIN, 'LRF Parte III: Transparência, Controle, Gestão Patrimonial e Transferências', BF[4]),
    50: (CPU, 'Balanço Orçamentário', BP[3]),
    51: (FIN, 'Classificações Orçamentárias e Estrutura Programática', BF[2]),
    52: (FIN, 'Orçamento Público: Conceito, Técnicas e Natureza Jurídica', BF[1]),
    53: (FIN, 'Orçamento Público: Conceito, Técnicas e Natureza Jurídica', BF[1]),
    54: (FIN, 'Orçamento Público: Conceito, Técnicas e Natureza Jurídica', BF[1]),
    55: (FIN, 'Orçamento Público: Conceito, Técnicas e Natureza Jurídica', BF[1]),
    56: (FIN, 'Créditos Ordinários e Adicionais', BF[2]), 57: (FIN, 'Créditos Ordinários e Adicionais', BF[2]),
    58: (FIN, 'O Orçamento Público no Brasil: PPA, LDO e LOA', BF[1]),
    59: (FIN, 'O Orçamento Público no Brasil: PPA, LDO e LOA', BF[1]),
    60: (FIN, 'Ciclo Orçamentário e Processo de Orçamentação', BF[2]),
    61: (DADM, 'Poderes Administrativos', BA_[1]), 62: (DADM, 'Responsabilidade Civil do Estado', BA_[6]),
    63: (DADM, 'Agentes Públicos', BA_[4]), 64: (DADM, 'Intervenção na Propriedade', BA_[7]),
    65: (DADM, 'Agentes Públicos', BA_[4]), 66: (DADM, 'Agentes Públicos', BA_[4]),
    67: (DADM, 'Improbidade Administrativa (Lei 8.429/1992)', BA_[6]),
    68: (DCON, 'Direitos e Deveres Individuais e Coletivos I', BC[1]),
    69: (DCON, 'Direitos e Deveres Individuais e Coletivos I', BC[1]),
    70: (DCON, 'Ordem Social', BC[5]), 71: (DCON, 'Administração Pública', BC[3]),
    # 72: anulada
    73: (DCON, 'Ordem Econômica e Financeira', BC[5]), 74: (DCON, 'Sistema Tributário Nacional', BC[5]),
    75: (DTRI, 'Repartição de Receitas Tributárias', BT[1]), 76: (DTRI, 'Tributos de Competência dos Estados', BT[3]),
    77: (DTRI, 'Tributos de Competência dos Municípios', BT[3]),
    78: (DTRI, 'Conceito, Espécies e Classificação dos Tributos', BT[1]),
    79: (DTRI, 'Legislação Tributária', BT[1]), 80: (DTRI, 'Responsabilidade Tributária', BT[2]),
}

TC = {
    1: (CTB, 'CPC 48 — Instrumentos Financeiros', BK[4]),
    2: (CTB, 'Demonstrações Complementares - Conversão de demonstrações em moeda estrangeira', BK[3]),
    3: (CTB, 'CPC 06 — Arrendamentos', BK[4]), 4: (CTB, 'CPC 18 — Equivalência Patrimonial', BK[4]),
    5: (CTB, 'Custo de Aquisição — Importação', BK[2]),
    6: (CTB, 'Demonstrações Complementares - Conversão de demonstrações em moeda estrangeira', BK[3]),
    7: (CTB, 'CPC 28 — Propriedade para Investimento', BK[4]),
    8: (CTB, 'CPC 31 — Ativo Não Circulante Mantido para Venda', BK[4]),
    9: (CTB, 'CPC 25 — Provisões e Contingências', BK[4]), 10: (CTB, 'CPC 26 — Apresentação das DCs', BK[4]),
    11: (CTB, 'BP — PL, Parte I', BK[2]), 12: (CTB, 'CPC 28 — Propriedade para Investimento', BK[4]),
    13: (CTB, 'DVA — Valor Adicionado', BK[3]), 14: (CTB, 'BP — Estoques', BK[2]),
    15: (CTB, 'DRE e Resultado Abrangente (DRA)', BK[3]), 16: (CTB, 'Contabilidade de Custos', BK[5]),
    17: (CTB, 'Contabilidade de Custos', BK[5]), 18: (CTB, 'Contabilidade de Custos — Produção por Processo', BK[5]),
    19: (CTB, 'Contabilidade - Custo de Produtos sob Encomenda', BK[5]),
    20: (CTB, 'Contabilidade de Custos — Coprodutos', BK[5]),
    21: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]), 22: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]),
    23: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]), 24: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]),
    25: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]), 26: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]),
    27: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]), 28: (CPU, 'MCASP: Proc. Patrimoniais (I)', BP[1]),
    29: (CPU, 'MCASP: Plano de Contas (PCASP)', BP[1]), 30: (CPU, 'MCASP: Proc. Orçamentários (I)', BP[1]),
    31: (CPU, 'MCASP: Proc. Orçamentários (I)', BP[1]), 32: (CPU, 'MCASP: Proc. Orçamentários (I)', BP[1]),
    33: (CPU, 'MCASP: Proc. Orçamentários (II)', BP[1]), 34: (CPU, 'MCASP: Proc. Específicos (PDF)', BP[1]),
    35: (CPU, 'SIAFI', BP[1]), 36: (CPU, 'SIAFI', BP[1]), 37: (CPU, 'NBC TSP — Estrutura Conceitual', BP[2]),
    38: (CPU, 'Título IX — Lei 4.320/64', BP[3]), 39: (CPU, 'Princípios', BP[4]),
    40: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]),
}

TE = {
    1: (ECO, 'Fundamentos de Economia', BEC[1]), 2: (ECO, 'Fundamentos de Economia', BEC[1]),
    3: (ECO, 'Inflação e Desvalorização Monetária', BEC[4]), 4: (ECO, 'Elasticidades', BEC[1]),
    5: (ECO, 'Microeconomia: Teoria do Consumidor', BEC[1]), 6: (ECO, 'Teoria da Produção', BEC[2]),
    7: (ECO, 'Teoria dos Mercados: Concorrência Perfeita', BEC[2]),
    8: (ECO, 'Microeconomia - Estruturas de Mercado', BEC[2]),
    9: (ECO, 'Bens Públicos, Bem-Estar Social e Meio Ambiente', BEC[3]),
    10: (ECO, 'Bens Públicos, Bem-Estar Social e Meio Ambiente', BEC[3]),
    11: (ECO, 'Contas Nacionais', BEC[3]), 12: (ECO, 'Teoria da Produção', BEC[2]), 13: (ECO, 'Microeconomia', BEC[1]),
    14: (ECO, 'Bens Públicos, Bem-Estar Social e Meio Ambiente', BEC[3]), 15: (ECO, 'Microeconomia', BEC[2]),
    16: (ECO, 'Contas Nacionais', BEC[3]), 17: (ECO, 'Contas Nacionais', BEC[3]), 18: (ECO, 'Contas Nacionais', BEC[3]),
    19: (ECO, 'Macroeconomia: Contabilidade Nacional', BEC[3]), 20: (ECO, 'O Modelo Keynesiano Simples', BEC[4]),
    21: (ECO, 'Macroeconomia', BEC[4]), 22: (ECO, 'Macroeconomia', BEC[4]),
    23: (ECO, 'Sistema Monetário e Mercado Financeiro', BEC[4]), 24: (ECO, 'Sistema Monetário e Mercado Financeiro', BEC[4]),
    # 25: anulada
    26: (ECO, 'Sistema Monetário e Mercado Financeiro', BEC[4]), 27: (ECO, 'Sistema Monetário e Mercado Financeiro', BEC[4]),
    28: (ECO, 'Balanço de Pagamentos', BEC[5]), 29: (ECO, 'Balanço de Pagamentos', BEC[5]),
    30: (ECO, 'Balanço de Pagamentos', BEC[5]), 31: (ECO, 'Política Cambial: Câmbio Fixo e Câmbio Flutuante', BEC[5]),
    32: (ECO, 'Política Cambial: Câmbio Fixo e Câmbio Flutuante', BEC[5]),
    33: (ECO, 'Sistema Monetário e Mercado Financeiro', BEC[4]),
    34: (ECO, 'Bens Públicos, Bem-Estar Social e Meio Ambiente', BEC[3]),
    35: (ECO, 'Sistema Monetário e Mercado Financeiro', BEC[4]), 36: (ECO, 'Sistema Monetário e Mercado Financeiro', BEC[4]),
    37: (ECO, 'Sistema Monetário e Mercado Financeiro', BEC[4]),
    38: (ECO, 'Economia Brasileira - Planos de Estabilização', BEC[4]),
    39: (ECO, 'Economia Brasileira - Planos de Estabilização', BEC[4]),
    40: (ECO, 'Inflação e Desvalorização Monetária', BEC[4]),
}

# Q39 da manha: o parser perde a questao (um "1" isolado na formula parece numero de questao).
M39 = {
    'numero': 39,
    'enunciado': ('As informações a seguir referem-se aos resultados parciais da aplicação de um modelo de regressão '
                  'linear simples, Y = β0 + β1X1 + ε, em uma amostra aleatória simples de 60 pares de observações.\n'
                  'Alguns dos resultados aproximados foram:\n'
                  '• Σ(Yi − Ȳ)² = 5.350 (somatório de i = 1 a 60);\n'
                  '• (1/58)·Σ(Yi − Ŷi)² = 16,98 (somatório de i = 1 a 60);\n'
                  '• F calculado = 257,21;\n'
                  '• F de significância = 5,50E-23;\n'
                  '• intercepto = 34,52; e\n'
                  '• inclinação = –0,84.\n'
                  'O valor da estatística t de Student e o p-valor para o teste da significância de β1 são, '
                  'aproximadamente e respectivamente,'),
    'alternativas': {'A': '–41 e 5,50E-23.', 'B': '–16 e 5,50E-23.', 'C': '17 e 2,75E-23.',
                     'D': '34 e 2,75E-23.', 'E': '41 e 2,75E-23.'},
}

# TC-Q29: o quadro do PCASP sai embaralhado no PDF; reconstruido a partir do texto extraido.
TC29_QUADRO = ('O Plano de Contas Aplicado ao Setor Público (PCASP) é dividido em oito classes, sendo as contas '
               'classificadas segundo a natureza das informações que evidenciam, conforme o quadro a seguir '
               '(natureza da informação → classes).\n'
               'I. 1. Ativo; 2. Passivo\n'
               'II. 3. Variações Patrimoniais Diminutivas; 4. Variações Patrimoniais Aumentativas\n'
               'III. 5. Controles da Aprovação do Planejamento e Orçamento; 6. Controles da Execução do Planejamento e Orçamento\n'
               'IV. 7. Controles Devedores; 8. Controles Credores\n')


# Enunciados ja formatados (tabelas/formulas que o PDF achata) - aplicados apos make().
RAW = {
    ('M', 39): ('As informações a seguir referem-se aos resultados parciais da aplicação de um modelo de regressão '
                'linear simples, Y = β0 + β1X1 + ε, em uma amostra aleatória simples de 60 pares de observações. '
                'Alguns dos resultados aproximados foram:\n\n'
                '• Σ(Yi − Ȳ)² = 5.350 (somatório de i = 1 a 60);\n'
                '• (1/58)·Σ(Yi − Ŷi)² = 16,98 (somatório de i = 1 a 60);\n'
                '• F calculado = 257,21;\n'
                '• F de significância = 5,50E-23;\n'
                '• intercepto = 34,52; e\n'
                '• inclinação = –0,84.\n\n'
                'O valor da estatística t de Student e o p-valor para o teste da significância de β1 são, '
                'aproximadamente e respectivamente,'),
    ('TE', 16): ('Suponha que o único bem produzido por um país seja suco de laranja com morango. Para produzir esse '
                 'suco é necessário produzir laranja e morango. O processo produtivo é descrito na tabela a seguir '
                 '(produto: valor do produto; insumos).\n\n'
                 '• Laranja: 20; 0\n'
                 '• Morango: 10; 0\n'
                 '• Suco de laranja com morango: 50; 30\n\n'
                 'Os valores do Produto Agregado, do Valor Adicionado e do Valor Bruto da Produção da economia desse '
                 'país são iguais, respectivamente, a'),
    ('TE', 18): ('A partir da Conta Produto Interno Bruto, obtém-se o PIB e a DIB (Despesa Interna Bruta) a preços de '
                 'mercado (pm). Essa Conta é representada na tabela abaixo.\n\n'
                 'Débito:\n'
                 'a. Salários\n'
                 'b. ______\n'
                 'c. Impostos Indiretos\n'
                 'd. ______\n'
                 'Total: PIBpm\n\n'
                 'Crédito:\n'
                 'a. Consumo Familiar\n'
                 'b. Consumo do Governo\n'
                 'c. ______\n'
                 'd. Formação Bruta de Capital Fixo\n'
                 'e. Exportações não-fatores\n'
                 'f. (-) Importações não-fatores\n'
                 'Total: DIBpm\n\n'
                 'Marque a opção que preenche corretamente os termos em branco do lado do Débito (itens b e d) e do '
                 'lado do Crédito (item c).'),
}


def build():
    G = json.load(open('es_gab.json'))
    gm, gtc, gte = G[0]['resp'], G[4]['resp'], G[6]['resp']
    out = []
    for src, mapa, g, tag in [('es_m.json', M, gm, 'M'), ('es_tc.json', TC, gtc, 'TC'), ('es_te.json', TE, gte, 'TE')]:
        qs = {q['numero']: q for q in json.load(open(src))}
        if tag == 'M':
            qs[39] = M39
        for n in sorted(mapa):
            q = qs[n]
            ans = g[str(n)]
            assert ans in 'ABCDE', (tag, n, ans)
            enun = q['enunciado']
            if tag == 'TC' and n == 29:
                cauda = re.search(r'Nesse sentido.*', re.sub(r'\s+', ' ', enun)).group(0)
                enun = TC29_QUADRO + cauda
            area, assunto, bloco = mapa[n]
            rec = make(f'{INST}-{ANO}-{tag}-Q{n:03d}', INST, ANO, CARGO, area, assunto,
                       n, enun, q['alternativas'], ans, bloco)
            if (tag, n) in RAW:
                rec['enunciado'] = RAW[(tag, n)]
            out.append(rec)
    return out


if __name__ == '__main__':
    recs = build()
    json.dump(recs, open('novas_es.json', 'w'), ensure_ascii=False, indent=1)
    print(len(recs), 'questoes')
    for a, c in collections.Counter(r['area'] for r in recs).most_common():
        print(f'  {c:3d}  {a}')
