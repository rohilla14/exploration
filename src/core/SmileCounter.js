import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';

const STORAGE_KEY = 'exploration.smileCount';

/** @param {number} count */
function getSmileTier(count) {
  const tiers = CONFIG.smileTiers ?? [{ min: 0, emoji: '😊', label: CONFIG.smileCounterLabel, glow: 0 }];
  let tier = tiers[0];
  for (const t of tiers) {
    if (count >= t.min) tier = t;
  }
  return tier;
}

/** @param {number} count */
function tierIndex(count) {
  const tiers = CONFIG.smileTiers ?? [];
  let idx = 0;
  tiers.forEach((t, i) => {
    if (count >= t.min) idx = i;
  });
  return idx;
}

/**
 * Persistent smile counter — top corner, emoji evolves as count grows.
 * @param {{ analytics: import('../analytics/Analytics.js').Analytics, confetti?: import('./Confetti.js').Confetti }} services
 */
export function initSmileCounter({ analytics, confetti }) {
  let count = Number(sessionStorage.getItem(STORAGE_KEY) || 0);
  let hoverIdx = 0;
  let hideTimer = null;

  const root = document.createElement('div');
  root.className = 'smile-counter';
  root.innerHTML = `
    <button type="button" class="smile-counter__btn" aria-label="${CONFIG.smileCounterLabel}">
      <span class="smile-counter__emoji"></span>
      <span class="smile-counter__count">0</span>
      <span class="smile-counter__label"></span>
    </button>
    <div class="smile-counter__bubble" hidden></div>
  `;

  const btn = root.querySelector('.smile-counter__btn');
  const emojiEl = root.querySelector('.smile-counter__emoji');
  const countEl = root.querySelector('.smile-counter__count');
  const labelEl = root.querySelector('.smile-counter__label');
  const bubble = root.querySelector('.smile-counter__bubble');
  const baseMessages = CONFIG.smileHoverMessages ?? [];
  const highMessages = CONFIG.smileHoverMessagesHigh ?? [];

  function messagePool() {
    if (count >= 10 && highMessages.length) return highMessages;
    if (count >= 5 && highMessages.length) return [...baseMessages, ...highMessages];
    return baseMessages;
  }

  function applyTier() {
    const tier = getSmileTier(count);
    const idx = tierIndex(count);
    emojiEl.textContent = tier.emoji;
    labelEl.textContent = tier.label;
    countEl.textContent = String(count);
    root.dataset.tier = String(idx);
    root.dataset.glow = String(tier.glow ?? 0);
    root.classList.toggle('smile-counter--active', count > 0);
    root.classList.toggle('smile-counter--legend', count >= 40);
  }

  function showBubble() {
    const messages = messagePool();
    if (!messages.length) return;
    clearTimeout(hideTimer);
    bubble.textContent = messages[hoverIdx % messages.length];
    hoverIdx += 1;
    bubble.hidden = false;
    root.classList.add('smile-counter--hover');
  }

  function hideBubbleSoon() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      bubble.hidden = true;
      root.classList.remove('smile-counter--hover');
    }, 2200);
  }

  btn.addEventListener('mouseenter', showBubble);
  btn.addEventListener('focus', showBubble);
  btn.addEventListener('mouseleave', hideBubbleSoon);
  btn.addEventListener('blur', hideBubbleSoon);

  btn.addEventListener('click', () => {
    count += 1;
    sessionStorage.setItem(STORAGE_KEY, String(count));
    applyTier();
    btn.classList.add('smile-counter__btn--pop');
    window.setTimeout(() => btn.classList.remove('smile-counter__btn--pop'), 420);
    const burst = Math.min(18 + Math.floor(count / 3) * 4, 48);
    confetti?.burst(burst);
    analytics.track(EVENTS.SMILE_PRESS, { count, tier: tierIndex(count) });
    showBubble();
    hideBubbleSoon();
  });

  applyTier();
  document.body.appendChild(root);
}
