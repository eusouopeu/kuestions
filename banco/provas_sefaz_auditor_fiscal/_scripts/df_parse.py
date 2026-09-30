#!/usr/bin/env python3
"""Parser da prova Cebraspe SEEC-DF 2020 (versao com justificativas), a partir de df.txt (fluxo por colunas)."""
import re, json, sys

L = open('df.txt').read().split('\n')
ITEM = re.compile(r'^\s{0,6}(\d{1,3})\s+(\S.*)$')
JUST = re.compile(r'^\s*JUSTIFICATIVA:\s*(CERTO|ERRADO)', re.I)
HEAD = re.compile(r'^[A-ZÁÉÍÓÚÂÊÔÃÕÇ ,()/–-]{6,70}$')
SKIPH = re.compile(r'JUSTIFICATIVA|CEBRASPE|CADERNO|CONCURSO|SECRETARIA|DISTRITO|RASCUNHO|TARDE|LEIA|OBSERVA|INFORMA|APLICA|^DE ECONOMIA|EC/DF')

# cabecalhos de disciplina (linhas consecutivas unidas)
heads = []
for i, l in enumerate(L):
    s = l.strip()
    if HEAD.fullmatch(s) and not SKIPH.search(s):
        if heads and i - heads[-1][0] <= 2:
            heads[-1] = (i, heads[-1][1] + ' ' + s)
        else:
            heads.append((i, s))

items, last, i = [], 0, 0
while i < len(L):
    m = ITEM.match(L[i])
    if m and last < int(m.group(1)) <= last + 3:
        n = int(m.group(1))
        # precisa haver JUSTIFICATIVA antes de outro item numerado
        j, ok = i + 1, None
        while j < min(i + 40, len(L)):
            if JUST.match(L[j]):
                ok = j
                break
            m2 = ITEM.match(L[j])
            if m2 and int(m2.group(1)) == n + 1:
                break
            j += 1
        if ok is not None:
            texto = ' '.join([m.group(2)] + [x.strip() for x in L[i + 1:ok] if x.strip()])
            resp = 'C' if JUST.match(L[ok]).group(1).upper() == 'CERTO' else 'E'
            # comando: paragrafo mais proximo acima contendo "julgue"
            cmd, k = '', i - 1
            while k > max(0, i - 400):
                if re.search(r'julgue', L[k], re.I):
                    a = k
                    while a > 0 and L[a - 1].strip() and not JUST.match(L[a - 1]) \
                            and not re.search(r'[.)]\s*$', L[a - 1].strip()) and a > k - 12:
                        a -= 1
                    b = k
                    while b + 1 < len(L) and L[b + 1].strip() and not ITEM.match(L[b + 1]) and b < k + 12:
                        b += 1
                    cmd = ' '.join(x.strip() for x in L[a:b + 1])
                    break
                k -= 1
            secao = ''
            for hi, hs in heads:
                if hi < i:
                    secao = hs
            items.append({'numero': n, 'secao': secao, 'comando': re.sub(r'\s+', ' ', cmd),
                          'texto': re.sub(r'\s+', ' ', texto), 'resp_just': resp})
            last = n
            i = ok + 1
            continue
    i += 1

json.dump(items, open('df_items.json', 'w'), ensure_ascii=False, indent=1)
ns = [x['numero'] for x in items]
print('itens:', len(items), '| faltando:', [k for k in range(1, 161) if k not in ns])
if '-v' in sys.argv:
    for x in items:
        print(f"{x['numero']:3d} {x['resp_just']} [{x['secao'][:14]}] <{x['comando'][:70]}> {x['texto'][:95]}")
