import { CONFIG } from '../../config.js';
import { EVENTS } from '../../constants/eventTypes.js';
import { hubApi } from '../api.js';

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} ctx */
export function createMemoryLaneApp(container, { analytics }) {
  let destroyed = false;
  let activeKind = 'memory';
  /** @type {{ memory: any[] | null, like: any[] | null }} */
  const cache = { memory: null, like: null };

  container.innerHTML = `
    <div class="hub-app hub-app--memory">
      <div class="hub-tabs">
        <button type="button" class="hub-tab hub-tab--active" data-kind="memory">${CONFIG.memoryLaneTabMoments}</button>
        <button type="button" class="hub-tab" data-kind="like">${CONFIG.memoryLaneTabLikes}</button>
      </div>
      <div class="memory-list" data-role="list"><p class="hub-loading">Loading…</p></div>
    </div>
  `;

  const tabs = container.querySelectorAll('.hub-tab');
  const list = container.querySelector('[data-role="list"]');

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  function renderList(kind) {
    const notes = cache[kind];
    if (!notes) return;

    if (!notes.length) {
      list.innerHTML = `<p class="hub-empty">${
        kind === 'memory' ? CONFIG.memoryLaneEmptyMoments : CONFIG.memoryLaneEmptyLikes
      }</p>`;
      return;
    }

    list.innerHTML = notes
      .map(
        (n) => `
        <div class="memory-note">
          ${n.occurred_on ? `<span class="memory-note__date">${formatDate(n.occurred_on)}</span>` : ''}
          <p class="memory-note__body">${escapeHtml(n.body)}</p>
        </div>
      `
      )
      .join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  async function loadKind(kind) {
    if (cache[kind]) {
      renderList(kind);
      return;
    }
    list.innerHTML = '<p class="hub-loading">Loading…</p>';
    try {
      const notes = await hubApi.listLoveNotes(kind);
      if (destroyed) return;
      cache[kind] = notes;
      analytics.track(EVENTS.LOVE_NOTE_VIEW, { kind, count: notes.length });
      renderList(kind);
    } catch (err) {
      if (destroyed) return;
      list.innerHTML = `<p class="hub-error">Couldn't load this right now (${err.message}).</p>`;
    }
  }

  function switchTab(kind) {
    activeKind = kind;
    tabs.forEach((tab) => tab.classList.toggle('hub-tab--active', tab.dataset.kind === kind));
    loadKind(kind);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.kind));
  });

  return {
    start() {
      switchTab(activeKind);
    },
    destroy() {
      destroyed = true;
    },
  };
}
