// Тестовые заказы. Те же данные, что в data/orders.json.
import { money } from "../src/money";
import { orderId } from "../src/order";

export const newOrder = {
  id: orderId("ord_1001"),
  status: "new" as const,
  customer: { name: "Анна", email: "Anna@Example.com" },
  items: [{ title: "Кружка", price: money(49000), quantity: 2 }],
};

export const paidOrder = {
  id: orderId("ord_1002"),
  status: "paid" as const,
  paidAt: "2026-10-01",
  customer: { name: "Борис", email: null },
  items: [
    { title: "Футболка", price: money(129000), quantity: 1 },
    { title: "Носки", price: money(25000), quantity: 3 },
  ],
  promoCode: "WELCOME10",
};

export const shippedOrder = {
  id: orderId("ord_1003"),
  status: "shipped" as const,
  paidAt: "2026-10-02",
  trackingNumber: "RU123456789",
  customer: { name: "Вера", email: "vera@example.com" },
  items: [{ title: "Рюкзак", price: money(359000), quantity: 1 }],
  promoCode: "SUMMER",
};

export const cancelledOrder = {
  id: orderId("ord_1004"),
  status: "cancelled" as const,
  reason: "Покупатель передумал",
  customer: { name: "Глеб", email: "gleb@example.com" },
  items: [{ title: "Зонт", price: money(89000), quantity: 1 }],
};

export const allOrders = [newOrder, paidOrder, shippedOrder, cancelledOrder];
