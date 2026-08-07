import { CONFIG } from '../../config.js';
import { EVENTS } from '../../constants/eventTypes.js';
import { hubApi } from '../api.js';

const DEPTH_LABEL = { light: 'Light', closer: 'Closer', deep: 'Deep' };

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} ctx */
export function createAskMeAnythingApp(container, { analytics }) {
  let destroyed = false;
  /** @type {any[]} */
  let questions = [];
  let view = 'active'; // 'active' | 'scrapbook'
  /** @type {number | string | null} */
  let openQuestionId = null;
  let revealing = false;

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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function unanswered() {
    return questions.filter((q) => !q.her_answer);
  }

  function answered() {
    return questions.filter((q) => q.her_answer);
  }

  function render() {
    if (destroyed) return;
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
    stage.innerHTML = `
      <div class="qa-cloud-field">
        ${pending
          .map(
            (q, i) => `
          <button type="button" class="qa-cloud qa-cloud--${q.depth || 'closer'} qa-cloud--blob-${(i % 3) + 1}"
                  data-id="${q.id}"
                  style="--drift-delay: ${(i * 0.37).toFixed(2)}s; --drift-duration: ${6 + (i % 4)}s;">
            <span class="qa-cloud__text">${escapeHtml(q.prompt)}</span>
          </button>
        `
          )
          .join('')}
      </div>
    `;

    stage.querySelectorAll('.qa-cloud').forEach((btn) => {
      btn.addEventListener('click', () => {
        openQuestionId = btn.dataset.id;
        render();
      });
    });
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
    },
  };
}
