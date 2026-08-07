import { createFloatingHeartsLayer } from './FloatingHearts.js';

const INTENSITY = {
  loading: { particles: 10, className: 'screen-atmosphere--loading' },
  bigask: { particles: 12, className: 'screen-atmosphere--bigask' },
  hub: { particles: 5, className: 'screen-atmosphere--hub' },
  story: { particles: 8, className: 'screen-atmosphere--story' },
  planner: { particles: 6, className: 'screen-atmosphere--planner' },
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Per-screen ambient layer: soft mesh gradient + grain + optional particles.
 * Reuses FloatingHearts particle logic; respects prefers-reduced-motion.
 *
 * @param {HTMLElement} parent
 * @param {{ intensity?: 'loading' | 'bigask' | 'hub' | 'story' | 'planner' }} [options]
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
    <div class="screen-atmosphere__mesh">
      <span class="screen-atmosphere__blob screen-atmosphere__blob--peach"></span>
      <span class="screen-atmosphere__blob screen-atmosphere__blob--sage"></span>
      <span class="screen-atmosphere__blob screen-atmosphere__blob--butter"></span>
      <span class="screen-atmosphere__blob screen-atmosphere__blob--sky"></span>
    </div>
    <div class="screen-atmosphere__glow screen-atmosphere__glow--1"></div>
    <div class="screen-atmosphere__glow screen-atmosphere__glow--2"></div>
    <div class="screen-atmosphere__grain"></div>
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
