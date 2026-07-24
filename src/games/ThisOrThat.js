import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { hubApi } from '../hub/api.js';

export function createThisOrThatGame(container, { analytics, onComplete }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tot-wrapper';

  const questionEl = document.createElement('p');
  questionEl.className = 'tot-question';

  const optionsEl = document.createElement('div');
  optionsEl.className = 'tot-options';

  const reactionEl = document.createElement('p');
  reactionEl.className = 'tot-reaction';
  reactionEl.hidden = true;

  wrapper.appendChild(questionEl);
  wrapper.appendChild(optionsEl);
  wrapper.appendChild(reactionEl);
  container.appendChild(wrapper);

  let currentQ = 0;
  const choices = [];
  let destroyed = false;
  let advanceTimer = null;

  function clearAdvanceTimer() {
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
  }

  function showQuestion() {
    const q = CONFIG.thisOrThatQuestions[currentQ];
    questionEl.textContent = `${q.a} or ${q.b}?`;
    questionEl.style.opacity = '0';
    reactionEl.hidden = true;
    reactionEl.textContent = '';
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
      btn.addEventListener('click', () => onPick(q, opt, btn));
      optionsEl.appendChild(btn);
    });
  }

  async function onPick(q, opt, selectedBtn) {
    choices.push(opt);
    analytics.track(EVENTS.THIS_OR_THAT_CHOICE, {
      questionIndex: currentQ,
      choice: opt,
      question: `${q.a} or ${q.b}`,
    });

    optionsEl.querySelectorAll('.option-btn').forEach((btn) => {
      btn.disabled = true;
      if (btn === selectedBtn) btn.classList.add('option-btn--picked');
    });

    reactionEl.hidden = false;
    reactionEl.textContent = CONFIG.thisOrThatReactionLoading;
    try {
      const { reaction } = await hubApi.aiThisOrThatReaction({
        question: { a: q.a, b: q.b },
        herPick: opt,
      });
      if (destroyed || !reactionEl.isConnected) return;
      reactionEl.textContent = reaction || 'Bold choice. I respect it.';
    } catch {
      if (destroyed || !reactionEl.isConnected) return;
      reactionEl.textContent = 'Bold choice. I respect it.';
    }

    clearAdvanceTimer();
    advanceTimer = setTimeout(() => {
      if (destroyed) return;
      currentQ += 1;
      if (currentQ >= CONFIG.thisOrThatQuestions.length) {
        showSummary();
      } else {
        questionEl.style.opacity = '0';
        setTimeout(() => {
          if (!destroyed) showQuestion();
        }, 300);
      }
    }, 1400);
  }

  function showSummary() {
    clearAdvanceTimer();
    wrapper.innerHTML = '';
    const summary = document.createElement('div');
    summary.className = 'tot-summary';
    summary.innerHTML = `
      <p class="game-result__title">Your vibe check ✨</p>
      <p>You picked: ${choices.join(', ')}</p>
      <p style="margin-top:1rem;color:var(--text-light)">No wrong answers, just good taste 😄</p>
    `;
    wrapper.appendChild(summary);
    setTimeout(() => {
      if (!destroyed) onComplete('Vibe check complete!');
    }, 1500);
  }

  function start() {
    destroyed = false;
    clearAdvanceTimer();
    currentQ = 0;
    choices.length = 0;
    wrapper.innerHTML = '';
    wrapper.appendChild(questionEl);
    wrapper.appendChild(optionsEl);
    wrapper.appendChild(reactionEl);
    showQuestion();
  }

  function destroy() {
    destroyed = true;
    clearAdvanceTimer();
    wrapper.remove();
  }

  return { start, destroy };
}
