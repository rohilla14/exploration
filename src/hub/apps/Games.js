import { GAME_REGISTRY } from '../../games/registry.js';
import { getDoneGames, markGameDone } from '../../utils/gameProgress.js';
import { EVENTS } from '../../constants/eventTypes.js';
import { escapeHtml } from '../../utils/dom.js';

/** Mini games as a hub app: a picker, then the chosen game inside the same window. */
export function createGamesApp(container, { analytics }) {
  /** @type {{ destroy: () => void } | null} */
  let activeGame = null;
  let destroyed = false;

  function stopGame() {
    activeGame?.destroy();
    activeGame = null;
  }

  function showPicker() {
    stopGame();
    const done = getDoneGames();
    container.innerHTML = `
      <div class="hub-app hub-app--games">
        <p class="hub-app__subtitle">Pick one. No pressure, no score.</p>
        <div class="games-grid"></div>
      </div>
    `;
    const grid = container.querySelector('.games-grid');
    GAME_REGISTRY.forEach((game) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `game-card${done.has(game.id) ? ' game-card--done' : ''}`;
      card.innerHTML = `
        <span class="game-card__emoji">${game.emoji}</span>
        <span class="game-card__name">${escapeHtml(game.name)}</span>
      `;
      card.addEventListener('click', () => play(game));
      grid.appendChild(card);
    });
  }

  function play(game) {
    if (destroyed) return;
    container.innerHTML = '';
    analytics.track(EVENTS.GAME_OPEN, { gameId: game.id, gameName: game.name, from: 'hub' });

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'btn btn--secondary games-back';
    back.textContent = '← All games';
    back.addEventListener('click', showPicker);
    const area = document.createElement('div');
    area.className = 'games-play';
    container.append(back, area);

    activeGame = game.factory(area, {
      analytics,
      onComplete: (message) => {
        markGameDone(game.id);
        analytics.track(EVENTS.GAME_COMPLETE, { gameId: game.id, message });
        const result = document.createElement('div');
        result.className = 'game-result';
        result.innerHTML = `
          <p class="game-result__title">${escapeHtml(message)}</p>
          <button type="button" class="btn btn--secondary">Back to games</button>
        `;
        result.querySelector('button')?.addEventListener('click', showPicker);
        area.appendChild(result);
      },
    });
    activeGame.start();
  }

  return {
    start: showPicker,
    destroy() {
      destroyed = true;
      stopGame();
    },
  };
}
