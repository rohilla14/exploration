import { HARD_DAY_NOTE } from '../../content/words.js';
import { escapeHtml } from '../../utils/dom.js';

/** One message, always the same, always there. Not a list, not a puzzle. Just open it. */
export function createForHardDaysApp(container) {
  container.innerHTML = `
    <div class="hub-app hub-app--harddays">
      <article class="letters__page" tabindex="-1">
        <h3 class="letters__title">${escapeHtml(HARD_DAY_NOTE.title)}</h3>
        ${HARD_DAY_NOTE.paragraphs
          .map((p, n) => `<p class="letters__line" style="--n:${n}">${escapeHtml(p)}</p>`)
          .join('')}
      </article>
    </div>
  `;

  return {
    start() {},
    destroy() {},
  };
}
