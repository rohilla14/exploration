import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { createPhotoLens } from '../core/PhotoLens.js';

/**
 * The photo-lens page after the story: only her photo. Moving the cursor opens the lens onto
 * other photos, so she can look around before landing on the desktop.
 * @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services
 */
export function createExploreScreen({ manager, analytics }) {
  const lc = createLifecycle();
  const cfg = CONFIG.hubWallpaper;

  const element = document.createElement('section');
  element.className = 'screen screen--explore';

  const stage = document.createElement('div');
  stage.className = 'explore__stage';

  const ui = document.createElement('div');
  ui.className = 'explore__ui';
  ui.innerHTML = `
    <p class="explore__hint"></p>
    <button type="button" class="explore__go"></button>
  `;
  const hint = ui.querySelector('.explore__hint');
  const go = ui.querySelector('.explore__go');
  hint.textContent = cfg.exploreHint;
  go.textContent = cfg.enterLabel;

  element.append(stage, ui);
  const lens = createPhotoLens(stage, cfg);

  lc.bindListener(go, 'click', () => {
    analytics.track(EVENTS.MANUAL_CONTINUE, { from: SCREENS.EXPLORE, to: SCREENS.HUB });
    manager.goTo(SCREENS.HUB);
  });
  // The hint fades once she starts moving around.
  lc.bindListener(stage, 'pointermove', () => hint.classList.add('explore__hint--gone'), { once: true });

  return {
    element,
    onEnter() {
      lc.reset();
      hint.classList.remove('explore__hint--gone');
      lens.start();
      stage.classList.remove('explore__stage--ready');
      lc.trackTimeout(setTimeout(() => stage.classList.add('explore__stage--ready'), 300));
    },
    onExit() {
      lens.stop();
      lc.reset();
    },
    destroy() {
      lens.destroy();
      lc.destroy();
    },
  };
}
