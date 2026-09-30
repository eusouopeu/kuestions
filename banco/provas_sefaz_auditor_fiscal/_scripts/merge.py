#!/usr/bin/env python3
"""Mescla um lote de questoes novas no kuestion_db_1.json, sem duplicar ids."""
import json, sys, collections, os

# banco/kuestion_db_1.json — o mesmo arquivo que o app importa (src/lib/banco.ts).
DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'kuestion_db_1.json')
CAMPOS = ['id', 'instituicao', 'ano', 'cargo', 'area', 'assunto', 'numero_original',
          'enunciado', 'alternativas', 'gabarito', 'bloco', 'incidencia']


def main(lote):
    db = json.load(open(DB))
    novos = json.load(open(lote))
    existentes = {q['id'] for q in db}
    add = []
    for q in novos:
        assert list(q.keys()) == CAMPOS, (q['id'], list(q.keys()))
        assert q['gabarito'] in q['alternativas'], q['id']
        assert all(v.strip() for v in q['alternativas'].values()), ('alternativa vazia', q['id'])
        assert len(q['enunciado']) >= 12, ('enunciado curto', q['id'])
        if q['id'] in existentes:
            print('JA EXISTE, pulando:', q['id'])
            continue
        add.append(q)
        existentes.add(q['id'])
    db.extend(add)
    json.dump(db, open(DB, 'w'), ensure_ascii=False, indent=1)
    print(f'+{len(add)} questoes | total agora: {len(db)}')
    for k, v in collections.Counter(q['area'] for q in add).most_common():
        print(f'   {v:3d}  {k}')


if __name__ == '__main__':
    main(sys.argv[1])
