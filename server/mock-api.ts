// Учебный «сервер». Во время `npm run dev` Vite отвечает на запросы /api/orders.
// Этот файл менять не нужно: он изображает чужой сервер, на который мы не влияем.
//
//   /api/orders?mode=normal  — нормальный список заказов (data/orders.json);
//   /api/orders?mode=broken  — данные с ошибками (data/orders-broken.json);
//   /api/orders?mode=error   — ответ с кодом 500.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

const DELAY_MS = 500; // имитация медленной сети, чтобы было видно состояние «Загрузка…»

export function mockApi(): Plugin {
  return {
    name: "mock-api",
    configureServer(server) {
      server.middlewares.use("/api/orders", (req, res) => {
        const mode = new URL(req.url ?? "/", "http://localhost").searchParams.get("mode") ?? "normal";
        setTimeout(() => {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          if (mode === "error") {
            res.statusCode = 500;
            res.end(JSON.stringify({ message: "Internal Server Error" }));
            return;
          }
          const file = mode === "broken" ? "data/orders-broken.json" : "data/orders.json";
          res.end(readFileSync(join(server.config.root, file), "utf8"));
        }, DELAY_MS);
      });
    },
  };
}
