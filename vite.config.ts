import { defineConfig } from "vite";
import { mockApi } from "./server/mock-api";

export default defineConfig({
  plugins: [mockApi()],
  server: { open: true },
});
