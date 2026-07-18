import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { resolveTemplate } from '../utils/configHelpers.js';
import { createLifecycle } from '../utils/lifecycle.js';

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createAnticipationScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--anticipation';

  const inner = document.createElement('div');
  inner.className = 'screen__inner screen-card';

  const caption = document.createElement('p');
  caption.className = 'anticipation-caption';

  const barWrap = document.createElement('div');
  barWrap.className = 'progress-bar-wrap';

  const barFill = document.createElement('div');
  barFill.className = 'progress-bar-fill';
  barWrap.appendChild(barFill);

  inner.appendChild(caption);
  inner.appendChild(barWrap);
  element.appendChild(inner);

  let captionIndex = 0;

  const captions = CONFIG.anticipationCaptions.map((c) =>
    resolveTemplate(c, { insideJoke: CONFIG.insideJoke })
  );

  function runAnimation() {
    const duration = 6000;
    const start = Date.now();
    captionIndex = 0;
    caption.textContent = captions[0];

    const captionInterval = setInterval(() => {
      captionIndex = (captionIndex + 1) % captions.length;
      caption.style.opacity = '0';
      lc.trackTimeout(
        setTimeout(() => {
          caption.textContent = captions[captionIndex];
          caption.style.opacity = '1';
        }, 200)
      );
    }, 1500);
    lc.trackInterval(captionInterval);

    const fillInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, (elapsed / duration) * 100);
      barFill.style.width = `${progress}%`;

      if (progress >= 100) {
        clearInterval(fillInterval);
        clearInterval(captionInterval);
        analytics.track(EVENTS.ANTICIPATION_COMPLETE, { to: SCREENS.PRE_ASK });
        lc.trackTimeout(setTimeout(() => manager.goTo(SCREENS.PRE_ASK), 400));
      }
    }, 50);
    lc.trackInterval(fillInterval);
  }

  return {
    element,
    onEnter() {
      lc.reset();
      barFill.style.width = '0%';
      runAnimation();
    },
    onExit() {
      lc.reset();
    },
  };
}
