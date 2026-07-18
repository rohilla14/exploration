import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createEnvelopeScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--envelope';

  const inner = document.createElement('div');
  inner.className = 'screen__inner';

  inner.innerHTML = `
    <p class="envelope-caption">I made you something...</p>
    <div class="envelope" role="button" tabindex="0" aria-label="Open envelope">
      <div class="envelope__body"></div>
      <div class="envelope__letter">✉️ a little surprise inside</div>
      <div class="envelope__flap"></div>
      <div class="envelope__seal">💌</div>
    </div>
    <p class="envelope-hint">click to open</p>
  `;

  element.appendChild(inner);

  const envelope = inner.querySelector('.envelope');
  let opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;
    analytics.track(EVENTS.ENVELOPE_OPEN);
    envelope.classList.add('envelope--opening');
    lc.trackTimeout(
      setTimeout(() => manager.goTo(SCREENS.REASONS), 1400)
    );
  }

  lc.bindListener(envelope, 'click', openEnvelope);
  lc.bindListener(envelope, 'keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });

  return {
    element,
    onEnter() {
      lc.reset();
      opened = false;
      envelope.classList.remove('envelope--opening');
    },
    onExit() {
      lc.reset();
    },
  };
}
