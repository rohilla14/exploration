import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import {
  markJourneyComplete,
  nextGreeting,
  getHubAppLastVisit,
  markHubAppVisited,
  hasNewerContent,
} from '../utils/journey.js';
import { HUB_REGISTRY } from '../hub/registry.js';
import { createAmbientAtmosphere } from '../core/AmbientAtmosphere.js';
import { hubApi } from '../hub/api.js';

/** @param {{ analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createHubScreen({ analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--hub';

  const atmosphere = createAmbientAtmosphere(element, { intensity: 'hub' });

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

  async function fetchNewFlags() {
    const flags = {
      'memory-lane': false,
      'ask-me-anything': false,
      'our-playlist': false,
      'movie-nights': false,
      'dear-diary': false,
    };

    try {
      const [notes, questions, songs, movies, diary] = await Promise.all([
        hubApi.listLoveNotes().catch(() => []),
        hubApi.listQuestions().catch(() => []),
        hubApi.listSongs().catch(() => []),
        hubApi.listMovies().catch(() => []),
        hubApi.listDiary().catch(() => []),
      ]);

      flags['memory-lane'] = hasNewerContent(
        notes.map((n) => n.created_at),
        getHubAppLastVisit('memory-lane')
      );
      flags['ask-me-anything'] = hasNewerContent(
        questions.map((q) => q.created_at),
        getHubAppLastVisit('ask-me-anything')
      );
      flags['our-playlist'] = hasNewerContent(
        songs.map((s) => s.added_at),
        getHubAppLastVisit('our-playlist')
      );
      flags['movie-nights'] = hasNewerContent(
        movies.map((m) => m.added_at),
        getHubAppLastVisit('movie-nights')
      );
      flags['dear-diary'] = hasNewerContent(
        diary.map((d) => d.updated_at || d.created_at),
        getHubAppLastVisit('dear-diary')
      );
    } catch {
      // badges are optional — hub still works offline-ish
    }

    return flags;
  }

  async function buildGrid() {
    grid.innerHTML = '';
    const newFlags = await fetchNewFlags();

    CONFIG.hubApps.forEach((meta) => {
      const entry = HUB_REGISTRY.find((r) => r.id === meta.id);
      if (!entry) return;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'hub-card';
      card.dataset.appId = meta.id;
      card.innerHTML = `
        ${newFlags[meta.id] ? '<span class="hub-card__badge" aria-label="New content"></span>' : ''}
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
    markHubAppVisited(meta.id);
    const badge = grid.querySelector(`[data-app-id="${meta.id}"] .hub-card__badge`);
    badge?.remove();

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
    destroy() {
      atmosphere.destroy();
    },
  };
}
