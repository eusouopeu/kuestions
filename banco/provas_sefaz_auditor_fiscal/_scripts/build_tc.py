#!/usr/bin/env python3
"""TCE-SC 2026 (FGV) - Auditor Fiscal de Controle Externo - Ciencias Contabeis, tipo 1
TCE-PA 2024 (FGV) - Auditor de Controle Externo - Fiscalizacao/Contabilidade, tipo 1
e TCE-GO 2024 (FGV) - Analista de Controle Externo - Ciencias Contabeis, tipo 1."""
import json, collections, sys, re
from common import make

LP, MRL, MF, EST = ('Língua Portuguesa', 'Matemática e Raciocínio Lógico',
                    'Matemática Financeira', 'Estatística')
INF, AUD, CTB, CP, FP = ('Noções de Informática', 'Auditoria', 'Contabilidade Geral',
                         'Contabilidade Pública', 'Finanças Públicas')
DADM, DCON, DCIV, DTRI, ADMP = ('Direito Administrativo', 'Direito Constitucional',
                                'Direito Civil e Empresarial', 'Direito Tributário',
                                'Administração Pública')

BC = {1: '[1] Teoria Constitucional e Direitos Fundamentais (5 aulas)',
      2: '[2] Nacionalidade e Direitos Políticos (3 aulas)',
      3: '[3] Organização do Estado e Administração Pública (2 aulas)',
      4: '[4] Organização dos Poderes (5 aulas)',
      5: '[5] Defesa do Estado, Tributação e Ordem Econômico-Social (5 aulas)',
      6: '[6] Controle de Constitucionalidade (1 aula)'}
BA = {1: '[1] Fundamentos e Poderes Administrativos (3 aulas)',
      3: '[3] Organização Administrativa e Entidades (3 aulas)',
      4: '[4] Agentes Públicos e Licitações/Contratos (4 aulas)',
      5: '[5] Serviços Públicos e Parcerias (2 aulas)',
      6: '[6] Responsabilidade, Controle e Improbidade (3 aulas)',
      7: '[7] Bens Públicos e Intervenção na Propriedade (2 aulas)'}
BK = {1: '[1] Fundamentos: Patrimônio, Escrituração e Regimes (3 aulas)',
      2: '[2] Balanço Patrimonial (BP) (8 aulas)',
      3: '[3] Demonstrações Complementares e Princípios (5 aulas)',
      4: '[4] CPCs — Pronunciamentos Técnicos (11 aulas)',
      5: '[5] Contabilidade de Custos e Gerencial'}
BP = {1: '[1] MCASP — Procedimentos e Plano de Contas (7 aulas)',
      2: '[2] NBC TSP — Normas Vigentes (3 aulas)',
      3: '[3] Balanços e Demonstrações Contábeis (Lei 4.320/64) (6 aulas)',
      4: '[4] LRF e Princípios Aplicados ao Setor Público (3 aulas)'}
BF = {1: '[1] Orçamento Público: Fundamentos e Instrumentos (3 aulas)',
      2: '[2] Ciclo Orçamentário, Créditos e Classificações (3 aulas)',
      3: '[3] Receita e Despesa Pública (3 aulas)',
      4: '[4] Lei de Responsabilidade Fiscal (LRF) (4 aulas)'}
BU = {1: '[1] Fundamentos e Normas Gerais de Auditoria (3 aulas)',
      2: '[2] Procedimentos, Evidências e Amostragem (3 aulas)',
      3: '[3] Relatório, Controle Interno e Situações Especiais (6 aulas)',
      4: '[4] Procedimentos Específicos e Auditoria no Setor Público (5 aulas)'}
BI = {2: '[2] Segurança da Informação (3 aulas)',
      3: '[3] Banco de Dados e Modelagem (4 aulas)',
      4: '[4] Business Intelligence e Big Data (3 aulas)',
      6: '[6] Ferramentas Corporativas e Web (3 aulas)'}
BE = {2: '[2] Combinatória e Probabilidade (2 aulas)', 1: '[1] Estatística Descritiva Univariada (5 aulas)',
      4: '[4] Inferência Estatística (4 aulas)'}
BM = {1: '[1] Juros e Taxas (3 aulas)', 2: '[2] Equivalência e Aplicações Financeiras (3 aulas)'}
BT4 = '[4] Reforma Tributária e Regimes Especiais (4 aulas)'

SC = {
    1: (LP, 'Interpretação de Texto', ''),
    2: (LP, 'Interpretação de Texto - Significação e Estruturação', ''),
    3: (LP, 'Formação de Palavras - Siglas e Abreviações', ''),
    4: (LP, 'Interpretação de Texto', ''),
    5: (LP, 'Interpretação de Texto', ''),
    6: (LP, 'Acentuação Gráfica - Crase', ''),
    # 7: depende do texto da questao anterior
    8: (LP, 'Reescrita e Substituição de Termos', ''),
    9: (LP, 'Variação Linguística - Oralidade na Escrita', ''),
    10: (LP, 'Semântica - Parônimos', ''),
    11: (MRL, 'Aritmética - Divisores e Equações em Inteiros', ''),
    12: (MRL, 'Probabilidade', ''),
    13: (MRL, 'Porcentagem', ''),
    14: (MRL, 'Regra de Três Composta', ''),
    15: (MRL, 'Calendário', ''),
    16: (MRL, 'Criptoaritmética', ''),
    17: (MRL, 'Lógica de Argumentação - Associação', ''),
    # 18: depende de figura
    19: (MF, 'Rentabilidade de Aplicações', BM[1]),
    20: (MRL, 'Sequências e Permutações', ''),
    # 21, 24, 25: codigo de etica/resolucoes do TCE-SC
    22: (ADMP, 'Ética, Democracia e Cidadania', ''),
    23: (DADM, 'Acordo de Leniência x Acordo de Não Persecução Civil', BA[6]),
    26: (DADM, 'Lei Anticorrupção (Lei 12.846/2013)', BA[6]),
    27: (DADM, 'Licitações — Consórcio de Empresas (Lei 14.133/2021)', BA[4]),
    28: (DADM, 'Empresas Estatais (Lei 13.303/2016)', BA[3]),
    29: (FP, 'Direito Financeiro na Constituição - Ciclo Orçamentário', BF[1]),
    30: (DCON, 'Repasse de Recursos a Escolas Confessionais (Ordem Social)', BC[5]),
    31: (FP, 'LRF — Limite de Despesa com Pessoal', BF[4]),
    32: (FP, 'Princípios Orçamentários', BF[1]),
    33: (INF, 'Editor de Texto - Estilos e Navegação', BI[6]),
    34: (INF, 'Segurança da Informação - Confidencialidade', BI[2]),
    35: (INF, 'SQL', BI[3]),
    36: (INF, 'LGPD - Dados Sensíveis', BI[2]),
    37: (EST, 'Teste de Hipóteses - Comparação de Médias', BE[4]),
    38: (INF, 'Aprendizado de Máquina - Overfitting', BI[4]),
    39: (INF, 'Dados Estruturados, Semiestruturados e Não Estruturados', BI[4]),
    40: (INF, 'Certificação e Assinatura Digital', BI[2]),
    41: (DADM, 'Compliance no Setor Público - Lei Anticorrupção', BA[6]),
    42: (AUD, 'Modelo das Três Linhas de Defesa', BU[3]),
    43: (AUD, 'Programa de Integridade e Gestão de Riscos', BU[3]),
    44: (AUD, 'Instrumentos de Fiscalização do Controle Externo', BU[4]),
    45: (AUD, 'Auditoria Governamental - Matriz de Planejamento', BU[4]),
    # 46: anulada
    47: (AUD, 'Papéis de Trabalho', BU[4]),
    48: (AUD, 'Auditoria Governamental - Matriz de Responsabilização', BU[4]),
    49: (AUD, 'Procedimentos de Auditoria - Observação, Inspeção e Confirmação', BU[2]),
    50: (AUD, 'Instrumentos de Fiscalização do Controle Externo', BU[4]),
    # 51, 54, 55, 57-60: Constituicao Estadual / Lei Organica do TCE-SC
    52: (DCON, 'Tribunal de Contas da União - Controle Externo', BC[4]),
    53: (DCON, 'Tribunais de Contas dos Municípios', BC[4]),
    56: (DADM, 'Improbidade Administrativa (Lei 8.429/1992)', BA[6]),
    # 61-70: legislacao do TCE-SC
    71: (CP, 'NBC TSP — Propriedade para Investimento (Consolidação)', BP[2]),
    72: (CP, 'NBC TSP — Contratos de Concessão de Serviços Públicos', BP[2]),
    73: (CP, 'Demonstração dos Fluxos de Caixa no Setor Público', BP[3]),
    74: (CP, 'NBC TSP 01 — Receita de Transação sem Contraprestação', BP[2]),
    75: (CP, 'NBC TSP Estrutura Conceitual — Características Qualitativas', BP[2]),
    76: (CP, 'Etapas da Despesa Orçamentária - Planejamento', BP[1]),
    77: (FP, 'LRF — Transparência da Gestão Fiscal', BF[4]),
    78: (FP, 'LRF — Lei Orçamentária Anual', BF[4]),
    79: (FP, 'Crimes e Infrações contra as Finanças Públicas (Lei 10.028/2000)', BF[4]),
    80: (CTB, 'Regime de Caixa x Competência', BK[1]),
    81: (CTB, 'CPC 23 — Políticas Contábeis, Mudança de Estimativa e Erro', BK[4]),
    82: (CTB, 'CPC 47 — Receita de Contrato com Cliente', BK[4]),
    83: (CTB, 'DRE — Receitas', BK[3]),
    84: (CTB, 'Outros Resultados Abrangentes e Patrimônio Líquido', BK[3]),
    85: (CTB, 'BP — Estoques (Valor Realizável Líquido)', BK[2]),
    86: (CTB, 'CPC 12 — Ajuste a Valor Presente', BK[4]),
    87: (CTB, 'CPC 46 — Mensuração do Valor Justo', BK[4]),
    88: (CTB, 'BP — Ativo Imobilizado (Depreciação de Benfeitorias)', BK[2]),
    89: (CTB, 'CPC 15 — Combinação de Negócios (Goodwill)', BK[4]),
    90: (CTB, 'CPC 47 — Agente x Principal', BK[4]),
    91: (CTB, 'BP — Ações em Tesouraria', BK[2]),
    92: (CTB, 'CPC 15 — Compra Vantajosa', BK[4]),
    93: (CTB, 'BP — Fornecedores e Descontos', BK[2]),
    94: (CTB, 'Análise das Demonstrações — Imobilização do PL', BK[3]),
    95: (CTB, 'Contabilidade de Custos - Investimento x Custo x Despesa', BK[5]),
    96: (AUD, 'Testes de Detalhes e Afirmações', BU[2]),
    97: (AUD, 'Relatório do Auditor - Parágrafo de Ênfase', BU[3]),
    98: (DADM, 'Organizações Sociais (Lei 9.637/1998)', BA[5]),
    99: (DADM, 'Parcerias com OSC (Lei 13.019/2014) - Prestação de Contas', BA[5]),
    100: (DTRI, 'Reforma Tributária — IBS (LC 214/2025)', BT4),
}

PA = {
    1: (LP, 'Paralelismo Sintático', ''),
    2: (LP, 'Semântica - Comparação', ''),
    3: (LP, 'Semântica - Ambiguidade', ''),
    4: (LP, 'Conjunções - Valor Condicional', ''),
    5: (LP, 'Morfossintaxe - Valor Interrogativo', ''),
    6: (LP, 'Tipologia Textual - Texto Descritivo', ''),
    7: (LP, 'Tipologia Textual - Descrição', ''),
    8: (LP, 'Tipologia Textual - Texto Narrativo', ''),
    9: (LP, 'Conjunções - Orações Adversativas', ''),
    10: (LP, 'Significação e Estruturação da Frase', ''),
    11: (MRL, 'Raciocínio Matemático - Contagem', ''),
    12: (MF, 'Sistemas de Amortização', BM[2]),
    13: (MRL, 'Lógica Proposicional - Negação da Condicional', ''),
    14: (EST, 'Estatística Descritiva - Tabelas', BE[1]),
    15: (EST, 'Probabilidade', BE[2]),
    # 16: codigo de etica TCE-PA | 18: estatuto dos servidores do PA
    17: (DADM, 'Microssistema Anticorrupção', BA[6]),
    19: (ADMP, 'Convenção das Nações Unidas contra a Corrupção', ''),
    20: (DADM, 'Lei Anticorrupção (Lei 12.846/2013)', BA[6]),
    # 21-30: legislacao estadual, historia e geografia do Para
    31: (DCON, 'Poder Constituinte', BC[1]),
    32: (DCON, 'Direitos Políticos - Suspensão', BC[2]),
    33: (DCON, 'Constituições Estaduais - Limites do Poder Constituinte Decorrente', BC[3]),
    34: (DCON, 'Intervenção Federal', BC[3]),
    35: (DCON, 'Medidas Provisórias', BC[4]),
    36: (DADM, 'Princípios Implícitos - Segurança Jurídica', BA[1]),
    37: (DADM, 'Improbidade Administrativa (Lei 8.429/1992)', BA[6]),
    38: (DADM, 'Administração Indireta', BA[3]),
    39: (DCON, 'Servidores Públicos - Estabilidade', BC[3]),
    40: (DADM, 'Poder Regulamentar - Espécies de Regulamento', BA[1]),
    41: (ADMP, 'Modelos de Administração Pública', ''),
    43: (DADM, 'OSCIP (Lei 9.790/1999)', BA[5]),
    44: (DADM, 'Entidades Paraestatais', BA[5]),
    45: (ADMP, 'Planejamento Estratégico - Análise SWOT', ''),
    46: (ADMP, 'Princípios de Governança Pública', ''),
    47: (DADM, 'Licitações — Gestão de Riscos e Controle (Lei 14.133/2021)', BA[4]),
    48: (DADM, 'Licitações — Sanções Administrativas (Lei 14.133/2021)', BA[4]),
    49: (DADM, 'Contratos — Pagamentos (Lei 14.133/2021)', BA[4]),
    50: (DADM, 'Contratos Administrativos (Lei 14.133/2021)', BA[4]),
    51: (AUD, 'ISSAI 20 — Accountability e Transparência', BU[4]),
    # 42, 54: anuladas | 52, 55, 57-60, 72: Lei Organica / Regimento Interno do TCE-PA
    53: (AUD, 'Declaração de Lima — Independência das EFS', BU[4]),
    56: (DCON, 'Órgãos Constitucionais Autônomos', BC[4]),
    61: (AUD, 'NBASP 140 — Controle de Qualidade', BU[1]),
    62: (AUD, 'Princípios de Auditoria no Setor Público', BU[4]),
    63: (AUD, 'Opinião Modificada', BU[3]),
    64: (AUD, 'NBASP 300 — Monitoramento de Auditoria Operacional', BU[4]),
    65: (AUD, 'NBASP 200 — Princípios de Auditoria Financeira', BU[4]),
    66: (DCIV, 'Direito Civil - Defeitos do Negócio Jurídico', ''),
    67: (DCIV, 'Direito Empresarial - Sociedade Empresária', ''),
    68: (DCIV, 'Direito Civil - Capacidade Civil', ''),
    69: (DCIV, 'Processo Civil - Princípios do Processo', ''),
    70: (DADM, 'Controle Judicial dos Atos Administrativos', BA[6]),
    71: (AUD, 'Normas INTOSAI - Conceito de Auditoria Governamental', BU[4]),
    73: (AUD, 'Amostragem em Auditoria', BU[2]),
    74: (AUD, 'Procedimentos de Auditoria - Recálculo', BU[2]),
    75: (AUD, 'Relatório de Auditoria - Matrizes de Achados e Responsabilização', BU[3]),
    76: (CP, 'NBC TSP Estrutura Conceitual — Características Qualitativas', BP[2]),
    77: (CP, 'NBC TSP Estrutura Conceitual — Objetivos da Informação', BP[2]),
    78: (CP, 'NBC TSP 23 — Políticas Contábeis, Estimativas e Erros', BP[2]),
    79: (CP, 'Equivalentes de Caixa no Setor Público', BP[2]),
    # 80: anulada
    81: (CP, 'NBC TSP — Mensuração de Ativos (Terreno)', BP[2]),
    82: (CP, 'NBC TSP — Combinações no Setor Público (Mais-valia e Ágio)', BP[2]),
    83: (CP, 'NBC TSP — Imobilizado x Estoques (Sobressalentes)', BP[2]),
    84: (CTB, 'CPC 04 — Intangível', BK[4]),
    85: (CTB, 'CPC 20 — Custos de Empréstimos', BK[4]),
    86: (CP, 'Balanço Financeiro', BP[3]),
    87: (CP, 'Contas de Compensação — Atos Potenciais (MCASP)', BP[1]),
    88: (CP, 'Notas Explicativas (MCASP)', BP[3]),
    89: (CTB, 'BP — Empréstimos (Circulante x Não Circulante)', BK[2]),
    90: (CTB, 'Reserva de Lucros a Realizar', BK[2]),
    91: (CTB, 'BP — Estoques e Custo das Mercadorias Vendidas', BK[2]),
    92: (CTB, 'CPC 08 — Debêntures com Prêmio', BK[4]),
    93: (CTB, 'BP — Ativo Imobilizado (Obras de Arte)', BK[2]),
    94: (CTB, 'BP — Depreciação', BK[2]),
    95: (CTB, 'DRE — Receita Líquida de Vendas', BK[3]),
    96: (CTB, 'CPC 32 — Tributos sobre o Lucro (Diferidos)', BK[4]),
    97: (CTB, 'BP — Ativo Imobilizado', BK[2]),
    98: (CP, 'NBC TSP 34 — Custos no Setor Público', BP[2]),
    99: (CP, 'NBC TSP 34 — Custos no Setor Público', BP[2]),
    100: (CP, 'Demonstrativo da Disponibilidade de Caixa e Restos a Pagar (MDF)', BP[4]),
}

GO = {
    1: (LP, 'Morfologia - Adjetivos', ''),
    2: (LP, 'Orações Reduzidas e Desenvolvidas', ''),
    3: (LP, 'Tipologia Textual - Descrição', ''),
    4: (LP, 'Paralelismo Sintático', ''),
    5: (LP, 'Colocação dos Termos e Sentido', ''),
    6: (LP, 'Regência - Pronomes O/LHE', ''),
    7: (LP, 'Semântica - Expressão "Cerca de"', ''),
    8: (LP, 'Conjunções - Valor Alternativo', ''),
    9: (LP, 'Crase Facultativa', ''),
    10: (LP, 'Relações de Causa', ''),
    11: (LP, 'Semântica - Sentido Figurado', ''),
    12: (LP, 'Coesão - Relações Lógicas entre Segmentos', ''),
    13: (LP, 'Reescrita - Forma Negativa e Positiva', ''),
    14: (LP, 'Tipologia Textual - Texto Injuntivo', ''),
    15: (LP, 'Preposições - Valor Semântico', ''),
    # 16-23: Lingua Inglesa (area oculta no app) | 24-33, 36-41: legislacao de Goias / TCE-GO
    34: (DCON, 'Controle Externo Municipal (Art. 31 da CF)', BC[4]),
    35: (DCON, 'Competências do TCU (Art. 71 da CF)', BC[4]),
    # 37, 49: anuladas
    42: (FP, 'LRF — Funções dos Tribunais de Contas', BF[4]),
    43: (DADM, 'Licitações — Funções dos Tribunais de Contas (Lei 14.133/2021)', BA[4]),
    44: (DADM, 'Funções dos Tribunais de Contas na Lei das Eleições (Lei 9.504/1997)', BA[6]),
    45: (DADM, 'Funções dos Tribunais de Contas nos RPPS (Lei 9.717/1998)', BA[6]),
    46: (DCON, 'Tribunais de Contas e Controle de Constitucionalidade (Súmula 347 STF)', BC[6]),
    47: (DCON, 'Composição dos Tribunais de Contas Estaduais (Súmula 653 STF)', BC[4]),
    48: (DCON, 'Registro de Aposentadoria pelo Tribunal de Contas', BC[4]),
    50: (DADM, 'Compliance e Programas de Integridade Pública', BA[6]),
    51: (AUD, 'COSO — Controle Interno Integrado (2013)', BU[3]),
    52: (AUD, 'ISSAI — Normas Internacionais das EFS', BU[1]),
    53: (AUD, 'ISSAI — Princípios de Auditoria', BU[1]),
    54: (AUD, 'Declaração de Lima', BU[4]),
    55: (AUD, 'NBASP 10 — Independência dos Tribunais de Contas', BU[4]),
    56: (AUD, 'NBASP 10 — Independência dos Tribunais de Contas', BU[4]),
    57: (AUD, 'NBASP 20 — Transparência e Accountability', BU[4]),
    58: (AUD, 'NBASP 50 — Atividades Jurisdicionais dos Tribunais de Contas', BU[4]),
    59: (AUD, 'NBASP 400 — Auditoria de Conformidade', BU[4]),
    60: (AUD, 'NBASP 9020 — Avaliação de Políticas Públicas', BU[4]),
    61: (DCON, 'Nacionalidade - Brasileiros Natos e Naturalizados', BC[2]),
    62: (DCON, 'Nacionalidade - Perda', BC[2]),
    63: (DCON, 'Competência Legislativa Concorrente', BC[3]),
    64: (DCON, 'Servidores Públicos na Constituição', BC[3]),
    65: (FP, 'Lei Orçamentária Anual na Constituição', BF[1]),
    66: (DCON, 'Competência da Justiça Federal', BC[4]),
    67: (DADM, 'Bens de Autarquias e Sociedades de Economia Mista', BA[7]),
    68: (DADM, 'Parcerias com OSC (Lei 13.019/2014) - Prestação de Contas', BA[5]),
    69: (DADM, 'Licitações — Fases da Concorrência (Lei 14.133/2021)', BA[4]),
    70: (DADM, 'Empresas Estatais — Fiscalização (Lei 13.303/2016)', BA[3]),
    71: (DADM, 'Tomada de Contas Especial', BA[6]),
    72: (DADM, 'Agentes Públicos - Subsídio', BA[4]),
    73: (FP, 'Princípios Orçamentários - Unidade', BF[1]),
    74: (FP, 'Etapas da Receita Orçamentária', BF[3]),
    75: (FP, 'Classificação Funcional da Despesa', BF[2]),
    76: (FP, 'Execução da Despesa - Empenho', BF[3]),
    77: (FP, 'Emendas ao Projeto de LOA', BF[2]),
    78: (FP, 'Ciclo Orçamentário', BF[2]),
    79: (FP, 'Restos a Pagar', BF[3]),
    80: (FP, 'Suprimento de Fundos', BF[3]),
    81: (FP, 'Classificação da Despesa - Elemento de Despesa', BF[2]),
    82: (CP, 'Material Permanente x Material de Consumo (MCASP)', BP[1]),
    83: (CTB, 'CPC 00 — Estrutura Conceitual', BK[4]),
    84: (CTB, 'Regime de Competência - Receita a Receber', BK[1]),
    85: (CTB, 'Apuração do Resultado', BK[1]),
    86: (CTB, 'Despesas Antecipadas - Regime de Competência', BK[1]),
    87: (CTB, 'DFC — Classificação dos Fluxos de Caixa', BK[3]),
    88: (CTB, 'DVA — Distribuição do Valor Adicionado', BK[3]),
    89: (CP, 'NBC TSP Estrutura Conceitual', BP[2]),
    90: (CP, 'NBC TSP 11 — Apresentação das Demonstrações Contábeis', BP[2]),
    91: (CP, 'LRF — Escrituração das Contas Públicas', BP[4]),
    92: (CP, 'NBC TSP 13 — Informação Orçamentária nas Demonstrações', BP[2]),
    93: (CP, 'RREO — Manual de Demonstrativos Fiscais', BP[4]),
    94: (CP, 'NBC TSP 34 — Custos no Setor Público', BP[2]),
    95: (CTB, 'Análise das Demonstrações — Capacidade de Pagamento', BK[3]),
    96: (CTB, 'Análise Vertical da DRE', BK[3]),
    97: (CTB, 'Análise Horizontal do Balanço', BK[3]),
    98: (CTB, 'Indicadores de Endividamento', BK[3]),
    99: (CTB, 'Índice de Liquidez Imediata', BK[3]),
    100: (CTB, 'Imobilização do Patrimônio Líquido', BK[3]),
}

PROVAS = {
    'sc': ('tcesc.json', 'tcesc_gab.json', SC, 'TCE-SC', 2026, 'TCE-SC-2026',
           'Auditor Fiscal de Controle Externo - Ciências Contábeis'),
    'pa': ('tcepa.json', 'tcepa_gab.json', PA, 'TCE-PA', 2024, 'TCE-PA-2024',
           'Auditor de Controle Externo - Fiscalização/Contabilidade'),
    'go': ('tcego.json', 'tcego_gab.json', GO, 'TCE-GO', 2024, 'TCE-GO-2024',
           'Analista de Controle Externo - Ciências Contábeis'),
}


# rodape/cabecalho de pagina que o parser cola no fim da alternativa E
RODAPE = re.compile(r'\s*(MANHÃ\b|TRIBUNAL DE CONTAS DO ESTADO D[EO] [A-ZÁÍ]{3}|(AUDITOR (FISCAL )?|ANALISTA )DE CONTROLE EXTERNO|TIPO \d+ – PÁGINA|CONHECIMENTOS ESPEC[ÍI]FICOS).*$', re.S)

# tabela que o pdftotext achata numa linha so: remontada em linhas
ENUN_FIX = {
    ('pa', 14): ('Um campeonato de futebol de várzea terminou. A tabela a seguir mostra o número de '
                 'gols marcados e de gols sofridos por cada equipe.\n\n'
                 'Equipe | Gols marcados | Gols sofridos\n'
                 'Ababá | 32 | 21\nBebebé | 29 | 16\nCracracrá | 33 | 42\nDededé | X | 22\n'
                 'Evevé | 21 | 40\nFafafá | 19 | 39\nGigigi | 40 | 33\nHohoho | 29 | 27\n\n'
                 'A quantidade X de gols marcados pelo Dededé foi'),
}


def build(k):
    fq, fg, mapa, inst, ano, pref, cargo = PROVAS[k]
    g = json.load(open(fg))
    out = []
    for q in json.load(open(fq)):
        n = q['numero']
        if n not in mapa:
            continue
        ans = g[str(n)]
        assert ans in 'ABCDE', (k, n, ans)
        area, assunto, bloco = mapa[n]
        rec = make(f'{pref}-Q{n:03d}', inst, ano, cargo, area, assunto,
                        n, q['enunciado'], {a: RODAPE.sub('', v) for a, v in q['alternativas'].items()},
                        ans, bloco)
        if (k, n) in ENUN_FIX:
            rec['enunciado'] = ENUN_FIX[(k, n)]
        out.append(rec)
    return out


if __name__ == '__main__':
    k = sys.argv[1]
    recs = build(k)
    json.dump(recs, open(f'novas_tc{k}.json', 'w'), ensure_ascii=False, indent=1)
    print(k, len(recs), 'questoes')
    for a, c in collections.Counter(r['area'] for r in recs).most_common():
        print(f'  {c:3d}  {a}')
