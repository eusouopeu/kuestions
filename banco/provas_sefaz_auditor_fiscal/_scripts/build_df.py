#!/usr/bin/env python3
"""SEEC-DF 2020 (Cebraspe) - Auditor-Fiscal da Receita do DF. Itens Certo/Errado; gabarito definitivo."""
import json, re, collections

INST, ANO = 'SEFAZ-DF', 2020
CARGO = 'Auditor-Fiscal da Receita do Distrito Federal'

AP, CPU, DADM, DCON = 'Administração Pública', 'Contabilidade Pública', 'Direito Administrativo', 'Direito Constitucional'
DCIV, DPEN, ECO, FIN = 'Direito Civil e Empresarial', 'Direito Penal', 'Economia', 'Finanças Públicas'
INF, MF, EST, MRL = 'Noções de Informática', 'Matemática Financeira', 'Estatística', 'Matemática e Raciocínio Lógico'
AUD, CTB, DTRI = 'Auditoria', 'Contabilidade Geral', 'Direito Tributário'

BP = {1: '[1] MCASP — Procedimentos e Plano de Contas (7 aulas)', 2: '[2] NBC TSP — Normas Vigentes (3 aulas)',
      3: '[3] Balanços e Demonstrações Contábeis (Lei 4.320/64) (6 aulas)'}
BA_ = {1: '[1] Fundamentos e Poderes Administrativos (3 aulas)', 4: '[4] Agentes Públicos e Licitações/Contratos (4 aulas)',
       5: '[5] Serviços Públicos e Parcerias (2 aulas)', 6: '[6] Responsabilidade, Controle e Improbidade (3 aulas)'}
BC = {1: '[1] Teoria Constitucional e Direitos Fundamentais (5 aulas)', 2: '[2] Nacionalidade e Direitos Políticos (3 aulas)',
      3: '[3] Organização do Estado e Administração Pública (2 aulas)',
      5: '[5] Defesa do Estado, Tributação e Ordem Econômico-Social (5 aulas)'}
BEC = {3: '[3] Bem-Estar, Externalidades e Contabilidade Nacional (2 aulas)', 5: '[5] Setor Externo (2 aulas)'}
BF = {2: '[2] Ciclo Orçamentário, Créditos e Classificações (3 aulas)', 3: '[3] Receita e Despesa Pública (3 aulas)',
      4: '[4] Lei de Responsabilidade Fiscal (LRF) (4 aulas)'}
BI = {2: '[2] Segurança da Informação (3 aulas)', 5: '[5] Gestão de Processos e Engenharia de Software (3 aulas)',
      6: '[6] Ferramentas Corporativas e Web (3 aulas)'}
BMF = {1: '[1] Juros e Taxas (3 aulas)', 2: '[2] Equivalência e Aplicações Financeiras (3 aulas)'}
BE1 = '[1] Estatística Descritiva Univariada (5 aulas)'
BU = {1: '[1] Fundamentos e Normas Gerais de Auditoria (3 aulas)', 2: '[2] Procedimentos, Evidências e Amostragem (3 aulas)',
      4: '[4] Procedimentos Específicos e Auditoria no Setor Público (5 aulas)'}
BK = {1: '[1] Fundamentos: Patrimônio, Escrituração e Regimes (3 aulas)', 2: '[2] Balanço Patrimonial (BP) (8 aulas)',
      3: '[3] Demonstrações Complementares e Princípios (5 aulas)', 4: '[4] CPCs — Pronunciamentos Técnicos (11 aulas)',
      5: '[5] Contabilidade de Custos e Gerencial'}
BT = {1: '[1] Sistema Tributário Nacional: Conceitos e Princípios (5 aulas)', 2: '[2] Obrigação e Crédito Tributário (7 aulas)',
      3: '[3] Administração Tributária e Tributos em Espécie (4 aulas)', 4: '[4] Reforma Tributária e Regimes Especiais (4 aulas)'}

# Excluidos: 1-10 LP (dependem do texto-base), 11-12 Conhecimentos sobre o DF, 27-28/41-42/95/98/99/121
# (legislacao distrital), 61/68/101/102/108 (anulados), 136-156 e 159-160 (Legislacao Tributaria do DF).
MAPA = {
    13: (DADM, 'Princípios do Direito Administrativo', BA_[1]),
    14: (DCON, 'Organização do Estado (Art. 18 a 36)', BC[3]),
    15: (AP, 'Modelos de Administração Pública (Patrimonialista, Burocrático, Gerencial)', ''),
    16: (AP, 'Gestão da Integridade Pública', ''),
    # 17-18: Código de Ética do Poder Executivo do DF -> excluidos
    19: (CPU, 'NBC TSP — Estrutura Conceitual', BP[2]), 20: (CPU, 'NBC TSP — Estrutura Conceitual', BP[2]),
    21: (CPU, 'NBC TSP — Estrutura Conceitual', BP[2]),
    22: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]), 23: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]),
    24: (CPU, 'NBC TSP — Tópicos Vigentes', BP[2]),
    25: (CPU, 'Balanço Orçamentário', BP[3]), 26: (CPU, 'MCASP: Proc. Orçamentários (I)', BP[1]),
    29: (DADM, 'Responsabilidade Civil do Estado', BA_[6]), 30: (DADM, 'Serviços Públicos (Lei 8.987/1995)', BA_[5]),
    31: (DADM, 'Lei das Estatais (Lei 13.303/2016)', BA_[4]),
    32: (DADM, 'Processo Administrativo (Lei 9.784/1999)', BA_[6]),
    33: (DADM, 'Licitações — Pregão', BA_[4]),
    34: (DADM, 'Processo Administrativo (Lei 9.784/1999)', BA_[6]),
    35: (DCON, 'Direitos e Deveres Individuais e Coletivos I', BC[1]),
    36: (DCON, 'Teoria da Constituição e Poder Constituinte', BC[1]),
    37: (DCON, 'Nacionalidade', BC[2]),
    38: (DCON, 'Ordem Econômica e Financeira', BC[5]), 39: (DCON, 'Ordem Econômica e Financeira', BC[5]),
    40: (DCON, 'Ordem Econômica e Financeira', BC[5]),
    43: (DCIV, 'Direito Civil - Responsabilidade Civil e Prescrição', ''),
    44: (DCIV, 'Direito Civil - Responsabilidade Civil e Prescrição', ''),
    45: (DCIV, 'Direito Civil - Personalidade', ''),
    46: (DCIV, 'LINDB - Vigência e Revogação das Leis', ''),
    47: (DCIV, 'Direito Empresarial - Sociedade Limitada', ''), 48: (DCIV, 'Direito Empresarial - Sociedade Limitada', ''),
    49: (DCIV, 'Direito Empresarial - Sociedade Limitada', ''),
    50: (DPEN, 'Direito Penal - Falsificação de Selo ou Sinal Público', ''),
    51: (DPEN, 'Direito Penal - Crimes Funcionais contra a Ordem Tributária', ''),
    52: (DPEN, 'Direito Penal - Crimes contra as Finanças Públicas', ''),
    53: (ECO, 'Balanço de Pagamentos', BEC[5]),
    54: (ECO, 'Política Cambial: Câmbio Fixo e Câmbio Flutuante', BEC[5]),
    55: (ECO, 'Tributação e Incidência Tributária', BEC[3]),
    56: (DTRI, 'Crédito Tributário: Constituição e Lançamento', BT[2]),
    57: (FIN, 'Classificações Orçamentárias e Estrutura Programática', BF[2]),
    58: (FIN, 'Receita Pública: Conceito, Classificações e Fontes', BF[3]),
    59: (FIN, 'Ciclo Orçamentário e Processo de Orçamentação', BF[2]),
    60: (FIN, 'LRF Parte III: Transparência, Controle, Gestão Patrimonial e Transferências', BF[4]),
    62: (FIN, 'LRF Parte IV: Dívida, Endividamento e Disposições Finais', BF[4]),
    63: (INF, 'Hardware - Armazenamento (SSD)', ''), 64: (INF, 'Linux - Estrutura de Diretórios', ''),
    65: (INF, 'Ferramentas de Produtividade - MS Excel', BI[6]), 66: (INF, 'Navegadores - Google Chrome', BI[6]),
    67: (INF, 'Gerência de Projetos (PMBOK)', BI[5]),
    69: (INF, 'Segurança da Informação - Assinatura Digital', BI[2]), 70: (INF, 'Auditoria de Sistemas', BI[2]),
    71: (MF, 'Juros Compostos', BMF[1]), 72: (MF, 'Taxas', BMF[1]), 73: (MF, 'Operações de Desconto', BMF[2]),
    74: (EST, 'Medidas de Posição: Médias', BE1), 75: (EST, 'Medidas de Variabilidade ou Dispersão', BE1),
    76: (EST, 'Medidas Separatrizes ou Quantis', BE1), 77: (EST, 'Distribuição de Frequências e Medidas', BE1),
    78: (MRL, 'Lógica Proposicional', ''), 79: (MRL, 'Lógica Proposicional', ''), 80: (MRL, 'Lógica Proposicional', ''),
    81: (AUD, 'Planejamento e Documentação (NBC TA 300/230)', BU[1]),
    82: (AUD, 'Procedimentos Analíticos (NBC TA 520)', BU[2]),
    83: (AUD, 'Risco de Amostragem (NBC TA 530)', BU[2]),
    84: (AUD, 'Procedimentos e Evidências de Auditoria (NBC TA 500/505/520)', BU[2]),
    85: (AUD, 'Procedimentos e Evidências de Auditoria (NBC TA 500/505/520)', BU[2]),
    86: (AUD, 'Procedimentos e Evidências de Auditoria (NBC TA 500/505/520)', BU[2]),
    87: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU[1]),
    88: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU[1]),
    89: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU[1]),
    90: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU[1]),
    91: (AUD, 'Materialidade, Risco e Fraude (NBC TA 320/240)', BU[1]),
    92: (AUD, 'Conceitos Iniciais de Auditoria (NBC TA 200)', BU[1]),
    93: (AUD, 'Conceitos Iniciais de Auditoria (NBC TA 200)', BU[1]),
    94: (AUD, 'Conceitos Iniciais de Auditoria (NBC TA 200)', BU[1]),
    96: (INF, 'EFD-ICMS/IPI (SPED Fiscal)', BI[6]), 97: (INF, 'EFD-ICMS/IPI (SPED Fiscal)', BI[6]),
    100: (AUD, 'Auditoria Fiscal — Parte II', BU[4]),
    103: (CTB, 'CPC 00 — Estrutura Conceitual', BK[4]),
    104: (CTB, 'Patrimônio: Equação, Atos/Fatos, Contas', BK[1]),
    105: (CTB, 'BP — Estoques', BK[2]), 106: (CTB, 'BP — Estoques', BK[2]),
    107: (CTB, 'DFC (Direto e Indireto)', BK[3]),
    109: (CTB, 'Contabilidade de Custos — Custeio por Absorção', BK[5]),
    110: (CTB, 'Contabilidade de Custos — Custeio por Absorção', BK[5]),
    111: (CTB, 'Contabilidade de Custos — Custeio por Absorção', BK[5]),
    112: (CTB, 'Contabilidade de Custos — Custeio Variável x Absorção', BK[5]),
    113: (CTB, 'Contabilidade de Custos — Custeio ABC', BK[5]),
    114: (CTB, 'Contabilidade de Custos — Ponto de Equilíbrio', BK[5]),
    115: (CTB, 'Contabilidade de Custos — Custo Padrão', BK[5]),
    116: (FIN, 'Créditos Ordinários e Adicionais', BF[2]),
    117: (FIN, 'Receita Pública: Conceito, Classificações e Fontes', BF[3]),
    118: (FIN, 'Receita Pública: Conceito, Classificações e Fontes', BF[3]),
    119: (FIN, 'LRF Parte I: Introdução, Disposições Preliminares e Planejamento', BF[4]),
    120: (FIN, 'LRF Parte III: Transparência, Controle, Gestão Patrimonial e Transferências', BF[4]),
    122: (DTRI, 'Princípios Tributários', BT[1]), 123: (DTRI, 'Obrigação Tributária', BT[2]),
    124: (DTRI, 'Legislação Tributária', BT[1]), 125: (DTRI, 'Imunidades Tributárias', BT[1]),
    126: (DTRI, 'Responsabilidade Tributária', BT[2]), 127: (DTRI, 'Infrações e Penalidades', BT[2]),
    128: (DTRI, 'Obrigação Tributária', BT[2]), 129: (DTRI, 'Responsabilidade Tributária', BT[2]),
    130: (DTRI, 'Legislação Tributária', BT[1]),
    131: (DTRI, 'Dívida Ativa e Certidão Negativa (CTN)', BT[3]), 132: (DTRI, 'Dívida Ativa e Certidão Negativa (CTN)', BT[3]),
    133: (DTRI, 'Dívida Ativa e Certidão Negativa (CTN)', BT[3]),
    134: (DTRI, 'Garantias e Privilégios do Crédito Tributário', BT[2]),
    135: (DTRI, 'Garantias e Privilégios do Crédito Tributário', BT[2]),
    157: (DTRI, 'Simples Nacional', BT[4]), 158: (DTRI, 'Simples Nacional', BT[4]),
}

# Radical comum de itens que comecam no meio da frase (preenchido apos inspecao do caderno).
STEM = {}

L = open('df.txt').read().split('\n')
ITEM = re.compile(r'^\s{0,6}(\d{1,3})\s+\S')
FOOT = re.compile(r'/C\*Caderno|\|\|IdentificaPDF|/R\*Cargo|CEBRASPE\s*–')
STOP = re.compile(r'^\s{4,7}\S|^\s*JUSTIFICATIVA')
HEAD = re.compile(r'^\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇ ,()/–-]{6,}\s*$')


def fix(s):
    s = re.sub(r'!(?=\d)', '−', s)
    return re.sub(r'\s+', ' ', s).strip()


def start_line(n, texto):
    key = texto[:22]
    for i, l in enumerate(L):
        m = ITEM.match(l)
        if m and int(m.group(1)) == n and fix(l)[len(str(n)):].strip().startswith(key[:12]):
            return i
    raise ValueError(f'item {n} nao localizado')


def contexto(i):
    j = i - 1
    while j > 0 and not re.search(r'julgue', L[j], re.I):
        j -= 1
    up = []
    k = j
    while k >= 0:
        l = L[k]
        if FOOT.search(l) or not l.strip():
            k -= 1
            continue
        if k != j and (STOP.match(l) or ITEM.match(l) or HEAD.match(l)):
            break
        up.append(l)
        k -= 1
    down = []
    k = j + 1
    while k < i:
        if ITEM.match(L[k]) or STOP.match(L[k]):     # nao arrastar itens/justificativas anteriores do grupo
            break
        if not FOOT.search(L[k]) and L[k].strip():
            down.append(L[k])
        k += 1
    linhas = list(reversed(up)) + down
    # paragrafos: linha com recuo >= 8 inicia um novo paragrafo (cenario); o comando comeca em nova linha
    paras, cur = [], []
    for l in linhas:
        if re.match(r'^\s{8,}\S', l) and cur:
            paras.append(cur)
            cur = []
        cur.append(l)
    if cur:
        paras.append(cur)
    txt = [fix(' '.join(p)) for p in paras]
    # separa o comando ("... julgue ...") do cenario que o antecede
    out = []
    for t in txt:
        m = re.search(r'(?<=[.:])\s+(?=(?:Considerando|Com base|A partir|A respeito|Acerca|Julgue|No que|Com relação|Relativamente|Em relação)[^.]*julgue)', t)
        if m:
            out += [t[:m.start()].strip(), t[m.end():].strip()]
        else:
            out.append(t)
    return '\n\n'.join(o for o in out if o)


def formatar_item(t):
    m = re.match(r'Situação hipotética:\s*(.*?)\s*Assertiva:\s*(.*)$', t)
    if m:
        return f'Situação hipotética:\n\n{m.group(1)}\n\nAssertiva:\n\n{m.group(2)}'
    return t


def build():
    gab = json.load(open('df_gab.json'))
    itens = {x['numero']: x for x in json.load(open('df_items.json'))}
    out = []
    for n in sorted(MAPA):
        x = itens[n]
        ans = gab[str(n)]
        assert ans in 'CE', (n, ans)
        texto = fix(x['texto'])
        if texto[:1].islower():
            assert n in STEM, f'item {n} comeca em minusculas e nao tem radical'
            texto = STEM[n] + ' ' + texto
        ctx = contexto(start_line(n, x['texto']))
        enun = (ctx + '\n\n' if ctx else '') + formatar_item(texto)
        area, assunto, bloco = MAPA[n]
        out.append({'id': f'{INST}-{ANO}-Q{n:03d}', 'instituicao': INST, 'ano': ANO, 'cargo': CARGO,
                    'area': area, 'assunto': assunto, 'numero_original': n, 'enunciado': enun,
                    'alternativas': {'C': 'Certo', 'E': 'Errado'}, 'gabarito': ans, 'bloco': bloco, 'incidencia': ''})
    return out


if __name__ == '__main__':
    recs = build()
    json.dump(recs, open('novas_df.json', 'w'), ensure_ascii=False, indent=1)
    print(len(recs), 'itens |', collections.Counter(r['gabarito'] for r in recs))
    for a, c in collections.Counter(r['area'] for r in recs).most_common():
        print(f'  {c:3d}  {a}')
