import { CONVERSATIONS } from '../../content/words.js';
import { escapeHtml } from '../../utils/dom.js';

const TYPING_MS = 700;
const PER_CHAR_MS = 14;

/** Conversations: a small messages app. Each chat plays out one bubble at a time. */
export function createConversationsApp(container) {
  let destroyed = false;
  let current = 0;
  /** @type {number[]} */
  let timers = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  container.innerHTML = `
    <div class="hub-app hub-app--chats">
      <div class="chats">
        <nav class="chats__list" aria-label="Conversations"></nav>
        <section class="chats__thread" aria-live="polite">
          <header class="chats__head"></header>
          <div class="chats__scroll"></div>
        </section>
      </div>
    </div>
  `;
  const list = container.querySelector('.chats__list');
  const head = container.querySelector('.chats__head');
  const scroll = container.querySelector('.chats__scroll');

  function clearTimers() {
    timers.forEach((t) => clearTimeout(t));
    timers = [];
  }

  function renderList() {
    list.innerHTML = CONVERSATIONS.map(
      (c, i) => `
        <button type="button" class="chats__item${i === current ? ' chats__item--active' : ''}" data-i="${i}">
          <span class="chats__avatar" aria-hidden="true">${i === 0 ? '🌙' : '💛'}</span>
          <span class="chats__item-text">
            <strong>${escapeHtml(c.title)}</strong>
            <small>${escapeHtml(c.subtitle)}</small>
          </span>
        </button>`
    ).join('');
    list.querySelectorAll('.chats__item').forEach((btn) =>
      btn.addEventListener('click', () => open(Number(btn.dataset.i)))
    );
  }

  function bubble(msg) {
    const el = document.createElement('p');
    el.className = `chats__bubble${msg.me ? ' chats__bubble--me' : ''}`;
    el.textContent = msg.text;
    return el;
  }

  function open(i) {
    clearTimers();
    current = i;
    const chat = CONVERSATIONS[i];
    list.querySelectorAll('.chats__item').forEach((btn, n) =>
      btn.classList.toggle('chats__item--active', n === i)
    );
    head.innerHTML = `<strong>${escapeHtml(chat.title)}</strong><small>${escapeHtml(chat.subtitle)}</small>`;
    scroll.innerHTML = '';

    if (reduceMotion) {
      chat.messages.forEach((m) => scroll.appendChild(bubble(m)));
      return;
    }

    let delay = 350;
    chat.messages.forEach((msg) => {
      // a little "typing" pause before each bubble, longer for longer messages
      const typing = document.createElement('p');
      typing.className = `chats__bubble chats__typing${msg.me ? ' chats__bubble--me' : ''}`;
      typing.innerHTML = '<i></i><i></i><i></i>';
      const wait = TYPING_MS + Math.min(1400, msg.text.length * PER_CHAR_MS);

      timers.push(
        window.setTimeout(() => {
          if (destroyed) return;
          scroll.appendChild(typing);
          scroll.scrollTop = scroll.scrollHeight;
        }, delay)
      );
      timers.push(
        window.setTimeout(() => {
          if (destroyed) return;
          typing.replaceWith(bubble(msg));
          scroll.scrollTop = scroll.scrollHeight;
        }, delay + wait)
      );
      delay += wait + 450;
    });
  }

  return {
    start() {
      renderList();
      open(0);
    },
    destroy() {
      destroyed = true;
      clearTimers();
    },
  };
}
