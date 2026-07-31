import { SCREEN_ORDER, SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';

/** First screen that shows the back button (after scroll story). */
const BACK_VISIBLE_FROM = SCREEN_ORDER.indexOf(SCREENS.BIG_ASK);
const BACK_DISABLED_AT_OR_BELOW = SCREEN_ORDER.indexOf(SCREENS.LOADING);

export class NavControls {
  /**
   * @param {import('./ScreenManager.js').ScreenManager} manager
   * @param {import('../analytics/Analytics.js').Analytics} analytics
   */
  constructor(manager, analytics) {
    this.manager = manager;
    this.analytics = analytics;

    this.backBtn = document.createElement('button');
    this.backBtn.type = 'button';
    this.backBtn.className = 'nav-back';
    this.backBtn.setAttribute('aria-label', 'Go to previous step');
    this.backBtn.textContent = '← Back';

    this.backBtn.addEventListener('click', () => {
      const from = manager.current;
      analytics.track(EVENTS.NAV_BACK, { from });
      manager.goBack();
    });

    document.body.appendChild(this.backBtn);
    manager.onChange((detail) => this.update(detail));
  }

  /** @param {{ screenId: string, index: number }} detail */
  update({ screenId, index }) {
    const hideOn =
      screenId === SCREENS.LOADING ||
      screenId === SCREENS.DATE_PLANNER ||
      screenId === SCREENS.BOUQUET;
    const visible = !hideOn && index >= BACK_VISIBLE_FROM;
    this.backBtn.classList.toggle('nav-back--visible', visible);
    this.backBtn.disabled = index <= BACK_DISABLED_AT_OR_BELOW;
  }
}
