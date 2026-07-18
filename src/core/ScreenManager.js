import { wait } from '../utils/async.js';
import { EVENTS } from '../constants/eventTypes.js';

const TRANSITION_MS = 450;

/**
 * @typedef {object} Screen
 * @property {string} id
 * @property {HTMLElement} element
 * @property {() => void} [onEnter]
 * @property {() => void} [onExit]
 */

/**
 * @typedef {object} ScreenChangeDetail
 * @property {string} screenId
 * @property {number} index
 * @property {string | null} previousScreenId
 */

export class ScreenManager {
  /**
   * @param {HTMLElement} container
   * @param {{ analytics?: import('../analytics/Analytics.js').Analytics }} [options]
   */
  constructor(container, { analytics } = {}) {
    this.container = container;
    this.analytics = analytics ?? null;
    /** @type {Map<string, Screen>} */
    this.screens = new Map();
    /** @type {string[]} */
    this.order = [];
    /** @type {string | null} */
    this.currentId = null;
    /** @type {Set<(detail: ScreenChangeDetail) => void>} */
    this.listeners = new Set();
    this._initialized = false;
  }

  /** @param {(detail: ScreenChangeDetail) => void} fn */
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** @param {string} id @param {Omit<Screen, 'id'>} screen */
  register(id, screen) {
    if (this.screens.has(id)) {
      throw new Error(`Screen already registered: ${id}`);
    }

    const entry = { ...screen, id };
    entry.element.classList.add('screen');
    entry.element.dataset.screenId = id;
    entry.element.style.display = 'none';
    this.screens.set(id, entry);
    this.order.push(id);
    this.container.appendChild(entry.element);
  }

  /** @param {string} id */
  async goTo(id) {
    if (!this.screens.has(id)) {
      console.warn(`[ScreenManager] Unknown screen: ${id}`);
      return;
    }
    if (id === this.currentId && this._initialized) return;

    const prev = this._initialized && this.currentId ? this.screens.get(this.currentId) : null;
    const next = this.screens.get(id);

    if (prev) {
      this.analytics?.track(EVENTS.SCREEN_EXIT, { screenId: prev.id });
      prev.element.classList.add('screen--exiting');
      prev.onExit?.();
      await wait(TRANSITION_MS);
      prev.element.classList.remove('screen--active', 'screen--exiting');
      prev.element.style.display = 'none';
    }

    next.element.style.display = 'flex';
    void next.element.offsetWidth;
    next.element.classList.add('screen--entering');
    requestAnimationFrame(() => {
      next.element.classList.add('screen--active');
      next.element.classList.remove('screen--entering');
    });

    const previousScreenId = this.currentId;
    this.currentId = id;
    this._initialized = true;

    this.analytics?.setScreen(id);
    this.analytics?.track(EVENTS.SCREEN_ENTER, { screenId: id, previousScreenId });
    this.analytics?.updateSessionScreen(id);

    next.onEnter?.();

    const index = this.order.indexOf(id);
    this.listeners.forEach((fn) => fn({ screenId: id, index, previousScreenId }));

    await wait(TRANSITION_MS);
  }

  /** Advance to the next screen in registration sequence. */
  goNext() {
    const idx = this.order.indexOf(this.currentId ?? '');
    if (idx === -1 || idx >= this.order.length - 1) return Promise.resolve();
    return this.goTo(this.order[idx + 1]);
  }

  /** Go to the previous screen. No-op on the first navigable step. */
  goBack() {
    const idx = this.order.indexOf(this.currentId ?? '');
    if (idx <= 0) return Promise.resolve();
    return this.goTo(this.order[idx - 1]);
  }

  get count() {
    return this.order.length;
  }

  get current() {
    return this.currentId;
  }
}
