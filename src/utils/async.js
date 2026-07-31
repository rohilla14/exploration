export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @param {(...args: any[]) => void} fn @param {number} ms */
export function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
