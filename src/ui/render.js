import { formatMoney } from "../money";
import { orderTotal, statusLabel } from "../order";
import { span } from "./dom";

// Варианты фильтра по статусу: «все» или один из статусов заказа.
// Ключ — значение фильтра, значение — подпись в выпадающем списке.
export const FILTER_LABELS = {
  all: "Все",
  new: "Новые",
  paid: "Оплаченные",
  shipped: "Отправленные",
  canceled: "Отменённые",
};

// Режимы учебного сервера (см. server/mock-api.ts).
export const SERVER_MODES = {
  normal: "нормальный",
  broken: "присылает неправильные данные",
  error: "отвечает ошибкой 500",
};

/** Заполняет <select> вариантами из объекта { значение: подпись }. */
export function renderOptions(select, labels) {
  select.replaceChildren(
    ...Object.entries(labels).map(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      return option;
    }),
  );
}

/** Отрисовывает список заказов внутри <ul>. */
export function renderOrders(list, orders) {
  list.replaceChildren(...orders.map(orderRow));
}

function orderRow(order) {
  const row = document.createElement("li");
  row.className = "order";
  row.dataset.orderId = order.id;
  row.dataset.status = order.status;
  row.append(
    span("order-id", order.id),
    span("order-customer", order.customer.name),
    span("order-status", statusLabel(order)),
    span("order-total", formatMoney(orderTotal(order))),
  );
  return row;
}

/** Текст сводки над списком: «Заказов: 4 · Выручка: 5426.00 ₽». */
export function summaryText(report) {
  return `Заказов: ${report.count} · Выручка: ${formatMoney(report.revenue)}`;
}

/** Понятное пользователю сообщение об ошибке загрузки. */
export function errorMessage(error) {
  switch (error.kind) {
    case "network":
      return `Нет связи с сервером: ${error.status}`;
    case "http":
      return `Сервер ответил ошибкой ${error.status}`;
    case "validation":
      return ["Сервер прислал неправильные данные:", ...error.issues].join("\n");
  }
}
