import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';

export function createThisOrThatGame(container, { analytics, onComplete }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tot-wrapper';

  const questionEl = document.createElement('p');
  questionEl.className = 'tot-question';

  const optionsEl = document.createElement('div');
  optionsEl.className = 'tot-options';

  wrapper.appendChild(questionEl);
  wrapper.appendChild(optionsEl);
  container.appendChild(wrapper);

  let currentQ = 0;
  const choices = [];

  function showQuestion() {
    const q = CONFIG.thisOrThatQuestions[currentQ];
    questionEl.textContent = `${q.a} or ${q.b}?`;
    questionEl.style.opacity = '0';
    requestAnimationFrame(() => {
      questionEl.style.transition = 'opacity 0.3s';
      questionEl.style.opacity = '1';
    });

    optionsEl.innerHTML = '';
    [q.a, q.b].forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        choices.push(opt);
        analytics.track(EVENTS.THIS_OR_THAT_CHOICE, {
          questionIndex: currentQ,
          choice: opt,
          question: `${q.a} or ${q.b}`,
        });
        currentQ += 1;
        if (currentQ >= CONFIG.thisOrThatQuestions.length) {
          showSummary();
        } else {
          questionEl.style.opacity = '0';
          setTimeout(showQuestion, 300);
        }
      });
      optionsEl.appendChild(btn);
    });
  }

  function showSummary() {
    wrapper.innerHTML = '';
    const summary = document.createElement('div');
    summary.className = 'tot-summary';
    summary.innerHTML = `
      <p class="game-result__title">Your vibe check ✨</p>
      <p>You picked: ${choices.join(', ')}</p>
      <p style="margin-top:1rem;color:var(--text-light)">No wrong answers, just good taste 😄</p>
    `;
    wrapper.appendChild(summary);
    setTimeout(() => onComplete('Vibe check complete!'), 1500);
  }

  function start() {
    currentQ = 0;
    choices.length = 0;
    wrapper.innerHTML = '';
    wrapper.appendChild(questionEl);
    wrapper.appendChild(optionsEl);
    showQuestion();
  }

  function destroy() {
    wrapper.remove();
  }

  return { start, destroy };
}
