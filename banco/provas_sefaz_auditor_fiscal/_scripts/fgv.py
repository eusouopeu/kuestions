#!/usr/bin/env python3
"""Extrai texto de provas FGV (A4, 2 colunas) e faz o parse de questoes."""
import re, subprocess, sys, json


def fgv_text(pdf, pages=None):
    info = subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout
    n = int(re.search(r'^Pages:\s+(\d+)', info, re.M).group(1))
    W = float(re.search(r'^Page size:\s+([\d.]+)', info, re.M).group(1))
    H = float(re.search(r'Page size:\s+[\d.]+ x ([\d.]+)', info).group(1))
    half = int(W / 2)
    out = []
    rng = pages or range(1, n + 1)
    for p in rng:
        for x, w in ((0, half), (half, int(W) - half)):
            t = subprocess.run(
                ['pdftotext', '-layout', '-f', str(p), '-l', str(p),
                 '-x', str(x), '-y', '0', '-W', str(w), '-H', str(int(H)), pdf, '-'],
                capture_output=True, text=True).stdout
            out.append(t)
    return '\n'.join(out)


NUM = re.compile(r'^\s{0,12}(\d{1,3})\s*$')
ALT = re.compile(r'^\s{0,12}\(([A-E])\)\s*(.*)$')


def parse(text, expected_max=None):
    lines = text.split('\n')
    # localiza inicios de questao: linha so com numero, seguida em ate 40 linhas por (A)
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
    # mantem apenas sequencia crescente (1,2,3...)
    seq, nxt = [], 1
    for i, num in starts:
        if num == nxt:
            seq.append((i, num))
            nxt += 1
    qs = []
    for k, (i, num) in enumerate(seq):
        end = seq[k + 1][0] if k + 1 < len(seq) else len(lines)
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
        if len(alts) != 5:
            qs.append({'numero': num, 'erro': f'{len(alts)} alternativas'})
            continue
        clean = lambda parts: re.sub(r'\s+', ' ', ' '.join(p for p in parts if p.strip())).strip()
        qs.append({
            'numero': num,
            'enunciado': re.sub(r'\n{3,}', '\n\n', '\n'.join(enun)).strip(),
            'alternativas': {k2: clean(v) for k2, v in alts.items()},
        })
    return qs


if __name__ == '__main__':
    pdf = sys.argv[1]
    mx = int(sys.argv[2]) if len(sys.argv) > 2 else None
    t = fgv_text(pdf)
    qs = parse(t, mx)
    bad = [q for q in qs if 'erro' in q]
    print(f'{len(qs)} questoes | {len(bad)} com erro', file=sys.stderr)
    if bad:
        print(bad[:10], file=sys.stderr)
    json.dump(qs, open(sys.argv[3], 'w') if len(sys.argv) > 3 else sys.stdout,
              ensure_ascii=False, indent=1)
