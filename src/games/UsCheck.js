import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { playMatch, playChime } from '../utils/sfx.js';

export function createUsCheckGame(container, { analytics, onComplete }) {
  const pairs = CONFIG.usCheckPairs || [];
  const wrapper = document.createElement('div');
  wrapper.className = 'us-check';
  container.appendChild(wrapper);

  let index = 0;
  const overlaps = [];

  function renderPrompt() {
    const pair = pairs[index];
    wrapper.innerHTML = `
      <p class="us-check__progress">${index + 1} / ${pairs.length}</p>
      <p class="us-check__prompt">${pair.a} <span>or</span> ${pair.b}?</p>
      <div class="us-check__options">
        <button type="button" class="option-btn" data-choice="a">${pair.a}</button>
        <button type="button" class="option-btn" data-choice="b">${pair.b}</button>
      </div>
      <div class="us-check__reveal" data-role="reveal" hidden></div>
    `;

    wrapper.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => pick(btn.dataset.choice));
    });
  }

  function pick(choice) {
    const pair = pairs[index];
    const herPick = choice === 'a' ? pair.a : pair.b;
    const overlap = herPick === pair.myPick;
    overlaps.push(overlap);

    analytics.track(EVENTS.THIS_OR_THAT_CHOICE, {
      questionIndex: index,
      choice: herPick,
      overlap,
    });

    wrapper.querySelectorAll('.option-btn').forEach((b) => {
      b.disabled = true;
    });

    const reveal = wrapper.querySelector('[data-role="reveal"]');
    reveal.hidden = false;
    reveal.innerHTML = `
      <p class="us-check__her">You picked: <strong>${herPick}</strong></p>
      <p class="us-check__mine">${pair.myReveal}</p>
      ${overlap ? '<p class="us-check__overlap">Overlap ✨</p>' : '<p class="us-check__diff">Different, still cute.</p>'}
      <button type="button" class="btn btn--primary" data-role="next">${
        index + 1 >= pairs.length ? 'See score' : 'Next'
      }</button>
    `;
    playMatch();

    reveal.querySelector('[data-role="next"]')?.addEventListener('click', () => {
      index += 1;
      if (index >= pairs.length) {
        showScore();
      } else {
        renderPrompt();
      }
    });
  }

  function showScore() {
    const score = overlaps.filter(Boolean).length;
    playChime();
    wrapper.innerHTML = `
      <div class="us-check__summary">
        <p class="game-result__title">Us Check</p>
        <p class="us-check__score">${score} / ${pairs.length} overlapping picks</p>
        <p class="us-check__score-sub">${
          score >= 4
            ? 'We are suspiciously aligned.'
            : score >= 2
              ? 'Different tastes, same orbit.'
              : 'Opposites can still dance.'
        }</p>
      </div>
    `;
    setTimeout(() => onComplete(`Us Check: ${score}/${pairs.length} overlap`), 1200);
  }

  function start() {
    index = 0;
    overlaps.length = 0;
    if (!pairs.length) {
      onComplete('No pairs configured yet.');
      return;
    }
    renderPrompt();
  }

  function destroy() {
    wrapper.remove();
  }

  return { start, destroy };
}
