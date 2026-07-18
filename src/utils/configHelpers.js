/** Returns true when config value is still a placeholder token. */
export function isPlaceholder(value) {
  return typeof value === 'string' && value.includes('[INSERT');
}

/** Replace inside-joke placeholder tokens in copy strings. */
export function resolveTemplate(text, { insideJoke }) {
  return text.replace(/\[INSERT INSIDE JOKE[^\]]*\]/g, insideJoke);
}
