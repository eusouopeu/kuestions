# -*- coding: utf-8 -*-
"""SEFAZ-PI 2025 (FCC) - Agente de Tributos da Fazenda Estadual - P1 (caderno A01, Tipo 004), transcrita das imagens.
Excluidas: 42-43 (Constituicao do Estado do Piaui), 45 (LC estadual 13/1994), 55-63 e 65-70 (Conhecimentos Regionais)."""

LP, MF, EST, AP = 'Língua Portuguesa', 'Matemática Financeira', 'Estatística', 'Administração Pública'
DCON, DADM, INF = 'Direito Constitucional', 'Direito Administrativo', 'Noções de Informática'
BMF1, BMF2 = '[1] Juros e Taxas (3 aulas)', '[2] Equivalência e Aplicações Financeiras (3 aulas)'
BE1 = '[1] Estatística Descritiva Univariada (5 aulas)'
BE2 = '[2] Combinatória e Probabilidade (2 aulas)'
BE3 = '[3] Variáveis Aleatórias e Distribuições (4 aulas)'
BE4 = '[4] Inferência Estatística (4 aulas)'
BE5 = '[5] Regressão, Séries Temporais e Análise Multivariada (5 aulas)'
BC1 = '[1] Teoria Constitucional e Direitos Fundamentais (5 aulas)'
BC2 = '[2] Nacionalidade e Direitos Políticos (3 aulas)'
BC3 = '[3] Organização do Estado e Administração Pública (2 aulas)'
BC4 = '[4] Organização dos Poderes (5 aulas)'
BA1 = '[1] Fundamentos e Poderes Administrativos (3 aulas)'
BA3 = '[3] Organização Administrativa e Entidades (3 aulas)'
BA4 = '[4] Agentes Públicos e Licitações/Contratos (4 aulas)'
BA5 = '[5] Serviços Públicos e Parcerias (2 aulas)'
BA6 = '[6] Responsabilidade, Controle e Improbidade (3 aulas)'
BA7 = '[7] Bens Públicos e Intervenção na Propriedade (2 aulas)'
BI2 = '[2] Segurança da Informação (3 aulas)'
BI3 = '[3] Banco de Dados e Modelagem (4 aulas)'
BI4 = '[4] Business Intelligence e Big Data (3 aulas)'
BI6 = '[6] Ferramentas Corporativas e Web (3 aulas)'

CTX = {
    't1': ('Leia o texto abaixo para responder à questão.\n\n'
           '[A máquina funcional e a arte literária]\n\n'
           'O homem está começando a entender como se desmonta e como se torna a montar a mais complicada e imprevisível '
           'de todas as suas máquinas: a linguagem. O mundo de hoje, em relação àquele que cercava o homem primitivo, é '
           'muito mais rico de palavras, de conceitos e de signos. Mas é sobretudo mais rico em operações computacionais.\n\n'
           'Entregue-se a um computador a tarefa de realizar operações de fato criativas: será a máquina capaz de substituir '
           'o poeta e o escritor? Assim como já temos máquinas que leem, máquinas que executam análises linguísticas de '
           'textos literários, máquinas que traduzem, máquinas que resumem, teríamos, então, máquinas capazes de criar e '
           'compor poemas e romances?\n\n'
           'O que interessa nem tanto é essa pergunta específica, mas sua viabilidade teórica, que poderia abrir uma série '
           'de conjecturas insólitas. Nesse momento, não estou pensando numa máquina capaz apenas de uma produção literária '
           'em série; estou pensando numa máquina que escreva e ponha em jogo, na página, todos aqueles elementos que '
           'costumamos considerar como os mais ciosos atributos da intimidade psicológica, da experiência, da '
           'imprevisibilidade das mudanças de humor, os sobressaltos, as aflições e as iluminações interiores. E o que '
           'seriam eles, senão um número correspondente de campos linguísticos, dos quais podemos tranquilamente chegar a '
           'estabelecer léxico, gramática, sintaxe e propriedades permutativas?\n\n'
           'Com efeito, já que os desenvolvimentos da cibernética têm por alvo máquinas capazes de aprender, de mudar o '
           'próprio programa, de desenvolver suas próprias necessidades, nada nos impede de prever uma máquina literária '
           'que, a certa altura, sinta-se insatisfeita com o próprio tradicionalismo de suas funções e comece a propor novas '
           'maneiras de entender a escritura e a desorganizar completamente os próprios códigos, na busca não apenas de uma '
           'nova linguagem, mas de novas percepções do mundo.\n\n'
           '(Adaptado de: CALVINO, Italo. Assunto encerrado. Trad. Roberta Barni. São Paulo: Companhia das Letras, 2006, p. 203-204)'),
    't2': ('Leia o texto abaixo para responder à questão.\n\n'
           'Os caminhos para a reconciliação\n\n'
           'Existe um setor do nosso sistema de justiça que trabalha em nome de reconciliação. Ele atua mediando conflitos '
           'de todo tipo. Ele busca uma sociedade reconciliada, livre e madura. Eu não sabia de sua existência até ser '
           'convidada para palestrar num encontro de mulheres sobre o tema da Justiça Restaurativa, realizado em Brasília. '
           'Quando me dediquei a estudar o assunto, fiquei absolutamente perplexa e emocionada.\n\n'
           'Qualquer pessoa que já se propôs a enfrentar um processo de reconciliação na vida, em qualquer escala, sabe que '
           'a empreitada não é fácil. Muitas vezes, ao encarar “o outro lado”, a gente se dá conta de estar olhando no '
           'espelho e essa revelação é perturbadora.\n\n'
           'Não se trata aqui de diminuir a gravidade de crimes cometidos e a responsabilidade do criminoso. Muito pelo '
           'contrário. Trata-se de uma tentativa honesta de reconciliar um país e de compreender que estruturas de poder '
           'segregacionistas produzem segregação e autorizam comportamentos. Como disse Nelson Mandela: se sabemos como '
           'ensinar pessoas a odiar umas às outras também podemos ensiná-las a amar.\n\n'
           'A justiça restaurativa é um conjunto ordenado e sistêmico de princípios, métodos, técnicas e atividades '
           'próprias, que visa à conscientização sobre os fatores relacionais, institucionais e sociais motivadores de '
           'conflitos. É um conceito que implica a sociedade na formação das pessoas que nela vivem. É a ideia de que a '
           'sociedade é corresponsável pelos crimes que seus membros cometem. Como poderia ser diferente? Uma sociedade que '
           'se quer inocente dos horrores que dentro dela operam não é uma sociedade justa e igualitária.\n\n'
           'A luta pela reconciliação encontra abrigo nesse setor da justiça, e acredita que a reconciliação se faz por '
           'restauração do diálogo e não por cancelamentos ou prisões. O poder da transformação positiva de pessoas e de '
           'comunidades não será o que temos de mais humano?\n\n'
           '(Adaptado de: LACOMBE, Milly. São Paulo: Folha de S. Paulo, 27/03/25)'),
    'z': ('Utilize, se necessário, o quadro a seguir, que fornece algumas informações da distribuição normal padrão (Z), '
          'ou seja, as probabilidades P(0 < Z ≤ z):\n\n'
          '• z = 0,25 → 0,10\n• z = 0,50 → 0,19\n• z = 0,52 → 0,20\n• z = 0,84 → 0,30\n• z = 1,00 → 0,34\n'
          '• z = 1,25 → 0,39\n• z = 1,28 → 0,40\n• z = 1,50 → 0,43\n• z = 1,64 → 0,45\n• z = 2,00 → 0,48'),
}
CTX_DE = {1: 't1', 2: 't1', 3: 't1', 4: 't1', 8: 't2', 9: 't2', 10: 't2', 11: 't2', 12: 't2', 13: 't2',
          32: 'z', 33: 'z'}

Q = {
    1: (LP, 'Reescrita de Frase - Sinonímia', '',
        'Considerando-se o contexto, traduz-se adequadamente o sentido de um segmento do texto em:',
        ['imprevisibilidade das mudanças de humor (3º parágrafo) = instáveis insinuações de ânimo.',
         'o próprio tradicionalismo de suas funções (4º parágrafo) = seu conservadorismo já factual.',
         'em relação àquele que cercava o homem primitivo (1º parágrafo) = relativo ao que se inscrevia no ser primordial.',
         'uma série de conjecturas insólitas (3º parágrafo) = uma sequência de suposições estranhas.',
         'ciosos atributos da intimidade (3º parágrafo) = sisudas atribulações intimistas.']),
    2: (LP, 'Interpretação de Texto', '',
        'Considera-se que a linguagem é a mais complicada e imprevisível das máquinas criadas pelo homem',
        ['porque a linguagem cibernética ignora a qualidade humanística e artística de poemas e romances tradicionais.',
         'quando o código de intercomunicação entre as máquinas interdita a ação de uma iniciativa humana.',
         'devido ao fato de que o mundo de hoje é mais carregado de palavras e de conceitos do que nos tempos primitivos.',
         'quando se admite que as palavras nascem a partir de análises linguísticas e de sofisticadas operações computacionais.',
         'porque as máquinas podem ir além de uma programação restrita e se revelarem capazes de criar seu próprio sistema.']),
    3: (LP, 'Interpretação de Texto - Referenciação', '',
        'A pergunta específica referida no início do 3º parágrafo diz respeito',
        ['à eventual capacidade de virem as máquinas a compor peças literárias como as dos escritores.',
         'à específica tarefa a ser executada pelas máquinas se elas se dispuserem a replicar em série os textos literários.',
         'à hipótese de haver máquinas que saibam não apenas ler mas executar análises gramaticais e traduzir.',
         'à possível inviabilidade de poetas e romancistas persistirem na execução artística de suas obras.',
         'à viabilização de uma teoria linguística capaz de superar as possibilidades virtuais da linguagem computacional.']),
    4: (LP, 'Interpretação de Texto', '',
        'Admite-se no texto a possibilidade de surgir uma máquina literária com características de fato subjetivas, tal '
        'como se depreende, por exemplo, do que está expresso no segmento',
        ['um número correspondente de campos linguísticos (3º parágrafo).',
         'insatisfeita com o próprio tradicionalismo (4º parágrafo).',
         'sobretudo mais rico em operações computacionais (1º parágrafo).',
         'estabelecer léxico, gramática, sintaxe e propriedades permutativas (3º parágrafo).',
         'uma série de conjecturas insólitas (3º parágrafo).']),
    5: (LP, 'Morfossintaxe - Voz Passiva', '',
        'Máquinas computacionais logo terão desenvolvido sua plena capacidade de criação.\n\n'
        'Transpondo-se a frase acima para a voz passiva, a forma verbal resultante deverá ser',
        ['será desenvolvida.', 'haverão de ser desenvolvidas.', 'haverão de desenvolver.', 'terão sido desenvolvidas.',
         'terá sido desenvolvida.']),
    6: (LP, 'Concordância Verbal', '',
        'As normas de concordância verbal estão plenamente observadas na frase:',
        ['Admitam-se que são muitas as dificuldades para que na linguagem computacional se venha a expressar emoções humanas.',
         'Em poucos anos se comprovará, talvez, a capacidade de absorverem as máquinas algo da espiritualidade humana.',
         'Atribua-se a um computador tarefas de fato criativas para avaliar como se saem de tais incumbências.',
         'A riqueza crescente de palavras, conceitos e signos fazem com que se torne mais complexos os sistemas linguísticos.',
         'O que interessam no acionamento das propriedades permutativas da linguagem é o quanto de criação resultam delas.']),
    7: (LP, 'Reescrita e Coesão Textual', '',
        'Serão um dia as máquinas computacionais capazes de gerar uma linguagem na qual se manifeste a plena subjetividade '
        'humana?\n\nA redação da frase acima permanecerá coerente e correta na seguinte reconstrução:',
        ['A linguagem das máquinas computacionais se fará obter num dia a manifestação da nossa plena subjetividade?',
         'A geração de uma linguagem plena da subjetividade humana através das máquinas computacionais algum dia estará capaz?',
         'Estarão um dia as máquinas computacionais aptas para dotar sua linguagem da expressão da nossa subjetividade?',
         'A questão é saber se um dia as máquinas computacionais se confiará o acesso à linguagem da nossa plena subjetividade?',
         'Quem sabe se um dia as máquinas computacionais se incumbirão pela subjetividade que cabem às nossas palavras?']),
    8: (LP, 'Interpretação de Texto', '',
        'A reconciliação de que trata o texto está definida com objetividade no segmento',
        ['diminuir a gravidade de crimes cometidos (3º parágrafo).',
         'Uma sociedade que se quer inocente dos horrores (4º parágrafo).',
         'se faz por restauração do diálogo (5º parágrafo).',
         'Existe um setor do nosso sistema de justiça (1º parágrafo).',
         'enfrentar um processo de reconciliação (2º parágrafo).']),
    9: (LP, 'Reescrita e Coesão Textual', '',
        'Considere as seguintes afirmações:\n\n'
        '1. A justiça restaurativa é fundamentalmente conciliatória.\n'
        '2. Ela é conciliatória ao pretender mediar os conflitos.\n\n'
        'Essas afirmações articulam-se com clareza, coerência e correção neste período:',
        ['A restauração conciliatória da justiça se dá em meio aos conflitos fundamentais.',
         'A mediação pretensiosa da justiça restaurativa ocorre em função de seus conflitos.',
         'Ao pretender mediar os conflitos, o fundamento da justiça é a restauração conciliatória.',
         'É pretensão da justiça restaurativa mediar os conflitos para conciliá-los de todo.',
         'Para ser conciliatória, ao mediar conflitos, a justiça deve restaurar seus fundamentos.']),
    10: (LP, 'Interpretação de Texto', '',
         'Um dos principais desafios para o integrante de uma operação social reconciliatória está em',
         ['pretender que as expressões de ódio e de amor devam converter-se reciprocamente.',
          'acreditar que uma das partes litigantes detém de fato uma virtude incontestável.',
          'considerar que a razão que justifica um ato hostil do outro não deve ser relevada.',
          'aceitar que uma reconciliação livre e madura implica uma abdicação da racionalidade.',
          'buscar uma mais isenta avaliação de posicionamentos que se mostram polarizados.']),
    11: (LP, 'Interpretação de Texto', '',
         'No quarto parágrafo afirma-se que a justiça restaurativa',
         ['resulta de uma aplicação metódica de prática e valores por meio da qual o indivíduo e a sociedade compartilham suas responsabilidades.',
          'propõe-se a difundir parâmetros e métodos objetivos para que a apuração de desvios de conduta se faça com todo o rigor jurídico.',
          'opera por meio de um conjunto de procedimentos algo aleatórios que buscam retratar uma sociedade complexa em que todos podem ser culpados.',
          'é alcançada quando a imaginação humana é acionada para coibir os dilemas e os sobressaltos próprios da vida social.',
          'nasce a partir do momento em que uma sociedade se mostra mais complacente com quem subverte princípios de uma ordenação igualitária.']),
    12: (LP, 'Interpretação de Texto', '',
         'Na frase ao encarar “o outro lado”, a gente se dá conta de estar olhando no espelho e essa revelação é '
         'perturbadora (2º parágrafo), deve-se entender que',
         ['a contemplação do outro pode resultar em desfiguração dos nossos mais íntimos traços.',
          'a percepção da imagem alheia ganha força quando contrastada com a da nossa imagem.',
          'o respeito à alteridade, uma vez intensificado, resulta em perda do amor-próprio.',
          'o reconhecimento da imagem do outro pode nos abalar como uma imagem autorrefletida.',
          'o enfrentamento do próximo é uma operação que corrompe a imagem que fazemos de nós.']),
    13: (LP, 'Pontuação', '',
         'É inteiramente aceitável esta nova pontuação de uma frase do texto:',
         ['É um conceito, que implica a sociedade: na formação das pessoas que nela vivem. (4º parágrafo)',
          'acredita que a reconciliação se faz por restauração do diálogo, e não por cancelamentos, ou prisões. (5º parágrafo)',
          'Quando me dediquei, a estudar o assunto, fiquei absolutamente perplexa, e emocionada. (1º parágrafo)',
          'a gente se dá conta: de estar olhando no espelho, e essa revelação, é perturbadora. (2º parágrafo)',
          'se sabemos como ensinar pessoas, a odiar umas às outras, também podemos ensiná-las a amar. (3º parágrafo)']),
    14: (LP, 'Morfologia - Tempos e Modos Verbais', '',
         'Os tempos e os modos das formas verbais estão adequadamente articulados na frase:',
         ['A sociedade seria então nesta hipótese corresponsável pelos crimes das pessoas que nela haverão de viver.',
          'Caso uma sociedade pretenda inocentar-se dos horrores nela cometido, teria precisado inocentar todos os seus componentes.',
          'Teria existido um setor no nosso sistema de justiça que tivesse trabalhado em nome da reconciliação?',
          'Eu não saberia de sua existência até que fora convidada para palestrar num encontro de mulheres.',
          'Se viermos a encarar o outro lado, teremos sabido que tal empreitada não fosse fácil.']),
    15: (MF, 'Taxas', BMF1,
         'Um empréstimo no valor de R$ 15.000,00 é concedido pelo prazo de um ano a uma taxa de juros nominal de 36% ao ano '
         'com capitalização trimestral. O montante do empréstimo, em reais, pode ser calculado multiplicando 15.000 por',
         ['(1,36/4 + 1)', '(1,09)^4', '4(1,36)^(1/12)', '(1,36)^(1/3)', '4(1,09)^(1/3)']),
    16: (MF, 'Juros Simples', BMF1,
         'Uma pessoa irá necessitar de R$ 120.600,00 para adquirir um automóvel daqui a 8 meses. O menor valor (C), em 1.000 '
         'reais, que ela deve depositar hoje em um banco que remunera os depósitos de seus clientes a uma taxa de juros '
         'simples de 10,8% ao ano, com o objetivo de adquirir o automóvel daqui a 8 meses, é tal que',
         ['110 ≤ C < 115', '115 ≤ C < 120', '105 ≤ C < 110', 'C < 105', 'C ≥ 120']),
    17: (MF, 'Equivalência de Capitais', BMF2,
         'Dois títulos de valores nominais iguais a R$ 30.000,00 e R$ 50.000,00 deverão ser quitados daqui a 2 meses e 4 '
         'meses, respectivamente. O devedor propõe substituir estas duas obrigações por um único pagamento daqui a 6 meses. '
         'Utilizando a taxa de juros simples de 24% ao ano, obtém-se que o valor deste único pagamento tem de ser no valor de',
         ['R$ 83.800,00', 'R$ 85.200,00', 'R$ 83.200,00', 'R$ 86.400,00', 'R$ 84.400,00']),
    18: (MF, 'Juros Compostos', BMF1,
         'O valor dos juros referente a uma aplicação realizada na data de hoje pelo prazo de 6 meses a uma taxa de juros '
         'compostos de 3% ao trimestre é igual a R$ 669,90. Caso esta aplicação seja realizada a uma taxa de juros simples '
         'de 15% ao ano, o valor dos juros será de',
         ['R$ 1.080,00', 'R$ 990,00', 'R$ 825,00', 'R$ 840,00', 'R$ 750,00']),
    19: (MF, 'Sistemas de Amortização', BMF2,
         'Uma empresa deverá quitar uma dívida de R$ 40.400,00 na data de hoje. O banco permite que tal dívida seja '
         'liquidada por meio de duas prestações de valores iguais vencendo uma daqui a 1 mês e a segunda daqui a 2 meses '
         'considerando a taxa de juros compostos de 2% ao mês. O valor de cada prestação é de',
         ['R$ 20.604,00', 'R$ 20.208,00', 'R$ 20.204,00', 'R$ 20.808,00', 'R$ 20.400,00']),
    20: (MF, 'Taxas', BMF1,
         'Um capital no valor de R$ 50.000,00 é aplicado, durante um ano, permitindo que seja resgatado um montante de '
         'R$ 58.800,00 no final do período de aplicação. Se a taxa real de juros referente a esta aplicação foi de 5%, então '
         'a taxa de inflação verificada no período de aplicação foi de',
         ['11,8%', '12,0%', '11,2%', '12,6%', '11,6%']),
    21: (MF, 'Operações de Desconto', BMF2,
         'Um título de valor nominal igual a R$ 50.000,00 foi descontado 2 meses antes de seu vencimento apresentando um '
         'valor atual igual a R$ 48.020,00. Sabe-se que foi utilizada uma operação de desconto comercial composto com uma '
         'taxa de desconto mensal de',
         ['2,00%', '1,80%', '1,98%', '2,20%', '1,94%']),
    22: (MF, 'Juros Compostos', BMF1,
         'Seja e a base dos logaritmos neperianos. Então o montante correspondente à aplicação de um capital no valor de '
         'R$ 50.000,00, durante 2 anos, no regime de capitalização contínua a uma taxa de 15% ao ano, é igual, em reais, a',
         ['100.000e^0,15', '100.000(1 + e^0,15)', '50.000(1 + e^0,30)', '50.000(1 + e^0,15)^2', '50.000e^0,30']),
    23: (MF, 'Operações de Desconto', BMF2,
         'Um título é descontado em um banco 4 meses antes de seu vencimento a uma taxa de desconto de 24% ao ano. '
         'Sabendo-se que foi considerada a operação de desconto comercial simples, obteve-se um valor atual igual a '
         'R$ 18.768,00. Caso tivesse sido decidido descontar este título 2 meses antes de seu vencimento a uma taxa de '
         'desconto de 21% ao ano e também segundo uma operação de desconto comercial simples, o valor atual seria de',
         ['R$ 19.635,00', 'R$ 19.176,00', 'R$ 19.686,00', 'R$ 19.584,00', 'R$ 19.201,50']),
    24: (MF, 'Operações de Desconto', BMF2,
         'Uma duplicata foi descontada 4 meses antes de seu vencimento segundo uma operação de desconto racional simples a '
         'uma taxa de desconto de 30% ao ano e verifica-se que o respectivo valor do desconto foi de R$ 2.060,00. Caso esta '
         'duplicata tivesse sido descontada segundo uma operação de desconto comercial simples, com a mesma taxa de '
         'desconto de 30% ao ano, o valor atual do título seria de',
         ['R$ 20.754,00', 'R$ 20.610,00', 'R$ 20.718,00', 'R$ 20.394,00', 'R$ 19.810,00']),
    25: (EST, 'Análise Combinatória', BE2,
         'Um comitê de 4 membros deve ser formado a partir de 6 auditores e 5 especialistas em tributos, com a condição de '
         'que o comitê contenha, pelo menos, 2 especialistas. O número possível de formações distintas é',
         ['190', '240', '215', '205', '225']),
    26: (EST, 'Medidas de Variabilidade ou Dispersão', BE1,
         'Considere um conjunto de dados com as seguintes medidas:\n\n'
         '• Média = 10\n• Mediana = 9\n• Amplitude = 8\n• Desvio-padrão = 3\n\n'
         'Se a cada valor do conjunto for somado o número 4, então o novo conjunto de dados terá',
         ['Média = 14, Mediana = 13, Amplitude = 8, Desvio-padrão = 7.',
          'Média = 10, Mediana = 13, Amplitude = 8, Desvio-padrão = 7.',
          'Média = 14, Mediana = 13, Amplitude = 8, Desvio-padrão = 3.',
          'Média = 10, Mediana = 9, Amplitude = 12, Desvio-padrão = 3.',
          'Média = 14, Mediana = 9, Amplitude = 8, Desvio-padrão = 3.']),
    27: (EST, 'Teoria da Amostragem', BE4,
         'Um auditor precisa examinar 100 declarações fiscais de um total de 500. Para isso, ele sorteia um número entre 1 '
         'e 5 e, a partir desse ponto, seleciona uma declaração a cada 5 registros para verificação. Esse método de seleção '
         'é conhecido como amostragem',
         ['por conglomerados.', 'por conveniência.', 'aleatória simples.', 'sistemática.', 'estratificada.']),
    28: (EST, 'Probabilidade', BE2,
         'Suponha que dois eventos, A e B, ocorram independentemente, com P(A) = 0,4 e P(B) = 0,5. Então a probabilidade '
         'de ocorrer, pelo menos, um desses eventos é de',
         ['80%', '90%', '60%', '50%', '70%']),
    29: (EST, 'Variáveis Aleatórias e Distribuições Contínuas', BE3,
         'O tempo para autuar um processo administrativo em um sistema automatizado é modelado por uma variável contínua '
         'com distribuição uniforme entre 8:00h e 11:00h, horário disponível para autuações de processos. A probabilidade '
         'de que uma declaração seja processada antes das 9:00h é',
         ['1/3', '2/3', '3/4', '1/2', '1/4']),
    30: (EST, 'Distribuições Discretas de Probabilidade', BE3,
         'Em uma auditoria tributária, a probabilidade de uma declaração fiscal apresentar um erro é de 1/4. Se um auditor '
         'examina 4 declarações de forma independente, a probabilidade de encontrar exatamente 2 declarações com erro é',
         ['27/64', '27/256', '54/128', '27/128', '9/32']),
    31: (EST, 'Distribuições Discretas de Probabilidade', BE3,
         'Em um departamento de arrecadação, o número de autos de infração com erros detectados em um dia segue uma '
         'distribuição de Poisson com média λ = 1. A probabilidade de que ocorra, no máximo, um erro em determinado dia, '
         'onde e corresponde à base dos logaritmos naturais com valor aproximado 2,718, é',
         ['1 – 2e^(–1)', '2e^(–1)', '2 – e^(–1)', '1 – e^(–1)', 'e^(–1)']),
    32: (EST, 'Variáveis Aleatórias e Distribuições Contínuas', BE3,
         'Em uma análise, os valores são modelados por uma distribuição normal com média 1 e desvio padrão 0,1. Então a '
         'probabilidade aproximada de que um valor seja superior a 1,2 é dada por',
         ['10%', '40%', '2%', '95%', '5%']),
    33: (EST, 'Variáveis Aleatórias e Distribuições Contínuas', BE3,
         'Uma fábrica produz pneus cuja vida média é normalmente distribuída, com média igual a 60.000 quilômetros e '
         'desvio-padrão de 4.000 quilômetros. Com base nisso, a probabilidade de um pneu dessa fábrica durar mais de 66.560 '
         'quilômetros é de',
         ['20%', '5%', '10%', '2%', '15%']),
    34: (EST, 'Regressão Linear Simples', BE5,
         'Considere uma regressão linear simples da forma yi = b0 + b1xi + ei, onde b0 e b1 são parâmetros a serem estimados '
         'e ei o termo aleatório, com média 0 e desvio-padrão σ². Sabe-se que a média dos valores de xi = 10 e a média dos '
         'valores de yi = 50. Utilizando o método dos mínimos quadrados, o valor estimado de b1 foi 4, então o valor estimado '
         'do intercepto (b0) é dado por',
         ['20', '30', '10', '40', '15']),
    35: (DCON, 'Direitos Políticos', BC2,
         'Alfredo foi eleito Prefeito de determinado Município em 2012 e, em 2016, foi reeleito para o mesmo cargo, '
         'exercendo, portanto, seu mandato, até 2020. Afastado da política desde então, deseja se candidatar novamente ao '
         'mesmo cargo, no mesmo Município, em 2028. Já seu colega Dorival, que nunca exerceu nenhum cargo político, deseja '
         'se candidatar à Presidência da República em 2026 e a esposa de Dorival, Noélia, que também nunca exerceu nenhum '
         'cargo político, já está pensando em se candidatar à Prefeitura de determinado Município em 2028. De acordo com a '
         'Constituição Federal de 1988, com base apenas nas informações fornecidas, na situação hipotética narrada, Alfredo',
         ['não poderá se candidatar ao cargo que pretende, pois só é permitida a reeleição uma única vez, e Noélia poderá se candidatar à Prefeitura em 2028 independentemente do resultado das eleições de Dorival em 2026, por não incidir qualquer inelegibilidade nessa situação.',
          'poderá se candidatar ao cargo que pretende e, caso Dorival vença as eleições à Presidência da República em 2026, Noélia não poderá se candidatar ao cargo que pretende em 2028, pois são inelegíveis, no território de jurisdição do titular, o cônjuge e os parentes consanguíneos ou afins, até o quarto grau ou por adoção, do Presidente da República.',
          'poderá se candidatar ao cargo que pretende e Noélia poderá se candidatar à Prefeitura em 2028 independentemente do resultado das eleições de Dorival em 2026, por não incidir qualquer inelegibilidade nessa situação.',
          'não poderá se candidatar ao cargo que pretende, pois só é permitida a reeleição uma única vez e, caso Dorival vença as eleições como Presidente da República em 2026, Noélia não poderá se candidatar ao cargo que pretende em 2028, pois são inelegíveis, no território de jurisdição do titular, os filhos e o cônjuge do Presidente da República.',
          'poderá se candidatar ao cargo que pretende e, caso Dorival vença as eleições à Presidência da República em 2026, Noélia não poderá se candidatar ao cargo que pretende em 2028, pois são inelegíveis, no território de jurisdição do titular, o cônjuge e os parentes consanguíneos ou afins, até o segundo grau ou por adoção, do Presidente da República.']),
    36: (DCON, 'Poder Judiciário', BC4,
         'Considere:\n\n'
         'I. A homologação de sentenças estrangeiras e a concessão de exequatur às cartas rogatórias.\n'
         'II. O litígio entre Estado estrangeiro ou organismo internacional e a União.\n'
         'III. As causas e os conflitos entre a União e os Estados, a União e o Distrito Federal, ou entre uns e outros, inclusive as respectivas entidades da administração indireta.\n'
         'IV. A extradição solicitada por Estado estrangeiro.\n\n'
         'De acordo com a Constituição Federal de 1988, compete ao Supremo Tribunal Federal processar e julgar, '
         'originariamente, o que se afirma APENAS em',
         ['I, II e IV.', 'I e III.', 'II, III e IV.', 'I e IV.', 'III.']),
    37: (DCON, 'Direitos e Deveres Individuais e Coletivos II', BC1,
         'Acauã, cidadão brasileiro, 40 anos de idade, jornalista, teve conhecimento de que o Prefeito de sua cidade praticou '
         'um ato lesivo ao meio ambiente. Como ele faz parte de uma associação denominada “Associação Protetores do Meio '
         'Ambiente”, levou a ela essa situação para que pudessem tomar as medidas judiciais cabíveis, tendo sido informado '
         'por um de seus membros, que é advogado, que seria possível a propositura de ação popular com a finalidade de anular '
         'referido ato lesivo. Nessa situação hipotética, com base apenas nas informações fornecidas, levando em consideração '
         'que tanto Acauã quanto a mencionada Associação estão de boa-fé, de acordo com a Constituição Federal de 1988, a '
         'ação popular',
         ['poderá ser proposta apenas pela “Associação Protetores do Meio Ambiente”, que deverá efetuar o pagamento das custas judiciais necessárias para a propositura dessa ação.',
          'poderá ser proposta apenas por Acauã, que ficará isento de custas judiciais e do ônus da sucumbência.',
          'poderá ser proposta apenas por Acauã, que deverá efetuar o pagamento das custas judiciais necessárias para a propositura dessa ação, salvo se comprovar que não possui condições financeiras para tanto.',
          'poderá ser proposta por Acauã e também pela “Associação Protetores do Meio Ambiente”, sendo que somente a referida Associação ficará isenta de custas judiciais e do ônus da sucumbência.',
          'não poderá ser proposta nem por Acauã nem pela “Associação Protetores do Meio Ambiente”, por não possuírem legitimidade para a propositura de referida ação.']),
    38: (DCON, 'Direitos Sociais', BC1,
         'Um ano após ter sido demitida da empresa rural privada em que trabalhava, extinguindo-se o contrato de trabalho, '
         'Clarinda descobriu que tinha créditos para receber resultantes da sua relação de emprego, pretendendo, portanto, '
         'propor ação judicial para recebê-los, já que não pagos amigavelmente. Com base apenas nas informações fornecidas e '
         'de acordo com a Constituição Federal de 1988, quanto aos créditos resultantes da relação de trabalho, Clarinda',
         ['poderá propor ação, com prazo prescricional de três anos, até o limite de cinco anos após a extinção do contrato de trabalho.',
          'não poderá propor ação, diante da ocorrência da prescrição, já que decorrido o limite de três meses após a extinção do contrato de trabalho.',
          'poderá propor ação, com prazo prescricional de dois anos, até o limite de cinco anos após a extinção do contrato de trabalho.',
          'poderá propor ação, com prazo prescricional de cinco anos, até o limite de dois anos após a extinção do contrato de trabalho.',
          'não poderá propor ação, diante da ocorrência da prescrição, já que decorrido o limite de seis meses após a extinção do contrato de trabalho.']),
    39: (DCON, 'Intervenção nos Estados', BC3,
         'De acordo com a Constituição Federal de 1988, a União não intervirá nos Estados nem no Distrito Federal, EXCETO, '
         'dentre outras hipóteses, para',
         ['garantir o livre exercício de qualquer dos Poderes nas unidades da Federação dependendo a decretação da intervenção, nesse caso, de solicitação do Poder Legislativo ou do Poder Executivo coacto ou impedido, ou de requisição do Supremo Tribunal Federal, se a coação for exercida contra o Poder Judiciário.',
          'assegurar a prestação de contas da administração pública direta, sendo que, nesse caso, dispensada a apreciação pelo Congresso Nacional, o decreto de intervenção não poderá limitar-se a suspender a execução do ato impugnado, ainda que essa medida baste ao restabelecimento da normalidade.',
          'pôr termo a grave comprometimento da ordem pública, sendo que o decreto de intervenção, que nomeará o interventor, será submetido à apreciação do Supremo Tribunal Federal, no prazo de quarenta e oito horas.',
          'prover a execução de lei federal, estadual, municipal, ordem ou decisão judicial, sendo que a decretação da intervenção dependerá, sempre, no caso de qualquer desobediência a ordem ou decisão judiciária, de requisição do Congresso Nacional.',
          'assegurar a observância do regime democrático, sendo que, exclusivamente nesse caso, a decretação da intervenção dependerá de provimento, pelo Supremo Tribunal Federal, de representação do Procurador-Geral da República.']),
    40: (DCON, 'Poder Executivo', BC4,
         'De acordo com a Constituição Federal de 1988, o ato do Presidente da República que atente contra a segurança '
         'interna do País é crime',
         ['de responsabilidade e, admitida a acusação contra ele, por dois terços da Câmara dos Deputados, pela prática desse crime, será o Presidente da República submetido a julgamento perante o Senado Federal.',
          'comum e, admitida a acusação contra ele, por dois terços do Senado Federal, pela prática desse crime, será o Presidente da República submetido a julgamento perante o Congresso Nacional.',
          'comum e, admitida a acusação contra ele, por dois terços do Senado Federal, pela prática desse crime, será o Presidente da República submetido a julgamento perante o Senado Federal.',
          'comum e, admitida a acusação contra ele, por dois terços da Câmara dos Deputados, pela prática desse crime, será o Presidente da República submetido a julgamento perante o Supremo Tribunal Federal.',
          'de responsabilidade e, admitida a acusação contra ele, por dois terços do Senado Federal, pela prática desse crime, será o Presidente da República submetido a julgamento perante o Supremo Tribunal Federal.']),
    41: (DCON, 'Direitos e Deveres Individuais e Coletivos II', BC1,
         'De acordo com a Constituição Federal de 1988,',
         ['é possível a impetração de habeas-data para assegurar o conhecimento de informações relativas à pessoa do impetrante, constantes de registros ou bancos de dados de entidades governamentais ou de caráter público, sendo ele uma ação gratuita.',
          'o habeas-corpus será concedido exclusivamente na modalidade repressiva, ou seja, sempre que alguém sofrer violência ou coação em sua liberdade de locomoção, por ilegalidade ou abuso de poder, vedada sua concessão de forma preventiva.',
          'o habeas-data será concedido sempre que a falta de norma regulamentadora torne inviável o exercício dos direitos e liberdades constitucionais e das prerrogativas inerentes à nacionalidade, à soberania e à cidadania.',
          'o mandado de segurança coletivo será concedido para proteger direito líquido e certo, não amparado por habeas-corpus ou habeas-data, quando o responsável pela ilegalidade ou abuso de poder for autoridade pública ou agente de pessoa jurídica no exercício de atribuições do Poder Público, podendo ser impetrado por qualquer pessoa, física ou jurídica.',
          'o mandado de injunção será concedido para a retificação de dados constantes de registros públicos, quando não se prefira fazê-lo por processo sigiloso, judicial ou administrativo.']),
    44: (DCON, 'Nacionalidade', BC2,
         'Irineu nasceu no país estrangeiro “X” enquanto seus pais, brasileiros, nesse país residiam porque seu pai lá estava '
         'a serviço do Brasil. Aposentados, seus pais irão retornar ao Brasil e Irineu, que hoje é maior de idade e já possui '
         'a nacionalidade do país “X”, não deseja vir para o Brasil, nem deseja ter a nacionalidade brasileira. Nessa '
         'situação, considerando apenas as informações fornecidas, de acordo com a Constituição Federal de 1988, Irineu',
         ['não é considerado brasileiro nato, pois não nasceu no Brasil e, portanto, não possui a nacionalidade brasileira. Se a quisesse, poderia se naturalizar brasileiro, desde que atendesse aos requisitos previstos em lei.',
          'é brasileiro nato, mas poderá fazer pedido expresso de perda da nacionalidade brasileira perante autoridade brasileira competente, sendo que a renúncia da nacionalidade não o impede de readquirir sua nacionalidade brasileira originária, nos termos da lei.',
          'não necessita fazer qualquer renúncia expressa pois, apesar de ser considerado brasileiro nato, ao adquirir a nacionalidade do país “X”, automaticamente perdeu a nacionalidade brasileira, podendo readquiri-la nos termos da lei.',
          'é brasileiro nato, mas poderá fazer pedido expresso de perda da nacionalidade brasileira perante autoridade brasileira competente, sendo que a renúncia da nacionalidade o impede de readquirir sua nacionalidade brasileira originária.',
          'é brasileiro nato e, por essa razão, não poderá renunciar à nacionalidade brasileira, devendo cumprir suas obrigações como cidadão brasileiro independentemente de vir ou não a morar no Brasil.']),
    46: (DADM, 'Lei de Acesso à Informação - Transparência Ativa', BA6,
         'O princípio da transparência, que embasa a obrigatoriedade de divulgação ativa de determinados dados pelos entes '
         'públicos, de acordo com previsão expressa da Lei de Acesso à Informação, compreende',
         ['procedimentos de licitação em curso, por meio de disponibilização de acesso e participação no certame a quaisquer interessados, independentemente de identificação ou de requisitos de participação.',
          'a disponibilização de servidores para realização, em tempo real, de pesquisas nas bases de dados disponibilizadas ao público.',
          'a integralidade dos dados referentes a programas e ações, incluído o detalhamento de todos os beneficiários por tais iniciativas.',
          'informações relativas a licitações realizadas e em curso, assim como sobre contratos celebrados pela Administração Pública.',
          'franquear acesso a quaisquer interessados dos sistemas de registro de receitas e despesas.']),
    47: (DADM, 'Licitações — Lei 14.133/2021 (Parte I)', BA4,
         'Uma secretaria estadual está licitando, por meio de pregão, a contratação de prestação de serviços de vigilância '
         'para as diversas unidades de atendimento instaladas em um mesmo município. Não obstante, foi apresentada '
         'representação junto ao Tribunal de Contas, imputando ilegalidade ao modelo de licitação e contratação escolhido '
         'pelo órgão público. A impugnação',
         ['não procede, tendo em vista que o Tribunal de Contas não exerce controle prévio de editais de licitação, somente o Poder Legislativo possui a prerrogativa de sustar licitações e contratações.',
          'não procede se a licitação em curso se destinar à formalização de ata de registro de preços, tendo em vista que o leilão é a única modalidade admitida para essa instrumentalização.',
          'procede, considerando que o pregão é modalidade de licitação exclusivamente aplicável para aquisição de bens de natureza comum, não abrangendo a contratação de serviços.',
          'não procede, tendo em vista que a contratação de prestação de serviços de natureza comum também está abrangida pela modalidade pregão de licitação.',
          'procede, tendo em vista que a contratação de serviços de natureza comum ou padronizada deve ser realizada por meio de leilão.']),
    48: (DADM, 'Execução de Contrato Administrativo', BA4,
         'Um órgão público da Administração estadual celebrou contrato para aquisição de capas de chuva, destinadas a uso '
         'pelos agentes públicos incumbidos das atividades de atendimento e socorro à população em casos de emergências '
         'climáticas. Antes da execução integral do objeto, em curso na forma do cronograma de entrega estabelecido, o órgão '
         'público identificou a necessidade de aquisição de mais unidades do item contratado, em virtude de autorização para '
         'nomeação dos aprovados incluídos em cadastro reserva do último concurso público para provimento de cargos da mesma '
         'carreira.\n\nDiante desse cenário, o órgão público',
         ['deverá concluir a execução do contrato em vigência, antecipando eventuais entregas futuras, com vistas a justificar a celebração de contrato emergencial para aquisição dos itens de necessidade superveniente.',
          'poderá aditar o edital de licitação que ensejou a contratação em questão, aumentando o quantitativo de aquisição e franqueando prazo para apresentação de novos lances ou propostas, no limite da necessidade superveniente.',
          'poderá aditar o contrato celebrado, cuja execução ainda não se encerrou, com vistas a majorar o quantitativo da aquisição, observado o limite de 25% do valor original do contrato atualizado.',
          'deverá aditar o contrato em curso para majoração do número de itens adquiridos em 25%, independentemente do valor individual original de cada capa de chuva.',
          'poderá aditar o contrato de aquisição de capas de chuva em execução, observado o limite de 50% do valor original atualizado e condicionado à existência de disponibilidade orçamentário-financeira para a despesa.']),
    49: (DADM, 'Parceria Público-Privada (Lei 11.079/2004)', BA5,
         'O instrumento jurídico que veicula a delegação da prestação de serviços públicos pela iniciativa privada, '
         'abrangendo a possibilidade de remuneração por meio de tarifa cobrada dos próprios usuários e por meio de recursos '
         'transferidos pela própria Administração Pública, estes com a finalidade de fazer frente aos investimentos em bens '
         'reversíveis, denomina-se concessão',
         ['patrocinada, que admite a remuneração dos serviços prestados pelo privado por meio de aporte público, vinculado o pagamento às metas de desempenho contratualmente estabelecidas.',
          'por colaboração, cuja natureza jurídica híbrida, com disposições de regime público e outras de regime privado, admite o pagamento de tarifa pelo Poder Público e de aporte pelos próprios usuários dos serviços.',
          'patrocinada, que inclui remuneração por meio de contraprestação paga pelo poder concedente e de tarifa cobrada do usuário, sem prejuízo da possibilidade de previsão de aporte.',
          'administrativa, desde que não inclua a outorga do serviço público ao privado, admitindo a cobrança de tarifa diretamente dos usuários e a previsão de aporte.',
          'comum, vedada a transferência de recursos financeiros para fazer frente à recomposição do equilíbrio econômico-financeiro contratual.']),
    50: (DADM, 'Poderes Administrativos', BA1,
         'O exercício das funções executivas pela Administração Pública abrange deveres e prerrogativas, estas que incluem o '
         'exercício de poderes próprios para viabilizar o atingimento dos resultados pretendidos ou necessários, a exemplo do poder',
         ['disciplinar, que também inclui a disciplina sancionatória àqueles cujo vínculo jurídico com a Administração Pública tenha se dado por relação contratual.',
          'hierárquico, que obriga não só os servidores que integram a Administração Pública do ente, como também os administrados sujeitos à tutela estatal, com esteio no princípio da supremacia do interesse público.',
          'disciplinar, que possibilita a aplicação de multas contratuais e multas por infração praticada por administrado, com fundamento na legislação vigente, não se incluindo, nesse grupo, os servidores públicos vinculados ao ente público.',
          'de polícia, do qual são incumbidas as autoridades administrativas que exercem poder de decisão, não se estendendo a agentes públicos hierarquicamente inferiores.',
          'normativo, por meio do qual o Chefe do Executivo pode editar normas com natureza jurídica de lei, obrigando a todos os administrados, em caráter geral e abstrato.']),
    51: (DADM, 'Organização Administrativa', BA3,
         'Constituem exemplos de desconcentração e descentralização no âmbito da Administração Pública estadual, respectivamente,',
         ['criação de pessoas jurídicas de direito público; criação de pessoas jurídicas com natureza de direito privado, em qualquer dos casos, destinadas ao desempenho das atribuições constitucionais do ente.',
          'criação de órgãos públicos com a correspondente criação de cargos para desempenho da atribuições por servidores; criação de órgãos públicos que prescindam da criação de cargos e empregos para desempenho das atribuições do ente.',
          'instituição de pessoas jurídicas integrantes da Administração Pública indireta; contratação de prestadores de serviço diretamente pelos órgãos públicos.',
          'organização da Administração em órgãos públicos, hierarquicamente vinculados; criação de órgãos públicos por setor de atuação, sem vinculação hierárquica entre as unidades administrativas que os integram.',
          'criação de secretarias, com natureza jurídica de órgãos públicos, para desempenho das atribuições do ente público; instituição de entidades, com personalidade jurídica própria, às quais será delegado um feixe de atribuições próprio.']),
    52: (DADM, 'Princípios do Direito Administrativo', BA1,
         'Os princípios que regem as atividades da Administração Pública podem ser aplicados como fundamento para',
         ['a elaboração e o controle de violação de normas vigentes, a exemplo do princípio da impessoalidade, que embasa a disciplina de procedimentos de chamamento e de licitação.',
          'a instauração de procedimentos de apuração de infrações disciplinares por servidores, como o princípio da impessoalidade, não se prestando, contudo, para viabilizar procedimentos de apuração em razão de ilícitos praticados por pessoas jurídicas.',
          'dispensar o cumprimento de norma legal expressa, a exemplo do princípio da eficiência, nos casos em que outra solução seja comprovadamente mais célere, mais econômica e atenda à necessidade da Administração Pública.',
          'a edição de atos administrativos não sujeitos a controle judicial, porque oriundos de discricionariedade do ente.',
          'o controle externo da Administração Pública, a exemplo do princípio da legalidade, cujo descumprimento pode ensejar a revogação dos atos administrativos.']),
    53: (DADM, 'Improbidade Administrativa (Lei 8.429/1992)', BA6,
         'A configuração de ato de improbidade depende da',
         ['comprovação de dolo específico ou de culpa grave pelo autor do ato.',
          'demonstração de lesão ao patrimônio de pessoa jurídica de direito público, eis que os entes com natureza jurídica de direito privado podem buscar ressarcimento por meio de execução própria ou com fundamento na legislação específica anticorrupção.',
          'natureza do vínculo funcional mantido entre o agente que praticou o ato e a Administração Pública, não se tipificando nas hipóteses de contratação por tempo determinado ou de empregos em comissão.',
          'comprovação de dolo específico do autor do ato, não sendo imprescindível a existência de vínculo funcional estatutário para a caracterização do agente público como legitimado ativo.',
          'existência de prejuízo ao erário e de enriquecimento ilícito do autor do ato, cumulativamente.']),
    54: (DADM, 'Bens Públicos', BA7,
         'Os bens imóveis de titularidade dos entes públicos podem se prestar a instalações promovidas pela própria '
         'Administração Pública, com vistas à disponibilização de serviços e utilidades públicas aos administrados. Os '
         'imóveis, entretanto, que não estiverem destinados à finalidade específica',
         ['são classificados como dominicais, exigindo apenas autorização legislativa para alienação onerosa ou gratuita, não sendo obrigatória a realização de procedimento de licitação.',
          'podem ser objeto de outorga de uso privativo em favor de particulares ou de outros entes públicos, definindo-se a natureza contratual ou de ato do instrumento, com base em fatores como prazo, volume de investimentos e destinação pretendida para a utilização.',
          'podem ser alienados diretamente a interessados na aquisição, em razão da ausência de afetação a interesse público.',
          'podem ser disponibilizados a particulares por meio de permissão de uso ou de concessão de uso, instrumentos jurídicos com natureza contratual, diferindo quanto ao limite de prazo aceitável em cada caso.',
          'devem ser alienados por meio de licitação, não se admitindo alienação direta a particulares, apenas em favor de pessoas jurídicas integrantes da Administração Pública de outras esferas.']),
    64: (AP, 'Ética no Serviço Público', '',
         'O agente público, ao expressar suas opiniões publicamente em situações como palestras, aulas ou publicações, deve, '
         'de forma condizente com os princípios da ética profissional,',
         ['exprimir posicionamentos pessoais que reiterem aqueles defendidos pelo governo responsável pelo órgão ao qual esteja vinculado.',
          'compartilhar com o público sua condição profissional, demonstrando que suas opiniões são corretas por serem embasadas em informações e experiências vivenciadas no exercício de sua função.',
          'abdicar dessa forma de expressão, uma vez que tem autorização para manifestar-se, como cidadão, apenas no exercício de sua função.',
          'registrar que as opiniões ali veiculadas ou expressas são de caráter pessoal e não representam o posicionamento do órgão ao qual está vinculado.',
          'transferir o convite para seus superiores antes de aceitar qualquer proposta que represente uma exposição pública pessoal.']),
    71: (INF, 'Banco de Dados NoSQL', BI3,
         'Uma auditoria tributária precisa armazenar e gerenciar dados de impostos pagos por empresas ao longo de vários '
         'anos. Os dados incluem informações estruturadas, como identificação da empresa, valores de impostos e datas de '
         'pagamento, mas também dados não estruturados, como relatórios de auditoria em PDF, notas fiscais digitalizadas e '
         'comentários dos auditores em texto livre. O modelo de banco de dados mais adequado para atender às necessidades de '
         'escalabilidade e flexibilidade da empresa nesse caso é o Modelo',
         ['NoSQL do tipo grafo, pois é ideal para representar relações entre empresas e categorias de impostos.',
          'NoSQL do tipo documento, pois permite armazenar dados estruturados e não estruturados em um único registro, com alta escalabilidade.',
          'relacional, pois suporta esquemas flexíveis e é ideal para grandes volumes de dados não estruturados.',
          'NoSQL do tipo chave-valor, pois é otimizado para consultas complexas com junções entre tabelas.',
          'relacional padrão MongoDB, pois garante consistência forte e é adequado para dados estruturados com relações definidas, como impostos e empresas.']),
    72: (INF, 'Segurança da Informação - Autenticação Multifator', BI2,
         'Mesmo com o uso de senhas fortes, um sistema ainda pode ser vulnerável. Para aumentar a segurança, a autenticação '
         'multifator (MFA) exige o uso combinado de, pelo menos, dois fatores de categorias diferentes. Esses fatores podem '
         'ser classificados da seguinte forma:\n\n'
         'I. Algo que você sabe – por exemplo, a resposta a uma pergunta de segurança.\n'
         'II. Algo que você tem – como um código gerado por um aplicativo autenticador.\n'
         'III. Algo que você conhece – como o nome de usuário.\n'
         'IV. Algo que você é – como reconhecimento facial.\n\n'
         'Considerando os princípios da MFA, as opções que representam combinações válidas de autenticação multifator são APENAS',
         ['I e II.', 'II, III e IV.', 'III e IV.', 'I, II e III.', 'I, II e IV.']),
    73: (INF, 'Segurança da Informação - Firewall (NGFW)', BI2,
         'Uma organização implementou um Next-Generation Firewall (NGFW) para fortalecer sua segurança cibernética. Esse '
         'tipo de firewall vai além das funções tradicionais, incorporando recursos avançados para proteger contra ameaças '
         'modernas. Representa as funcionalidades de um NGFW:',
         ['Proteção contra ataques de negação de serviço (DDoS), sem oferecer outras camadas de defesa.',
          'Antivírus tradicional embutido que analisa apenas arquivos baixados, sem atuar na inspeção do tráfego de rede.',
          'Filtragem de pacotes e Network Address Translation (NAT), apenas, sem análise avançada do tráfego de rede.',
          'Monitoramento passivo de tráfego, sem capacidade de bloquear ou mitigar ameaças em tempo real.',
          'Intrusion Prevention System (IPS) e inspeção profunda de pacotes (DPI), sem backup e recuperação de dados.']),
    74: (INF, 'SQL', BI3,
         'Uma Secretaria da Fazenda Estadual mantém a tabela multas_tributarias com informações sobre multas aplicadas a '
         'contribuintes. A estrutura da tabela é apresentada a seguir:\n\n'
         '• id_multa (INT): identificador único da multa\n'
         '• cnpj_contribuinte (VARCHAR): CNPJ do contribuinte\n'
         '• valor_multa (DECIMAL): valor da multa\n'
         '• data_aplicacao (DATE): data de aplicação da multa\n'
         '• status (VARCHAR): status da multa (exemplo: "Pendente", "Paga")\n\n'
         'Devido a uma decisão judicial, todas as multas pendentes aplicadas antes de 2023 devem ter seu valor reduzido em '
         '10%. Em um banco de dados aberto e em condições ideais, o comando SQL que realiza essa atualização é:',
         ["UPDATE multas_tributarias SET valor_multa = valor_multa * 1.9 WHERE status = 'Pendente' AND data_aplicacao < '2023-01-01';",
          "UPDATE multas_tributarias SET valor_multa = AVG(valor_multa) * 0.9 WHERE status = 'Pendente' AND data_aplicacao < '2023-01-01';",
          "UPDATE multas_tributarias SET valor_multa = valor_multa * 0.9 WHERE status = 'Pendente' AND data_aplicacao < '2023-01-01';",
          "UPDATE multas_tributarias SET valor_multa = valor_multa - 10 WHERE status = 'Pendente' AND data_aplicacao < 2023;",
          "UPDATE multas_tributarias SET valor_multa = valor_multa * 0.9 WHERE status = 'Paga' AND data_aplicacao < '2023-01-01';"]),
    75: (INF, 'BI: Data Warehouse e Data Mart', BI4,
         'No contexto da modelagem dimensional, uma Secretaria da Fazenda deseja analisar os atendimentos realizados para '
         'otimizar seus serviços e melhorar a satisfação dos cidadãos. Os dados disponíveis incluem informações sobre '
         'atendimentos, cidadãos, servidores e datas.\n\nAs tabelas relevantes são:\n\n'
         '• Tabela de Fatos (Atendimentos): contém informações sobre cada atendimento individual, como ID do atendimento, ID do cidadão, ID do servidor, ID da data, tipo de atendimento e tempo de atendimento.\n'
         '• Tabela de Dimensão (Cidadãos): contém informações sobre os cidadãos, como ID do cidadão, nome, idade, gênero e município.\n'
         '• Tabela de Dimensão (Servidores): contém informações sobre os servidores, como ID do servidor, nome, cargo e setor.\n'
         '• Tabela de Dimensão (Datas): contém informações sobre as datas, como ID da data, data completa, dia da semana, mês e ano.\n\n'
         'Descreve corretamente a relação entre as tabelas de fato e as tabelas de dimensões nesse contexto:',
         ['A tabela de fatos (Atendimentos) contém as métricas de atendimento (tempo de atendimento), enquanto as tabelas de dimensão (Cidadãos, Servidores, Datas) contêm os atributos descritivos.',
          'A tabela de fatos (Atendimentos) e as tabelas de dimensões (Cidadãos, Servidores, Datas) são independentes e não possuem nenhuma relação entre si.',
          'A tabela de fatos (Atendimentos) contém apenas dados descritivos sobre os cidadãos atendidos, enquanto as tabelas de dimensão (Cidadãos, Servidores, Datas) contêm as métricas de tempo de atendimento.',
          'A tabela de fatos (Atendimentos) contém informações sobre os tipos de atendimento, enquanto as tabelas de dimensão (Cidadãos, Servidores, Datas) contêm os tempos médios de atendimento.',
          'A tabela de fatos (Atendimentos) e as tabelas de dimensões (Cidadãos, Servidores, Datas) contêm apenas dados descritivos sobre os servidores e cidadãos.']),
    76: (INF, 'Ferramentas de Produtividade - MS Excel', BI6,
         'Considere hipoteticamente que uma Secretaria da Fazenda possui um extenso conjunto de dados de processos em uma '
         'planilha do Excel, em português e funcionando em condições ideais. Os dados incluem as seguintes colunas:\n\n'
         '• Data do Processo: a data em que o processo foi registrado.\n'
         '• Processo: o título padrão do processo.\n'
         '• Categoria: a categoria do processo (por exemplo, Tributário, Revisional, Recursal).\n'
         '• Quantidade: a quantidade de processos.\n'
         '• Montante: o montante envolvido no processo.\n'
         '• Região: a região onde o processo foi instaurado (por exemplo, Norte, Sul, Leste, Oeste).\n\n'
         'O Diretor da Unidade Tributária deseja analisar o desenrolar de processos por categoria e região, identificando os '
         'títulos de processos mais instaurados em cada região.\n\n'
         'A melhor maneira de utilizar uma tabela dinâmica do Excel para realizar essa análise é criar uma tabela dinâmica com',
         ['Região nas linhas, Processo nas colunas e Montante nos valores, utilizando a função Máximo.',
          'Categoria nas linhas, Processo nas colunas e Montante nos valores, utilizando a função Mínimo.',
          'Processo nas linhas, Região nas colunas e Montante nos valores, utilizando a função Média.',
          'Categoria nas linhas, Região nas colunas e Quantidade nos valores, utilizando a função Soma.',
          'Data do Processo nas linhas, Categoria nas colunas e Quantidade nos valores, utilizando a função Contagem.']),
    77: (INF, 'Computação em Nuvem - Modelos de Serviço', BI6,
         'Hipoteticamente, um Agente da SEFAZ recebeu de um Analista a proposta da migração do processo de desenvolvimento '
         'de aplicações para a nuvem, utilizando um modelo de serviço que fornece e gerencia todos os recursos de hardware e '
         'software para desenvolver aplicativos, sem a necessidade de criar e manter a infraestrutura ou a plataforma por '
         'conta própria, que corresponde ao modelo de serviço',
         ['IaaS', 'CaaS', 'PaaS', 'SaaS', 'FaaS']),
    78: (INF, 'Hardware - Hierarquia de Memória e Armazenamento', '',
         'Um Agente da SEFAZ, ao verificar os dispositivos instalados no Windows 11, identificou os seguintes dispositivos '
         'de armazenamento:\n\n'
         '1. SSD NVMe PCIe 4.0\n2. HDD 15K RPM\n3. DRAM DDR5\n4. Cache L3\n\n'
         'Considerando apenas o aspecto de latência, da menor para a maior, a ordem correta é:',
         ['4 – 1 – 3 – 2', '3 – 1 – 4 – 2', '1 – 3 – 4 – 2', '4 – 3 – 1 – 2', '3 – 4 – 1 – 2']),
    79: (INF, 'Business Intelligence - Conceitos', BI4,
         'Uma Secretaria da Fazenda possui um sistema de BI para monitorar a arrecadação tributária e detectar possíveis '
         'fraudes fiscais. No processo de descoberta das informações, devem ser desenvolvidas as seguintes atividades '
         'correspondentes às cinco etapas:\n\n'
         'I. Criar dashboards interativos com indicadores de risco tributário.\n'
         'II. Padronizar e cruzar informações tributárias por CNPJ, aplicando regras fiscais.\n'
         'III. Direcionar fiscalizações para empresas com maior probabilidade de fraude.\n'
         'IV. Extrair dados de sistemas de arrecadação e bases externas, como notas fiscais eletrônicas.\n'
         'V. Identificar padrões de sonegação por meio de modelos preditivos.\n\n'
         'Considerando as atividades listadas de I a V, as etapas às quais elas correspondem são, correta e respectivamente:',
         ['Coleta – Decisão – Transformação – Análise – Visualização.',
          'Visualização – Análise – Coleta – Decisão – Transformação.',
          'Decisão – Coleta – Visualização – Transformação – Análise.',
          'Visualização – Transformação – Decisão – Coleta – Análise.',
          'Transformação – Análise – Decisão – Visualização – Coleta.']),
    80: (INF, 'BI - Power BI e Tableau', BI4,
         'Uma Secretaria da Fazenda está implementando um sistema de BI para melhorar o monitoramento das arrecadações '
         'tributárias e a identificação de possíveis inconsistências fiscais. Para isso, a equipe está utilizando o Power BI '
         'e o Tableau. Com essas ferramentas, a equipe pode',
         ['criar dashboards interativos para visualização dinâmica de indicadores fiscais, de forma a segmentar dados por filtros (como período, localidade e tipo de tributo), realizar análises comparativas e drill-down, além de análises preditivas para identificar padrões e detectar fraudes.',
          'extrair métricas financeiras e fiscais automaticamente dos sistemas transacionais e importá-las sem necessidade de ajustes, pois todas as regras de cálculo e interpretação dos dados são padronizadas nas duas ferramentas, a partir da origem da informação.',
          'processar e transformar os dados coletados diretamente nos painéis de análise, sem realizar integração com fontes externas, pois ambas possuem bancos de dados embutidos para armazenar grandes volumes de informações.',
          'utilizar dashboards estáticos para a análise fiscal, realizando operações de drill-up para detalhar os dados e operações de drill-down para resumir a informação, tornando a análise mais objetiva.',
          'ampliar a coleta e o armazenamento dos dados fiscais, deixando a análise detalhada para ser feita manualmente pelos analistas, já que o Power BI não permite a criação de relatórios paginados. Implantar bancos de dados NOSQL, para utilizar o Tableau, já que este não suporta conexões diretas com bancos de dados relacionais.']),
}
