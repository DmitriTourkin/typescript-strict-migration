import { describe, expect, test } from "vitest";
import { customerContact, findOrder, orderId, orderTotal, statusLabel, trackingNumber } from "../src/order";
import { allOrders, cancelledOrder, newOrder, paidOrder, shippedOrder } from "./fixtures";

describe("2. Заказы (src/order)", () => {
  test("orderId() принимает строку вида ord_...", () => {
    expect(orderId("ord_42")).toBe("ord_42");
  });

  test("orderId() отклоняет строку без префикса ord_", () => {
    expect(() => orderId("42")).toThrow();
  });

  test("orderTotal(): цена × количество", () => {
    expect(orderTotal(newOrder)).toBe(98000);
  });

  test("orderTotal(): промокод WELCOME10 даёт скидку 10%", () => {
    // (129000 + 3 × 25000) × 0.9
    expect(orderTotal(paidOrder)).toBe(183600);
  });

  test("orderTotal(): неизвестный промокод не меняет сумму", () => {
    expect(orderTotal(shippedOrder)).toBe(359000);
  });

  test("statusLabel() для всех четырёх статусов", () => {
    expect(statusLabel(newOrder)).toBe("Новый");
    expect(statusLabel(paidOrder)).toBe("Оплачен 2026-10-01");
    expect(statusLabel(shippedOrder)).toBe("Отправлен, трек-номер RU123456789");
    expect(statusLabel(cancelledOrder)).toBe("Отменён: Покупатель передумал");
  });

  test("trackingNumber(): трек-номер есть только у отправленного заказа", () => {
    expect(trackingNumber(shippedOrder)).toBe("RU123456789");
    expect(trackingNumber(paidOrder)).toBeNull();
    expect(trackingNumber(newOrder)).toBeNull();
  });

  test("customerContact(): имя и email в нижнем регистре", () => {
    expect(customerContact(newOrder)).toBe("Анна <anna@example.com>");
  });

  test("customerContact(): без email — только имя", () => {
    expect(customerContact(paidOrder)).toBe("Борис");
  });

  test("findOrder() находит заказ или возвращает undefined", () => {
    expect(findOrder(allOrders, orderId("ord_1003"))).toBe(shippedOrder);
    expect(findOrder(allOrders, orderId("ord_9999"))).toBeUndefined();
  });
});
