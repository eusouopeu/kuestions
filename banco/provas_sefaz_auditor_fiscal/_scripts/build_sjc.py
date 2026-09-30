#!/usr/bin/env python3
"""Prefeitura de Sao Jose dos Campos 2024 (FGV) - Auditor Tributario Municipal."""
import json, collections
from common import make

INST, ANO = 'SJC-São José dos Campos', 2024
CARGO = 'Auditor Tributário Municipal'

LP, INF, AUD, CTB = ('Língua Portuguesa', 'Noções de Informática', 'Auditoria', 'Contabilidade Geral')
DADM, DCON, DCIV, DTRI, DPRE = ('Direito Administrativo', 'Direito Constitucional',
                                'Direito Civil e Empresarial', 'Direito Tributário',
                                'Direito Previdenciário')

BC = {2: '[2] Nacionalidade e Direitos Políticos (3 aulas)',
      3: '[3] Organização do Estado e Administração Pública (2 aulas)',
      4: '[4] Organização dos Poderes (5 aulas)',
      5: '[5] Defesa do Estado, Tributação e Ordem Econômico-Social (5 aulas)'}
BA_ = {1: '[1] Fundamentos e Poderes Administrativos (3 aulas)',
       4: '[4] Agentes Públicos e Licitações/Contratos (4 aulas)',
       5: '[5] Serviços Públicos e Parcerias (2 aulas)',
       7: '[7] Bens Públicos e Intervenção na Propriedade (2 aulas)'}
BT = {1: '[1] Sistema Tributário Nacional: Conceitos e Princípios (5 aulas)',
      2: '[2] Obrigação e Crédito Tributário (7 aulas)',
      3: '[3] Administração Tributária e Tributos em Espécie (4 aulas)'}
BK = {1: '[1] Fundamentos: Patrimônio, Escrituração e Regimes (3 aulas)',
      2: '[2] Balanço Patrimonial (BP) (8 aulas)',
      4: '[4] CPCs — Pronunciamentos Técnicos (11 aulas)'}
BU = {1: '[1] Fundamentos e Normas Gerais de Auditoria (3 aulas)',
      2: '[2] Procedimentos, Evidências e Amostragem (3 aulas)',
      3: '[3] Relatório, Controle Interno e Situações Especiais (6 aulas)',
      4: '[4] Procedimentos Específicos e Auditoria no Setor Público (5 aulas)'}
BI = {2: '[2] Segurança da Informação (3 aulas)',
      3: '[3] Banco de Dados e Modelagem (4 aulas)',
      4: '[4] Business Intelligence e Big Data (3 aulas)',
      5: '[5] Gestão de Processos e Engenharia de Software (3 aulas)',
      7: '[7] Gestão e Governança de TI (2 aulas)'}

MAPA = {
    1: (LP, 'Interpretação de Texto', ''),
    2: (LP, 'Sintaxe', ''),
    3: (LP, 'Morfossintaxe - Substituição do Adjetivo', ''),
    4: (LP, 'Tipologia Textual - Texto Injuntivo', ''),
    5: (LP, 'Pontuação', ''),
    6: (LP, 'Morfologia - Pronomes', ''),
    7: (DCON, 'Poder Legislativo', BC[4]),
    8: (DCON, 'Ordem Social', BC[5]),
    9: (DCON, 'Direitos Políticos', BC[2]),
    10: (DCON, 'Organização do Estado (Art. 18 a 36)', BC[3]),
    11: (DCON, 'Poder Judiciário', BC[4]),
    12: (DCON, 'Processo Legislativo', BC[4]),
    13: (DADM, 'Licitações — Lei 14.133/2021 (Parte I)', BA_[4]),
    14: (DADM, 'Serviços Públicos (Lei 8.987/1995)', BA_[5]),
    15: (DADM, 'Poderes Administrativos', BA_[1]),
    16: (DADM, 'Bens Públicos', BA_[7]),
    17: (DADM, 'Poderes Administrativos', BA_[1]),
    18: (DADM, 'Contrato Administrativo e Convênios', BA_[4]),
    19: (DCIV, 'Direito Empresarial - Incorporação e Sucessão de Obrigações', ''),
    20: (DCIV, 'Direito Civil - Propriedade e Posse', ''),
    21: (DCIV, 'Direito Civil - Regime de Bens', ''),
    22: (DCIV, 'Direito Civil - Capacidade e Curatela', ''),
    23: (DCIV, 'Direito Civil - Contrato de Seguro', ''),
    24: (DCIV, 'Direito Civil - Responsabilidade Civil', ''),
    25: (CTB, 'CPC 00 — Estrutura Conceitual', BK[4]),
    26: (CTB, 'Competência x Caixa; Apuração do Resultado', BK[1]),
    27: (CTB, 'BP — Estoques', BK[2]),
    28: (CTB, 'BP — Estoques', BK[2]),
    29: (CTB, 'BP — Ativo Imobilizado', BK[2]),
    30: (CTB, 'CPC 26 — Apresentação das DCs', BK[4]),
    # 31, 38: anuladas | 34: legislacao municipal de Sao Jose dos Campos
    32: (DTRI, 'Dívida Ativa e Certidão Negativa (CTN)', BT[3]),
    33: (DTRI, 'Tributos de Competência dos Municípios', BT[3]),
    35: (DTRI, 'Princípios Tributários', BT[1]),
    36: (DTRI, 'Responsabilidade Tributária', BT[2]),
    37: (DTRI, 'Administração Tributária e Fiscalização', BT[3]),
    39: (DTRI, 'Competência Tributária', BT[1]),
    40: (DPRE, 'Direito Previdenciário - Salário de Benefício (RGPS)', ''),
    41: (CTB, 'CPC 25 — Provisões e Contingências', BK[4]),
    42: (CTB, 'CPC 23 — Políticas Contábeis, Mudança de Estimativa e Erro', BK[4]),
    43: (CTB, 'CPC 18 — Equivalência Patrimonial', BK[4]),
    44: (CTB, 'CPC — Combinação de Negócios', BK[4]),
    45: (CTB, 'CPC — Combinação de Negócios', BK[4]),
    46: (CTB, 'CPC 27 — Imobilizado', BK[4]),
    47: (CTB, 'CPC 48 — Instrumentos Financeiros', BK[4]),
    48: (CTB, 'CPC 28 — Propriedade para Investimento', BK[4]),
    49: (CTB, 'CPC 04 — Intangível', BK[4]),
    50: (CTB, 'CPC 07 — Subvenção e Assistência Governamentais', BK[4]),
    51: (AUD, 'Amostragem em Auditoria (NBC TA 530)', BU[2]),
    52: (AUD, 'Risco de Amostragem (NBC TA 530)', BU[2]),
    53: (AUD, 'Procedimentos e Evidências de Auditoria (NBC TA 500/505/520)', BU[2]),
    54: (AUD, 'Procedimentos em Áreas Específicas das DCs — Parte I', BU[4]),
    55: (AUD, 'Continuidade, Estimativas e Eventos Subsequentes (NBC TA 540/550/560/570)', BU[3]),
    56: (AUD, 'Procedimentos Analíticos (NBC TA 520)', BU[2]),
    57: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU[1]),
    58: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU[1]),
    59: (AUD, 'Procedimentos em Áreas Específicas das DCs — Parte I', BU[4]),
    60: (AUD, 'Procedimentos em Áreas Específicas das DCs — Parte II', BU[4]),
    61: (INF, 'Modelagem de Dados e SQL', BI[3]),
    62: (INF, 'SQL', BI[3]),
    63: (INF, 'BI: Data Warehouse e Data Mart', BI[4]),
    # 64, 66: anuladas
    65: (INF, 'Big Data', BI[4]),
    67: (INF, 'LGPD', BI[2]),
    68: (INF, 'Cobit 5', BI[7]),
    69: (INF, 'Scrum', BI[5]),
    70: (INF, 'Segurança da Informação - Criptografia', BI[2]),
}


def build():
    g = json.load(open('sjc_gab.json'))
    out = []
    for q in json.load(open('sjc.json')):
        n = q['numero']
        if n not in MAPA:
            continue
        ans = g[str(n)]
        assert ans in 'ABCDE', (n, ans)
        area, assunto, bloco = MAPA[n]
        out.append(make(f'SJC-{ANO}-Q{n:03d}', INST, ANO, CARGO, area, assunto,
                        n, q['enunciado'], q['alternativas'], ans, bloco))
    return out


if __name__ == '__main__':
    recs = build()
    json.dump(recs, open('novas_sjc.json', 'w'), ensure_ascii=False, indent=1)
    print(len(recs), 'questoes')
    for a, c in collections.Counter(r['area'] for r in recs).most_common():
        print(f'  {c:3d}  {a}')
