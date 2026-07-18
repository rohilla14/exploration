import { SCREEN_ORDER, PROGRESS_VISIBLE_FROM } from '../constants/screens.js';

export class ProgressIndicator {
  constructor() {
    this.visibleFromIndex = SCREEN_ORDER.indexOf(PROGRESS_VISIBLE_FROM);
    this.total = SCREEN_ORDER.length;

    this.el = document.createElement('nav');
    this.el.className = 'progress-indicator';
    this.el.setAttribute('aria-label', 'Progress');

    this.label = document.createElement('span');
    this.label.className = 'progress-indicator__label';

    this.track = document.createElement('div');
    this.track.className = 'progress-indicator__track';
    this.bar = document.createElement('div');
    this.bar.className = 'progress-indicator__bar';
    this.track.appendChild(this.bar);

    this.dots = document.createElement('div');
    this.dots.className = 'progress-indicator__dots';

    for (let i = 0; i < this.total; i++) {
      const dot = document.createElement('span');
      dot.className = 'progress-indicator__dot';
      dot.dataset.step = String(i);
      this.dots.appendChild(dot);
    }

    this.el.appendChild(this.label);
    this.el.appendChild(this.track);
    this.el.appendChild(this.dots);
    document.body.appendChild(this.el);
  }

  /** @param {{ screenId: string, index: number }} detail */
  update({ screenId, index }) {
    const visible = index >= this.visibleFromIndex;
    this.el.classList.toggle('progress-indicator--visible', visible);
    if (!visible) return;

    const step = index + 1;
    this.label.textContent = `step ${step} of ${this.total}`;
    this.bar.style.width = `${(step / this.total) * 100}%`;

    this.dots.querySelectorAll('.progress-indicator__dot').forEach((dot, i) => {
      dot.classList.toggle('progress-indicator__dot--active', i === index);
      dot.classList.toggle('progress-indicator__dot--done', i < index);
      dot.dataset.screenId = SCREEN_ORDER[i];
    });
  }
}
