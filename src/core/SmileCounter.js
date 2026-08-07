import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';

const STORAGE_KEY = 'exploration.smileCount';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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

/** @param {number} count */
function nextTierInfo(count) {
  const tiers = CONFIG.smileTiers ?? [];
  const idx = tierIndex(count);
  const next = tiers[idx + 1];
  if (!next) return null;
  return { label: next.label, remaining: Math.max(0, next.min - count) };
}

/**
 * Persistent smile counter — top corner, emoji evolves as count grows.
 * @param {{ analytics: import('../analytics/Analytics.js').Analytics, confetti?: import('./Confetti.js').Confetti }} services
 */
export function initSmileCounter({ analytics, confetti }) {
  let count = Number(sessionStorage.getItem(STORAGE_KEY) || 0);
  let hoverIdx = 0;
  let hideTimer = null;
  let lastTierIdx = tierIndex(count);

  const root = document.createElement('div');
  root.className = 'smile-counter';
  root.innerHTML = `
    <button type="button" class="smile-counter__btn" aria-label="${CONFIG.smileCounterLabel}">
      <span class="smile-counter__particles" data-role="particles" aria-hidden="true"></span>
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
  const particlesEl = root.querySelector('[data-role="particles"]');
  const baseMessages = CONFIG.smileHoverMessages ?? [];
  const highMessages = CONFIG.smileHoverMessagesHigh ?? [];

  if (!prefersReducedMotion()) {
    root.classList.add('smile-counter--breathe');
  }

  function messagePool() {
    if (count >= 10 && highMessages.length) return highMessages;
    if (count >= 5 && highMessages.length) return [...baseMessages, ...highMessages];
    return baseMessages;
  }

  function spawnParticles() {
    if (prefersReducedMotion() || !particlesEl) return;
    particlesEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const p = document.createElement('span');
      p.className = 'smile-counter__spark';
      p.textContent = i === 1 ? '✨' : '💕';
      p.style.setProperty('--sx', `${(Math.random() - 0.5) * 28}px`);
      p.style.setProperty('--delay', `${i * 0.05}s`);
      particlesEl.appendChild(p);
    }
    window.setTimeout(() => {
      if (particlesEl.isConnected) particlesEl.innerHTML = '';
    }, 900);
  }

  function applyTier({ animateLabel = false } = {}) {
    const tier = getSmileTier(count);
    const idx = tierIndex(count);
    emojiEl.textContent = tier.emoji;
    countEl.textContent = String(count);
    root.dataset.tier = String(idx);
    root.dataset.glow = String(tier.glow ?? 0);
    root.classList.toggle('smile-counter--active', count > 0);
    root.classList.toggle('smile-counter--legend', count >= 40);

    if (animateLabel && idx !== lastTierIdx && !prefersReducedMotion()) {
      labelEl.classList.add('smile-counter__label--out');
      window.setTimeout(() => {
        labelEl.textContent = tier.label;
        labelEl.classList.remove('smile-counter__label--out');
        labelEl.classList.add('smile-counter__label--in');
        root.classList.add('smile-counter--tier-glow');
        window.setTimeout(() => {
          labelEl.classList.remove('smile-counter__label--in');
          root.classList.remove('smile-counter--tier-glow');
        }, 480);
      }, 180);
    } else {
      labelEl.textContent = tier.label;
    }
    lastTierIdx = idx;
  }

  function showBubble() {
    clearTimeout(hideTimer);
    const next = nextTierInfo(count);
    if (next && next.remaining > 0) {
      bubble.textContent = `${next.remaining} more to ${next.label}`;
    } else {
      const messages = messagePool();
      if (!messages.length) return;
      bubble.textContent = messages[hoverIdx % messages.length];
      hoverIdx += 1;
    }
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
    const prevTier = lastTierIdx;
    count += 1;
    sessionStorage.setItem(STORAGE_KEY, String(count));
    applyTier({ animateLabel: true });
    btn.classList.add('smile-counter__btn--pop');
    emojiEl.classList.add('smile-counter__emoji--bounce');
    spawnParticles();
    window.setTimeout(() => {
      btn.classList.remove('smile-counter__btn--pop');
      emojiEl.classList.remove('smile-counter__emoji--bounce');
    }, 420);
    const burst = Math.min(18 + Math.floor(count / 3) * 4, 48);
    confetti?.burst(burst);
    analytics.track(EVENTS.SMILE_PRESS, { count, tier: tierIndex(count), prevTier });
    showBubble();
    hideBubbleSoon();
  });

  applyTier();
  document.body.appendChild(root);
}
