/**
 * Exportação de notas para .apkg — o formato de import nativo do Anki, em
 * vez do CSV que hoje exige duas importações manuais (uma para Cloze, outra
 * para Básico) e configurar o mapeamento de coluna toda vez. Um .apkg é só
 * um .zip (ver lib/zip.ts) com um banco SQLite no formato de coleção do Anki
 * (schema legado, versão 11 — o mais compatível) dentro; nenhuma chamada de
 * IA envolvida, é montagem determinística de arquivo.
 *
 * Monta o banco com sql.js (já uma dependência do projeto, via jeep-sqlite)
 * direto em memória — independente da conexão SQLite nativa do app (ver
 * lib/db.ts) — e exporta os bytes. Funciona em qualquer plataforma porque
 * roda dentro da WebView (Android/iOS/desktop Tauri) ou do navegador, ambos
 * com suporte a WebAssembly.
 *
 * ATENÇÃO: o schema abaixo foi escrito de memória a partir do formato legado
 * do Anki (bem documentado, usado por ferramentas como genanki) — não há
 * como testar contra uma instalação real do Anki neste ambiente. Vale
 * confirmar manualmente que o primeiro .apkg gerado importa sem erro antes
 * de confiar no recurso no dia a dia.
 */
import * as sqlJsModule from "sql.js";
import type { SqlJsDatabase } from "sql.js";
import { paraFlashcard } from "./flashcards";
import { criarZip } from "./zip";

// sql.js é CommonJS (`module.exports = initSqlJs`) — o interop pro default
// export varia entre o pre-bundle do dev server e o build de produção (já
// vimos os dois se comportarem diferente); pegar na mão cobre os dois casos.
const initSqlJs = ((sqlJsModule as { default?: unknown }).default ?? sqlJsModule) as typeof import("sql.js").default;

const SEPARADOR_CAMPO = "\x1f";

const MID_BASICO = 1;
const MID_CLOZE = 2;
const DID_DECK = 2; // "1" é sempre o Default; o deck do export usa o próximo id.
const CONF_ID = 1;

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;
function carregarSqlJs() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({ locateFile: (file) => `/assets/${file}` });
  }
  return sqlPromise;
}

async function sha1Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-1", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Checksum do campo-ordenação — mesma fórmula do Anki (8 primeiros dígitos
 * hex do SHA-1, como inteiro), usada para detectar duplicatas ao importar. */
async function checksumCampo(sfld: string): Promise<number> {
  const hex = await sha1Hex(sfld);
  return parseInt(hex.slice(0, 8), 16);
}

/** Texto puro, sem marcação, para não deixar `<...>` estragando a
 * exibição/ordenação — o corpo da nota vira HTML dentro do campo do Anki
 * (quebras de linha viram `<br>`), então tags soltas de outro tipo não
 * deveriam sobrar, mas o guard é barato. */
function paraCampoHTML(texto: string): string {
  return texto.replace(/\r?\n/g, "<br>");
}

/** Ordinais de cloze presentes no texto (0 para c1, 1 para c2, …) — cada um
 * vira um cartão. Cobre só c1/c2, que é o que o marca-texto do app produz. */
function ordinaisCloze(texto: string): number[] {
  const nums = new Set<number>();
  for (const m of texto.matchAll(/\{\{c(\d+)::/g)) nums.add(Number(m[1]) - 1);
  return nums.size ? [...nums].sort((a, b) => a - b) : [0];
}

function guidAleatorio(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((b) => b.toString(36))
    .join("")
    .slice(0, 10);
}

function jsonModeloBasico(agora: number): unknown {
  return {
    id: MID_BASICO,
    name: "Básico (Kuestions)",
    type: 0,
    mod: agora,
    usn: -1,
    sortf: 0,
    did: DID_DECK,
    tmpls: [
      { name: "Cartão 1", ord: 0, qfmt: "{{Frente}}", afmt: "{{FrontSide}}<hr id=answer>{{Verso}}", did: null, bqfmt: "", bafmt: "", bfont: "", bsize: 0 },
    ],
    flds: [
      { name: "Frente", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
      { name: "Verso", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
    ],
    css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }",
    latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
    latexPost: "\\end{document}",
    latexsvg: false,
    req: [[0, "any", [0]]],
    tags: [],
    vers: [],
  };
}

function jsonModeloCloze(agora: number): unknown {
  return {
    id: MID_CLOZE,
    name: "Cloze (Kuestions)",
    type: 1,
    mod: agora,
    usn: -1,
    sortf: 0,
    did: DID_DECK,
    tmpls: [
      { name: "Cloze", ord: 0, qfmt: "{{cloze:Texto}}", afmt: "{{cloze:Texto}}<br>{{Extra}}", did: null, bqfmt: "", bafmt: "", bfont: "", bsize: 0 },
    ],
    flds: [
      { name: "Texto", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
      { name: "Extra", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
    ],
    css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; } .cloze { font-weight: bold; color: blue; }",
    latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
    latexPost: "\\end{document}",
    latexsvg: false,
    req: [[0, "all", [0]]],
    tags: [],
    vers: [],
  };
}

const SCHEMA_SQL = `
CREATE TABLE col (
  id integer primary key,
  crt integer not null,
  mod integer not null,
  scm integer not null,
  ver integer not null,
  dty integer not null,
  usn integer not null,
  ls integer not null,
  conf text not null,
  models text not null,
  decks text not null,
  dconf text not null,
  tags text not null
);
CREATE TABLE notes (
  id integer primary key,
  guid text not null,
  mid integer not null,
  mod integer not null,
  usn integer not null,
  tags text not null,
  flds text not null,
  sfld text not null,
  csum integer not null,
  flags integer not null,
  data text not null
);
CREATE TABLE cards (
  id integer primary key,
  nid integer not null,
  did integer not null,
  ord integer not null,
  mod integer not null,
  usn integer not null,
  type integer not null,
  queue integer not null,
  due integer not null,
  ivl integer not null,
  factor integer not null,
  reps integer not null,
  lapses integer not null,
  left integer not null,
  odue integer not null,
  odid integer not null,
  flags integer not null,
  data text not null
);
CREATE TABLE revlog (
  id integer primary key,
  cid integer not null,
  usn integer not null,
  ease integer not null,
  ivl integer not null,
  lastIvl integer not null,
  factor integer not null,
  time integer not null,
  type integer not null
);
CREATE TABLE graves (
  usn integer not null,
  oid integer not null,
  type integer not null
);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);
`;

/**
 * Monta o banco SQLite da coleção Anki (schema legado 11) com as notas
 * dadas, todas num único deck `nomeDeck`. Cada nota vira um ou mais cartões
 * (cloze pode virar mais de um, um por marca-texto distinto).
 */
async function montarBancoAnki(
  notas: { corpo: string; tags: string[] }[],
  nomeDeck: string,
): Promise<SqlJsDatabase> {
  const SQL = await carregarSqlJs();
  const db = new SQL.Database();
  db.run(SCHEMA_SQL);

  const agoraMs = Date.now();
  const agoraS = Math.floor(agoraMs / 1000);

  const modelos = { [MID_BASICO]: jsonModeloBasico(agoraS), [MID_CLOZE]: jsonModeloCloze(agoraS) };
  const decks = {
    "1": {
      id: 1, name: "Default", mod: agoraS, usn: -1, lrnToday: [0, 0], revToday: [0, 0],
      newToday: [0, 0], timeToday: [0, 0], collapsed: true, browserCollapsed: true,
      desc: "", dyn: 0, conf: CONF_ID, extendNew: 0, extendRev: 0,
    },
    [DID_DECK]: {
      id: DID_DECK, name: nomeDeck, mod: agoraS, usn: -1, lrnToday: [0, 0], revToday: [0, 0],
      newToday: [0, 0], timeToday: [0, 0], collapsed: false, browserCollapsed: false,
      desc: "", dyn: 0, conf: CONF_ID, extendNew: 0, extendRev: 0,
    },
  };
  const dconf = {
    [CONF_ID]: {
      id: CONF_ID, name: "Default", mod: 0, usn: 0, maxTaken: 60, autoplay: true, timer: 0, replayq: true,
      new: { bury: false, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20 },
      rev: { bury: false, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
      lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 },
      dyn: false,
    },
  };
  const conf = {
    nextPos: 1, estTimes: true, activeDecks: [DID_DECK], sortType: "noteFld", timeLim: 0,
    sortBackwards: false, addToCur: true, curDeck: DID_DECK, newBury: true, newSpread: 0,
    dueCounts: true, curModel: String(MID_BASICO), collapseTime: 1200,
  };

  db.run(`INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, '{}')`, [
    agoraS,
    agoraMs,
    agoraMs,
    JSON.stringify(conf),
    JSON.stringify(modelos),
    JSON.stringify(decks),
    JSON.stringify(dconf),
  ]);

  let proximoId = agoraMs;
  const novoId = () => proximoId++;
  let posicao = 0;

  for (const nota of notas) {
    const fc = paraFlashcard(nota);
    const mid = fc.tipo === "cloze" ? MID_CLOZE : MID_BASICO;
    const campo1 = fc.tipo === "cloze" ? paraCampoHTML(fc.texto) : paraCampoHTML(fc.frente);
    const campo2 = fc.tipo === "cloze" ? "" : paraCampoHTML(fc.verso);
    const flds = `${campo1}${SEPARADOR_CAMPO}${campo2}`;
    const sfld = campo1;
    const csum = await checksumCampo(sfld);
    const tagsAnki = fc.tag ? ` ${fc.tag.replace(/\s+/g, " ")} ` : "";

    const nid = novoId();
    db.run(
      `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) VALUES (?, ?, ?, ?, -1, ?, ?, ?, ?, 0, '')`,
      [nid, guidAleatorio(), mid, agoraS, tagsAnki, flds, sfld, csum],
    );

    const ords = fc.tipo === "cloze" ? ordinaisCloze(fc.texto) : [0];
    for (const ord of ords) {
      db.run(
        `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
         VALUES (?, ?, ?, ?, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')`,
        [novoId(), nid, DID_DECK, ord, agoraS, ++posicao],
      );
    }
  }

  return db;
}

/** Gera os bytes de um .apkg pronto para importar no Anki — um deck só, com
 * todas as notas dadas (cloze e básico misturados, cada um com seu
 * notetype). */
export async function gerarApkg(
  notas: { corpo: string; tags: string[] }[],
  nomeDeck: string,
): Promise<Uint8Array> {
  const db = await montarBancoAnki(notas, nomeDeck);
  try {
    const bytesBanco = db.export();
    return criarZip([
      { nome: "collection.anki2", dados: bytesBanco },
      { nome: "media", dados: new TextEncoder().encode("{}") },
    ]);
  } finally {
    db.close();
  }
}
