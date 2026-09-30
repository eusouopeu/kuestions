#!/usr/bin/env python3
"""Utilitarios comuns: limpeza de ruido, desdobramento de linhas e formatacao do enunciado.

Regras do CLAUDE.md do projeto:
 1. preambulo generico separado do enunciado real por linha vazia;
 2. itens de lista (I, II... / a, b... / ( )) cada um em sua linha, com linha
    vazia antes do primeiro item.
"""
import re

NOISE = [
    r'TIPO\s+[A-ZÇÃÕÉ]+\s*[–-]\s*P[ÁA]GINA\s*\d+',
    r'P[ÁA]GINA\s*\d+\s*[–-]?\s*TIPO\s+[A-ZÇÃÕÉ]+',
    r'SECRETARIA\s+D[AEO]\s+[A-ZÇÃÕÉÍÓÚÂÊ\s]{5,90}',
    r'FUNDA[ÇC][ÃA]O\s+GET[ÚU]LIO\s+VARGAS',
    r'CONCURSO\s+P[ÚU]BLICO[^\n]{0,60}',
    r'PREFEITURA\s+(MUNICIPAL\s+)?D[EO]\s+[A-ZÇÃÕÉÍÓÚÂÊ\s]{3,45}',
    r'AUDITOR[- ]?FISCAL[A-ZÇÃÕÉÍÓÚÂÊ\s]{0,45}',
    r'AGENTE\s+DE\s+TRIBUTOS[A-ZÇÃÕÉÍÓÚÂÊ\s]{0,45}',
    r'CONSULTOR\s+DO\s+TESOURO[A-ZÇÃÕÉÍÓÚÂÊ\s]{0,45}',
    r'N[ÍI]VEL\s+SUPERIOR',
    r'\bTIPO\s+\d+\s*[–-]\s*[A-ZÇÃÕÉ]+',
    r'(?i:Consultor do Tesouro Estadual\s*-\s*Ci[êe]ncias[^()\n]{0,60}\((?:Manh[ãa]|Tarde)\))',
    r'(?i:Tipo\s+Branca\s*[–-]\s*P[áa]gina\s*\d+)',
    r'-?\s*SEFAZ-ES\s+FGV',
    r'(?i:Consultor do Tesouro Estadual\s*-\s*Ci[êe]ncias.*$)',
    r'\bFAZ-ES\s+FGV.*$',
]
NOISE_RE = re.compile('|'.join(NOISE))

ITEM = re.compile(r'^(?:'
                  r'\(?\s*(?:[IVX]{1,5})\s*[.)\-–]\s+'      # I.  II)  III -
                  r'|\(?\s*[a-e]\s*[.)]\s+'                  # a)  (b)
                  r'|\(\s*\)\s*'                             # ( ) V/F
                  r'|[•▪◦]\s*'                               # bullets
                  r'|\d{1,2}\s*[.)]\s+(?=[A-ZÀ-Ú])'          # 1. Progressividade
                  r')')

CLOSER = re.compile(
    r'^(est[áàãa]o? corret[ao]s?|[ée] corret[ao]|assinale|as afirmativas|as asser|'
    r'a sequ[êe]ncia|gerencialmente|considerando|com base|marque|indique|'
    r'assim|dessa forma|nesse|nessa|diante|logo|portanto|analise|avalie|'
    r'a partir|sobre |acerca|em rela[çc][ãa]o|quanto a|julgue|na ordem|'
    r'o n[úu]mero|qual|quais|assinale-se|na situa[çc][ãa]o)', re.I)

PREAMBULO = re.compile(
    r'^((?:leia|considere|observe|analise|avalie|julgue|com rela[çc][ãa]o|a respeito|'
    r'acerca|sobre|no que diz respeito|em rela[çc][ãa]o|quanto a|de acordo com|'
    r'com base)[^.:;]{0,150}[.:])\s+(?=\S)', re.I)


def clean(s):
    if not s:
        return s
    s = NOISE_RE.sub(' ', s)
    s = re.sub(r'[ \t]+', ' ', s)
    return s.strip(' \n-–')


def format_enunciado(raw):
    """Desdobra quebras de linha do PDF e aplica as duas regras de formatacao."""
    raw = NOISE_RE.sub(' ', raw)
    lines = [l.strip() for l in raw.split('\n')]
    blocks, cur, in_list = [], [], False
    for l in lines:
        if not l:
            continue
        if ITEM.match(l):
            if cur:
                blocks.append(('list' if in_list else 'text', ' '.join(cur)))
            cur, in_list = [l], True
        elif in_list and CLOSER.match(l):     # comando de fechamento apos a lista
            blocks.append(('list', ' '.join(cur)))
            cur, in_list = [l], False
        elif in_list:
            cur.append(l)                     # continuacao do item
        else:
            cur.append(l)
    if cur:
        blocks.append(('list' if in_list else 'text', ' '.join(cur)))

    out = []
    for i, (kind, txt) in enumerate(blocks):
        txt = re.sub(r'\s+', ' ', txt).strip()
        if not txt:
            continue
        if kind == 'list':
            if out and out[-1] != '' and not (i and blocks[i - 1][0] == 'list'):
                out.append('')
            out.append(txt)
        else:
            if out and blocks[i - 1][0] == 'list':
                out.append('')
            m = PREAMBULO.match(txt)
            if m and len(txt) - len(m.group(1)) > 40:
                out.append(m.group(1).strip())
                out.append('')
                out.append(txt[m.end():].strip())
            else:
                out.append(txt)
    res = '\n'.join(out)
    res = re.sub(r'\n{3,}', '\n\n', res)
    return res.strip()


def make(qid, inst, ano, cargo, area, assunto, num, enun, alts, gab, bloco=''):
    return {
        'id': qid, 'instituicao': inst, 'ano': ano, 'cargo': cargo, 'area': area,
        'assunto': assunto, 'numero_original': num,
        'enunciado': format_enunciado(enun),
        'alternativas': {k: clean(v) for k, v in alts.items()},
        'gabarito': gab, 'bloco': bloco, 'incidencia': '',
    }
