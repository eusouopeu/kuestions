# Histórico de provas importadas

Estado em **2026-09-30** — `kuestion_db_1.json`: **2938 questões**, 50 blocos de prova, 25 instituições, anos 2016–2026.
Um commit por prova (ver `git log`). Fonte dos PDFs: `provas_sefaz_auditor_fiscal/` (fora do git). Scripts de build: `provas_sefaz_auditor_fiscal/_scripts/` (fora do git).

Formato: **A–E** = múltipla escolha; **C/E** = Certo/Errado (Cebraspe; alternativas `{C, E}`).
Coluna "Qtd" = questões **no banco**, após excluir legislação estadual específica, anuladas e questões dependentes de imagem.

## Provas importadas (ordem cronológica)

| Ano | Instituição | id (prefixo) | Cargo | Fmt | Qtd |
|---|---|---|---|---|---|
| 2016 | SEFAZ-MA | `SEFAZ-MA-2016` | Auditor Fiscal da Receita Estadual - Adm | A–E | 60 |
| 2016 | SMF-Cuiabá | `SMF-Cuiabá-2016-P1` | Auditor Fiscal Tributário da Receita Mun | A–E | 70 |
| 2016 | SMF-Cuiabá | `SMF-Cuiabá-2016-P2` | idem | A–E | 49 |
| 2018 | SEFAZ-GO | `SEFAZ-GO-2018` | Auditor-Fiscal da Receita Estadual - Classe A | A–E | 64 |
| 2018 | SEFAZ-RS | `SEFAZ-RS-2018` | Auditor-Fiscal da Receita Estadual, Classe A | A–E | 83 |
| 2018 | SEFAZ-SC | `SEFAZ-SC-2018`, `-A01`, `-A01-P1`, `-A01-P2` | Auditor-Fiscal da Receita Estadual – Nível I | A–E | 21+39+98+40 |
| 2019 | SEFAZ-BA | `SEFAZ-BA-2019-C03`, `-C03G` | Auditor Fiscal - Administração Tributária | A–E | 30+56 |
| 2020 | SEFAZ-AL | `SEFAZ-AL-2020` | Auditor Fiscal da Receita Estadual | C/E | 97 |
| 2020 | SEFAZ-DF | `SEFAZ-DF-2020` | Auditor-Fiscal da Receita do DF | C/E | 110 |
| 2021 | SEFAZ-AL | `SEFAZ-AL-2021` | Auditor de Finanças e Controle de Arrecadação | C/E | 135 |
| 2021 | SEFAZ-CE | `SEFAZ-CE-2021` | Auditor Fiscal da Receita Estadual | C/E | 124 |
| 2021 | SEFAZ-ES | `SEFAZ-ES-2021`, `-T1` | Auditor Fiscal da Receita Estadual | A–E | 25+10 |
| 2021 | SEFAZ-PA | `SEFAZ-PA-2021` | Auditor Fiscal de Receitas Estaduais | A–E | 91 |
| 2022 | SEFAZ-AM | `SEFAZ-AM-2022-P1`, `-P2` | Auditor Fiscal de Tributos Estaduais | A–E | 69+56 |
| 2022 | SEFAZ-AP | `SEFAZ-AP-2022` | Auditor da Receita Estadual | A–E | 71 |
| 2022 | SEFAZ-BA | `SEFAZ-BA-2022` (FGV) | Agente de Tributos Estaduais | A–E | 48 |
| 2022 | SEFAZ-ES | `SEFAZ-ES-2022-M`, `-TC`, `-TE` (FGV) | Consultor do Tesouro Estadual | A–E | 75+40+39 |
| 2022 | SEFAZ-MG | `SEFAZ-MG-2022` | Auditor Fiscal da Receita Estadual | A–E | 75 |
| 2023 | ISS-RJ | `ISS-RJ-2023-P1`, `-P2` | Fiscal de Rendas | A–E | 76+59 |
| 2023 | RFB | `RFB-2023` | Analista-Tributário | A–E | 70 |
| 2023 | SEFAZ-MT | `SEFAZ-MT-2023-P1`, `-P2` | Fiscal de Tributos Estaduais | A–E | 65+38 |
| 2024 | SEMEF-Nova Iguaçu | `SEMEF-Nova Iguaçu-2024-P1` | Auditor Fiscal do Tesouro Municipal | A–E | 81 |
| 2024 | SJC | `SJC-2024` (FGV) | Auditor Tributário Municipal | A–E | 64 |
| 2024 | SMF-Cuiabá | `SMF-Cuiabá-2024-P1`, `-P2` | Auditor Fiscal Tributário da Receita Municipal | A–E | 67+58 |
| 2024 | TCE-PI | `TCE-PI-2024` | Auditor de Controle Externo | A–E | 90 |
| 2025 | SEFAZ-PI | `SEFAZ-PI-2025-P1`, `-P2` (FCC) | Auditor Fiscal da Fazenda Estadual | A–E | 62+55 |
| 2025 | SEFAZ-PI | `SEFAZ-PI-2025-AG-P1`, `-AG-P2` (FCC) | Agente de Tributos da Fazenda Estadual | A–E | 62+55 |
| 2025 | SEFAZ-PR | `SEFAZ-PR-2025-P1`, `-P2` (FGV) | Auditor Fiscal da Receita Estadual | A–E | 66+49 |
| 2025 | SEFAZ-RJ | `SEFAZ-RJ-2025-CE1`, `-CE2`, `-Geral` | Auditor Fiscal da Receita Estadual | A–E | 33+36+27 |
| 2025 | SEFAZ-SE | `SEFAZ-SE-2025`, `-Trib` | Auditor Fiscal Tributário | A–E | 20+18 |
| 2026 | SEFAZ-SP | `SEFAZ-SP-2026-P1`, `-P2`, `-P3` (FCC) | Auditor Fiscal – Gestão Tributária | A–E | 25+37+50 |

(Banca indicada só onde registrada nos commits/scripts; as demais não foram anotadas.)

## Totais

- Por ano: 2016: 179 · 2018: 345 · 2019: 86 · 2020: 207 · 2021: 385 · 2022: 473 · 2023: 308 · 2024: 360 · 2025: 483 · 2026: 112
- Formato: 2472 A–E · 466 C/E
- Por instituição (top): SMF-Cuiabá 244 · SEFAZ-PI 234 · SEFAZ-AL 232 · SEFAZ-SC 198 · SEFAZ-ES 189 · ISS-RJ 135 · SEFAZ-BA 134 · SEFAZ-AM 125 · SEFAZ-CE 124 · SEFAZ-PR 115 · SEFAZ-SP 112 · SEFAZ-DF 110
- Por área (top): Dir. Tributário 483 · Contab. Geral 447 · Informática 296 · Dir. Constitucional 251 · Dir. Administrativo 227 · Auditoria 225 · Português 191 · Economia 167 · Estatística 122 · Mat./RL 106 · Civil/Empresarial 95 · Finanças Públicas 89 · Contab. Pública 81 · Mat. Financeira 58

## Linha do tempo de commits

| Data | Lote |
|---|---|
| 2026-09-10 | Baseline (1660 q) e +434: SEFAZ-AM 2022, SEFAZ-MT 2023, SMF-Cuiabá 2024, SEMEF-Nova Iguaçu 2024 |
| 2026-09-11 | Padroniza `bloco`; SEFAZ-PR 2025 (+115), SEFAZ-BA 2022 (+48), SJC 2024 (+64), SMF-Cuiabá 2016 (+119) |
| 2026-09-13 | SEFAZ-ES 2022 (+154), SEFAZ-PI 2025 AFFE (+117), SEFAZ-DF 2020 (+110), SEFAZ-PI 2025 Agente (+117) |

## Lacunas conhecidas

- **Sem prova em disco/indisponível:** SEFIN-RO 2018 (`netstorage.fgv.br` morto).
- **Campo `bloco` vazio/ausente** em 353+163 questões (Português, Mat/RL, Civil, Penal, Inglês, Adm. Pública, e provas antigas). Não é erro: essas áreas não têm plano de estudo.
- **`incidencia`** vazia em 1798 questões (todas as incorporadas em 09/2026 — nunca foi recalculada; os tiers Bronze→Diamante vêm de lotes antigos).
- Legislação estadual específica (ICMS/IPVA/ITCMD/PAF locais, leis orgânicas) é **excluída de propósito**.
- Sem registro de banca por prova no schema do banco (só `instituicao`).
