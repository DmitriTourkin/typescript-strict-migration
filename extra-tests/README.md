# Ваши собственные тесты

Эта папка нужна только для дополнительных задач уровней П и Э (см. [критерии оценки](../docs/GRADING.md)).
Для обязательной части здесь ничего делать не нужно.

Тесты задания лежат в `tests/`, их менять нельзя. Свои тесты кладите сюда:

| Файл | Что внутри | Как запустить |
|---|---|---|
| `*.test.ts` | тесты поведения: вызываем функцию, проверяем результат | `npm test` (вместе с тестами задания) |
| `*.test-d.ts` | тесты типов: проверяем, что тип такой, как задумано | `npm run test:types` |

Пример теста поведения (`extra-tests/guards.test.ts`):

```ts
import { describe, expect, test } from "vitest";
import { isStatusFilter } from "../src/ui/render";

describe("Защитники типа", () => {
  test("isStatusFilter принимает только известные статусы", () => {
    expect(isStatusFilter("paid")).toBe(true);
    expect(isStatusFilter("canceled")).toBe(false);
  });
});
```

Пример теста типов (`extra-tests/money.test-d.ts`):

```ts
import { expectTypeOf, test } from "vitest";
import { money, type Money } from "../src/money";

test("Money — это не просто number", () => {
  expectTypeOf(money(100)).toEqualTypeOf<Money>();
  expectTypeOf<number>().not.toEqualTypeOf<Money>();
});
```

Тесты типов не запускают код, а проверяют его компилятором. Если тип не совпадёт с ожидаемым,
`npm run test:types` покажет ошибку `TypeCheckError`. Документация:
[Vitest — тестирование типов](https://vitest.dev/guide/testing-types).

Файл `tsconfig.json` в этой папке нужен, чтобы компилятор проверял эти тесты. Не удаляйте его.
