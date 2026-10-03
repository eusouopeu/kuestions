/**
 * Banca organizadora de cada prova do banco fixo. O JSON (banco/
 * kuestion_db_1.json) não tem esse campo — só `instituicao`/`ano` —, então o
 * mapa vive aqui, conferido na capa/rodapé dos PDFs originais
 * (banco/provas_sefaz_auditor_fiscal). Prova nova sem entrada aqui aparece
 * como "Banca não identificada" no cartão "Por banca" da aba Dados até ser
 * adicionada.
 */
import type { QuestaoBanco } from "./banco";

export const BANCA_DESCONHECIDA = "Banca não identificada";

const BANCA_POR_PROVA: Record<string, string> = {
  "SEFAZ-MA 2016": "FCC",
  "SMF-Cuiabá 2016": "FGV",
  "SEFAZ-GO 2018": "FCC",
  "SEFAZ-RS 2018": "Cebraspe",
  "SEFAZ-SC 2018": "FCC",
  "SEFAZ-BA 2019": "FCC",
  "SEFAZ-AL 2020": "Cebraspe",
  "SEFAZ-AL 2021": "Cebraspe",
  "SEFAZ-DF 2020": "Cebraspe",
  "SEFAZ-CE 2021": "Cebraspe",
  "SEFAZ-ES 2021": "FGV",
  "SEFAZ-AM 2022": "FGV",
  "SEFAZ-AP 2022": "FCC",
  "SEFAZ-BA 2022": "FGV",
  "SEFAZ-ES 2022": "FGV",
  "SEFAZ-MG 2022": "FGV",
  "ISS-RJ 2023": "FGV",
  "RFB 2023": "FGV",
  "SEFAZ-MT 2023": "FGV",
  "SEMEF-Nova Iguaçu 2024": "FGV",
  "SJC-São José dos Campos 2024": "FGV",
  "SMF-Cuiabá 2024": "FGV",
  "TCE-GO 2024": "FGV",
  "TCE-PA 2024": "FGV",
  "TCE-PI 2024": "FGV",
  "SEFAZ-PI 2025": "FCC",
  "SEFAZ-PR 2025": "FGV",
  "SEFAZ-RJ 2025": "Cebraspe",
  "SEFAZ-SE 2025": "Cebraspe",
  "SEFAZ-SP 2026": "FCC",
  "TCE-SC 2026": "FGV",
  // SEFAZ-PA 2021: capa sem a banca impressa — fica não identificada.
};

export function bancaDe(q: Pick<QuestaoBanco, "instituicao" | "ano">): string {
  return BANCA_POR_PROVA[`${q.instituicao} ${q.ano}`] ?? BANCA_DESCONHECIDA;
}
