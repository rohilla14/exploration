const FLOATERS = ['✨', '⭐', '🌸', '♡', '·'];
const COUNT = 14;

export function initFloatingHearts() {
  const layer = document.createElement('div');
  layer.className = 'floating-hearts';
  layer.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < COUNT; i++) {
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

  document.querySelector('.ambient')?.appendChild(layer);
}
