import { describe, expect, it } from "vitest";
import initSqlJs, { type SqlJsDatabase } from "sql.js";
import { MIGRATIONS } from "./migrations";

/**
 * As migrações são o único código do app capaz de destruir meses de
 * histórico (um `ALTER TABLE` errado no boot inutiliza o banco de quem já
 * tem o app instalado) e eram justamente o que nenhum teste cobria. Aqui
 * elas rodam de verdade, contra o SQLite do sql.js — a mesma engine que o
 * app usa no navegador e a mesma linguagem SQL do plugin nativo.
 */
async function novoBanco() {
  const SQL = await initSqlJs();
  return new SQL.Database();
}

/** Aplica as migrações até `ate` (inclusive), como faz migrate() em db.ts. */
function aplicar(db: SqlJsDatabase, de: number, ate: number) {
  for (const m of MIGRATIONS) {
    if (m.version <= de || m.version > ate) continue;
    db.exec(m.sql);
    db.exec(`PRAGMA user_version = ${m.version};`);
  }
}

const ULTIMA = Math.max(...MIGRATIONS.map((m) => m.version));

function colunas(db: SqlJsDatabase, tabela: string): string[] {
  const res = db.exec(`PRAGMA table_info(${tabela});`);
  return res.length ? res[0].values.map((v: unknown[]) => String(v[1])) : [];
}

describe("MIGRATIONS", () => {
  it("tem versões únicas, em ordem e sem buracos", () => {
    const versoes = MIGRATIONS.map((m) => m.version);
    expect(versoes).toEqual([...versoes].sort((a, b) => a - b));
    expect(new Set(versoes).size).toBe(versoes.length);
    expect(versoes).toEqual(Array.from({ length: ULTIMA }, (_, i) => i + 1));
  });

  it("cria o schema inteiro do zero e marca a user_version", async () => {
    const db = await novoBanco();
    aplicar(db, 0, ULTIMA);

    const tabelas = db
      .exec("SELECT name FROM sqlite_master WHERE type = 'table'")[0]
      .values.map((v: unknown[]) => String(v[0]));
    expect(tabelas).toEqual(
      expect.arrayContaining(["blocos", "questoes_respondidas", "conceitos_salvos", "explicacoes_banco", "uso_api"]),
    );

    // Colunas que o app lê e que só existem por causa de migrações tardias.
    expect(colunas(db, "questoes_respondidas")).toEqual(
      expect.arrayContaining(["topico", "nivel", "reportada", "motivo_report", "caixa_leitner", "proxima_revisao", "banco_id", "tempo_ms", "confianca"]),
    );
    expect(colunas(db, "conceitos_salvos")).toEqual(
      expect.arrayContaining(["corpo", "tags", "caixa_leitner", "proxima_revisao"]),
    );
    expect(colunas(db, "uso_api")).toEqual(
      expect.arrayContaining(["ts", "modelo", "origem", "tokens_entrada", "tokens_saida", "cache_escrita", "cache_leitura", "custo_usd"]),
    );

    expect(db.exec("PRAGMA user_version")[0].values[0][0]).toBe(ULTIMA);
    db.close();
  });

  it("preserva os dados de um banco antigo ao migrar até a última versão", async () => {
    const db = await novoBanco();
    aplicar(db, 0, 1);
    db.run(
      `INSERT INTO blocos (ts, materia, topico, tipo, formato, nivel, total_acertos, total_questoes, por_sub, aprovado)
       VALUES ('2026-01-01T00:00:00.000Z', 'Direito Tributário', 'imunidades', 'abstrato', 'ce', 3, 11, 12, '[3,3,3,2]', 1)`,
    );
    db.run(
      `INSERT INTO questoes_respondidas
         (bloco_id, materia, sub, carga_conceitual, formato, enunciado, alternativas, gabarito, resposta, acertou, revisada, comentario, explicacoes_erradas, conceitos, dispositivo, ts)
       VALUES (1, 'Direito Tributário', 'A', 1, 'ce', 'enunciado antigo', NULL, 'C', 'E', 0, 1, '', '{}', '["imunidade"]', NULL, '2026-01-01T00:00:00.000Z')`,
    );

    aplicar(db, 1, ULTIMA);

    const q = db.exec("SELECT enunciado, caixa_leitner, confianca, tempo_ms FROM questoes_respondidas")[0];
    expect(String(q.values[0][0])).toBe("enunciado antigo");
    // v6: quem já estava marcado como revisado vira caixa 2, não caixa 1.
    expect(q.values[0][1]).toBe(2);
    expect(q.values[0][2]).toBeNull();
    expect(q.values[0][3]).toBeNull();
    expect(db.exec("SELECT COUNT(*) FROM blocos")[0].values[0][0]).toBe(1);
    db.close();
  });

  it("renomeia Administração Financeira e Orçamentária até Finanças Públicas, passando por AFO (v11 + v14 encadeadas)", async () => {
    const db = await novoBanco();
    aplicar(db, 0, 10);
    db.run(
      `INSERT INTO blocos (ts, materia, topico, tipo, formato, nivel, total_acertos, total_questoes, por_sub, aprovado)
       VALUES ('2026-01-01T00:00:00.000Z', 'Administração Financeira e Orçamentária', NULL, 'abstrato', 'ce', 3, 9, 12, '[]', 0),
              ('2026-01-02T00:00:00.000Z', 'Direito Tributário', NULL, 'abstrato', 'ce', 3, 9, 12, '[]', 0)`,
    );

    // Um banco bem antigo passa pelas duas migrações em sequência: v11 dá o
    // nome curto "AFO", v14 dá o nome final "Finanças Públicas" — nenhuma
    // delas conhece a outra, e o encadeamento é o que garante que o dado
    // chegue correto independentemente de quantas versões atrás ele começou.
    aplicar(db, 10, ULTIMA);

    const materias = db
      .exec("SELECT materia FROM blocos ORDER BY ts")[0]
      .values.map((v: unknown[]) => String(v[0]));
    expect(materias).toEqual(["Finanças Públicas", "Direito Tributário"]);
    db.close();
  });

  it("renomeia AFO para Finanças Públicas no histórico já gravado (v14)", async () => {
    const db = await novoBanco();
    aplicar(db, 0, 13);
    db.run(
      `INSERT INTO blocos (ts, materia, topico, tipo, formato, nivel, total_acertos, total_questoes, por_sub, aprovado)
       VALUES ('2026-01-01T00:00:00.000Z', 'AFO', NULL, 'abstrato', 'ce', 3, 9, 12, '[]', 0),
              ('2026-01-02T00:00:00.000Z', 'Direito Tributário', NULL, 'abstrato', 'ce', 3, 9, 12, '[]', 0)`,
    );

    aplicar(db, 13, ULTIMA);

    const materias = db
      .exec("SELECT materia FROM blocos ORDER BY ts")[0]
      .values.map((v: unknown[]) => String(v[0]));
    expect(materias).toEqual(["Finanças Públicas", "Direito Tributário"]);
    db.close();
  });

  it("migra a tag única de uma nota para o array de tags (v9)", async () => {
    const db = await novoBanco();
    aplicar(db, 0, 8);
    db.run(
      // `termo`/`definicao` são as colunas mortas do fluxo antigo de chip de
      // conceito — continuam NOT NULL no schema (sem DROP COLUMN), então todo
      // INSERT ainda precisa preenchê-las.
      `INSERT INTO conceitos_salvos (materia, termo, definicao, titulo, corpo, tag, ts)
       VALUES ('Direito Tributário', '', '', 'Imunidade', 'texto da nota', 'imunidade-reciproca', '2026-01-01T00:00:00.000Z')`,
    );

    aplicar(db, 8, ULTIMA);

    const tags = String(db.exec("SELECT tags FROM conceitos_salvos")[0].values[0][0]);
    expect(JSON.parse(tags)).toEqual(["imunidade-reciproca"]);
    db.close();
  });

  it("agenda a primeira revisão das acertadas já gravadas (v13)", async () => {
    const db = await novoBanco();
    aplicar(db, 0, 12);
    db.run(
      `INSERT INTO questoes_respondidas
         (bloco_id, materia, sub, carga_conceitual, formato, enunciado, gabarito, resposta,
          acertou, revisada, comentario, explicacoes_erradas, conceitos, ts)
       VALUES
         (NULL, 'Direito Tributário', '', 1, 'ce', 'certa',  'C', 'C', 1, 0, '', '{}', '[]', '2026-01-01T10:00:00.000Z'),
         (NULL, 'Direito Tributário', '', 1, 'ce', 'errada', 'C', 'E', 0, 0, '', '{}', '[]', '2026-01-01T10:00:00.000Z'),
         (NULL, 'Direito Tributário', '', 1, 'ce', 'vazia',  'C', '',  0, 0, '', '{}', '[]', '2026-01-01T10:00:00.000Z')`,
    );

    aplicar(db, 12, ULTIMA);

    const linhas = db.exec(
      "SELECT enunciado, revisada, caixa_leitner, proxima_revisao FROM questoes_respondidas ORDER BY enunciado",
    )[0].values;
    // Acertada: caixa 2, com revisão marcada 3 dias depois da resposta e no
    // MESMO formato de toISOString() (a comparação de datas é lexicográfica).
    expect(linhas[0]).toEqual(["certa", 1, 2, "2026-01-04T10:00:00.000Z"]);
    // Errada e não respondida continuam vencidas agora (caixa 1, sem data).
    expect(linhas[1]).toEqual(["errada", 0, 1, null]);
    expect(linhas[2]).toEqual(["vazia", 0, 1, null]);
    db.close();
  });
});
