#!/usr/bin/env python3
"""Parser FGV com deteccao de cabecalho de disciplina."""
import re, sys, json
from fgv import fgv_text, NUM, ALT

HEADERS = re.compile(
    r'^(L[ií]ngua Portuguesa|L[ií]ngua Inglesa|Racioc[ií]nio L[óo]gico[- ]?Matem[áa]tico|'
    r'Matem[áa]tica[^\n]*|Estat[íi]stica[^\n]*|Administra[çc][ãa]o P[úu]blica|Administra[çc][ãa]o Geral[^\n]*|'
    r'Direito Administrativo|Direito Constitucional|Direito Civil[^\n]*|Direito Empresarial[^\n]*|'
    r'Direito Penal[^\n]*|Direito Tribut[áa]rio|Direito Financeiro[^\n]*|Direito Previdenci[áa]rio|'
    r'Legisla[çc][ãa]o Tribut[áa]ria[^\n]*|Legisla[çc][ãa]o Estadual[^\n]*|Legisla[çc][ãa]o Espec[íi]fica[^\n]*|'
    r'Economia[^\n]*|Finan[çc]as P[úu]blicas[^\n]*|Contabilidade[^\n]*|Auditoria[^\n]*|'
    r'No[çc][õo]es de Inform[áa]tica|Tecnologia da Informa[çc][ãa]o[^\n]*|Inform[áa]tica[^\n]*|'
    r'Gest[ãa]o[^\n]*|Atualidades|Conhecimentos Gerais|[ÉE]tica[^\n]*)\s*$', re.I)

BAD = re.compile(r'[.;:,]$|assinale|considere|correta|opção|afirmativ', re.I)


def parse2(text, expected_max=None):
    lines = text.split('\n')
    starts = []
    for i, l in enumerate(lines):
        m = NUM.match(l)
        if not m:
            continue
        num = int(m.group(1))
        if expected_max and not (1 <= num <= expected_max):
            continue
        for j in range(i + 1, min(i + 45, len(lines))):
            if ALT.match(lines[j]):
                starts.append((i, num))
                break
            if NUM.match(lines[j]):
                break
    seq, last = [], 0
    for i, num in starts:
        if last < num <= last + 4:          # tolera lacunas curtas de deteccao
            seq.append((i, num))
            last = num
    # cabecalhos: linhas curtas, sem pontuacao final, que casam HEADERS
    heads = []
    for i, l in enumerate(lines):
        s = l.strip()
        if 3 < len(s) < 60 and not BAD.search(s) and HEADERS.match(s):
            heads.append((i, s))
    # junta cabecalhos quebrados em 2 linhas consecutivas
    merged = []
    for i, s in heads:
        if merged and i - merged[-1][0] <= 2 and not s.lower().startswith(('lingua', 'língua')):
            merged[-1] = (merged[-1][0], merged[-1][1] + ' ' + s)
        else:
            merged.append((i, s))
    qs = []
    for k, (i, num) in enumerate(seq):
        end = seq[k + 1][0] if k + 1 < len(seq) else len(lines)
        disc = None
        for hi, hs in merged:
            if hi < i:
                disc = hs
        body = lines[i + 1:end]
        enun, alts, cur = [], {}, None
        for l in body:
            m = ALT.match(l)
            if m:
                cur = m.group(1)
                alts[cur] = [m.group(2).strip()]
            elif cur:
                alts[cur].append(l.strip())
            else:
                enun.append(l.rstrip())
        clean = lambda parts: re.sub(r'\s+', ' ', ' '.join(p for p in parts if p.strip())).strip()
        # remove linha de cabecalho do enunciado
        enun = [e for e in enun if not (merged and HEADERS.match(e.strip()) and len(e.strip()) < 60)]
        q = {'numero': num, 'disciplina': disc,
             'enunciado': re.sub(r'\n{3,}', '\n\n', '\n'.join(enun)).strip(),
             'alternativas': {k2: clean(v) for k2, v in alts.items()}}
        if len(alts) != 5:
            q['erro'] = f'{len(alts)} alternativas'
        qs.append(q)
    return qs


if __name__ == '__main__':
    pdf, mx, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    qs = parse2(fgv_text(pdf), mx)
    bad = [q['numero'] for q in qs if 'erro' in q]
    import collections
    print(f'{len(qs)} q | erros: {bad}', file=sys.stderr)
    for d, c in collections.Counter(q['disciplina'] for q in qs).items():
        print(f'   {c:3d}  {d}', file=sys.stderr)
    json.dump(qs, open(out, 'w'), ensure_ascii=False, indent=1)
