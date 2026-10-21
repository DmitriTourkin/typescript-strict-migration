import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { fetchOrders } from "../src/api";

const goodData: unknown = JSON.parse(readFileSync("data/orders.json", "utf8"));
const brokenData: unknown = JSON.parse(readFileSync("data/orders-broken.json", "utf8"));

// «Фальшивый сервер»: всегда отвечает одним и тем же.
function fakeServer(status: number, body: unknown) {
  return async (_url: string) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe("3. Загрузка заказов (src/api)", () => {
  test("корректный ответ сервера → ok со списком заказов", async () => {
    const result = await fetchOrders(fakeServer(200, goodData));
    expect(result).toEqual({ ok: true, value: goodData });
  });

  test("сервер ответил 503 → ошибка http со статусом", async () => {
    const result = await fetchOrders(fakeServer(503, null));
    expect(result).toEqual({ ok: false, error: { kind: "http", status: 503 } });
  });

  test("сеть недоступна (Error) → ошибка network с текстом", async () => {
    const result = await fetchOrders(async () => {
      throw new Error("timeout");
    });
    expect(result).toEqual({ ok: false, error: { kind: "network", message: "timeout" } });
  });

  test("выброшено не Error, а строка → всё равно понятное сообщение", async () => {
    const result = await fetchOrders(async () => {
      throw "offline";
    });
    expect(result).toEqual({ ok: false, error: { kind: "network", message: "offline" } });
  });

  test("сервер прислал данные не того формата → ошибка validation", async () => {
    const result = await fetchOrders(fakeServer(200, brokenData));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("validation");
    if (result.error.kind !== "validation") return;
    // Каждая проблема — строка вида "0.items.0.price: описание ошибки"
    expect(result.error.issues.length).toBeGreaterThan(0);
    expect(result.error.issues.some((issue) => issue.includes("price"))).toBe(true);
    expect(result.error.issues.some((issue) => issue.includes("status"))).toBe(true);
  });

  test("сервер прислал объект вместо массива → ошибка validation", async () => {
    const result = await fetchOrders(fakeServer(200, { orders: [] }));
    expect(result).toMatchObject({ ok: false, error: { kind: "validation" } });
  });
});
