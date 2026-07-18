import { EVENTS } from '../constants/eventTypes.js';

const API_BASE = '/api';
const FLUSH_INTERVAL_MS = 2000;
const MAX_QUEUE = 200;

export class Analytics {
  constructor() {
    /** @type {string | null} */
    this.sessionId = null;
    /** @type {Array<object>} */
    this.queue = [];
    this.flushTimer = null;
    this.currentScreenId = null;
    this.ready = this.initSession();

    window.addEventListener('visibilitychange', () => {
      this.track(
        document.hidden ? EVENTS.VISIBILITY_HIDDEN : EVENTS.VISIBILITY_VISIBLE,
        {},
        { screenId: this.currentScreenId }
      );
      if (document.hidden) this.flush(true);
    });

    window.addEventListener('pagehide', () => this.flush(true));
    window.addEventListener('beforeunload', () => this.flush(true));
  }

  async initSession() {
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          metadata: {
            language: navigator.language,
            platform: navigator.platform,
          },
        }),
      });

      if (!res.ok) throw new Error(`Session create failed: ${res.status}`);

      const { sessionId } = await res.json();
      this.sessionId = sessionId;
      sessionStorage.setItem('exploration_session_id', sessionId);

      this.track(EVENTS.SESSION_START, { referrer: document.referrer || null });
      this.scheduleFlush();
    } catch (err) {
      console.warn('[Analytics] Session init failed — events will queue offline', err);
    }
  }

  /**
   * @param {string} eventType
   * @param {Record<string, unknown>} [payload]
   * @param {{ screenId?: string | null }} [options]
   */
  track(eventType, payload = {}, { screenId = this.currentScreenId } = {}) {
    if (!this.sessionId) return;

    this.queue.push({
      sessionId: this.sessionId,
      screenId,
      eventType,
      payload,
      clientTimestamp: new Date().toISOString(),
    });

    if (this.queue.length >= MAX_QUEUE) {
      this.flush();
    }
  }

  /** @param {string | null} screenId */
  setScreen(screenId) {
    this.currentScreenId = screenId;
  }

  /** @param {string} screenId */
  async updateSessionScreen(screenId) {
    if (!this.sessionId) return;
    try {
      await fetch(`${API_BASE}/sessions/${this.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastScreenId: screenId }),
      });
    } catch {
      /* non-blocking */
    }
  }

  scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  /** @param {boolean} [useKeepalive] */
  flush(useKeepalive = false) {
    if (!this.queue.length || !this.sessionId) return;

    const batch = this.queue.splice(0, MAX_QUEUE);
    const body = JSON.stringify({ events: batch });

    fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: useKeepalive,
    }).catch((err) => {
      console.warn('[Analytics] Flush failed, re-queuing', err);
      this.queue.unshift(...batch);
    });
  }

  /**
   * @param {{ selectedDate: string, selectedTime: string, activities?: object[] }} data
   */
  async confirmDate(data) {
    await this.ready;
    if (!this.sessionId) return;

    this.track(EVENTS.DATE_CONFIRM, data, { screenId: 'date-planner' });
    this.flush(true);

    await fetch(`${API_BASE}/confirmations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        activities: data.activities ?? [],
      }),
    });
  }
}
