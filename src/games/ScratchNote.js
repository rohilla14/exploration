import { CONFIG } from '../config.js';
import { ScratchCard } from '../core/ScratchCard.js';
import { EVENTS } from '../constants/eventTypes.js';
import { playChime } from '../utils/sfx.js';

export function createScratchNoteGame(container, { analytics, onComplete }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'game-scratch-wrap';
  container.appendChild(wrapper);

  /** @type {ScratchCard | null} */
  let card = null;
  let revealed = false;
  let stage = 0;

  function mountNote(message, completeMsg) {
    wrapper.innerHTML = '';
    revealed = false;
    const label = document.createElement('p');
    label.className = 'scratch-label';
    label.textContent = stage === 0 ? 'Scratch the foil' : 'One more secret…';
    wrapper.appendChild(label);

    card = new ScratchCard(wrapper, message, {
      onProgress: (ratio) => {
        if (revealed || ratio < 0.55) return;
        revealed = true;
        analytics.track(EVENTS.SCRATCH_COMPLETE, { context: 'hidden_note', ratio, stage });
        playChime();
        setTimeout(() => {
          if (stage === 0 && CONFIG.hiddenNoteSecond) {
            stage = 1;
            mountNote(CONFIG.hiddenNoteSecond, 'Both secrets revealed');
          } else {
            onComplete(completeMsg);
          }
        }, 700);
      },
    });
    requestAnimationFrame(() => card?.mount());
  }

  function start() {
    stage = 0;
    mountNote(CONFIG.hiddenNote, 'Secret note revealed');
  }

  function destroy() {
    card?.destroy();
    wrapper.remove();
  }

  return { start, destroy };
}
