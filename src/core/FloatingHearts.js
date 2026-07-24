const FLOATERS = ['✨', '⭐', '🌸', '♡', '·'];
const DEFAULT_COUNT = 14;

/**
 * Build a floating-particles layer (hearts/sparkles).
 * @param {{ parent?: HTMLElement, count?: number }} [options]
 * @returns {{ element: HTMLElement, destroy: () => void }}
 */
export function createFloatingHeartsLayer({ parent, count = DEFAULT_COUNT } = {}) {
  const layer = document.createElement('div');
  layer.className = 'floating-hearts';
  layer.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'floating-hearts__item';
    el.textContent = FLOATERS[i % FLOATERS.length];
    el.style.setProperty('--x', `${4 + Math.random() * 92}%`);
    el.style.setProperty('--delay', `${Math.random() * 12}s`);
    el.style.setProperty('--duration', `${14 + Math.random() * 10}s`);
    el.style.setProperty('--size', `${0.55 + Math.random() * 0.7}rem`);
    el.style.setProperty('--drift', `${-30 + Math.random() * 60}px`);
    layer.appendChild(el);
  }

  if (parent) parent.appendChild(layer);

  return {
    element: layer,
    destroy() {
      layer.remove();
    },
  };
}

/** Global ambient particles — attaches to the body-level `.ambient` layer. */
export function initFloatingHearts() {
  createFloatingHeartsLayer({
    parent: document.querySelector('.ambient') ?? document.body,
    count: DEFAULT_COUNT,
  });
}
