import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';

export function createCatchHeartsGame(container, { analytics, onComplete }) {
  const area = document.createElement('div');
  area.className = 'catch-area';

  const counter = document.createElement('div');
  counter.className = 'catch-counter';
  counter.textContent = `Caught: 0 / ${CONFIG.heartsTarget}`;

  area.appendChild(counter);
  container.appendChild(area);

  let caught = 0;
  let spawnInterval = null;
  const hearts = new Set();

  function spawnHeart() {
    const heart = document.createElement('div');
    heart.className = 'falling-heart';
    heart.textContent = '💖';
    heart.style.left = `${10 + Math.random() * 80}%`;
    heart.style.animationDuration = `${2.5 + Math.random() * 2}s`;

    heart.addEventListener('click', () => {
      heart.remove();
      hearts.delete(heart);
      caught += 1;
      counter.textContent = `Caught: ${caught} / ${CONFIG.heartsTarget}`;
      analytics.track(EVENTS.HEART_CAUGHT, { caught, target: CONFIG.heartsTarget });

      if (caught >= CONFIG.heartsTarget) {
        clearInterval(spawnInterval);
        onComplete('You caught them all! 💕');
      }
    });

    heart.addEventListener('animationend', () => {
      heart.remove();
      hearts.delete(heart);
    });

    hearts.add(heart);
    area.appendChild(heart);
  }

  function start() {
    caught = 0;
    counter.textContent = `Caught: 0 / ${CONFIG.heartsTarget}`;
    hearts.forEach((h) => h.remove());
    hearts.clear();
    spawnHeart();
    spawnInterval = setInterval(spawnHeart, 700);
  }

  function destroy() {
    clearInterval(spawnInterval);
    hearts.forEach((h) => h.remove());
    area.remove();
  }

  return { start, destroy };
}
