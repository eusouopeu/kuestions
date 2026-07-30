import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // jeep-sqlite (SQLite no navegador, via WASM) precisa ser excluído do
  // pre-bundle do Vite: ele carrega o .wasm dinamicamente em runtime.
  optimizeDeps: { exclude: ["jeep-sqlite"] },
  build: {
    target: "es2020",
    // recharts e jeep-sqlite já saem em chunks próprios via import dinâmico
    // (App.tsx e db.ts), então não há manualChunks a declarar aqui.
    chunkSizeWarningLimit: 600,
  },
  server: { port: 5173 },
});
