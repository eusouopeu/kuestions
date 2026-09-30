#!/usr/bin/env python3
"""Monta os registros do SEFAZ-PR 2025 (FGV) para o kuestion_db_1.json."""
import json
from common import make

INST, ANO = 'SEFAZ-PR', 2025
CARGO = 'Auditor Fiscal da Receita Estadual'

LP, MRL, AP, EST, INF = ('Língua Portuguesa', 'Matemática e Raciocínio Lógico',
                         'Administração Pública', 'Estatística', 'Noções de Informática')
DADM, DCIV, DPEN, DCON, DTRI = ('Direito Administrativo', 'Direito Civil e Empresarial',
                                'Direito Penal', 'Direito Constitucional', 'Direito Tributário')
ECO, FIN, CTB, AUD = 'Economia', 'Finanças Públicas', 'Contabilidade Geral', 'Auditoria'

B_INF = {'bi': '[4] Business Intelligence e Big Data (3 aulas)',
         'seg': '[2] Segurança da Informação (3 aulas)',
         'bd': '[3] Banco de Dados e Modelagem (4 aulas)',
         'proc': '[5] Gestão de Processos e Engenharia de Software (3 aulas)',
         'fer': '[6] Ferramentas Corporativas e Web (3 aulas)',
         'gov': '[7] Gestão e Governança de TI (2 aulas)'}
B_DADM = {4: '[4] Agentes Públicos e Licitações/Contratos (4 aulas)',
          6: '[6] Responsabilidade, Controle e Improbidade (3 aulas)'}
B_DCON = {1: '[1] Teoria Constitucional e Direitos Fundamentais (5 aulas)',
          2: '[2] Nacionalidade e Direitos Políticos (3 aulas)',
          3: '[3] Organização do Estado e Administração Pública (2 aulas)',
          4: '[4] Organização dos Poderes (5 aulas)',
          5: '[5] Defesa do Estado, Tributação e Ordem Econômico-Social (5 aulas)'}
B_DTRI = {1: '[1] Sistema Tributário Nacional: Conceitos e Princípios (5 aulas)',
          2: '[2] Obrigação e Crédito Tributário (7 aulas)',
          3: '[3] Administração Tributária e Tributos em Espécie (4 aulas)'}
B_EST = {1: '[1] Estatística Descritiva Univariada (5 aulas)',
         2: '[2] Combinatória e Probabilidade (2 aulas)',
         3: '[3] Variáveis Aleatórias e Distribuições (4 aulas)',
         4: '[4] Inferência Estatística (4 aulas)'}
B_CTB = {1: '[1] Fundamentos: Patrimônio, Escrituração e Regimes (3 aulas)',
         2: '[2] Balanço Patrimonial (BP) (8 aulas)',
         3: '[3] Demonstrações Complementares e Princípios (5 aulas)',
         4: '[4] CPCs — Pronunciamentos Técnicos (11 aulas)',
         5: '[5] Contabilidade de Custos e Gerencial'}
B_ECO = {1: '[1] Microeconomia: Fundamentos e Consumidor (3 aulas)',
         2: '[2] Microeconomia: Produção e Estruturas de Mercado (5 aulas)',
         3: '[3] Bem-Estar, Externalidades e Contabilidade Nacional (2 aulas)',
         4: '[4] Macroeconomia: Modelos e Política Econômica (4 aulas)'}
B_FIN = {3: '[3] Receita e Despesa Pública (3 aulas)',
         4: '[4] Lei de Responsabilidade Fiscal (LRF) (4 aulas)'}

# numero -> (area, assunto, bloco).  Ausente = excluida.
P1 = {
    1: (LP, 'Interpretação de Texto - Narrativa', ''),
    2: (LP, 'Coesão Textual - Referenciação', ''),
    3: (LP, 'Interpretação de Texto', ''),
    4: (LP, 'Interpretação de Texto - Argumentação', ''),
    5: (LP, 'Interpretação de Texto - Crítica Social', ''),
    6: (LP, 'Interpretação de Texto', ''),
    7: (LP, 'Interpretação de Texto', ''),
    8: (LP, 'Sintaxe - Coordenação e Subordinação', ''),
    9: (LP, 'Interpretação de Texto - Argumentação', ''),
    10: (LP, 'Interpretação de Texto', ''),
    11: (MRL, 'Razão e Proporção', ''),
    12: (MRL, 'Porcentagem', ''),
    13: (MRL, 'Lógica Proposicional', ''),
    14: (MRL, 'Raciocínio Lógico-Matemático', ''),
    15: (MRL, 'Raciocínio Lógico-Matemático', ''),
    16: (MRL, 'Geometria Plana', ''),
    17: (MRL, 'Progressão Aritmética', ''),
    18: (MRL, 'Raciocínio Lógico — Combinatória', ''),
    19: (MRL, 'Raciocínio Lógico — Combinatória', ''),
    20: (MRL, 'Raciocínio Lógico-Matemático', ''),
    21: (AP, 'Modelos de Administração Pública (Patrimonialista, Burocrático, Gerencial)', ''),
    22: (AP, 'Ciclo de Políticas Públicas', ''),
    23: (AP, 'Gestão e Governança no Setor Público', ''),
    24: (AP, 'Gestão e Governança no Setor Público', ''),
    25: (AP, 'Governo Eletrônico (e-Gov)', ''),
    26: (AP, 'Gestão da Integridade Pública', ''),
    27: (EST, 'Medidas de Posição: Médias', B_EST[1]),
    28: (EST, 'Coeficiente de Variação', B_EST[1]),
    29: (EST, 'Probabilidade', B_EST[2]),
    30: (EST, 'Variáveis Aleatórias e Distribuições', B_EST[3]),
    31: (INF, 'BI — Transformação de Dados (ETL)', B_INF['bi']),
    32: (INF, 'Análise de Dados - Clustering', B_INF['bi']),
    33: (INF, 'Análise de Dados - Visualização e Outliers', B_INF['bi']),
    34: (INF, 'Análise de Dados - Qualidade e Limpeza de Dados', B_INF['bi']),
    35: (INF, 'Análise de Dados - Correlação', B_INF['bi']),
    36: (INF, 'Business Intelligence - Conceitos', B_INF['bi']),
    37: (DADM, 'Responsabilidade Civil do Estado', B_DADM[6]),
    38: (DADM, 'Licitações — Lei 14.133/2021 (Parte I)', B_DADM[4]),
    39: (INF, 'LGPD', B_INF['seg']),
    # 40, 41, 44: legislacao estadual do PR -> excluidas
    42: (INF, 'Gestão e Governança de TI — Contratação de Software (Sisp)', B_INF['gov']),
    43: (DADM, 'Lei Anticorrupção (Lei 12.846/2013)', B_DADM[6]),
    # 45: anulada
    46: (DCIV, 'Direito Civil - Regime de Bens e Outorga Conjugal', ''),
    47: (DCIV, 'Direito Empresarial - Escrituração Contábil Obrigatória', ''),
    48: (DCIV, 'Direito Empresarial - Recuperação Judicial', ''),
    49: (DCIV, 'Direito Empresarial - Sociedade Cooperativa', ''),
    50: (DPEN, 'Direito Penal - Falsificação de Documento Público', ''),
    51: (DPEN, 'Direito Penal - Desistência Voluntária e Arrependimento Eficaz', ''),
    52: (DCON, 'Direitos Sociais', B_DCON[1]),
    53: (DCON, 'Funções Essenciais à Justiça', B_DCON[4]),
    54: (DCON, 'Organização do Estado (Art. 18 a 36)', B_DCON[3]),
    55: (DCON, 'Nacionalidade', B_DCON[2]),
    56: (DCON, 'Processo Legislativo', B_DCON[4]),
    57: (DCON, 'Orçamento e Finanças', B_DCON[5]),
    58: (DCON, 'Medida Provisória', B_DCON[4]),
    59: (DCON, 'Sistema Tributário Nacional', B_DCON[5]),
    60: (DCON, 'Emenda Constitucional — Efeitos nos Estados', B_DCON[1]),
    # 61-70: Legislacao Tributaria estadual (ICMS/IPVA/ITCMD/PAF-PR) -> excluidas
    71: (DTRI, 'Competência Tributária', B_DTRI[1]),
    72: (DTRI, 'Princípios Tributários', B_DTRI[1]),
    73: (DTRI, 'Legislação Tributária', B_DTRI[1]),
    74: (DTRI, 'Responsabilidade Tributária', B_DTRI[2]),
    75: (DTRI, 'Taxas — Base de Cálculo', B_DTRI[1]),
    76: (DTRI, 'Administração Tributária e Fiscalização', B_DTRI[3]),
    77: (DTRI, 'Legislação Tributária', B_DTRI[1]),
    78: (DTRI, 'Crédito Tributário: Constituição e Lançamento', B_DTRI[2]),
    79: (DTRI, 'Obrigação Tributária', B_DTRI[2]),
    80: (DTRI, 'Suspensão da Exigibilidade do Crédito Tributário', B_DTRI[2]),
}

P2 = {
    1: (ECO, 'Microeconomia: Teoria do Consumidor', B_ECO[1]),
    2: (ECO, 'Teoria dos Mercados: Concorrência Perfeita', B_ECO[2]),
    3: (ECO, 'Economia Comportamental', B_ECO[1]),
    4: (ECO, 'Macroeconomia: Contabilidade Nacional', B_ECO[3]),
    5: (ECO, 'Modelo IS-LM e Políticas Fiscal e Monetária', B_ECO[4]),
    6: (ECO, 'Macroeconomia', B_ECO[4]),
    7: (FIN, 'Indicadores de Endividamento Público', B_FIN[4]),
    8: (FIN, 'Federalismo Fiscal e Descentralização', B_FIN[3]),
    9: (FIN, 'Tributação Ótima', B_FIN[3]),
    10: (FIN, 'Renúncia de Receita e Incentivos Fiscais', B_FIN[4]),
    11: (CTB, 'Demonstrações Complementares - Conversão de demonstrações em moeda estrangeira', B_CTB[3]),
    12: (CTB, 'CPC 12 — Ajuste a Valor Presente', B_CTB[4]),
    13: (CTB, 'BP — Ativo Imobilizado', B_CTB[2]),
    14: (CTB, 'BP — PL, Parte I', B_CTB[2]),
    15: (CTB, 'CPC 47 — Receita de Contrato', B_CTB[4]),
    16: (CTB, 'Demonstração do Resultado (DRE)', B_CTB[3]),
    17: (CTB, 'CPC 47 — Receita de Contrato', B_CTB[4]),
    18: (CTB, 'CPC 25 — Provisões e Contingências', B_CTB[4]),
    19: (CTB, 'CPC 23 — Políticas Contábeis, Mudança de Estimativa e Erro', B_CTB[4]),
    20: (CTB, 'CPC 18 — Equivalência Patrimonial', B_CTB[4]),
    21: (CTB, 'CPC 06 — Arrendamentos', B_CTB[4]),
    22: (CTB, 'CPC 46 — Mensuração do Valor Justo', B_CTB[4]),
    23: (CTB, 'CPC — Combinação de Negócios', B_CTB[4]),
    24: (CTB, 'Contabilidade de Custos', B_CTB[5]),
    25: (CTB, 'Contabilidade de Custos — Custeio por Absorção', B_CTB[5]),
    26: (CTB, 'Contabilidade de Custos', B_CTB[5]),
    27: (CTB, 'Competência x Caixa; Apuração do Resultado', B_CTB[1]),
    28: (INF, 'Nota Fiscal Eletrônica (NF-e)', B_INF['fer']),
    29: (AUD, 'Auditoria Fiscal — Parte I', '[4] Procedimentos Específicos e Auditoria no Setor Público (5 aulas)'),
    30: (CTB, 'Custo de Aquisição — ICMS e IPI', B_CTB[2]),
    31: (CTB, 'BP — Estoques', B_CTB[2]),
    32: (CTB, 'BP — Operações Diversas', B_CTB[2]),
    33: (INF, 'Ferramentas de Produtividade - MS Excel', B_INF['fer']),
    34: (INF, 'Ferramentas de Produtividade - MS Excel', B_INF['fer']),
    35: (INF, 'Ferramentas de Produtividade - MS Excel', B_INF['fer']),
    36: (INF, 'Ferramentas de Produtividade - MS Excel', B_INF['fer']),
    37: (INF, 'Análise de Dados - Dados Ausentes', B_INF['bi']),
    38: (INF, 'Ferramentas de Produtividade - MS Excel', B_INF['fer']),
    39: (EST, 'Testes de Hipóteses', B_EST[4]),
    40: (INF, 'Ferramentas de Produtividade - MS Excel', B_INF['fer']),
    # 41: anulada
    42: (INF, 'Ferramentas de Produtividade - MS Excel', B_INF['fer']),
    43: (INF, 'Ferramentas de Produtividade - MS Excel', B_INF['fer']),
    44: (INF, 'SQL', B_INF['bd']),
    45: (INF, 'Ferramentas Corporativas - Automação (RPA)', B_INF['fer']),
    46: (INF, 'SQL', B_INF['bd']),
    47: (INF, 'Lógica de Programação - Pseudocódigo', B_INF['proc']),
    48: (MRL, 'Raciocínio Lógico-Matemático', ''),
    49: (INF, 'Lógica de Programação - Pseudocódigo', B_INF['proc']),
    50: (INF, 'SQL', B_INF['bd']),
}


def build():
    gab = json.load(open('pr_gab.json'))
    g1 = gab['Auditor Fiscal (Manhã) - 1 - Turno Manhã']
    g2 = gab['Auditor Fiscal - 1 - Turno Tarde']
    out = []
    for src, mapa, g, tag in [('pr_p1.json', P1, g1, 'P1'), ('pr_p2.json', P2, g2, 'P2')]:
        for q in json.load(open(src)):
            n = q['numero']
            if n not in mapa:
                continue
            ans = g[str(n)]
            assert ans in 'ABCDE', (tag, n, ans)
            area, assunto, bloco = mapa[n]
            out.append(make(f'{INST}-{ANO}-{tag}-Q{n:03d}', INST, ANO, CARGO, area, assunto,
                            n, q['enunciado'], q['alternativas'], ans, bloco))
    return out


if __name__ == '__main__':
    recs = build()
    json.dump(recs, open('novas_pr.json', 'w'), ensure_ascii=False, indent=1)
    import collections
    print(len(recs), 'questoes')
    for a, c in collections.Counter(r['area'] for r in recs).most_common():
        print(f'  {c:3d}  {a}')
