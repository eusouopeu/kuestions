# -*- coding: utf-8 -*-
"""SEFAZ-PI 2025 (FCC) - Agente de Tributos da Fazenda Estadual - P2 (caderno A01, Tipo 004), transcrita das imagens.
Excluidas: 16-40 (Legislacao Tributaria Estadual do Piaui)."""

DT, CTB, FIN, CPU = 'Direito Tributário', 'Contabilidade Geral', 'Finanças Públicas', 'Contabilidade Pública'
BT1 = '[1] Sistema Tributário Nacional: Conceitos e Princípios (5 aulas)'
BT2 = '[2] Obrigação e Crédito Tributário (7 aulas)'
BT3 = '[3] Administração Tributária e Tributos em Espécie (4 aulas)'
BT4 = '[4] Reforma Tributária e Regimes Especiais (4 aulas)'
BK2 = '[2] Balanço Patrimonial (BP) (8 aulas)'
BK3 = '[3] Demonstrações Complementares e Princípios (5 aulas)'
BK4 = '[4] CPCs — Pronunciamentos Técnicos (11 aulas)'
BK5 = '[5] Contabilidade de Custos e Gerencial'
BF1 = '[1] Orçamento Público: Fundamentos e Instrumentos (3 aulas)'
BF2 = '[2] Ciclo Orçamentário, Créditos e Classificações (3 aulas)'
BF3 = '[3] Receita e Despesa Pública (3 aulas)'
BF4 = '[4] Lei de Responsabilidade Fiscal (LRF) (4 aulas)'
BP2 = '[2] NBC TSP — Normas Vigentes (3 aulas)'
NBC34 = 'NBC TSP 34 — Custos no Setor Público'

CTX = {
    'est': ('Em 02/12/2022, a empresa Compra e Venda S.A. adquiriu determinada mercadoria para revenda e pagou, à vista, '
            'os seguintes valores:\n\n'
            '• Para o fornecedor das mercadorias: R$ 300.000,00.\n'
            '• Para a empresa que transportou as mercadorias do depósito do fornecedor até seu depósito: R$ 20.000,00.\n\n'
            'O valor total dos tributos recuperáveis incluídos nos valores pagos foi R$ 40.000,00.\n\n'
            'Em 22/12/2022, a empresa vendeu 80% das mercadorias que haviam sido adquiridas e pagou R$ 30.000,00 para a '
            'transportadora que fez a entrega das mercadorias vendidas.'),
    'apl': ('No dia 01/12/2024, a empresa Rentabilizando S.A. realizou duas aplicações em ativos financeiros, cujos valores '
            'e as respectivas classificações feitas pela empresa foram as seguintes:\n\n'
            '• R$ 400.000,00 são mensurados ao custo amortizado.\n'
            '• R$ 300.000,00 são mensurados ao valor justo por meio de outros resultados abrangentes.\n\n'
            'As duas aplicações remuneravam à mesma taxa de juros de 0,8% ao mês.\n\n'
            'Os valores justos dos títulos, em 31/12/2024, eram os seguintes:\n\n'
            '• R$ 408.000,00 para os títulos mensurados ao custo amortizado.\n'
            '• R$ 306.000,00 para os títulos mensurados ao valor justo por meio de outros resultados abrangentes.'),
    'imo': ('Um equipamento foi adquirido pela empresa Produtora Integral S.A. para uso na sua atividade e entrou em '
            'operação no dia 01/07/2022. A empresa pagou, à vista, os seguintes valores para dispor do equipamento nas '
            'condições de uso estabelecidas:\n\n'
            '• Pagamento ao fornecedor do equipamento: R$ 1.400.000,00\n'
            '• Gastos com instalação e customização do equipamento: R$ 760.000,00\n\n'
            'A vida útil do equipamento foi definida pela empresa em 8 anos e o valor residual esperado para sua venda foi '
            'estimado, no final do prazo de vida útil, em R$ 400.000,00. A empresa adota o método das quotas constantes '
            'para a determinação da despesa de depreciação e a vida útil do equipamento para fins fiscais é 10 anos. Não '
            'foi identificado, até 31/12/2023, a necessidade de ajuste ao valor recuperável.'),
    'int': ('Um ativo intangível, com vida útil definida em 20 anos, estava apresentado no Balanço Patrimonial de '
            '31/12/2021 da empresa Só Aparência S.A. com os seguintes valores:\n\n'
            '• Custo de aquisição: 5.000.000,00\n'
            '• (−) Amortização acumulada: (1.125.000,00)\n'
            '• (=) Valor contábil do ativo: 3.875.000,00\n\n'
            'Para a realização do teste de redução ao valor recuperável de ativos (teste de impairment) em 31/12/2022, a '
            'empresa obteve as seguintes informações sobre esse ativo intangível, com os valores expressos em reais:\n\n'
            '• Valor em uso: 3.500.000,00\n'
            '• Valor justo líquido das despesas de venda: 3.300.000,00'),
    'prov': ('O quadro a seguir apresenta informações sobre os processos judiciais a que a empresa Problemas Gerais S.A. '
             'está respondendo. São apresentadas as informações sobre os processos que foram contabilizados no Balanço '
             'Patrimonial de 31/12/2022 e os valores atualizados para 31/12/2023, incluindo novos processos que foram '
             'impetrados neste ano, a probabilidade de perda identificada para cada processo e os valores estimados para '
             'estas perdas (processo: provisão reconhecida no BP de 31/12/2022; probabilidade de perda em 31/12/2023; valor '
             'reestimado da perda esperada em 31/12/2023):\n\n'
             '• Processo 1: R$ 1.500.000,00; provável; R$ 1.200.000,00\n'
             '• Processo 2: –; provável; R$ 720.000,00\n'
             '• Processo 3: –; possível; R$ 480.000,00\n'
             '• Processo 4: R$ 900.000,00; possível; R$ 540.000,00'),
    'pl': ('O Patrimônio líquido da empresa Importadora de Tecidos S.A., apresentado no Balanço Patrimonial de 31/12/2022, '
           'era composto das seguintes contas com os saldos expressos em reais:\n\n'
           '• Capital: 48.000.000,00\n'
           '• Reserva Legal: 1.200.000,00\n'
           '• Reserva Estatutária: 4.800.000,00\n'
           '• Patrimônio Líquido: 54.000.000,00\n\n'
           'As seguintes informações sobre a empresa Importadora de Tecidos S.A. são conhecidas:\n\n'
           '• O lucro líquido apurado em 2023 foi R$ 28.800.000,00.\n'
           '• A Reserva Legal foi constituída de acordo com o estabelecido na Lei das Sociedades por Ações.\n'
           '• A Reserva Estatutária é constituída pelo valor correspondente a 10% do Lucro Líquido, sem qualquer ajuste.\n'
           '• O dividendo mínimo obrigatório, definido no estatuto da empresa, corresponde a 30% do Lucro Líquido deduzido '
           'do valor da Reserva Legal constituída no período.\n'
           '• Não houve, em 2023, aumento de Capital nem distribuição de dividendos dos resultados de períodos anteriores.'),
    'lum': ('A indústria LuminaTech S.A. fabrica duas linhas de autopeças: Gama e Delta. Em março de 2024, a empresa fez o '
            'levantamento dos dados apresentados a seguir:\n\n'
            '• Volume de produção: Gama 800; Delta 1.200\n'
            '• Volume de venda: Gama 600; Delta 1.000\n'
            '• Tempo de mão de obra direta (horas por unidade): Gama 1,5; Delta 3\n'
            '• Quantidade de materiais (quilogramas por unidade): Gama 1; Delta 1,2\n'
            '• Valor da mão de obra direta (por hora): R$ 20,00\n'
            '• Valor do material (por quilograma): R$ 40,00\n'
            '• Energia elétrica da fábrica (mensal): R$ 9.000,00\n'
            '• Aluguel da fábrica (mensal): R$ 18.000,00\n'
            '• Frete (por unidade): R$ 10,00\n'
            '• Comissão sobre vendas (por unidade): 10%\n'
            '• Salário dos administradores (mensal): R$ 25.000,00\n'
            '• Publicidade e propaganda (mensal): R$ 6.000,00\n'
            '• Depreciação de maquinário fabril (mensal): R$ 14.000,00\n\n'
            'Os preços líquidos de venda praticados pela indústria LuminaTech S.A. para os produtos Gama e Delta são, '
            'respectivamente, R$ 150,00 e R$ 200,00. Considere que a comissão sobre vendas é calculada com base no preço '
            'líquido e que não havia saldo de estoques remanescente do mês anterior. Além disso, quando há necessidade de '
            'alocar custos e despesas fixos aos objetos de custeio, a LuminaTech S.A. utiliza o volume de produção total '
            'como critério de rateio.'),
}
CTX_DE = {41: 'est', 42: 'est', 43: 'apl', 44: 'apl', 46: 'imo', 47: 'imo', 48: 'int', 49: 'int',
          51: 'prov', 52: 'prov', 53: 'pl', 54: 'pl', 75: 'lum', 76: 'lum'}

Q = {
    1: (DT, 'Repartição de Receitas Tributárias', BT1,
        'Embora o ICMS e o IPVA sejam impostos de competência estadual, partes dos produtos de suas respectivas receitas '
        'pertencem aos Municípios, por expressa previsão constitucional.\n\n'
        'De acordo com o Código Tributário Nacional, a competência para legislar sobre esses impostos é',
        ['dos Municípios, apenas em relação às obrigações acessórias a eles relacionadas.',
         'concorrente entre Estados e Municípios, apenas em relação às obrigações acessórias relacionadas aos Municípios e mediante autorização do CONFAZ.',
         'concorrente entre Estados e Municípios.', 'apenas dos Estados.',
         'apenas dos Estados, mas supletivamente dos Municípios.']),
    2: (DT, 'ICMS — Benefícios Fiscais e Convênios (LC 24/1975)', BT3,
        'Determinada reunião do CONFAZ, agendada para deliberar sobre a criação de algumas isenções do ICMS e sobre a '
        'revogação de outras, contou com a presença de apenas 20 Unidades da Federação, embora todas as unidades tenham '
        'sido regularmente convocadas. Relativamente às concessões de isenções, todas as unidades presentes votaram a favor, '
        'mas, em relação às revogações, somente 16 delas votaram favoravelmente. Diante desses fatos e da disciplina '
        'estabelecida pela Lei Complementar nº 24/1975,',
        ['não houve aprovação das deliberações concedendo isenções, nem as revogando.',
         'as deliberações dessa sessão são nulas, pois não poderia ter havido reunião, em razão da falta de quórum, visto que várias unidades federadas não se fizerem presentes à reunião.',
         'houve aprovação das deliberações revogando isenções, mas não houve aprovação das deliberações que aprovavam isenções.',
         'houve aprovação das deliberações concedendo e revogando isenções.',
         'houve aprovação das deliberações concedendo isenções, mas não houve aprovação das deliberações que revogavam isenções.']),
    3: (DT, 'Legislação Tributária', BT1,
        'De acordo com o Código Tributário Nacional, a interpretação da legislação tributária que',
        ['fixa regras referentes à ocorrência do fato gerador deve ser feita de maneira mais favorável ao contribuinte, quando houver dúvida razoável sobre a sua ocorrência ou não.',
         'define infrações, ou lhe comina penalidades, deve ser feita de maneira mais favorável ao acusado, em caso de dúvida quanto à natureza da penalidade aplicável.',
         'outorga isenção deve ser feita de maneira mais favorável ao sujeito passivo, nos casos de dúvida quanto às datas de início e de cessação do benefício.',
         'fixa prazos decadenciais deve ser feita de maneira mais favorável ao sujeito passivo, sempre que houver dúvida quanto à data de início da contagem desse prazo.',
         'estabelece disciplina acerca de substituição tributária deve ser feita de maneira mais favorável ao responsável tributário, em caso de dúvida quanto ao fato de ele revestir essa condição.']),
    4: (DT, 'ICMS — Contribuinte (LC 87/1996)', BT3,
        'De acordo com a Lei Complementar nº 87/1996, é contribuinte do ICMS a pessoa',
        ['que importe com habitualidade mercadorias do exterior, exceto quando as destinar a consumo ou ao ativo permanente do estabelecimento.',
         'jurídica que remeta mercadorias a consumidor final domiciliado em outro Estado, em relação à diferença entre a alíquota interna do Estado de destino e a alíquota interestadual, na hipótese de o destinatário ser contribuinte do imposto.',
         'jurídica que adquira em licitação mercadorias ou bens apreendidos ou abandonados, importados, sem que o desembaraço aduaneiro tenha ocorrido.',
         'que preste serviço de transporte, com início e fim dentro do mesmo Município.',
         'que adquira quaisquer lubrificantes e combustíveis sólidos, líquidos e gasosos e energia elétrica oriundos de outro Estado, quando não destinados à comercialização ou à industrialização.']),
    5: (DT, 'Legislação Tributária', BT1,
        'De acordo com o Código Tributário Nacional, os convênios sobre matéria tributária celebrados entre os Estados',
        ['são normas complementares das leis, dos tratados e das convenções internacionais e dos decretos, sendo que essas normas complementares estão compreendidas na definição de legislação tributária encontrada no referido Código.',
         'não são normas complementares das leis, dos tratados e das convenções internacionais e dos decretos, mas, depois de ratificados pelos Estados signatários, esses convênios passam a estar compreendidos na definição de legislação tributária encontrada no referido Código.',
         'são normas complementares das leis, dos tratados e das convenções internacionais e dos decretos, mas essas normas complementares não estão compreendidas na definição de legislação tributária encontrada no referido Código.',
         'não são normas complementares das leis, dos tratados e das convenções internacionais e dos decretos, embora esses convênios estejam compreendidos na definição de legislação tributária encontrada no referido Código.',
         'não são normas complementares das leis, dos tratados e das convenções internacionais e dos decretos, mas esses convênios estão compreendidos na definição de legislação tributária encontrada no referido Código.']),
    6: (DT, 'ICMS — Operações Interestaduais (LC 87/1996)', BT3,
        'A Casa Praiana, localizada em Parnaíba/PI, tem como única atividade a extração de fotocópias para sua clientela. '
        'Para poder prestar esse serviço, ela adquire de fornecedor localizado em João Pessoa/PB as caixas do papel de que '
        'necessita. Tendo em conta esses fatos e a disciplina estabelecida pela Lei Complementar nº 87/1996, nas aquisições '
        'de papel feitas pela Casa Praiana, o ICMS',
        ['referente à operação interestadual é devido ao Estado da Paraíba, tendo como contribuinte o remetente paraibano, enquanto o diferencial entre a alíquota interna piauiense e a interestadual é devido ao Estado do Piauí, tendo como contribuinte o remetente paraibano.',
         'é devido integralmente ao Estado do Piauí, mediante aplicação da alíquota interna prevista na lei estadual piauiense para as operações com essa mercadoria, e o contribuinte é o destinatário piauiense.',
         'é devido integralmente ao Estado da Paraíba, mediante aplicação da alíquota interna prevista na lei estadual paraibana para as operações com essa mercadoria, e o contribuinte é o remetente paraibano.',
         'referente à operação interestadual é devido ao Estado da Paraíba, tendo como contribuinte o remetente paraibano, enquanto o diferencial entre a alíquota interna piauiense e a interestadual é devido ao Estado do Piauí, tendo como contribuinte o destinatário piauiense.',
         'é devido integralmente ao Estado do Piauí, mediante aplicação da alíquota interna prevista na lei estadual piauiense para as operações com essa mercadoria, e o contribuinte é o remetente paraibano.']),
    7: (DT, 'IBS — Imposto sobre Bens e Serviços', BT4,
        'A Emenda Constitucional nº 132/2023, referente à reforma tributária, atribuiu competência para a instituição do IBS '
        'e da CBS. De acordo com essa Emenda, o imposto sobre bens e serviços',
        ['incidirá nas prestações de serviço de comunicação nas modalidades de radiodifusão sonora e de sons e imagens de recepção livre e gratuita, a partir de 1º de janeiro de 2033.',
         'não incidirá sobre as exportações, exceto nos casos em que a mercadoria exportada se destine ao consumidor final ou à integração no ativo permanente do destinatário.',
         'terá alíquota própria fixada pelo ente federativo por meio de lei específica, e essa alíquota será a mesma para todas as operações com bens materiais ou imateriais, inclusive direitos, ou com serviços, ressalvadas as hipóteses previstas na Constituição Federal de 1988.',
         'incidirá também sobre a importação de bens materiais ou imateriais, inclusive direitos, ou importação de serviços realizada exclusivamente por pessoa jurídica, e desde que seja sujeito passivo habitual do imposto.',
         'terá legislação única e uniforme em todo o território nacional, exceto em relação a operações internas com energia elétrica e petróleo, inclusive lubrificantes e combustíveis líquidos e gasosos dele derivados, a partir de 1º de janeiro de 2026.']),
    8: (DT, 'Extinção do Crédito Tributário', BT2,
        'No início de janeiro de 2025, Joel efetuou o pagamento integral do IPVA devido em relação a veículo automotor de sua '
        'propriedade. De acordo com o Código Tributário Nacional, em decorrência do pagamento efetuado',
        ['não se extinguiu a obrigação tributária, nem o crédito tributário dela decorrente.',
         'extinguiu-se o lançamento, mas não se extinguiu a obrigação tributária, nem o crédito tributário.',
         'extinguiu-se o crédito tributário, mas não se extinguiu a obrigação tributária que deu origem a esse crédito.',
         'extinguiu-se a obrigação tributária, mas não se extinguiu o crédito tributário dela decorrente.',
         'extinguiu-se o crédito tributário, bem como a obrigação tributária que deu origem a esse crédito.']),
    9: (DT, 'Simples Nacional', BT4,
        'Durante os trabalhos de fiscalização no estabelecimento da microempresa JJ&WW, optante pelo Simples Nacional, '
        'Emanuel, autoridade fiscal estadual, deparou com a existência de fortes indícios de omissão de receita nesse '
        'estabelecimento, mas ficou na dúvida sobre a possibilidade de aplicação de presunções previstas na legislação. De '
        'acordo com as informações fornecidas e a disciplina estabelecida pela Lei Complementar nº 123/2006, Emanuel',
        ['poderá aplicar aos estabelecimentos de microempresa e de empresa de pequeno porte apenas as presunções de omissão de receita previstas em Resolução do Comitê Gestor do Simples Nacional.',
         'poderá aplicar a esse estabelecimento de microempresa todas as presunções de omissão de receita existentes nas legislações de regência dos impostos e contribuições incluídos no Simples Nacional.',
         'poderá aplicar todas as presunções de omissão de receita existentes nas legislações de regência dos impostos e contribuições incluídos no Simples Nacional, mas apenas aos estabelecimentos de empresa de pequeno porte.',
         'não poderá aplicar as presunções de omissão de receita existentes nas legislações de regência dos impostos e contribuições incluídos no Simples Nacional aos estabelecimentos de microempresa, nem aos estabelecimentos de empresa de pequeno porte.',
         'poderá aplicar apenas as presunções de omissão de receita previstas em Resolução do Comitê Gestor do Simples Nacional, e essa aplicação só poderá ser feita em relação aos estabelecimentos de empresa de pequeno porte.']),
    10: (DT, 'Infrações e Penalidades', BT2,
         'Relativamente ao ITCMD, a Assembleia Legislativa de determinado Estado aprovou lei ordinária cominando penalidades '
         'menos severas para os infratores da legislação desse tributo do que as penalidades previstas na lei vigente ao '
         'tempo das práticas infracionais. De acordo com o Código Tributário Nacional, a nova lei',
         ['não será aplicada aos atos pretéritos, quando se tratar de hipótese de reincidência.',
          'será aplicada aos atos futuros e, em relação aos atos pretéritos, desde que esse ato tenha sido definitivamente julgado em desfavor do sujeito passivo.',
          'será aplicada, em qualquer caso, aos atos futuros e pretéritos.',
          'será aplicada, em relação aos atos pretéritos, desde que esse ato não tenha sido definitivamente julgado.',
          'não será aplicada aos atos pretéritos, se o sujeito passivo tiver agido com dolo, fraude ou simulação.']),
    11: (DT, 'ICMS — Local da Operação (LC 87/1996)', BT3,
         'Determinada empresa atacadista, localizada em Teresina/PI, comprou de indústria baiana, localizada em Salvador/BA, '
         '500 aparelhos de televisão, que foram, por ordem do adquirente teresinense, remetidos para armazém geral localizado '
         'na cidade de Fortaleza/CE, e lá depositados em nome do estabelecimento teresinense. Uma semana depois, o referido '
         'estabelecimento teresinense efetuou a venda de 100 aparelhos para empresa varejista localizada em Aracaju/SE, sendo '
         'que os referidos aparelhos foram remetidos diretamente do armazém geral fortalezense para o estabelecimento '
         'varejista aracajuano, sem transitar pelo estabelecimento teresinense vendedor da mercadoria.\n\n'
         'De acordo com a Lei Complementar nº 87/1996, o ICMS incidente sobre a operação interestadual de venda dos 100 '
         'aparelhos de televisão',
         ['não é devido a nenhum Estado, porque a mercadoria não transitou pelo estabelecimento vendedor.',
          'é devido ao Estado da Bahia.', 'é devido ao Estado de Sergipe.', 'é devido ao Estado do Piauí.',
          'é devido ao Estado do Ceará.']),
    12: (DT, 'Legislação Tributária', BT1,
         'De acordo com o Código Tributário Nacional,',
         ['a majoração de tributos deve ser feita por meio de lei complementar, mas sua redução pode ser feita por meio de lei ordinária.',
          'a instituição de taxas municipais deve ser feita apenas por meio de lei complementar, mas sua extinção pode se feita por meio de lei ordinária.',
          'a definição do fato gerador da obrigação tributária principal referente à contribuição de melhoria deve ser feita por meio de lei complementar federal, por expressa previsão constitucional.',
          'a cominação de penalidades para as ações ou omissões contrárias a seus dispositivos deve estar prevista no decreto que regulamentar cada tributo.',
          'as hipóteses de exclusão, suspensão e extinção de créditos tributários estaduais devem ser estabelecidas por meio de lei.']),
    13: (DT, 'IBS — Imposto sobre Bens e Serviços', BT4,
         'De acordo com a Lei Complementar nº 214/2025, a instância máxima de deliberação do CGIBS é o seu Conselho Superior. '
         'Na composição do citado Conselho Superior do CGIBS,',
         ['um terço dos membros que representam os Municípios serão indicados por meio de deliberação do Senado Federal.',
          'os membros que representam os Estados e o Distrito Federal serão indicados pelo Chefe do Poder Executivo de cada Estado e do Distrito Federal, respectivamente.',
          '81 membros e respectivos suplentes representam o conjunto dos Municípios e o Distrito Federal.',
          'dois terços dos membros que representam os Municípios serão indicados pelos Secretários de Fazenda ou de Finanças dos Municípios mais populosos do Brasil.',
          '28 membros e respectivos suplentes representam cada um dos 26 Estados brasileiros, o Distrito Federal e a União.']),
    14: (DT, 'Obrigação Tributária', BT2,
         'De acordo com a disciplina do Código Tributário Nacional, a sanção de natureza pecuniária (penalidade pecuniária), '
         'aplicável ao sujeito passivo em decorrência da inobservância de obrigação acessória,',
         ['não é tributo, mas é objeto de lançamento tributário.', 'tem a mesma natureza das taxas e, portanto, é tributo.',
          'é tributo, mas não é objeto de lançamento tributário.', 'não é tributo, nem é objeto de lançamento tributário.',
          'é tributo e é objeto de lançamento tributário.']),
    15: (DT, 'Responsabilidade Tributária', BT2,
         'De acordo com a disciplina do Código Tributário Nacional, é pessoalmente responsável pelos tributos devidos pelo '
         'de cujus até a data da partilha ou adjudicação',
         ['o inventariante, ilimitadamente, quando ele não for herdeiro, nem legatário.',
          'o herdeiro legítimo, limitada essa responsabilidade a 50% do quinhão recebido e, se ele também for legatário, a 50% do valor do legado recebido.',
          'o cônjuge meeiro, limitada essa responsabilidade ao montante da meação.',
          'o herdeiro testamentário, limitada essa responsabilidade a 50% do legado recebido.',
          'o cônjuge herdeiro, ilimitadamente.']),
    41: (CTB, 'BP — Estoques', BK2,
         'O saldo contábil da conta Estoques, após a venda e entrega das mercadorias vendidas, registrado no Balanço '
         'Patrimonial de 31/12/2022 da empresa Compra e Venda S.A., especificamente em relação às mercadorias citadas, era',
         ['R$ 52.000,00', 'R$ 60.000,00', 'R$ 64.000,00', 'R$ 56.000,00', 'R$ 62.000,00']),
    42: (CTB, 'BP — Estoques', BK2,
         'O valor do Custo das Mercadorias Vendidas registrado no resultado de 2022 da empresa Compra e Venda S.A., '
         'especificamente em relação à venda das mercadorias citadas, foi',
         ['R$ 248.000,00', 'R$ 208.000,00', 'R$ 240.000,00', 'R$ 256.000,00', 'R$ 224.000,00']),
    43: (CTB, 'CPC 48 — Instrumentos Financeiros', BK4,
         'O valor total registrado no Balanço Patrimonial de 31/12/2024 da empresa Rentabilizando S.A., especificamente em '
         'relação às duas aplicações financeiras realizadas em 01/12/2024 foi',
         ['R$ 709.200,00', 'R$ 700.000,00', 'R$ 705.600,00', 'R$ 714.000,00', 'R$ 710.400,00']),
    44: (CTB, 'CPC 48 — Instrumentos Financeiros', BK4,
         'Na Demonstração do Resultado do ano de 2024 da empresa Rentabilizando S.A., o valor total registrado, '
         'especificamente em relação às duas aplicações financeiras realizadas em 01/12/2024 foi',
         ['R$ 9.200,00', 'R$ 5.600,00', 'R$ 19.600,00', 'R$ 14.000,00', 'R$ 10.400,00']),
    45: (CTB, 'CPC 18 — Equivalência Patrimonial', BK4,
         'A empresa Investidora S.A. possui 80% das ações da empresa Dependente S.A. e detém o seu controle. O investimento é '
         'avaliado pelo Método da Equivalência Patrimonial e estava registrado em 31/12/2020 no Balanço Patrimonial da '
         'Investidora S.A. pelo valor de R$ 40.000.000,00.\n\n'
         'No período de 01/01/2021 a 31/12/2021, a empresa Dependente S.A. reconheceu as seguintes mutações em seu '
         'Patrimônio Líquido:\n\n'
         '• Lucro líquido apurado em 2021: R$ 5.000.000,00\n'
         '• Pagamento de dividendos relativos ao resultado apurado em 2020: R$ 1.200.000,00\n'
         '• Proposta de dividendos referentes ao ano de 2021: R$ 2.000.000,00\n\n'
         'Se, à época da aquisição do investimento, não houve pagamento de ágio nem ganho por compra vantajosa, o valor '
         'líquido evidenciado na Demonstração do Resultado do ano de 2021 da empresa Investidora S.A., referente à sua '
         'participação na empresa Dependente S.A., foi',
         ['R$ 3.040.000,00', 'R$ 1.440.000,00', 'R$ 5.000.000,00', 'R$ 2.400.000,00', 'R$ 4.000.000,00']),
    46: (CTB, 'BP — Ativo Imobilizado e Depreciação', BK2,
         'O valor da despesa de depreciação registrado pela empresa Produtora Integral S.A. no resultado de 2023 foi',
         ['R$ 100.000,00', 'R$ 125.000,00', 'R$ 216.000,00', 'R$ 270.000,00', 'R$ 220.000,00']),
    47: (CTB, 'BP — Ativo Imobilizado e Depreciação', BK2,
         'O saldo contábil do equipamento evidenciado no Balanço Patrimonial de 31/12/2023 da Produtora Integral S.A. foi',
         ['R$ 1.212.500,00', 'R$ 1.250.000,00', 'R$ 1.830.000,00', 'R$ 1.755.000,00', 'R$ 1.836.000,00']),
    48: (CTB, 'CPC 01 — Impairment', BK4,
         'O valor contábil líquido apresentado para esse ativo intangível pela empresa Só Aparência S.A., no Balanço '
         'Patrimonial de 31/12/2022, foi',
         ['R$ 3.300.000,00', 'R$ 3.875.000,00', 'R$ 2.750.000,00', 'R$ 3.500.000,00', 'R$ 3.625.000,00']),
    49: (CTB, 'CPC 01 — Impairment', BK4,
         'O valor total registrado pela empresa Só Aparência S.A. no resultado de 2022 relacionado com o ativo intangível foi',
         ['R$ 125.000,00', 'R$ 375.000,00', 'R$ 1.125.000,00', 'R$ 250.000,00', 'R$ 575.000,00']),
    50: (CTB, 'CPC 48 — Instrumentos Financeiros', BK4,
         'Um empréstimo, com as características apresentadas a seguir, foi obtido pela empresa Endividada S.A.:\n\n'
         '• Data da obtenção do empréstimo: 30/11/2020\n'
         '• Valor bruto do empréstimo: R$ 50.000.000,00\n'
         '• Prazo total do contrato: 8 anos\n'
         '• Taxa de juros compostos contratada: 0,95% ao mês\n'
         '• Forma de pagamento: parcelas mensais de mesmo valor\n'
         '• Valor das parcelas mensais: R$ 796.249,10\n'
         '• Valor dos custos de transação incorridos: R$ 1.008.621,87\n\n'
         'Os custos de transação foram pagos na data de início do contrato e a taxa de custo efetivo do empréstimo foi 1% ao '
         'mês.\n\nEm relação a esse empréstimo é correto afirmar que:',
         ['o valor dos encargos financeiros registrados na demonstração do resultado de 2020 foi R$ 500.000,00.',
          'o valor dos encargos financeiros registrados na demonstração do resultado de 2020 foi R$ 796.249,10.',
          'o saldo total apresentado nas contas de passivo (circulante e não circulante) no Balanço Patrimonial de 31/12/2020 foi R$ 48.685.042,81.',
          'o valor dos encargos financeiros registrados na demonstração do resultado de 2020 foi R$ 475.000,00.',
          'o saldo total apresentado para as contas de passivo (circulante e não circulante) no Balanço Patrimonial de 31/12/2020 foi R$ 49.703.750,90.']),
    51: (CTB, 'CPC 25 — Provisões e Contingências', BK4,
         'Com base nas informações apresentadas e exclusivamente em relação aos processos analisados, o saldo evidenciado no '
         'Balanço Patrimonial de 31/12/2023 da empresa Problemas Gerais S.A. foi',
         ['R$ 1.920.000,00', 'R$ 1.020.000,00', 'R$ 3.120.000,00', 'R$ 3.600.000,00', 'R$ 2.940.000,00']),
    52: (CTB, 'CPC 25 — Provisões e Contingências', BK4,
         'Com base nas informações apresentadas e exclusivamente em relação aos processos analisados, o impacto reconhecido '
         'no resultado de 2023 da empresa Problemas Gerais S.A. foi',
         ['um ganho de R$ 180.000,00', 'uma perda de R$ 180.000,00', 'uma perda de R$ 720.000,00',
          'um ganho de R$ 480.000,00', 'um ganho de R$ 900.000,00']),
    53: (CTB, 'BP — PL, Parte II', BK2,
         'O valor total do Patrimônio Líquido que deveria ser apresentado no Balanço Patrimonial de 31/12/2023 da empresa '
         'Importadora de Tecidos S.A. era',
         ['R$ 73.512.000,00', 'R$ 74.456.000,00', 'R$ 74.160.000,00', 'R$ 73.584.000,00', 'R$ 74.592.000,00']),
    54: (CTB, 'BP — PL, Parte II', BK2,
         'O valor dos dividendos que deveria ser apresentado no passivo, no Balanço Patrimonial de 31/12/2023 da empresa '
         'Importadora de Tecidos S.A., era',
         ['R$ 7.848.000,00', 'R$ 7.344.000,00', 'R$ 8.208.000,00', 'R$ 8.640.000,00', 'R$ 7.776.000,00']),
    55: (CTB, 'DVA — Valor Adicionado', BK3,
         'A Demonstração do Resultado do ano de 2023 de uma empresa apresentava os seguintes valores, expressos em reais:\n\n'
         '• Receita Bruta de Vendas: 4.800.000,00\n'
         '• (−) Impostos sobre vendas: (1.100.000,00)\n'
         '• (=) Receita Líquida: 3.700.000,00\n'
         '• (−) Custo das Mercadorias Vendidas: (1.500.000,00)\n'
         '• (=) Lucro Bruto: 2.200.000,00\n'
         '• (−) Despesas operacionais: despesa com pessoal (200.000,00); INSS sobre salários – parcela da empresa '
         '(40.000,00); FGTS sobre salários (16.000,00); despesa de depreciação (350.000,00)\n'
         '• (=) Lucro antes do IR e CSLL: 1.594.000,00\n'
         '• (−) IR e CSLL: (354.000,00)\n'
         '• (=) Lucro Líquido: 1.240.000,00\n\n'
         'O valor dos tributos recuperáveis referentes ao estoque dos produtos que foram vendidos em 2023 foi R$ 270.000,00.\n\n'
         'O valor adicionado líquido gerado pela empresa no ano de 2023 foi',
         ['R$ 1.580.000,00', 'R$ 1.240.000,00', 'R$ 2.680.000,00', 'R$ 3.030.000,00', 'R$ 2.950.000,00']),
    56: (FIN, 'Orçamento Público: Conceito, Técnicas e Natureza Jurídica', BF1,
         'Suponha que em um contrato de parceria público-privada, no qual a legislação de regência permite o oferecimento de '
         'garantia pela Administração, esta tenha ofertado em garantia ao privado a receita decorrente de créditos não '
         'tributários objeto de parcelamento administrativo. Tal previsão foi contestada pelos órgãos de controle, com base no '
         'princípio da não afetação ou não vinculação, dado que tais créditos foram considerados na previsão de receitas que '
         'embasou a Lei Orçamentária Anual. Referido entendimento afigura-se juridicamente',
         ['correto, eis que somente por lei específica pode haver vinculação em garantia a particulares de produto de impostos e de outros créditos não tributários.',
          'correto, dado que a vinculação de produto de impostos e outros créditos não tributários somente pode ser feita como garantia e meio de pagamento à União.',
          'equivocado, eis que tal princípio veda a vinculação de produto de imposto a órgão ou fundo, não se aplicando a outras receitas orçamentárias.',
          'correto, eis que o princípio em questão veda qualquer destinação vinculada de receita orçamentária ou de projeção de receita futura.',
          'equivocado, eis que tal princípio veda apenas a vinculação em garantia de produto de tributos, incluindo impostos, taxas e contribuições.']),
    57: (FIN, 'Orçamento Público: Conceito, Técnicas e Natureza Jurídica', BF1,
         'O princípio do orçamento bruto, como um dos princípios que informam a elaboração dos orçamentos públicos, '
         'estabelece, como regra geral, que',
         ['apenas as deduções relativas a transferências obrigatórias e contribuições ao regime de previdência são admitidas como redutoras das receitas que serão destinadas à cobertura de tais finalidades, estas que devem ser computadas na Lei Orçamentária Anual pelo valor líquido.',
          'as receitas e despesas devem constar na lei orçamentária sem deduções, de forma que o valor de arrecadação dos impostos estaduais deve ser computado integralmente, sendo lançado como despesa o montante relativo à participação dos municípios.',
          'as receitas obtidas com alienação de ativos devem ser registradas no orçamento de acordo com a previsão estabelecida na lei que autorizou a alienação, independentemente do valor efetivo de venda, líquida apenas das contribuições e taxas incidentes sobre a operação.',
          'as despesas com pessoal e custeio da Administração direta e indireta, incluindo empresas dependentes e não dependentes de recursos do Tesouro, deverão estar previstas na lei orçamentária, sendo consideradas para efeito de verificação do limite máximo de despesas com pessoal do ente.',
          'os créditos especiais, incluídos os adicionais e os suplementares e excluídos apenas os extraordinários, devem constar, de forma global, da Lei de Diretrizes Orçamentárias como condição necessária para sua previsão individualizada na Lei Orçamentária Anual.']),
    58: (FIN, 'Orçamento Público: Conceito, Técnicas e Natureza Jurídica', BF1,
         'No que concerne aos tipos de orçamento público apontados pela doutrina, tem-se, que ao adotar a opção de um '
         'orçamento do tipo base zero,',
         ['verifica-se um significativo aumento das despesas discricionárias, na medida em que tal modelo importa a desvinculação total de receitas com destinação específica.',
          'passa a ser obrigatória a prévia submissão da proposta orçamentária à participação popular, mediante consulta pública, sob pena de nulidade.',
          'assume-se o compromisso de equilíbrio orçamentário, não sendo admissível previsão ou a ocorrência de déficit ao final do exercício.',
          'abandona-se a abordagem incremental, deixando de considerar como base da orçamentação o histórico de receitas e despesas de exercícios anteriores.',
          'a Lei de Diretrizes Orçamentárias (LDO) perde a sua funcionalidade, na medida em que a Lei Orçamentária Anual passa a ser desvinculada de metas ou parâmetros fixados na LDO.']),
    59: (FIN, 'LRF Parte I: Introdução, Disposições Preliminares e Planejamento', BF4,
         'A ação planejada e transparente, em que se previnem riscos e se corrigem desvios capazes de afetar o equilíbrio das '
         'contas públicas, informa o Anexo de Riscos Fiscais, este que',
         ['integra a Lei de Diretrizes Orçamentárias, devendo nele constar as providências a serem tomadas, caso se materializem os passivos contingentes e os demais riscos fiscais nele elencados.',
          'estabelece os critérios e percentuais de limitação de empenho (contingenciamento) no exercício a que se refere, no caso de não atingimento das metas de arrecadação nele estabelecidas.',
          'deve ser elaborado e publicado a cada dois anos, servindo como elemento balizador das propostas de lei orçamentária anual que serão apresentadas nos respectivos exercícios subsequentes.',
          'deve acompanhar o Plano Plurianual, indicando a probabilidade de atingimento ou não das metas de resultado nominal e primário projetadas para os próximos quatro exercícios.',
          'constitui elemento obrigatório da Lei Orçamentária Anual, indicando os eventos que poderão ser cobertos mediante a utilização da Reserva de Contingência no montante estabelecido na Lei de Diretrizes Orçamentárias.']),
    60: (FIN, 'LRF Parte II: Despesa Pública, DOCC e Despesas com Pessoal', BF4,
         'Suponha que, no último quadrimestre do mandato do Chefe do Executivo, tenha ocorrido o empenho e a liquidação de '
         'diversas despesas relativas à execução de obras públicas, sem que os respectivos pagamentos tenham ocorrido até o '
         'final do correspondente exercício, efetuando-se a inscrição de tais despesas em restos a pagar. De acordo com a '
         'disciplina estabelecida na legislação de regência em relação à geração e execução de despesas públicas, tal '
         'procedimento afigura-se',
         ['ilícito, eis que, independentemente da circunstância temporal narrada, todas as despesas devem ser pagas no exercício em que foram empenhadas.',
          'potencialmente ilícito, pois, a depender do percentual de despesas inscritas como restos a pagar, será configurado crime de responsabilidade, independentemente de suficiência de caixa para pagamento.',
          'irregular, eis que a lei veda expressamente a geração e inscrição de restos a pagar nos dois últimos quadrimestres do mandato do Chefe do Executivo, salvo em situação de calamidade pública.',
          'lícito, desde que comprovada a existência de disponibilidade de caixa suficiente para o pagamento das despesas contraídas no exercício.',
          'admissível apenas em se tratando de restos a pagar não processados, ou seja, nos quais o ciclo de liquidação ainda não tenha se completado por razões de força maior.']),
    61: (FIN, 'Créditos Ordinários e Adicionais', BF2,
         'Suponha que em uma situação de calamidade pública declarada em determinado município em função de evento climático '
         'extremo, tenha se mostrado necessária a abertura de crédito extraordinário para cobertura de despesas urgentes e '
         'imprevistas. De acordo com a disciplina constitucional e legal aplicável, tal medida',
         ['somente pode ser adotada se houver excesso de arrecadação no montante necessário para cobertura do crédito a ser aberto.',
          'depende do cancelamento de despesa orçamentária no mesmo montante do crédito extraordinário a ser instituído.',
          'independe de lei em sentido formal e da indicação da fonte de custeio para suportar o respectivo crédito.',
          'pode ser tomada mediante a edição de medida provisória, desde que indicada a fonte de custeio.',
          'prescinde da indicação de fonte de custeio, mas demanda a edição de lei, não podendo a abertura ocorrer por ato do Chefe do Executivo.']),
    62: (FIN, 'LRF Parte II: Despesa Pública, DOCC e Despesas com Pessoal', BF4,
         'Dentre os requisitos para geração de despesas públicas, as despesas obrigatórias de caráter continuado',
         ['sujeitam-se aos mesmos requisitos legais estabelecidos para geração das demais despesas, salvo no que concerne à previsão na Lei Orçamentária Anual, dado que são suportadas por créditos adicionais.',
          'constituem despesas de capital, na forma de investimentos ou inversões financeiras, afastando-se o enquadramento de despesas de pessoal ou custeio em geral em tal categoria legal.',
          'constituem despesas extraorçamentárias, dado que ultrapassam a vigência da Lei Orçamentária Anual, sendo necessária a previsão expressa na Lei de Diretrizes Orçamentárias e, se superiores a 3 exercícios, no Plano Plurianual.',
          'equiparam-se à renúncia de receitas, devendo seus efeitos financeiros ser compensados pelo aumento permanente de receita nos exercícios subsequentes, observada a margem de crescimento estabelecida no Plano Plurianual.',
          'devem cumprir requisitos específicos, entre os quais a comprovação de que não serão afetadas as metas de resultados fiscais previstas no anexo próprio que integra a Lei de Diretrizes Orçamentárias.']),
    63: (FIN, 'Receita Pública: Conceito, Classificações e Fontes', BF3,
         'As receitas ou ingressos públicos comportam diferentes categorizações, entre as quais a que diferencia receitas',
         ['derivadas, obtidas a partir da exploração de bens públicos, e primárias, obtidas a partir da arrecadação fiscal e alienação de bens.',
          'originárias e derivadas, sendo estas últimas obtidas a partir do exercício do poder de império do Estado, tal qual a arrecadação de impostos e outros tributos.',
          'ordinárias, correspondentes àquelas previstas na Lei de Diretrizes Orçamentárias, e extraordinárias, que destinam-se exclusivamente à cobertura de déficit fiscal.',
          'orçamentárias e extraorçamentárias, conforme sejam arrecadadas compulsoriamente ou a partir da prestação de serviços públicos.',
          'correntes e de capital, sendo as primeiras obtidas a partir da arrecadação de tributos e alienação de ativos e as segundas mediante operações de crédito.']),
    64: (FIN, 'Orçamento Público: Conceito, Técnicas e Natureza Jurídica', BF1,
         'O princípio orçamentário da universalidade está ligado à ideia de que o orçamento deve conter todas as receitas e '
         'todas as despesas,',
         ['excluídas as receitas próprias dos Poderes Judiciário, Legislativo, Tribunais de Contas, Ministério Público e Defensoria Pública, eis que dotados de autonomia orçamentária.',
          'exceto as despesas correspondentes à aplicação mínima em saúde e educação e receitas com destinação constitucionalmente estabelecida, tal como aquelas relativas à seguridade social.',
          'excluídos os valores arrecadados que não pertencem ao ente, tais como cauções, consideradas receitas extraorçamentárias.',
          'incluindo as receitas oriundas de transferências constitucionais, porém excluídos os royalties e subvenções.',
          'devendo ser cotejado com o princípio da anualidade, de forma que os tributos não serão considerados receita do exercício de sua instituição, ainda que neste arrecadados.']),
    65: (FIN, 'LRF Parte I: Introdução, Disposições Preliminares e Planejamento', BF4,
         'A Receita Corrente Líquida (RCL) auferida pela União, Estados, Municípios e Distrito Federal constitui base de '
         'cálculo para diferentes limites estabelecidos pela Lei de Responsabilidade Fiscal e por outras normas, tais como o '
         'limite de gastos com pessoal e de endividamento público. De acordo com o ordenamento jurídico, a RCL dos Estados é '
         'aferida considerando-se algumas deduções, entre as quais:',
         ['os montantes recebidos pelo Estado a título de participação no produto da arrecadação de impostos da União.',
          'as receitas auferidas pelas empresas controladas pelo Estado, dependentes ou não de recursos do Tesouro.',
          'o percentual de participação dos Municípios no produto dos impostos estaduais estabelecido por determinação constitucional.',
          'o montante relativo à arrecadação de receitas provenientes do pagamento de contribuições e taxas.',
          'o índice de inflação estabelecido na Lei de Diretrizes Orçamentárias, aplicado como redutor da receita de impostos arrecadada no exercício.']),
    66: (FIN, 'LRF Parte III: Transparência, Controle, Gestão Patrimonial e Transferências', BF4,
         'O princípio da Unidade de Caixa ou de Tesouraria, aplicável a todos os entes da Federação por imposição '
         'constitucional, estabelece a',
         ['vedação à fragmentação do recolhimento de receitas mediante a criação de caixas especiais, admitindo-se a criação, por lei, de fundos especiais de despesa.',
          'vedação de aplicação das disponibilidades de caixa dos Estados e dos Municípios em títulos da dívida pública emitidos pela União.',
          'possibilidade de utilização de instituição financeira oficial não estatal apenas para depósito de vencimentos e proventos, vedado o depósito de outras disponibilidades de caixa do Tesouro.',
          'obrigatoriedade de recolhimento das contribuições do regime de previdência junto à conta única do Tesouro.',
          'obrigação de manter todas as disponibilidades de caixa dos entes federados junto ao Banco Central ou aplicadas em instituição financeira controlada pela União.']),
    67: (FIN, 'LRF Parte I: Introdução, Disposições Preliminares e Planejamento', BF4,
         'Como instrumento para assegurar uma gestão fiscal responsável, planejada e transparente, o Anexo de Metas Fiscais',
         ['integra a Lei de Diretrizes Orçamentárias e contempla, entre outros elementos, demonstrativo da margem de expansão das despesas obrigatórias de caráter continuado.',
          'deve contemplar as medidas de renúncia fiscal para os próximos quatro exercícios, integrando a Lei de Diretrizes Orçamentárias e o Plano Plurianual relativo ao respectivo período.',
          'integra a Lei Orçamentária Anual e estabelece os critérios para limitação de empenho no curso do exercício, aplicáveis apenas ao Poder Executivo, incluindo autarquias, empresas públicas dependentes e fundações públicas.',
          'informa a elaboração da Lei Orçamentária Anual, fixando os limites de endividamento público do ente, o qual deve ser considerado no curso do exercício financeiro correspondente.',
          'deve, necessariamente, estabelecer meta de superávit orçamentário-fiscal superior àquela estabelecida para o exercício antecedente, de forma alinhada com os indicadores estabelecidos no Plano Plurianual.']),
    68: (FIN, 'Receita Pública: Conceito, Classificações e Fontes', BF3,
         'No que concerne às características básicas da estrutura orçamentária e apuração de resultados do exercício, tem-se '
         'que as receitas',
         ['industriais, agropecuárias e obtidas a partir da cobrança de tarifas ou preço público são classificadas como receitas de capital, dado que oriundas da exploração do patrimônio estatal.',
          'classificadas como financeiras, tais como as decorrentes de operações de crédito e juros sobre aplicações financeiras, não são computadas na apuração do resultado primário.',
          'provenientes de financiamento obtido junto à União ou perante instituição financeira federal ou organismo multilateral são consideradas inversões financeiras.',
          'correntes, tais como aquelas obtidas com a arrecadação de impostos, somente podem ser aplicadas em despesas correntes, incluindo pessoal e custeio em geral.',
          'oriundas de transferências e subvenções são consideradas extraorçamentárias e não são computadas na apuração do superávit do exercício.']),
    69: (FIN, 'LRF Parte III: Transparência, Controle, Gestão Patrimonial e Transferências', BF4,
         'Suponha que o Estado tenha procedido à alienação de diversos imóveis públicos não afetados à finalidade pública, '
         'gerando excesso de arrecadação e que pretenda utilizar tal fonte para aplicação em diferentes finalidades. De acordo '
         'com a disciplina aplicável às receitas públicas e à geração de despesas, tem-se que',
         ['se deve observar a denominada “regra de ouro”, de acordo com a qual tais receitas não podem ser destinadas a quaisquer despesas que envolvam inativos e obrigações previdenciárias do ente.',
          'apenas excepcionalmente tais receitas poderão ser destinadas ao custeio de despesas de pessoal ativo e inativo, mediante autorização legal específica e observados os limites fixados na Lei de Diretrizes Orçamentárias.',
          'se trata de receita corrente extraordinária, passível de aplicação em despesas correntes, vedada a destinação a novos investimentos e inversões financeiras que ultrapassem o exercício orçamentário.',
          'somente é admissível a utilização de tais receitas para abertura de créditos adicionais, destinados a despesas de capital ou custeio, vedada a aplicação em despesas correntes de pessoal.',
          'é vedada a destinação das referidas receitas para o financiamento de despesa corrente, salvo se destinada por lei aos regimes de previdência social, geral e próprio dos servidores públicos.']),
    70: (FIN, 'Estágios da Receita e da Despesa', BF3,
         'A sistemática legal aplicável às receitas e despesas públicas estabelece, como regra, o regime de caixa para as '
         'receitas e o regime de competência para as despesas, não obstante tratamento específico para determinadas '
         'situações, de molde que',
         ['as receitas obtidas a partir de operação de Antecipação de Receita Orçamentária (ARO) no exercício em curso pertencem a exercícios posteriores e, portanto, integram a dívida consolidada do ente.',
          'a despesa que tenha sido empenhada no exercício de 2024, inscrita em restos a pagar não processados, liquidada e paga em 2025, é considerada despesa orçamentária no exercício do pagamento (2025).',
          'as receitas destinadas ao pagamento de restos a pagar pertencem ao exercício financeiro do pagamento e as despesas correspondentes devem ser computadas como extraorçamentárias no exercício do empenho.',
          'a despesa resultante de compromissos assumidos em 2024, sem que tenha havido empenho em tal ano e cujo pagamento ocorra em 2025, será computada como Despesa de Exercícios Anteriores (DEA).',
          'as despesas que impactam mais de um exercício financeiro devem ser computadas integralmente no exercício em que a obrigação geradora foi assumida, ainda que haja pagamentos devidos nos exercícios subsequentes.']),
    71: (CTB, 'Contabilidade de Custos — Ponto de Equilíbrio', BK5,
         'A empresa XYZ Ltda. fabrica e vende camisetas personalizadas por meio de encomendas on-line. O preço líquido de '
         'venda de cada camiseta é de R$ 50,00. Os custos e despesas incorridos pela empresa podem ser estruturados da '
         'seguinte forma:\n\n'
         '• Matéria-prima (por unidade): R$ 8,00\n'
         '• Mão de obra direta (por unidade): R$ 10,00\n'
         '• Frete para entrega ao cliente (por unidade): R$ 5,00\n'
         '• Aluguel do período: R$ 9.000,00\n'
         '• Energia elétrica do período: R$ 2.660,00\n'
         '• Depreciação do período: R$ 3.240,00\n'
         '• Despesas fixas do período: R$ 4.000,00\n\n'
         'Os gastos incorridos com aluguel, energia elétrica e depreciação dizem respeito ao ambiente de produção e aos '
         'equipamentos presentes nele e destinados a essa finalidade. A gestão da empresa estabeleceu como meta que o lucro '
         'líquido do período seja de R$ 13.500,00. Para isso, a empresa XYZ Ltda. precisa produzir e vender, aproximadamente,',
         ['1.013 unidades.', '580 unidades.', '1.080 unidades.', '1.200 unidades.', '700 unidades.']),
    72: (CTB, 'Contabilidade de Custos — Custeio por Absorção', BK5,
         'A empresa Nexora S.A. produz dois modelos de equipamentos eletrônicos: Alfa e Beta. A fim de analisar o retorno que '
         'cada um desses modelos estava trazendo à empresa, o departamento de contabilidade fez o seguinte levantamento de '
         'dados em dezembro de 2024:\n\n'
         '• Modelo Alfa: preço de venda bruto R$ 300,00 por unidade; demanda de 800 unidades/mês\n'
         '• Modelo Beta: preço de venda bruto R$ 260,00 por unidade; demanda de 700 unidades/mês\n\n'
         'Além disso, os padrões físicos de mão de obra direta e de materiais por unidade de produto são:\n\n'
         '• Modelo Alfa: 1,3 unidade de material; 0,5 hora de MOD\n'
         '• Modelo Beta: 1,2 unidade de material; 1,0 hora de MOD\n\n'
         'A estrutura básica de custos e despesas da Nexora S.A. é a seguinte:\n\n'
         '• Materiais: R$ 60,00 por unidade de material\n'
         '• MOD (mão de obra direta): R$ 25,00 por hora\n'
         '• Comissão sobre preço de venda bruto: 10% por unidade\n'
         '• Despesas administrativas gerais: R$ 28.900,00 por mês\n'
         '• Despesas comerciais e de marketing: R$ 43.700,00 por mês\n'
         '• Custos fixos: R$ 116.600,00 por mês\n\n'
         'Considere ainda que:\n\n'
         '• Sobre a receita bruta incidem 5% de tributos;\n'
         '• Dos custos fixos, sabe-se que R$ 70.400,00 são consumidos na produção do modelo Alfa, enquanto R$ 46.200,00 são consumidos na produção do modelo Beta;\n'
         '• Quando há necessidade de alocação de custos fixos e/ou de despesas fixas aos objetos de custeio, a empresa utiliza como base de alocação o volume de equipamentos produzidos;\n'
         '• A empresa Nexora S.A. produz volume 10% superior à quantidade demandada pelo mercado para ambos os modelos. Considere que não havia saldo inicial de estoques.\n\n'
         'Com base nas informações fornecidas, a margem bruta unitária e a margem bruta total, apuradas pelo método de '
         'custeio por absorção parcial, do modelo de equipamentos eletrônicos Beta da empresa Nexora S.A., em 31/12/2024, foram de',
         ['R$ 150,00 e R$ 105.000,00', 'R$ 46,00 e R$ 32.200,00', 'R$ 114,50 e R$ 91.600,00', 'R$ 124,00 e R$ 86.800,00',
          'R$ 90,00 e R$ 63.000,00']),
    73: (CTB, 'Contabilidade de Custos — Margem de Contribuição', BK5,
         'No mês de março de 2025, a empresa Naturais W Ltda. produziu 25.000 unidades de barra de cereais de sua linha '
         'premium, mas vendeu apenas 20.000 unidades pelo preço líquido de venda de R$ 6,00 cada. Sabe-se que cada unidade '
         'vendida de barra de cereal gera à empresa os seguintes custos e despesas: R$ 1,20 de matéria-prima, R$ 0,50 de '
         'embalagem, R$ 0,80 de mão de obra direta, R$ 0,60 de comissão sobre vendas e R$ 0,40 de frete. Durante o referido '
         'mês, a empresa também incorreu em R$ 15.000,00 de custos fixos e R$ 20.000,00 de despesas fixas que, quando '
         'necessário, são alocados aos objetos de custeio conforme o volume produzido. Considerando que não havia saldo '
         'inicial de estoques, a margem de contribuição total do mês de março de 2025 da empresa Naturais W Ltda. foi de',
         ['R$ 50.000,00', 'R$ 58.000,00', 'R$ 70.000,00', 'R$ 22.000,00', 'R$ 62.000,00']),
    74: (CTB, 'Contabilidade de Custos — Ponto de Equilíbrio', BK5,
         'A empresa EcoMundo Sustentável Ltda. é responsável pela produção de tapetes higiênicos biodegradáveis para '
         'cachorros, que são vendidos pelo preço líquido de R$ 50,00 o pacote. Para cada pacote de tapetes higiênicos '
         'biodegradáveis produzido, a empresa incorre em gastos com mão de obra direta no valor de R$ 8,00, materiais de '
         'R$ 10,00 e embalagem de R$ 2,00. A empresa também incorre em custos e despesas fixos que juntos somam '
         'R$ 390.000,00, dentre os quais consta a depreciação do maquinário utilizado no processo de fabricação, cujo valor é '
         'de R$ 60.000,00. Considere que o lucro líquido esperado pelos gestores da EcoMundo Sustentável Ltda. é de '
         'R$ 240.000,00. Diante dessa estrutura de custos e despesas, seu Ponto de Equilíbrio Econômico é de',
         ['11.000 unidades.', '19.000 unidades.', '21.000 unidades.', '19.700 unidades.', '13.000 unidades.']),
    75: (CTB, 'Contabilidade de Custos — Margem de Contribuição', BK5,
         'A Margem de Contribuição Total da linha Delta, em 31/03/2024, foi de',
         ['R$ 71.500,00', 'R$ 85.800,00', 'R$ 92.000,00', 'R$ 74.400,00', 'R$ 62.000,00']),
    76: (CTB, 'Contabilidade de Custos — Custeio por Absorção', BK5,
         'O saldo remanescente de estoques da linha Gama, apurado pelo método de custeio por absorção parcial, em 31/03/2024, foi de',
         ['R$ 19.000,00', 'R$ 21.200,00', 'R$ 16.100,00', 'R$ 14.000,00', 'R$ 18.100,00']),
    77: (CPU, NBC34, BP2,
         'Referente à classificação dos custos, a NBC TSP 34 determina que corresponde a um custo',
         ['controlável aquele que oscila de forma proporcional ao volume das atividades desenvolvidas, como o custo com matéria prima.',
          'finalístico aquele relacionado à atividade administrativa interna, como gestão de recursos humanos e serviços de contabilidade.',
          'variável aquele que oscila de forma proporcional ao preço dos recursos adquiridos para a produção de bens ou serviços.',
          'direto o custo com medicamentos utilizados em procedimentos hospitalares, quando o objeto de custo é o procedimento hospitalar.',
          'indireto aquele que não varia na proporção do volume das atividades desenvolvidas, como o aluguel de um prédio utilizado para fins administrativos.']),
    78: (CPU, NBC34, BP2,
         'De acordo com a NBC TSP 34, o sistema de acumulação por ordem de serviço ou produção é mais adequado para o '
         'tratamento dos custos',
         ['de investimentos, tais como aqueles incorridos para a construção de uma escola, com duração das obras prevista para dois exercícios financeiros.',
          'de coleta diária de lixo urbano por um ente público, cujos custos são acumulados por mês e atribuídos ao número de toneladas de resíduos coletados.',
          'da prestação de serviços de transporte escolar por um ente público, cujo serviço é prestado de forma contínua e permanente, no qual o objeto de custo é o estudante transportado.',
          'da prestação de serviços de transporte escolar por um ente público, cujo serviço é prestado de forma contínua e permanente, no qual o objeto de custo é a unidade de ensino atendida.',
          'de fabricação ininterrupta de medicamentos padronizados em um laboratório público, cujo objeto de custo é a unidade de medicamento.']),
    79: (CPU, NBC34, BP2,
         'Para a atribuição de custos por refeição servida para estudantes de uma escola pública pelo método de custeio '
         'variável, deve-se considerar como custo',
         ['o gasto com limpeza diária da cozinha.', 'o gasto com seguro mensal dos equipamentos da cozinha.',
          'o salário fixo mensal dos cozinheiros efetivos.',
          'a depreciação, apurada pelo método linear, de fogões utilizados para a preparação das refeições.',
          'o gás de cozinha consumido proporcionalmente ao volume de refeição produzida.']),
    80: (CPU, NBC34, BP2,
         'Quanto aos métodos de custeio, a NBC TSP 34 recomenda a',
         ['adoção do custeio baseado em atividades quando se pretende efetuar análises comparativas entre objetos de custo intermediário.',
          'utilização do custeio variável para fazer o rastreamento de custos diretos até objetos de custo intermediário.',
          'adoção do custeio por absorção integral para efetuar análises comparativas entre objeto de custo final de diferentes entidades.',
          'utilização do custeio pleno por entidades com menor grau de maturidade de modelos de gerenciamento de custos.',
          'utilização do custeio baseado em atividades para fazer o rastreamento de custos diretos até os objetos de custo final.']),
}
