/**
 * @param {string} tag
 * @param {string} [className]
 * @param {Record<string, string>} [attrs]
 * @returns {HTMLElement}
 */
export function el(tag, className = '', attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else node.setAttribute(key, value);
  });
  return node;
}

/**
 * @param {HTMLElement} parent
 * @returns {HTMLDivElement}
 */
export function createScreenInner(parent) {
  const inner = el('div', 'screen__inner');
  parent.appendChild(inner);
  return inner;
}

/**
 * @param {import('../constants/screens.js').ScreenId} id
 * @param {string} modifierClass e.g. "screen--greeting"
 * @returns {HTMLElement}
 */
export function createScreenRoot(id, modifierClass) {
  const element = el('section', `screen ${modifierClass}`);
  element.dataset.screenId = id;
  return element;
}
