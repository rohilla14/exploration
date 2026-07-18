import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { ScratchCard } from '../core/ScratchCard.js';
import { createLifecycle } from '../utils/lifecycle.js';

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createReasonsScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--reasons';

  const inner = document.createElement('div');
  inner.className = 'screen__inner';

  const hint = document.createElement('p');
  hint.className = 'reasons-hint';
  hint.textContent = 'Scratch the top card to reveal each reason ✨';

  const stack = document.createElement('div');
  stack.className = 'reasons-stack';

  const counter = document.createElement('p');
  counter.className = 'reasons-counter';
  counter.textContent = `0 / ${CONFIG.reasons.length} revealed`;

  const continueBtn = document.createElement('button');
  continueBtn.type = 'button';
  continueBtn.className = 'btn btn--primary continue-btn';
  continueBtn.textContent = 'Continue';
  lc.bindListener(continueBtn, 'click', () => {
    analytics.track(EVENTS.MANUAL_CONTINUE, { to: SCREENS.GAMES });
    manager.goTo(SCREENS.GAMES);
  });

  inner.appendChild(hint);
  inner.appendChild(stack);
  inner.appendChild(counter);
  inner.appendChild(continueBtn);
  element.appendChild(inner);

  /** @type {ScratchCard[]} */
  let cards = [];
  const scratched = new Set();
  const progressLogged = new Set();

  function updateCounter() {
    counter.textContent = `${scratched.size} / ${CONFIG.reasons.length} revealed`;
  }

  function updateStackState() {
    const total = cards.length;
    let activeSet = false;

    cards.forEach((card, i) => {
      const el = card.wrapper;
      el.style.setProperty('--stack-i', String(i));
      el.classList.remove('scratch-card--active', 'scratch-card--done', 'scratch-card--waiting');

      if (scratched.has(i)) {
        el.classList.add('scratch-card--done');
      } else if (!activeSet) {
        el.classList.add('scratch-card--active');
        activeSet = true;
      } else {
        el.classList.add('scratch-card--waiting');
      }

      el.style.zIndex = String(scratched.has(i) ? i : total - i + 10);
    });

    updateCounter();
  }

  function checkAllScratched() {
    if (scratched.size >= CONFIG.reasons.length) {
      continueBtn.classList.add('continue-btn--visible');
      analytics.track(EVENTS.ALL_REASONS_SCRATCHED, { count: scratched.size });
    }
  }

  function buildCards() {
    cards.forEach((c) => c.destroy());
    cards = [];
    scratched.clear();
    progressLogged.clear();
    stack.innerHTML = '';
    continueBtn.classList.remove('continue-btn--visible');
    updateCounter();

    CONFIG.reasons.forEach((_reason, i) => {
      const card = new ScratchCard(stack, CONFIG.reasons[i], {
        onProgress: (ratio) => {
          if (!progressLogged.has(i) && ratio >= 0.3) {
            progressLogged.add(i);
            analytics.track(EVENTS.SCRATCH_PROGRESS, { cardIndex: i, ratio });
          }
          if (ratio >= 0.55 && !scratched.has(i)) {
            scratched.add(i);
            analytics.track(EVENTS.SCRATCH_COMPLETE, { cardIndex: i });
            card.wrapper.classList.add('scratch-card--revealing');
            setTimeout(() => {
              card.wrapper.classList.remove('scratch-card--revealing');
              updateStackState();
              checkAllScratched();
            }, 450);
          }
        },
      });

      card.wrapper.dataset.index = String(i);
      card.wrapper.style.setProperty('--stack-i', String(i));
      card.wrapper.classList.add('scratch-card--entering');
      card.wrapper.style.animationDelay = `${i * 0.1}s`;

      cards.push(card);
    });

    requestAnimationFrame(() => {
      cards.forEach((c) => c.mount());
      updateStackState();
      requestAnimationFrame(() => {
        cards.forEach((c) => c.wrapper.classList.remove('scratch-card--entering'));
      });
    });
  }

  return {
    element,
    onEnter() {
      lc.reset();
      buildCards();
    },
    onExit() {
      cards.forEach((c) => c.destroy());
      cards = [];
      lc.reset();
    },
  };
}
