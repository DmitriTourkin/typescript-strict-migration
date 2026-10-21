// @vitest-environment happy-dom
//
// Тесты интерфейса. Они запускают приложение в «ненастоящем» браузере (happy-dom)
// и подставляют вместо сервера функцию, которая отвечает заранее заготовленными данными.
import { readFileSync } from "node:fs";
import { describe, expect, test, vi } from "vitest";
import { startApp } from "../src/ui/app";

const goodData: unknown = JSON.parse(readFileSync("data/orders.json", "utf8"));
const brokenData: unknown = JSON.parse(readFileSync("data/orders-broken.json", "utf8"));

// Подделка сервера: смотрит на ?mode=... в адресе и отвечает как server/mock-api.ts.
async function fakeFetch(url: string) {
  const mode = new URL(url, "http://localhost").searchParams.get("mode");
  if (mode === "error") {
    return { ok: false, status: 500, json: async () => ({ message: "Internal Server Error" }) };
  }
  return { ok: true, status: 200, json: async () => (mode === "broken" ? brokenData : goodData) };
}

function start(fetchFn: (url: string) => Promise<unknown> = fakeFetch) {
  const root = document.createElement("div");
  document.body.replaceChildren(root);
  startApp(root, { fetchFn });

  const find = <T extends Element>(role: string) => {
    const element = root.querySelector<T>(`[data-role="${role}"]`);
    if (element === null) throw new Error(`Нет элемента data-role="${role}"`);
    return element;
  };
  return {
    root,
    mode: find<HTMLSelectElement>("mode"),
    filter: find<HTMLSelectElement>("filter"),
    summary: find<HTMLElement>("summary"),
    loading: find<HTMLElement>("loading"),
    error: find<HTMLElement>("error"),
    details: find<HTMLElement>("details"),
    rows: () => [...root.querySelectorAll<HTMLElement>("[data-order-id]")],
  };
}

function choose(select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("7. Интерфейс (src/ui)", () => {
  test("сначала показывает «Загрузка…», затем список из 4 заказов", async () => {
    const app = start();
    expect(app.loading.hidden).toBe(false);
    await vi.waitFor(() => expect(app.rows()).toHaveLength(4));
    expect(app.loading.hidden).toBe(true);
    expect(app.error.hidden).toBe(true);
  });

  test("показывает сводку: количество заказов и выручку", async () => {
    const app = start();
    await vi.waitFor(() => expect(app.summary.textContent).toBe("Заказов: 4 · Выручка: 5426.00 ₽"));
  });

  test("в строке заказа — номер, покупатель, статус и сумма", async () => {
    const app = start();
    await vi.waitFor(() => expect(app.rows()).toHaveLength(4));
    const cancelled = app.rows()[3];
    expect(cancelled?.textContent).toContain("ord_1004");
    expect(cancelled?.textContent).toContain("Отменён: Покупатель передумал");
    expect(cancelled?.textContent).toContain("890.00 ₽");
  });

  test("фильтр содержит «Все» и четыре статуса", async () => {
    const app = start();
    const values = [...app.filter.options].map((option) => option.value);
    expect(values).toEqual(["all", "new", "paid", "shipped", "cancelled"]);
  });

  test("фильтр «Отменённые» оставляет только отменённый заказ", async () => {
    const app = start();
    await vi.waitFor(() => expect(app.rows()).toHaveLength(4));
    choose(app.filter, "cancelled");
    expect(app.rows().map((row) => row.dataset.orderId)).toEqual(["ord_1004"]);
    choose(app.filter, "all");
    expect(app.rows()).toHaveLength(4);
  });

  test("клик по номеру заказа открывает чек", async () => {
    const app = start();
    await vi.waitFor(() => expect(app.rows()).toHaveLength(4));
    const idCell = app.root.querySelector<HTMLElement>('[data-order-id="ord_1002"] .order-id');
    idCell?.click();
    expect(app.details.hidden).toBe(false);
    expect(app.details.textContent).toContain("Итого: 1836.00 ₽");
  });

  test("сервер ответил 500 → сообщение об ошибке", async () => {
    const app = start();
    await vi.waitFor(() => expect(app.rows()).toHaveLength(4));
    choose(app.mode, "error");
    await vi.waitFor(() => expect(app.error.hidden).toBe(false));
    expect(app.error.textContent).toBe("Сервер ответил ошибкой 500");
  });

  test("после ошибки не остаётся старых заказов и сводки", async () => {
    const app = start();
    await vi.waitFor(() => expect(app.rows()).toHaveLength(4));
    choose(app.mode, "error");
    await vi.waitFor(() => expect(app.error.hidden).toBe(false));
    expect(app.rows()).toHaveLength(0);
    expect(app.summary.textContent).toBe("");
  });

  test("сервер прислал неправильные данные → список проблем", async () => {
    const app = start();
    await vi.waitFor(() => expect(app.rows()).toHaveLength(4));
    choose(app.mode, "broken");
    await vi.waitFor(() => expect(app.error.hidden).toBe(false));
    expect(app.error.textContent).toContain("Сервер прислал неправильные данные");
    expect(app.error.textContent).toContain("price");
    expect(app.rows()).toHaveLength(0);
  });

  test("нет сети → понятное сообщение", async () => {
    const app = start(async () => {
      throw new Error("Failed to fetch");
    });
    await vi.waitFor(() => expect(app.error.hidden).toBe(false));
    expect(app.error.textContent).toBe("Нет связи с сервером: Failed to fetch");
  });
});
