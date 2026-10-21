import { describe, expect, test } from "vitest";
import { OrderSchema, OrdersSchema } from "../src/schemas";

const base = {
  id: "ord_1",
  customer: { name: "Анна", email: "anna@example.com" },
  items: [{ title: "Кружка", price: 49000, quantity: 1 }],
};

describe("4. Zod-схемы (src/schemas)", () => {
  test("принимают заказы во всех четырёх статусах", () => {
    expect(OrderSchema.safeParse({ ...base, status: "new" }).success).toBe(true);
    expect(OrderSchema.safeParse({ ...base, status: "paid", paidAt: "2026-10-01" }).success).toBe(true);
    expect(
      OrderSchema.safeParse({ ...base, status: "shipped", paidAt: "2026-10-01", trackingNumber: "RU1" })
        .success,
    ).toBe(true);
    expect(OrderSchema.safeParse({ ...base, status: "cancelled", reason: "Передумал" }).success).toBe(true);
  });

  test("принимают email = null и необязательный promoCode", () => {
    const order = { ...base, status: "new", customer: { name: "Борис", email: null }, promoCode: "WELCOME10" };
    expect(OrderSchema.safeParse(order).success).toBe(true);
  });

  test("отклоняют неизвестный статус", () => {
    expect(OrderSchema.safeParse({ ...base, status: "refunded" }).success).toBe(false);
  });

  test("отклоняют отправленный заказ без трек-номера", () => {
    expect(OrderSchema.safeParse({ ...base, status: "shipped", paidAt: "2026-10-01" }).success).toBe(false);
  });

  test("отклоняют отменённый заказ без причины", () => {
    expect(OrderSchema.safeParse({ ...base, status: "cancelled" }).success).toBe(false);
  });

  test("отклоняют цену-строку, дробную или отрицательную цену", () => {
    for (const price of ["1990.00", 19.9, -100]) {
      const order = { ...base, status: "new", items: [{ title: "Лампа", price, quantity: 1 }] };
      expect(OrderSchema.safeParse(order).success).toBe(false);
    }
  });

  test("отклоняют количество 0 и дробное количество", () => {
    for (const quantity of [0, 1.5]) {
      const order = { ...base, status: "new", items: [{ title: "Лампа", price: 100, quantity }] };
      expect(OrderSchema.safeParse(order).success).toBe(false);
    }
  });

  test("отклоняют id без префикса ord_", () => {
    expect(OrderSchema.safeParse({ ...base, id: "1", status: "new" }).success).toBe(false);
  });

  test("отклоняют покупателя без поля email (нужно явное null)", () => {
    expect(OrderSchema.safeParse({ ...base, status: "new", customer: { name: "Дина" } }).success).toBe(false);
  });

  test("OrdersSchema проверяет массив заказов", () => {
    expect(OrdersSchema.safeParse([{ ...base, status: "new" }]).success).toBe(true);
    expect(OrdersSchema.safeParse({ ...base, status: "new" }).success).toBe(false);
  });
});
