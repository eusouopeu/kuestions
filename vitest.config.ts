import { defineConfig } from "vitest/config";

/**
 * Testes cobrem só funções puras (sem SQL/API/Capacitor) — repo.ts, texto.ts,
 * flashcards.ts, sugestao.ts. Ambiente "node" simples, sem plugin do React:
 * nenhum teste renderiza componente, então não há JSX para transformar.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
