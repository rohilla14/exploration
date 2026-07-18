import { CONFIG } from '../config.js';
import { ScratchCard } from '../core/ScratchCard.js';
import { EVENTS } from '../constants/eventTypes.js';

export function createScratchNoteGame(container, { analytics, onComplete }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'game-scratch-wrap';
  container.appendChild(wrapper);

  /** @type {ScratchCard | null} */
  let card = null;
  let revealed = false;

  function start() {
    wrapper.innerHTML = '';
    revealed = false;
    card = new ScratchCard(wrapper, CONFIG.hiddenNote, {
      onProgress: (ratio) => {
        if (revealed || ratio < 0.55) return;
        revealed = true;
        analytics.track(EVENTS.SCRATCH_COMPLETE, { context: 'hidden_note', ratio });
        setTimeout(() => onComplete('Secret note revealed! 💌'), 800);
      },
    });
    requestAnimationFrame(() => card?.mount());
  }

  function destroy() {
    card?.destroy();
    wrapper.remove();
  }

  return { start, destroy };
}
