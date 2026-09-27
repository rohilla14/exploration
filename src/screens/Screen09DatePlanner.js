import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { applyCoverBackground } from '../utils/photos.js';
import { escapeHtml, windowBar } from '../utils/dom.js';
import {
  formatDisplayDate,
  formatDisplayTime,
  MONTHS,
  newActivityId,
  toIsoDate,
  WEEKDAYS,
} from './datePlanner/plannerUtils.js';

const MAX_STOPS = 3;
const STEPS = ['Day', 'Time', 'Vibe', 'Plan'];

/**
 * Date planner: four small steps that fill in a ticket. Tap to choose, no dragging,
 * and one button at the end. The calendar always shows every day of the month.
 * @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics, confetti: import('../core/Confetti.js').Confetti }} services
 */
export function createDatePlannerScreen({ manager, analytics, confetti }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--planner';
  element.innerHTML = `
    <div class="planner-welcome">
      <div class="planner-welcome__bg photo-slot photo-slot--empty" aria-hidden="true"></div>
      <div class="planner-welcome__overlay" aria-hidden="true"></div>
      <div class="planner-welcome__content">
        <p class="planner-welcome__eyebrow">${escapeHtml(CONFIG.plannerWelcomeEyebrow)}</p>
        <h2 class="planner-welcome__title">${escapeHtml(CONFIG.plannerWelcomeTitle)}</h2>
        <p class="planner-welcome__sub">${escapeHtml(CONFIG.plannerWelcomeSub)}</p>
        <button type="button" class="btn btn--primary planner-welcome__btn">${escapeHtml(CONFIG.plannerWelcomeBtn)}</button>
      </div>
    </div>
    <div class="dp">
      <div class="dp__win win">
        <div class="dp__body">
          <ol class="dp__steps" data-role="steps"></ol>
          <div class="dp__cols">
            <div class="dp__stage" data-role="stage"></div>
            <aside class="dp__ticket" data-role="ticket"></aside>
          </div>
          <footer class="dp__actions">
            <button type="button" class="btn btn--secondary dp__back" data-role="back">Back</button>
            <button type="button" class="btn btn--primary dp__next" data-role="next"></button>
          </footer>
        </div>
      </div>
    </div>
  `;

  const welcome = element.querySelector('.planner-welcome');
  const welcomeBg = element.querySelector('.planner-welcome__bg');
  const welcomeBtn = element.querySelector('.planner-welcome__btn');
  const win = element.querySelector('.dp__win');
  const body = element.querySelector('.dp__body');
  const stepsEl = element.querySelector('[data-role="steps"]');
  const stage = element.querySelector('[data-role="stage"]');
  const ticketEl = element.querySelector('[data-role="ticket"]');
  const backBtn = element.querySelector('[data-role="back"]');
  const nextBtn = element.querySelector('[data-role="next"]');
  win.prepend(windowBar(CONFIG.plannerWindowTitle));

  const state = {
    step: 0,
    viewMonth: new Date(),
    date: /** @type {string | null} */ (null),
    time: /** @type {{ hour: string, minute: string, ampm: string } | null} */ (null),
    moodId: /** @type {string | null} */ (null),
    stops: /** @type {{ id: string, moodId: string, place: string, emoji: string, moodLabel: string }[]} */ ([]),
    locked: false,
  };

  const moodById = (id) => CONFIG.dateMoods.find((m) => m.id === id);

  /** Each step is done when its own choice is made. */
  function stepDone(i) {
    if (i === 0) return Boolean(state.date);
    if (i === 1) return Boolean(state.time);
    if (i === 2) return Boolean(state.moodId);
    return state.stops.length > 0;
  }

  function canAdvance() {
    return stepDone(state.step);
  }

  // ---------- step 1: the day ----------

  function renderCalendar() {
    const y = state.viewMonth.getFullYear();
    const m = state.viewMonth.getMonth();
    const firstWeekday = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(y, m, 1);
    const atFirstMonth =
      monthStart.getFullYear() === today.getFullYear() && monthStart.getMonth() === today.getMonth();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push('<span class="dp-cal__pad"></span>');
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIsoDate(y, m, day);
      const cellDate = new Date(y, m, day);
      const past = cellDate < today;
      const classes = ['dp-cal__day'];
      if (past) classes.push('dp-cal__day--past');
      if (iso === toIsoDate(today.getFullYear(), today.getMonth(), today.getDate())) {
        classes.push('dp-cal__day--today');
      }
      if (iso === state.date) classes.push('dp-cal__day--on');
      cells.push(
        `<button type="button" class="${classes.join(' ')}" data-iso="${iso}"${past ? ' disabled' : ''}>${day}</button>`
      );
    }

    stage.innerHTML = `
      <p class="dp__ask">${escapeHtml(CONFIG.plannerAskDay)}</p>
      <div class="dp-cal">
        <div class="dp-cal__head">
          <button type="button" class="dp-cal__nav" data-dir="-1" aria-label="Previous month"${atFirstMonth ? ' disabled' : ''}>‹</button>
          <strong class="dp-cal__title">${MONTHS[m]} ${y}</strong>
          <button type="button" class="dp-cal__nav" data-dir="1" aria-label="Next month">›</button>
        </div>
        <div class="dp-cal__weekdays">${WEEKDAYS.map((d) => `<span>${d}</span>`).join('')}</div>
        <div class="dp-cal__grid">${cells.join('')}</div>
      </div>
    `;

    stage.querySelectorAll('.dp-cal__nav').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.viewMonth = new Date(y, m + Number(btn.dataset.dir), 1);
        renderCalendar();
      })
    );
    stage.querySelectorAll('.dp-cal__day:not(.dp-cal__day--past)').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.date = btn.dataset.iso;
        analytics.track(EVENTS.DATE_PLANNER_STEP, { step: 'day', value: state.date });
        renderCalendar();
        paint();
      })
    );
  }

  // ---------- step 2: the time ----------

  function renderTime() {
    const presets = CONFIG.plannerTimePresets;
    const activePreset = presets.findIndex(
      (p) => state.time && p.hour === state.time.hour && p.minute === state.time.minute && p.ampm === state.time.ampm
    );
    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const minutes = ['00', '15', '30', '45'];
    const t = state.time ?? { hour: '7', minute: '00', ampm: 'PM' };

    stage.innerHTML = `
      <p class="dp__ask">${escapeHtml(CONFIG.plannerAskTime)}</p>
      <div class="dp-times">
        ${presets
          .map(
            (p, i) => `
          <button type="button" class="dp-time${i === activePreset ? ' dp-time--on' : ''}" data-i="${i}">
            <span class="dp-time__label">${escapeHtml(p.label)}</span>
            <span class="dp-time__clock">${escapeHtml(formatDisplayTime(p.hour, p.minute, p.ampm))}</span>
          </button>`
          )
          .join('')}
      </div>
      <details class="dp-custom"${state.time && activePreset === -1 ? ' open' : ''}>
        <summary>${escapeHtml(CONFIG.plannerCustomTimeLabel)}</summary>
        <div class="dp-custom__row">
          <select data-role="hour" aria-label="Hour">${hours.map((h) => `<option${h === t.hour ? ' selected' : ''}>${h}</option>`).join('')}</select>
          <span class="dp-custom__colon">:</span>
          <select data-role="minute" aria-label="Minute">${minutes.map((mm) => `<option${mm === t.minute ? ' selected' : ''}>${mm}</option>`).join('')}</select>
          <select data-role="ampm" aria-label="AM or PM">${['AM', 'PM'].map((a) => `<option${a === t.ampm ? ' selected' : ''}>${a}</option>`).join('')}</select>
        </div>
      </details>
    `;

    stage.querySelectorAll('.dp-time').forEach((btn) =>
      btn.addEventListener('click', () => {
        const p = presets[Number(btn.dataset.i)];
        state.time = { hour: p.hour, minute: p.minute, ampm: p.ampm };
        analytics.track(EVENTS.DATE_PLANNER_STEP, { step: 'time', value: p.label });
        renderTime();
        paint();
      })
    );

    const read = () => {
      state.time = {
        hour: stage.querySelector('[data-role="hour"]').value,
        minute: stage.querySelector('[data-role="minute"]').value,
        ampm: stage.querySelector('[data-role="ampm"]').value,
      };
      stage.querySelectorAll('.dp-time').forEach((b) => b.classList.remove('dp-time--on'));
      paint();
    };
    stage.querySelectorAll('.dp-custom select').forEach((sel) => sel.addEventListener('change', read));
  }

  // ---------- step 3: the vibe ----------

  function renderMoods() {
    stage.innerHTML = `
      <p class="dp__ask">${escapeHtml(CONFIG.plannerAskVibe)}</p>
      <div class="dp-moods">
        ${CONFIG.dateMoods
          .map((mood) => {
            const img = CONFIG.moodImages?.[mood.id];
            return `
          <button type="button" class="dp-mood${mood.id === state.moodId ? ' dp-mood--on' : ''}" data-id="${mood.id}">
            <span class="dp-mood__art"${img ? ` style="background-image:url(${img})"` : ''} aria-hidden="true"></span>
            <span class="dp-mood__body">
              <span class="dp-mood__name">${mood.emoji} ${escapeHtml(mood.label)}</span>
              <span class="dp-mood__tag">${escapeHtml(mood.tagline)}</span>
            </span>
          </button>`;
          })
          .join('')}
      </div>
    `;
    stage.querySelectorAll('.dp-mood').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.moodId = btn.dataset.id;
        analytics.track(EVENTS.DATE_PLANNER_STEP, { step: 'vibe', value: state.moodId });
        renderMoods();
        paint();
      })
    );
  }

  // ---------- step 4: the stops ----------

  function renderStops() {
    const mood = moodById(state.moodId) ?? CONFIG.dateMoods[0];
    const chosen = new Set(state.stops.map((s) => s.place));
    const full = state.stops.length >= MAX_STOPS;

    stage.innerHTML = `
      <p class="dp__ask">${escapeHtml(CONFIG.plannerAskStops)}</p>
      <div class="dp-vibebar">
        ${CONFIG.dateMoods
          .map(
            (m) =>
              `<button type="button" class="dp-vibebar__chip${m.id === mood.id ? ' dp-vibebar__chip--on' : ''}" data-id="${m.id}">${m.emoji} ${escapeHtml(m.label)}</button>`
          )
          .join('')}
      </div>
      <div class="dp-places">
        ${(CONFIG.datePlaces[mood.id] ?? [])
          .map((p) => {
            const isOn = chosen.has(p.name);
            return `
          <button type="button" class="dp-place${isOn ? ' dp-place--on' : ''}" data-place="${escapeHtml(p.name)}"${!isOn && full ? ' disabled' : ''}>
            <span class="dp-place__main">
              <span class="dp-place__name">${escapeHtml(p.name)}</span>
              <span class="dp-place__note">${escapeHtml(p.note)}</span>
            </span>
            <span class="dp-place__mark" aria-hidden="true">${isOn ? '✓' : '+'}</span>
          </button>`;
          })
          .join('')}
      </div>
      <p class="dp-places__count">${state.stops.length} of ${MAX_STOPS} stops added${full ? '. That is a full day already.' : ''}</p>
    `;

    stage.querySelectorAll('.dp-vibebar__chip').forEach((chip) =>
      chip.addEventListener('click', () => {
        state.moodId = chip.dataset.id;
        renderStops();
      })
    );
    stage.querySelectorAll('.dp-place').forEach((btn) =>
      btn.addEventListener('click', () => {
        const place = btn.dataset.place;
        const at = state.stops.findIndex((s) => s.place === place);
        if (at >= 0) {
          state.stops.splice(at, 1);
        } else if (state.stops.length < MAX_STOPS) {
          state.stops.push({
            id: newActivityId(),
            moodId: mood.id,
            place,
            emoji: mood.emoji,
            moodLabel: mood.label,
          });
          analytics.track(EVENTS.DATE_PLANNER_STEP, { step: 'stop', value: place });
        }
        renderStops();
        paint();
      })
    );
  }

  // ---------- the ticket ----------

  function renderTicket() {
    const dateLine = state.date ? formatDisplayDate(state.date) : CONFIG.plannerTicketEmptyDay;
    const timeLine = state.time
      ? formatDisplayTime(state.time.hour, state.time.minute, state.time.ampm)
      : CONFIG.plannerTicketEmptyTime;

    ticketEl.innerHTML = `
      <div class="dp-ticket${state.locked ? ' dp-ticket--locked' : ''}">
        <div class="dp-ticket__head">
          <span class="dp-ticket__brand">${escapeHtml(CONFIG.plannerTicketBrand)}</span>
          <span class="dp-ticket__seat">${escapeHtml(CONFIG.plannerTicketSeat)}</span>
        </div>
        <dl class="dp-ticket__rows">
          <div class="dp-ticket__row${state.date ? ' dp-ticket__row--set' : ''}">
            <dt>Day</dt><dd>${escapeHtml(dateLine)}</dd>
          </div>
          <div class="dp-ticket__row${state.time ? ' dp-ticket__row--set' : ''}">
            <dt>Time</dt><dd>${escapeHtml(timeLine)}</dd>
          </div>
        </dl>
        <div class="dp-ticket__stops">
          <span class="dp-ticket__stops-label">The plan</span>
          ${
            state.stops.length
              ? `<ol class="dp-ticket__list">${state.stops
                  .map(
                    (s, i) => `
                  <li class="dp-ticket__stop">
                    <span class="dp-ticket__stop-n">${i + 1}</span>
                    <span class="dp-ticket__stop-name">${s.emoji} ${escapeHtml(s.place)}</span>
                    ${state.locked ? '' : `<button type="button" class="dp-ticket__drop" data-id="${s.id}" aria-label="Remove ${escapeHtml(s.place)}">×</button>`}
                  </li>`
                  )
                  .join('')}</ol>`
              : `<p class="dp-ticket__empty">${escapeHtml(CONFIG.plannerTicketEmptyPlan)}</p>`
          }
        </div>
        ${state.locked ? `<p class="dp-ticket__stamp">${escapeHtml(CONFIG.plannerStampText)}</p>` : ''}
      </div>
    `;

    ticketEl.querySelectorAll('.dp-ticket__drop').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.stops = state.stops.filter((s) => s.id !== btn.dataset.id);
        paint();
        if (state.step === 3) renderStops();
      })
    );
  }

  // ---------- shell ----------

  function renderSteps() {
    stepsEl.innerHTML = STEPS.map((label, i) => {
      const cls = ['dp__step'];
      if (i === state.step) cls.push('dp__step--now');
      if (stepDone(i)) cls.push('dp__step--done');
      return `<li class="${cls.join(' ')}"><button type="button" data-i="${i}"${i > state.step && !stepDone(i - 1) ? ' disabled' : ''}>${escapeHtml(label)}</button></li>`;
    }).join('');
    stepsEl.querySelectorAll('button').forEach((btn) =>
      btn.addEventListener('click', () => goToStep(Number(btn.dataset.i)))
    );
  }

  function renderStage() {
    if (state.step === 0) renderCalendar();
    else if (state.step === 1) renderTime();
    else if (state.step === 2) renderMoods();
    else renderStops();
  }

  /** Redraw the parts that depend on state, without rebuilding the current step's controls. */
  function paint() {
    renderSteps();
    renderTicket();
    const last = state.step === STEPS.length - 1;
    backBtn.disabled = state.step === 0;
    nextBtn.disabled = !canAdvance();
    nextBtn.textContent = last ? CONFIG.plannerConfirmBtn : CONFIG.plannerNextLabel;
    nextBtn.classList.toggle('dp__next--final', last);
  }

  function goToStep(i) {
    if (i < 0 || i > STEPS.length - 1 || state.locked) return;
    state.step = i;
    renderStage();
    paint();
    body.scrollTop = 0;
  }

  async function lockItIn() {
    if (state.locked || !canAdvance()) return;
    state.locked = true;
    nextBtn.disabled = true;
    confetti.burst(60);
    renderTicket();

    const payload = {
      selectedDate: state.date,
      selectedTime: formatDisplayTime(state.time.hour, state.time.minute, state.time.ampm),
      activities: state.stops.map(({ moodId, place, emoji, moodLabel }) => ({
        moodId,
        place,
        emoji,
        moodLabel,
      })),
    };

    sessionStorage.setItem('exploration.datePlan', JSON.stringify(payload));
    analytics.track(EVENTS.DATE_CONFIRM, payload);

    try {
      await analytics.confirmDate(payload);
    } catch (err) {
      console.warn('[DatePlanner] Could not save the plan', err);
    }

    lc.trackTimeout(
      setTimeout(() => {
        analytics.track(EVENTS.MANUAL_CONTINUE, { from: SCREENS.DATE_PLANNER, to: SCREENS.BOUQUET });
        manager.goTo(SCREENS.BOUQUET);
      }, 1500)
    );
  }

  lc.bindListener(welcomeBtn, 'click', () => {
    welcome.classList.add('planner-welcome--dismissed');
    analytics.track(EVENTS.DATE_PLANNER_STEP, { step: 'start' });
  });
  lc.bindListener(backBtn, 'click', () => goToStep(state.step - 1));
  lc.bindListener(nextBtn, 'click', () => {
    if (state.step === STEPS.length - 1) lockItIn();
    else goToStep(state.step + 1);
  });

  function reset() {
    state.step = 0;
    state.viewMonth = new Date();
    state.date = null;
    state.time = null;
    // left unset so the Vibe step does not look finished before she picks one
    state.moodId = null;
    state.stops = [];
    state.locked = false;
    welcome.classList.remove('planner-welcome--dismissed');
  }

  return {
    element,
    onEnter() {
      lc.reset();
      reset();
      renderStage();
      paint();
      if (CONFIG.photos?.plannerWelcome && welcomeBg) {
        applyCoverBackground(welcomeBg, CONFIG.photos.plannerWelcome);
      }
    },
    onExit() {
      lc.reset();
    },
  };
}
