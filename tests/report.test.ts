import { describe, expect, test } from "vitest";
import { orderId } from "../src/order";
import { buildReport, orderReceipt } from "../src/report";
import { err, ok } from "../src/result";
import { allOrders, newOrder } from "./fixtures";

describe("5. Отчёты (src/report)", () => {
  test("buildReport() считает заказы, статусы и выручку", async () => {
    const result = await buildReport(async () => ok(allOrders));
    expect(result).toEqual({
      ok: true,
      value: {
        count: 4,
        byStatus: { new: 1, paid: 1, shipped: 1, cancelled: 1 },
        // оплаченный (183600) + отправленный (359000); новый и отменённый не считаются
        revenue: 542600,
      },
    });
  });

  test("buildReport(): статусы, которых нет в заказах, равны нулю", async () => {
    const second = { ...newOrder, id: orderId("ord_1005") };
    const result = await buildReport(async () => ok([newOrder, second]));
    expect(result).toMatchObject({
      ok: true,
      value: { count: 2, byStatus: { new: 2, paid: 0, shipped: 0, cancelled: 0 }, revenue: 0 },
    });
  });

  test("buildReport() возвращает ошибку загрузки как есть", async () => {
    const result = await buildReport(async () => err({ kind: "http" as const, status: 500 }));
    expect(result).toEqual({ ok: false, error: { kind: "http", status: 500 } });
  });

  test("orderReceipt() печатает чек", () => {
    const result = orderReceipt(allOrders, orderId("ord_1002"));
    expect(result).toEqual({
      ok: true,
      value: ["Заказ ord_1002", "Покупатель: Борис", "Статус: Оплачен 2026-10-01", "Итого: 1836.00 ₽"].join(
        "\n",
      ),
    });
  });

  test("orderReceipt() для несуществующего заказа → ошибка not_found", () => {
    const result = orderReceipt(allOrders, orderId("ord_9999"));
    expect(result).toEqual({ ok: false, error: { kind: "not_found", id: "ord_9999" } });
  });
});
