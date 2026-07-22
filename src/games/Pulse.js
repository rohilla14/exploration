import { EVENTS } from '../constants/eventTypes.js';
import { playPop, playChime } from '../utils/sfx.js';

const ROUNDS = [
  { bpm: 72, taps: 6 },
  { bpm: 92, taps: 8 },
  { bpm: 110, taps: 10 },
];
const HIT_WINDOW_MS = 160;

export function createPulseGame(container, { analytics, onComplete }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pulse-game';
  wrapper.innerHTML = `
    <p class="pulse-game__hint">Tap the glow when it peaks — stay on the beat.</p>
    <p class="pulse-game__round" data-role="round"></p>
    <div class="pulse-game__orb-wrap">
      <button type="button" class="pulse-game__orb" data-role="orb" aria-label="Tap on beat"></button>
    </div>
    <p class="pulse-game__score" data-role="score">Hits: 0</p>
  `;
  container.appendChild(wrapper);

  const orb = wrapper.querySelector('[data-role="orb"]');
  const roundEl = wrapper.querySelector('[data-role="round"]');
  const scoreEl = wrapper.querySelector('[data-role="score"]');

  let roundIdx = 0;
  let hits = 0;
  let needed = 0;
  let beatTimer = null;
  let beatAt = 0;
  let destroyed = false;

  function beatIntervalMs() {
    return 60000 / ROUNDS[roundIdx].bpm;
  }

  function scheduleBeats() {
    clearInterval(beatTimer);
    const ms = beatIntervalMs();
    beatAt = performance.now() + ms;
    pulseVisual(ms);
    beatTimer = setInterval(() => {
      beatAt = performance.now();
      pulseVisual(ms);
    }, ms);
  }

  function pulseVisual(ms) {
    orb.classList.remove('pulse-game__orb--beat');
    void orb.offsetWidth;
    orb.style.setProperty('--beat-ms', `${ms}ms`);
    orb.classList.add('pulse-game__orb--beat');
  }

  function onTap() {
    if (destroyed) return;
    const delta = Math.abs(performance.now() - beatAt);
    const onBeat = delta <= HIT_WINDOW_MS || Math.abs(delta - beatIntervalMs()) <= HIT_WINDOW_MS;

    if (onBeat) {
      hits += 1;
      needed += 1;
      playPop();
      orb.classList.add('pulse-game__orb--hit');
      setTimeout(() => orb.classList.remove('pulse-game__orb--hit'), 180);
      scoreEl.textContent = `Hits: ${hits}`;
      analytics.track(EVENTS.INTERACTION_CLICK, { gameId: 'pulse', action: 'hit', round: roundIdx + 1 });

      if (needed >= ROUNDS[roundIdx].taps) {
        roundIdx += 1;
        needed = 0;
        if (roundIdx >= ROUNDS.length) {
          clearInterval(beatTimer);
          playChime();
          onComplete('Perfect pulse. Your heart knows the beat.');
          return;
        }
        roundEl.textContent = `Round ${roundIdx + 1} of ${ROUNDS.length}`;
        scheduleBeats();
      }
    } else {
      orb.classList.add('pulse-game__orb--miss');
      setTimeout(() => orb.classList.remove('pulse-game__orb--miss'), 200);
    }
  }

  orb.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onTap();
  });

  function start() {
    destroyed = false;
    roundIdx = 0;
    hits = 0;
    needed = 0;
    scoreEl.textContent = 'Hits: 0';
    roundEl.textContent = `Round 1 of ${ROUNDS.length}`;
    scheduleBeats();
  }

  function destroy() {
    destroyed = true;
    clearInterval(beatTimer);
    wrapper.remove();
  }

  return { start, destroy };
}
