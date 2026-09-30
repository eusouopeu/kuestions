# 01 — Buscar e baixar provas

## Fluxo mínimo (≤ 4 chamadas por prova)

1. `historico.md` → a prova já existe? Se sim, parar.
2. **Uma** `WebSearch` (standard) com: `"<órgão> <ano> <cargo> caderno de prova gabarito definitivo pdf"`. Se vier fraco, **uma** em modo extended. Não encadear 10 buscas.
3. Preferir resultado que já seja URL de PDF. Baixar com `curl -L -o "provas_sefaz_auditor_fiscal/[ANO] ORGAO/arquivo.pdf" URL` e validar: `file x.pdf` + `pdfinfo x.pdf | grep Pages` (falha = HTML de bloqueio).
4. Baixar **prova + gabarito definitivo** (o preliminar só se o definitivo não existir; anotar).
5. Pedir confirmação ao usuário antes de baixar quando a regra de sessão exigir (nome, origem, tamanho).

## Fontes por banca (do que já foi testado)

| Fonte | Status | Como usar |
|---|---|---|
| **FGV** `conhecimento.fgv.br/concursos?page=0..15` | ✅ PDF estático | Índice lista slugs; `/concursos/<slug>` traz links diretos `…/sites/default/files/concursos/*.pdf` (prova por cargo/turno/tipo + `gabdef_*.pdf`). Extrair links com `curl -s URL \| grep -o 'https[^"]*\.pdf'` (não abrir página no navegador). |
| **FCC** `concursos.fcc.com.br` / `fcc.org.br` | a testar | Normalmente PDFs por cargo + gabarito; provas recentes também no site do órgão. |
| **Cebraspe** `cebraspe.org.br` | ⚠️ SPA; API sem conteúdo | Buscar o PDF por WebSearch (`"<órgão>" "gabarito definitivo" cebraspe pdf`) ou via `arquivos.qconcursos.com`. Fórum do órgão / Direção / Estratégia às vezes hospedam cópias. |
| **Cesgranrio** `cesgranrio.org.br` | a testar | Provas costumam ficar na página do concurso. |
| `arquivos.qconcursos.com/prova/arquivo_prova/<id>/…-prova.pdf` | ✅ só com URL exata | Não dá para descobrir por navegação; usar URLs vindas de WebSearch. PDFs muitas vezes **escaneados** (ver 02). |
| Blogs de cursinhos (Estratégia, Direção, Gran) | ✅ às vezes | `cdn.direcaoconcursos.com.br/uploads/...pdf`, `mkt.estrategia.com/...pdf` aparecem em buscas; ótimos para edital/cronograma, às vezes para prova. |
| pciconcursos.com.br | ❌ Cloudflare Turnstile | Não tentar. |
| qconcursos.com (HTML) | ❌ 403 | Não tentar. |
| netstorage.fgv.br | ❌ Akamai 403 | Concursos FGV antigos indisponíveis. |

## Dicas

- Para descobrir **quais** concursos existem: `WebSearch "concursos fiscais 2026 editais previstos e abertos"` e guiar-se por `steps.md`.
- Nome de pasta: `provas_sefaz_auditor_fiscal/[ANO] ÓRGÃO/` (sem acentos nos arquivos novos).
- Registrar no final da sessão: prova baixada, banca, nº de questões, o que foi excluído — e atualizar `historico.md`.
- Não gastar tokens com sites que exigem CAPTCHA/login: pedir ao usuário que baixe manualmente e diga o caminho.
