const STRENGTH = 0.32;
const RADIUS = 70;
const SELECTOR = '.btn, .win-btn, .dp-cal__day, .desk-icon__tile, .taskbar__start, .letters__item';

/**
 * Buttons lean a little toward the cursor when it comes close, and spring back when it leaves.
 * Pointer driven only, so touch and keyboard are untouched.
 */
export function initMagneticButtons() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /** @type {HTMLElement | null} */
  let held = null;

  const release = (el) => {
    if (!el) return;
    el.style.removeProperty('--mag-x');
    el.style.removeProperty('--mag-y');
    el.classList.remove('is-magnetic');
  };

  document.addEventListener(
    'pointermove',
    (e) => {
      const el = e.target instanceof Element ? e.target.closest(SELECTOR) : null;

      if (el !== held) {
        release(held);
        held = el instanceof HTMLElement ? el : null;
      }
      if (!held || held.hasAttribute('disabled')) return;

      const r = held.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      // Only pull while the cursor is genuinely near the middle, so it never feels sticky.
      const reach = Math.max(RADIUS, Math.min(r.width, r.height));
      const pull = Math.max(0, 1 - Math.hypot(dx, dy) / (reach * 1.6));

      held.classList.add('is-magnetic');
      held.style.setProperty('--mag-x', `${(dx * STRENGTH * pull).toFixed(2)}px`);
      held.style.setProperty('--mag-y', `${(dy * STRENGTH * pull).toFixed(2)}px`);
    },
    { passive: true }
  );

  document.addEventListener('pointerleave', () => release(held), true);
  document.addEventListener('pointerdown', () => release(held), true);
}
