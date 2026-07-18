import { EVENTS } from '../constants/eventTypes.js';

const MOVE_THROTTLE_MS = 600;

/**
 * Records clicks and throttled pointer positions for admin replay.
 * @param {import('../analytics/Analytics.js').Analytics} analytics
 */
export function initInteractionRecorder(analytics) {
  let lastMoveAt = 0;

  function targetMeta(el) {
    if (!(el instanceof Element)) return {};
    const tag = el.tagName?.toLowerCase() ?? '';
    const id = el.id || null;
    const cls =
      typeof el.className === 'string' && el.className
        ? el.className.split(/\s+/).slice(0, 3).join(' ')
        : null;
    const text =
      el.innerText && el.childElementCount === 0
        ? el.innerText.trim().slice(0, 48)
        : null;
    return { tag, id, cls, text };
  }

  document.addEventListener(
    'click',
    (e) => {
      const t = /** @type {Element} */ (e.target);
      analytics.track(EVENTS.INTERACTION_CLICK, {
        x: e.clientX,
        y: e.clientY,
        xPct: Number(((e.clientX / window.innerWidth) * 100).toFixed(1)),
        yPct: Number(((e.clientY / window.innerHeight) * 100).toFixed(1)),
        ...targetMeta(t),
      });
    },
    true
  );

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const t = /** @type {Element} */ (e.target);
      analytics.track(EVENTS.INTERACTION_POINTER, {
        xPct: Number(((e.clientX / window.innerWidth) * 100).toFixed(1)),
        yPct: Number(((e.clientY / window.innerHeight) * 100).toFixed(1)),
        ...targetMeta(t),
      });
    },
    true
  );

  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMoveAt < MOVE_THROTTLE_MS) return;
    lastMoveAt = now;
    analytics.track(EVENTS.INTERACTION_MOVE, {
      xPct: Number(((e.clientX / window.innerWidth) * 100).toFixed(1)),
      yPct: Number(((e.clientY / window.innerHeight) * 100).toFixed(1)),
    });
  });
}
