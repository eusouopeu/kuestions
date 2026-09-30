#!/usr/bin/env python3
"""SEFAZ-PI 2025 (FCC) - Auditor Fiscal da Fazenda Estadual. Dados transcritos das imagens (pi_p1_data / pi_p2_data)."""
import json, collections, importlib, sys

INST, ANO = 'SEFAZ-PI', 2025
CARGO = 'Auditor Fiscal da Fazenda Estadual'


def build(provas):
    gab = json.load(open('pi_gab.json'))
    out = []
    for tag in provas:
        mod = importlib.import_module(f'pi_{tag.lower()}_data')
        ctx = getattr(mod, 'CTX', {})
        ctx_de = getattr(mod, 'CTX_DE', {})
        for n in sorted(mod.Q):
            area, assunto, bloco, enun, alts = mod.Q[n]
            assert len(alts) == 5, (tag, n)
            ans = gab[tag][str(n)]
            assert ans in 'ABCDE', (tag, n, ans)
            if n in ctx_de:
                enun = ctx[ctx_de[n]] + '\n\n' + enun
            out.append({'id': f'{INST}-{ANO}-{tag}-Q{n:03d}', 'instituicao': INST, 'ano': ANO, 'cargo': CARGO,
                        'area': area, 'assunto': assunto, 'numero_original': n, 'enunciado': enun.strip(),
                        'alternativas': dict(zip('ABCDE', (a.strip() for a in alts))), 'gabarito': ans,
                        'bloco': bloco, 'incidencia': ''})
    return out


if __name__ == '__main__':
    provas = sys.argv[1:] or ['P1', 'P2']
    recs = build(provas)
    json.dump(recs, open('novas_pi.json', 'w'), ensure_ascii=False, indent=1)
    print(len(recs), 'questoes', provas)
    for a, c in collections.Counter(r['area'] for r in recs).most_common():
        print(f'  {c:3d}  {a}')
