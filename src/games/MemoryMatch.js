import { EVENTS } from '../constants/eventTypes.js';

const EMOJIS = ['💖', '⭐', '🌸', '🦋', '🌙', '✨'];
const PAIRS = 6;

export function createMemoryMatchGame(container, { analytics, onComplete }) {
  const grid = document.createElement('div');
  grid.className = 'memory-grid';
  container.appendChild(grid);

  let flipped = [];
  let matched = 0;
  let locked = false;

  function buildDeck() {
    const deck = [...EMOJIS.slice(0, PAIRS), ...EMOJIS.slice(0, PAIRS)];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function createCard(emoji, index) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.emoji = emoji;
    card.dataset.index = String(index);
    card.innerHTML = `
      <div class="memory-card__inner">
        <div class="memory-card__face memory-card__front">?</div>
        <div class="memory-card__face memory-card__back">${emoji}</div>
      </div>
    `;
    card.addEventListener('click', () => handleFlip(card));
    return card;
  }

  function handleFlip(card) {
    if (
      locked ||
      card.classList.contains('memory-card--flipped') ||
      card.classList.contains('memory-card--matched')
    ) {
      return;
    }

    card.classList.add('memory-card--flipped');
    flipped.push(card);

    if (flipped.length === 2) {
      locked = true;
      const [a, b] = flipped;
      if (a.dataset.emoji === b.dataset.emoji) {
        a.classList.add('memory-card--matched');
        b.classList.add('memory-card--matched');
        matched += 1;
        analytics.track(EVENTS.MEMORY_MATCH, { matched, total: PAIRS, emoji: a.dataset.emoji });
        flipped = [];
        locked = false;
        if (matched >= PAIRS) {
          setTimeout(() => onComplete('You did it! 🎉'), 600);
        }
      } else {
        setTimeout(() => {
          a.classList.remove('memory-card--flipped');
          b.classList.remove('memory-card--flipped');
          flipped = [];
          locked = false;
        }, 800);
      }
    }
  }

  function start() {
    grid.innerHTML = '';
    flipped = [];
    matched = 0;
    locked = false;
    buildDeck().forEach((emoji, i) => grid.appendChild(createCard(emoji, i)));
  }

  function destroy() {
    grid.remove();
  }

  return { start, destroy };
}
