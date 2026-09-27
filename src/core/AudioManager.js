import { EVENTS } from '../constants/eventTypes.js';
import { playChime, playClick, playWhoosh, startAmbientPad } from '../utils/sfx.js';

/** Elements that should make a sound when pressed. */
const CLICKABLE =
  '[data-click-sound], button, .btn, .game-card, .option-btn, .continue-btn, .desk-icon, .dp-place, .dp-mood, .dp-time';

/** Elements that get the warmer chime instead of the plain tick. */
const CHIME = '.btn--yes, .dp__next--final, .big-ask__btn, .story-hub__continue, .explore__go';

/**
 * All sound is generated in the browser, so there are no audio files to ship or
 * to go missing. Music is off until she turns it on.
 * @param {import('../analytics/Analytics.js').Analytics} [analytics]
 */
export class AudioManager {
  constructor(analytics) {
    this.analytics = analytics ?? null;
    this.musicEnabled = false;
    /** @type {{ stop: () => void } | null} */
    this.pad = null;

    this.btn = document.createElement('button');
    this.btn.className = 'audio-toggle';
    this.btn.type = 'button';
    this.btn.setAttribute('aria-label', 'Toggle background sound');
    this.btn.innerHTML = '🔇';
    this.btn.addEventListener('click', () => this.toggleMusic());

    document.body.appendChild(this.btn);

    document.addEventListener(
      'click',
      (e) => {
        const target = e.target.closest(CLICKABLE);
        if (!target) return;
        if (target.classList.contains('audio-toggle') || target.closest('.easter-egg-heart')) return;
        if (target.matches(CHIME)) this.playChime();
        else this.playClick();
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
      this.pad = startAmbientPad();
    } else {
      this.pad?.stop();
      this.pad = null;
    }
  }

  playClick() {
    playClick();
  }

  playChime() {
    playChime();
  }

  /** Called when a screen changes. */
  playWhoosh() {
    playWhoosh();
  }
}
