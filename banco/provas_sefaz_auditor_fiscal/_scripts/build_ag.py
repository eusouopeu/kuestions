#!/usr/bin/env python3
"""SEFAZ-PI 2025 (FCC) - Agente de Tributos da Fazenda Estadual (P1 + P2), a partir de ag_p1_data / ag_p2_data."""
import json, collections, importlib

INST, ANO = 'SEFAZ-PI', 2025
CARGO = 'Agente de Tributos da Fazenda Estadual'


def build():
    gab = json.load(open('ag_gab.json'))
    out = []
    for tag in ('P1', 'P2'):
        mod = importlib.import_module(f'ag_{tag.lower()}_data')
        for n in sorted(mod.Q):
            area, assunto, bloco, enun, alts = mod.Q[n]
            assert len(alts) == 5, (tag, n)
            ans = gab[tag][str(n)]
            assert ans in 'ABCDE', (tag, n, ans)
            if n in mod.CTX_DE:
                enun = mod.CTX[mod.CTX_DE[n]] + '\n\n' + enun
            out.append({'id': f'{INST}-{ANO}-AG-{tag}-Q{n:03d}', 'instituicao': INST, 'ano': ANO, 'cargo': CARGO,
                        'area': area, 'assunto': assunto, 'numero_original': n, 'enunciado': enun.strip(),
                        'alternativas': dict(zip('ABCDE', (a.strip() for a in alts))), 'gabarito': ans,
                        'bloco': bloco, 'incidencia': ''})
    return out


if __name__ == '__main__':
    recs = build()
    json.dump(recs, open('novas_ag.json', 'w'), ensure_ascii=False, indent=1)
    print(len(recs), 'questoes')
    for a, c in collections.Counter(r['area'] for r in recs).most_common():
        print(f'  {c:3d}  {a}')
