import { LETTERS } from '../../content/words.js';
import { escapeHtml } from '../../utils/dom.js';

/** Letters: things written down properly. A list on the side, one page at a time. */
export function createLettersApp(container) {
  let current = 0;

  container.innerHTML = `
    <div class="hub-app hub-app--letters">
      <p class="hub-app__subtitle">Things I wanted to say properly.</p>
      <div class="letters">
        <nav class="letters__list" aria-label="Letters"></nav>
        <article class="letters__page" tabindex="-1"></article>
      </div>
    </div>
  `;
  const list = container.querySelector('.letters__list');
  const page = container.querySelector('.letters__page');

  function renderList() {
    list.innerHTML = LETTERS.map(
      (l, i) => `
        <button type="button" class="letters__item${i === current ? ' letters__item--active' : ''}" data-i="${i}">
          <span class="letters__item-title">${escapeHtml(l.title)}</span>
          <span class="letters__item-peek">${escapeHtml(l.paragraphs[0])}</span>
        </button>`
    ).join('');
    list.querySelectorAll('.letters__item').forEach((btn) =>
      btn.addEventListener('click', () => open(Number(btn.dataset.i)))
    );
  }

  function open(i) {
    current = i;
    const letter = LETTERS[i];
    page.innerHTML = `
      <h3 class="letters__title">${escapeHtml(letter.title)}</h3>
      ${letter.paragraphs
        .map((p, n) => `<p class="letters__line" style="--n:${n}">${escapeHtml(p)}</p>`)
        .join('')}
    `;
    page.scrollTop = 0;
    list.querySelectorAll('.letters__item').forEach((btn, n) =>
      btn.classList.toggle('letters__item--active', n === i)
    );
    list.querySelector('.letters__item--active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  return {
    start() {
      renderList();
      open(0);
    },
    destroy() {},
  };
}
