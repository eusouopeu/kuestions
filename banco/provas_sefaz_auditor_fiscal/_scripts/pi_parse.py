#!/usr/bin/env python3
"""Parser do caderno FCC SEFAZ-PI 2025 (camada OCR ruidosa). Uso: pi_parse.py P1|P2 [-v]"""
import re, json, subprocess, sys

PDF = '../[2025] SEFAZ-PI/SEFAZ-PI_2025_Geral_prova.pdf'
PAGES = {'P2': (1, 23), 'P1': (24, 42)}

ACC = 'áéíóúâêôãõçàÁÉÍÓÚÂÊÔÃÕÇÀ'


def ocr_clean(s):
    s = s.replace('­', '')
    s = re.sub(rf'([A-Za-z]{{2,}}) ([{ACC}][A-Za-z{ACC}]+)', r'\1\2', s)       # ESPEC ÍFICOS, car áter
    s = re.sub(rf'([a-z][{ACC}]) ([a-z]{{2,}})', r'\1\2', s)                    # tributá ria, polí tico
    s = re.sub(r'\s+([,.;:])', r'\1', s)
    s = re.sub(r'\(\s*([A-E])\s*[)\]}jJ]', r'(\1)', s)
    s = re.sub(r'n[\^º°4]\s*(?=\d)', 'nº ', s)
    s = re.sub(r'R[S$]\s*(?=\d)', 'R$ ', s)
    return s


def page_text(tag):
    a, b = PAGES[tag]
    out = subprocess.run(['pdftotext', '-layout', '-f', str(a), '-l', str(b), PDF, '-'],
                         capture_output=True, text=True).stdout
    lines = []
    for l in out.split('\n'):
        if re.search(r"Caderno de Prova|SEFP|AFFE|Coniiec|Conhec\.|Espec[ií]fic.*-P\d|Gera iss", l):
            continue
        l = re.sub(r'\s{3,}-\s*$', '-', l.rstrip())           # hifen de quebra flutuando na margem
        if re.fullmatch(r'\s*[-,.\s]*', l):
            continue
        lines.append(l)
    return lines


START = re.compile(r'^\s{0,6}([0-9OIl]{1,2})\s?[.,]\s+(\S.*)$')
ALT = re.compile(r'^\s{0,8}\(\s*([A-E])\s*[)\]}jJ]\s*(.*)$')
HEAD = re.compile(r'^\s{15,}([A-ZÁÉÍÓÚ][A-Za-zÁÉÍÓÚáéíóúâêôãõç ,\-]{4,60})\s*$')


def parse(tag):
    L = page_text(tag)
    heads = [(i, re.sub(r'\s+', ' ', m.group(1)).strip()) for i, l in enumerate(L) if (m := HEAD.match(l))]
    starts = []
    for i, l in enumerate(L):
        m = START.match(l)
        if not m:
            continue
        for j in range(i + 1, min(i + 60, len(L))):
            if ALT.match(L[j]):
                starts.append(i)
                break
            if START.match(L[j]):
                break
    # descarta falsos inicios (itens I., II. etc. nao passam no START por serem romanos com espaco)
    qs = []
    for k, i in enumerate(starts):
        end = starts[k + 1] if k + 1 < len(starts) else len(L)
        body = [START.match(L[i]).group(2)] + L[i + 1:end]
        enun, alts, cur = [], {}, None
        for l in body:
            m = ALT.match(l)
            if m and (cur is None or m.group(1) > cur):
                cur = m.group(1)
                alts[cur] = [m.group(2)]
            elif cur:
                if HEAD.match(l):
                    break
                alts[cur].append(l)
            else:
                enun.append(l)
        secao = ''
        for hi, hs in heads:
            if hi < i:
                secao = hs
        qs.append({'seq': k + 1, 'num_ocr': START.match(L[i]).group(1), 'secao': secao,
                   'enunciado': ocr_clean('\n'.join(x.strip() for x in enun)),
                   'alternativas': {a: ocr_clean(re.sub(r'\s+', ' ', ' '.join(v))).strip() for a, v in alts.items()}})
    return qs, heads


if __name__ == '__main__':
    tag = sys.argv[1]
    qs, heads = parse(tag)
    json.dump(qs, open(f'pi_{tag.lower()}.json', 'w'), ensure_ascii=False, indent=1)
    print(tag, 'questoes:', len(qs), '| sem 5 alternativas:', [q['seq'] for q in qs if len(q['alternativas']) != 5])
    print('cabecalhos:', [h for _, h in heads])
    if '-v' in sys.argv:
        for q in qs:
            print(f"{q['seq']:2d} ocr={q['num_ocr']:>2} [{q['secao'][:16]}] {re.sub(chr(10), ' ', q['enunciado'])[:110]}")
