import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { applyCoverBackground } from '../utils/photos.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ['00', '15', '30', '45'];
const AMPM = ['AM', 'PM'];
const WHEEL_ITEM_H = 40;
const FILLABLE_SLOTS = 2;
const ITINERARY_SLOT = 2;
const DRAG_THRESHOLD = 8;

function newActivityId() {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toIsoDate(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function formatDisplayDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDisplayTime(hour12, minute, ampm) {
  return `${hour12}:${minute} ${ampm}`;
}

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics, confetti: import('../core/Confetti.js').Confetti }} services */
export function createDatePlannerScreen({ manager, analytics, confetti }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--planner';

  element.innerHTML = `
    <div class="planner-welcome">
      <div class="planner-welcome__bg photo-slot photo-slot--empty" aria-hidden="true"></div>
      <div class="planner-welcome__overlay" aria-hidden="true"></div>
      <div class="planner-welcome__content">
        <p class="planner-welcome__eyebrow">${CONFIG.plannerWelcomeEyebrow}</p>
        <h2 class="planner-welcome__title">${CONFIG.plannerWelcomeTitle}</h2>
        <p class="planner-welcome__sub">${CONFIG.plannerWelcomeSub}</p>
        <button type="button" class="btn btn--primary planner-welcome__btn">${CONFIG.plannerWelcomeBtn}</button>
      </div>
    </div>
    <div class="planner-lockin" hidden>
      <div class="planner-lockin__backdrop"></div>
      <div class="planner-lockin__panel screen-card">
        <h3 class="planner-lockin__title">${CONFIG.plannerLockInTitle}</h3>
        <p class="planner-lockin__prompt">${CONFIG.plannerLockInPrompt}</p>
        <input
          type="text"
          class="planner-lockin__input"
          autocomplete="off"
          spellcheck="false"
          placeholder="${CONFIG.plannerLockInPlaceholder}"
        />
        <p class="planner-lockin__error" hidden>${CONFIG.plannerLockInError}</p>
        <button type="button" class="btn btn--primary planner-lockin__submit">Seal it 💌</button>
      </div>
    </div>
    <div class="planner-layout">
      <div class="planner-palette">
        <header class="planner-palette__head">
          <p class="planner-palette__label">${CONFIG.plannerPaletteTitle}</p>
          <p class="planner-palette__hint"></p>
        </header>
        <div class="planner-palette__body">
          <div class="planner-when-card planner-card">
            <div class="planner-date-section">
              <p class="planner-when-card__section">Drag a day onto the board →</p>
              <div class="planner-cal">
                <div class="planner-cal__header">
                  <button type="button" class="planner-cal__nav" data-dir="prev" aria-label="Previous month">‹</button>
                  <h3 class="planner-cal__title"></h3>
                  <button type="button" class="planner-cal__nav" data-dir="next" aria-label="Next month">›</button>
                </div>
                <div class="planner-cal__weekdays"></div>
                <div class="planner-cal__grid"></div>
              </div>
            </div>
            <div class="planner-time-section" hidden>
              <p class="planner-when-card__section">Now pick a time</p>
              <div class="planner-time">
                <div class="planner-time__wheels">
                  <div class="planner-wheel" data-wheel="hour"></div>
                  <div class="planner-wheel" data-wheel="min"></div>
                  <div class="planner-wheel" data-wheel="ampm"></div>
                </div>
                <p class="planner-time__preview"></p>
              </div>
              <button type="button" class="btn btn--primary planner-time__next">Next →</button>
            </div>
          </div>
          <div class="planner-palette__extras"></div>
        </div>
        <div class="planner-palette__tokens"></div>
      </div>
      <aside class="planner-board">
        <p class="planner-board__title">The plan</p>
        <div class="planner-board__slots"></div>
        <div class="planner-board__finale">
          <button type="button" class="btn btn--primary planner-board__stamp" hidden>${CONFIG.plannerConfirmBtn}</button>
          <div class="planner-board__reveal">
            <p class="planner-board__reveal-text">${CONFIG.plannerDateReveal}</p>
            <button type="button" class="btn btn--primary planner-board__flowers">${CONFIG.plannerFlowersCta}</button>
          </div>
        </div>
      </aside>
    </div>
  `;

  const welcome = element.querySelector('.planner-welcome');
  const welcomeBg = element.querySelector('.planner-welcome__bg');
  const welcomeBtn = element.querySelector('.planner-welcome__btn');
  const lockInEl = element.querySelector('.planner-lockin');
  const lockInInput = element.querySelector('.planner-lockin__input');
  const lockInError = element.querySelector('.planner-lockin__error');
  const lockInSubmit = element.querySelector('.planner-lockin__submit');
  const lockInBackdrop = element.querySelector('.planner-lockin__backdrop');
  const paletteHint = element.querySelector('.planner-palette__hint');
  const dateSection = element.querySelector('.planner-date-section');
  const timeSection = element.querySelector('.planner-time-section');
  const timePreview = element.querySelector('.planner-time__preview');
  const timeNextBtn = element.querySelector('.planner-time__next');
  const timeWheels = element.querySelector('.planner-time__wheels');
  const paletteExtras = element.querySelector('.planner-palette__extras');
  const tokenTray = element.querySelector('.planner-palette__tokens');
  const calTitle = element.querySelector('.planner-cal__title');
  const calGrid = element.querySelector('.planner-cal__grid');
  const calWeekdays = element.querySelector('.planner-cal__weekdays');
  const slotsWrap = element.querySelector('.planner-board__slots');
  const board = element.querySelector('.planner-board');
  const stampBtn = element.querySelector('.planner-board__stamp');
  const revealEl = element.querySelector('.planner-board__reveal');
  const flowersBtn = element.querySelector('.planner-board__flowers');

  WEEKDAYS.forEach((d) => {
    const span = document.createElement('span');
    span.textContent = d;
    calWeekdays.appendChild(span);
  });

  /** @type {HTMLElement[]} */
  const slotEls = [];
  CONFIG.plannerSteps.forEach((label, i) => {
    const slot = document.createElement('div');
    slot.className = 'planner-slot';
    slot.dataset.slot = String(i);

    if (i === ITINERARY_SLOT) {
      slot.innerHTML = `
        <div class="planner-slot__header">
          <span class="planner-slot__num">${pad2(i + 1)}</span>
          <span class="planner-slot__label">${label}</span>
        </div>
        <div class="planner-itinerary" data-drop-slot="${i}">
          <div class="planner-itinerary__list"></div>
          <p class="planner-itinerary__hint">${CONFIG.plannerItineraryHint}</p>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <div class="planner-slot__header">
          <span class="planner-slot__num">${pad2(i + 1)}</span>
          <span class="planner-slot__label">${label}</span>
        </div>
        <div class="planner-slot__drop" data-drop-slot="${i}">
          <span class="planner-slot__placeholder">drop here</span>
          <div class="planner-slot__filled"></div>
        </div>
      `;
    }

    slotsWrap.appendChild(slot);
    slotEls.push(slot);
  });

  const state = {
    viewMonth: new Date(),
    selectedDate: null,
    hour12: '7',
    minute: '00',
    ampm: 'PM',
    activities: /** @type {{ id: string, moodId: string, place: string, emoji: string, moodLabel?: string }[]} */ ([]),
    filled: [false, false],
    stamped: false,
  };

  let drag = null;

  function whenComplete() {
    return state.filled[0] && state.filled[1];
  }

  function canLockIn() {
    return whenComplete() && state.activities.length >= 1 && !state.stamped;
  }

  function canDropOnSlot(slotIndex, payload) {
    if (state.stamped) return false;
    if (payload.type === 'date' && slotIndex === 0) return Boolean(payload.iso) && !state.filled[0];
    if (payload.type === 'activity' && slotIndex === ITINERARY_SLOT) return whenComplete();
    return false;
  }

  function nextOpenSlot() {
    if (!state.filled[0]) return 0;
    if (!state.filled[1]) return 1;
    if (state.activities.length === 0) return ITINERARY_SLOT;
    if (!state.stamped) return 3;
    return 3;
  }

  function updateTimePreview() {
    timePreview.textContent = formatDisplayTime(state.hour12, state.minute, state.ampm);
  }

  function updateBoard() {
    const open = nextOpenSlot();

    slotEls.forEach((slot, i) => {
      const isItinerary = i === ITINERARY_SLOT;
      const filled =
        i === 0
          ? state.filled[0]
          : i === 1
            ? state.filled[1]
            : isItinerary
              ? state.activities.length > 0
              : state.stamped;

      const canAccept =
        (i === 0 && !state.filled[0]) ||
        (isItinerary && whenComplete() && !state.stamped);

      slot.classList.toggle('planner-slot--filled', Boolean(filled));
      slot.classList.toggle('planner-slot--active', i === open && !state.stamped);
      slot.classList.toggle('planner-slot--ready', canAccept && i !== open);
      slot.classList.toggle('planner-slot--locked', i > open && !filled && !isItinerary);

      if (isItinerary) {
        renderItinerary();
        return;
      }

      const filledEl = slot.querySelector('.planner-slot__filled');
      if (i === 0 && state.filled[0] && state.selectedDate) {
        filledEl.textContent = `📅 ${formatDisplayDate(state.selectedDate)}`;
      } else if (i === 1 && state.filled[1]) {
        filledEl.textContent = `🕐 ${formatDisplayTime(state.hour12, state.minute, state.ampm)}`;
      } else if (i === 3 && state.stamped) {
        filledEl.textContent = '💕 Official.';
      } else if (!filled) {
        filledEl.textContent = '';
      }
    });

    const progressSteps = (state.filled[0] ? 1 : 0) + (state.filled[1] ? 1 : 0) + (state.activities.length ? 1 : 0);
    board.style.setProperty('--board-progress', String(progressSteps / 3));
    stampBtn.hidden = !canLockIn();
    revealEl.classList.toggle('planner-board__reveal--visible', state.stamped);
    board.classList.toggle('planner-board--complete', state.stamped);
  }

  function renderItinerary() {
    const slot = slotEls[ITINERARY_SLOT];
    const list = slot.querySelector('.planner-itinerary__list');
    const hint = slot.querySelector('.planner-itinerary__hint');
    const zone = slot.querySelector('.planner-itinerary');
    if (!list || !hint || !zone) return;

    list.innerHTML = '';
    state.activities.forEach((act, idx) => {
      const card = document.createElement('div');
      card.className = 'planner-activity';
      card.dataset.idx = String(idx);
      card.innerHTML = `
        <button type="button" class="planner-activity__grab" aria-label="Drag to reorder">⋮⋮</button>
        <span class="planner-activity__emoji">${act.emoji}</span>
        <div class="planner-activity__body">
          <span class="planner-activity__place">${act.place}</span>
          ${act.moodLabel ? `<span class="planner-activity__mood">${act.moodLabel}</span>` : ''}
        </div>
        <button type="button" class="planner-activity__remove" aria-label="Remove">×</button>
      `;

      card.querySelector('.planner-activity__remove')?.addEventListener('click', (e) => {
        e.stopPropagation();
        removeActivity(idx);
      });
      card.querySelector('.planner-activity__grab')?.addEventListener('pointerdown', (e) => {
        beginReorder(e, idx, card);
      });

      list.appendChild(card);
    });

    hint.hidden = state.activities.length > 0;
    zone.classList.toggle('planner-itinerary--has-items', state.activities.length > 0);
    slot.classList.toggle('planner-slot--filled', state.activities.length > 0);
  }

  function removeActivity(idx) {
    if (state.stamped) return;
    state.activities.splice(idx, 1);
    analytics.track(EVENTS.DATE_PLANNER_STEP, { action: 'remove', idx, ...getPayload() });
    updatePalette();
  }

  function showTimePhase() {
    dateSection.classList.add('planner-date-section--done');
    timeSection.hidden = false;
    requestAnimationFrame(() => {
      timeSection.classList.add('planner-time-section--visible');
      timeWheels.classList.add('planner-time__wheels--enter');
    });
    updateTimePreview();
    syncWheels();
  }

  function updatePalette() {
    const open = nextOpenSlot();
    paletteHint.textContent = CONFIG.plannerSlotHints[Math.min(open, CONFIG.plannerSlotHints.length - 1)] || '';

    if (!state.filled[0]) {
      dateSection.classList.remove('planner-date-section--done');
      timeSection.hidden = true;
      timeSection.classList.remove('planner-time-section--visible');
      timeWheels.classList.remove('planner-time__wheels--enter', 'planner-time__wheels--confirm');
      renderCalendar();
    } else if (!state.filled[1]) {
      if (timeSection.hidden) showTimePhase();
    } else {
      dateSection.classList.add('planner-date-section--done');
      timeSection.hidden = true;
    }

    paletteExtras.innerHTML = '';
    paletteExtras.hidden = true;

    if (whenComplete() && !state.stamped) {
      paletteExtras.hidden = false;
      paletteExtras.innerHTML =
        state.activities.length === 0
          ? `<p class="planner-panel__prompt">${CONFIG.plannerActivityPrompt}</p>`
          : `<p class="planner-palette__done">Looking good! Add more or lock it in on the right →</p>`;
    }

    refreshTokens();
    updateBoard();
  }

  function refreshTokens() {
    tokenTray.innerHTML = '';

    if (whenComplete() && !state.stamped) {
      CONFIG.dateMoods.forEach((mood) => {
        (CONFIG.datePlaces[mood.id] || []).forEach((place) => {
          tokenTray.appendChild(
            makeToken({
              slot: ITINERARY_SLOT,
              emoji: mood.emoji,
              label: place,
              sub: mood.label,
              payload: { type: 'activity', moodId: mood.id, place, emoji: mood.emoji },
            })
          );
        });
      });
    }
  }

  function makeToken({ slot, emoji, label, sub, payload }) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'planner-token';
    el.dataset.targetSlot = String(slot);
    el.innerHTML = `<span class="planner-token__emoji">${emoji}</span><span class="planner-token__body"><span class="planner-token__label">${label}</span><span class="planner-token__sub">${sub}</span></span>`;
    el.addEventListener('pointerdown', (e) => beginDrag(e, el, payload));
    el.addEventListener('click', () => {
      if (el.dataset.dragged === '1') return;
      if (canDropOnSlot(slot, payload)) placeInSlot(slot, payload);
    });
    return el;
  }

  function buildWheel(col, values, getSelected, onPick) {
    if (!col || col.dataset.built === '1') return;
    col.dataset.built = '1';
    col.innerHTML = `
      <div class="planner-wheel__highlight"></div>
      <div class="planner-wheel__scroll"></div>
    `;
    const scroll = col.querySelector('.planner-wheel__scroll');
    const pad = document.createElement('div');
    pad.className = 'planner-wheel__pad';
    scroll.appendChild(pad);
    values.forEach((val) => {
      const item = document.createElement('div');
      item.className = 'planner-wheel__item';
      item.textContent = val;
      item.dataset.value = val;
      scroll.appendChild(item);
    });
    scroll.appendChild(pad.cloneNode(true));

    const sync = () => {
      const idx = Math.round(scroll.scrollTop / WHEEL_ITEM_H);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      scroll.scrollTop = clamped * WHEEL_ITEM_H;
      const val = values[clamped];
      scroll.querySelectorAll('.planner-wheel__item').forEach((item) => {
        item.classList.toggle('planner-wheel__item--selected', item.dataset.value === val);
      });
      onPick(val);
      updateTimePreview();
    };

    scroll.addEventListener('scroll', () => {
      clearTimeout(scroll._snapTimer);
      scroll._snapTimer = setTimeout(sync, 60);
    });
    requestAnimationFrame(() => {
      const startIdx = values.indexOf(getSelected());
      scroll.scrollTop = (startIdx >= 0 ? startIdx : 0) * WHEEL_ITEM_H;
      sync();
    });
  }

  function initWheels() {
    buildWheel(element.querySelector('[data-wheel="hour"]'), HOURS, () => state.hour12, (v) => {
      state.hour12 = v;
    });
    buildWheel(element.querySelector('[data-wheel="min"]'), MINUTES, () => state.minute, (v) => {
      state.minute = v;
    });
    buildWheel(element.querySelector('[data-wheel="ampm"]'), AMPM, () => state.ampm, (v) => {
      state.ampm = v;
    });
  }

  function syncWheels() {
    [
      { sel: '[data-wheel="hour"]', values: HOURS, val: state.hour12 },
      { sel: '[data-wheel="min"]', values: MINUTES, val: state.minute },
      { sel: '[data-wheel="ampm"]', values: AMPM, val: state.ampm },
    ].forEach(({ sel, values, val }) => {
      const scroll = element.querySelector(`${sel} .planner-wheel__scroll`);
      const idx = values.indexOf(val);
      if (scroll && idx >= 0) scroll.scrollTop = idx * WHEEL_ITEM_H;
    });
    updateTimePreview();
  }

  function renderCalendar() {
    const y = state.viewMonth.getFullYear();
    const m = state.viewMonth.getMonth();
    calTitle.textContent = `${MONTHS[m]} ${y}`;
    calGrid.innerHTML = '';

    const first = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = 0; i < first; i++) {
      const empty = document.createElement('span');
      empty.className = 'planner-cal__day planner-cal__day--empty';
      calGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'planner-cal__day planner-cal__day--draggable';
      btn.textContent = String(day);
      const iso = toIsoDate(y, m, day);
      const cellDate = new Date(y, m, day);
      const isPast = cellDate < today;
      if (isPast) {
        btn.classList.add('planner-cal__day--past');
        btn.disabled = true;
      }
      if (iso === todayIso) btn.classList.add('planner-cal__day--today');
      btn.dataset.iso = iso;

      if (!isPast && !state.filled[0]) {
        btn.addEventListener('pointerdown', (e) => {
          beginDrag(e, btn, { type: 'date', iso });
        });
      }

      calGrid.appendChild(btn);
    }
  }

  function beginDrag(e, el, payload) {
    if (state.stamped) return;
    if (payload.type === 'date' && state.filled[0]) return;
    if (payload.type === 'activity' && !whenComplete()) return;

    e.preventDefault();
    const r = el.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className =
      payload.type === 'date' ? 'planner-cal__day planner-cal__day--ghost' : 'planner-token planner-token--ghost';
    ghost.textContent = payload.type === 'date' ? el.textContent : '';
    if (payload.type !== 'date') {
      ghost.innerHTML = el.innerHTML;
      ghost.style.width = `${r.width}px`;
    } else {
      ghost.style.width = `${r.width}px`;
      ghost.style.height = `${r.height}px`;
    }
    document.body.appendChild(ghost);

    drag = {
      el,
      payload,
      ghost,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - r.left - r.width / 2,
      offsetY: e.clientY - r.top - r.height / 2,
      moved: false,
    };

    if (payload.type === 'date') el.classList.add('planner-cal__day--dragging');
    else el.dataset.dragged = '0';

    positionGhost(e.clientX, e.clientY);
    document.body.classList.add('planner-dragging');
  }

  function positionGhost(x, y) {
    if (!drag?.ghost) return;
    drag.ghost.style.left = `${x - drag.offsetX}px`;
    drag.ghost.style.top = `${y - drag.offsetY}px`;
  }

  function onPointerMove(e) {
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > DRAG_THRESHOLD) {
      drag.moved = true;
    }
    positionGhost(e.clientX, e.clientY);

    slotEls.forEach((slot, i) => {
      const over =
        i === ITINERARY_SLOT ? isOverItinerary(e.clientX, e.clientY) : isOverSlot(slot, e.clientX, e.clientY);
      const valid =
        drag.type === 'reorder'
          ? i === ITINERARY_SLOT
          : canDropOnSlot(i, drag.payload);
      slot.classList.toggle('planner-slot--hover', over && valid);
      slot.classList.toggle('planner-slot--hover-bad', over && !valid && (i === 0 || i === ITINERARY_SLOT));
    });

    if (drag.type === 'reorder') {
      highlightReorderTarget(e.clientY);
    }
  }

  function highlightReorderTarget(clientY) {
    const list = slotEls[ITINERARY_SLOT].querySelector('.planner-itinerary__list');
    if (!list) return;
    list.querySelectorAll('.planner-activity').forEach((card) => {
      const r = card.getBoundingClientRect();
      const over = clientY >= r.top && clientY <= r.bottom;
      card.classList.toggle('planner-activity--drop-target', over);
    });
  }

  function beginReorder(e, fromIdx, card) {
    if (state.stamped) return;
    e.preventDefault();
    e.stopPropagation();

    const r = card.getBoundingClientRect();
    const ghost = card.cloneNode(true);
    ghost.classList.add('planner-activity--ghost');
    ghost.style.width = `${r.width}px`;
    document.body.appendChild(ghost);

    drag = {
      type: 'reorder',
      fromIdx,
      ghost,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - r.left - r.width / 2,
      offsetY: e.clientY - r.top - r.height / 2,
      moved: false,
    };

    card.classList.add('planner-activity--dragging');
    positionGhost(e.clientX, e.clientY);
    document.body.classList.add('planner-dragging');
  }

  function onPointerUp(e) {
    if (!drag) return;

    const { ghost, moved } = drag;
    ghost.remove();
    document.querySelectorAll('.planner-activity--dragging, .planner-activity--drop-target').forEach((el) => {
      el.classList.remove('planner-activity--dragging', 'planner-activity--drop-target');
    });
    slotEls.forEach((s) => s.classList.remove('planner-slot--hover', 'planner-slot--hover-bad'));

    if (drag.type === 'reorder') {
      const toIdx = findReorderTargetIndex(e.clientY);
      if (toIdx >= 0 && toIdx !== drag.fromIdx) {
        const [item] = state.activities.splice(drag.fromIdx, 1);
        const insertAt = toIdx > drag.fromIdx ? toIdx - 1 : toIdx;
        state.activities.splice(insertAt, 0, item);
        analytics.track(EVENTS.DATE_PLANNER_STEP, { action: 'reorder', from: drag.fromIdx, to: insertAt, ...getPayload() });
        renderItinerary();
        updateBoard();
      }
    } else {
      const { el, payload } = drag;
      el.classList?.remove('planner-cal__day--dragging');
      const target = findDropSlot(e.clientX, e.clientY, payload);
      if ((moved || payload.type === 'date') && target >= 0) {
        placeInSlot(target, payload);
      }
    }

    drag = null;
    document.body.classList.remove('planner-dragging');
  }

  function findReorderTargetIndex(clientY) {
    const cards = [...slotEls[ITINERARY_SLOT].querySelectorAll('.planner-activity')];
    if (!cards.length) return -1;
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (clientY < mid) return Number(card.dataset.idx);
    }
    return cards.length - 1;
  }

  function findDropSlot(x, y, payload) {
    if (payload.type === 'date' && canDropOnSlot(0, payload) && isOverSlot(slotEls[0], x, y)) {
      return 0;
    }
    if (payload.type === 'activity' && canDropOnSlot(ITINERARY_SLOT, payload) && isOverItinerary(x, y)) {
      return ITINERARY_SLOT;
    }
    return -1;
  }

  function isOverItinerary(x, y) {
    const zone = slotEls[ITINERARY_SLOT]?.querySelector('.planner-itinerary');
    if (!zone) return false;
    const r = zone.getBoundingClientRect();
    const pad = 16;
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  }

  function isOverSlot(slot, x, y) {
    const drop = slot.querySelector('.planner-slot__drop');
    if (!drop) return false;
    const r = drop.getBoundingClientRect();
    const pad = 20;
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  }

  function placeInSlot(slotIndex, payload) {
    if (!canDropOnSlot(slotIndex, payload)) return;

    if (payload.type === 'date') {
      state.selectedDate = payload.iso;
      state.filled[0] = true;
      slotEls[slotIndex].classList.add('planner-slot--pop');
      setTimeout(() => slotEls[slotIndex].classList.remove('planner-slot--pop'), 500);
    } else if (payload.type === 'activity') {
      const mood = CONFIG.dateMoods.find((m) => m.id === payload.moodId);
      state.activities.push({
        id: newActivityId(),
        moodId: payload.moodId,
        place: payload.place,
        emoji: payload.emoji,
        moodLabel: mood?.label,
      });
      slotEls[ITINERARY_SLOT].classList.add('planner-slot--pop');
      setTimeout(() => slotEls[ITINERARY_SLOT].classList.remove('planner-slot--pop'), 500);
    } else return;

    analytics.track(EVENTS.DATE_PLANNER_STEP, { step: slotIndex, ...getPayload() });
    confetti.burst(70);
    updatePalette();
  }

  function confirmTime() {
    if (state.filled[1] || !state.filled[0]) return;

    timeWheels.classList.add('planner-time__wheels--confirm');
    state.filled[1] = true;

    slotEls[1].classList.add('planner-slot--pop');
    setTimeout(() => slotEls[1].classList.remove('planner-slot--pop'), 500);

    analytics.track(EVENTS.DATE_PLANNER_STEP, { step: 1, ...getPayload() });
    confetti.burst(90);

    lc.trackTimeout(
      setTimeout(() => {
        timeWheels.classList.remove('planner-time__wheels--confirm');
        updatePalette();
      }, 550)
    );
  }

  function getPayload() {
    return {
      selectedDate: state.selectedDate,
      selectedTime: formatDisplayTime(state.hour12, state.minute, state.ampm),
      activities: state.activities.map(({ moodId, place, emoji, moodLabel }) => ({
        moodId,
        place,
        emoji,
        moodLabel,
      })),
    };
  }

  function normalizeLockIn(text) {
    return text
      .toLowerCase()
      .replace(/[''']/g, "'")
      .replace(/[^\w\s',]/g, '')
      .trim();
  }

  function isLockInValid(text) {
    const n = normalizeLockIn(text);
    return n.includes('sure') && n.includes('let') && n.includes('go');
  }

  function openLockIn() {
    if (!canLockIn()) return;
    lockInEl.hidden = false;
    lockInInput.value = '';
    lockInError.hidden = true;
    lockInInput.focus();
  }

  function closeLockIn() {
    lockInEl.hidden = true;
    lockInError.hidden = true;
  }

  async function submitLockIn() {
    if (!isLockInValid(lockInInput.value)) {
      lockInError.hidden = false;
      lockInInput.focus();
      return;
    }

    closeLockIn();
    await stampDate();
    sessionStorage.setItem('exploration.datePlan', JSON.stringify(getPayload()));
    analytics.track(EVENTS.MANUAL_CONTINUE, {
      from: SCREENS.DATE_PLANNER,
      to: SCREENS.CELEBRATION,
      reply: lockInInput.value.trim(),
    });
    manager.goTo(SCREENS.CELEBRATION);
  }

  async function stampDate() {
    state.stamped = true;
    confetti.burst();
    updateBoard();

    try {
      await analytics.confirmDate(getPayload());
    } catch (err) {
      console.warn('[DatePlanner] Failed to save confirmation', err);
    }
  }

  function resetState() {
    state.viewMonth = new Date();
    state.selectedDate = null;
    state.hour12 = '7';
    state.minute = '00';
    state.ampm = 'PM';
    state.activities = [];
    state.filled = [false, false];
    state.stamped = false;
    welcome.classList.remove('planner-welcome--dismissed');
    dateSection.classList.remove('planner-date-section--done');
    timeSection.hidden = true;
    timeSection.classList.remove('planner-time-section--visible');
    timeWheels.classList.remove('planner-time__wheels--enter', 'planner-time__wheels--confirm');
    drag = null;
    document.body.classList.remove('planner-dragging');
    closeLockIn();
  }

  lc.bindListener(welcomeBtn, 'click', () => {
    welcome.classList.add('planner-welcome--dismissed');
    confetti.burst();
  });

  lc.bindListener(element, 'click', (e) => {
    const nav = e.target.closest('.planner-cal__nav');
    if (!nav || state.filled[0]) return;
    const dir = nav.dataset.dir === 'prev' ? -1 : 1;
    state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + dir, 1);
    renderCalendar();
  });

  lc.bindListener(timeNextBtn, 'click', confirmTime);
  lc.bindListener(stampBtn, 'click', openLockIn);
  lc.bindListener(lockInSubmit, 'click', submitLockIn);
  lc.bindListener(lockInBackdrop, 'click', closeLockIn);
  lc.bindListener(lockInInput, 'keydown', (e) => {
    if (e.key === 'Enter') submitLockIn();
    if (e.key === 'Escape') closeLockIn();
  });
  lc.bindListener(flowersBtn, 'click', () => {
    analytics.track(EVENTS.MANUAL_CONTINUE, { from: SCREENS.DATE_PLANNER, to: SCREENS.BOUQUET });
    manager.goTo(SCREENS.BOUQUET);
  });

  lc.bindListener(document, 'pointermove', onPointerMove);
  lc.bindListener(document, 'pointerup', onPointerUp);
  lc.bindListener(document, 'pointercancel', onPointerUp);

  initWheels();

  return {
    element,
    onEnter() {
      lc.reset();
      resetState();
      renderCalendar();
      syncWheels();
      updatePalette();
      if (CONFIG.photos?.plannerAccent && welcomeBg) {
        applyCoverBackground(welcomeBg, CONFIG.photos.plannerAccent);
      }
    },
    onExit() {
      drag?.ghost?.remove();
      drag = null;
      document.body.classList.remove('planner-dragging');
      lc.reset();
    },
  };
}
