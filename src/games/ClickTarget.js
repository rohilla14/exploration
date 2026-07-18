import { EVENTS } from '../constants/eventTypes.js';

const DODGE_THRESHOLD = 80;
const MAX_DODGES = 5;
const CATCHABLE_AFTER_MS = 5000;

export function createClickTargetGame(container, { analytics, onComplete }) {
  const area = document.createElement('div');
  area.className = 'chase-area';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chase-btn';
  btn.textContent = 'Catch me! 😏';
  area.appendChild(btn);
  container.appendChild(area);

  let dodgeCount = 0;
  let catchable = false;
  let startTime = Date.now();
  /** @type {((e: MouseEvent) => void) | null} */
  let moveHandler = null;

  function clampPos(x, y) {
    const rect = area.getBoundingClientRect();
    const bw = btn.offsetWidth;
    const bh = btn.offsetHeight;
    return {
      left: Math.max(10, Math.min(x, rect.width - bw - 10)),
      top: Math.max(10, Math.min(y, rect.height - bh - 10)),
    };
  }

  function randomPos() {
    const rect = area.getBoundingClientRect();
    const bw = btn.offsetWidth || 120;
    const bh = btn.offsetHeight || 44;
    return clampPos(
      Math.random() * (rect.width - bw - 20) + 10,
      Math.random() * (rect.height - bh - 20) + 10
    );
  }

  function setBtnPos(pos) {
    btn.style.left = `${pos.left}px`;
    btn.style.top = `${pos.top}px`;
  }

  function dodge(e) {
    if (catchable) return;

    const btnRect = btn.getBoundingClientRect();
    const dist = Math.hypot(
      e.clientX - (btnRect.left + btnRect.width / 2),
      e.clientY - (btnRect.top + btnRect.height / 2)
    );

    if (dist < DODGE_THRESHOLD) {
      dodgeCount += 1;
      if (dodgeCount % 2 === 0) {
        analytics.track(EVENTS.CHASE_DODGE, { dodgeCount, context: 'click_target_game' });
      }

      const areaRect = area.getBoundingClientRect();
      const relX = e.clientX - areaRect.left;
      const relY = e.clientY - areaRect.top;
      const newPos = clampPos(
        btn.offsetLeft + (btn.offsetLeft - relX) * 0.5 + (Math.random() - 0.5) * 60,
        btn.offsetTop + (btn.offsetTop - relY) * 0.5 + (Math.random() - 0.5) * 60
      );
      setBtnPos(newPos);

      if (dodgeCount >= MAX_DODGES || Date.now() - startTime >= CATCHABLE_AFTER_MS) {
        catchable = true;
        btn.textContent = 'Okay fine, click me 😄';
      }
    }
  }

  function start() {
    dodgeCount = 0;
    catchable = false;
    startTime = Date.now();
    btn.textContent = 'Catch me! 😏';
    setBtnPos(randomPos());

    moveHandler = (e) => dodge(e);
    area.addEventListener('mousemove', moveHandler);
    btn.onclick = () => onComplete('Gotcha! 🎯');

    setTimeout(() => {
      catchable = true;
      btn.textContent = 'Okay fine, click me 😄';
    }, CATCHABLE_AFTER_MS);
  }

  function destroy() {
    if (moveHandler) area.removeEventListener('mousemove', moveHandler);
    area.remove();
  }

  return { start, destroy };
}
