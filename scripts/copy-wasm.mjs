/**
 * Copia o binário WASM do sql.js para public/assets/.
 *
 * Por quê: no navegador (vite dev / vite preview), o @capacitor-community/sqlite
 * roda através do jeep-sqlite, que carrega o sql.js pedindo
 * `/assets/sql-wasm.wasm` (wasmPath padrão do componente). O arquivo vive em
 * node_modules e não é servido de lá, então sem esta cópia o pedido cai no
 * fallback de SPA do Vite, volta index.html e o WebAssembly falha com
 * "expected magic word 00 61 73 6d, found 3c 21 64 6f" (isto é, "<!do").
 *
 * No Android/iOS isto é irrelevante — lá o plugin usa SQLite nativo.
 * Roda no postinstall e antes de todo build, para não dessincronizar quando o
 * sql.js for atualizado.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const origem = join(raiz, "node_modules/sql.js/dist/sql-wasm.wasm");
const destino = join(raiz, "public/assets/sql-wasm.wasm");

if (!existsSync(origem)) {
  console.error(
    `[copy-wasm] não encontrei ${origem}.\n` +
      `Rode "npm install" antes — o sql.js vem como dependência do jeep-sqlite.`,
  );
  process.exit(1);
}

await mkdir(dirname(destino), { recursive: true });
await copyFile(origem, destino);
console.log("[copy-wasm] public/assets/sql-wasm.wasm atualizado.");
