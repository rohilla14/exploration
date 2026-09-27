import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { createAmbientAtmosphere } from '../core/AmbientAtmosphere.js';
import { applyCoverBackground, focusOf } from '../utils/photos.js';

const TICK_MS = 60;
const PAUSE_AFTER = 900;

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createLoadingScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--loading';

  const photoBg = document.createElement('div');
  photoBg.className = 'loading__photo-bg photo-slot photo-slot--empty';
  photoBg.setAttribute('aria-hidden', 'true');
  element.appendChild(photoBg);

  const atmosphere = createAmbientAtmosphere(element, { intensity: 'loading' });

  const inner = document.createElement('div');
  inner.className = 'screen__inner win setup';
  inner.setAttribute('role', 'dialog');
  inner.setAttribute('aria-label', 'Our World Setup');
  inner.innerHTML = `
    <header class="win__bar">
      <span class="win__dots" aria-hidden="true">
        <span class="win__dot win__dot--close"></span>
        <span class="win__dot win__dot--min"></span>
        <span class="win__dot win__dot--max"></span>
      </span>
      <span class="win__title">Our World Setup</span>
    </header>
    <div class="setup__body">
      <aside class="setup__art" aria-hidden="true"><span>♡</span></aside>
      <div class="setup__main">
        <p class="loading__for"></p>
        <h2 class="setup__title">Setting up Our World</h2>
        <p class="setup__lead"></p>
        <div class="setup__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <span class="setup__progress-fill"></span>
        </div>
        <p class="setup__status" aria-live="polite"></p>
      </div>
    </div>
    <footer class="setup__footer">
      <button type="button" class="win-btn" disabled>Back</button>
      <button type="button" class="win-btn win-btn--primary" data-role="next" disabled>Next</button>
      <button type="button" class="win-btn" data-role="cancel">Cancel</button>
    </footer>
  `;
  element.appendChild(inner);

  // Side panel cycles through a few photos while "installing".
  const art = inner.querySelector('.setup__art');
  const collage = (CONFIG.photos?.loadingCollage ?? []).map((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'setup__slide';
    slide.style.backgroundImage = `url(${src})`;
    slide.style.backgroundPosition = focusOf(src);
    if (i === 0) slide.classList.add('setup__slide--on');
    art.prepend(slide);
    return slide;
  });

  const forHer = inner.querySelector('.loading__for');
  const lead = inner.querySelector('.setup__lead');
  const bar = inner.querySelector('.setup__progress');
  const fill = inner.querySelector('.setup__progress-fill');
  const status = inner.querySelector('.setup__status');
  const nextBtn = inner.querySelector('[data-role="next"]');
  const cancelBtn = inner.querySelector('[data-role="cancel"]');

  forHer.textContent = `for ${CONFIG.herName}`;
  lead.textContent = CONFIG.loadingText;

  let finished = false;

  function advance() {
    if (finished) return;
    finished = true;
    analytics.track(EVENTS.AUTO_ADVANCE, { to: SCREENS.SCROLL_STORY });
    manager.goTo(SCREENS.SCROLL_STORY);
  }

  function setProgress(pct) {
    const value = Math.min(100, Math.round(pct));
    if (collage.length) {
      const shown = Math.min(collage.length - 1, Math.floor((value / 100) * collage.length));
      collage.forEach((slide, i) => slide.classList.toggle('setup__slide--on', i === shown));
    }
    fill.style.width = `${value}%`;
    bar.setAttribute('aria-valuenow', String(value));
    const steps = CONFIG.loadingSteps;
    status.textContent = steps[Math.min(steps.length - 1, Math.floor((value / 100) * steps.length))];
  }

  function runInstall() {
    finished = false;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Next';
    let pct = 0;
    setProgress(0);

    const interval = setInterval(() => {
      // Uneven steps so it feels like real work rather than a straight line.
      pct += 1 + Math.random() * 2.6;
      if (pct >= 100) {
        clearInterval(interval);
        setProgress(100);
        status.textContent = CONFIG.loadingDone;
        nextBtn.textContent = 'Finish';
        nextBtn.disabled = false;
        lc.trackTimeout(setTimeout(advance, PAUSE_AFTER));
        return;
      }
      setProgress(pct);
    }, TICK_MS);
    lc.trackInterval(interval);
  }

  lc.bindListener(nextBtn, 'click', advance);
  lc.bindListener(cancelBtn, 'click', () => {
    inner.classList.remove('setup--shake');
    void inner.offsetWidth;
    inner.classList.add('setup--shake');
    cancelBtn.textContent = 'Not a chance 💛';
  });

  return {
    element,
    onEnter() {
      lc.reset();
      cancelBtn.textContent = 'Cancel';
      const photoSrc = CONFIG.loadingPhoto || CONFIG.photos?.cinematic;
      if (photoSrc) applyCoverBackground(photoBg, photoSrc);
      runInstall();
    },
    onExit() {
      lc.reset();
    },
    destroy() {
      lc.destroy();
      atmosphere.destroy();
    },
  };
}
