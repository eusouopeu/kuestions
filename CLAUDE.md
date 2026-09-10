# Kuestions — regras de formatação de enunciado

Ao extrair/incorporar novas questões neste banco (`kuestion_db_1.json`), aplicar estas duas regras ao campo `enunciado`:

## 1. Separar preâmbulo genérico do enunciado real

Muitas questões têm um preâmbulo genérico antes do "." ou ":" que apenas indica o dispositivo legal tratado e o que deve ser feito (ex.: "Com relação ao acordo de leniência previsto na Lei nº 12.846... considere a seguinte situação:"), seguido do enunciado real (a situação/comando que efetivamente será respondido).

Quando isso ocorrer, separar as duas partes por uma linha vazia entre elas.

**Exemplo:**
```
Com relação ao acordo de leniência previsto na Lei nº 12.846, de 1° de agosto de 2013, e no Decreto nº 11.129, de 11 de julho de 2022, considere a seguinte situação:

No curso de procedimento administrativo de responsabilização (PAR), a comissão julgadora decidiu pela possibilidade de celebração de acordo de leniência no caso concreto, tendo a empresa interessada demonstrado interesse na celebração. Nessa situação, a celebração do acordo de leniência
```

## 2. Listar itens em linhas separadas

Quando o enunciado contiver uma lista de itens (ex.: I, II, III... ou a, b, c...), cada item deve ficar em uma linha separada, com o primeiro item aparecendo depois de uma linha vazia em relação ao restante do enunciado.

**Exemplo:**
```
São exemplos de órgãos da Administração pública direta:

I. Partidos Políticos e Congresso Nacional.
II. Secretaria Estadual de Finanças e Secretaria Municipal de Planejamento.
III. Secretaria Estadual de Finanças e Partidos Políticos.
IV. Secretaria Municipal de Planejamento e Ministério do Turismo.
V. União e Instituto Nacional de Seguridade Social.

Está correto o que consta APENAS em
```
