# Теория: минимум, нужный для задания

Каждый пример можно вставить в [TypeScript Playground](https://www.typescriptlang.org/play) и
посмотреть, где компилятор ругается. Примеры специально взяты из другой предметной области,
чтобы вы сами применили идею к заказам.

Содержание:

1. [Что такое TypeScript и строгий режим](#1-что-такое-typescript-и-строгий-режим)
2. [any, unknown и сужение типов](#2-any-unknown-и-сужение-типов)
3. [Объединения и размеченные объединения](#3-объединения-и-размеченные-объединения)
4. [Обобщённые типы (generics)](#4-обобщённые-типы-generics)
5. [Брендированные типы](#5-брендированные-типы)
6. [Утилитные типы](#6-утилитные-типы)
7. [Типы DOM и защитники типа](#7-типы-dom-и-защитники-типа)
8. [Проверка данных на границе: Zod](#8-проверка-данных-на-границе-zod)
9. [Полезные ссылки](#9-полезные-ссылки)

---

## 1. Что такое TypeScript и строгий режим

TypeScript — это JavaScript с **типами**. Вы описываете, какие значения могут быть в переменных
и параметрах, а компилятор (`tsc`) **до запуска программы** проверяет, что код этому описанию
соответствует. Во время выполнения типов уже нет: TypeScript превращается в обычный JavaScript.

```ts
function greet(name: string): string {
  return "Привет, " + name.toUpperCase();
}

greet("Аня"); // ок
greet(42);    // ошибка: число нельзя передать туда, где ожидается строка
```

Многие типы компилятор **выводит сам**, писать их везде не нужно:

```ts
const count = 5;              // тип number выведен сам
const names = ["Аня", "Боря"]; // string[]
```

Типы параметров функций компилятор не выводит, их нужно писать.

### Объектные типы

```ts
type User = {
  name: string;
  age: number;
  nickname?: string;     // необязательное поле: string или undefined
  phone: string | null;  // обязательное поле, но значение может быть null
};
```

### Строгий режим

Без `strict` TypeScript многое прощает. Например, параметр без типа молча получает тип `any`
(«что угодно»), а `null` можно передать куда угодно. В строгом режиме компилятор:

- требует указывать типы параметров (`noImplicitAny`);
- различает `string` и `string | null`: прежде чем использовать значение, его нужно проверить
  (`strictNullChecks`);
- считает переменную в `catch` типом `unknown` (`useUnknownInCatchVariables`).

Именно строгий режим находит большинство ошибок в этом проекте.

---

## 2. any, unknown и сужение типов

**`any`** выключает проверку. С `any` можно сделать что угодно, и компилятор промолчит:

```ts
const data: any = JSON.parse('{"temp": "холодно"}');
data.temp.toFixed(1); // компилятор молчит, программа падает при запуске
```

**`unknown`** означает «неизвестно что». Использовать такое значение нельзя, пока не проверите,
что это:

```ts
const data: unknown = JSON.parse('{"temp": 21.5}');
data.temp; // ошибка: сначала проверьте, что внутри

if (typeof data === "object" && data !== null && "temp" in data) {
  // здесь компилятор уже знает больше
}
```

Правило проекта: **`any` запрещён**. Если тип неизвестен, используйте `unknown` и проверяйте.

### Сужение типа (narrowing)

После проверки `if` компилятор **сужает** тип внутри ветки:

```ts
function shout(text: string | null): string {
  if (text === null) {
    return "(тишина)";
  }
  return text.toUpperCase(); // здесь text уже просто string
}
```

Так работают `=== null`, `=== undefined`, `typeof x === "string"`, `x instanceof Error`,
проверка поля-метки (см. ниже).

Если значение может быть `undefined` (например, `array.find(...)` ничего не нашёл), компилятор
заставит это обработать. Это не придирка: так он показывает место, где программа упадёт на
реальных данных.

> Оператор `!` (`user!.name`) говорит компилятору «поверь, тут не null». Это обман: если значение
> всё-таки `null`, программа упадёт. В этом задании им не пользуемся.

### Ошибка в catch

Выбросить можно что угодно: `throw "строка"`, `throw 42`. Поэтому в строгом режиме `e` в
`catch (e)` имеет тип `unknown`:

```ts
try {
  riskyCall();
} catch (e) {
  console.log(e.message); // ошибка: e — unknown
  const text = e instanceof Error ? e.message : String(e); // правильно
}
```

---

## 3. Объединения и размеченные объединения

**Объединение** (union) — «одно из»:

```ts
type Size = "S" | "M" | "L"; // только одна из трёх строк
let size: Size = "M";
size = "XL"; // ошибка
```

**Размеченное объединение** (discriminated union) — объединение объектов с общим полем-«меткой».
По значению метки компилятор понимает, какой это вариант и какие у него есть поля:

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "point" };

function area(shape: Shape): number {
  shape.radius; // ошибка: radius есть не у всех вариантов

  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;    // здесь shape — круг
    case "rect":
      return shape.width * shape.height;     // здесь shape — прямоугольник
    case "point":
      return 0;
  }
}
```

Зачем это нужно: в JavaScript легко обратиться к `shape.radius` у прямоугольника и получить
`undefined`. С размеченным объединением компилятор не даст этого сделать.

Общие поля можно вынести и соединить через `&` (пересечение — «и то, и другое»):

```ts
type Base = { id: string; createdAt: string };
type Shape =
  | (Base & { kind: "circle"; radius: number })
  | (Base & { kind: "point" });
```

### Проверка полноты через `never`

`never` — тип, у которого нет ни одного значения. Если все варианты разобраны, в ветке `default`
переменная имеет тип `never`. Если какой-то вариант забыт, компилятор покажет ошибку:

```ts
function describe(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return "круг";
    case "rect":
      return "прямоугольник";
    default: {
      const unreachable: never = shape; // ошибка: забыли "point"
      return unreachable;
    }
  }
}
```

Это очень полезно, когда в объединение позже добавляют новый вариант: компилятор покажет **все**
места, которые нужно обновить.

---

## 4. Обобщённые типы (generics)

Иногда функция или тип работают одинаково для разных типов. Вместо копирования используют
**параметр типа**, обычно его называют `T`:

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const n = first([1, 2, 3]);       // number | undefined
const s = first(["а", "б"]);      // string | undefined
```

Тип тоже может быть обобщённым:

```ts
type Box<T> = { value: T; label: string };

const a: Box<number> = { value: 42, label: "ответ" };
const b: Box<string[]> = { value: ["x"], label: "список" };
```

Параметров может быть несколько: `Pair<A, B>`. Типичный пример — тип «успех или ошибка», где
`T` — тип результата, а `E` — тип ошибки. Его вы напишете в `result.ts`.

---

## 5. Брендированные типы

Проблема: суммы, проценты, температуры и количества — всё это `number`. Компилятор не заметит,
если перепутать их местами:

```ts
function convert(celsius: number, precision: number): number { ... }
convert(2, 36.6); // перепутали аргументы, компилятор молчит
```

**Брендированный тип** — это `number` (или `string`) с невидимой «меткой». Во время выполнения
это обычное число, но для компилятора `Celsius` и `Fahrenheit` — разные типы:

```ts
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

type Celsius = Brand<number, "Celsius">;
type Fahrenheit = Brand<number, "Fahrenheit">;
```

`declare const brand: unique symbol` объявляет уникальный символ только для компилятора. В
JavaScript-код ничего не попадает.

Создавать такие значения нужно через **функцию-конструктор с проверкой**, и это единственное
место, где допустимо `as`:

```ts
function celsius(value: number): Celsius {
  if (value < -273.15) {
    throw new RangeError("Ниже абсолютного нуля не бывает");
  }
  return value as Celsius;
}

function toFahrenheit(t: Celsius): Fahrenheit {
  return ((t * 9) / 5 + 32) as Fahrenheit;
}

toFahrenheit(celsius(20)); // ок
toFahrenheit(20);          // ошибка: обычное число — не Celsius
const f = toFahrenheit(celsius(20));
toFahrenheit(f);           // ошибка: Fahrenheit — не Celsius
```

Брендированное значение можно использовать как обычное число (`t * 9`), но результат
арифметики — уже просто `number`, без бренда. Поэтому для операций над `Money` в проекте есть
отдельные функции (`sumMoney`, `multiplyMoney`).

---

## 6. Утилитные типы

Это встроенные «функции над типами», которые делают новый тип из существующего.

```ts
type User = { id: string; name: string; email: string; age: number };
```

| Утилита | Что делает | Пример |
|---|---|---|
| `Pick<T, K>` | оставить только поля `K` | `Pick<User, "id" \| "name">` → `{ id; name }` |
| `Omit<T, K>` | убрать поля `K` | `Omit<User, "email">` |
| `Partial<T>` | все поля необязательные | `Partial<User>` — для «частичного обновления» |
| `Readonly<T>` | поля нельзя менять | `Readonly<User>` |
| `Record<K, V>` | объект с ключами `K` и значениями `V` | `Record<"S" \| "M" \| "L", number>` |
| `ReturnType<F>` | тип результата функции | `ReturnType<typeof getUser>` |

Ещё два полезных приёма:

```ts
type Size = Shape["kind"];   // «достать» тип поля: "circle" | "rect" | "point"
function total(xs: readonly number[]) { ... } // функция обещает не менять массив
```

Особенно полезен `Record` с объединением в качестве ключей: компилятор проверит, что заданы
**все** ключи.

```ts
const prices: Record<Size, number> = { S: 100, M: 150 }; // ошибка: нет ключа "L"
```

Если ключ — произвольная строка (`Record<string, number>`), то при включённом
`noUncheckedIndexedAccess` значение `prices[key]` имеет тип `number | undefined`: такого ключа
может не быть.

---

## 7. Типы DOM и защитники типа

### Элементы страницы

В TypeScript у каждого вида элемента свой тип: `HTMLElement` (любой HTML-элемент),
`HTMLSelectElement` (`<select>`), `HTMLInputElement` (`<input>`), `HTMLUListElement` (`<ul>`)
и так далее. Поля у них разные: `value` есть у `<select>` и `<input>`, но не у `<div>`.

`querySelector` ищет элемент по CSS-селектору. Элемента может не оказаться, поэтому результат —
`Element | null`:

```ts
const button = document.querySelector("#save"); // Element | null
button.textContent = "Сохранить";               // ошибка: button может быть null

if (button !== null) {
  button.textContent = "Сохранить";             // ок
}
```

Компилятор не знает, что за элемент найдётся по селектору `"#save"`. Проверить это можно через
`instanceof`, и после проверки тип сужается:

```ts
const input = document.querySelector("#name");
if (input instanceof HTMLInputElement) {
  console.log(input.value); // здесь input — HTMLInputElement
}
```

Класс тоже можно передать в функцию как параметр. Тип «класс, который создаёт `T`» записывается
так: `{ new (): T }`. Это удобно для обобщённых помощников:

```ts
function create<T>(type: { new (): T }): T {
  return new type();
}
const d = create(Date); // Date
```

### События

В обработчике события `event.target` — это элемент, **на котором произошло** событие, а не тот,
на который повешен обработчик. Если обработчик висит на `<ul>`, а кликнули по `<span>` внутри
`<li>`, то `event.target` — это `<span>`. Поэтому тип `event.target` очень общий:
`EventTarget | null`, и его нужно проверить:

```ts
list.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }
  // closest() ищет ближайшего предка (или сам элемент), подходящего под селектор
  const row = event.target.closest<HTMLElement>("li");
  console.log(row?.dataset.id);
});
```

`element.dataset` — это data-атрибуты элемента (`data-id="42"` → `dataset.id`). Значения там
всегда строки, а атрибута может не быть, поэтому тип — `string | undefined`.

### Защитники типа (type guards)

Значение из `<select>` — это просто `string`, даже если в списке только «S», «M» и «L».
Чтобы превратить строку в тип `Size`, нужна проверка во время выполнения. Функцию-проверку можно
оформить как **защитника типа**: вместо `boolean` она возвращает `value is Size`, и после неё
компилятор сужает тип:

```ts
type Size = "S" | "M" | "L";
const SIZE_LABELS: Record<Size, string> = { S: "Маленький", M: "Средний", L: "Большой" };

function isSize(value: string): value is Size {
  return Object.hasOwn(SIZE_LABELS, value);
}

const raw = select.value;  // string
if (isSize(raw)) {
  const size: Size = raw;  // ок: компилятор поверил проверке
}
```

Отвечаете за правильность проверки вы: если `isSize` вернёт `true` для неподходящей строки,
компилятор этого не заметит. Поэтому проверка должна быть простой и очевидной.

---

## 8. Проверка данных на границе: Zod

TypeScript проверяет код **до запуска**. Данные, которые приходят во время работы программы
(ответ сервера, файл, ввод пользователя), он проверить не может. `response.json()` возвращает
`any`, то есть «верим на слово». Если сервер пришлёт не то, ошибка всплывёт где-то в глубине
программы.

Решение: проверить данные **сразу на входе**, на границе приложения. Библиотека
[Zod](https://zod.dev) позволяет описать «схему» данных и проверить по ней любое значение:

```ts
import { z } from "zod";

const WeatherSchema = z.object({
  city: z.string(),
  temp: z.number(),
  wind: z.number().nonnegative().nullable(),
  comment: z.string().optional(),
});

const result = WeatherSchema.safeParse(unknownData);
if (result.success) {
  result.data.temp; // number — данные проверены
} else {
  for (const issue of result.error.issues) {
    console.log(issue.path.join("."), issue.message); // где и что не так
  }
}
```

### Размеченное объединение в Zod

```ts
const ShapeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("circle"), radius: z.number() }),
  z.object({ kind: z.literal("rect"), width: z.number(), height: z.number() }),
]);
```

Общую часть можно описать один раз и расширять через `.extend({...})`.

### Тип из схемы

Zod умеет выводить TypeScript-тип из схемы:

```ts
type Weather = z.infer<typeof WeatherSchema>;
```

### Брендированные значения после проверки

`.transform(fn)` прогоняет проверенное значение через функцию. Так можно сразу получить бренд:

```ts
const TempSchema = z.number().transform(celsius); // результат — Celsius
```

---

## 9. Полезные ссылки

- [TypeScript Handbook (англ.)](https://www.typescriptlang.org/docs/handbook/intro.html): разделы
  «Everyday Types», «Narrowing», «Generics», «Utility Types»
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Документация Zod](https://zod.dev)
- [Список настроек tsconfig](https://www.typescriptlang.org/tsconfig)
- [MDN: работа с DOM (рус.)](https://developer.mozilla.org/ru/docs/Web/API/Document_Object_Model)
