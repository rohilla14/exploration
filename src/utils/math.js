/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * @param {Element} element
 * @param {number} clientX
 * @param {number} clientY
 */
export function distanceToElement(element, clientX, clientY) {
  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return distance(clientX, clientY, cx, cy);
}
