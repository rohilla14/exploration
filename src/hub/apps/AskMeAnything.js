import { CONFIG } from '../../config.js';
import { EVENTS } from '../../constants/eventTypes.js';
import { hubApi } from '../api.js';
import { escapeHtml } from '../../utils/dom.js';

const DEPTH_LABEL = { light: 'Light', closer: 'Closer', deep: 'Deep' };

const MAX_FLOATING = 6;

/** @template T @param {T[]} list @returns {T[]} */
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Let question bubbles drift around a sky area. They bounce softly off the edges and each other,
 * and can be grabbed, dragged and tossed. A tap (no real drag) calls `onPick`.
 * @param {HTMLElement} sky @param {HTMLElement[]} bubbles @param {(el: HTMLElement) => void} onPick
 * @returns {() => void} stop function
 */
function floatBubbles(sky, bubbles, onPick) {
  const DRIFT = 22; // px/s cruising speed
  const TAP_SLOP = 6;
  let W = sky.clientWidth;
  let H = sky.clientHeight;

  const items = bubbles.map((el, i) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const angle = Math.random() * Math.PI * 2;
    return {
      el,
      w,
      h,
      x: 0,
      y: 0,
      vx: Math.cos(angle) * DRIFT,
      vy: Math.sin(angle) * DRIFT,
      phase: i * 1.7,
      held: false,
    };
  });

  // Spread out at the start: try random spots until a bubble does not overlap the others.
  items.forEach((it, i) => {
    for (let attempt = 0; attempt < 40; attempt++) {
      it.x = Math.random() * Math.max(1, W - it.w);
      it.y = Math.random() * Math.max(1, H - it.h);
      const clear = items.slice(0, i).every((o) => Math.abs(o.x - it.x) > (o.w + it.w) / 2 || Math.abs(o.y - it.y) > (o.h + it.h) / 2);
      if (clear) break;
    }
  });

  let drag = null;
  let last = performance.now();
  let raf = 0;
  let running = true;

  function paint(it, t) {
    const tilt = Math.sin(t / 1400 + it.phase) * 2.5;
    it.el.style.transform = `translate3d(${it.x.toFixed(1)}px, ${it.y.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
  }

  function step(now) {
    if (!running) return;
    raf = requestAnimationFrame(step);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    items.forEach((it) => {
      if (it.held) return;
      // ease back to cruising speed after a toss, keep a gentle wander
      const speed = Math.hypot(it.vx, it.vy) || 1;
      const target = DRIFT + Math.sin(now / 2600 + it.phase) * 6;
      const k = 1 - Math.pow(0.35, dt);
      const s = speed + (target - speed) * k;
      it.vx = (it.vx / speed) * s;
      it.vy = (it.vy / speed) * s;
      it.x += it.vx * dt;
      it.y += it.vy * dt;

      if (it.x < 0) { it.x = 0; it.vx = Math.abs(it.vx); }
      if (it.y < 0) { it.y = 0; it.vy = Math.abs(it.vy); }
      if (it.x > W - it.w) { it.x = W - it.w; it.vx = -Math.abs(it.vx); }
      if (it.y > H - it.h) { it.y = H - it.h; it.vy = -Math.abs(it.vy); }
    });

    // soft bounce between bubbles so they do not pile up
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const dx = b.x + b.w / 2 - (a.x + a.w / 2);
        const dy = b.y + b.h / 2 - (a.y + a.h / 2);
        const nx = dx / ((a.w + b.w) * 0.46);
        const ny = dy / ((a.h + b.h) * 0.46);
        const nd = Math.hypot(nx, ny);
        if (nd < 1 && nd > 0.001) {
          const push = (1 - nd) * 60 * dt * 10;
          const ux = nx / nd;
          const uy = ny / nd;
          if (!a.held) { a.x -= ux * push; a.y -= uy * push; a.vx -= ux * 8; a.vy -= uy * 8; }
          if (!b.held) { b.x += ux * push; b.y += uy * push; b.vx += ux * 8; b.vy += uy * 8; }
        }
      }
    }

    items.forEach((it) => paint(it, now));
  }

  items.forEach((it) => {
    const el = it.el;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      el.setPointerCapture(e.pointerId);
      it.held = true;
      el.classList.add('qa-cloud--held');
      drag = {
        it,
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        offX: e.clientX - it.x - sky.getBoundingClientRect().left,
        offY: e.clientY - it.y - sky.getBoundingClientRect().top,
        moved: false,
        samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
      };
    });

    el.addEventListener('pointermove', (e) => {
      if (!drag || drag.it !== it || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > TAP_SLOP) drag.moved = true;
      if (!drag.moved) return;
      const rect = sky.getBoundingClientRect();
      it.x = Math.min(Math.max(e.clientX - rect.left - drag.offX, 0), W - it.w);
      it.y = Math.min(Math.max(e.clientY - rect.top - drag.offY, 0), H - it.h);
      drag.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (drag.samples.length > 6) drag.samples.shift();
    });

    const release = (e) => {
      if (!drag || drag.it !== it || e.pointerId !== drag.id) return;
      const { moved, samples } = drag;
      drag = null;
      it.held = false;
      el.classList.remove('qa-cloud--held');
      if (!moved) {
        onPick(el);
        return;
      }
      // toss: carry the pointer's recent velocity, capped so bubbles never fly off wildly
      const a = samples[0];
      const b = samples[samples.length - 1];
      const dt = Math.max(0.016, (b.t - a.t) / 1000);
      const cap = 520;
      it.vx = Math.max(-cap, Math.min(cap, (b.x - a.x) / dt));
      it.vy = Math.max(-cap, Math.min(cap, (b.y - a.y) / dt));
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPick(el);
      }
    });
  });

  const resize = new ResizeObserver(() => {
    W = sky.clientWidth;
    H = sky.clientHeight;
    items.forEach((it) => {
      it.x = Math.min(it.x, Math.max(0, W - it.w));
      it.y = Math.min(it.y, Math.max(0, H - it.h));
    });
  });
  resize.observe(sky);

  items.forEach((it) => paint(it, last));
  raf = requestAnimationFrame(step);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    resize.disconnect();
  };
}

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} ctx */
export function createAskMeAnythingApp(container, { analytics }) {
  let destroyed = false;
  /** @type {any[]} */
  let questions = [];
  let view = 'active'; // 'active' | 'scrapbook'
  /** @type {number | string | null} */
  let openQuestionId = null;
  let revealing = false;
  /** @type {(() => void) | null} */
  let stopField = null;

  container.innerHTML = `
    <div class="hub-app hub-app--qa">
      <p class="hub-app__subtitle">${CONFIG.askMeSubtitle}</p>
      <div class="qa-toolbar">
        <button type="button" class="qa-toolbar__tab qa-toolbar__tab--active" data-view="active">Deep Dive</button>
        <button type="button" class="qa-toolbar__tab" data-view="scrapbook">${CONFIG.askMeScrapbookLabel}</button>
      </div>
      <div class="qa-stage" data-role="stage"><p class="hub-loading">Loading…</p></div>
    </div>
  `;

  const stage = container.querySelector('[data-role="stage"]');
  const tabs = container.querySelectorAll('.qa-toolbar__tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      view = tab.dataset.view;
      openQuestionId = null;
      revealing = false;
      tabs.forEach((t) => t.classList.toggle('qa-toolbar__tab--active', t === tab));
      render();
    });
  });

  function unanswered() {
    return questions.filter((q) => !q.her_answer);
  }

  function answered() {
    return questions.filter((q) => q.her_answer);
  }

  function render() {
    if (destroyed) return;
    stopField?.();
    stopField = null;
    if (view === 'scrapbook') {
      renderScrapbook();
      return;
    }
    renderActive();
  }

  function renderScrapbook() {
    const done = answered();
    if (!done.length) {
      stage.innerHTML = `<p class="hub-empty">${CONFIG.askMeScrapbookEmpty}</p>`;
      return;
    }
    stage.innerHTML = `
      <div class="qa-scrapbook">
        ${done
          .map(
            (q) => `
          <article class="qa-scrapbook__card">
            <span class="qa-depth qa-depth--${q.depth || 'closer'}">${DEPTH_LABEL[q.depth] || 'Closer'}</span>
            <p class="qa-scrapbook__prompt">${escapeHtml(q.prompt)}</p>
            <div class="qa-card__reveal">
              <p class="qa-card__answer"><span class="qa-card__answer-label">${CONFIG.askMeYourAnswerLabel}:</span> ${escapeHtml(q.her_answer)}</p>
              <p class="qa-card__answer qa-card__answer--mine"><span class="qa-card__answer-label">${CONFIG.askMeMyAnswerLabel}:</span> ${escapeHtml(q.my_answer)}</p>
            </div>
          </article>
        `
          )
          .join('')}
      </div>
    `;
  }

  function renderCloudField(pending) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Only a handful float at a time so there is room to drift (and to pick one).
    const shown = shuffle(pending).slice(0, MAX_FLOATING);
    const waiting = pending.length - shown.length;

    stage.innerHTML = `
      <p class="qa-sky__hint">${reduceMotion ? 'Pick a question' : 'Catch a question. Tap it, or drag and toss it around'}</p>
      <div class="qa-sky${reduceMotion ? ' qa-sky--still' : ''}" data-role="sky">
        ${shown
          .map(
            (q, i) => `
          <button type="button" class="qa-cloud qa-cloud--float qa-cloud--${q.depth || 'closer'} qa-cloud--blob-${(i % 3) + 1}"
                  data-id="${q.id}">
            <span class="qa-cloud__text">${escapeHtml(q.prompt)}</span>
          </button>
        `
          )
          .join('')}
      </div>
      ${waiting > 0 ? `<p class="qa-sky__more">${waiting} more waiting</p>` : ''}
    `;

    const sky = stage.querySelector('[data-role="sky"]');
    const bubbles = [...sky.querySelectorAll('.qa-cloud')];

    const open = (btn) => {
      btn.classList.add('qa-cloud--pop');
      setTimeout(() => {
        if (destroyed) return;
        openQuestionId = btn.dataset.id;
        render();
      }, 240);
    };

    if (reduceMotion) {
      bubbles.forEach((btn) => btn.addEventListener('click', () => open(btn)));
      return;
    }
    stopField = floatBubbles(sky, bubbles, open);
  }

  function renderActive() {
    const pending = unanswered();
    if (!questions.length) {
      stage.innerHTML = `<p class="hub-empty">${CONFIG.askMeEmpty}</p>`;
      return;
    }
    if (!pending.length) {
      openQuestionId = null;
      stage.innerHTML = `
        <div class="qa-done">
          <p class="qa-done__title">${CONFIG.askMeAllDone}</p>
          <button type="button" class="btn btn--secondary" data-role="to-scrapbook">${CONFIG.askMeScrapbookLabel}</button>
        </div>
      `;
      stage.querySelector('[data-role="to-scrapbook"]')?.addEventListener('click', () => {
        view = 'scrapbook';
        tabs.forEach((t) => t.classList.toggle('qa-toolbar__tab--active', t.dataset.view === 'scrapbook'));
        render();
      });
      return;
    }

    if (openQuestionId == null) {
      renderCloudField(pending);
      return;
    }

    const q = pending.find((item) => String(item.id) === String(openQuestionId));
    if (!q) {
      openQuestionId = null;
      renderCloudField(pending);
      return;
    }

    const total = questions.length;
    const doneCount = answered().length;

    stage.innerHTML = `
      <button type="button" class="qa-back" data-role="back-clouds">← back to questions</button>
      <div class="qa-progress">
        <div class="qa-progress__dots">
          ${questions
            .map((item, i) => {
              const answeredQ = Boolean(item.her_answer);
              const isCurrent = item.id === q.id;
              return `<span class="qa-dot${answeredQ ? ' qa-dot--done' : ''}${isCurrent ? ' qa-dot--current' : ''}" title="Q${i + 1}"></span>`;
            })
            .join('')}
        </div>
        <span class="qa-progress__label">${doneCount + 1} / ${total}</span>
      </div>
      <article class="qa-focus" data-id="${q.id}">
        <span class="qa-depth qa-depth--${q.depth || 'closer'}">${DEPTH_LABEL[q.depth] || 'Closer'}</span>
        <p class="qa-focus__prompt">${escapeHtml(q.prompt)}</p>
        <form class="qa-card__form" data-role="form">
          <textarea class="qa-card__input" placeholder="${CONFIG.askMePlaceholder}" required></textarea>
          <button type="submit" class="btn btn--primary qa-card__submit">${CONFIG.askMeSubmit}</button>
          <p class="qa-card__error" hidden></p>
        </form>
        <div class="qa-reveal-slot" data-role="reveal" hidden></div>
      </article>
    `;

    stage.querySelector('[data-role="back-clouds"]')?.addEventListener('click', () => {
      if (revealing) return;
      openQuestionId = null;
      render();
    });

    const form = stage.querySelector('[data-role="form"]');
    const textarea = form.querySelector('textarea');
    const errorEl = form.querySelector('.qa-card__error');
    const revealSlot = stage.querySelector('[data-role="reveal"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (revealing) return;
      const value = textarea.value.trim();
      if (!value) return;

      const submitBtn = form.querySelector('button');
      submitBtn.disabled = true;
      errorEl.hidden = true;
      revealing = true;

      try {
        const result = await hubApi.answerQuestion(q.id, value);
        if (destroyed) return;
        analytics.track(EVENTS.QUESTION_ANSWERED, { questionId: q.id });

        q.her_answer = result.herAnswer;
        form.hidden = true;
        revealSlot.hidden = false;
        revealSlot.innerHTML = `
          <div class="qa-suspense">
            <p class="qa-suspense__label">${CONFIG.askMeRevealHold}</p>
          </div>
        `;

        await wait(900);
        if (destroyed) return;

        revealSlot.innerHTML = `
          <div class="qa-card__reveal qa-card__reveal--animate">
            <p class="qa-card__answer"><span class="qa-card__answer-label">${CONFIG.askMeYourAnswerLabel}:</span> ${escapeHtml(result.herAnswer)}</p>
            <p class="qa-card__answer qa-card__answer--mine"><span class="qa-card__answer-label">${CONFIG.askMeMyAnswerLabel}:</span> ${escapeHtml(result.myAnswer)}</p>
            <p class="qa-spark" data-role="spark">${CONFIG.askMeSparkLoading}</p>
            <button type="button" class="btn btn--primary" data-role="next">${CONFIG.askMeNext}</button>
          </div>
        `;

        loadSpark(revealSlot.querySelector('[data-role="spark"]'), q.prompt, result.herAnswer, result.myAnswer);

        revealSlot.querySelector('[data-role="next"]')?.addEventListener('click', () => {
          revealing = false;
          openQuestionId = null;
          render();
        });
      } catch (err) {
        revealing = false;
        submitBtn.disabled = false;
        errorEl.hidden = false;
        errorEl.textContent = `Couldn't save that (${err.message}). Try again?`;
      }
    });
  }

  async function loadSpark(el, prompt, herAnswer, myAnswer) {
    if (!el) return;
    try {
      const { spark } = await hubApi.aiSpark({ prompt, herAnswer, myAnswer });
      if (destroyed || !el.isConnected) return;
      el.textContent = spark || CONFIG.askMeSparkFallback;
    } catch {
      if (!el.isConnected) return;
      el.textContent = CONFIG.askMeSparkFallback;
    }
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function load() {
    try {
      questions = await hubApi.listQuestions();
      if (destroyed) return;
      render();
    } catch (err) {
      if (destroyed) return;
      stage.innerHTML = `<p class="hub-error">Couldn't load questions right now (${err.message}).</p>`;
    }
  }

  return {
    start() {
      openQuestionId = null;
      load();
    },
    destroy() {
      destroyed = true;
      stopField?.();
      stopField = null;
    },
  };
}
