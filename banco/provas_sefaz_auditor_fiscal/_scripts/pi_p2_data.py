# -*- coding: utf-8 -*-
"""SEFAZ-PI 2025 (FCC) - P2 Conhecimentos Especificos, transcrita das imagens do caderno Tipo 002.
Excluidas: 16-40 (Legislacao Tributaria Estadual do Piaui)."""

DT, CTB, CPU, AUD = 'Direito Tributário', 'Contabilidade Geral', 'Contabilidade Pública', 'Auditoria'
BT1 = '[1] Sistema Tributário Nacional: Conceitos e Princípios (5 aulas)'
BT2 = '[2] Obrigação e Crédito Tributário (7 aulas)'
BT3 = '[3] Administração Tributária e Tributos em Espécie (4 aulas)'
BT4 = '[4] Reforma Tributária e Regimes Especiais (4 aulas)'
BK1 = '[1] Fundamentos: Patrimônio, Escrituração e Regimes (3 aulas)'
BK2 = '[2] Balanço Patrimonial (BP) (8 aulas)'
BK3 = '[3] Demonstrações Complementares e Princípios (5 aulas)'
BK4 = '[4] CPCs — Pronunciamentos Técnicos (11 aulas)'
BP2 = '[2] NBC TSP — Normas Vigentes (3 aulas)'
BU1 = '[1] Fundamentos e Normas Gerais de Auditoria (3 aulas)'
BU2 = '[2] Procedimentos, Evidências e Amostragem (3 aulas)'
BU3 = '[3] Relatório, Controle Interno e Situações Especiais (6 aulas)'
BU4 = '[4] Procedimentos Específicos e Auditoria no Setor Público (5 aulas)'

CTX = {
    'eq': ('Um equipamento industrial foi adquirido pela empresa Equipamentos Pesados S.A., em 1/1/2020, pelo valor de '
           'R$ 20.400.000,00. A empresa efetuou o pagamento à vista, definiu a vida útil para o equipamento em 20 anos e '
           'estimou o valor residual para sua venda, no final do prazo de utilização, em R$ 1.200.000,00. No final do ano '
           'de 2020, a empresa redefiniu a vida útil remanescente para 15 anos e o novo valor residual estimado no final '
           'deste novo prazo de utilização para R$ 1.440.000,00. A empresa adota o método das cotas constantes para '
           'cálculo da despesa de depreciação e a revisão do prazo de vida útil ocorreu em função da análise da condição '
           'de uso do equipamento.'),
    'int': ('A empresa Invenções Nacionais S.A. apresentava, no Balanço Patrimonial de 31/12/2020, um ativo intangível com '
            'vida útil indefinida registrado no subgrupo Intangíveis do Ativo não Circulante. O ativo não corresponde a '
            'ágio pago por expectativa de resultados futuros e o seu saldo contábil era composto dos seguintes valores:\n\n'
            '• Custo de aquisição: R$ 3.800.000,00\n'
            '• (−) Perda por desvalorização (impairment): R$ (800.000,00)\n'
            '• (=) Saldo contábil: R$ 3.000.000,00\n\n'
            'Em 31/12/2021 a empresa identificou as seguintes informações sobre esse ativo intangível, com os valores '
            'expressos em reais:\n\n'
            '• Valor em uso: R$ 4.000.000,00\n'
            '• Valor justo líquido das despesas de venda: R$ 2.800.000,00'),
    'dfc': ('As demonstrações contábeis da empresa Importação de Produtos Cosméticos S.A. são apresentadas a seguir.\n\n'
            'Balanços Patrimoniais (valores em 31/12/2022 | 31/12/2023):\n\n'
            'ATIVO\n'
            '• Ativo circulante: 2.376.000,00 | 5.238.000,00\n'
            '• Caixa e Equivalentes de Caixa: 180.000,00 | 1.746.000,00\n'
            '• Valores a Receber de Clientes: 1.008.000,00 | 1.764.000,00\n'
            '• (−) Perdas Estimadas com Clientes: – | (36.000,00)\n'
            '• Estoques: 1.188.000,00 | 1.764.000,00\n'
            '• Ativo não circulante: 2.592.000,00 | 3.024.000,00\n'
            '• Investimentos – Participações Societárias: 252.000,00 | 638.000,00\n'
            '• Imobilizado – Veículos: 1.512.000,00 | 2.386.000,00\n'
            '• Imobilizado – Terrenos: 828.000,00 | –\n'
            '• TOTAL DO ATIVO: 4.968.000,00 | 8.262.000,00\n\n'
            'PASSIVO\n'
            '• Passivo circulante: 2.808.000,00 | 4.755.514,00\n'
            '• Fornecedores: 1.188.000,00 | 1.177.200,00\n'
            '• Dividendos a Pagar: – | 34.474,00\n'
            '• IRPJ e CSSL a pagar: – | 51.840,00\n'
            '• Empréstimos: 1.620.000,00 | 3.492.000,00\n'
            '• Passivo não circulante: – | 360.000,00\n'
            '• Provisão Riscos Fiscais: – | 360.000,00\n'
            '• Patrimônio Líquido: 2.160.000,00 | 3.146.486,00\n'
            '• Capital: 1.800.000,00 | 2.700.000,00\n'
            '• Reservas de Lucros: 360.000,00 | 446.486,00\n'
            '• TOTAL DO PASSIVO + PL: 4.968.000,00 | 8.262.000,00\n\n'
            'Demonstração do Resultado – período de 1/1/2023 a 31/12/2023:\n\n'
            '• Receitas de Vendas: 7.344.000,00\n'
            '• (−) Custo dos Produtos Vendidos: (4.680.000,00)\n'
            '• (=) Resultado com Mercadorias: 2.664.000,00\n'
            '• (−) Despesas Operacionais: (2.419.200,00), sendo Perdas Estimadas com Clientes (36.000,00), Depreciação '
            '(216.000,00), Despesa com Provisão (360.000,00) e Outras despesas operacionais (1.807.200,00)\n'
            '• (+) Outras Receitas e Despesas: Resultado de Equivalência Patrimonial 108.000,00; (−) Despesas Financeiras '
            '(432.000,00); Lucro na Venda de Terrenos 252.000,00\n'
            '• (=) Resultado antes dos impostos: 172.800,00\n'
            '• (−) Despesa com IRPJ e CSSL: (51.840,00)\n'
            '• (=) Resultado Líquido: 120.960,00\n\n'
            'No ano de 2023, a empresa não efetuou qualquer pagamento relacionado com os empréstimos, não vendeu '
            'participações societárias nem veículos, e o aumento de Capital ocorreu com a emissão de novas ações.'),
    'dva': ('A empresa Produtos Sustentáveis S.A. apresentou a Demonstração do Resultado do ano de 2023, com os seguintes '
            'valores:\n\n'
            '• Receita Bruta de Vendas: 6.240.000,00\n'
            '• (−) Impostos sobre vendas: (1.680.000,00)\n'
            '• (=) Receita Líquida: 4.560.000,00\n'
            '• (−) Custo das Mercadorias Vendidas: (2.640.000,00)\n'
            '• (=) Lucro Bruto: 1.920.000,00\n'
            '• (−) Despesas operacionais: despesa de depreciação (200.000,00); despesas com salários (160.000,00); INSS '
            'sobre salários – parcela da empresa (40.000,00); despesa com FGTS (16.000,00); despesas com aluguel (50.000,00)\n'
            '• (=) Lucro antes de Impostos: 1.454.000,00\n'
            '• (−) IR e CSLL: (436.200,00)\n'
            '• (=) Lucro Líquido: 1.017.800,00\n\n'
            'O valor dos tributos recuperáveis, referentes aos produtos que foram vendidos no ano de 2023, foi '
            'R$ 396.000,00 e nas despesas com salários está incluído o valor de R$ 25.000,00 correspondente ao INSS de '
            'contribuição dos funcionários.'),
    'est': ('As informações a seguir referem-se à compra de mercadorias pela empresa Produtos Essenciais S.A., sendo que '
            'os valores estão expressos em reais:\n\n'
            '• Data da compra: 20/10/2023\n'
            '• Valor pago à empresa vendedora das mercadorias: 1.155.000,00\n'
            '• Valor pago pelo transporte das mercadorias do depósito da empresa vendedora até seu depósito: 50.000,00\n'
            '• Valor pago à seguradora para garantir que as mercadorias chegassem em ordem ao seu depósito: 30.000,00\n\n'
            'Com relação aos impostos incluídos nos valores pagos pela empresa são conhecidas as seguintes informações:\n\n'
            '• Tributos recuperáveis incluídos no valor de 110.000,00\n'
            '• Tributos não recuperáveis incluídos no valor de 48.000,00\n\n'
            'No dia 1/12/2023, a empresa efetuou uma venda nas seguintes condições:\n\n'
            '• Quantidade vendida: 80% do total que havia sido comprado em 20/10/2023\n'
            '• Valor total da venda: 1.500.000,00, sendo 60% à vista e 40% a prazo\n'
            '• Prazo para pagamento da venda a prazo: 18 meses em uma única parcela no final do prazo\n'
            '• Comissão paga para seus vendedores: 13.500,00\n'
            '• Valor pago para a transportadora que fez a entrega das mercadorias vendidas: 21.000,00\n\n'
            'A taxa de juros praticada pela empresa para suas vendas a prazo era 1,02% ao mês, equivalente a 20% para o '
            'prazo de 18 meses.'),
    'apl': ('A empresa Dinheiro Sobrando S.A. realizou, no dia 30/11/2022, três aplicações financeiras, cujas '
            'características e critérios de mensuração definidos para cada aplicação são mostradas no quadro a seguir '
            '(valor aplicado; mensuração definida pela empresa; taxa de juros; valor justo em 31/12/2022; data de '
            'vencimento):\n\n'
            '• R$ 1.800.000,00; valor justo por meio do resultado; 1% a.m.; R$ 1.848.000,00; 30/11/2023\n'
            '• R$ 3.000.000,00; valor justo por meio de outros resultados abrangentes; 2% a.m.; R$ 3.084.000,00; 05/08/2023\n'
            '• R$ 2.400.000,00; custo amortizado; 1,5% a.m.; R$ 2.424.000,00; 05/03/2024'),
    'mep': ('A empresa Iniciante S.A. apresentava em seu Balanço Patrimonial, de 1/1/2023, Patrimônio Líquido de '
            'R$ 25.000.000,00. Nessa mesma data, o valor justo líquido dos ativos e passivos da empresa era '
            'R$ 30.000.000,00 e a empresa Experiente S.A. pagou R$ 14.000.000,00 pela aquisição de 40% das ações da '
            'empresa Iniciante S.A. e passou a deter o seu controle. Sabe-se que a diferença entre o patrimônio líquido '
            'contábil e o valor justo é decorrente de um terreno adquirido há 8 anos.\n\n'
            'No ano de 2023, a empresa Iniciante S.A. apurou o lucro líquido de R$ 5.000.000,00 e distribuiu dividendos '
            'no valor de R$ 2.000.000,00.'),
    'imo': ('A empresa Produtos Enormes S.A. adquiriu, à vista, um equipamento pelo valor de R$ 13.000.000,00. A compra '
            'ocorreu no dia 1/6/2022, a empresa teve gastos adicionais necessários de instalação no valor de '
            'R$ 2.000.000,00 e o equipamento entrou em operação no dia 1/7/2022. Os gastos adicionais se referem a '
            'alterações na estrutura física da localidade, em função do porte do equipamento adquirido e, como a empresa '
            'utiliza um imóvel alugado, por condições contratuais, deverá devolver a localidade nas mesmas condições em '
            'que a recebeu no início do contrato de aluguel.\n\n'
            'A empresa definiu a vida útil do equipamento em 8 anos e, no final deste prazo de utilização, o equipamento '
            'poderá ser vendido por R$ 2.000.000,00. A empresa estimou que, para fazer a desmontagem, remover a máquina e '
            'reestruturar o imóvel para as condições originais no final do 8º ano, terá que incorrer em gastos no valor '
            'de R$ 1.000.000,00.\n\n'
            'A taxa acumulada de juros projetada para os próximos 8 anos é 25% e a empresa utiliza o método das quotas '
            'constantes para o cálculo da despesa de depreciação.'),
    'deb': ('Para atender suas necessidades de investimentos futuros, a empresa Descapitalizada S.A. emitiu um lote de '
            'debêntures com as seguintes características:\n\n'
            '• Data da emissão: 30/06/2020\n'
            '• Valor nominal das debêntures: R$ 50.000.000,00\n'
            '• Prazo total do contrato: 8 anos\n'
            '• Taxa de juros compostos contratada: 6% ao semestre\n'
            '• Forma de pagamento: parcelas semestrais de mesmo valor\n'
            '• Valor das parcelas semestrais: R$ 4.947.607,18\n'
            '• Vencimentos das parcelas semestrais: 30 de junho e 31 de dezembro de cada ano\n'
            '• Valor dos custos de transação incorridos para a emissão: R$ 505.820,28\n\n'
            'Tendo em vista a expectativa de queda nas taxas de juros de mercado no futuro, houve grande demanda pelas '
            'debêntures e a empresa conseguiu vender o lote pelo valor de R$ 53.000.000,00. Os custos de transação foram '
            'pagos na data de início do contrato e a taxa de custo efetivo da operação foi 5,3% ao semestre.'),
}
CTX_DE = {41: 'eq', 42: 'eq', 43: 'int', 44: 'int', 47: 'dfc', 48: 'dfc', 49: 'dva', 50: 'dva', 51: 'est', 52: 'est',
          53: 'apl', 54: 'apl', 55: 'mep', 56: 'mep', 57: 'imo', 58: 'imo', 59: 'deb', 60: 'deb'}

NBC34 = 'NBC TSP 34 — Custos no Setor Público'

Q = {
    1: (DT, 'Legislação Tributária', BT1,
        'Determinado Projeto de Lei Complementar Federal (PLP) fictício pretende criar um novo Estado brasileiro, a partir '
        'do desmembramento de um dos Estados federados brasileiros já existentes, mas nem esse PLP, nem os demais '
        'diplomas legais relacionados a esse desmembramento, preveem qual será a legislação tributária aplicável ao novo '
        'Estado. Em razão disso, com base na disciplina estabelecida no Código Tributário Nacional, aplicar-se-á ao novo '
        'Estado, até que entre em vigor a legislação própria desse novo Estado, a mesma legislação vigente',
        ['em Estado expressamente designado pelo Congresso Nacional, no decreto legislativo que homologar o desmembramento.',
         'em Estado expressamente indicado pelo Supremo Tribunal Federal, na decisão que julgar procedente o procedimento de desmembramento.',
         'no Distrito Federal.',
         'em Estado expressamente apontado pelo Senado Federal, na resolução que ratificar o desmembramento.',
         'no Estado do qual ele foi desmembrado.']),
    2: (DT, 'IBS — Imposto sobre Bens e Serviços', BT4,
        'De acordo com a disciplina estabelecida na Lei Complementar nº 214/2025, o Comitê Gestor do Imposto sobre Bens e '
        'Serviços (CGIBS)',
        ['é uma entidade pública com caráter técnico, político e operacional, sob regime especial, com sede rotativa pelas capitais dos 26 Estados e foro no Distrito Federal, sem independência, orçamentária ou financeira, mas dotado de independência administrativa e técnica.',
         'poderá implementar, juntamente com a Secretaria Especial da Receita Federal do Brasil e a Procuradoria-Geral da Fazenda Nacional, soluções integradas para a futura administração e a cobrança do IBS e da CBS.',
         'é uma entidade pública com caráter técnico, político e operacional, sob regime especial, com sede e foro no Distrito Federal, sem independência administrativa, orçamentária ou financeira, mas dotado de independência técnica.',
         'terá sua atuação caracterizada pela estreita vinculação, tutela e subordinação hierárquica à Secretaria Especial da Receita Federal do Brasil e à Procuradoria-Geral da Fazenda Nacional.',
         'observará o princípio da publicidade, mediante veiculação de seus atos normativos, exclusivamente por meio eletrônico, disponibilizado na internet, ou pelo Diário Oficial da União.']),
    3: (DT, 'Legislação Tributária', BT1,
        'A Lei Ordinária do ITCMD de determinado Estado brasileiro foi alterada, com a intenção de proporcionar aumento da '
        'arrecadação desse imposto. A principal alteração foi a redefinição, por meio dessa lei, do contrato de compra e '
        'venda. De acordo com o novo texto legal, o contrato de compra e venda por meio do qual A vende um bem para B '
        'passou a ser considerado como dois contratos de doação, em que A doa o bem para B e B doa dinheiro para A. De '
        'acordo com o Código Tributário Nacional, essa alteração',
        ['não poderia ter sido feita, porque a lei tributária não pode alterar definição, conteúdo e alcance de institutos, conceitos e formas de direito privado, utilizado expressamente pela Constituição Federal, para definir competência tributária.',
         'não poderia ter sido feita, porque apenas a lei complementar federal pode alterar definição, conteúdo e alcance de institutos, conceitos e formas de direito privado, utilizado expressamente pela Constituição Federal, para definir competência tributária.',
         'poderia ser feita, desde que por meio de convênio firmado por todos os Estados brasileiros, pois somente nesse caso é possível alterar definição, conteúdo e alcance de institutos, conceitos e formas de direito privado, utilizado expressamente pela Constituição Federal, para definir competência tributária.',
         'não poderia ter sido feita por um Estado, isoladamente, mas poderia ter sido feita por meio de lei complementar, desde que tivesse havido, concomitantemente, as devidas adaptações no Código Civil Brasileiro.',
         'poderia ser feita, desde que por meio de convênio firmado por, pelo menos, quatro quintos dos Estados brasileiros, pois somente nesse caso é possível alterar definição, conteúdo e alcance de institutos, conceitos e formas de direito privado, utilizado expressamente pela Constituição Federal, para definir competência tributária.']),
    4: (DT, 'Crédito Tributário: Constituição e Lançamento', BT2,
        'Em conformidade com o que estabelecia a legislação de determinado imposto, o contribuinte, na época devida, '
        'prestou à autoridade administrativa informações sobre matéria de fato, indispensáveis à efetivação do lançamento '
        'pela referida autoridade.\n\n'
        'Depois de algumas semanas, porém, o contribuinte deu-se conta de que algumas das informações prestadas continham '
        'erro, e esse erro acarretaria o pagamento do imposto em montante inferior ao efetivamente devido. Em razão disso, '
        'seria necessário efetuar a retificações das informações prestadas.\n\n'
        'Tendo como base a situação descrita acima e a disciplina do Código Tributário Nacional acerca dessa questão,\n\n'
        'I. os erros contidos nas informações prestadas e apuráveis pelo seu exame devem ser retificados de ofício pela autoridade administrativa a que competir a revisão daquela.\n'
        'II. a retificação das informações prestadas, por iniciativa do próprio declarante, só é admissível, neste caso, mediante comprovação do erro em que se funde.\n'
        'III. a retificação das informações prestadas, por iniciativa do próprio declarante, neste caso, não é admissível depois de notificado o lançamento.\n\n'
        'Está correto o que se afirma em',
        ['III, apenas.', 'II, apenas.', 'II e III, apenas.', 'I, apenas.', 'I, II e III.']),
    5: (DT, 'ICMS — Fato Gerador (LC 87/1996)', BT3,
        'O Grupo Serra da Capivara, com sede em Teresina/PI, é composto por várias empresas, inclusive pelo posto de '
        'combustíveis SERRANO e pela empresa de transporte municipal de passageiros CAPIVARENSE, todos localizados no '
        'Município de Teresina/PI.\n\n'
        'Tanto o posto de combustíveis como a empresa prestadora de serviços de transporte municipal adquirem gasolina, '
        'etanol hidratado e óleo diesel de empresas fornecedoras localizadas no Estado da Bahia, sendo que o posto de '
        'combustíveis adquire essas mercadorias para comercializá-las, enquanto a empresa de transporte os adquire para '
        'abastecer os veículos utilizados na prestação de serviços.\n\n'
        'Considerando as informações fornecidas e tendo em conta a disciplina estabelecida pela Lei Complementar '
        'nº 87/1996, o fato gerador do ICMS em favor do Estado do Piauí',
        ['ocorre no momento da entrada da gasolina, do óleo diesel e do etanol hidratado no estabelecimento do posto de combustíveis.',
         'ocorre no momento da entrada da gasolina no estabelecimento da empresa prestadora de serviço de transportes.',
         'ocorre no momento da entrada da gasolina e do óleo diesel no estabelecimento do posto de combustíveis.',
         'não ocorre no momento da entrada da gasolina e do óleo diesel no Estado do Piauí, relativamente às aquisições feitas pelo posto de combustíveis.',
         'não ocorre no momento da entrada do óleo diesel e do etanol hidratado no Estado do Piauí, relativamente às aquisições feitas pela empresa transportadora.']),
    6: (DT, 'Extinção do Crédito Tributário', BT2,
        'Determinado Código Tributário Estadual (CTE), que praticamente reproduzia o Código Tributário Nacional (CTN), '
        'acrescentou, no artigo que arrola as hipóteses de extinção do crédito tributário, uma hipótese nova de extinção, '
        'não contemplada no CTN: o perdão cívico do crédito tributário, que se destinava a todos os contribuintes que '
        'houvessem doado fundos para a campanha do então governador.\n\n'
        'De acordo com esse CTE, caberia à autoridade julgadora monocrática, nos processos administrativos tributários, '
        'aplicar esse perdão aos contribuintes doadores de campanha, ficando o referido perdão limitado ao montante da '
        'doação comprovadamente efetuada.\n\n'
        'De acordo com o Código Tributário Nacional, caso essas autoridades julgadoras aplicassem a regra do perdão cívico, elas',
        ['deveriam comunicar o fato ao Ministério Público, de ofício, para verificação da existência de eventual crime de sonegação fiscal ou contra a ordem tributária.',
         'deveriam encaminhar o processo para apreciação do plenário do órgão julgador.',
         'ficariam sujeitas à responsabilização funcional na forma da lei.',
         'deveriam recorrer de ofício da aplicação dessa norma.',
         'poderiam comunicar o fato ao Ministério Público, de ofício, para ratificação do procedimento de perdão, dependendo do montante do valor perdoado.']),
    7: (DT, 'Crédito Tributário: Constituição e Lançamento', BT2,
        'Determinado imposto é lançado por homologação, em razão de previsão legal expressa. O contribuinte, porém, ao '
        'efetuar o lançamento por homologação, foi omisso em vários pontos e inexato em outros, dando ensejo, com isso, a '
        'que a Fazenda Pública efetuasse, de ofício, a revisão desse lançamento. Ao proceder ao lançamento de ofício, a '
        'autoridade fiscal indicou como sujeitos passivos, no instrumento que materializou o lançamento de ofício, não só '
        'o contribuinte, mas também os responsáveis tributários identificados por essa autoridade. De acordo com a '
        'disciplina do Código Tributário Nacional, essa autoridade',
        ['deveria apenas ter notificado o contribuinte a retificar, no prazo de 90 dias, as omissões e as inexatidões verificadas em seu lançamento por homologação, não cabendo substituí-lo por lançamento de ofício, com a inclusão de responsáveis solidários.',
         'não poderia ter identificado, no instrumento de lançamento de ofício, os responsáveis tributários, pois só há previsão de identificação desses responsáveis tributários no momento de uma eventual execução fiscal.',
         'não poderia ter efetuado o lançamento de ofício, pois omissões e/ou inexatidões no lançamento por homologação não servem de fundamento para a revisão deste lançamento por meio de lançamento de ofício.',
         'só poderia ter identificado os responsáveis tributários, no instrumento de lançamento de ofício, se ela não pudesse identificar o contribuinte ou não tivesse conseguido identificá-lo.',
         'poderia inserir no instrumento de lançamento de ofício, como de fato o fez, as pessoas do contribuinte e dos responsáveis tributários, pois um dos elementos do lançamento consiste em identificar o sujeito passivo, de modo geral.']),
    8: (DT, 'ICMS — Benefícios Fiscais e Convênios (LC 24/1975)', BT3,
        'De acordo com Lei Complementar nº 24/1975, no tocante ao ICMS, é necessária a celebração de convênio entre as '
        'unidades federadas para',
        ['devolução total, direta ou indireta, do tributo ao contribuinte; concessão e revogação de isenções; redução da base de cálculo; e concessão de créditos presumidos.',
         'redução da base de cálculo; concessão de créditos presumidos; alteração da alíquota interna do ICMS, de 18% para 16%; e devolução total, direta ou indireta, do tributo ao contribuinte.',
         'concessão e revogação de isenções; devolução total, direta ou indireta, do tributo ao contribuinte; concessão de créditos presumidos; e alteração da alíquota interna do ICMS, de 18% para 16%.',
         'devolução total, direta ou indireta, do tributo ao contribuinte; alteração da alíquota interna do ICMS, de 18% para 16%; redução da base de cálculo; e concessão e revogação de isenções.',
         'alteração da alíquota interna do ICMS, de 18% para 16%; concessão e revogação de isenções; concessão de créditos presumidos; e redução da base de cálculo.']),
    9: (DT, 'IBS — Imposto sobre Bens e Serviços', BT4,
        'A Emenda Constitucional nº 132/2023, referente à reforma tributária, outorgou competência para a instituição do '
        'IBS e da CBS. De acordo com essa Emenda, lei complementar deve dispor sobre\n\n'
        'I. a forma, o prazo e o limite de valor para ressarcimento de créditos acumulados pelo contribuinte.\n'
        'II. as hipóteses de devolução do imposto a pessoas físicas, inclusive os limites e os beneficiários, com o objetivo de reduzir as desigualdades de renda.\n'
        'III. a forma de desoneração da aquisição de bens de capital pelos contribuintes, que poderá ser implementada por meio de crédito integral e imediato do imposto, diferimento ou redução em até 50% (cinquenta por cento) das alíquotas do imposto.\n'
        'IV. as hipóteses de diferimento e desoneração do imposto aplicáveis aos regimes aduaneiros especiais e às zonas de processamento de exportação.\n\n'
        'Está correto o que se afirma APENAS em',
        ['I, III e IV.', 'II e IV.', 'I e II.', 'II e III.', 'III e IV.']),
    10: (DT, 'Legislação Tributária', BT1,
         'Suponha que a Lei estadual nº 55 hipotética tenha criado uma nova hipótese de incidência do ITCMD, relativamente '
         'à doação de bem móvel, definindo também penalidade específica para quem a infringisse. Por desconhecer o conteúdo '
         'dessa lei, Joaquim deixou de pagar o imposto devido quando efetuou essa doação. Durante os anos que se seguiram à '
         'prática infracional, o referido Estado aumentou e diminuiu a alíquota do imposto referente a essa modalidade de '
         'doação, bem como o percentual da penalidade aplicável à infração correspondente.\n\n'
         'Antes de transcorrido o prazo decadencial, porém, a Fazenda Pública desse Estado apurou o cometimento da infração '
         'por Joaquim e promoveu, em nome dele, o lançamento de ofício do tributo devido e da correspondente penalidade '
         'pecuniária. Joaquim apresentou defesa administrativa e, antes de ser proferida a decisão final do processo '
         'administrativo tributário, foi publicada a lei estadual nº 125, revogando por inteiro a lei estadual nº 55.\n\n'
         'De acordo com as informações fornecidas e com o Código Tributário Nacional,',
         ['no momento da prolação da decisão final, no processo administrativo tributário, nem o imposto nem a penalidade poderiam mais ser exigidos.',
          'no momento da prolação da decisão final, no processo administrativo tributário, o imposto ainda poderia ser exigido, dependendo do conteúdo da decisão, mas a penalidade não era mais exigível.',
          'o lançamento do tributo e da penalidade deveriam ser feitos, respectivamente, com base na menor alíquota de imposto e no menor percentual de penalidade que estiveram vigentes entre a data da infração e a formalização do lançamento de ofício.',
          'no momento da prolação da decisão final, no processo administrativo tributário, tanto o imposto como a penalidade pecuniária ainda poderiam ser exigidos, dependendo do conteúdo da decisão.',
          'o lançamento do tributo e da penalidade deveriam ser feitos com base na legislação vigente na data da formalização do lançamento tributário.']),
    11: (DT, 'Competência Tributária', BT1,
         'Um Projeto de Lei Complementar Federal (PLP) fictício pretende transformar a Ilha do Bananal em um novo Estado '
         'brasileiro, denominado Estado Javaés-Araguaia. Não se chegou, todavia, a um acordo para se determinar se esse '
         'Estado será ou não dividido em Municípios. Caso o novo Estado de Javaés-Araguaia',
         ['venha ou não a ser dividido em Municípios, competirá à União instituir, cumulativamente, os tributos atribuídos aos Estados e aos Municípios, até que a receita desses tributos venha a cobrir os custos incorridos para a criação do novo Estado.',
          'não venha a ser dividido em Municípios, competirá à União instituir, cumulativamente, os impostos atribuídos aos Estados e aos Municípios.',
          'não venha a ser dividido em Municípios, competirá aos Estados instituir, cumulativamente, os impostos atribuídos aos Estados e aos Municípios.',
          'venha ou não a ser dividido em Municípios, competirá à União instituir, cumulativamente, os impostos atribuídos aos Estados e aos Municípios, até que a receita desses impostos venha a cobrir os custos incorridos para a criação do novo Estado.',
          'venha a ser dividido em Municípios, competirá à União instituir os impostos atribuídos aos Municípios, durante o período de criação desses Municípios.']),
    12: (DT, 'ICMS — Fato Gerador (LC 87/1996)', BT3,
         'A pizzaria Napoli Indimenticabile, localizada em Parnaíba/PI, possui um espaço para servir pizzas aos clientes '
         'que desejam se alimentar no próprio estabelecimento, mas também trabalha pelo sistema de delivery, fazendo '
         'entregas de pizzas nas residências de seus clientes ou nos locais indicados por esses clientes. A entrega das '
         'pizzas é feita por empresa terceirizada, que atua apenas no perímetro urbano do Município de Parnaíba.\n\n'
         'Tendo em conta as informações fornecidas e a disciplina estabelecida na Lei Complementar nº 87/1996, ocorre o '
         'fato gerador do ICMS, relativamente',
         ['às mercadorias, apenas no momento do fornecimento das pizzas aos clientes, relativamente àquelas consumidas no próprio estabelecimento, e, relativamente à prestação de serviço de transporte (delivery), no momento do início dessa prestação.',
          'à prestação de serviço de transporte (delivery), no momento do início dessa prestação.',
          'às mercadorias, no momento da saída das pizzas do estabelecimento, relativamente àquelas que serão entregues aos clientes, e do fornecimento das pizzas aos clientes, relativamente àquelas consumidas no próprio estabelecimento.',
          'às mercadorias, no momento da emissão do documento fiscal, seja em relação às pizzas entregues por meio da prestação do serviço de delivery, seja em relação às pizzas consumidas no próprio estabelecimento.',
          'à prestação de serviço de transporte (delivery), no momento do ato final do transporte, com a entrega da pizza ao adquirente.']),
    13: (DT, 'Responsabilidade Tributária', BT2,
         'A empresa DD&J, contribuinte do ICMS, deixou de pagar esse imposto, em razão de não terem sido lançados, em sua '
         'escrita fiscal, alguns documentos de sua emissão, com débito do imposto. Ao perceber o erro cometido, a referida '
         'empresa procurou sanear a irregularidade, comunicando esse fato à Fazenda Pública Estadual, pelos meios previstos '
         'na lei do referido estado, e efetuando o pagamento do tributo devido, acrescido dos juros de mora '
         'correspondentes. De acordo com a disciplina do Código Tributário Nacional, esse procedimento do contribuinte caracteriza',
         ['a desistência voluntária, que acarreta a exclusão da responsabilização por crime de sonegação fiscal e/ou contra a ordem tributária, desde que o contribuinte pague integralmente a penalidade pecuniária devida, para evitar a caracterização de dolo, fraude ou simulação.',
          'a autorregularização da infração, que acarreta a exclusão parcial da responsabilidade do contribuinte pela infração cometida, desde que, quando feita após o início da ação fiscal, a denúncia esteja acompanhada de atualização monetária e do pagamento da penalidade pecuniária correspondente, com redução de 75%.',
          'o arrependimento eficaz, que acarreta a exclusão parcial da responsabilidade do contribuinte pela infração cometida, desde que o contribuinte infrator efetue o pagamento da penalidade pecuniária correspondente, com redução de 50%.',
          'a denúncia espontânea da infração, que acarreta a exclusão da responsabilidade do contribuinte pela infração cometida, desde que essa denúncia tenha sido apresentada antes do início de qualquer procedimento administrativo ou medida de fiscalização, relacionados com a infração.',
          'o arrependimento tempestivo, que acarreta a exclusão parcial da responsabilidade do contribuinte pela infração cometida, desde que o contribuinte infrator efetue o pagamento da penalidade pecuniária correspondente, com redução de 75%.']),
    14: (DT, 'ICMS — Local da Operação (LC 87/1996)', BT3,
         'Durante a realização de operações relativas ao trânsito de mercadorias pelas rodovias do Estado do Piauí, as '
         'autoridades fiscais estaduais abordaram um caminhão que transportava mercadorias e, ao solicitar ao motorista a '
         'apresentação da documentação que deveria documentar o referido trânsito, foi informada de que essa documentação '
         'havia sido extraviada na última parada feita por ele. Indagado sobre os dados identificativos dos '
         'estabelecimentos remetente e destinatário dessa mercadoria, e de suas respectivas localizações, o motorista '
         'respondeu que não se recordava, mas que podia afirmar que retirou as mercadorias em estabelecimento localizado no '
         'Ceará e que iria entregá-los em estabelecimento localizado no Maranhão.\n\n'
         'As referidas autoridades fiscais, à míngua de comprovação da emissão de documento fiscal com débito do imposto, '
         'depois de constatar que a operação realizada com as referidas mercadorias seria tributável, tomaram as '
         'providências legais relativas à irregularidade constatada (transporte de mercadoria desacompanhada de documento '
         'fiscal). Com suporte à Lei Complementar nº 87/1996, as autoridades fiscais deverão',
         ['proceder ao lançamento do ICMS devido em favor do Estado do Piauí, porque a mercadoria foi encontrada nesse Estado, em situação irregular, pela falta de documento fiscal no seu transporte.',
          'proceder ao lançamento do ICMS devido em favor do Estado do Ceará, com base na declaração do motorista de que as mercadorias foram remetidas por estabelecimento localizado naquele Estado.',
          'abster-se de proceder ao lançamento do ICMS devido em favor de qualquer Estado, enquanto não for realizada diligência cujo resultado identifique, sem margem de dúvida, o estabelecimento de origem da mercadoria remetida.',
          'proceder ao lançamento do ICMS devido em favor do Estado do Maranhão, com base na declaração do motorista de que as mercadorias deveriam se entregues em estabelecimento localizado naquele Estado.',
          'abster-se de proceder ao lançamento do ICMS devido em favor de qualquer Estado, enquanto não for realizada diligência cujo resultado identifique, sem margem de dúvida, o estabelecimento de destino da mercadoria remetida.']),
    15: (DT, 'Simples Nacional', BT4,
         'Os parágrafos 11 e 12 do artigo 85 da Resolução nº 140/2018 do Comitê Gestor do Simples Nacional (CGSN) '
         'contemplam as seguintes regras, autorizando práticas de autorregularização:\n\n'
         '“Art. 85 – (...)\n'
         '§ 11. Sem prejuízo de ação fiscal individual, as administrações tributárias poderão utilizar procedimento de '
         'notificação prévia com o objetivo de incentivar a autorregularização, que, neste caso, não constituirá início de '
         'procedimento fiscal. (Lei Complementar nº 123, de 2006, art. 34, § 3º)\n'
         '§ 12. As notificações para regularização prévia poderão ser feitas por meio do Portal do Simples Nacional, '
         'facultada a utilização do Domicílio Tributário Eletrônico do Simples Nacional (DTE-SN) de que trata o art. 122, e '
         'deverão estabelecer prazo de regularização de até 90 (noventa) dias.”\n\n'
         'De acordo com as informações fornecidas e com o estabelecido na Lei Complementar nº 123/2006, relativamente à '
         'microempresa e à empresa de pequeno porte, verifica-se que os referidos dispositivos regulamentares estão em',
         ['sintonia com o estabelecido na referida Lei Complementar, quando preveem a possibilidade realização de autorregularização e estipulam o prazo em que ela deve ser feita, mas estão em dissintonia com a Lei Complementar, quando preveem forma diversa da estabelecida no seu texto.',
          'sintonia com o estabelecido na referida Lei Complementar, quando preveem a possibilidade de realização de autorregularização, mas estão em dissintonia com ela, ao estipularem forma e prazo diversos daqueles nela previstos.',
          'total dissintonia com o estabelecido na referida Lei Complementar, pois ela veda expressamente a possibilidade de realização de autorregularização quando o contribuinte estiver enquadrado nesse regime.',
          'sintonia com o estabelecido na referida Lei Complementar, quando preveem a possibilidade de realização de autorregularização e estipulam a forma como ela deve ser feita, mas estão em dissintonia com a Lei Complementar, quando preveem prazo diverso do estabelecido no seu texto.',
          'sintonia com o estabelecido na referida Lei Complementar, tanto em relação à possibilidade de realização de autorregularização, como em relação à estipulação da forma de notificação e do prazo para que ela seja realizada.']),
    41: (CTB, 'BP — Ativo Imobilizado e Depreciação', BK2,
         'O valor contábil do equipamento evidenciado no Balanço Patrimonial de 31/12/2021 foi',
         ['R$ 18.240.000,00', 'R$ 18.504.000,00', 'R$ 18.480.000,00', 'R$ 17.840.000,00', 'R$ 18.000.000,00']),
    42: (CTB, 'BP — Ativo Imobilizado e Depreciação', BK2,
         'Sabendo que a empresa vendeu o equipamento, em 31/12/2021, pelo valor à vista de R$ 18.500.000,00, o resultado '
         'contábil apurado na venda do equipamento, evidenciado na Demonstração do Resultado de 2021 foi',
         ['Lucro de R$ 500.000,00', 'Prejuízo de R$ 4.000,00', 'Lucro de R$ 20.000,00', 'Lucro de R$ 660.000,00',
          'Lucro de R$ 260.000,00']),
    43: (CTB, 'CPC 01 — Impairment', BK4,
         'O saldo contábil do ativo intangível que deveria ser apresentado no Balanço Patrimonial de 31/12/2021 da empresa '
         'Invenções Nacionais S.A. era',
         ['R$ 3.500.000,00', 'R$ 3.000.000,00', 'R$ 3.800.000,00', 'R$ 4.000.000,00', 'R$ 2.800.000,00']),
    44: (CTB, 'CPC 01 — Impairment', BK4,
         'O valor reconhecido no resultado de 2021 da empresa Invenções Nacionais S.A., referente ao ativo intangível, foi',
         ['R$ 500.000,00 (positivo).', 'R$ 1.000.000,00 (positivo).', 'R$ 200.000,00 (negativo).',
          'R$ 800.000,00 (positivo).', 'R$ 0,00.']),
    45: (CTB, 'CPC 25 — Provisões e Contingências', BK4,
         'Durante o ano de 2020 uma empresa passou a responder a quatro processos. As informações sobre as estimativas de '
         'desembolso e as probabilidades de perda para cada processo, em 31/12/2020, são apresentadas no quadro a seguir '
         '(processo: montante estimado de perda; probabilidade de perda):\n\n'
         '• Fiscal: R$ 2.000.000,00; provável\n'
         '• Trabalhista 1: R$ 3.700.000,00; possível\n'
         '• Ambiental: R$ 2.300.000,00; possível\n'
         '• Trabalhista 2: R$ 1.600.000,00; remota\n\n'
         'O valor a ser evidenciado no Balanço Patrimonial em 31/12/2020, exclusivamente em relação aos processos '
         'apresentados, era',
         ['6.000.000,00', '0,00', '2.000.000,00', '3.600.000,00', '9.600.000,00']),
    46: (CTB, 'BP — PL, Parte II', BK2,
         'O Patrimônio líquido de uma empresa, apresentado no Balanço Patrimonial de 31/12/2022, era composto das contas, '
         'com os seguintes valores:\n\n'
         '• Capital Social: R$ 8.000.000,00\n'
         '• Reserva Legal: R$ 1.400.000,00\n'
         '• Reserva Estatutária: R$ 400.000,00\n'
         '• Reserva de Lucros a Realizar: R$ 400.000,00\n'
         '• Total do Patrimônio Líquido: R$ 10.200.000,00\n\n'
         'No ano de 2023, o lucro líquido apurado pela empresa foi R$ 4.800.000,00 e as seguintes informações sobre a '
         'destinação são conhecidas:\n\n'
         'I. A Reserva Legal é constituída de acordo com o estabelecido na Lei das Sociedades por Ações.\n'
         'II. A Reserva Estatutária é definida no valor de 10% do Lucro Líquido sem qualquer dedução.\n'
         'III. Não houve realização de qualquer valor correspondente à conta Reserva de Lucros a Realizar.\n'
         'IV. O estatuto da empresa não define o critério para cálculo do dividendo mínimo obrigatório.\n\n'
         'O valor do dividendo mínimo obrigatório que deveria ser evidenciado no passivo, no Balanço Patrimonial de '
         '31/12/2023, era',
         ['R$ 2.280.000,00', 'R$ 2.300.000,00', 'R$ 1.150.000,00', 'R$ 1.200.000,00', 'R$ 1.140.000,00']),
    47: (CTB, 'DFC (Direto e Indireto)', BK3,
         'O valor correspondente ao Caixa gerado nas Atividades Operacionais no ano de 2023 da empresa Importação de '
         'Produtos Cosméticos S.A. foi',
         ['R$ 522.000,00 (negativo).', 'R$ 856.800,00 (positivo).', 'R$ 1.108.800,00 (positivo).',
          'R$ 486.000,00 (negativo).', 'R$ 234.000,00 (negativo).']),
    48: (CTB, 'DFC (Direto e Indireto)', BK3,
         'O valor correspondente ao Caixa gerado nas Atividades de Investimento no ano de 2023 da empresa Importação de '
         'Produtos Cosméticos S.A. foi',
         ['R$ 72.000,00 (negativo).', 'R$ 432.000,00 (negativo).', 'R$ 180.000,00 (negativo).',
          'R$ 396.000,00 (negativo).', 'R$ 288.000,00 (negativo).']),
    49: (CTB, 'DVA — Valor Adicionado', BK3,
         'O Valor Adicionado a Distribuir gerado pela empresa Produtos Sustentáveis S.A., no ano de 2023, foi',
         ['3.400.000,00', '3.004.000,00', '3.204.000,00', '3.600.000,00', '1.920.000,00']),
    50: (CTB, 'DVA — Valor Adicionado', BK3,
         'A parcela do Valor Adicionado a Distribuir gerado pela empresa Produtos Sustentáveis S.A. que foi destinado para '
         'impostos, taxas e contribuições, no ano de 2023, foi',
         ['R$ 1.785.200,00', 'R$ 1.776.200,00', 'R$ 1.760.200,00', 'R$ 2.181.200,00', 'R$ 2.172.200,00']),
    51: (CTB, 'BP — Estoques', BK2,
         'O Custo das Mercadorias Vendidas evidenciado na Demonstração do Resultado do ano de 2023 da empresa Produtos '
         'Essenciais S.A., especificamente em relação à compra e venda das mercadorias citadas, foi',
         ['R$ 988.000,00', 'R$ 868.000,00', 'R$ 836.000,00', 'R$ 900.000,00', 'R$ 876.000,00']),
    52: (CTB, 'CPC 12 — Ajuste a Valor Presente', BK4,
         'As receitas evidenciadas na Demonstração do Resultado do ano de 2023 da empresa Produtos Essenciais S.A., '
         'especificamente em relação à venda efetuada em 1/12/2023, foram:',
         ['Receita de Vendas no valor de R$ 1.500.000,00 e Receita Financeira no valor de R$ 15.300,00.',
          'Receita de Vendas no valor de R$ 1.500.000,00, apenas.',
          'Receita de Vendas no valor de R$ 1.400.000,00 e Receita Financeira no valor de R$ 5.100,00.',
          'Receita de Vendas no valor de R$ 1.400.000,00, apenas.',
          'Receita de Vendas no valor de R$ 1.380.000,00 e Receita Financeira no valor de R$ 4.386,00.']),
    53: (CTB, 'CPC 48 — Instrumentos Financeiros', BK4,
         'O saldo contábil das três aplicações realizadas em 30/11/2022 pela empresa Dinheiro Sobrando S.A. apresentado no '
         'Balanço Patrimonial de 31/12/2022 foi',
         ['R$ 7.368.000,00', 'R$ 7.338.000,00', 'R$ 7.356.000,00', 'R$ 7.314.000,00', 'R$ 7.344.000,00']),
    54: (CTB, 'CPC 48 — Instrumentos Financeiros', BK4,
         'O efeito total apresentado no resultado do ano de 2022, referente especificamente às três aplicações efetuadas '
         'em 30/11/2022 pela empresa Dinheiro Sobrando S.A. foi',
         ['R$ 138.000,00', 'R$ 144.000,00', 'R$ 168.000,00', 'R$ 114.000,00', 'R$ 156.000,00']),
    55: (CTB, 'CPC 18 — Equivalência Patrimonial', BK4,
         'O valor apresentado no grupo Investimentos do Ativo não Circulante, no Balanço Patrimonial de 31/12/2023 das '
         'demonstrações contábeis individuais da empresa Experiente S.A., foi',
         ['R$ 11.200.000,00', 'R$ 14.000.000,00', 'R$ 16.000.000,00', 'R$ 12.000.000,00', 'R$ 15.200.000,00']),
    56: (CTB, 'CPC 18 — Equivalência Patrimonial', BK4,
         'O valor do resultado decorrente do investimento efetuado na empresa Iniciante S.A., apresentado na Demonstração '
         'do Resultado do ano de 2023 das demonstrações individuais da empresa Experiente S.A., foi',
         ['R$ 0,00', 'R$ 2.000.000,00', 'R$ 1.200.000,00', 'R$ 5.000.000,00', 'R$ 3.000.000,00']),
    57: (CTB, 'CPC 27 — Imobilizado', BK4,
         'O valor da Despesa de Depreciação apresentada na Demonstração do Resultado do ano de 2022 da empresa Produtos '
         'Enormes S.A., especificamente em relação ao equipamento adquirido, foi',
         ['R$ 987.500,00', 'R$ 875.000,00', 'R$ 862.500,00', 'R$ 1.000.000,00', 'R$ 812.500,00']),
    58: (CTB, 'CPC 27 — Imobilizado', BK4,
         'O valor do saldo contábil evidenciado no Balanço Patrimonial em 31/12/2022 da empresa Produtos Enormes S.A., '
         'especificamente em relação ao equipamento adquirido, foi',
         ['R$ 14.937.500,00', 'R$ 15.125.000,00', 'R$ 14.187.500,00', 'R$ 15.000.000,00', 'R$ 14.812.500,00']),
    59: (CTB, 'CPC 48 — Instrumentos Financeiros', BK4,
         'O valor total dos encargos financeiros registrados no resultado de 2020 da empresa Descapitalizada S.A., '
         'decorrente exclusivamente das debêntures emitidas, foi',
         ['R$ 2.782.191,53', 'R$ 3.000.000,00', 'R$ 2.650.000,00', 'R$ 3.505.820,55', 'R$ 4.947.607,18']),
    60: (CTB, 'CPC 48 — Instrumentos Financeiros', BK4,
         'O saldo total apresentado nas contas de passivo (circulante e não circulante) no Balanço Patrimonial de '
         '31/12/2020 da empresa Descapitalizada S.A. foi',
         ['R$ 50.861.392,82', 'R$ 47.318.246,32', 'R$ 48.052.392,82', 'R$ 50.328.764,07', 'R$ 47.702.392,82']),
    61: (CPU, NBC34, BP2,
         'Quanto à escolha do método de custeio a ser adotado por uma entidade, a NBC TSP 34 recomenda a utilização do custeio',
         ['variável, quando os custos indiretos forem relevantes para fins de responsabilização e tomada de decisão.',
          'direto para entidades com menor grau de maturidade do seu modelo de gerenciamento de custos.',
          'por absorção parcial, quando for irrelevante atribuir os custos indiretos aos objetos de custos finais.',
          'pleno, quando for irrelevante atribuir os custos indiretos aos objetos de custos intermediários ou finais.',
          'por absorção parcial, independentemente do estágio de maturidade do modelo de gerenciamento de custos.']),
    62: (CPU, NBC34, BP2, 'De acordo com a NBC TSP 34, custo é',
         ['o dispêndio de um ativo para a geração de bens ou serviços, tal como a saída de caixa e equivalentes de caixa para a aquisição de veículos escolares.',
          'a utilização de recursos para a geração de bens ou serviços, tal como o uso de recursos financeiros para adquirir equipamentos hospitalares.',
          'o pagamento resultante da aquisição de um bem público, tal como aquele referente à compra de bens necessários para a disponibilização de leitos em hospitais.',
          'o consumo ou a utilização de recursos para a geração de bens ou serviços, tal como a utilização de alimentos para a preparação de merenda escolar.',
          'o pagamento de um passivo para a geração de bens ou serviços, tal como aquele referente a vencimentos fixos de pessoal que prestam serviços de saúde à população.']),
    63: (CPU, NBC34, BP2,
         'Para a apuração do custo de manutenção da frota de uma entidade pública, por veículo atendido, pelo método de custeio',
         ['por absorção parcial, deve-se considerar todos os custos diretos e somente alguns indiretos da manutenção, sendo que entre os indiretos excluídos se tem o aluguel do galpão da oficina.',
          'por absorção integral, deve-se considerar todos os custos diretos e indiretos da manutenção, sendo que entre os diretos se tem o aluguel do galpão da oficina.',
          'por absorção integral, deve-se considerar todos os custos diretos e indiretos da manutenção, sendo que entre os indiretos se tem o custo de energia elétrica do galpão da oficina.',
          'variável, deve-se considerar somente os custos diretos da manutenção, tais como aqueles decorrentes de peças e do aluguel do galpão da oficina.',
          'variável, deve-se considerar todos os custos diretos e indiretos da manutenção, sendo que entre os diretos se tem o aluguel do galpão da oficina.']),
    64: (CPU, NBC34, BP2, 'De acordo com a NBC TSP 34, é mais adequado o tratamento de custos pelo sistema de acumulação',
         ['contínua, quando se trata de serviços prestados de forma continuada, como o serviço de gestão de bibliotecas públicas.',
          'contínua, quando se pretende alocar todos os custos indiretos aos produtos, sendo essa alocação efetuada por meio de rateio.',
          'por ordem de produção, quando se trata do fornecimento de bens à população, como a preparação de merenda em uma escola.',
          'por ordem de produção, quando se tem a produção de produtos iguais, com a mesma especificação e sem alterações muito frequentes.',
          'por processo, quando a principal entidade objeto de custeio é a ordem de produção ou a ordem de serviço.']),
    65: (CPU, NBC34, BP2, 'De acordo com a NBC TSP 34, o custeio baseado em atividades é',
         ['um método de custeio que se utiliza de direcionadores para alocar os custos diretos e indiretos aos produtos.',
          'uma técnica recomendada para entidades com menor grau de maturidade de modelo de gerenciamento de custos.',
          'uma técnica que deve ser utilizada para operacionalizar os métodos de custeio direto e por absorção parcial e integral.',
          'um método de custeio que aloca somente os custos variáveis aos objetos de custos intermediários e finais.',
          'uma técnica que pode ser utilizada para fazer o rastreamento de custos indiretos até os objetos de custo final.']),
    66: (CPU, NBC34, BP2, 'Referente à classificação dos custos, a NBC TSP 34 determina que, quando o objeto de custo é',
         ['o processo julgado por um juiz, o custo com contrato anual de software de processo judicial corresponde a um custo variável.',
          'o serviço de coleta de lixo, o custo com combustível de um caminhão utilizado exclusivamente para executar esse serviço corresponde a um custo indireto.',
          'o processo julgado por um juiz, o custo com vigilância e limpeza do prédio onde o juiz trabalha para o julgamento corresponde a um custo direto.',
          'a vacina aplicada, o custo com salário da coordenação regional responsável pela campanha de vacinação corresponde a um custo indireto.',
          'o atendimento hospitalar prestado por paciente, o custo com contrato mensal de limpeza hospitalar corresponde a um custo variável.']),
    67: (CPU, NBC34, BP2,
         'De acordo com a NBC TSP 34, o processo de atribuição de custos deve ser iniciado, sempre que possível e '
         'economicamente viável, com a',
         ['apropriação dos custos variáveis, mediante rastreamento.', 'apropriação dos custos diretos.',
          'alocação dos custos indiretos, mediante direcionadores de custos.',
          'alocação dos custos indiretos, mediante bases de rateio razoáveis e consistentes.', 'alocação dos custos fixos.']),
    68: (CPU, NBC34, BP2, 'Quanto à comparabilidade de informações de custos, a NBC TSP 34 recomenda a adoção do custeio',
         ['variável, quando a comparação incidir sobre o custo de consultas médicas realizadas em unidades básicas de saúde.',
          'baseado em atividades, quando a comparação incidir sobre o custo de capacitação de servidores de uma entidade pública.',
          'direto, quando a comparação incidir sobre o custo de serviços de acolhimento de crianças e adolescentes em situação de risco.',
          'pleno, quando a comparação incidir sobre objetos de custos intermediários, como a contratação de sistemas de informação.',
          'por absorção integral, quando a comparação incidir sobre o custo de atendimentos realizados em programas de saúde mental.']),
    69: (CPU, NBC34, BP2, 'Custo padrão é',
         ['o valor para se adquirir um ativo, o qual corresponde ao valor de caixa fornecido à época de sua aquisição.',
          'o custo mais econômico exigido para uma entidade pública substituir o potencial de serviços de um ativo.',
          'um custo planejado, predeterminado e criteriosamente projetado, estabelecido para ser comparado com o custo real.',
          'o montante que uma entidade pública pode obter com a venda de um ativo após deduzir os gastos para a venda.',
          'o valor presente do potencial de serviço remanescente de um ativo, caso este continue a ser utilizado por uma entidade.']),
    70: (CPU, NBC34, BP2, 'De acordo com a NBC TSP 34,',
         ['objeto de custo é a unidade para a qual se deseja identificar, mensurar e avaliar os custos; sendo que, em uma entidade que presta serviços administrativos, um objeto de custo pode ser o documento emitido.',
          'método de custeio é o conjunto de elementos estruturados que registra, processa e evidencia os custos de bens e serviços e demais objetos de custos; sendo que entre os principais métodos se tem o variável e o por absorção.',
          'centro de responsabilidade é o conjunto de elementos estruturados que registra, processa e evidencia os custos de bens e serviços e demais objetos de custos, sejam eles intermediários ou finais.',
          'objeto de custo final é o indicador que permite estabelecer a relação de causa e efeito para alocação dos custos indiretos, como é o número de salas de aula para a alocação da energia elétrica consumida em uma escola.',
          'método de custeio se refere à forma como os custos são acumulados e atribuídos aos bens e serviços, estando relacionado ao fluxo físico da produção; sendo que entre os principais métodos se tem o variável e o por absorção.']),
    71: (AUD, 'Auditoria Interna (NBC TI 01)', BU3,
         'Considerando os princípios, os objetivos e a aplicação prática das funções da auditoria interna, da auditoria '
         'independente e da perícia contábil:',
         ['a principal diferença entre o trabalho do auditor independente e o do perito contábil é que o primeiro deve responder a quesitos técnicos formulados pelas partes ou pelo juízo, enquanto o segundo não se submete a questionamentos.',
          'a auditoria independente, ao contrário da interna, não requer independência do auditor em relação à entidade auditada, pois essa exigência se aplica exclusivamente aos peritos judiciais.',
          'a perícia contábil tem como finalidade exclusiva a prevenção de fraudes contábeis, sendo vedada sua utilização em processos judiciais que demandem prova técnica.',
          'a auditoria independente deve emitir laudo pericial contábil, ainda que exista provisão contratual entre a entidade auditada e a firma de auditoria.',
          'a auditoria interna está subordinada à administração da entidade auditada e pode ter, entre seus objetivos, a avaliação da eficiência operacional e do cumprimento de normas internas.']),
    72: (AUD, 'Planejamento e Documentação (NBC TA 300/230)', BU1,
         'O planejamento da auditoria é uma etapa essencial para assegurar a obtenção de evidência apropriada e suficiente, '
         'de forma eficaz e eficiente. Em atenção às normas e às melhores práticas,',
         ['o planejamento da auditoria deve incluir a definição da estratégia global do trabalho, bem como o desenvolvimento do programa de auditoria, considerando fatores como risco, materialidade, natureza dos controles internos e conhecimento prévio da entidade.',
          'o planejamento da auditoria é uma etapa estanque, que ocorre antes da execução do trabalho de campo e não deve ser modificado após o início dos procedimentos substantivos.',
          'o conhecimento prévio da estrutura organizacional da entidade auditada é irrelevante na fase de planejamento, sendo mais apropriado para a fase de avaliação de controles internos.',
          'a definição da materialidade e a avaliação de riscos são atividades que, embora relevantes, não integram formalmente a fase de planejamento da auditoria.',
          'a existência de auditoria interna na entidade auditada é irrelevante para o planejamento do auditor externo, dado que os objetivos e a independência desses profissionais são distintos.']),
    73: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU1,
         'A análise de riscos em auditoria exige do auditor a identificação de fatores que aumentam a probabilidade de '
         'distorções relevantes, com ou sem intenção. Para esse efeito,',
         ['a concentração de receitas em poucos clientes reduz o risco de auditoria.',
          'a presença de transações com partes relacionadas, por sua previsibilidade e documentação formal, tende a reduzir o risco de auditoria.',
          'o risco de auditoria é reduzido quando o auditor já conhece os processos da entidade e tem confiança pessoal nos seus gestores.',
          'o risco de auditoria aumenta em ambientes de alta complexidade ou instabilidade, mesmo quando os controles internos são formalmente bem estruturados.',
          'quanto maior a experiência do auditor com determinado setor econômico, menor a necessidade de considerar fatores de risco específicos da entidade.']),
    74: (AUD, 'Procedimentos e Evidências de Auditoria (NBC TA 500/505/520)', BU2,
         'Quanto à utilização e às limitações das confirmações externas enquanto procedimentos relevantes para obtenção de '
         'evidência de auditoria confiável,',
         ['caso as confirmações externas não retornem, o auditor deve, obrigatoriamente, considerar a auditoria como limitada e abster-se de emitir opinião.',
          'o envio de solicitações de confirmação negativa é preferido pelo auditor quando há alto risco de distorção relevante, pois exige resposta obrigatória do destinatário.',
          'confirmações externas podem ser ineficazes quando há indícios de que a entidade auditada possa interferir na comunicação entre o auditor e o terceiro.',
          'a evidência obtida por meio de confirmação externa é sempre mais confiável do que aquela produzida internamente, ainda que contradiga outras evidências coletadas.',
          'a ausência de resposta a uma solicitação de confirmação positiva implica a rejeição automática da evidência pelo auditor, independentemente da materialidade do item envolvido.']),
    75: (AUD, 'Auditoria Fiscal — Parte I', BU4,
         'Durante auditoria fiscal em um estabelecimento contribuinte do ICMS, o Auditor Fiscal detecta inconsistência entre '
         'o inventário físico dos estoques e os saldos registrados no sistema de gestão empresarial (ERP) do contribuinte. A '
         'empresa justifica que tais diferenças decorrem da defasagem entre o registro contábil e o real trânsito das '
         'mercadorias, especialmente em operações interestaduais com prazo de entrega superior a cinco dias. Considerando os '
         'princípios da auditoria e os riscos inerentes aos fluxos de mercadorias, a',
         ['auditoria de estoque restringe-se à verificação documental, sendo desnecessária a inspeção física quando os controles internos são formalmente instituídos.',
          'divergência é aceitável, desde que os volumes divergentes estejam devidamente justificados por notas fiscais emitidas, mesmo que ainda não recebidas fisicamente.',
          'existência de diferença entre estoque físico e contábil exige investigação específica, pois pode indicar simulação de operações fiscais ou omissão de receitas.',
          'conciliação entre registros físicos e contábeis é dispensável quando a empresa adota sistema de gestão empresarial com controle por código de barras.',
          'análise de estoque deve considerar apenas os saldos contábeis, visto que a inspeção física é influenciada por fatores logísticos alheios ao controle da empresa.']),
    76: (AUD, 'Auditoria Fiscal — Parte I', BU4,
         'Durante a análise das demonstrações contábeis de um contribuinte do setor atacadista, o Auditor Fiscal observa que '
         'os estoques foram registrados pelo custo histórico, mesmo diante de evidente deterioração dos preços de venda no '
         'mercado. Considerando os princípios de contabilidade, bem como os efeitos da prática mencionada sobre a '
         'confiabilidade dos relatórios financeiros e sobre a base de cálculo tributária,',
         ['a manutenção do estoque pelo custo histórico, mesmo diante da queda no valor de realização, é uma prática aceitável, pois evita o reconhecimento de prejuízos meramente estimados.',
          'a ausência de ajuste para o menor valor entre custo e valor líquido de realização pode inflar artificialmente os indicadores de liquidez e comprometer a análise da real capacidade financeira da entidade.',
          'o auditor deve recomendar que os estoques sejam ajustados apenas após a alienação das mercadorias, momento em que se realiza a efetiva perda de valor.',
          'o valor líquido de realização não apresenta qualquer interesse para a auditoria fiscal.',
          'o ajuste de valor de estoque ao valor líquido de realização, quando feito, deve ser desconsiderado para fins fiscais, pois se trata de despesa de natureza não dedutível.']),
    77: (AUD, 'Planejamento e Documentação (NBC TA 300/230)', BU1,
         'Durante a auditoria de apuração do crédito físico de um contribuinte do ICMS, o Auditor Fiscal observou que os '
         'registros de entradas de insumos tributáveis não estavam adequadamente documentados.\n\n'
         'Questionado, o contribuinte afirmou que os documentos originais haviam sido descartados por engano, mas que '
         'mantinha planilhas internas com resumos das operações. Considerando os preceitos da NBC TA 230 (R1),',
         ['a finalidade da documentação de auditoria é exclusivamente registrar os achados do auditor, podendo ser complementada por declarações da entidade quando faltarem documentos.',
          'as explicações verbais e as planilhas produzidas pela entidade auditada são suficientes para compor a documentação de auditoria, desde que os dados estejam tecnicamente estruturados.',
          'o auditor pode substituir os registros formais por evidência sumária produzida pela entidade, desde que haja coerência com a escrituração contábil digital.',
          'a ausência de documentação original não invalida os registros auxiliares internos, pois o auditor deve confiar na declaração da entidade.',
          'a documentação de auditoria deve conter evidência suficiente e apropriada que permita a compreensão por auditor experiente, sendo inadequada a substituição de documentos fiscais por resumos não auditáveis.']),
    78: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU1,
         'No curso de auditoria, foram encontradas diversas distorções nos lançamentos contábeis de um contribuinte, todas '
         'individualmente inferiores ao valor de materialidade inicialmente definido para as demonstrações como um todo. '
         'Ainda assim, o auditor considerou necessário reavaliar os riscos e rever a estratégia de auditoria. Consoante as '
         'diretrizes da NBC TA 320 (R1), a conduta foi',
         ['correta, pois a determinação da materialidade de desempenho é um cálculo técnico padronizado, desvinculado de julgamento profissional.',
          'incorreta, pois o auditor deve ignorar as distorções individuais sempre que o valor somado ficar abaixo do limite de materialidade, independentemente de suas naturezas.',
          'incorreta, pois a materialidade determinada no planejamento da auditoria fixa o limite para avaliação de distorções, tornando inapropriada a revisão posterior.',
          'correta, pois a agregação de distorções individualmente irrelevantes pode tornar relevante o seu efeito conjunto, exigindo reavaliação dos limites pelo auditor.',
          'incorreta, pois a revisão da materialidade só é necessária se houver alteração na estrutura de capital da entidade durante o período auditado.']),
    79: (AUD, 'Procedimentos e Evidências de Auditoria (NBC TA 500/505/520)', BU2,
         'Durante fiscalização do ICMS, o Auditor Fiscal percebe que diversos documentos comprobatórios de transações '
         'relevantes haviam sido digitalizados e posteriormente destruídos.\n\n'
         'O fiscalizado sustenta que o backup digital equivale, em confiabilidade, aos documentos originais. Em atenção à '
         'NBC TA 500 (R1), ao buscar evidência de auditoria apropriada e suficiente, o auditor deve considerar que',
         ['a ausência do documento original implica, automaticamente, limitação ao alcance da auditoria e exige abstenção de opinião.',
          'a confiabilidade das evidências digitalizadas depende dos controles existentes sobre sua elaboração e manutenção, o que não deve ser presumido.',
          'evidências digitalizadas apresentam confiabilidade inferior às evidências verbais, mas substituem automaticamente os documentos originais sem prejuízo à qualidade da auditoria.',
          'a evidência digitalizada é aceitável apenas se o conteúdo for validado por terceiro envolvido na operação da auditada.',
          'uma vez que os documentos foram originalmente emitidos e processados pela entidade, não há diferença substancial entre sua versão física e digital.']),
    80: (AUD, 'Especialista do Auditor (NBC TA 620)', BU3,
         'Em auditoria de autos de concessão de benefício fiscal a empresa do ramo da mineração, o Auditor Fiscal depara-se '
         'com laudo técnico de apuração de reservas minerais elaborado por engenheiro contratado pela própria empresa para '
         'subsidiar a mensuração de seus ativos e o dimensionamento dos benefícios fiscais.\n\n'
         'Dada a relevância financeira do objeto, a Secretaria da Fazenda contrata geólogo especialista, acolhendo '
         'solicitação do auditor, que avalia não possuir conhecimento técnico para aferir a razoabilidade do estudo.\n\n'
         'Ao empregar os trabalhos do geólogo especialista, com base na NBC TA 620,',
         ['o auditor deve avaliar a competência, a objetividade e a adequação do trabalho do especialista contratado, mantendo-se responsável pelas conclusões da auditoria.',
          'não deve ocorrer acordo ou comunicação entre o especialista e o auditor, para que não seja comprometida a independência hierárquica e técnica entre eles.',
          'a contratação de especialista exime o auditor da necessidade de obter entendimento sobre a área técnica analisada, bastando o relatório final do especialista.',
          'a referência ao trabalho do especialista no relatório do auditor torna-se obrigatória, ainda que não tenha influenciado a decisão fiscal.',
          'a responsabilidade pela conclusão da auditoria recai exclusivamente sobre o especialista, que deve documentar adequadamente o seu trabalho e assiná-lo.']),
}
