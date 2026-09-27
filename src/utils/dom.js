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

/**
 * Escape text for safe interpolation into HTML (text nodes and quoted attributes).
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Title bar for the desktop-style windows (traffic-light dots + a title).
 * @param {string} title
 * @returns {HTMLElement}
 */
export function windowBar(title) {
  const bar = el('header', 'win__bar');
  bar.innerHTML = `
    <span class="win__dots" aria-hidden="true">
      <span class="win__dot win__dot--close"></span>
      <span class="win__dot win__dot--min"></span>
      <span class="win__dot win__dot--max"></span>
    </span>
    <span class="win__title">${escapeHtml(title)}</span>
  `;
  return bar;
}
