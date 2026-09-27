import { hubApi } from '../api.js';
import { escapeHtml } from '../../utils/dom.js';

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} _ctx */
export function createHoroscopeApp(container, { analytics: _analytics }) {
  let destroyed = false;
  /** @type {AbortController | null} */
  let controller = null;

  container.innerHTML = `
    <div class="hub-app hub-app--horoscope">
      <div class="horoscope" data-role="root">
        <p class="hub-loading">Reading the day…</p>
      </div>
    </div>
  `;

  const root = container.querySelector('[data-role="root"]');

  function formatDateLabel(iso) {
    if (!iso) return '';
    try {
      const [y, m, d] = iso.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return iso;
    }
  }

  function renderWarmFallback() {
    root.innerHTML = `
      <p class="horoscope__date">Today</p>
      <section class="horoscope__section">
        <h3 class="horoscope__label">Today, for you</h3>
        <p class="horoscope__text">The day is quieter than it looks from the outside. Something soft is already on your side, you do not need to chase it. Let the next few hours be gentle with you.</p>
      </section>
      <section class="horoscope__section horoscope__section--us">
        <h3 class="horoscope__label">Today, for us</h3>
        <p class="horoscope__text">Whatever is growing between you prefers presence over performance. A small honest moment will do more than a grand plan. Stay close to that.</p>
      </section>
    `;
  }

  function render(data) {
    root.innerHTML = `
      <p class="horoscope__date">${escapeHtml(formatDateLabel(data.date))}</p>
      <section class="horoscope__section">
        <h3 class="horoscope__label">Today, for you</h3>
        <p class="horoscope__text">${escapeHtml(data.personal)}</p>
      </section>
      <section class="horoscope__section horoscope__section--us">
        <h3 class="horoscope__label">Today, for us</h3>
        <p class="horoscope__text">${escapeHtml(data.together)}</p>
      </section>
    `;
  }

  async function load() {
    controller?.abort();
    controller = new AbortController();
    root.innerHTML = '<p class="hub-loading">Reading the day…</p>';

    try {
      const data = await hubApi.getHoroscope({ signal: controller.signal });
      if (destroyed) return;
      if (!data?.personal || !data?.together) {
        renderWarmFallback();
        return;
      }
      render(data);
    } catch (err) {
      if (destroyed || err?.name === 'AbortError') return;
      renderWarmFallback();
    }
  }

  return {
    start() {
      load();
    },
    destroy() {
      destroyed = true;
      controller?.abort();
      controller = null;
    },
  };
}
