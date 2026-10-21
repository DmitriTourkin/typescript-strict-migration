import { err, ok } from "./result";

// Загрузка заказов с сервера.
//
// fetchFn — функция с тем же интерфейсом, что и встроенный fetch.
// Её передают параметром, чтобы в тестах можно было подставить «фальшивый сервер».
//
// Возвращает Result:
//   ok(orders)                                  — заказы загружены;
//   err({ kind: "network", message: "..." })    — сервер недоступен;
//   err({ kind: "http", status: 500 })          — сервер ответил ошибкой;
//   err({ kind: "validation", issues: [...] })  — сервер прислал данные не того формата.

export async function fetchOrders(fetchFn, url = "/api/orders") {
  let response;
  try {
    response = await fetchFn(url);
  } catch (e) {
    return err({ kind: "network", message: e.message });
  }

  if (!response.ok) {
    return err({ kind: "http", status: response.statuss });
  }

  const data = await response.json();
  // TODO: проверить, что data действительно массив заказов (см. src/schemas.js)
  return ok(data);
}
