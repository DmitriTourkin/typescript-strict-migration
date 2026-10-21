import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // tests/ — тесты задания (менять нельзя), extra-tests/ — ваши собственные тесты
    include: ["tests/**/*.test.ts", "extra-tests/**/*.test.ts"],
    testTimeout: 60_000,
    // Тесты типов (*.test-d.ts) запускаются командой npm run test:types
    typecheck: {
      include: ["extra-tests/**/*.test-d.ts"],
      tsconfig: "./extra-tests/tsconfig.json",
    },
  },
});
