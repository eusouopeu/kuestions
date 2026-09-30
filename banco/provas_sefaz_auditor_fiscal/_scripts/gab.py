#!/usr/bin/env python3
"""Parser de gabarito definitivo FGV: pares linha-de-numeros / linha-de-letras."""
import re, subprocess, sys, json

NUMS = re.compile(r'^\s*(\d{1,3})(\s+\d{1,3}){3,}\s*$')
LETS = re.compile(r'^\s*([A-E*])(\s+[A-E*]){3,}\s*$')


def parse_gab(pdf, section_re=None):
    txt = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
    lines = txt.split('\n')
    sections, cur = [], None
    for i, l in enumerate(lines):
        s = l.strip()
        if section_re and re.search(section_re, s, re.I):
            cur = {}
            sections.append((s, cur))
        if NUMS.match(l):
            nums = l.split()
            # procura proxima linha de letras em ate 4 linhas
            for j in range(i + 1, min(i + 5, len(lines))):
                if LETS.match(lines[j]):
                    lets = lines[j].split()
                    if len(lets) == len(nums):
                        if cur is None:
                            cur = {}
                            sections.append(('(sem secao)', cur))
                        for n, a in zip(nums, lets):
                            cur.setdefault(int(n), a)
                    break
    return sections


if __name__ == '__main__':
    pdf = sys.argv[1]
    sec = sys.argv[2] if len(sys.argv) > 2 else None
    s = parse_gab(pdf, sec)
    for idx, (k, v) in enumerate(s):
        ks = sorted(v)
        print(f'--- [{idx}] {k}: {len(v)} respostas  ({min(ks) if ks else "-"}..{max(ks) if ks else "-"})'
              f'  anuladas={[n for n,a in v.items() if a=="*"]}')
    if len(sys.argv) > 3:
        json.dump([{'secao': k, 'resp': v} for k, v in s], open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
