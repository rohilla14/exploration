import { CONFIG } from '../../config.js';
import { applyCoverBackground } from '../../utils/photos.js';

const CHAR_DELAY = 42;
const PAUSE_BETWEEN = 700;

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} _ctx */
export function createWhyIMadeThisApp(container, { analytics: _analytics }) {
  let destroyed = false;
  let typeInterval = null;
  let pauseTimeout = null;

  container.innerHTML = `
    <div class="hub-app hub-app--why">
      <div class="why-made__photo-bg photo-slot photo-slot--empty" aria-hidden="true"></div>
      <div class="why-made__content">
        <div class="why-made__paragraphs" data-role="paragraphs"></div>
      </div>
    </div>
  `;

  const photoBg = container.querySelector('.why-made__photo-bg');
  const paragraphsEl = container.querySelector('[data-role="paragraphs"]');

  function clearTimers() {
    if (typeInterval != null) {
      clearInterval(typeInterval);
      typeInterval = null;
    }
    if (pauseTimeout != null) {
      clearTimeout(pauseTimeout);
      pauseTimeout = null;
    }
  }

  function typeParagraph(text, onDone) {
    const p = document.createElement('p');
    p.className = 'why-made__paragraph';

    const textSpan = document.createElement('span');
    textSpan.className = 'why-made__text';

    const cursor = document.createElement('span');
    cursor.className = 'why-made__cursor';
    cursor.textContent = '|';

    p.append(textSpan, cursor);
    paragraphsEl.appendChild(p);
    p.scrollIntoView({ block: 'nearest' });

    let i = 0;
    typeInterval = setInterval(() => {
      if (destroyed) {
        clearTimers();
        return;
      }
      if (i < text.length) {
        textSpan.textContent += text[i];
        i += 1;
      } else {
        clearInterval(typeInterval);
        typeInterval = null;
        cursor.remove();
        onDone();
      }
    }, CHAR_DELAY);
  }

  function typeSequence(index) {
    if (destroyed) return;
    const lines = CONFIG.whyIMadeThisText || [];
    if (index >= lines.length) return;

    typeParagraph(lines[index], () => {
      if (destroyed) return;
      if (index + 1 >= lines.length) return;
      pauseTimeout = setTimeout(() => {
        pauseTimeout = null;
        typeSequence(index + 1);
      }, PAUSE_BETWEEN);
    });
  }

  return {
    start() {
      destroyed = false;
      clearTimers();
      paragraphsEl.innerHTML = '';

      const src = CONFIG.whyIMadeThisPhoto;
      if (src) applyCoverBackground(photoBg, src);

      typeSequence(0);
    },
    destroy() {
      destroyed = true;
      clearTimers();
    },
  };
}
