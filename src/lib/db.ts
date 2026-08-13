/**
 * Camada SQLite (@capacitor-community/sqlite).
 *
 * Nativo (Android/iOS): banco em arquivo no sandbox do app.
 * Navegador (vite dev): jeep-sqlite + WASM, persistido em IndexedDB. Nesse
 * caso é preciso chamar `saveToStore` após cada escrita, senão o banco só
 * existe em memória e some no reload — `commit()` abaixo cuida disso.
 *
 * O schema é versionado por `user_version`. `migrate()` roda no boot e aplica
 * apenas as migrações ainda pendentes, então abrir o app numa versão nova de
 * schema não apaga nem recria dados existentes.
 */
import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

const DB_NAME = "kumon_fiscal";
const SCHEMA_VERSION = 6;

const sqlite = new SQLiteConnection(CapacitorSQLite);
const isWeb = Capacitor.getPlatform() === "web";

let db: SQLiteDBConnection | null = null;
let booting: Promise<SQLiteDBConnection> | null = null;

/** Migrações idempotentes, indexadas pela versão que instalam. */
const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS blocos (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        ts              TEXT    NOT NULL,
        materia         TEXT    NOT NULL,
        topico          TEXT,
        tipo            TEXT    NOT NULL,
        formato         TEXT    NOT NULL,
        nivel           INTEGER NOT NULL,
        total_acertos   INTEGER NOT NULL DEFAULT 0,
        total_questoes  INTEGER NOT NULL DEFAULT 0,
        por_sub         TEXT    NOT NULL DEFAULT '[]',
        aprovado        INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS questoes_respondidas (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        bloco_id            INTEGER REFERENCES blocos(id) ON DELETE SET NULL,
        materia             TEXT    NOT NULL,
        sub                 TEXT    NOT NULL,
        carga_conceitual    INTEGER NOT NULL,
        formato             TEXT    NOT NULL,
        tipo_cobranca       TEXT,
        enunciado           TEXT    NOT NULL,
        alternativas        TEXT,
        gabarito            TEXT    NOT NULL,
        resposta            TEXT    NOT NULL,
        acertou             INTEGER NOT NULL,
        revisada            INTEGER NOT NULL DEFAULT 0,
        comentario          TEXT,
        explicacoes_erradas TEXT    NOT NULL DEFAULT '{}',
        conceitos           TEXT    NOT NULL DEFAULT '[]',
        dispositivo         TEXT,
        ts                  TEXT    NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conceitos_salvos (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        materia           TEXT    NOT NULL,
        termo             TEXT    NOT NULL,
        definicao         TEXT    NOT NULL DEFAULT '',
        questao_origem_id INTEGER REFERENCES questoes_respondidas(id) ON DELETE SET NULL,
        ts                TEXT    NOT NULL
      );

      -- Um termo só existe uma vez por matéria: é o que impede duplicar o
      -- conceito quando o usuário toca no mesmo chip em outra questão.
      CREATE UNIQUE INDEX IF NOT EXISTS ix_conceitos_materia_termo
        ON conceitos_salvos (materia, termo);

      -- Índices para as agregações da aba Dados e a lista de erradas.
      CREATE INDEX IF NOT EXISTS ix_qr_materia   ON questoes_respondidas (materia);
      CREATE INDEX IF NOT EXISTS ix_qr_acertou   ON questoes_respondidas (acertou);
      CREATE INDEX IF NOT EXISTS ix_qr_bloco     ON questoes_respondidas (bloco_id);
      CREATE INDEX IF NOT EXISTS ix_blocos_ts    ON blocos (ts);
      CREATE INDEX IF NOT EXISTS ix_blocos_mat   ON blocos (materia);
    `,
  },
  {
    // Notas deixam de ser "chip de conceito com nome único por matéria" e
    // passam a ser "título + corpo (texto selecionado) + tag", criadas pelo
    // usuário selecionando qualquer trecho da questão. `termo`/`definicao`
    // ficam como colunas mortas (não apagamos coluna em SQLite sem certeza da
    // versão do motor em todo aparelho Android já em campo); o app para de
    // lê-las. `topico` em questoes_respondidas guarda o tópico do bloco de
    // origem, necessário para calcular a tag também na revisão de erradas
    // (onde não há mais acesso à config do bloco).
    version: 2,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN topico TEXT;

      ALTER TABLE conceitos_salvos ADD COLUMN titulo TEXT NOT NULL DEFAULT '';
      ALTER TABLE conceitos_salvos ADD COLUMN corpo  TEXT NOT NULL DEFAULT '';
      ALTER TABLE conceitos_salvos ADD COLUMN tag    TEXT NOT NULL DEFAULT '';

      UPDATE conceitos_salvos SET titulo = termo, corpo = definicao WHERE titulo = '';

      DROP INDEX IF EXISTS ix_conceitos_materia_termo;
      CREATE INDEX IF NOT EXISTS ix_conceitos_materia ON conceitos_salvos (materia);
    `,
  },
  {
    // Reportar questão com erro: sinaliza que o ENUNCIADO/gabarito da questão
    // está errado (não que o usuário errou a resposta), para revisar depois o
    // que o modelo gerou mal. Independente de `acertou`/`revisada`, que
    // seguem descrevendo o desempenho do usuário.
    version: 3,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN reportada INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    // A carga conceitual (sub-blocos A–D) deixou de orientar a geração: o
    // usuário sentiu as questões parecidas demais entre sub-blocos, então a
    // dificuldade real que importa é `nivel` (Config.nivel), que até aqui só
    // vivia em `blocos`. Trazemos para `questoes_respondidas` para poder
    // filtrar/agregar acerto por nível na aba Dados e no header de Refazer.
    // `sub`/`carga_conceitual` continuam NOT NULL (mesma política de não
    // dropar coluna já adotada nas migrações anteriores) — novas linhas
    // gravam valores mortos ('' e 1) e o app para de lê-los.
    version: 4,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN nivel INTEGER;

      UPDATE questoes_respondidas
      SET nivel = (SELECT nivel FROM blocos WHERE blocos.id = questoes_respondidas.bloco_id)
      WHERE bloco_id IS NOT NULL;
    `,
  },
  {
    // Categoriza o motivo do report (ver ModalReport.tsx) em vez de um
    // reportada=1 genérico — orienta a curadoria do banco de questões
    // geradas por IA direto para a causa mais provável.
    version: 5,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN motivo_report TEXT;
    `,
  },
  {
    // Repetição espaçada (caixas de Leitner) em vez de um `revisada` binário:
    // `caixa_leitner` (1–5) e `proxima_revisao` (ISO, NULL = vencida agora)
    // decidem quando uma errada volta a aparecer em "Refazer erradas" — ver
    // registrarRevisao em repo.ts. Linhas já marcadas `revisada = 1` na versão
    // anterior viram caixa 2 sem data agendada: continuam fora da fila de
    // pendentes (mesmo comportamento de antes), só passam a evoluir de caixa
    // dali em diante.
    //
    // `banco_id` guarda o id da questão de origem em banco_questoes.json
    // quando o bloco veio do banco real (ver lib/banco.ts) — permite priorizar
    // questões inéditas do banco fixo em vez de sortear com reposição.
    version: 6,
    sql: `
      ALTER TABLE questoes_respondidas ADD COLUMN caixa_leitner INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE questoes_respondidas ADD COLUMN proxima_revisao TEXT;
      ALTER TABLE questoes_respondidas ADD COLUMN banco_id TEXT;

      UPDATE questoes_respondidas SET caixa_leitner = 2 WHERE revisada = 1;

      CREATE INDEX IF NOT EXISTS ix_qr_proxima_revisao ON questoes_respondidas (proxima_revisao);
      CREATE INDEX IF NOT EXISTS ix_qr_banco_id ON questoes_respondidas (banco_id);
    `,
  },
];

/** Elemento Stencil do jeep-sqlite, com o hook de hidratação que ele expõe. */
type JeepEl = HTMLElement & { componentOnReady?: () => Promise<unknown> };

async function initWeb(): Promise<void> {
  // Usamos o build standalone (`dist/components`), que se auto-registra, e NÃO
  // o `jeep-sqlite/loader`: sob Vite o loader lazy do Stencil registra o nome do
  // elemento mas não bootstrapa a instância — o componente nunca hidrata e
  // `initWebStore()` fica pendurado para sempre, sem lançar erro.
  if (!customElements.get("jeep-sqlite")) {
    const { defineCustomElement } = await import(
      "jeep-sqlite/dist/components/jeep-sqlite.js"
    );
    defineCustomElement();
  }

  let el = document.querySelector<JeepEl>("jeep-sqlite");
  if (!el) {
    el = document.createElement("jeep-sqlite") as JeepEl;
    document.body.appendChild(el);
  }

  // whenDefined só garante que a CLASSE existe. É componentOnReady que espera a
  // instância terminar de carregar — initWebStore depende disso.
  await customElements.whenDefined("jeep-sqlite");
  if (typeof el.componentOnReady === "function") await el.componentOnReady();

  await sqlite.initWebStore();
}

async function boot(): Promise<SQLiteDBConnection> {
  if (isWeb) await initWeb();

  // Uma conexão já registrada (hot reload no dev) precisa ser reaproveitada:
  // createConnection lançaria "connection already exists".
  const existe = (await sqlite.isConnection(DB_NAME, false)).result;
  const conn = existe
    ? await sqlite.retrieveConnection(DB_NAME, false)
    : await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);

  if (!(await conn.isDBOpen()).result) await conn.open();

  await conn.execute("PRAGMA foreign_keys = ON;");
  await migrate(conn);

  db = conn;
  return conn;
}

async function migrate(conn: SQLiteDBConnection): Promise<void> {
  const res = await conn.query("PRAGMA user_version;");
  const atual = Number(res.values?.[0]?.user_version ?? 0);
  if (atual >= SCHEMA_VERSION) return;

  for (const m of MIGRATIONS) {
    if (m.version <= atual) continue;
    await conn.execute(m.sql);
    // user_version não aceita parâmetro vinculado — daí a interpolação.
    // m.version vem de uma constante literal, não de entrada do usuário.
    await conn.execute(`PRAGMA user_version = ${m.version};`);
  }
  if (isWeb) await sqlite.saveToStore(DB_NAME);
}

/** Abre (uma única vez) e devolve a conexão. */
export function getDB(): Promise<SQLiteDBConnection> {
  if (db) return Promise.resolve(db);
  if (!booting) {
    booting = boot().catch((e) => {
      booting = null; // permite nova tentativa após falha
      throw e;
    });
  }
  return booting;
}

/** No navegador, persiste o banco em IndexedDB. No nativo, no-op. */
export async function commit(): Promise<void> {
  if (isWeb) await sqlite.saveToStore(DB_NAME);
}

/** SELECT. Devolve as linhas já tipadas pelo chamador. */
export async function all<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const conn = await getDB();
  const res = await conn.query(sql, params as never[]);
  return (res.values ?? []) as T[];
}

/** SELECT de uma linha (ou null). */
export async function one<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await all<T>(sql, params);
  return rows[0] ?? null;
}

/** INSERT/UPDATE/DELETE. Devolve o lastId quando houver. */
export async function run(
  sql: string,
  params: unknown[] = [],
): Promise<{ lastId: number; changes: number }> {
  const conn = await getDB();
  const res = await conn.run(sql, params as never[], false);
  await commit();
  return {
    lastId: Number(res.changes?.lastId ?? 0),
    changes: Number(res.changes?.changes ?? 0),
  };
}

/**
 * Backup completo do banco (schema + dados) como JSON, via a própria API do
 * plugin — evita reimplementar a serialização tabela a tabela. É a única
 * forma de recuperar blocos/respostas/notas depois de uma reinstalação ou
 * troca de aparelho: o resto do app só exporta notas (flashcards em CSV).
 */
export async function exportarBancoJSON(): Promise<string> {
  const conn = await getDB();
  const res = await conn.exportToJson("full");
  if (!res.export) throw new Error("Falha ao gerar o backup do banco.");
  return JSON.stringify(res.export);
}

/**
 * Restaura um backup gerado por exportarBancoJSON, substituindo os dados
 * atuais — o chamador deve confirmar com o usuário antes de invocar isto.
 *
 * O dump não carrega o PRAGMA user_version que `migrate()` usa para saber
 * quais migrações já rodaram; sem repor esse pragma depois do import, o
 * próximo boot rodaria de novo `ALTER TABLE ... ADD COLUMN` contra colunas
 * que o próprio dump já trouxe, e falharia com "duplicate column". Isso só é
 * seguro porque um backup só é restaurado de volta nesta mesma versão do
 * app — não é um formato pensado para migrar entre versões de schema.
 */
export async function importarBancoJSON(json: string): Promise<void> {
  const conn = await getDB();

  const valido = (await sqlite.isJsonValid(json)).result;
  if (!valido) throw new Error("Arquivo de backup inválido ou corrompido.");

  const dump = JSON.parse(json) as Record<string, unknown>;
  dump.database = DB_NAME;
  dump.overwrite = true;
  await sqlite.importFromJson(JSON.stringify(dump));

  await conn.execute(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  if (isWeb) await sqlite.saveToStore(DB_NAME);
}

/** Converte 0/1 do SQLite em boolean. */
export function toBool(v: unknown): boolean {
  return v === 1 || v === true || v === "1";
}

/** JSON.parse defensivo: uma coluna corrompida não deve derrubar a tela. */
export function parseJSON<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw !== "string") return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
