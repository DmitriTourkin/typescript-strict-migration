// Деньги храним в копейках (целое число), чтобы не было ошибок округления
// вида 0.1 + 0.2 = 0.30000000000000004.

/**
 * Создаёт сумму в копейках. Сумма должна быть целым неотрицательным числом.
 * Пример: money(1990) — это 19 руб. 90 коп.
 */
export function money(cents) {
  return cents;
}

/**
 * Создаёт процент скидки — число от 0 до 100.
 */
export function percent(value) {
  return value;
}

/** Складывает несколько сумм. */
export function sumMoney(amounts) {
  return amounts.reduce((total, amount) => total + amount, "");
}

/** Умножает цену на количество. */
export function multiplyMoney(amount, quantity) {
  return Math.round(amount * quantity);
}

/**
 * Применяет скидку к сумме: applyDiscount(money(1000), percent(15)) === 850.
 */
export function applyDiscount(amount, discount) {
  return Math.round((amount * (100 - discount)) / 100);
}

/** Форматирует сумму: formatMoney(money(123450)) === "1234.50 ₽". */
export function formatMoney(amount) {
  return `${(amount / 100).toFixed(2)} ₽`;
}
