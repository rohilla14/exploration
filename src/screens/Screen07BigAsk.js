import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';

const PROXIMITY = 100;
const DODGE_RADIUS = 72;
const CHASE_CAPTURE_MS = 2000;
const DODGE_COOLDOWN_MS = 180;
const DODGE_STRENGTH = 0.28;

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createBigAskScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--bigask';

  const inner = document.createElement('div');
  inner.className = 'screen__inner screen-card';

  const question = document.createElement('h2');
  question.className = 'big-ask__question';
  question.textContent = CONFIG.bigAskQuestion;

  const buttonsWrap = document.createElement('div');
  buttonsWrap.className = 'big-ask__buttons';

  const yesBtn = document.createElement('button');
  yesBtn.type = 'button';
  yesBtn.className = 'btn btn--yes big-ask__btn';
  yesBtn.textContent = 'Yes';

  const noBtn = document.createElement('button');
  noBtn.type = 'button';
  noBtn.className = 'btn btn--no big-ask__btn';
  noBtn.textContent = 'No';

  const noMsg = document.createElement('p');
  noMsg.className = 'big-ask__no-msg';
  noMsg.textContent = CONFIG.bigAskNoCapturedMsg;

  const cursorEmoji = document.createElement('div');
  cursorEmoji.className = 'big-ask__cursor-emoji';
  cursorEmoji.setAttribute('aria-hidden', 'true');

  buttonsWrap.appendChild(yesBtn);
  buttonsWrap.appendChild(noBtn);
  buttonsWrap.appendChild(noMsg);

  inner.appendChild(question);
  inner.appendChild(buttonsWrap);
  element.appendChild(inner);
  document.body.appendChild(cursorEmoji);

  let chasing = false;
  let chaseAccum = 0;
  let lastChaseTs = 0;
  let lastDodgeTs = 0;
  let noCaptured = false;
  let dodgeCount = 0;
  let hoverTarget = null;

  function clampNoPos(x, y) {
    const rect = buttonsWrap.getBoundingClientRect();
    const bw = noBtn.offsetWidth;
    const bh = noBtn.offsetHeight;
    return {
      left: Math.max(0, Math.min(x, rect.width - bw)),
      top: Math.max(0, Math.min(y, rect.height - bh)),
    };
  }

  function setNoPos(left, top) {
    noBtn.style.left = `${left}px`;
    noBtn.style.top = `${top}px`;
  }

  function distanceTo(el, clientX, clientY) {
    const r = el.getBoundingClientRect();
    return Math.hypot(clientX - (r.left + r.width / 2), clientY - (r.top + r.height / 2));
  }

  function scaleYes(clientX, clientY) {
    const dist = distanceTo(yesBtn, clientX, clientY);
    const factor = Math.max(0, 1 - dist / PROXIMITY);
    yesBtn.style.transform = `scale(${1 + factor * 0.2})`;
  }

  function captureNo() {
    if (noCaptured) return;
    noCaptured = true;
    analytics.track(EVENTS.BIG_ASK_NO_GIVE_UP, { dodgeCount, chaseAccumMs: chaseAccum });
    noBtn.classList.add('big-ask__btn--captured');
    noBtn.textContent = 'No 🔒';
    noBtn.style.pointerEvents = 'none';
    noBtn.style.transition = 'left 0.35s ease-out, top 0.35s ease-out, transform 0.35s ease-out';
    noMsg.classList.add('big-ask__no-msg--visible');
    if (hoverTarget === 'no') hideCursorEmoji();
  }

  function dodgeNo(clientX, clientY) {
    if (noCaptured) return;

    const dist = distanceTo(noBtn, clientX, clientY);
    const now = Date.now();

    if (dist < DODGE_RADIUS) {
      if (!chasing) {
        chasing = true;
        lastChaseTs = now;
      } else {
        chaseAccum += now - lastChaseTs;
        lastChaseTs = now;
      }

      if (chaseAccum >= CHASE_CAPTURE_MS) {
        captureNo();
        return;
      }

      if (now - lastDodgeTs >= DODGE_COOLDOWN_MS) {
        lastDodgeTs = now;
        dodgeCount += 1;
        if (dodgeCount % 3 === 0) {
          analytics.track(EVENTS.BIG_ASK_NO_DODGE, { dodgeCount, chaseAccumMs: chaseAccum });
        }

        const rect = buttonsWrap.getBoundingClientRect();
        const btnRect = noBtn.getBoundingClientRect();
        const relX = clientX - rect.left - btnRect.width / 2;
        const relY = clientY - rect.top - btnRect.height / 2;
        const currentLeft = parseFloat(noBtn.style.left) || 0;
        const currentTop = parseFloat(noBtn.style.top) || 0;

        const away = clampNoPos(
          currentLeft + (currentLeft - relX) * DODGE_STRENGTH,
          currentTop + (currentTop - relY) * DODGE_STRENGTH
        );
        setNoPos(away.left, away.top);
      }
    } else {
      chasing = false;
      lastChaseTs = now;
    }
  }

  function resetButtons() {
    noCaptured = false;
    chasing = false;
    chaseAccum = 0;
    lastChaseTs = 0;
    lastDodgeTs = 0;
    dodgeCount = 0;
    hoverTarget = null;
    yesBtn.style.transform = 'scale(1)';
    noBtn.style.opacity = '1';
    noBtn.style.transform = 'scale(1)';
    noBtn.style.pointerEvents = 'auto';
    noBtn.style.transition = 'left 0.2s ease-out, top 0.2s ease-out, opacity 0.3s, transform 0.3s';
    noBtn.textContent = 'No';
    noBtn.classList.remove('big-ask__btn--captured');
    noMsg.classList.remove('big-ask__no-msg--visible');
    noBtn.style.position = 'absolute';
  }

  function layoutNoButton() {
    const w = buttonsWrap.offsetWidth;
    const h = buttonsWrap.offsetHeight;
    if (!w) return;
    setNoPos(w * 0.52, h * 0.35);
  }

  function showCursorEmoji(emoji) {
    cursorEmoji.textContent = emoji;
    cursorEmoji.classList.add('big-ask__cursor-emoji--visible');
  }

  function hideCursorEmoji() {
    cursorEmoji.classList.remove('big-ask__cursor-emoji--visible');
    hoverTarget = null;
  }

  function moveCursorEmoji(clientX, clientY) {
    cursorEmoji.style.left = `${clientX}px`;
    cursorEmoji.style.top = `${clientY}px`;
  }

  lc.bindListener(yesBtn, 'click', () => {
    analytics.track(EVENTS.BIG_ASK_YES);
    manager.goTo(SCREENS.DATE_PLANNER);
  });

  lc.bindListener(yesBtn, 'mouseenter', () => {
    hoverTarget = 'yes';
    showCursorEmoji('🥰');
  });

  lc.bindListener(yesBtn, 'mouseleave', () => {
    if (hoverTarget === 'yes') hideCursorEmoji();
  });

  lc.bindListener(noBtn, 'mouseenter', () => {
    if (noCaptured) return;
    hoverTarget = 'no';
    showCursorEmoji('😢');
  });

  lc.bindListener(noBtn, 'mouseleave', () => {
    if (hoverTarget === 'no') hideCursorEmoji();
  });

  const onMove = (e) => {
    if (hoverTarget) {
      moveCursorEmoji(e.clientX, e.clientY);
    }
    scaleYes(e.clientX, e.clientY);
    dodgeNo(e.clientX, e.clientY);
  };

  return {
    element,
    onEnter() {
      lc.reset();
      resetButtons();
      hideCursorEmoji();
      element.classList.add('screen--bigask-active');
      requestAnimationFrame(layoutNoButton);
      lc.trackListener(document, 'mousemove', onMove);
    },
    onExit() {
      lc.reset();
      element.classList.remove('screen--bigask-active');
      hideCursorEmoji();
    },
  };
}
