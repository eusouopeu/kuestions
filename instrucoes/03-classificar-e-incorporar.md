# 03 — Classificar, formatar, mesclar e commitar

## Schema (ordem exata das chaves — `merge.py` valida)

```
id, instituicao, ano, cargo, area, assunto, numero_original,
enunciado, alternativas, gabarito, bloco, incidencia
```
- `id`: `<INST>-<ANO>-<TAG>-Q<NNN>` (ex.: `SEFAZ-PR-2025-P1-Q071`; TAG = P1/P2/M/T/AG-P1…). Único.
- `area`/`bloco`: **só valores de `04-taxonomia.md`**. `bloco` vazio `''` para áreas sem plano (Português, Mat/RL, Civil/Empresarial, Penal, Inglês, Adm. Pública).
- `assunto`: frase curta, p.ex. `CPC 47 — Receita de Contrato`, `Lei Anticorrupção (Lei 12.846/2013)`.
- `incidencia`: `''` (nova prova não recebe tier).

## Classificação eficiente (mais barata que o dict manual de 80 linhas)

1. Pelo **edital/cronograma**, as questões vêm em blocos por disciplina (ex.: 1–10 Português, 11–20 RL…). Mapear por **faixa**: `{(1,10): LP, (11,20): MRL, …}`.
2. Dentro da área, classificar `assunto`/`bloco` por **palavras-chave** no enunciado (script), p.ex.:
   - `CPC \d+` → Contab. Geral [4] CPCs; `SQL|SELECT` → Informática [3]; `ICMS|ISS|IPI|CTN|crédito tributário` → Dir. Tributário (bloco por tema); `LRF|Lei Complementar 101` → Finanças [4]; `NBC TA|auditoria` → Auditoria; `IS-LM|PIB|oferta agregada` → Economia [4]…
3. Imprimir **só o que o script não classificou** (ou ficou ambíguo) e resolver esse resto manualmente com um dict curto (molde: `build_pr.py`). Questão fora: comentar `# N: estadual → excluída`.
4. Conferir distribuição: `Counter(area)` bate com a estrutura da prova.

## Formatação do enunciado (`common.py: make()` já aplica)

Regras do `CLAUDE.md` do projeto: (1) preâmbulo genérico + linha vazia + enunciado real; (2) itens I/II/III ou a/b/c cada um em linha própria, com linha vazia antes do primeiro e depois do último, antes do comando de fechamento ("Está correto o que consta APENAS em"). Amostrar 2 questões com lista depois de rodar, não todas.

## Merge e verificação

```bash
cd provas_sefaz_auditor_fiscal/_scripts
python3 build_XX.py            # gera novas_XX.json + contagem por área
python3 merge.py novas_XX.json # valida e acrescenta (pula ids existentes)
```
Verificações rápidas (imprimir só números):
- total antes/depois; `gabarito in alternativas`; ids únicos;
- sem ruído: `grep -c "Página\|TIPO"` no novo lote;
- duplicatas de enunciado com provas anteriores (questões repetidas de bancas): `python` comparando primeiros 80 caracteres.

## Commit (um por prova)

```bash
git add kuestion_db_1.json historico.md
git commit -m "Adiciona <ÓRGÃO> <ANO> (<BANCA>): +N questões"
```
Atualizar a linha correspondente em `historico.md` e riscar/mover o item em `steps.md`. Opcional: copiar o lote para `Incorporadas no banco de dados/[ANO] ÓRGÃO.json`.
`provas_sefaz_auditor_fiscal/` e `.DS_Store` ficam fora do git.
