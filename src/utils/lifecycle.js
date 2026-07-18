/**
 * Manages screen cleanup in two tiers:
 * - bindListener → persists for the screen's lifetime (cleared on destroy / onExit)
 * - trackListener / trackTimeout / trackInterval → per-visit (cleared on reset / onEnter)
 */
export function createLifecycle() {
  /** @type {Set<() => void>} */
  const transient = new Set();
  /** @type {Set<() => void>} */
  const persistent = new Set();

  return {
    /** @param {EventTarget} target @param {string} type @param {EventListener} listener @param {AddEventListenerOptions} [options] */
    bindListener(target, type, listener, options) {
      target.addEventListener(type, listener, options);
      persistent.add(() => target.removeEventListener(type, listener, options));
    },

    /** Per-visit listener — removed on reset() (called from onEnter). */
    trackListener(target, type, listener, options) {
      target.addEventListener(type, listener, options);
      transient.add(() => target.removeEventListener(type, listener, options));
    },

    /** @param {ReturnType<typeof setTimeout>} id */
    trackTimeout(id) {
      transient.add(() => clearTimeout(id));
      return id;
    },

    /** @param {ReturnType<typeof setInterval>} id */
    trackInterval(id) {
      transient.add(() => clearInterval(id));
      return id;
    },

    /** Clear timers and per-visit listeners — call at start of onEnter. */
    reset() {
      transient.forEach((fn) => fn());
      transient.clear();
    },

    /** Full cleanup — call from onExit. */
    destroy() {
      this.reset();
      persistent.forEach((fn) => fn());
      persistent.clear();
    },
  };
}
