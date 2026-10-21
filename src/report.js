import { formatMoney, sumMoney } from "./money";
import { customerContact, findOrder, orderTotal, statusLabel } from "./order";
import { ok } from "./result";

/**
 * Сводный отчёт по заказам.
 * loadOrders — функция без аргументов, которая возвращает Promise<Result> с заказами
 * (например, () => fetchOrders(fetch)).
 *
 * Результат: ok({ count, byStatus, revenue }), где
 *   count    — всего заказов;
 *   byStatus — сколько заказов в каждом статусе: { new: 1, paid: 2, shipped: 0, cancelled: 1 };
 *   revenue  — выручка: сумма orderTotal по оплаченным и отправленным заказам.
 * Если заказы загрузить не удалось — возвращает ту же ошибку.
 */
export async function buildReport(loadOrders) {
  const result = loadOrders();
  if (!result.ok) {
    return result;
  }
  const orders = result.value;

  const byStatus = {};
  for (const order of orders) {
    byStatus[order.status] = byStatus[order.status] + 1;
  }

  const paidOrders = orders.filter(
    (order) => order.status === "paid" || order.status === "shipped",
  );
  const revenue = sumMoney(paidOrders.map(orderTotal));

  return ok({ count: orders.length, byStatus, revenue });
}

/**
 * Текст чека для заказа с указанным id.
 * Если заказа нет — err({ kind: "not_found", id }).
 */
export function orderReceipt(orders, id) {
  const order = findOrder(orders, id);
  const lines = [
    `Заказ ${order.id}`,
    `Покупатель: ${customerContact(order)}`,
    `Статус: ${statusLabel(order)}`,
    `Итого: ${formatMoney(orderTotal(order))}`,
  ];
  return ok(lines.join("\n"));
}
