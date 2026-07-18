import { initAmbientBackground } from './AmbientBackground.js';
import { initFloatingHearts } from './FloatingHearts.js';
import { ScreenManager } from './ScreenManager.js';
import { NavControls } from './NavControls.js';
import { AudioManager } from './AudioManager.js';
import { EasterEgg } from './EasterEgg.js';
import { Confetti } from './Confetti.js';
import { Analytics } from '../analytics/Analytics.js';
import { SCREENS } from '../constants/screens.js';
import { initSmileCounter } from './SmileCounter.js';
import { initInteractionRecorder } from './InteractionRecorder.js';
import { registerScreens } from '../screens/index.js';

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

    new AudioManager(analytics);
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
 * @param {ScreenManager} manager
 */
function resolveStartScreen(manager) {
  if (!import.meta.env.DEV) return SCREENS.LOADING;

  const param = new URLSearchParams(window.location.search).get('screen');
  if (!param) return SCREENS.LOADING;

  if (manager.screens.has(param)) {
    console.info(`[dev] Starting at screen: ${param}`);
    return param;
  }

  console.warn(`[dev] Unknown ?screen=${param} — falling back to loading`);
  return SCREENS.LOADING;
}
