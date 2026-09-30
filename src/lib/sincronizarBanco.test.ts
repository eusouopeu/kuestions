import { describe, expect, it } from "vitest";
import type { QuestaoBanco } from "./banco";
import { hashConteudo, planejarSincronizacao, type LinhaSync } from "./sincronizarBanco";

const BANCO: QuestaoBanco = {
  id: "SEFAZ-X-2025-Q001",
  instituicao: "SEFAZ-X",
  ano: 2025,
  cargo: "Auditor",
  area: "Direito Tributário",
  assunto: "Imunidades",
  numero_original: 1,
  enunciado: "Enunciado corrigido no banco",
  alternativas: { A: "um", B: "dois" },
  gabarito: "B",
};
const buscar = (id: string) => (id === BANCO.id ? BANCO : null);

function linha(extra: Partial<LinhaSync>): LinhaSync {
  return {
    id: 7,
    banco_id: BANCO.id,
    enunciado: "Enunciado antigo",
    alternativas: JSON.stringify(["A) um", "B) dois"]),
    gabarito: "A",
    enunciado_editado: 0,
    banco_hash: null,
    ...extra,
  };
}

describe("planejarSincronizacao", () => {
  it("atualiza só conteúdo (enunciado/alternativas/gabarito) — nunca campos de desempenho", () => {
    const [u] = planejarSincronizacao([linha({})], buscar);
    expect(u.id).toBe(7);
    expect(u.enunciado).toBe("Enunciado corrigido no banco");
    expect(u.gabarito).toBe("B");
    expect(u.limparCacheExplicacao).toBe(true);
    // O plano só carrega essas chaves: acertou, resposta, caixa_leitner,
    // proxima_revisao, facilidade, tempo_ms, ts etc. ficam fora por construção.
    expect(Object.keys(u).sort()).toEqual(
      ["alternativas", "banco_hash", "banco_id", "enunciado", "enunciado_editado", "gabarito", "id", "limparCacheExplicacao"].sort(),
    );
  });

  it("preserva enunciado corrigido pelo usuário (lápis), inclusive em linha antiga sem marcação", () => {
    const [marcada] = planejarSincronizacao([linha({ enunciado: "Minha correção", enunciado_editado: 1 })], buscar);
    expect(marcada.enunciado).toBe("Minha correção");
    // Linha anterior à migração (flag NULL) com texto divergente: na dúvida, é do usuário.
    const [antiga] = planejarSincronizacao([linha({ enunciado: "Minha correção", enunciado_editado: null })], buscar);
    expect(antiga.enunciado).toBe("Minha correção");
    expect(antiga.enunciado_editado).toBe(1);
    expect(antiga.gabarito).toBe("B");
    // ...mas diferença só de espaços/quebras (formatação refeita no banco) não é correção do usuário.
    const [formato] = planejarSincronizacao(
      [linha({ enunciado: "Enunciado corrigido\nno banco", enunciado_editado: null })],
      buscar,
    );
    expect(formato.enunciado).toBe("Enunciado corrigido no banco");
    expect(formato.enunciado_editado).toBe(0);
  });

  it("não gera nada para linha já sincronizada ou questão que saiu do banco", () => {
    const h = hashConteudo("Enunciado corrigido no banco", JSON.stringify(["A) um", "B) dois"]), "B");
    expect(planejarSincronizacao([linha({ banco_hash: h })], buscar)).toEqual([]);
    expect(planejarSincronizacao([linha({ banco_id: "SUMIU" })], buscar)).toEqual([]);
  });
});
