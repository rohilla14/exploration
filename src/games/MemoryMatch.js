import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { playMatch, playChime, playTone } from '../utils/sfx.js';

export function createMemoryMatchGame(container, { analytics, onComplete }) {
  const pairs = CONFIG.memoryPairs || [
    { emoji: '☕', label: 'that walk' },
    { emoji: '🌙', label: 'late talk' },
    { emoji: '📷', label: 'polaroid' },
    { emoji: '🔑', label: 'your laugh' },
    { emoji: '⭐', label: 'little win' },
    { emoji: '💖', label: 'us' },
  ];

  const wrap = document.createElement('div');
  wrap.className = 'memory-wrap';
  wrap.innerHTML = `
    <div class="memory-hud">
      <span data-role="moves">Moves: 0</span>
      <span data-role="streak">Streak: 0</span>
    </div>
    <div class="memory-grid" data-role="grid"></div>
  `;
  container.appendChild(wrap);

  const grid = wrap.querySelector('[data-role="grid"]');
  const movesEl = wrap.querySelector('[data-role="moves"]');
  const streakEl = wrap.querySelector('[data-role="streak"]');

  let flipped = [];
  let matched = 0;
  let locked = false;
  let moves = 0;
  let streak = 0;

  function buildDeck() {
    const deck = pairs.flatMap((p) => [
      { emoji: p.emoji, label: p.label },
      { emoji: p.emoji, label: p.label },
    ]);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function createCard(item, index) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'memory-card';
    card.dataset.emoji = item.emoji;
    card.dataset.index = String(index);
    card.innerHTML = `
      <div class="memory-card__inner">
        <div class="memory-card__face memory-card__front">?</div>
        <div class="memory-card__face memory-card__back">
          <span class="memory-card__emoji">${item.emoji}</span>
          <span class="memory-card__label">${item.label}</span>
        </div>
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
    playTone(400, 0.04, 'triangle', 0.04);

    if (flipped.length === 2) {
      locked = true;
      moves += 1;
      movesEl.textContent = `Moves: ${moves}`;
      const [a, b] = flipped;
      if (a.dataset.emoji === b.dataset.emoji) {
        a.classList.add('memory-card--matched');
        b.classList.add('memory-card--matched');
        matched += 1;
        streak += 1;
        streakEl.textContent = `Streak: ${streak}`;
        playMatch();
        analytics.track(EVENTS.MEMORY_MATCH, { matched, total: pairs.length, emoji: a.dataset.emoji, streak });
        flipped = [];
        locked = false;
        if (matched >= pairs.length) {
          playChime();
          setTimeout(() => onComplete(`Memory of Us in ${moves} moves`), 600);
        }
      } else {
        streak = 0;
        streakEl.textContent = 'Streak: 0';
        setTimeout(() => {
          a.classList.remove('memory-card--flipped');
          b.classList.remove('memory-card--flipped');
          flipped = [];
          locked = false;
        }, 750);
      }
    }
  }

  function start() {
    grid.innerHTML = '';
    flipped = [];
    matched = 0;
    locked = false;
    moves = 0;
    streak = 0;
    movesEl.textContent = 'Moves: 0';
    streakEl.textContent = 'Streak: 0';
    buildDeck().forEach((item, i) => grid.appendChild(createCard(item, i)));
  }

  function destroy() {
    wrap.remove();
  }

  return { start, destroy };
}
