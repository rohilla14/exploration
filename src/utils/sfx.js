/** Tiny Web Audio sounds, generated in the browser. Silent if AudioContext is blocked. */
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

/** Soft tick for taps and clicks. */
export function playClick() {
  playTone(620, 0.045, 'triangle', 0.035);
}

/** Air moving: used when a screen changes or a window opens. */
export function playWhoosh() {
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === 'suspended') audio.resume();
    const now = audio.currentTime;
    const noise = audio.createBufferSource();
    const len = Math.floor(audio.sampleRate * 0.35);
    const buf = audio.createBuffer(1, len, audio.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    noise.buffer = buf;
    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(900, now);
    band.frequency.exponentialRampToValueAtTime(320, now + 0.32);
    band.Q.value = 1.2;
    const g = audio.createGain();
    g.gain.value = 0.05;
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    noise.connect(band);
    band.connect(g);
    g.connect(audio.destination);
    noise.start(now);
    noise.stop(now + 0.35);
  } catch {
    // ignore
  }
}

/**
 * A warm ambient pad, generated rather than loaded from a file.
 * Returns a handle so it can be stopped again.
 */
export function startAmbientPad() {
  const audio = getCtx();
  if (!audio) return null;
  try {
    if (audio.state === 'suspended') audio.resume();
    const out = audio.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(0.05, audio.currentTime + 2.5);

    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(out);
    out.connect(audio.destination);

    // Two slightly detuned voices a fifth apart make a soft, steady chord.
    const voices = [146.83, 220, 293.66].map((freq, i) => {
      const osc = audio.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = i === 1 ? 6 : -4;
      const vg = audio.createGain();
      vg.gain.value = i === 0 ? 0.5 : 0.28;
      osc.connect(vg);
      vg.connect(filter);
      osc.start();
      return osc;
    });

    // A very slow sweep so it never sits completely still.
    const lfo = audio.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = audio.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    return {
      stop() {
        try {
          const now = audio.currentTime;
          out.gain.cancelScheduledValues(now);
          out.gain.setValueAtTime(out.gain.value, now);
          out.gain.linearRampToValueAtTime(0.0001, now + 0.8);
          voices.forEach((o) => o.stop(now + 0.9));
          lfo.stop(now + 0.9);
        } catch {
          // ignore
        }
      },
    };
  } catch {
    return null;
  }
}
