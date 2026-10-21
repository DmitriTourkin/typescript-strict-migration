import { fetchOrders } from "../api";
import { buildReport, orderReceipt } from "../report";
import { getElement } from "./dom";
import {
  FILTER_LABELS,
  SERVER_MODES,
  errorMessage,
  renderOptions,
  renderOrders,
  summaryText,
} from "./render";

const TEMPLATE = `
  <main class="app">
    <header class="app-header">
      <div class="brand">
        <span class="brand-logo" aria-hidden="true">◆</span>
        <div>
          <h1>Мини-магазин</h1>
          <p class="brand-subtitle">Панель заказов</p>
        </div>
      </div>
      <label class="field">
        <span class="field-label">Сервер</span>
        <select data-role="mode"></select>
      </label>
    </header>
    <div class="toolbar">
      <div class="summary" data-role="summary"></div>
      <label class="field">
        <span class="field-label">Статус</span>
        <select data-role="filter"></select>
      </label>
    </div>
    <p class="loading" data-role="loading">Загружаем заказы…</p>
    <div class="error" data-role="error" hidden></div>
    <div class="layout">
      <ul class="orders" data-role="orders"></ul>
      <section class="details" data-role="details" hidden></section>
    </div>
  </main>
`;

/**
 * Запускает приложение внутри элемента root.
 * fetchFn — функция загрузки: в браузере это fetch, в тестах — подделка.
 *
 * Состояние приложения (переменная state) бывает трёх видов:
 *   { status: "loading" }                  — идёт загрузка;
 *   { status: "error", error }             — загрузить не удалось (error — ошибка из api.js);
 *   { status: "ready", orders, report }    — заказы загружены, отчёт посчитан.
 */
export function startApp(root, { fetchFn }) {
  root.innerHTML = TEMPLATE;
  const modeSelect = getElement(root, '[data-role="mode"]');
  const filterSelect = getElement(root, '[data-role="filter"]');
  const summaryEl = getElement(root, '[data-role="summary"]');
  const loadingEl = getElement(root, '[data-role="loading"]');
  const errorEl = getElement(root, '[data-role="error"]');
  const listEl = getElement(root, '[data-role="orders"]');
  const detailsEl = getElement(root, '[data-role="details"]');

  let state = { status: "loading" };
  let filter = "all";

  function visibleOrders(orders) {
    if (filter === "all") {
      return orders;
    }
    return orders.filter((order) => order.status === filter);
  }

  function render() {
    loadingEl.hidden = state.status !== "loading";
    errorEl.hidden = state.status !== "error";
    if (state.status === "error") {
      errorEl.textContent = errorMessage(state.error);
    }
    summaryEl.textContent = state.report ? summaryText(state.report) : "";
    renderOrders(listEl, state.orders ? visibleOrders(state.orders) : []);
  }

  async function load() {
    state = { ...state, status: "loading" };
    render();

    const result = await fetchOrders(fetchFn, `/api/orders?mode=${modeSelect.value}`);
    if (!result.ok) {
      state = { ...state, status: "error", error: result.error };
      render();
      return;
    }
    const report = await buildReport(async () => result);
    if (report.ok) {
      state = { status: "ready", orders: result.value, report: report.value };
    }
    render();
  }

  // Клик по строке заказа — показать чек.
  listEl.addEventListener("click", (event) => {
    const id = event.target.dataset.orderId;
    if (!id || state.status !== "ready") {
      return;
    }
    const receipt = orderReceipt(state.orders, id);
    detailsEl.textContent = receipt.value;
    detailsEl.hidden = false;
  });

  filterSelect.addEventListener("change", () => {
    filter = filterSelect.value;
    render();
  });

  modeSelect.addEventListener("change", () => {
    detailsEl.hidden = true;
    load();
  });

  renderOptions(modeSelect, SERVER_MODES);
  renderOptions(filterSelect, FILTER_LABELS);
  load();
}
