import { describe, expect, test } from "vitest";
import { applyDiscount, formatMoney, money, multiplyMoney, percent, sumMoney } from "../src/money";

describe("1. Деньги (src/money)", () => {
  test("money() принимает целое неотрицательное число копеек", () => {
    expect(money(0)).toBe(0);
    expect(money(1990)).toBe(1990);
  });

  test("money() не даёт создать отрицательную или дробную сумму", () => {
    expect(() => money(-1)).toThrow(RangeError);
    expect(() => money(19.9)).toThrow(RangeError);
  });

  test("percent() принимает только числа от 0 до 100", () => {
    expect(percent(0)).toBe(0);
    expect(percent(100)).toBe(100);
    expect(() => percent(-5)).toThrow(RangeError);
    expect(() => percent(101)).toThrow(RangeError);
  });

  test("sumMoney() складывает суммы как числа", () => {
    expect(sumMoney([money(100), money(250)])).toBe(350);
  });

  test("sumMoney() пустого списка равна нулю", () => {
    expect(sumMoney([])).toBe(0);
  });

  test("multiplyMoney() умножает цену на количество", () => {
    expect(multiplyMoney(money(25000), 3)).toBe(75000);
  });

  test("applyDiscount() уменьшает сумму на процент", () => {
    expect(applyDiscount(money(1000), percent(15))).toBe(850);
  });

  test("formatMoney() печатает рубли с копейками", () => {
    expect(formatMoney(money(123450))).toBe("1234.50 ₽");
  });
});
