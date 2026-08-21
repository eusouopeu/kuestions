import { defineConfig } from "vitest/config";

/**
 * Testes cobrem funções puras (sem API/Capacitor) — repo.ts, texto.ts,
 * flashcards.ts, sugestao.ts, prioridade.ts, custo.ts, blocoUtils.ts — mais
 * as migrações do schema (migrations.test.ts), que rodam de verdade contra o
 * SQLite do sql.js, sem depender do plugin nativo. Ambiente "node" simples,
 * sem plugin do React: nenhum teste renderiza componente, então não há JSX
 * para transformar.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
