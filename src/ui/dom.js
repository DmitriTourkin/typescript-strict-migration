// Вспомогательные функции для работы со страницей (DOM).

/**
 * Находит элемент внутри root по CSS-селектору.
 * Если элемента нет — выбрасывает ошибку с понятным текстом.
 */
export function getElement(root, selector) {
  const element = root.querySelector(selector);
  if (element === null) {
    throw new Error(`На странице не найден элемент ${selector}`);
  }
  return element;
}

/** Создаёт <span> с CSS-классом и текстом. */
export function span(className, text) {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  return element;
}
