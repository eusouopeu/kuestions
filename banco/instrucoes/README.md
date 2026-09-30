# Instruções — buscar provas e extrair questões (eficiente em tokens)

Leia **nesta ordem**, só o que precisar:

| Arquivo | Quando |
|---|---|
| [01-buscar-provas.md](01-buscar-provas.md) | Achar e baixar PDFs de prova + gabarito |
| [02-extrair-pdf.md](02-extrair-pdf.md) | PDF → texto → questões JSON (FGV, FCC, Cebraspe, escaneado) |
| [03-classificar-e-incorporar.md](03-classificar-e-incorporar.md) | Área/assunto/bloco, formatação, merge, commit |
| [04-taxonomia.md](04-taxonomia.md) | Lista fechada de `area` e `bloco` |

## Regras de ouro (economia de tokens)

1. **Nunca** ler PDF inteiro com Read/visão se `pdftotext` resolve. Visão só para páginas escaneadas/figuras.
2. **Nunca** imprimir o texto completo da prova no chat. Rodar parser em script e imprimir só **contagens + amostra de 2 questões + anomalias**.
3. **Nunca** reler o banco inteiro: usar `python` com filtros (`id.startswith`, contagem por prova). O JSON tem 3,8 MB.
4. Fazer o trabalho **inline** (sem Agent/Workflow em background) — preferência registrada do usuário.
5. Reutilizar `provas_sefaz_auditor_fiscal/_scripts/` (`fgv.py`, `gab.py`, `common.py`, `merge.py`, `build_pr.py` como molde). Não reescrever parsers.
6. Excluir na triagem: legislação estadual específica, questões anuladas (`*`), questões que dependem de figura/planilha em imagem (salvo reconstrução simples).
7. Validar sempre: nº de questões = esperado, gabarito ∈ alternativas, sem alternativa vazia, sem ruído de cabeçalho/rodapé.
8. Um commit por prova (ver 03).
9. Antes de baixar: conferir em `historico.md` se a prova já está no banco.
