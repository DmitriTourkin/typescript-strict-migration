// Result — способ вернуть из функции либо успех, либо ошибку,
// не выбрасывая исключение:
//   { ok: true,  value: ... }  — всё хорошо, результат в value;
//   { ok: false, error: ... }  — что-то пошло не так, описание в error.

export function ok(value) {
  return { ok: true, value };
}

export function err(error) {
  return { ok: false, error };
}
