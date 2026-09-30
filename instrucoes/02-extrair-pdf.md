# 02 — Extrair questões de PDF

Trabalhar sempre em `provas_sefaz_auditor_fiscal/_scripts/` (ou pasta de scratch). Imprimir só contagens e amostras.

## Diagnóstico (1 comando)

```bash
pdfinfo p.pdf | grep -E 'Pages|Page size'; pdftotext -f 2 -l 2 -layout p.pdf - | head -40
```
- Texto legível → caminho A/B/C. Texto vazio/lixo → **escaneado** (caminho D).

## A) FGV (A4, 2 colunas, alternativas `(A)`)

Usar `fgv.py` (`fgv_text` recorta coluna por coluna com `pdftotext -layout -x/-W`; `parse` acha questões por linha só com número seguida de `(A)`, exigindo sequência 1,2,3…). Gabarito: `gab.py prova_gab.pdf "TIPO" saida.json` (pares linha-de-números/linha-de-letras; `*` = anulada). Escolher o tipo de caderno do gabarito que casa com a prova.
Armadilhas: rodapé "Tipo Branca – Página N" em caixa mista (já no `NOISE` de `common.py`); questões com quadro/figura.

## B) FCC (alternativas `(A)`…`(E)` ou `A)`; 1 coluna ou 2)

Testar primeiro `pdftotext -layout` simples; se colunas embaralharem, reaproveitar `fgv_text` ajustando o `half`. Conferir cabeçalho numérico `QUESTÃO 01`/`01.`; adaptar `NUM`/`ALT` regex em cópia do `fgv.py` (não editar o original). Gabarito FCC: tabela Questão × Gabarito por cargo — regex simples.

## C) Cebraspe (Certo/Errado)

Itens numerados com assertiva; bloco de texto-base antecede vários itens. Schema: enunciado = texto-base/comando + linha vazia + assertiva; `alternativas = {"C":"Certo","E":"Errado"}`; gabarito `C`/`E`. Anuladas: excluir. Prova "com justificativas" traz gabarito preliminar: **sempre conferir com o definitivo** (DF 2020: 1 alteração, 5 anuladas). Ver `df_parse.py`.

## D) Escaneado / OCR ruim

```bash
pdftoppm -r 150 -f P -l P -png p.pdf pg   # 150–170 dpi
```
Ler as imagens por visão **em lotes de páginas** e transcrever em `*_data.py` (dict por questão). Só usar isso quando `pdftotext` falhar; é a etapa mais cara. Exemplos: `pi_p1_data.py`, `ag_p1_data.py`. Tentar antes `ocrmypdf`/`tesseract` se instalados (`which tesseract`) e corrigir só o que o parser acusar.

## Saída intermediária

JSON por prova: `[{numero, enunciado, alternativas{A..E}}]` + gabarito `{numero: letra}`. Checar:
```python
assert len(qs)==esperado; assert all(len(q['alternativas'])==5 for q in qs)  # ou 2 p/ C/E
```
Se o parser perder questões, **consertar a regex**, não transcrever à mão. Imprimir apenas os números faltantes.

## Figuras/tabelas

Questão depende de imagem (gráfico, planilha, balanço em figura): excluir; se a tabela for simples, reconstruir em texto.
