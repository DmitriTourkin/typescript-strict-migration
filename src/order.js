import { applyDiscount, multiplyMoney, percent, sumMoney } from "./money";

// Заказ из интернет-магазина. Пример объекта — в data/orders.json.
//
// У заказа есть статус, и от статуса зависит, какие ещё поля у него есть:
//   "new"       — новый заказ, дополнительных полей нет;
//   "paid"      — оплачен: есть paidAt (дата оплаты);
//   "shipped"   — отправлен: есть paidAt и trackingNumber (трек-номер);
//   "cancelled" — отменён: есть reason (причина отмены).
//
// Общие поля у всех заказов:
//   id        — строка вида "ord_123";
//   customer  — { name: строка, email: строка или null };
//   items     — массив товаров { title, price (копейки), quantity };
//   promoCode — промокод, необязательное поле.

/** Создаёт идентификатор заказа. Он обязательно начинается с "ord_". */
export function orderId(value) {
  return value;
}

const PROMO_CODES = {
  WELCOME10: percent(10),
  FRIENDS25: percent(25),
};

/**
 * Итоговая стоимость заказа с учётом промокода.
 * Если промокод неизвестен, скидка не применяется.
 */
export function orderTotal(order) {
  const subtotal = sumMoney(
    order.items.map((item) => multiplyMoney(item.price, item.qty)),
  );
  if (order.promoCode === undefined) {
    return subtotal;
  }
  const discount = PROMO_CODES[order.promoCode];
  return applyDiscount(discount, subtotal);
}

/** Человекочитаемый статус заказа. */
export function statusLabel(order) {
  switch (order.status) {
    case "new":
      return "Новый";
    case "paid":
      return `Оплачен ${order.paidAt}`;
    case "shipped":
      return `Отправлен, трек-номер ${order.trackingNumber}`;
  }
}

/** Трек-номер, если заказ уже отправлен, иначе null. */
export function trackingNumber(order) {
  if (order.status === "paid" || order.status === "shipped") {
    return order.trackingNumber;
  }
  return null;
}

/**
 * Контакт покупателя: "Анна <anna@example.com>".
 * Если email не указан — только имя: "Анна".
 */
export function customerContact(order) {
  return `${order.customer.name} <${order.customer.email.toLowerCase()}>`;
}

/** Ищет заказ по id. Если не нашёл — возвращает undefined. */
export function findOrder(orders, id) {
  return orders.find((order) => order.id === id);
}
