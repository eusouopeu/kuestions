import { describe, expect, it } from "vitest";
import { areasBanco, garantirBanco } from "./banco";

describe("areasBanco (matérias não-core ocultas, feature auditor fiscal estadual)", () => {
  it("nunca lista matérias fora do núcleo de auditor fiscal estadual", async () => {
    await garantirBanco();
    const ocultas = [
      "Administração Pública",
      "Administração Geral e Pública",
      "Direito Civil e Empresarial",
      "Direito Previdenciário",
      "Língua Inglesa",
    ];
    for (const a of ocultas) expect(areasBanco()).not.toContain(a);
  });

  it("mantém as matérias centrais visíveis", async () => {
    await garantirBanco();
    for (const a of ["Direito Tributário", "Auditoria", "Contabilidade Geral"]) {
      expect(areasBanco()).toContain(a);
    }
  });
});
