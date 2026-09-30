#!/usr/bin/env python3
"""SMF-Cuiaba 2016 (FGV) - Auditor Fiscal Tributario da Receita Municipal."""
import json, collections
from common import make

INST, ANO = 'SMF-Cuiabá', 2016
CARGO = 'Auditor Fiscal Tributário da Receita Municipal'

LP, MF, ECO, ADM = ('Língua Portuguesa', 'Matemática Financeira', 'Economia',
                    'Administração Geral e Pública')
DCIV, AUD, CTB, CPU, FIN = ('Direito Civil e Empresarial', 'Auditoria', 'Contabilidade Geral',
                            'Contabilidade Pública', 'Finanças Públicas')
DCON, DADM, DTRI = 'Direito Constitucional', 'Direito Administrativo', 'Direito Tributário'

BMF = {1: '[1] Juros e Taxas (3 aulas)', 2: '[2] Equivalência e Aplicações Financeiras (3 aulas)'}
BEC = {1: '[1] Microeconomia: Fundamentos e Consumidor (3 aulas)',
       2: '[2] Microeconomia: Produção e Estruturas de Mercado (5 aulas)',
       3: '[3] Bem-Estar, Externalidades e Contabilidade Nacional (2 aulas)',
       4: '[4] Macroeconomia: Modelos e Política Econômica (4 aulas)'}
BU = {1: '[1] Fundamentos e Normas Gerais de Auditoria (3 aulas)',
      3: '[3] Relatório, Controle Interno e Situações Especiais (6 aulas)',
      4: '[4] Procedimentos Específicos e Auditoria no Setor Público (5 aulas)'}
BK = {1: '[1] Fundamentos: Patrimônio, Escrituração e Regimes (3 aulas)',
      2: '[2] Balanço Patrimonial (BP) (8 aulas)',
      3: '[3] Demonstrações Complementares e Princípios (5 aulas)',
      4: '[4] CPCs — Pronunciamentos Técnicos (11 aulas)',
      5: '[5] Contabilidade de Custos e Gerencial'}
BC = {1: '[1] Teoria Constitucional e Direitos Fundamentais (5 aulas)',
      3: '[3] Organização do Estado e Administração Pública (2 aulas)',
      4: '[4] Organização dos Poderes (5 aulas)',
      5: '[5] Defesa do Estado, Tributação e Ordem Econômico-Social (5 aulas)'}
BA_ = {3: '[3] Organização Administrativa e Entidades (3 aulas)',
       4: '[4] Agentes Públicos e Licitações/Contratos (4 aulas)',
       5: '[5] Serviços Públicos e Parcerias (2 aulas)',
       6: '[6] Responsabilidade, Controle e Improbidade (3 aulas)',
       7: '[7] Bens Públicos e Intervenção na Propriedade (2 aulas)'}
BT = {1: '[1] Sistema Tributário Nacional: Conceitos e Princípios (5 aulas)',
      2: '[2] Obrigação e Crédito Tributário (7 aulas)',
      3: '[3] Administração Tributária e Tributos em Espécie (4 aulas)'}
BP = {1: '[1] MCASP — Procedimentos e Plano de Contas (7 aulas)',
      2: '[2] NBC TSP — Normas Vigentes (3 aulas)',
      3: '[3] Balanços e Demonstrações Contábeis (Lei 4.320/64) (6 aulas)',
      4: '[4] LRF e Princípios Aplicados ao Setor Público (3 aulas)'}
BF = {1: '[1] Orçamento Público: Fundamentos e Instrumentos (3 aulas)',
      2: '[2] Ciclo Orçamentário, Créditos e Classificações (3 aulas)',
      4: '[4] Lei de Responsabilidade Fiscal (LRF) (4 aulas)'}

P1 = {
    1: (LP, 'Interpretação de Texto', ''), 2: (LP, 'Interpretação de Texto', ''),
    3: (LP, 'Interpretação de Texto', ''), 4: (LP, 'Interpretação de Texto', ''),
    5: (LP, 'Interpretação de Texto', ''), 6: (LP, 'Morfologia - Preposições', ''),
    7: (LP, 'Morfossintaxe - Forma Nominal', ''), 8: (LP, 'Interpretação de Texto', ''),
    9: (LP, 'Sintaxe - Ordem Direta', ''), 10: (LP, 'Semântica - Valor das Preposições', ''),
    11: (LP, 'Morfossintaxe - Forma Nominal', ''),
    12: (LP, 'Interpretação de Texto - Coesão e Coerência', ''),
    13: (MF, 'Operações de Desconto', BMF[2]), 14: (MF, 'Operações de Desconto', BMF[2]),
    15: (MF, 'Taxas', BMF[1]), 16: (MF, 'Juros Compostos', BMF[1]),
    17: (MF, 'Sistemas de Amortização', BMF[2]), 18: (MF, 'Análise de Investimentos', BMF[2]),
    19: (MF, 'Operações de Desconto', BMF[2]), 20: (MF, 'Análise de Investimentos', BMF[2]),
    21: (MF, 'Juros Compostos', BMF[1]), 22: (MF, 'Inflação e Correção Monetária', BMF[1]),
    23: (DCIV, 'Direito Civil - Obrigações de Dar Coisa Certa', ''),
    24: (DCIV, 'Direito Empresarial - Sociedade em Comum', ''),
    25: (DCIV, 'Direito Civil - Associações e Representação', ''),
    26: (DCIV, 'Direito Civil - Bem de Família', ''),
    27: (DCIV, 'Direito Civil - Doação com Cláusulas Restritivas', ''),
    28: (DCIV, 'Direito Civil - Contratos', ''),
    29: (DCIV, 'Direito Civil - Doação Condicional (Propter Nuptias)', ''),
    30: (DCIV, 'Direito Civil - Responsabilidade Civil', ''),
    31: (DCIV, 'Direito Empresarial - Recuperação Judicial', ''),
    32: (DCIV, 'Direito Empresarial - Títulos de Crédito', ''),
    33: (DCIV, 'Direito Empresarial - Falência e Alienação do Estabelecimento', ''),
    34: (DCIV, 'Direito Empresarial - Trespasse e Sucessão Empresarial', ''),
    35: (DCIV, 'Direito Empresarial - Cédula de Crédito Bancário', ''),
    36: (DCIV, 'Direito Empresarial - Constituição da Companhia', ''),
    37: (DCIV, 'Direito Empresarial - Cheque', ''),
    38: (DCIV, 'Direito Empresarial - Sociedade Simples', ''),
    39: (DCIV, 'Direito Empresarial - Desconsideração da Personalidade Jurídica', ''),
    40: (DCIV, 'Direito Empresarial - Microempresa e EPP', ''),
    41: (ECO, 'Microeconomia: Teoria do Consumidor', BEC[1]),
    42: (ECO, 'Microeconomia: Teoria do Consumidor', BEC[1]),
    43: (ECO, 'Teoria dos Mercados: Concorrência Perfeita', BEC[2]),
    44: (ECO, 'Modelo IS-LM e Políticas Fiscal e Monetária', BEC[4]),
    45: (ADM, 'Cultura Organizacional', ''),
    46: (ADM, 'Comportamento Organizacional - Grupos e Conflitos', ''),
    47: (ADM, 'Gestão da Qualidade - Postulados de Deming', ''),
    48: (CTB, 'Análise das Demonstrações Contábeis - Índices de Liquidez', BK[3]),
    49: (ECO, 'Sistema Monetário e Mercado Financeiro', BEC[4]),
    50: (MF, 'Análise de Investimentos', BMF[2]),
    51: (AUD, 'Conceitos Iniciais de Auditoria (NBC TA 200)', BU[1]),
    52: (AUD, 'Conceitos Iniciais de Auditoria (NBC TA 200)', BU[1]),
    53: (AUD, 'Planejamento e Documentação (NBC TA 300/230)', BU[1]),
    54: (AUD, 'Conceitos Iniciais de Auditoria (NBC TA 200)', BU[1]),
    55: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU[1]),
    56: (AUD, 'Procedimentos em Áreas Específicas das DCs — Parte I', BU[4]),
    57: (AUD, 'Planejamento e Documentação (NBC TA 300/230)', BU[1]),
    58: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU[1]),
    59: (AUD, 'Continuidade, Estimativas e Eventos Subsequentes (NBC TA 540/550/560/570)', BU[3]),
    60: (AUD, 'Auditoria Interna (NBC TI 01)', BU[3]),
    61: (CTB, 'CPC 00 — Estrutura Conceitual', BK[4]),
    62: (CTB, 'CPC 32 — Tributos sobre o Lucro', BK[4]),
    63: (CTB, 'Contabilidade de Custos — Custeio por Absorção', BK[5]),
    64: (CTB, 'BP — Operações Diversas', BK[2]),
    65: (CTB, 'CPC 18 — Equivalência Patrimonial', BK[4]),
    66: (CTB, 'Demonstração do Resultado (DRE)', BK[3]),
    67: (CTB, 'Patrimônio: Equação, Atos/Fatos, Contas', BK[1]),
    68: (CTB, 'CPC 04 — Intangível', BK[4]),
    69: (CTB, 'BP — Ativo Não Circulante (ANC)', BK[2]),
    70: (CTB, 'BP — Ativo Circulante (AC)', BK[2]),
}

P2 = {
    1: (DCON, 'Ordem Social', BC[5]),
    2: (DCON, 'Poder Executivo', BC[4]),
    3: (DCON, 'Orçamento e Finanças', BC[5]),
    4: (DCON, 'Poder Executivo', BC[4]),
    5: (DCON, 'Processo Legislativo', BC[4]),
    6: (DCON, 'Organização do Estado (Art. 18 a 36)', BC[3]),
    7: (DCON, 'Direitos e Deveres Individuais e Coletivos II', BC[1]),
    8: (DCON, 'Funções Essenciais à Justiça', BC[4]),
    9: (DCON, 'Administração Pública', BC[3]),
    10: (DCON, 'Teoria da Constituição e Poder Constituinte', BC[1]),
    11: (DADM, 'Agentes Públicos', BA_[4]),
    12: (DADM, 'Controle da Administração Pública', BA_[6]),
    13: (DADM, 'Bens Públicos', BA_[7]),
    14: (DADM, 'Agentes Públicos', BA_[4]),
    15: (DADM, 'Organização Administrativa', BA_[3]),
    16: (DADM, 'Controle da Administração Pública', BA_[6]),
    17: (DADM, 'Entidades Paraestatais e Parcerias (Lei 13.019/2014)', BA_[5]),
    18: (DADM, 'Intervenção na Propriedade', BA_[7]),
    # 19: anulada
    20: (DADM, 'Execução de Contrato Administrativo', BA_[4]),
    21: (DTRI, 'Competência Tributária', BT[1]),
    22: (DTRI, 'Suspensão da Exigibilidade do Crédito Tributário', BT[2]),
    23: (FIN, 'Orçamento Público: Conceito, Técnicas e Natureza Jurídica', BF[1]),
    24: (DTRI, 'Tributos de Competência da União', BT[3]),
    25: (DTRI, 'Legislação Tributária', BT[1]),
    26: (DTRI, 'Obrigação Tributária', BT[2]),
    27: (FIN, 'LRF Parte II: Despesa Pública, DOCC e Despesas com Pessoal', BF[4]),
    28: (DTRI, 'Responsabilidade Tributária', BT[2]),
    29: (DTRI, 'Garantias e Privilégios do Crédito Tributário', BT[2]),
    30: (DTRI, 'Imunidades Tributárias', BT[1]),
    31: (DTRI, 'Tributos de Competência da União', BT[3]),
    32: (DTRI, 'Tributos de Competência dos Estados', BT[3]),
    33: (DTRI, 'Crédito Tributário: Constituição e Lançamento', BT[2]),
    34: (DTRI, 'Conceito, Espécies e Classificação dos Tributos', BT[1]),
    35: (FIN, 'Orçamento Público: Conceito, Técnicas e Natureza Jurídica', BF[1]),
    36: (CPU, 'MCASP: Proc. Patrimoniais (I)', BP[1]),
    37: (CPU, 'Balanço Orçamentário', BP[3]),
    38: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]),
    39: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]),
    40: (CPU, 'MCASP: Plano de Contas (PCASP)', BP[1]),
    41: (CPU, 'MCASP: Proc. Orçamentários (I)', BP[1]),
    42: (CPU, 'LRF (I): RREO e RGF', BP[4]),
    43: (FIN, 'O Orçamento Público no Brasil: PPA, LDO e LOA', BF[1]),
    44: (ECO, 'Tributação e Incidência Tributária', BEC[3]),
    45: (ECO, 'Bens Públicos, Bem-Estar Social e Meio Ambiente', BEC[3]),
    46: (ECO, 'Macroeconomia', BEC[4]),
    47: (ECO, 'Macroeconomia', BEC[4]),
    48: (FIN, 'O Orçamento Público no Brasil: PPA, LDO e LOA', BF[1]),
    49: (FIN, 'LRF Parte I: Introdução, Disposições Preliminares e Planejamento', BF[4]),
    50: (FIN, 'Créditos Ordinários e Adicionais', BF[2]),
    # 51-70: legislacao tributaria do Municipio de Cuiaba (LOMC/CTM) -> excluidas
}


def build():
    g = json.load(open('cb_gab.json'))
    out = []
    for src, mapa, gi, tag in [('cb_m.json', P1, 0, 'P1'), ('cb_t.json', P2, 4, 'P2')]:
        gg = g[gi]['resp']
        for q in json.load(open(src)):
            n = q['numero']
            if n not in mapa:
                continue
            ans = gg[str(n)]
            assert ans in 'ABCDE', (tag, n, ans)
            area, assunto, bloco = mapa[n]
            out.append(make(f'{INST}-{ANO}-{tag}-Q{n:03d}', INST, ANO, CARGO, area, assunto,
                            n, q['enunciado'], q['alternativas'], ans, bloco))
    return out


if __name__ == '__main__':
    recs = build()
    json.dump(recs, open('novas_cb.json', 'w'), ensure_ascii=False, indent=1)
    print(len(recs), 'questoes')
    for a, c in collections.Counter(r['area'] for r in recs).most_common():
        print(f'  {c:3d}  {a}')
