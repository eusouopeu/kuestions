#!/usr/bin/env python3
"""SEFAZ-BA 2022 (FGV) - Agente de Tributos Estaduais / Administracao Tributaria."""
import json, collections
from common import make

INST, ANO = 'SEFAZ-BA', 2022
CARGO = 'Agente de Tributos Estaduais - Administração Tributária'

LP, MRL, EST, INF = ('Língua Portuguesa', 'Matemática e Raciocínio Lógico',
                     'Estatística', 'Noções de Informática')
DADM, DCON, DTRI, CTB = ('Direito Administrativo', 'Direito Constitucional',
                         'Direito Tributário', 'Contabilidade Geral')

BC = {1: '[1] Teoria Constitucional e Direitos Fundamentais (5 aulas)',
      2: '[2] Nacionalidade e Direitos Políticos (3 aulas)',
      3: '[3] Organização do Estado e Administração Pública (2 aulas)'}
BA_ = {3: '[3] Organização Administrativa e Entidades (3 aulas)',
       4: '[4] Agentes Públicos e Licitações/Contratos (4 aulas)',
       5: '[5] Serviços Públicos e Parcerias (2 aulas)',
       6: '[6] Responsabilidade, Controle e Improbidade (3 aulas)'}
BT = {1: '[1] Sistema Tributário Nacional: Conceitos e Princípios (5 aulas)',
      2: '[2] Obrigação e Crédito Tributário (7 aulas)',
      3: '[3] Administração Tributária e Tributos em Espécie (4 aulas)',
      4: '[4] Reforma Tributária e Regimes Especiais (4 aulas)'}
BCT = '[4] CPCs — Pronunciamentos Técnicos (11 aulas)'
BE = {3: '[3] Variáveis Aleatórias e Distribuições (4 aulas)',
      4: '[4] Inferência Estatística (4 aulas)'}
BI = {2: '[2] Segurança da Informação (3 aulas)',
      3: '[3] Banco de Dados e Modelagem (4 aulas)',
      5: '[5] Gestão de Processos e Engenharia de Software (3 aulas)',
      6: '[6] Ferramentas Corporativas e Web (3 aulas)'}

MAPA = {
    1: (LP, 'Interpretação e Argumentação', ''),
    2: (LP, 'Interpretação e Argumentação', ''),
    3: (LP, 'Técnicas Argumentativas', ''),
    4: (LP, 'Lógica de Argumentação - Silogismos', ''),
    5: (LP, 'Interpretação de Texto - Descrição', ''),
    6: (LP, 'Morfologia - Preposições', ''),
    7: (LP, 'Sintaxe - Estrutura da Oração', ''),
    8: (DCON, 'Direitos Políticos', BC[2]),
    # 9: anulada
    10: (DCON, 'Organização do Estado (Art. 18 a 36)', BC[3]),
    11: (DCON, 'Direitos e Deveres Individuais e Coletivos I', BC[1]),
    12: (DCON, 'Administração Pública', BC[3]),
    13: (DADM, 'Improbidade Administrativa (Lei 8.429/1992)', BA_[6]),
    14: (DADM, 'Agentes Públicos', BA_[4]),
    15: (DADM, 'Serviços Públicos (Lei 8.987/1995)', BA_[5]),
    16: (DADM, 'Organização Administrativa', BA_[3]),
    17: (DADM, 'Controle da Administração Pública', BA_[6]),
    18: (DTRI, 'Tributos de Competência dos Estados', BT[3]),
    19: (DTRI, 'Tributos de Competência dos Estados', BT[3]),
    # 20: anulada
    21: (DTRI, 'Princípios Tributários', BT[1]),
    22: (DTRI, 'Obrigação Tributária', BT[2]),
    23: (CTB, 'CPC 27 — Imobilizado', BCT),
    24: (CTB, 'CPC 12 — Ajuste a Valor Presente', BCT),
    25: (CTB, 'CPC 25 — Provisões e Contingências', BCT),
    26: (CTB, 'CPC 12 — Ajuste a Valor Presente', BCT),
    27: (CTB, 'CPC 47 — Receita de Contrato', BCT),
    28: (EST, 'Variáveis Aleatórias Discretas', BE[3]),
    29: (EST, 'Teoria da Amostragem', BE[4]),
    30: (EST, 'Variáveis Aleatórias e Distribuições Contínuas', BE[3]),
    31: (EST, 'Estimação Pontual e Intervalar', BE[4]),
    32: (EST, 'Estimação Pontual e Intervalar', BE[4]),
    33: (DCON, 'Discriminação — Direitos Fundamentais', BC[1]),
    34: (DCON, 'Lei Maria da Penha — Direitos Fundamentais', BC[1]),
    35: (DADM, 'Tortura por Agente Público — Efeitos na Função Pública', BA_[4]),
    # 36-40 e 46-60: legislacao tributaria do Estado da Bahia -> excluidas
    41: (DTRI, 'Simples Nacional', BT[4]),
    42: (DTRI, 'Simples Nacional', BT[4]),
    43: (DTRI, 'Simples Nacional', BT[4]),
    44: (DTRI, 'Simples Nacional', BT[4]),
    45: (DTRI, 'Simples Nacional', BT[4]),
    61: (INF, 'SQL', BI[3]),
    62: (INF, 'Segurança da Informação - Criptografia', BI[2]),
    63: (INF, 'Hardware - Tipos de Memória', ''),
    64: (INF, 'Ferramentas Corporativas - Padrões PDF (ISO)', BI[6]),
    65: (INF, 'Gerência de Projetos (PMBOK 6ª ed.)', BI[5]),
    66: (MRL, 'Lógica Proposicional', ''),
    67: (MRL, 'Probabilidade', ''),
    68: (MRL, 'Razão e Proporção', ''),
    69: (MRL, 'Raciocínio Lógico-Matemático', ''),
    70: (MRL, 'Razão e Proporção', ''),
}


def build():
    g = json.load(open('ba_gab.json'))[4]['resp']       # Administracao Tributaria - Tipo 1
    out = []
    for q in json.load(open('ba_trib.json')):
        n = q['numero']
        if n not in MAPA:
            continue
        ans = g[str(n)]
        assert ans in 'ABCDE', (n, ans)
        area, assunto, bloco = MAPA[n]
        out.append(make(f'{INST}-{ANO}-Q{n:03d}', INST, ANO, CARGO, area, assunto,
                        n, q['enunciado'], q['alternativas'], ans, bloco))
    return out


if __name__ == '__main__':
    recs = build()
    json.dump(recs, open('novas_ba.json', 'w'), ensure_ascii=False, indent=1)
    print(len(recs), 'questoes')
    for a, c in collections.Counter(r['area'] for r in recs).most_common():
        print(f'  {c:3d}  {a}')
