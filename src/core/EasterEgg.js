import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { resolveTemplate } from '../utils/configHelpers.js';

/** @param {import('../analytics/Analytics.js').Analytics} [analytics] */
export class EasterEgg {
  constructor(analytics) {
    this.analytics = analytics ?? null;
    this.clicks = 0;
    this.resetTimer = null;

    this.heart = document.createElement('button');
    this.heart.className = 'easter-egg-heart';
    this.heart.type = 'button';
    this.heart.setAttribute('aria-label', 'Secret heart');
    this.heart.innerHTML = '♥';
    this.heart.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleClick();
    });

    this.modal = document.createElement('div');
    this.modal.className = 'easter-egg-modal';
    this.modal.innerHTML = `
      <div class="easter-egg-modal__backdrop"></div>
      <div class="easter-egg-modal__content">
        <p class="easter-egg-modal__text"></p>
        <button type="button" class="btn btn--primary" data-click-sound>hehe okay 😄</button>
      </div>
    `;
    this.modal.style.display = 'none';
    this.modal.querySelector('.easter-egg-modal__backdrop')?.addEventListener('click', () => this.close());
    this.modal.querySelector('button')?.addEventListener('click', () => this.close());

    document.body.appendChild(this.heart);
    document.body.appendChild(this.modal);
  }

  handleClick() {
    this.clicks += 1;
    this.analytics?.track(EVENTS.EASTER_EGG_CLICK, { clickCount: this.clicks });

    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.clicks = 0;
    }, 3000);

    if (this.clicks >= 5) {
      this.clicks = 0;
      this.open();
    }
  }

  open() {
    const joke = resolveTemplate(CONFIG.easterEggMessage, { insideJoke: CONFIG.insideJoke });
    this.modal.querySelector('.easter-egg-modal__text').textContent = joke;
    this.modal.style.display = 'flex';
    this.analytics?.track(EVENTS.EASTER_EGG_OPEN);
    requestAnimationFrame(() => this.modal.classList.add('easter-egg-modal--open'));
  }

  close() {
    this.modal.classList.remove('easter-egg-modal--open');
    setTimeout(() => {
      this.modal.style.display = 'none';
    }, 300);
  }
}
