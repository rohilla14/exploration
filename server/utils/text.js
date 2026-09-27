/**
 * Keep dashes out of anything shown to her: long dashes and spaced hyphens become commas.
 * (Hyphens inside a word are left alone.)
 * @param {unknown} value
 * @returns {string}
 */
export function noDashes(value) {
  return String(value ?? '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s+-\s+/g, ', ')
    .replace(/,\s*,/g, ',')
    .trim();
}
