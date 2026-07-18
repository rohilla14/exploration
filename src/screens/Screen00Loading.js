import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';

const CHAR_DELAY = 55;
const PAUSE_AFTER = 400;

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createLoadingScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--loading';

  const inner = document.createElement('div');
  inner.className = 'screen__inner screen-card';

  const forHer = document.createElement('p');
  forHer.className = 'loading__for';
  forHer.textContent = `for ${CONFIG.herName}`;

  const typewriter = document.createElement('p');
  typewriter.className = 'typewriter';
  typewriter.innerHTML =
    '<span class="typewriter__text"></span><span class="typewriter__cursor">|</span>';

  const dots = document.createElement('div');
  dots.className = 'loading__dots';
  dots.innerHTML = '<span></span><span></span><span></span>';

  inner.append(forHer, typewriter, dots);
  element.appendChild(inner);

  function runTypewriter() {
    const textEl = typewriter.querySelector('.typewriter__text');
    let i = 0;
    textEl.textContent = '';

    const interval = setInterval(() => {
      if (i < CONFIG.loadingText.length) {
        textEl.textContent += CONFIG.loadingText[i];
        i += 1;
      } else {
        clearInterval(interval);
        lc.trackTimeout(
          setTimeout(() => {
            analytics.track(EVENTS.AUTO_ADVANCE, { to: SCREENS.SCROLL_STORY });
            manager.goTo(SCREENS.SCROLL_STORY);
          }, PAUSE_AFTER)
        );
      }
    }, CHAR_DELAY);
    lc.trackInterval(interval);
  }

  return {
    element,
    onEnter() {
      lc.reset();
      runTypewriter();
    },
    onExit() {
      lc.destroy();
    },
  };
}
