// Проверка типов, а не поведения. Этот файл не запускается, а только компилируется
// (см. тест «типы соответствуют контракту» в tests/project.test.ts).
//
// Строка «// @ts-expect-error» означает: «на следующей строке ДОЛЖНА быть ошибка типов».
// Если ошибки нет — компилятор пожалуется, значит, ваши типы слишком «мягкие».

import type { z } from "zod";
import type { ApiError } from "../../src/api";
import { applyDiscount, money, percent, type Money, type Percent } from "../../src/money";
import { orderId, type Order, type OrderId, type OrderStatus } from "../../src/order";
import { err, ok, type Result } from "../../src/result";
import { OrderSchema, OrdersSchema } from "../../src/schemas";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// ---------- 1. Брендированные типы ----------

const price: Money = money(1990);
const discount: Percent = percent(10);
const id: OrderId = orderId("ord_1");

// @ts-expect-error — обычное число нельзя выдать за Money, нужна функция money()
const rawNumber: Money = 1990;

// @ts-expect-error — Money и Percent — разные типы, хотя оба «внутри» числа
const wrongKind: Percent = price;

// @ts-expect-error — перепутан порядок аргументов: сначала сумма, потом скидка
applyDiscount(discount, price);

const discounted: Money = applyDiscount(price, discount);

// @ts-expect-error — сумма двух Money — это просто number; складывать надо через sumMoney()
const naiveSum: Money = price + price;

// @ts-expect-error — обычная строка не является OrderId
const rawId: OrderId = "ord_1";

// Брендированное значение всё ещё можно использовать как обычное число/строку
const asNumber: number = price;
const asString: string = id;

// ---------- 2. Размеченное объединение Order ----------

const statuses: Equal<OrderStatus, "new" | "paid" | "shipped" | "cancelled"> = true;

declare const order: Order;

// @ts-expect-error — trackingNumber есть не у каждого заказа, сначала проверьте status
order.trackingNumber;

if (order.status === "shipped") {
  const tracking: string = order.trackingNumber;
  const paidAt: string = order.paidAt;
}

if (order.status === "paid") {
  // @ts-expect-error — у оплаченного, но не отправленного заказа трек-номера нет
  order.trackingNumber;
}

if (order.status === "cancelled") {
  const reason: string = order.reason;
}

const itemPrice: Money | undefined = order.items[0]?.price;
const orderIdField: OrderId = order.id;
const maybeEmail: string | null = order.customer.email;

// @ts-expect-error — email может быть null
const email: string = order.customer.email;

// @ts-expect-error — промокод необязательный, может быть undefined
const promo: string = order.promoCode;

// ---------- 3. Обобщённый тип Result<T, E> ----------

declare const result: Result<number, string>;

// @ts-expect-error — пока не проверили ok, значения может не быть
result.value;

if (result.ok) {
  const value: number = result.value;
} else {
  const error: string = result.error;
}

const success: Result<number, string> = ok(42);
const failure: Result<number, string> = err("что-то сломалось");

// @ts-expect-error — ok(строка) не подходит туда, где ожидается Result<number, ...>
const wrongValue: Result<number, string> = ok("42");

// ---------- 4. Ошибки API ----------

declare const apiError: ApiError;

function describeApiError(error: ApiError): string {
  switch (error.kind) {
    case "network":
      return error.message;
    case "http":
      return String(error.status);
    case "validation":
      return error.issues.join(", ");
    default: {
      // если появится новый вид ошибки, здесь будет ошибка компиляции
      const unreachable: never = error;
      return unreachable;
    }
  }
}
describeApiError(apiError);

// ---------- 5. Zod-схема согласована с типом Order ----------

const parsed: Order = OrderSchema.parse({});
const parsedList: Order[] = OrdersSchema.parse([]);
type FromSchema = z.infer<typeof OrderSchema>;
const fromSchema: Order = {} as FromSchema;
