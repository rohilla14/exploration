import { EVENTS } from '../constants/eventTypes.js';

/** @param {import('../analytics/Analytics.js').Analytics} [analytics] */
export class AudioManager {
  constructor(analytics) {
    this.analytics = analytics ?? null;

    this.music = new Audio('/assets/music.mp3');
    this.music.loop = true;
    this.music.volume = 0.35;

    this.click = new Audio('/assets/click.mp3');
    this.click.volume = 0.5;

    this.musicEnabled = false;

    this.btn = document.createElement('button');
    this.btn.className = 'audio-toggle';
    this.btn.type = 'button';
    this.btn.setAttribute('aria-label', 'Toggle background music');
    this.btn.innerHTML = '🔇';
    this.btn.addEventListener('click', () => this.toggleMusic());

    document.body.appendChild(this.btn);
    document.addEventListener(
      'click',
      (e) => {
        const target = e.target.closest(
          '[data-click-sound], button, .btn, .game-card, .option-btn, .continue-btn'
        );
        if (target && !target.classList.contains('audio-toggle') && !target.closest('.easter-egg-heart')) {
          this.playClick();
        }
      },
      true
    );
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    this.btn.innerHTML = this.musicEnabled ? '🔊' : '🔇';
    this.btn.classList.toggle('audio-toggle--on', this.musicEnabled);

    this.analytics?.track(EVENTS.AUDIO_TOGGLE, { enabled: this.musicEnabled });

    if (this.musicEnabled) {
      this.music.play().catch(() => {});
    } else {
      this.music.pause();
    }
  }

  playClick() {
    const clone = this.click.cloneNode();
    clone.volume = 0.5;
    clone.play().catch(() => {});
  }
}
