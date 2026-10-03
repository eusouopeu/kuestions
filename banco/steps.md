# Steps — como crescer o banco com questões reais de concursos fiscais

Objetivo: mais questões **recentes** (2023–2026), de bancas e matérias parecidas com **Auditor Fiscal de SEFAZ** (Dir. Tributário, Contab. Geral/Pública, Auditoria, Economia, Finanças Públicas, Dir. Const./Adm., Estatística, Informática/BI, Mat. Financeira, LP/RL).
Base: 3168 questões / 53 provas (ver `historico.md`). Método: `instrucoes/`.

> Situação das pesquisas em 2026-09-30 (WebSearch; confirmar antes de agir). Fontes: [Estratégia – SEFAZ-GO](https://www.estrategiaconcursos.com.br/blog/concurso-sefaz-go/), [Estratégia – SEFAZ-CE](https://www.estrategiaconcursos.com.br/blog/concurso-sefaz-ce/), [Magistra – concursos fiscais](https://magistrarcursos.com.br/blog/concursos-fiscais/), [7Fontes – SEFAZ-AL 2026](https://7fontesconcursos.com.br/blog/edital-sefaz-al-2026), [Gran – SEFAZ-BA](https://blog.grancursosonline.com.br/concurso-sefaz-ba/), [Nova – SEFAZ-SC](https://www.novaconcursos.com.br/portal/concursos/concurso-sefaz-sc/).

## Prioridade 1 — provas recentes já realizadas (ainda não no banco)

| # | Concurso | Banca | Prova | Por quê |
|---|---|---|---|---|
| 1 | **SEFAZ-CE 2026** Auditor Fiscal (FCC `sface125`) — cadernos só no Portal do Candidato (login + captcha): pedir PDF ao usuário | FCC | 1–2/08/2026 | Mais recente; FCC = mesmo estilo de SP 2026/PI 2025 já no banco |
| 2 | **SEFAZ-GO 2026** Auditor-Fiscal (FCC `seego125`) — idem, exige login | FCC | 17/05/2026 | Bom edital (R$ 32 mil), matérias clássicas; GO 2018 já no banco (comparação) |
| 3 | **SEFAZ-SP 2026** — completar | FCC | 28/02–01/03/2026 | Banco tem só 112 q de SP 2026 (P1/P2/P3 parciais); conferir se faltam questões em vez de só re-extrair |
| 4 | **SEFAZ-RJ 2025** — completar | Cebraspe/? | 3–4/05/2025 | Só 96 q; verificar se foram excluídas muitas (legislação) ou se faltou prova |
| 5 | **SEFAZ-SE 2025** — completar | ? | 28/09/2025 | Só 38 q no banco |

## Prioridade 2 — 2023–2025 de bancas/matérias-alvo (buscar PDF)

Conferir cada item por busca; vários já podem não existir ou já estar no banco sob outro nome.
- SEFAZ-MG (nova edição pós-2022), SEFAZ-RS 2025/2026 (banca em definição), SEFAZ-PE, SEFAZ-PB, SEFAZ-RN, SEFAZ-TO, SEFAZ-MS, SEFAZ-RO, SEFAZ-AC, SEFAZ-RR — "Auditor Fiscal/AFTE" 2023–2025.
- SEFAZ-AL 2025/2026 e SEFAZ-CE 2021→2026 (Cebraspe C/E): reforça o formato C/E, hoje 466 q.
- Municipais fortes: ISS-SP (Auditor-Fiscal Tributário Municipal), SMF-Fortaleza/SEFIN-Fortaleza, SEFIN-Recife, SMF-Salvador, SMF-Belo Horizonte, SEMEF-Manaus, SMF-Goiânia, SMF-Porto Alegre, ISS-RJ novas edições.
- ✅ 2026-10-03: TCE-SC 2026, TCE-PA 2024, TCE-GO 2024 (FGV) incorporados. Outros TCs FGV com PDF aberto em `conhecimento.fgv.br`: `tceba23`, `tcesp23`, `tcerj`, `tce-se`, `tcerr24`, `tcees22`, `tceto22`, `tcepe`; TCE-PA 2024 Administrativa/Contabilidade (`cns104`); TCE-SC 2026 Economia (`cns005`, só a parte específica é nova).
- Federal/controle com matéria parecida: Receita Federal (AFRFB/Analista 2024–2025 — CNU blocos), TCE/TCM (Auditor de Controle Externo) 2023–2025: bons para Auditoria, Contab. Pública, Finanças Públicas.
- Nível "Agente/Técnico de Tributos" só quando Auditor não estiver disponível (já há PI AG e BA AG).

## Prioridade 3 — provas futuras (monitorar; ainda sem prova)

- **SEFAZ-SC 2026** (FCC, prova prevista 22/11/2026) · **SEFAZ-AL 2026** (Cebraspe, objetiva 20/12/2026) · **SEFAZ-BA 2026** (Cesgranrio, edital previsto até out/2026). Reavaliar em dez/2026–jan/2027; baixar prova + gabarito definitivo logo após a aplicação.

## Preencher lacunas de matéria (balanço atual)

Menos representadas frente ao peso em SEFAZ: Contab. Pública (107), Mat. Financeira (60), Finanças Públicas (106), Estatística (125), Direito Civil/Empresarial (99), Economia (167). Ao escolher entre provas, **preferir as que trazem estas áreas**: concursos com Contab. Pública/MCASP/NBC TSP (PI, ES, TCE, AM, SP), Mat. Financeira (AL, CE, SP, PA), Direito Empresarial/Civil (RJ, PR, MG).
Metas sugeridas: Contab. Pública ≥ 200, Mat. Financeira ≥ 120, Finanças Públicas ≥ 180.

## Procedimento por prova (resumo)

1. Conferir `historico.md` (já existe?) → 2. buscar PDF (`01`) → 3. extrair (`02`) → 4. classificar + merge (`03`) → 5. commit por prova + atualizar `historico.md` e este arquivo.

## Melhorias de processo a considerar

- Automatizar o classificador por faixa + palavras-chave (`03`) em um `classificar.py` reutilizável: hoje cada prova tem um `build_XX.py` com dict manual (caro em tokens).
- Script `dedupe.py` para detectar questões repetidas entre provas (primeiros 80 caracteres normalizados).
- Preencher `incidencia` (Bronze→Diamante) para as 1798 questões sem tier, pela frequência do `assunto` no banco.
- Adicionar campo `banca` ao schema (hoje ausente) — exige migração única; decidir com o usuário.
