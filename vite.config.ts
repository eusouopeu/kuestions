import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // jeep-sqlite (SQLite no navegador, via WASM) precisa ser excluído do
  // pre-bundle do Vite: ele carrega o .wasm dinamicamente em runtime. sql.js
  // (usado direto por lib/apkg.ts) NÃO entra nessa lista — excluí-lo quebra
  // o pre-bundle do dev server, que é quem faz o interop CJS→ESM do
  // `module.exports = initSqlJs` do pacote (sem isso, `import initSqlJs from
  // "sql.js"` falha em dev com "does not provide an export named 'default'").
  optimizeDeps: { exclude: ["jeep-sqlite"] },
  build: {
    target: "es2020",
    // recharts e jeep-sqlite já saem em chunks próprios via import dinâmico
    // (App.tsx e db.ts), então não há manualChunks a declarar aqui.
    chunkSizeWarningLimit: 600,
  },
  server: { port: 5173 },
});
