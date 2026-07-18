import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createPreAskScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--preask';

  const overlay = document.createElement('div');
  overlay.className = 'preask-overlay';

  const content = document.createElement('div');
  content.className = 'preask-content screen__inner';

  const line = document.createElement('p');
  line.className = 'preask-line';
  line.textContent = 'Okay... here goes nothing';

  content.appendChild(line);
  element.appendChild(content);
  element.appendChild(overlay);

  return {
    element,
    onEnter() {
      lc.reset();
      element.classList.remove('preask--active');
      requestAnimationFrame(() => element.classList.add('preask--active'));
      lc.trackTimeout(
        setTimeout(() => {
          analytics.track(EVENTS.AUTO_ADVANCE, { to: SCREENS.BIG_ASK });
          manager.goTo(SCREENS.BIG_ASK);
        }, 2500)
      );
    },
    onExit() {
      lc.reset();
      element.classList.remove('preask--active');
    },
  };
}
