import { initAmbientBackground } from './AmbientBackground.js';
import { initFloatingHearts } from './FloatingHearts.js';
import { ScreenManager } from './ScreenManager.js';
import { NavControls } from './NavControls.js';
import { AudioManager } from './AudioManager.js';
import { initMagneticButtons } from './MagneticButtons.js';
import { EasterEgg } from './EasterEgg.js';
import { Confetti } from './Confetti.js';
import { Analytics } from '../analytics/Analytics.js';
import { SCREENS } from '../constants/screens.js';
import { initSmileCounter } from './SmileCounter.js';
import { initInteractionRecorder } from './InteractionRecorder.js';
import { registerScreens } from '../screens/index.js';
import { hasCompletedJourney } from '../utils/journey.js';
import { CONFIG } from '../config.js';

/**
 * @typedef {object} AppServices
 * @property {ScreenManager} manager
 * @property {Analytics} analytics
 * @property {Confetti} confetti
 */

export class App {
  /** @returns {AppServices} */
  static init() {
    initAmbientBackground();
    initFloatingHearts();

    const container = document.querySelector('#app');
    if (!container) throw new Error('#app container not found');

    const analytics = new Analytics();
    const manager = new ScreenManager(container, { analytics });
    const confetti = new Confetti();

    /** @type {AppServices} */
    const services = { manager, analytics, confetti };

    const audio = new AudioManager(analytics);
    // a soft whoosh whenever the screen changes
    manager.onChange(() => audio.playWhoosh());
    initMagneticButtons();
    new EasterEgg(analytics);

    registerScreens(services);

    new NavControls(manager, analytics);
    initSmileCounter({ analytics, confetti });
    initInteractionRecorder(analytics);

    const startScreen = resolveStartScreen(manager);
    manager.goTo(startScreen);

    return services;
  }
}

/**
 * Dev shortcut: open `/?screen=bouquet` (or any registered screen id) to skip the flow.
 * When `returnVisitorsSkipToDesktop` is on, return visits (journey already completed once) skip
 * straight to the Hub instead of replaying the whole story from Loading.
 * @param {ScreenManager} manager
 */
function resolveStartScreen(manager) {
  if (import.meta.env.DEV) {
    const param = new URLSearchParams(window.location.search).get('screen');
    if (param) {
      if (manager.screens.has(param)) {
        console.info(`[dev] Starting at screen: ${param}`);
        return param;
      }
      console.warn(`[dev] Unknown ?screen=${param} — falling back to loading`);
    }
  }

  if (CONFIG.returnVisitorsSkipToDesktop && hasCompletedJourney() && manager.screens.has(SCREENS.HUB)) {
    return SCREENS.HUB;
  }

  return SCREENS.LOADING;
}
