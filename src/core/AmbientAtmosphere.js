import { createFloatingHeartsLayer } from './FloatingHearts.js';

const INTENSITY = {
  loading: { particles: 10, className: 'screen-atmosphere--loading' },
  bigask: { particles: 12, className: 'screen-atmosphere--bigask' },
  hub: { particles: 5, className: 'screen-atmosphere--hub' },
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Per-screen ambient layer: soft gradient + optional floating particles.
 * Reuses FloatingHearts particle logic; respects prefers-reduced-motion.
 *
 * @param {HTMLElement} parent
 * @param {{ intensity?: 'loading' | 'bigask' | 'hub' }} [options]
 * @returns {{ element: HTMLElement, destroy: () => void }}
 */
export function createAmbientAtmosphere(parent, { intensity = 'hub' } = {}) {
  const config = INTENSITY[intensity] ?? INTENSITY.hub;
  const reduced = prefersReducedMotion();

  const root = document.createElement('div');
  root.className = `screen-atmosphere ${config.className}`;
  root.setAttribute('aria-hidden', 'true');
  if (reduced) root.classList.add('screen-atmosphere--static');

  root.innerHTML = `
    <div class="screen-atmosphere__gradient"></div>
    <div class="screen-atmosphere__glow screen-atmosphere__glow--1"></div>
    <div class="screen-atmosphere__glow screen-atmosphere__glow--2"></div>
  `;

  let hearts = null;
  if (!reduced && config.particles > 0) {
    hearts = createFloatingHeartsLayer({
      parent: root,
      count: config.particles,
    });
  }

  parent.prepend(root);

  return {
    element: root,
    destroy() {
      hearts?.destroy?.();
      root.remove();
    },
  };
}
