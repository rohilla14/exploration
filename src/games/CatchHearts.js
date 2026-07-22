import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { playPop, playChime } from '../utils/sfx.js';

const COMBO_LINES = ['nice catch', "she's unstoppable", 'okay show-off', 'heart thief', 'keep going'];

export function createCatchHeartsGame(container, { analytics, onComplete }) {
  const target = CONFIG.heartsTarget || 12;

  const area = document.createElement('div');
  area.className = 'catch-area catch-area--rain';

  const counter = document.createElement('div');
  counter.className = 'catch-counter';

  const ring = document.createElement('div');
  ring.className = 'catch-progress';
  ring.innerHTML = `<div class="catch-progress__fill" data-role="fill"></div>`;

  const toast = document.createElement('div');
  toast.className = 'catch-toast';
  toast.hidden = true;

  area.appendChild(counter);
  area.appendChild(ring);
  area.appendChild(toast);
  container.appendChild(area);

  let caught = 0;
  let combo = 0;
  let spawnInterval = null;
  const hearts = new Set();

  function updateHud() {
    counter.textContent = `Caught: ${caught} / ${target}`;
    const fill = ring.querySelector('[data-role="fill"]');
    if (fill) fill.style.width = `${Math.min(100, (caught / target) * 100)}%`;
  }

  function showToast(text) {
    toast.hidden = false;
    toast.textContent = text;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.hidden = true;
    }, 900);
  }

  function spawnHeart() {
    const heart = document.createElement('button');
    heart.type = 'button';
    heart.className = 'falling-heart';
    heart.textContent = '💖';
    heart.style.left = `${8 + Math.random() * 84}%`;
    heart.style.animationDuration = `${2.2 + Math.random() * 2.2}s`;

    heart.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!hearts.has(heart)) return;
      heart.remove();
      hearts.delete(heart);
      caught += 1;
      combo += 1;
      playPop();
      updateHud();
      analytics.track(EVENTS.HEART_CAUGHT, { caught, target, combo });

      if (combo === 3 || combo === 6 || combo === 10) {
        showToast(COMBO_LINES[Math.floor(Math.random() * COMBO_LINES.length)]);
      }

      if (caught >= target) {
        clearInterval(spawnInterval);
        playChime();
        onComplete('You caught them all! 💕');
      }
    });

    heart.addEventListener('animationend', () => {
      if (hearts.has(heart)) {
        combo = 0;
        hearts.delete(heart);
        heart.remove();
      }
    });

    hearts.add(heart);
    area.appendChild(heart);
  }

  function start() {
    caught = 0;
    combo = 0;
    updateHud();
    hearts.forEach((h) => h.remove());
    hearts.clear();
    clearInterval(spawnInterval);
    spawnHeart();
    spawnInterval = setInterval(spawnHeart, 620);
  }

  function destroy() {
    clearInterval(spawnInterval);
    clearTimeout(showToast._t);
    hearts.forEach((h) => h.remove());
    area.remove();
  }

  return { start, destroy };
}
