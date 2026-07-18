import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { GAME_REGISTRY } from '../games/registry.js';
import { createLifecycle } from '../utils/lifecycle.js';

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createGamesHubScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--games';

  const inner = document.createElement('div');
  inner.className = 'screen__inner';

  const hubView = document.createElement('div');
  hubView.className = 'games-hub';

  hubView.innerHTML = `
    <h2 class="games-hub__title">Mini Games</h2>
    <p class="games-hub__subtitle">Pick your poison 😄</p>
  `;

  const gamesGrid = document.createElement('div');
  gamesGrid.className = 'games-grid';

  const continueBtn = document.createElement('button');
  continueBtn.type = 'button';
  continueBtn.className = 'btn btn--primary continue-btn';
  continueBtn.textContent = 'Continue to next step';
  lc.bindListener(continueBtn, 'click', () => {
    analytics.track(EVENTS.GAME_HUB_CONTINUE, { to: SCREENS.ANTICIPATION });
    manager.goTo(SCREENS.ANTICIPATION);
  });

  hubView.appendChild(gamesGrid);
  inner.appendChild(hubView);
  inner.appendChild(continueBtn);
  element.appendChild(inner);

  const overlay = document.createElement('div');
  overlay.className = 'game-overlay';
  element.appendChild(overlay);

  const completed = new Set();
  /** @type {{ destroy: () => void } | null} */
  let activeGame = null;

  function updateHub() {
    gamesGrid.innerHTML = '';
    GAME_REGISTRY.forEach((game) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'game-card' + (completed.has(game.id) ? ' game-card--done' : '');
      card.innerHTML = `
        <span class="game-card__emoji">${game.emoji}</span>
        <span class="game-card__name">${game.name}</span>
      `;
      card.addEventListener('click', () => launchGame(game));
      gamesGrid.appendChild(card);
    });

    if (completed.size >= 1) {
      continueBtn.classList.add('continue-btn--visible');
    }
  }

  function launchGame(game) {
    closeGame();
    analytics.track(EVENTS.GAME_OPEN, { gameId: game.id, gameName: game.name });
    overlay.classList.add('game-overlay--active');
    overlay.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'game-overlay__header';
    header.innerHTML = `<span>${game.emoji} ${game.name}</span>`;
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'game-overlay__back';
    backBtn.textContent = '← Back to hub';
    backBtn.addEventListener('click', closeGame);
    header.appendChild(backBtn);

    const gameArea = document.createElement('div');
    gameArea.className = 'game-area';

    overlay.appendChild(header);
    overlay.appendChild(gameArea);

    activeGame = game.factory(gameArea, {
      analytics,
      onComplete: (message) => showResult(game, message, gameArea),
    });
    activeGame.start();
  }

  function showResult(game, message, gameArea) {
    completed.add(game.id);
    analytics.track(EVENTS.GAME_COMPLETE, { gameId: game.id, message });
    updateHub();

    const result = document.createElement('div');
    result.className = 'game-result';
    result.innerHTML = `
      <p class="game-result__title">${message}</p>
      <button type="button" class="btn btn--secondary game-result__back">Back to hub</button>
    `;
    result.querySelector('.game-result__back')?.addEventListener('click', closeGame);
    gameArea.appendChild(result);
  }

  function closeGame() {
    if (activeGame) {
      analytics.track(EVENTS.GAME_BACK, { hadActiveGame: true });
      activeGame.destroy();
      activeGame = null;
    }
    overlay.classList.remove('game-overlay--active');
    overlay.innerHTML = '';
  }

  return {
    element,
    onEnter() {
      lc.reset();
      updateHub();
    },
    onExit() {
      closeGame();
      lc.reset();
    },
  };
}
