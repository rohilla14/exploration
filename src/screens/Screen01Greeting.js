import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { isPlaceholder } from '../utils/configHelpers.js';

const GLITCH_CHARS =
  '!@#$%^&*?~<>[]{}|/\\ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const GLITCH_DURATION = 1500;

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createGreetingScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--greeting';

  const inner = document.createElement('div');
  inner.className = 'screen__inner screen-card';

  const greeting = document.createElement('h1');
  greeting.className = 'greeting-text greeting-text--glitch';

  const sub = document.createElement('p');
  sub.className = 'greeting-sub';
  if (!isPlaceholder(CONFIG.insideJoke)) {
    sub.textContent = `(${CONFIG.insideJoke})`;
  } else {
    sub.hidden = true;
  }

  const continueBtn = document.createElement('div');
  continueBtn.className = 'continue-prompt';
  continueBtn.textContent = 'scroll ↓';
  continueBtn.style.display = 'none';

  const goNext = () => {
    analytics.track(EVENTS.MANUAL_CONTINUE, { to: SCREENS.SCROLL_STORY });
    manager.goTo(SCREENS.SCROLL_STORY);
  };

  lc.bindListener(continueBtn, 'click', goNext);

  inner.appendChild(greeting);
  inner.appendChild(sub);
  inner.appendChild(continueBtn);
  element.appendChild(inner);

  const finalText = `Hey ${CONFIG.herName} 👀`;

  function scramble(text) {
    return text
      .split('')
      .map((ch) =>
        ch === ' ' ? ' ' : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      )
      .join('');
  }

  function runGlitch() {
    const start = Date.now();
    greeting.textContent = scramble(finalText);

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = elapsed / GLITCH_DURATION;

      if (progress >= 1) {
        clearInterval(interval);
        greeting.textContent = finalText;
        greeting.classList.remove('greeting-text--glitch');
        greeting.classList.add('greeting-text--resolved');
        if (!sub.hidden) sub.classList.add('greeting-sub--visible');
        continueBtn.style.display = 'block';
        lc.trackTimeout(
          setTimeout(() => {
            analytics.track(EVENTS.AUTO_ADVANCE, { to: SCREENS.SCROLL_STORY });
            manager.goTo(SCREENS.SCROLL_STORY);
          }, 2800)
        );
        return;
      }

      const revealCount = Math.floor(finalText.length * progress);
      greeting.textContent =
        finalText.slice(0, revealCount) + scramble(finalText.slice(revealCount));
    }, 50);
    lc.trackInterval(interval);
  }

  return {
    element,
    onEnter() {
      lc.reset();
      greeting.classList.add('greeting-text--glitch');
      greeting.classList.remove('greeting-text--resolved');
      sub.classList.remove('greeting-sub--visible');
      continueBtn.style.display = 'none';
      runGlitch();
    },
    onExit() {
      lc.reset();
    },
  };
}
