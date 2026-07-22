/** Tiny Web Audio ticks — silent if AudioContext is blocked. */
let ctx = null;

function getCtx() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
  return ctx;
}

export function playTone(freq = 520, duration = 0.07, type = 'sine', gain = 0.07) {
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === 'suspended') audio.resume();
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(audio.destination);
    const now = audio.currentTime;
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // ignore
  }
}

export function playPop() {
  playTone(680, 0.06, 'triangle', 0.06);
}

export function playMatch() {
  playTone(520, 0.05, 'sine', 0.05);
  setTimeout(() => playTone(780, 0.08, 'sine', 0.05), 50);
}

export function playChime() {
  playTone(440, 0.08, 'sine', 0.05);
  setTimeout(() => playTone(660, 0.1, 'sine', 0.05), 70);
  setTimeout(() => playTone(880, 0.12, 'sine', 0.04), 140);
}
