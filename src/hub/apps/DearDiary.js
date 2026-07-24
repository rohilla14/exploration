import { CONFIG } from '../../config.js';
import { EVENTS } from '../../constants/eventTypes.js';
import { hubApi } from '../api.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toIsoDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} ctx */
export function createDearDiaryApp(container, { analytics }) {
  let destroyed = false;
  let entries = [];
  let viewMonth = new Date();
  viewMonth.setDate(1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

  let selectedDate = todayIso;
  let selectedMood = CONFIG.diaryMoods[0];

  container.innerHTML = `
    <div class="hub-app hub-app--diary">
      <p class="hub-app__subtitle">${CONFIG.diarySubtitle}</p>

      <div class="diary-cal">
        <div class="diary-cal__header">
          <button type="button" class="diary-cal__nav" data-dir="-1">←</button>
          <span class="diary-cal__title" data-role="cal-title"></span>
          <button type="button" class="diary-cal__nav" data-dir="1">→</button>
        </div>
        <div class="diary-cal__grid" data-role="cal-grid"></div>
      </div>

      <form class="diary-composer" data-role="composer">
        <p class="diary-composer__date" data-role="composer-date"></p>
        <div class="diary-composer__moods" data-role="mood-picker"></div>
        <p class="diary-composer__prompt" data-role="ai-prompt">${CONFIG.diaryAiPromptLoading}</p>
        <textarea class="diary-composer__input" placeholder="${CONFIG.diaryPlaceholder}" required></textarea>
        <button type="submit" class="btn btn--primary">${CONFIG.diarySubmit}</button>
      </form>

      <div class="diary-list" data-role="list"><p class="hub-loading">Loading…</p></div>
    </div>
  `;

  const calTitle = container.querySelector('[data-role="cal-title"]');
  const calGrid = container.querySelector('[data-role="cal-grid"]');
  const composerDate = container.querySelector('[data-role="composer-date"]');
  const moodPicker = container.querySelector('[data-role="mood-picker"]');
  const aiPromptEl = container.querySelector('[data-role="ai-prompt"]');
  const composer = container.querySelector('[data-role="composer"]');
  const list = container.querySelector('[data-role="list"]');

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function formatDateLong(iso) {
    return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  function renderMoodPicker() {
    moodPicker.innerHTML = CONFIG.diaryMoods
      .map(
        (m) => `<button type="button" class="diary-mood${m === selectedMood ? ' diary-mood--active' : ''}" data-mood="${m}">${m}</button>`
      )
      .join('');

    moodPicker.querySelectorAll('.diary-mood').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedMood = btn.dataset.mood;
        renderMoodPicker();
      });
    });
  }

  function renderCalendar() {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    calTitle.textContent = `${MONTHS[m]} ${y}`;
    calGrid.innerHTML = '';

    const entryDates = new Set(entries.map((e) => e.entry_date));
    const first = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    for (let i = 0; i < first; i++) {
      const empty = document.createElement('span');
      empty.className = 'diary-cal__day diary-cal__day--empty';
      calGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIsoDate(y, m, day);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'diary-cal__day';
      if (iso === todayIso) btn.classList.add('diary-cal__day--today');
      if (iso === selectedDate) btn.classList.add('diary-cal__day--selected');
      if (entryDates.has(iso)) btn.classList.add('diary-cal__day--has-entry');
      btn.textContent = String(day);
      btn.addEventListener('click', () => {
        selectedDate = iso;
        renderCalendar();
        updateComposerDate();
      });
      calGrid.appendChild(btn);
    }
  }

  function updateComposerDate() {
    composerDate.textContent = formatDateLong(selectedDate);
  }

  function renderList() {
    if (!entries.length) {
      list.innerHTML = `<p class="hub-empty">${CONFIG.diaryEmpty}</p>`;
      return;
    }

    list.innerHTML = entries
      .map(
        (e) => `
        <div class="diary-entry">
          <div class="diary-entry__meta">
            <span class="diary-entry__date">${formatDateLong(e.entry_date)}</span>
            ${e.mood ? `<span class="diary-entry__mood">${e.mood}</span>` : ''}
          </div>
          <p class="diary-entry__body">${escapeHtml(e.body)}</p>
        </div>
      `
      )
      .join('');
  }

  async function loadEntries() {
    try {
      entries = await hubApi.listDiary();
      if (destroyed) return;
      renderCalendar();
      renderList();
    } catch (err) {
      if (destroyed) return;
      list.innerHTML = `<p class="hub-error">Couldn't load entries right now (${err.message}).</p>`;
    }
  }

  async function loadAiPrompt() {
    if (!aiPromptEl) return;
    try {
      const { prompt } = await hubApi.aiDiaryPrompt({ recentMood: selectedMood });
      if (destroyed || !aiPromptEl.isConnected) return;
      aiPromptEl.textContent = prompt || CONFIG.diaryAiPromptFallback;
    } catch {
      if (!aiPromptEl.isConnected) return;
      aiPromptEl.textContent = CONFIG.diaryAiPromptFallback;
    }
  }

  container.querySelectorAll('.diary-cal__nav').forEach((btn) => {
    btn.addEventListener('click', () => {
      viewMonth.setMonth(viewMonth.getMonth() + Number(btn.dataset.dir));
      renderCalendar();
    });
  });

  composer.addEventListener('submit', async (e) => {
    e.preventDefault();
    const textarea = composer.querySelector('textarea');
    const body = textarea.value.trim();
    if (!body) return;

    const submitBtn = composer.querySelector('button');
    submitBtn.disabled = true;

    try {
      const entry = await hubApi.addDiaryEntry({ entryDate: selectedDate, body, mood: selectedMood });
      if (destroyed) return;
      analytics.track(EVENTS.DIARY_ENTRY_ADDED, { entryDate: selectedDate });
      entries = [entry, ...entries].sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
      textarea.value = '';
      renderCalendar();
      renderList();
    } catch {
      // leave composer filled so she can retry
    } finally {
      submitBtn.disabled = false;
    }
  });

  return {
    start() {
      renderMoodPicker();
      updateComposerDate();
      loadEntries();
      loadAiPrompt();
    },
    destroy() {
      destroyed = true;
    },
  };
}
