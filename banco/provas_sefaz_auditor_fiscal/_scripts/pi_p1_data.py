# -*- coding: utf-8 -*-
"""SEFAZ-PI 2025 (FCC) - P1 Conhecimentos Gerais, transcrita das imagens do caderno Tipo 002.
Excluidas: 35-36 (Constituicao do Estado do Piaui) e 55-70 (Conhecimentos Regionais)."""

LP, MF, EST = 'Língua Portuguesa', 'Matemática Financeira', 'Estatística'
DCON, DADM, DCIV, DPEN, INF = ('Direito Constitucional', 'Direito Administrativo', 'Direito Civil e Empresarial',
                               'Direito Penal', 'Noções de Informática')
BMF1, BMF2 = '[1] Juros e Taxas (3 aulas)', '[2] Equivalência e Aplicações Financeiras (3 aulas)'
BE1 = '[1] Estatística Descritiva Univariada (5 aulas)'
BE2 = '[2] Combinatória e Probabilidade (2 aulas)'
BE3 = '[3] Variáveis Aleatórias e Distribuições (4 aulas)'
BE4 = '[4] Inferência Estatística (4 aulas)'
BE5 = '[5] Regressão, Séries Temporais e Análise Multivariada (5 aulas)'
BC1 = '[1] Teoria Constitucional e Direitos Fundamentais (5 aulas)'
BC2 = '[2] Nacionalidade e Direitos Políticos (3 aulas)'
BC4 = '[4] Organização dos Poderes (5 aulas)'
BC6 = '[6] Controle de Constitucionalidade (1 aula)'
BA1 = '[1] Fundamentos e Poderes Administrativos (3 aulas)'
BA2 = '[2] Atos Administrativos (2 aulas)'
BA4 = '[4] Agentes Públicos e Licitações/Contratos (4 aulas)'
BA5 = '[5] Serviços Públicos e Parcerias (2 aulas)'
BA6 = '[6] Responsabilidade, Controle e Improbidade (3 aulas)'
BA7 = '[7] Bens Públicos e Intervenção na Propriedade (2 aulas)'
BI2 = '[2] Segurança da Informação (3 aulas)'
BI3 = '[3] Banco de Dados e Modelagem (4 aulas)'
BI4 = '[4] Business Intelligence e Big Data (3 aulas)'
BI6 = '[6] Ferramentas Corporativas e Web (3 aulas)'
BI7 = '[7] Gestão e Governança de TI (2 aulas)'

CTX = {
    't1': ('Leia o texto abaixo para responder à questão.\n\n'
           'Só quem tem alma pode contar o tempo\n\n'
           'Mais um ano está começando neste janeiro, e de novo a maior parte da humanidade vai ignorar aquela pequena '
           'parcela de realistas desencantados – também chamados de cínicos – que aponta a arbitrariedade dos inícios e '
           'dos fins numa linha do tempo em que todos os dias são iguais. Acontece que, nesse caso, a maioria tem razão. '
           'Quem diz que todos os dias são iguais não leva em conta a necessidade humana de contar histórias a fim de dar '
           'sentido à escala desmesurada e opressiva – numa palavra, inumana – do tempo cósmico.\n\n'
           'Como observa o crítico Frank Kermode no livro “O Sentido de um Fim”, cabe às histórias que inventamos, com '
           'seus marcos temporais atravessados de cultura, dar sentido ao intervalo entre início e fim, transformando '
           'Chrónos, o tempo infinito e amorfo dos gregos, em Kairós, o momento cheio de significado.\n\n'
           'A palavra “ano” descende do prefixo grego “amphi”, isto é, “em torno, à volta”. Isso faz do ano um parente '
           'distante de outros termos em que está presente a ideia de círculo, de algo que circunda, que envolve por todos '
           'os lados – como ambiente, anfiteatro e anel, entre outros. “Janeiro” deve seu nome ao deus romano Jano, '
           'entidade de duas caras, capaz de olhar ao mesmo tempo para o passado e para o futuro – ou para dentro e para '
           'fora, o que explica que a palavra “janela” seja outra de suas filhas.\n\n'
           'Eis por que sabemos que tem raízes profundas em nossa alma, indo muito além de modismos midiáticos, o frenesi '
           'que nessa época nos leva a passar em revista o ano que se encerra, tentando apurar seu saldo de altos e baixos, '
           'ao mesmo tempo que fazemos listas de “resoluções” bem-intencionadas – que, na maior parte das vezes, já estarão '
           'desmoralizadas antes do Carnaval.\n\n'
           '(Adaptado de: RODRIGUES, Sérgio. Folha de S.Paulo, 1º de janeiro de 2025)'),
    't2': ('Leia o texto abaixo para responder à questão.\n\n'
           'Sobre a brevidade da vida\n\n'
           'A maior parte dos mortais queixa-se da malevolência da Natureza, porque estamos destinados a um breve momento '
           'da eternidade, e, segundo eles, o espaço de tempo que nos foi dado corre tão veloz que, por consequência, e à '
           'exceção de muito poucos, a vida abandonaria a todos ainda em meio aos preparativos para bem vivê-la.\n\n'
           'Vejam: não é somente a multidão e a turba insensata que se lamenta desse mal considerado universal: a mesma '
           'impressão provocou queixas inconformadas também de homens ilustres e pessoas de excelente formação. Anote-se, '
           'por exemplo, o protesto de Hipócrates, o maior dos médicos, quando diz “A vida é breve, longa, a arte”.\n\n'
           'Pela mesma razão nasce o litígio (de nenhuma forma apropriado a um homem sábio) que Aristóteles teve com a '
           'Natureza: “Aos animais, ela concedeu tanto tempo de vida que muitos deles sobrevivem por cinco ou dez gerações '
           'da nossa espécie; ao homem, nascido para tantos e tão grandes feitos, está estabelecido um tempo exíguo.”\n\n'
           'Não, não é curto o tempo que temos, mas dele muito perdemos. A vida é suficientemente longa, e com generosidade '
           'nos foi dada para a realização das maiores coisas, se a empregamos bem. Mas quando ela se esvai no culto do '
           'supérfluo e na indiferença, quando não a empregamos em nada de positivo, somos constrangidos pela fatalidade do '
           'tempo, e sentimos que ela passou sem que tivéssemos percebido.\n\n'
           'O fato é este: não recebemos uma vida breve, mas assim a fazemos, nem somos dela carentes, seus esbanjadores. '
           'Tal como se dissipam rapidamente os abundantes recursos que caem nas mãos de um gastador, assim também nossa '
           'vida se perde, quando do tempo dela não sabemos dispor.\n\n'
           '(Adaptado de: SÊNECA. Sobre a brevidade da vida. Trad. William Li. São Paulo: Nova Alexandria, p. 25-26)'),
    'z': ('Utilize o quadro a seguir, que fornece algumas informações da distribuição normal padrão (Z), ou seja, as '
          'probabilidades P(0 < Z ≤ z):\n\n'
          '• z = 0,25 → 0,10\n'
          '• z = 0,52 → 0,20\n'
          '• z = 0,84 → 0,30\n'
          '• z = 1,28 → 0,40\n'
          '• z = 1,64 → 0,45\n'
          '• z = 1,96 → 0,475'),
}
CTX_DE = {1: 't1', 2: 't1', 3: 't1', 4: 't1', 5: 't1', 6: 't2', 7: 't2', 8: 't2', 9: 't2', 10: 't2',
          26: 'z', 27: 'z', 28: 'z'}

Q = {
    1: (LP, 'Interpretação de Texto', '',
        'Ao afirmar, no 1º parágrafo, que nesse caso, a maioria tem razão, o autor do texto está referendando',
        ['o cinismo com que as pessoas se agarram hipocritamente à escala inumana do tempo.',
         'o ponto de vista de quem aponta como arbitrários os inícios e os fins na sequência dos anos.',
         'a razão de quem não leva em conta a necessidade de se dar sentido à passagem do tempo.',
         'o critério de quem estima as marcas finais e iniciais de um ano como datas expressivas.',
         'a indiferença que os realistas desencantados demonstram nas datas de passagem de ano.']),
    2: (LP, 'Interpretação de Texto', '',
        'Nos 2º e 3º parágrafos, considera-se a etimologia ou origem histórica de algumas palavras relacionadas a '
        'passagens e marcas temporais. Depreende-se dessas considerações que',
        ['a palavra “janela” é marcada como base de criação dos conceitos de “janeiro” e “Jano”.',
         'o sentido da passagem do tempo indiferenciada e sem marcas está contido no conceito de “Chrónos”.',
         'o sentido de tempo como “Kairós” é aquele referendado pelos realistas desencantados.',
         'na relação entre as palavras “janeiro” e “janela” está presente o sentido de “tempo cósmico”.',
         'o sentido de “Jano” liga-se à veneração especial com que muitos encaram o fim de uma era.']),
    3: (LP, 'Reescrita de Frase - Sinonímia', '',
        'Considerando-se o contexto, traduz-se adequadamente o sentido de um segmento do texto em:',
        ['tentando apurar seu saldo de altos e baixos (4º parágrafo) = buscando identificar seus bons e maus momentos.',
         'pequena parcela de realistas desencantados (1º parágrafo) = surto minoritário de racionalistas malogrados.',
         'dar sentido à escala desmesurada e opressiva (1º parágrafo) = elucidar a tabela desproporcional e repressora.',
         'marcos temporais atravessados de cultura (2º parágrafo) = signos cronológicos imbuídos de sapiência.',
         'muito além de modismos midiáticos (4º parágrafo) = à margem das intercomunicações eventuais.']),
    4: (LP, 'Reescrita e Coesão Textual', '',
        'Tem raízes profundas em nossa alma o frenesi que nos toma nessa época.\n\n'
        'Uma nova redação da frase acima, em que se mantêm seu sentido e sua correção, será:',
        ['De raízes profundas, em nossa alma, somos tomados pelo frenesi dessa época.',
         'O frenesi de nossa alma nessa época, tomamo-lo tendo em vista suas raízes profundas.',
         'Somos tomados, nessa época, por um frenesi enraizado profundamente em nossa alma.',
         'São raízes profundas aquelas cujo frenesi nos toma a nossa alma nessa época.',
         'Conquanto suas raízes se aprofundem em nossa alma, o frenesi nos toma nessa época.']),
    5: (LP, 'Morfologia - Tempos e Modos Verbais', '',
        'Quem diz que todos os dias são iguais não leva em conta a necessidade de contar histórias para que a passagem '
        'do tempo ganhe sentido.\n\n'
        'Estará preservada a adequada articulação entre os tempos e os modos verbais da frase acima caso se substituam '
        'as formas “diz”, “leva” e “ganhe”, na ordem dada, por:',
        ['tivesse dito – levará – ganhava', 'dissesse – leve – ganhasse', 'disser – levaria – ganharia',
         'diga – levasse – tenha a ganhar', 'dissesse – levaria – viesse a ganhar']),
    6: (LP, 'Interpretação de Texto', '',
        'A compreensão global do texto se dá a partir da identificação do argumento central de cada parágrafo. Nesse '
        'sentido, é correto assinalar que,',
        ['no 5º parágrafo, estabelece-se uma contraposição entre os esbanjadores de recursos e os que se dizem carentes de um maior tempo para viver.',
         'no 1º parágrafo, a malevolência da Natureza se dá pela má distribuição do tempo de vida reservada a cada um dos mortais.',
         'no 2º parágrafo, o protesto de Hipócrates representa uma convicção contrária àquela de que compartilham alguns homens ilustres.',
         'no 3º parágrafo, o litígio que Aristóteles teve com a natureza deriva do privilégio que foi concedido aos homens de vida longa.',
         'no 4º parágrafo, reconhece-se que a suficiência do tempo que se tem para viver ocorre quando se evita o supérfluo na vida.']),
    7: (LP, 'Interpretação de Texto', '',
        'Contrapõe-se frontalmente à convicção de Hipócrates o que está no seguinte segmento:',
        ['A vida (...) com generosidade nos foi dada (4º parágrafo).',
         'estamos destinados a um breve momento da eternidade (1º parágrafo).',
         'se lamenta desse mal considerado universal (2º parágrafo).',
         'o litígio (...) que Aristóteles teve com a natureza (3º parágrafo).',
         'ela passou sem que tivéssemos percebido (4º parágrafo).']),
    8: (LP, 'Concordância Verbal', '',
        'As normas de concordância verbal estão plenamente observadas na frase:',
        ['Caberiam aos homens mais sábios valer-se dos anos todos de suas vidas para exercitarem suas qualidades espirituais.',
         'Destacam-se entre os litígios do homem com a Natureza o que com ela manteve o filósofo Aristóteles.',
         'Atribui-se à malevolência da Natureza todos os agravos que decorreriam do nosso pouco tempo de vida.',
         'Costuma-se ouvir, em meio aos homens ilustres e bem formados, o queixume de serem céleres os anos da vida.',
         'Ainda que se concedesse a cada um de nós muitos anos mais, continuaríamos a nos queixar da brevidade da vida.']),
    9: (LP, 'Sintaxe - Regência e Pronomes Relativos', '',
        'Não, não é curto o tempo que temos, mas dele muito perdemos.\n\n'
        'A frase acima permanecerá correta e coerente caso se substituam os elementos “que temos” e “dele muito '
        'perdemos”, na ordem dada, por',
        ['com que detemos – lhe fazemos mau uso', 'de que dispomos – gastamo-lo perdulariamente',
         'com cujo contamos – lhe dissipamos demais', 'pelo qual carecemos – é aonde o extraviamos',
         'em que havemos – lhe dispensamos muito']),
    10: (LP, 'Semântica - Relações Lógicas entre Orações', '',
         'Explicita-se adequadamente a relação lógica entre os termos que constituem a frase “A vida é breve, longa, a '
         'arte” na seguinte reconstrução:',
         ['Tanto breve é a vida quanto longa é a arte.', 'Uma vez sendo longa a arte, a vida é breve.',
          'A vida é breve, ao passo que a arte é longa.', 'É breve a vida, na medida em que a arte é longa.',
          'Desde que seja breve a vida, longa é a arte.']),
    11: (MF, 'Juros Simples', BMF1,
         'Um investidor aplicou 30% de seu capital, durante 8 meses, a uma taxa de juros simples de 12% ao ano e o '
         'restante, durante 10 meses, a uma taxa de juros simples de 14,4% ao ano. Se a soma dos montantes destas '
         'aplicações foi igual a R$ 66.480,00, então o valor dos juros correspondente à aplicação de 10 meses apresenta '
         'valor igual a',
         ['R$ 5.600,00', 'R$ 4.800,00', 'R$ 4.480,00', 'R$ 5.040,00', 'R$ 4.000,00']),
    12: (MF, 'Equivalência de Capitais', BMF2,
         'Um título de valor nominal igual a R$ 20.000,00 vence daqui a 2 meses e um segundo título vence daqui a 4 '
         'meses. O devedor propõe ao credor substituir estes dois títulos por um pagamento único daqui a 7 meses no valor '
         'de R$ 54.940,00. Considerando a taxa de juros simples de 18% ao ano, verifica-se que o valor nominal do segundo '
         'título que vence daqui a 4 meses é de',
         ['R$ 36.000,00', 'R$ 32.000,00', 'R$ 34.000,00', 'R$ 30.000,00', 'R$ 28.000,00']),
    13: (MF, 'Juros Compostos', BMF1,
         'Um investidor aplica hoje em um banco um capital pelo prazo de um ano a uma taxa de juros compostos de 6% ao '
         'semestre. Na mesma data aplica em um outro banco um capital com o mesmo valor do primeiro pelo prazo de 10 '
         'meses a uma taxa de juros simples de 18% ao ano. Se o valor dos juros da primeira aplicação é igual a '
         'R$ 2.472,00, então o valor do montante da segunda aplicação supera o valor do montante da primeira aplicação em',
         ['R$ 572,00', 'R$ 472,00', 'R$ 504,00', 'R$ 622,00', 'R$ 528,00']),
    14: (MF, 'Equivalência de Capitais', BMF2,
         'Um aparelho no valor de R$ 50.000,00 é vendido nas seguintes condições:\n\n'
         '• Entrada de R$ 9.800,00\n'
         '• Saldo em duas parcelas mensais, iguais e consecutivas, vencendo a primeira um mês após o pagamento da entrada.\n\n'
         'Se a taxa de juros compostos embutida na operação é de 1% ao mês, então o valor de cada parcela mensal é de',
         ['R$ 20.100,00', 'R$ 20.200,00', 'R$ 20.560,00', 'R$ 20.402,00', 'R$ 20.606,00']),
    15: (MF, 'Taxas', BMF1,
         'Um capital é aplicado, durante um período em que a taxa de inflação foi de 10,5%, apresentando uma taxa real de '
         'juros correspondente de 6%. Isto significa que, se o valor do capital fosse de R$ 40.000,00, então o valor do '
         'montante no final do período de aplicação seria de',
         ['R$ 46.852,00', 'R$ 44.448,00', 'R$ 46.600,00', 'R$ 43.300,00', 'R$ 45.224,00']),
    16: (MF, 'Taxas', BMF1,
         'Uma aplicação financeira em um banco consiste em depositar hoje um capital e resgatar todo o montante após um '
         'ano. Considerando uma taxa de juros nominal de 24% ao ano com capitalização bimestral. A taxa efetiva anual '
         'correspondente à aplicação é de',
         ['6(1 + 0,24)^(1/12) – 1', '(1 + 0,24)^(1/2) – 1', '(1 + 0,04)^6 – 1', '(1 + 0,24)^(1/6) – 1',
          '[2(1 + 0,24)]/6 – 1']),
    17: (MF, 'Juros Compostos', BMF1,
         'Considere que um capital foi aplicado, durante 3 anos, a uma taxa de 18% ao ano com capitalização contínua. Se e '
         'é a base dos logaritmos neperianos, então o montante correspondente à aplicação pode ser encontrado '
         'multiplicando o valor do capital aplicado por',
         ['e^0,54', '(1 + e^0,54)', '3e^0,18', '3(1 + e^0,18)', '(1 + e^0,18)^3']),
    18: (MF, 'Operações de Desconto', BMF2,
         'Dois títulos de valores nominais iguais são descontados na data de hoje a uma taxa de desconto anual de 24% ao '
         'ano. Um dos títulos vence daqui a 3 meses e o outro daqui a 5 meses. A soma dos valores atuais foi igual a '
         'R$ 38.272,00 e a operação utilizada foi a do desconto comercial simples para ambos os títulos. Se a taxa de '
         'desconto tivesse sido de 36% ao ano, então a soma dos valores atuais teria sido igual a',
         ['R$ 37.440,00', 'R$ 36.608,00', 'R$ 36.712,00', 'R$ 37.024,00', 'R$ 36.816,00']),
    19: (MF, 'Operações de Desconto', BMF2,
         'Uma duplicata deverá ser descontada em um banco 2 meses antes de seu vencimento a uma taxa de desconto de 30% ao '
         'ano. Foram calculados os valores atuais usando dois critérios, ou seja, primeiro sendo a operação de desconto '
         'comercial simples e segundo sendo a operação de desconto racional simples. Verifica-se que o valor atual do '
         'segundo supera o valor atual do primeiro em R$ 55,00. O valor nominal da duplicata é igual a',
         ['R$ 21.000,00', 'R$ 23.625,00', 'R$ 22.000,00', 'R$ 21.515,00', 'R$ 23.100,00']),
    20: (MF, 'Equivalência de Capitais', BMF2,
         'Um título de valor nominal igual a R$ 12.000,00 e com vencimento daqui a 2 meses deverá ser trocado por outro '
         'com vencimento daqui a 6 meses. Considerando o critério de desconto racional composto, a uma taxa de juros '
         'compostos de 2% ao mês, o valor nominal do outro título, em reais, deverá ser de',
         ['12.000(1,02)^3', '12.000(1,02)^1,5', '12.000[(1,02)^2 + (1,02)^4]', '12.000(1,02)^4',
          '12.000[(1,02)^6 – (1,02)^2]']),
    21: (EST, 'Medidas de Variabilidade ou Dispersão', BE1,
         'Considere uma variável aleatória X da qual foi obtido um conjunto de dados independentes, cuja média é 20 e a '
         'variância é 9. Se cada elemento X desse conjunto for transformado pela função Y = 2X – 5, então a média e a '
         'variância de Y serão, respectivamente,',
         ['Média = 35; Variância = 36', 'Média = 35; Variância = 18', 'Média = 45; Variância = 36',
          'Média = 25; Variância = 36', 'Média = 35; Variância = 9']),
    22: (EST, 'Análise Combinatória', BE2,
         'O secretário de obras de uma prefeitura precisa distribuir 7 projetos de melhoria entre 3 departamentos. Devido à '
         'sua complexidade, o Departamento Central deve receber exatamente 3 projetos, enquanto os outros dois '
         'departamentos devem receber, cada um, exatamente 2 projetos. O número de maneiras que essa distribuição pode '
         'ser realizada é:',
         ['630', '210', '105', '315', '420']),
    23: (EST, 'Probabilidade', BE2,
         'Em uma auditoria tributária, 20% das declarações apresentam erros. Se, dentre as declarações com erros, 40% são '
         'efetivamente sinalizadas pelo sistema automatizado e 10% das declarações sem erros geram falso positivo (são '
         'sinalizadas), então a probabilidade de uma declaração ser sinalizada pelo sistema é',
         ['20%', '14%', '10%', '16%', '18%']),
    24: (EST, 'Distribuições Discretas de Probabilidade', BE3,
         'Relatórios são verificados diariamente. Os erros de digitação ocorrem segundo uma distribuição de Poisson com '
         'média 4 e as omissões segundo uma distribuição de Poisson com média 1. Erros e omissões ocorrem de forma '
         'independente entre si. A probabilidade de que, em um dia qualquer, haja pelo menos 1 ocorrência de cada tipo de '
         'irregularidade é',
         ['1 – e^(–4) – e^(–5)', '1 – e^(–4) – e^(–1)', '1 – (e^(–4) + e^(–1))', 'e^(–4) + e^(–1) – e^(–5)',
          '1 – e^(–4) – e^(–1) + e^(–5)']),
    25: (EST, 'Teoria da Amostragem', BE4,
         'Um departamento de fiscalização tributária deseja avaliar a conformidade fiscal de empresas de diferentes portes '
         '(pequenas, médias e grandes). Para garantir que cada categoria (identificada pelo porte) esteja adequadamente '
         'representada, os auditores dividem a população de declarações conforme o porte da empresa, e depois selecionam '
         'aleatoriamente declarações de cada categoria, proporcionalmente ao tamanho dessa categoria. Esse procedimento é '
         'um exemplo de amostragem',
         ['por julgamento.', 'estratificada.', 'sistemática.', 'por conglomerado.', 'por conveniência.']),
    26: (EST, 'Variáveis Aleatórias e Distribuições Contínuas', BE3,
         'Um novo elevador precisa ser instalado em um prédio. Sabe-se que o peso dos usuários segue uma distribuição '
         'normal com média de 65 kg e variância de 49 kg². Para garantir a segurança, deseja-se que a carga máxima '
         'especificada para o elevador seja ultrapassada em apenas 2,5% das viagens. Então o peso máximo, por pessoa, para '
         'atender a especificação, corresponde a',
         ['95,54 kg', '93,56 kg', '78,72 kg', '92,44 kg', '80,00 kg']),
    27: (EST, 'Testes de Hipóteses', BE4,
         'A Receita Federal afirma que o prazo médio para o processamento das declarações de imposto de renda é de 11 '
         'dias, com desvio padrão de 0,8 dia. Uma auditoria interna analisou 100 processos, obtendo um prazo médio de '
         '11,14 dias.\n\n'
         'Supondo o teste unilateral com as hipóteses H0: μ = 11 dias e H1: μ > 11 dias e considerando que os prazos '
         'seguem uma distribuição normal',
         ['ao nível de 5% de significância rejeita-se H0; mas ao nível de 2,5% não se rejeita H0.',
          'ao nível de 5% de significância não se rejeita H0; mas ao nível de 2,5% rejeita-se H0.',
          'ao nível de 10% de significância não se rejeita H0; mas ao nível de 2,5% rejeita-se H0.',
          'ao nível de 10% de significância não se rejeita H0.',
          'ao nível de 2,5% de significância rejeita-se H0.']),
    28: (EST, 'Intervalo de Confiança', BE4,
         'Uma empresa de telecomunicações realizou uma pesquisa para estimar a proporção de clientes satisfeitos com um '
         'novo serviço. Em uma amostra de 400 clientes, 200 declararam estar satisfeitos. Utilizando um nível de confiança '
         'de 95% e assumindo que as condições para a aproximação normal são atendidas, a amplitude (diferença entre o '
         'limite superior e inferior) do intervalo de confiança para a proporção de clientes satisfeitos é dada por',
         ['9,8%', '8%', '1,96%', '5%', '2,5%']),
    29: (EST, 'Regressão Linear Simples', BE5,
         'Em uma regressão linear simples da forma Y = β0 + β1X + e, onde e é um erro aleatório com média zero e variância '
         'constante, um ajuste pelo método dos mínimos quadrados com 30 observações forneceu o valor estimado de 1,8 para o '
         'coeficiente angular β1. O desvio-padrão de Y é exatamente o dobro do desvio-padrão de X, então o coeficiente de '
         'correlação entre X e Y é dado por',
         ['0,60', '0,45', '0,50', '0,75', '0,90']),
    30: (EST, 'Regressão Linear Simples', BE5,
         'Um analista ajustou uma regressão linear simples pelo método dos mínimos quadrados com equação estimada '
         'resultante na forma ŷ = 250 + 0,6x. O ponto observado x = 50 possui um resíduo igual a –10, então o valor '
         'observado de Y nesse ponto é',
         ['220', '230', '270', '240', '290']),
    31: (DCON, 'Poder Judiciário', BC4,
         'De acordo com a Constituição Federal de 1988, são órgãos da Justiça do Trabalho: o Tribunal Superior do Trabalho; '
         'os Tribunais Regionais do Trabalho;',
         ['as Juntas de Conciliação e Julgamento; o Conselho Superior da Justiça do Trabalho, cujas decisões terão efeito vinculante.',
          'Juízes do Trabalho.',
          'Juízes do Trabalho; as Juntas de Conciliação e Julgamento.',
          'a Escola Nacional de Formação e Aperfeiçoamento de Magistrados do Trabalho; o Conselho Superior da Justiça do Trabalho, cujas decisões não terão efeito vinculante.',
          'o Conselho Superior da Justiça do Trabalho, cujas decisões não terão efeito vinculante.']),
    32: (DCON, 'Funções Essenciais à Justiça', BC4,
         'Peter é membro do Ministério Público Federal há quase três anos e pretende exercer uma função pública de '
         'magistério. Pollyana é membro do Ministério Público do Trabalho há um ano e pretende exercer a advocacia na área '
         'do Direito do Trabalho. De acordo com a Constituição Federal de 1988, com base apenas nas informações fornecidas, '
         'é correto afirmar que o Ministério Público Federal, onde atua Peter,',
         ['e o Ministério Público do Trabalho, onde atua Pollyana, fazem parte do Ministério Público da União, que tem por chefe o Advogado-Geral da União. Peter possui a garantia da vitaliciedade e Pollyana ainda não adquiriu essa garantia. Peter poderá a exercer a função de magistério que pretende e Pollyana não poderá exercer a advocacia pretendida.',
          'e o Ministério Público do Trabalho, onde atua Pollyana, fazem parte do Ministério Público da União, que tem por chefe o Procurador-Geral da República. Peter ainda não possui a garantia da vitaliciedade e Pollyana também não adquiriu ainda essa garantia. Peter poderá exercer a função de magistério que pretende e Pollyana não poderá exercer a advocacia pretendida.',
          'faz parte do Ministério Público da União, não estando, neste último, compreendido o Ministério Público do Trabalho, onde atua Pollyana. Peter possui a garantia da vitaliciedade e Pollyana ainda não adquiriu essa garantia. Peter poderá exercer a função de magistério que pretende e Pollyana não poderá exercer a advocacia pretendida.',
          'e o Ministério Público do Trabalho, onde atua Pollyana, fazem parte do Ministério Público da União, que tem por chefe o Procurador-Geral da República. Peter possui a garantia da vitaliciedade e Pollyana ainda não adquiriu essa garantia. Peter poderá exercer a função de magistério que pretende e Pollyana não poderá exercer a advocacia pretendida.',
          'faz parte do Ministério Público da União, não estando, neste último, compreendido o Ministério Público do Trabalho, onde atua Pollyana. Peter ainda não possui a garantia da vitaliciedade e Pollyana também ainda não adquiriu essa garantia. Peter não poderá exercer a função de magistério que pretende e Pollyana poderá exercer a advocacia pretendida.']),
    33: (DCON, 'Medida Provisória', BC4,
         'Suponha que, em virtude da violência que assola o país, o Presidente da República pretenda adotar medida '
         'provisória, com força de lei, sobre matéria relativa a direito penal. De acordo com a Constituição Federal de 1988,',
         ['a situação justifica a adoção da medida provisória, pois se trata de caso relevante e urgente e, se ela não for apreciada em até sessenta dias contados de sua publicação, entrará em regime de urgência, subsequentemente, em cada uma das Casas do Congresso Nacional.',
          'é vedada a edição de medida provisória sobre essa matéria, assim como a relativa a direito civil, sendo, entretanto, admitida com relação ao direito processual civil.',
          'a situação justifica a adoção da medida provisória, pois se trata de caso relevante e urgente, devendo o Presidente submetê-la de imediato ao Congresso Nacional.',
          'é vedada a edição de medida provisória sobre essa matéria, assim como a relativa a direito processual penal, dentre outras hipóteses.',
          'a situação justifica a adoção da medida provisória, pois se trata de caso relevante e urgente, sendo que ela perderá a eficácia, desde a edição, se não for convertida em lei no prazo de sessenta dias.']),
    34: (DCON, 'Direitos Políticos', BC2,
         'Florisbel é brasileira nata, tem 21 anos de idade, é analfabeta e pretende se candidatar ao cargo de Prefeita de '
         'determinado Município do Piauí. Durvalino é brasileiro naturalizado, tem 55 anos de idade, é professor e deseja '
         'se candidatar ao cargo de Presidente da República. Marinalva é brasileira nata, tem 65 anos de idade, é advogada '
         'e pretende se candidatar ao cargo de Deputada Federal. Com base apenas nas informações fornecidas e de acordo com '
         'a Constituição Federal de 1988, nessas situações, o alistamento eleitoral e o voto são obrigatórios para',
         ['Durvalino e Marinalva, apenas, sendo que somente Marinalva poderá se candidatar ao cargo que pretende.',
          'Durvalino, apenas, sendo que somente Marinalva e Durvalino poderão se candidatar aos cargos que pretendem.',
          'Florisbel, Durvalino e Marinalva, sendo que somente Marinalva poderá se candidatar ao cargo que pretende.',
          'Durvalino e Marinalva, apenas, sendo que somente Florisbel e Marinalva poderão se candidatar ao cargo que pretendem.',
          'Marinalva, apenas, sendo que somente Marinalva poderá se candidatar ao cargo que pretende.']),
    37: (DCON, 'Direitos Sociais', BC1,
         'Genésio, 50 anos de idade, é empregado de determinada empresa privada, onde realiza trabalho noturno. Genésio '
         'deseja que seu filho, Enzo, que completou 17 anos de idade no mês passado, comece a trabalhar, imediatamente, na '
         'mesma empresa que ele, fazendo o mesmo horário, pois assim poderiam ir e voltar juntos. De acordo com a '
         'Constituição Federal, com base apenas nas informações fornecidas, nessa situação, Genésio deverá receber '
         'remuneração do seu trabalho noturno',
         ['superior à do diurno e Enzo não poderá realizar qualquer tipo de trabalho, noturno ou diurno, pois é menor de 18 anos, salvo na condição de aprendiz, a partir dos quatorze anos de idade.',
          'igual à do diurno e Enzo poderá realizar o trabalho no horário que deseja seu pai, pois tem mais de 16 anos de idade.',
          'superior à do diurno e Enzo poderá realizar o trabalho no horário que deseja seu pai, pois tem mais de 16 anos, fazendo jus à remuneração superior à do trabalho diurno.',
          'igual à do diurno e Enzo não poderá realizar o trabalho no horário que deseja seu pai, pois a Enzo é proibido o trabalho noturno.',
          'superior à do diurno e Enzo não poderá realizar o trabalho no horário que deseja seu pai, pois a Enzo é proibido o trabalho noturno.']),
    38: (DCON, 'Controle de Constitucionalidade', BC6,
         'Considere:\n\n'
         'I. Compete ao Supremo Tribunal Federal processar e julgar, originariamente, a ação direta de inconstitucionalidade de lei ou ato normativo federal ou estadual que pode ser proposta, dentre outros, por Mesa de Assembleia Legislativa.\n'
         'II. Compete ao Supremo Tribunal Federal processar e julgar, originariamente, a ação declaratória de constitucionalidade de lei ou ato normativo federal ou estadual que pode ser proposta, dentre outros, pelo Presidente da República.\n'
         'III. Somente pelo voto da maioria relativa de seus membros ou dos membros do respectivo órgão especial poderão os tribunais declarar a constitucionalidade ou a inconstitucionalidade de lei ou ato normativo do Poder Público.\n\n'
         'De acordo com a Constituição Federal de 1988, está correto o que se afirma em',
         ['I, II e III.', 'I, apenas.', 'II, apenas.', 'I e III, apenas.', 'II e III, apenas.']),
    39: (DADM, 'Agentes Públicos', BA4,
         'A secretaria estadual com atribuições de atendimento a demandas decorrentes de emergências climáticas apresentou '
         'proposta de contratação de servidores, por prazo determinado, para reforçarem as equipes de socorristas no '
         'período mais agudo de estiagem, como medida de enfrentamento a incêndios florestais. A pretensão do órgão público',
         ['não é admissível, de forma direta pela Administração Pública, pois seria necessária a realização de procedimento de licitação com critério de julgamento baseado no menor preço, o que inviabilizaria o ingresso do número necessário de servidores.',
          'é viável, considerando que se trata de demanda de excepcional interesse público e que haja legislação disciplinando a contratação por tempo determinado no âmbito estadual.',
          'é inviável, na medida em que não cabe contratação de servidores fora dos regimes estatutário ou celetista, em ambos os casos, precedida de concurso público de provas e títulos.',
          'é admitida, aplicando-se, por analogia, o estatuto dos servidores públicos civis vigente, com base nos princípios da eficiência e da celeridade, para atribuição de natureza estatutária ao vínculo.',
          'é viável, constituindo contratação emergencial fundada na lei de licitações e contratos, precedida, portanto, de pregão para credenciamento de candidatos, que ficarão sujeitos ao regime celetista.']),
    40: (DADM, 'Improbidade Administrativa (Lei 8.429/1992)', BA6,
         'Considere que um servidor tenha disponibilizado, a outro servidor da repartição, a utilização de veículo oficial '
         'durante o período do fim de semana, para viabilizar a transferência de arquivos documentais do órgão para outras '
         'instalações. O servidor foi flagrado conduzindo a viatura oficial para a realização de transporte ilegal de '
         'animais para comercialização. Essa conduta suscita',
         ['a instauração, obrigatoriamente, de procedimento administrativo de apuração prévia e, após a conclusão do mesmo, de processo administrativo disciplinar para a imputação de penalidade ao servidor que se utilizou do bem público, não sendo cabível responsabilização em outras esferas por ter agido culposamente.',
          'a tipificação de ato de improbidade por parte dos dois servidores envolvidos, tendo em vista que as condutas de ambos ensejaram enriquecimento ilícito e danos ao erário.',
          'a responsabilização criminal do servidor, prejudicialmente à apuração nas demais esferas, considerando a impossibilidade de cumulação de pena com a aplicação de sanções administrativas.',
          'a responsabilidade objetiva da Administração Pública por ato praticado por agente público, este que só pode ser responsabilizado por meio de direito de regresso, caso advenha condenação transitada em julgado para o ente público.',
          'a possibilidade de instauração de processo administrativo disciplinar para apuração dos ilícitos disciplinados nessa esfera, sem prejuízo da responsabilização em outras, a exemplo da prática de ato de improbidade, mediante demonstração de dolo específico.']),
    41: (DADM, 'Execução de Contrato Administrativo', BA4,
         'Foi licitada e contratada a realização de obras para construção de um viaduto, em determinado município, no bojo '
         'do programa de investimentos em infraestrutura. Decorrido algum tempo da contratação, o município procurou a '
         'contratada e solicitou a substituição do projeto básico, para que executassem obra de muro de contenção de '
         'encostas ao longo da estrada municipal de acesso à zona rural.\n\n'
         'Considerando as disposições da Lei nº 14.133/2021,',
         ['o aditamento contratual para alteração do objeto só seria admissível mediante expressa concordância da contratada e o valor original do contrato não poderia ser majorado em percentual superior a 25%.',
          'a pretensão do município será viável, caso a precificação da obra não acarrete majoração do valor inicial do contrato em percentual superior a 25%.',
          'o pleito do município é ilegal, pois implicaria alteração essencial do objeto contratual e impactaria, inclusive, o valor dos investimentos exigidos por parte do ente público.',
          'o município poderá formalizar nova contratação, por meio de inexigibilidade de licitação, tendo em vista que a primeira obra não fora realizada, a despeito de o contratado ter se saído vencedor do correspondente certame.',
          'é vedado o aditamento qualitativo dos contratos administrativos, não se admitindo alterações no projeto ou de suas especificações.']),
    42: (DADM, 'Parceria Público-Privada (Lei 11.079/2004)', BA5,
         'Os contratos de parceria público-privada apresentam características e requisitos próprios, podendo-se indicar '
         'como uma das diretrizes estruturantes dessa modalidade de delegação de serviços públicos',
         ['a previsão de repartição de riscos entre a Administração Pública e a concessionária, inclusive no que concerne a caso fortuito e força maior.',
          'a proibição de prestação de garantias por parte da Administração Pública, cabendo à modelagem econômico-financeira garantir a sustentabilidade do objeto contratado.',
          'o dever de estabelecer cláusulas de desempenho para avaliação do desempenho tanto do Poder Público quanto da contratada, operando-se compensações recíprocas para o caso de não atendimento dos padrões estabelecidos.',
          'a obrigatoriedade de cobrança de tarifa diretamente dos usuários dos serviços prestados, como forma de preservação do equilíbrio econômico-financeiro do contrato.',
          'a obrigatoriedade de investimentos diretos, por parte do Poder Público, para minimizar as despesas com aquisição de bens reversíveis, de modo a prestigiar o princípio da modicidade tarifária.']),
    43: (DADM, 'Entidades Paraestatais e Parcerias (Lei 13.019/2014)', BA5,
         'O Procedimento de Manifestação de Interesse Social previsto na Lei nº 13.019/2014 destina-se',
         ['a propiciar a identificação de interessados na realização de uma parceria com organização da sociedade civil, que se manifestarão, no decorrer do procedimento, antecipando suas futuras propostas financeiras.',
          'a avaliar e escolher propostas apresentadas por organizações da sociedade civil para execução específica de um instrumento de parceria disciplinado na norma, substituindo, portanto, eventual chamamento público.',
          'a possibilitar a apresentação de propostas, pela iniciativa privada, para análise de pertinência e viabilidade da parceria, por parte do Poder Público, procedendo-se, se o caso, a um chamamento público para a formalização do correspondente instrumento.',
          'a ampliar a abrangência de alcance dos projetos de iniciativa do Poder Público, constituindo-se, pois, etapa obrigatória prévia ao chamamento público.',
          'à realização de etapa preparatória e de estudos sobre a viabilidade de uma parceria, quando se configurar hipótese de dispensa de chamamento público.']),
    44: (DADM, 'Ato Administrativo: Espécies e Invalidação', BA2,
         'Os atos administrativos de natureza vinculada',
         ['não admitem controle externo para sua invalidação, tendo em vista que o mérito de sua edição insere-se no legítimo campo de apreciação de mérito, reservado à Administração Pública.',
          'podem ser objeto de revogação por atuação dos órgãos de controle externo, diante da demonstração de vícios de legalidade.',
          'admitem controle interno, por meio de revisão pela própria Administração e, excepcionalmente, pelo Poder Judiciário, desde que apresentem vício de vontade, não se admitindo que sejam objeto de verificação pelos Tribunais de Contas.',
          'são obrigatoriamente editados com as prerrogativas de coercibilidade e autoexecutoriedade, tendo em vista que seus elementos guardam fundamento em texto legal.',
          'suscitam controle pelo Poder Judiciário, que pode, em razão da constatação do não preenchimento de requisitos legais, decidir pela anulação dos mesmos.']),
    45: (DADM, 'Bens Públicos', BA7,
         'Os bens de uso especial pertencentes a uma autarquia são',
         ['inalienáveis em caráter perene, cabendo à Administração Pública garantir que estejam sempre destinados à finalidade de direito público, em observância ao princípio da função social dos imóveis públicos.',
          'sujeitos ao regime jurídico de direito público, o que lhes confere impenhorabilidade, imprescritibilidade e indisponibilidade, neste último caso, admitindo-se desafetação por meio de lei.',
          'afetados à prestação de serviços públicos indivisíveis a toda a população e de uso indistinto e indiscriminado, razão pela qual não podem ser desafetados e alienados pela entidade.',
          'submetidos ao regime jurídico de direito privado, caso seja editada lei específica para desafetação, perdendo a condição de impenhoráveis e imprescritíveis.',
          'de titularidade do ente público que criou a entidade, considerando que as autarquias, a despeito de autônomas, não possuem patrimônio próprio.']),
    46: (DADM, 'Poderes Administrativos', BA1,
         'O exercício do poder de polícia, inerente às funções típicas do Poder Executivo,',
         ['é estranho ao controle externo pelo Poder Judiciário, tendo em vista que configura legítimo exercício de poder discricionário, inserindo-se em matéria reservada à disciplina pela Administração Pública.',
          'também se manifesta na atuação típica do Poder Judiciário e do Poder Legislativo, como exteriorização da coercibilidade administrativa.',
          'é restrito ao exercício dos agentes públicos vinculados, funcionalmente, à Administração Pública Direta, não se estendendo às entidades que integram a Administração Pública Indireta.',
          'admite delegação em determinados casos e observados limites, a exemplo do exercício fiscalizatório por parte de autarquia com escopo funcional de licenciamento.',
          'deve ser expressa e integralmente disciplinado em lei, considerado seu sentido formal, não havendo margem discricionária na aplicação pela Administração Pública, sob pena de ofensa ao princípio da legalidade.']),
    47: (DCIV, 'Direito Civil - Sucessão Legítima', '',
         'Marcos faleceu no ano de 2025 e era casado no regime de separação convencional de bens com Mariana. Ele tinha 3 '
         'filhos oriundos de outro relacionamento – Pedro, Letícia e Cláudia. Inexistindo testamento, de acordo com o '
         'disposto no Código Civil e em consonância com o entendimento jurisprudencial consolidado pelo STJ, sua herança '
         'será partilhada em',
         ['3/4 para Mariana e 1/4 dividido, por igual, entre os 3 filhos.',
          '1/4 para Mariana, 1/4 para Pedro, 1/4 para Letícia e 1/4 para Cláudia.',
          '1/2 para Mariana e a outra metade dividida, por igual, entre os 3 filhos.',
          '1/3 para Pedro, 1/3 para Letícia e 1/3 para Cláudia.',
          '100% para Mariana.']),
    48: (DCIV, 'Direito Civil - Revogação da Doação', '',
         'Carla doou, mediante contrato escrito, um automóvel a seu amigo Felipe no ano de 2018. Desde então, este passou '
         'a utilizá-lo para fazer corridas por aplicativo. Em 2025, a irmã de Carla – Deise – sofreu atos de violência '
         'física praticados por Felipe, o que resultou em lesão corporal de natureza grave. Nesse caso hipotético,',
         ['Deise pode requerer a revogação da doação por ingratidão, dentro de um ano da ocorrência do fato, bem como a restituição dos frutos percebidos por Felipe.',
          'não é possível pleitear a revogação da doação por ingratidão, porquanto a ofensa não foi cometida contra Carla, mas sim contra sua irmã.',
          'Felipe pode ser condenado a restituir os valores que ganhou com a utilização do automóvel desde 2018, se houver o reconhecimento judicial da revogação da doação.',
          'como a revogação da doação por ingratidão só é possível nos casos de lesão corporal gravíssima, restaria à Carla requerer o pagamento dos frutos percebidos por Felipe.',
          'Carla pode pleitear a revogação da doação por ingratidão, dentro de um ano da ciência do ocorrido.']),
    49: (DCIV, 'Direito Civil - Defeitos do Negócio Jurídico (Lesão)', '',
         'Durante uma viagem, Leonardo percebeu que seu carro apresentou defeito mecânico, razão pela qual o estacionou num '
         'bairro localizado à beira da rodovia. Após um período aguardando na beira da Rodovia, um desconhecido chamado '
         'Fábio se apresentou no local e disse que poderia reparar o dano do veículo por três mil reais, embora não fosse '
         'mecânico profissional. Diante da urgência e da inexperiência nesse tema, Leonardo pagou o referido valor para '
         'que Fábio consertasse o carro. Após alguns dias, Leonardo constatou que o valor usualmente cobrado por esse '
         'serviço era de trezentos reais. Nessa situação em que o negócio foi feito entre particulares e considerando-se '
         'apenas as regras do Código Civil,',
         ['caso Fábio concorde com a redução do proveito excessivo, o negócio jurídico não será anulado, inobstante a ocorrência do vício do consentimento da lesão.',
          'mesmo que Fábio concorde com a redução do valor cobrado, o negócio jurídico não poderá subsistir, pois a nulidade é matéria de ordem pública.',
          'constata-se a ocorrência de coação, o que torna o negócio jurídico anulável no prazo de 4 anos, contados do dia em que se constatou a excessividade do valor.',
          'há nulidade do negócio jurídico, que só poderá ser alegada dentro do prazo de 5 anos, contados da ocorrência dos fatos.',
          'não há como anular o negócio jurídico ou reduzir o valor pago, já que os dois envolvidos eram capazes e firmaram, de comum acordo, contrato verbal de prestação de serviços.']),
    50: (DCIV, 'Direito Civil - Direitos Reais', '',
         'Analise as seguintes assertivas sobre direitos reais:\n\n'
         'I. A propriedade das coisas não se transfere pelos negócios jurídicos antes da tradição.\n'
         'II. O direito de superfície não autoriza obra no subsolo, salvo se for inerente ao objeto da concessão.\n'
         'III. Salvo disposição em contrário, o usufruto não se estende aos acessórios da coisa e seus acrescidos.\n'
         'IV. Quando o uso consistir no direito de habitar gratuitamente casa alheia, o titular deste direito não a pode alugar, nem emprestar, mas simplesmente ocupá-la com sua família.\n'
         'V. A instituição do direito real de laje implica a atribuição de fração ideal de terreno ao titular da laje ou a participação proporcional em áreas já edificadas.\n\n'
         'Está correto o que se afirma APENAS em',
         ['I, III e IV.', 'II, III e V.', 'I, II e IV.', 'I, II e V.', 'III, IV e V.']),
    51: (DPEN, 'Direito Penal - Crimes Funcionais (Concussão)', '',
         'Ricardo e Rodolfo, policiais militares de um determinado Estado brasileiro, durante patrulhamento regular '
         'realizado no município “X”, surpreendem Caio chegando a um local conhecido por ser ponto de venda de drogas, '
         'trazendo consigo em sua mochila 10 kg de cocaína para abastecimento daquela “biqueira”. No ato da abordagem, '
         'Ricardo e Rodolfo, após localizarem a grande quantidade de substância entorpecente, exigem do abordado Caio o '
         'pagamento da quantia de R$ 50.000,00 para irem embora e não o conduzirem preso em flagrante perante a Autoridade '
         'Policial por crime de tráfico de drogas. Nesse caso, Ricardo e Rodolfo cometeram, em tese, crime de',
         ['peculato.', 'excesso de exação.', 'corrupção passiva.', 'concussão.', 'corrupção ativa.']),
    52: (DPEN, 'Direito Penal - Crimes contra o Estado Democrático de Direito', '',
         'Sobre os crimes contra o estado democrático de direito previstos no Código Penal, instituídos pela Lei '
         'nº 14.197/2021, analise o caso hipotético a seguir:\n\n'
         'José, eleitor de um determinado município do Piauí, apoiador do candidato “Xisto” durante pleito eleitoral '
         'municipal, ciente do último resultado das pesquisas de intenção de voto, que indicavam a vitória do candidato '
         '“Benedito”, perturbou a aferição do resultado da eleição municipal após violar indevidamente mecanismos de '
         'segurança do sistema eletrônico de votação estabelecido pela Justiça Eleitoral.\n\n'
         'José cometeu crime, em tese, de',
         ['atentado à integridade nacional.', 'interrupção do processo eleitoral.', 'violência política.', 'sabotagem.',
          'abolição violenta do Estado Democrático de Direito.']),
    53: (DPEN, 'Direito Penal - Prescrição', '',
         'Analise os seguintes casos hipotéticos:\n\n'
         'I. Julio, com 19 anos de idade, foi preso em flagrante pelo crime de furto no dia 13 de outubro de 2020. Posteriormente, a denúncia apresentada pelo Ministério Público foi recebida pela Justiça no dia 15 de fevereiro de 2021. Após a regular instrução do feito, Julio foi condenado pelo Magistrado competente a cumprir pena de 2 anos de reclusão. A sentença foi publicada em 19 de outubro de 2024.\n'
         'II. Marcela, de 25 anos de idade, foi denunciada pelo Ministério Público pelo crime de contratação inidônea, ao admitir à licitação, no dia 2 de fevereiro de 2021, empresa declarada inidônea. A denúncia foi recebida no dia 3 de março de 2024. Após a regular instrução do feito, Marcela foi condenada pelo Magistrado competente a cumprir pena de 1 ano de reclusão. A sentença foi publicada no dia 9 de abril de 2025.\n'
         'III. Samir, de 40 anos de idade, foi denunciado pelo Ministério Público pelo crime de falsidade ideológica cometido no dia 13 de dezembro de 2021. A denúncia foi recebida no dia 11 de abril de 2022. Após a regular instrução do feito, Samir foi condenado pelo Magistrado competente a cumprir pena de 1 ano de reclusão. A sentença foi publicada no dia 14 de junho de 2025.\n'
         'IV. Rinaldo foi denunciado pelo Ministério Público pelo crime de Frustração do caráter competitivo de licitação, cometido no dia 11 de julho de 2019. A denúncia foi recebida no dia 14 de dezembro de 2019. Após a regular instrução do feito, Rinaldo, já com setenta anos de idade, foi condenado a cumprir pena de quatro anos de reclusão. A sentença foi publicada em 1º de fevereiro de 2025.\n\n'
         'Nos termos preconizados pelo Código Penal, a prescrição da pretensão punitiva estatal restou consumada com base '
         'na pena fixada APENAS para:',
         ['Julio e Rinaldo.', 'Julio, Samir e Rinaldo.', 'Marcela, Samir e Rinaldo.', 'Julio, Marcela e Samir.',
          'Marcela e Samir.']),
    54: (DPEN, 'Direito Penal - Falsificação de Papéis Públicos', '',
         'Josué, aproveitando-se dos equipamentos emprestados por um amigo, falsificou inúmeros bilhetes de transporte '
         'público administrado por determinado Município, colocando-os em circulação. A polícia inicia intensa '
         'investigação e consegue apurar a autoria delitiva. Após obter a necessária ordem judicial, comparece na '
         'residência de Josué para cumprimento de mandado de busca domiciliar e de mandado de prisão preventiva contra ele. '
         'Josué acaba sendo preso pela polícia. Neste caso hipotético, na esteira do Código Penal, Josué cometeu, em tese, '
         'o crime de',
         ['fraude em certames de interesse público.', 'falsidade ideológica.', 'falsificação de papéis públicos.',
          'falsificação de documento público.', 'falsificação de selo ou sinal público.']),
    71: (INF, 'Modelagem Relacional', BI3,
         'Um Departamento Estadual está projetando um banco de dados para gerenciar o Imposto sobre Propriedade de Veículos '
         'Automotores (IPVA). O sistema deve incluir as tabelas:\n\n'
         '• Proprietarios: dados dos proprietários de veículos (CPF, nome, endereco).\n'
         '• Veiculos: informações dos veículos (placa, modelo, ano, CPF).\n'
         '• Pagamentos_IPVA: registro dos pagamentos do IPVA (Codigo_pagamento, valor, data_pagamento, veiculo_associado).\n\n'
         'A configuração correta de chaves primárias (PKs) e estrangeiras (FKs) para esse sistema é',
         ['PK de Proprietarios: CPF; PK de Veículos: Placa; PK de Pagamentos_IPVA: Data de Pagamento; FK em Veiculos: CPF (ref. Proprietarios); FK em Pagamentos_IPVA: Ano (ref. Veiculos).',
          'PK de Proprietarios: Nome; PK de Veiculos: Modelo; PK de Pagamentos_IPVA: Data_Pagamento; FK em Veiculos: Nome (ref. Proprietarios); FK em Pagamentos_IPVA: Modelo (ref. Veiculos).',
          'PK de Proprietarios: CPF; PK de Veiculos: Placa; PK de Pagamentos_IPVA: Codigo_pagamento; FK em Veiculos: CPF (ref. Proprietarios); FK em Pagamentos_IPVA: Placa (ref. Veiculos).',
          'PK de Proprietarios: CPF; PK de Veiculos: Placa; PK de Pagamentos_IPVA: Codigo_pagamento; FK em Veiculos: Placa (ref. Pagamentos_IPVA); FK em Pagamentos_IPVA: CPF (ref. Proprietarios).',
          'PK de Proprietarios: CPF; PK de Veiculos: Placa; PK de Pagamentos_IPVA: Codigo_pagamento; sem FK nas tabelas.']),
    72: (INF, 'SQL', BI3,
         'Suponha que uma Receita Federal está implementando um sistema para gerenciar a arrecadação de tributos como '
         'Imposto sobre a Renda das Pessoas Jurídicas (IRPJ) e Contribuição Social sobre o Lucro Líquido (CSLL). O banco '
         'de dados, aberto e em condições ideais, possui as seguintes tabelas:\n\n'
         '• tbl_contribuintes: campos id_contribuinte (PK), cnpj, razao_social.\n'
         '• tbl_tributos: campos id_tributo (PK), id_contribuinte (FK referenciando tbl_contribuintes), tipo_tributo, valor, data_vencimento.\n\n'
         'Uma Auditora Fiscal da Receita precisa da lista com o total de valores devidos por tipo de tributo, apenas para '
         'tributos com vencimento após 01/01/2025, ordenados pelo valor total em ordem decrescente. O comando SQL correto, '
         'considerando boas práticas de nomeação e integridade referencial, é',
         ["SELECT tipo_tributo, SUM(valor) AS total_valor FROM tbl_tributos WHERE data_vencimento > '2025-01-01' GROUP BY tipo_tributo ORDER BY total_valor DESC;",
          "SELECT tipo_tributo, SUM(valor) FROM tributos WHERE vencimento > '2025-01-01' GROUP BY tipo_tributo ORDER BY 2;",
          "SELECT tipo, SUM(val) AS total FROM tbl_tributos WHERE data_vencimento > '2025-01-01' ORDER BY total;",
          "SELECT tipo_tributo, AVG(valor) AS total_valor FROM tbl_tributos WHERE data_vencimento > '2025-01-01' GROUP BY tipo_tributo ORDER BY total_valor DESC;",
          "SELECT t1.tipo_tributo, SUM(t1.valor) FROM tbl_tributos t1, tbl_contribuintes t2 WHERE t1.id_contribuinte = t2.id_contribuinte AND t2.data_vencimento > '2025-01-01' GROUP BY t1.tipo_tributo ORDER BY 2 DESC;"]),
    73: (INF, 'Ferramentas de Produtividade - MS Excel', BI6,
         'Um Analista financeiro mantém uma planilha Excel para calcular o lucro mensal, definido como a diferença entre '
         '“Receita” e “Custos”, para várias filiais. Embora a planilha seja atualizada semanalmente por outra equipe, as '
         'colunas “Receita” e “Custos” mantêm esses nomes de forma consistente, mas podem mudar de posição ou ter outras '
         'colunas adicionadas/removidas ao redor. O Analista precisa criar uma macro para automatizar o cálculo do lucro em '
         '10.000 linhas, de forma que ela continue funcionando corretamente mesmo após essas mudanças na disposição das '
         'colunas. Em condições ideais, a forma mais adequada de criar essa macro para que as referências às colunas '
         '“Receita” e “Custos” não sejam perdidas ou fiquem incorretas, garantindo um cálculo confiável do lucro, é',
         ['contar com a memória de versões anteriores do Excel para tentar localizar as colunas desejadas, mesmo que tenham mudado de lugar.',
          'gravar uma macro simples que use apenas as referências de células “C2” (Receita) e “D2” (Custos) para o cálculo, confiando que as colunas não se moverão.',
          'criar uma macro que localize as colunas “Receita” e “Custos” na linha 1, mas dependa de sua ordem fixa (exemplo: “Receita” sempre antes de “Custos”).',
          'adicionar uma validação manual toda vez que a planilha for atualizada, para garantir que “Receita” e “Custos” estejam na posição esperada.',
          'converter a planilha em uma tabela estruturada do Excel e criar a macro referenciando diretamente os nomes das colunas “Receita” e “Custos” dessa tabela.']),
    74: (INF, 'Segurança da Informação - Gestão de Vulnerabilidades', BI2,
         'Um servidor de rede de uma Secretaria da Fazenda, que armazena informações financeiras confidenciais, foi '
         'configurado com um firewall que permite apenas o tráfego essencial para seu funcionamento. Além disso, todos os '
         'arquivos armazenados estão criptografados. No entanto, durante uma auditoria de segurança, foi identificada uma '
         'vulnerabilidade em um software de terceiros instalado no servidor. A medida adicional mais crucial para mitigar o '
         'risco de exploração dessa vulnerabilidade e potencial acesso aos dados é',
         ['realizar testes de penetração regulares para identificar e corrigir os antivírus, trocar o equipamento e outras possíveis vulnerabilidades.',
          'desabilitar completamente o acesso remoto a esse servidor.',
          'implementar um sistema de detecção de intrusão para monitorar atividades suspeitas.',
          'garantir que todas as estações de trabalho dos usuários que acessam o servidor possuam um antivírus atualizado.',
          'reforçar a política de senhas para o acesso ao servidor com requisitos ainda mais complexos.']),
    75: (INF, 'Segurança da Informação: Malwares e Crimes Digitais (Parte 1)', BI2,
         'Um alerta de segurança informa que diversos funcionários de um órgão público receberam e-mails com um anexo em '
         'formato “.pdf” intitulado “Notificação Urgente – Processo Administrativo”. Ao abrir o anexo, os computadores são '
         'infectados por um software que criptografa todos os arquivos do disco rígido e exibe uma mensagem exigindo um '
         'pagamento em criptomoeda para a recuperação dos dados. O tipo de malware utilizado nesse ataque e a tática de '
         'engenharia social empregada foram, correta e respectivamente:',
         ['worm – confiança e familiaridade.', 'vírus – intimidação e urgência.', 'trojan – curiosidade e autoridade.',
          'ransomware – intimidação e urgência.', 'spyware – ganância e oportunidade.']),
    76: (INF, 'Computação em Nuvem - Modelos de Serviço', BI6,
         'Um Auditor Fiscal da SEFAZ analisou a proposta de um edital para contratação de um aplicativo totalmente baseado '
         'em nuvem, gerenciado totalmente pelo provedor, sem a necessidade de instalação ou manutenção por parte do '
         'usuário, incluindo todas as atualizações, correções de bugs e manutenção geral, sendo acessível diretamente via '
         'navegador web. O modelo de serviço constante no edital é o',
         ['FaaS', 'SaaS', 'PaaS', 'IaaS', 'CaaS']),
    77: (INF, 'Sistemas Operacionais - Linux e Windows', '',
         'Uma nova Secretaria da Fazenda está instalando Linux e Windows 11 via dual boot e criou uma apostila para ensinar '
         'a operar tais sistemas. Nessa apostila constam as seguintes características desses sistemas:\n\n'
         'I. Os diretórios /home e /etc são destinados, respectivamente, aos arquivos pessoais dos usuários e arquivos de configurações do sistema.\n'
         'II. A partir do PowerShell é possível executar comando e criar scripts para automação.\n'
         'III. Oferecem ambientes gráficos intuitivos, como GNOME e KDE Plasma.\n'
         'IV. A instalação de pacotes pode ser através de gerenciadores de pacotes como o DPKG e o RPM.\n\n'
         'As características I, II, III e IV referem-se, correta e respectivamente, ao',
         ['Linux – Windows 11 – Linux – Linux.', 'Windows 11 – Linux – Linux – Linux.',
          'Linux – Windows 11 – Linux – Windows 11.', 'Windows 11 – Linux – Linux – Windows 11.',
          'Windows 11 – Linux – Windows 11 – Linux.']),
    78: (INF, 'BI: Data Warehouse e Data Mart', BI4,
         'Durante a implantação de um sistema de apoio à decisão em uma Secretaria da Fazenda, foi definido o uso de um '
         'Data Warehouse (DW) para armazenar dados históricos de arrecadação e fiscalização tributária. Neste cenário, o '
         'ambiente de dados',
         ['utiliza o DW para processar dados semiestruturados e não estruturados provenientes de sistemas transacionais e priorizar a integração com dados estruturados também coletados dos bancos de dados operacionais.',
          'integra as tabelas fato, que preferencialmente contêm dados desnormalizados, pois isso aumenta a integridade referencial dos dados históricos.',
          'utiliza os bancos de dados multidimensionais, conhecidos como OLTPs, para a análise dos grandes volumes de dados históricos, pois estes otimizam consultas complexas com junções em múltiplas tabelas fato.',
          'contempla a etapa de Transformação do ETL que aplica regras de negócios, derivação de novos atributos e ajustes de granularidade dos dados, de modo a adequá-los ao modelo dimensional e às necessidades analíticas.',
          'é criado em um DW orientado a temas, no qual as tabelas de dimensão armazenam eventos mensuráveis e quantitativos, como valores financeiros ou quantidades de processos fiscais analisados.']),
    79: (INF, 'BI - Power BI e Tableau', BI4,
         'Durante o desenvolvimento de dashboards gerenciais em uma Secretaria da Fazenda, foi necessário integrar dados '
         'oriundos de sistemas distintos: sistema de arrecadação tributária, sistema de fiscalização eletrônica e planilhas '
         'manuais de acompanhamento operacional, dentre outros. Uma Auditora Fiscal utilizou o Power BI e o Tableau, '
         'seguindo a seguinte orientação:',
         ['No Power BI, quando o ambiente integra diferentes fontes de dados é uma boa prática usar o Power Query, que utiliza a linguagem de script M, para realizar transformações, normalização de dados e padronização de tipos antes do carregamento dos dados no modelo analítico.',
          'No Power BI, o uso de colunas calculadas que utilizam fórmulas DAX (Data Analysis Execution) é a prática mais indicada para otimizar o desempenho de consultas em grandes volumes de dados integrados, pois essas colunas armazenam os cálculos diretamente na fonte.',
          'No Tableau, a criação de unions entre fontes de dados publicadas pode ser realizada sobre quaisquer grandes volumes de dados, visto que o processamento ocorre sempre na camada de visualização, não afetando a performance. Além disso, ao se alterar o tipo de dados depois de unir as tabelas, a união será mantida.',
          'No Power BI, os dados carregados em memória por meio do modo Import podem ser automaticamente atualizados em tempo real, sem necessidade de configuração adicional no serviço online, através de arquivos .pbix, que armazenam entre 1 PB e 10 PB de dados.',
          'No Tableau e no Power BI, a definição de medidas DAX ou cálculos LOD são cruciais em operações que exigem cruzamento de múltiplas fontes de dados, pois tais recursos permitem o controle da granularidade que se deseja computar: em um nível mais granular (EXCLUDE), menos granular (INCLUDE) ou em um nível independente (FIXED).']),
    80: (INF, 'Gestão e Governança de TI - Indicadores (KPIs)', BI7,
         'Em uma Secretaria da Fazenda, a equipe de planejamento estratégico está revisando o painel de indicadores '
         'utilizados para monitorar o desempenho da arrecadação tributária e a efetividade das ações fiscais. Os dados são '
         'consolidados a partir de sistemas internos e bases externas, e a definição adequada dos KPIs é fundamental para a '
         'tomada de decisão. O indicador',
         ['“valor total das despesas operacionais da Secretaria” é adequado para medir o desempenho do setor responsável pela fiscalização de tributos estaduais.',
          '“valor total de autuações fiscais emitidas no mês” é apropriado para medir a eficiência da fiscalização, mesmo sem considerar o percentual efetivamente recolhido.',
          '“percentual de recuperação de créditos tributários decorrentes de ações fiscais finalizadas no período”, que é calculado pela razão entre o valor recolhido e o valor total autuado, é adequado para medir a efetividade fiscal.',
          '“número de novos contribuintes cadastrados no sistema da Secretaria ao final do mês” é eficaz para mensurar a produtividade das equipes de fiscalização de campo.',
          '“total de processos fiscais em tramitação” reflete a agilidade dos procedimentos fiscais e a eficiência do setor de arrecadação.']),
}
