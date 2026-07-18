import '../admin/admin.css';
import {
  fetchSessions,
  fetchSessionDetail,
  fetchEventStats,
  fetchConfirmations,
  fetchHealth,
} from './api.js';
import { eventLabel, screenLabel, eventTone } from './labels.js';

/** @typedef {object} SessionRow
 * @property {string} id
 * @property {string} started_at
 * @property {string | null} ended_at
 * @property {number} completed
 * @property {string | null} last_screen_id
 * @property {number} event_count
 * @property {string | null} date_confirmed_at
 */

const root = document.querySelector('#admin-app');
/** @type {string | null} */
let selectedId = null;
let autoRefresh = false;
/** @type {ReturnType<typeof setInterval> | null} */
let refreshTimer = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/** @param {string} iso */
function fmtTime(iso) {
  if (!iso) return 'Not set';
  try {
    return new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`).toLocaleString();
  } catch {
    return iso;
  }
}

/** @param {string | null} raw */
function parsePayload(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** @param {unknown[]} activities */
function formatActivitiesList(activities) {
  if (!Array.isArray(activities) || !activities.length) return '';
  return activities
    .map((raw, i) => {
      const a = /** @type {Record<string, string>} */ (raw);
      const emoji = a.emoji || '📍';
      const place = a.place || 'Unknown spot';
      const mood = a.moodLabel ? ` (${a.moodLabel})` : '';
      return `<li>${i + 1}. ${emoji} ${escapeHtml(place)}${escapeHtml(mood)}</li>`;
    })
    .join('');
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {object[]} events */
function extractDatePlan(events) {
  /** @type {{ selectedDate?: string, selectedTime?: string, activities?: unknown[], reply?: string } | null} */
  let plan = null;

  for (const ev of events) {
    if (ev.event_type !== 'date_confirm' && ev.event_type !== 'date_planner_step') continue;
    const p = parsePayload(ev.payload);
    if (!p || typeof p !== 'object') continue;
    const payload = /** @type {Record<string, unknown>} */ (p);
    if (!payload.selectedDate) continue;

    plan = {
      selectedDate: String(payload.selectedDate),
      selectedTime: payload.selectedTime ? String(payload.selectedTime) : undefined,
      activities: Array.isArray(payload.activities) ? payload.activities : plan?.activities,
    };
  }

  const lockIn = events.find((ev) => {
    if (ev.event_type !== 'manual_continue') return false;
    const p = parsePayload(ev.payload);
    return p && typeof p === 'object' && /** @type {Record<string, unknown>} */ (p).from === 'date-planner';
  });
  if (lockIn) {
    const p = parsePayload(lockIn.payload);
    if (p && typeof p === 'object' && /** @type {Record<string, unknown>} */ (p).reply) {
      plan = { ...plan, reply: String(/** @type {Record<string, unknown>} */ (p).reply) };
    }
  }

  return plan;
}

/** @param {unknown} payload */
function payloadSummary(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const parts = [];
  const p = /** @type {Record<string, unknown>} */ (payload);
  if (p.to) parts.push(`→ ${screenLabel(String(p.to))}`);
  if (p.gameId) parts.push(`game: ${p.gameId}`);
  if (p.gameName) parts.push(String(p.gameName));
  if (p.choice) parts.push(`picked: ${p.choice}`);
  if (p.selectedDate && p.selectedTime) parts.push(`${p.selectedDate} @ ${p.selectedTime}`);
  if (Array.isArray(p.activities) && p.activities.length) {
    const stops = p.activities
      .map((raw) => {
        const a = /** @type {Record<string, string>} */ (raw);
        return `${a.emoji || '📍'} ${a.place || '?'}`;
      })
      .join(' → ');
    parts.push(stops);
  }
  if (typeof p.xPct === 'number' && typeof p.yPct === 'number') {
    parts.push(`@${p.xPct}%, ${p.yPct}%`);
  }
  if (p.tag) parts.push(`<${p.tag}>`);
  if (p.text) parts.push(`"${p.text}"`);
  if (p.cls) parts.push(`.${p.cls}`);
  if (typeof p.caught === 'number') parts.push(`${p.caught} hearts`);
  if (typeof p.enabled === 'boolean') parts.push(p.enabled ? 'on' : 'off');
  if (typeof p.cardIndex === 'number') parts.push(`card #${p.cardIndex + 1}`);
  return parts.join(' · ');
}

function renderShell() {
  root.innerHTML = `
    <div class="admin">
      <header class="admin__header">
        <div>
          <h1 class="admin__title">Exploration Admin</h1>
          <p class="admin__subtitle">Session replay &amp; analytics</p>
        </div>
        <div class="admin__actions">
          <label class="toggle">
            <input type="checkbox" id="auto-refresh" />
            Auto-refresh (30s)
          </label>
          <button type="button" class="btn btn--primary" id="refresh-btn">↻ Refresh</button>
        </div>
      </header>
      <div id="admin-error"></div>
      <div id="admin-stats" class="admin__stats"></div>
      <div class="admin__layout">
        <section class="panel">
          <div class="panel__head">
            <span>Sessions</span>
            <span id="session-count" class="badge">0</span>
          </div>
          <div class="panel__body">
            <ul id="session-list" class="session-list"></ul>
          </div>
        </section>
        <section class="panel">
          <div class="panel__head">Timeline</div>
          <div id="session-detail" class="panel__body panel__body--timeline">
            <div class="detail-empty">Select a session to see every moment 👈</div>
          </div>
        </section>
      </div>
      <section class="panel top-events">
        <div class="panel__head">Top events (all time)</div>
        <ul id="top-events" class="top-events__list"></ul>
      </section>
      <footer class="admin__footer">
        <a href="/">← Back to the experience</a>
      </footer>
    </div>
  `;

  root.querySelector('#refresh-btn')?.addEventListener('click', () => load());
  root.querySelector('#auto-refresh')?.addEventListener('change', (e) => {
    autoRefresh = /** @type {HTMLInputElement} */ (e.target).checked;
    if (autoRefresh) {
      refreshTimer = setInterval(load, 30_000);
    } else if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  });
}

/** @param {SessionRow[]} sessions @param {object[]} confirmations @param {object} stats */
function renderStats(sessions, confirmations, stats) {
  const completed = sessions.filter((s) => s.completed).length;
  const totalEvents = stats.byType?.reduce((n, r) => n + r.count, 0) ?? 0;

  const statsEl = root.querySelector('#admin-stats');
  if (!statsEl) return;

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-card__value">${sessions.length}</div>
      <div class="stat-card__label">Sessions</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value">${completed}</div>
      <div class="stat-card__label">Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value">${confirmations.length}</div>
      <div class="stat-card__label">Date picks</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__value">${totalEvents}</div>
      <div class="stat-card__label">Total events</div>
    </div>
  `;

  const topEl = root.querySelector('#top-events');
  if (topEl && stats.byType) {
    topEl.innerHTML = stats.byType
      .slice(0, 12)
      .map(
        (row) =>
          `<li class="top-events__chip"><strong>${row.count}</strong> ${eventLabel(row.event_type)}</li>`
      )
      .join('');
  }
}

/** @param {SessionRow[]} sessions */
function renderSessionList(sessions) {
  const list = root.querySelector('#session-list');
  const count = root.querySelector('#session-count');
  if (!list) return;

  if (count) count.textContent = String(sessions.length);

  if (!sessions.length) {
    list.innerHTML = '<li class="detail-empty">No sessions yet! Share the site first 💌</li>';
    return;
  }

  list.innerHTML = '';
  sessions.forEach((s) => {
    const li = document.createElement('li');
    const btn = el('button', `session-item${s.id === selectedId ? ' session-item--active' : ''}`);
    btn.type = 'button';
    btn.dataset.sessionId = s.id;

    btn.appendChild(el('div', 'session-item__time', fmtTime(s.started_at)));

    const meta = el('div', 'session-item__meta');
    meta.innerHTML = `
      <span class="badge">${s.event_count} events</span>
      ${s.completed ? '<span class="badge badge--done">Done</span>' : '<span class="badge badge--live">In progress</span>'}
      ${s.last_screen_id ? `<span class="badge">${screenLabel(s.last_screen_id)}</span>` : ''}
    `;
    btn.appendChild(meta);

    btn.addEventListener('click', () => selectSession(s.id));
    li.appendChild(btn);
    list.appendChild(li);
  });
}

/** @param {string} sessionId */
async function selectSession(sessionId) {
  selectedId = sessionId;
  const detailEl = root.querySelector('#session-detail');
  if (!detailEl) return;

  detailEl.innerHTML = '<div class="admin__loading">Loading timeline…</div>';

  try {
    const data = await fetchSessionDetail(sessionId);
    renderSessionDetail(data);
    // refresh list highlight
    root.querySelectorAll('.session-item').forEach((btn) => {
      btn.classList.toggle('session-item--active', btn.dataset.sessionId === sessionId);
    });
  } catch (err) {
    detailEl.innerHTML = `<div class="admin__error">${err.message}</div>`;
  }
}

/** @param {{ session: object, events: object[], confirmation: object | null }} data */
function renderSessionDetail(data) {
  const detailEl = root.querySelector('#session-detail');
  if (!detailEl) return;

  const { session, events, confirmation } = data;

  let html = `
    <div class="detail-header">
      <div class="detail-header__id">${session.id}</div>
      <div class="detail-grid">
        <div class="detail-fact">
          <div class="detail-fact__label">Started</div>
          <div class="detail-fact__value">${fmtTime(session.started_at)}</div>
        </div>
        <div class="detail-fact">
          <div class="detail-fact__label">Ended</div>
          <div class="detail-fact__value">${session.ended_at ? fmtTime(session.ended_at) : 'Not set'}</div>
        </div>
        <div class="detail-fact">
          <div class="detail-fact__label">Last screen</div>
          <div class="detail-fact__value">${screenLabel(session.last_screen_id)}</div>
        </div>
        <div class="detail-fact">
          <div class="detail-fact__label">Viewport</div>
          <div class="detail-fact__value">${session.viewport_width ?? '?'}×${session.viewport_height ?? '?'}</div>
        </div>
      </div>
    </div>
  `;

  const planFromEvents = extractDatePlan(events);
  let activities = [];

  if (confirmation?.activities) {
    try {
      activities = JSON.parse(confirmation.activities);
    } catch {
      activities = [];
    }
  }
  if (!activities.length && planFromEvents?.activities?.length) {
    activities = planFromEvents.activities;
  }

  if (confirmation || planFromEvents) {
    const date = confirmation?.selected_date ?? planFromEvents?.selectedDate ?? '?';
    const time = confirmation?.selected_time ?? planFromEvents?.selectedTime ?? '?';
    const confirmedAt = confirmation?.confirmed_at;
    const reply = planFromEvents?.reply;

    html += `
      <div class="confirm-banner">
        <div class="confirm-banner__title">Her date plan 🥳</div>
        <p class="confirm-banner__when">📅 ${escapeHtml(date)} · 🕐 ${escapeHtml(time)}</p>
        ${
          activities.length
            ? `<ol class="confirm-banner__stops">${formatActivitiesList(activities)}</ol>`
            : '<p class="confirm-banner__empty">No spots picked yet (she may still be planning)</p>'
        }
        ${reply ? `<p class="confirm-banner__reply">She typed: "${escapeHtml(reply)}"</p>` : ''}
        ${confirmedAt ? `<p class="confirm-banner__meta">Confirmed ${fmtTime(confirmedAt)}</p>` : ''}
      </div>
    `;
  }

  if (!events.length) {
    html += '<p class="detail-empty">No events recorded for this session yet.</p>';
  } else {
    html += '<ol class="timeline">';
    events.forEach((ev) => {
      const tone = eventTone(ev.event_type);
      const payload = parsePayload(ev.payload);
      const extra = payloadSummary(payload);

      html += `
        <li class="timeline-item timeline-item--${tone}">
          <span class="timeline-item__dot"></span>
          <div class="timeline-item__head">
            <span class="timeline-item__label">${eventLabel(ev.event_type)}</span>
            ${ev.screen_id ? `<span class="timeline-item__screen">${screenLabel(ev.screen_id)}</span>` : ''}
            <span class="timeline-item__time">${fmtTime(ev.client_timestamp)}</span>
          </div>
          ${extra ? `<div class="timeline-item__payload" style="font-size:0.8rem;color:var(--text-light);margin-top:0.2rem">${extra}</div>` : ''}
        </li>
      `;
    });
    html += '</ol>';
  }

  detailEl.innerHTML = html;
}

function showError(message) {
  const errEl = root.querySelector('#admin-error');
  if (errEl) {
    errEl.className = 'admin__error';
    errEl.textContent = message;
  }
}

function clearError() {
  const errEl = root.querySelector('#admin-error');
  if (errEl) {
    errEl.className = '';
    errEl.textContent = '';
  }
}

async function load() {
  clearError();
  try {
    await fetchHealth();
    const [sessions, stats, confirmations] = await Promise.all([
      fetchSessions(),
      fetchEventStats(),
      fetchConfirmations(),
    ]);

    renderStats(sessions, confirmations, stats);
    renderSessionList(sessions);

    if (selectedId && sessions.some((s) => s.id === selectedId)) {
      await selectSession(selectedId);
    } else if (selectedId) {
      selectedId = null;
      const detailEl = root.querySelector('#session-detail');
      if (detailEl) {
        detailEl.innerHTML = '<div class="detail-empty">Select a session to see every moment 👈</div>';
      }
    }
  } catch (err) {
    showError(
      `Could not reach the API. Run \`npm run dev\` (starts both Vite + server). ${err.message}`
    );
  }
}

renderShell();
load();
