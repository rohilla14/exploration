import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { markJourneyComplete, nextGreeting } from '../utils/journey.js';
import { HUB_REGISTRY } from '../hub/registry.js';

/** @param {{ analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createHubScreen({ analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--hub';

  const inner = document.createElement('div');
  inner.className = 'screen__inner hub__inner';

  const greeting = document.createElement('p');
  greeting.className = 'hub__greeting';

  const title = document.createElement('h2');
  title.className = 'hub__title';
  title.textContent = CONFIG.hubTitle;

  const subtitle = document.createElement('p');
  subtitle.className = 'hub__subtitle';
  subtitle.textContent = CONFIG.hubSubtitle;

  const grid = document.createElement('div');
  grid.className = 'hub-grid';

  inner.appendChild(greeting);
  inner.appendChild(title);
  inner.appendChild(subtitle);
  inner.appendChild(grid);
  element.appendChild(inner);

  const overlay = document.createElement('div');
  overlay.className = 'hub-overlay';
  element.appendChild(overlay);

  /** @type {{ destroy: () => void } | null} */
  let activeApp = null;

  function buildGrid() {
    grid.innerHTML = '';
    CONFIG.hubApps.forEach((meta) => {
      const entry = HUB_REGISTRY.find((r) => r.id === meta.id);
      if (!entry) return;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'hub-card';
      card.innerHTML = `
        <span class="hub-card__emoji">${meta.emoji}</span>
        <span class="hub-card__name">${meta.name}</span>
        <span class="hub-card__desc">${meta.description}</span>
      `;
      card.addEventListener('click', () => launchApp(meta, entry));
      grid.appendChild(card);
    });
  }

  function launchApp(meta, entry) {
    closeApp();
    analytics.track(EVENTS.HUB_APP_OPEN, { appId: meta.id, appName: meta.name });
    overlay.classList.add('hub-overlay--active');
    overlay.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'hub-overlay__header';
    header.innerHTML = `<span>${meta.emoji} ${meta.name}</span>`;
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'hub-overlay__back';
    backBtn.textContent = '← Back to Our World';
    backBtn.addEventListener('click', closeApp);
    header.appendChild(backBtn);

    const appArea = document.createElement('div');
    appArea.className = 'hub-app-area';

    overlay.appendChild(header);
    overlay.appendChild(appArea);

    activeApp = entry.factory(appArea, { analytics });
    activeApp.start();
  }

  function closeApp() {
    if (activeApp) {
      analytics.track(EVENTS.HUB_APP_BACK, { hadActiveApp: true });
      activeApp.destroy();
      activeApp = null;
    }
    overlay.classList.remove('hub-overlay--active');
    overlay.innerHTML = '';
  }

  return {
    element,
    onEnter() {
      lc.reset();
      markJourneyComplete();
      greeting.textContent = nextGreeting(CONFIG.hubReturnGreetings);
      buildGrid();
    },
    onExit() {
      closeApp();
      lc.reset();
    },
  };
}
