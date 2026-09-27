import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { focusOf } from '../utils/photos.js';
import { escapeHtml } from '../utils/dom.js';
import { createAmbientAtmosphere } from '../core/AmbientAtmosphere.js';
import Lenis from 'lenis';

const GLITCH_CHARS =
  '!@#$%^&*?~<>[]{}|/\\ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const GLITCH_DURATION = 1500;

function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createScrollStoryScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--cinematic';

  const atmosphere = createAmbientAtmosphere(element, { intensity: 'story' });

  const scrollRoot = document.createElement('div');
  scrollRoot.className = 'cinematic-scroll';

  const track = document.createElement('div');
  track.className = 'story-track';

  // —— Greeting (top of scroll — scroll back anytime to see this) ——
  const greetingSection = document.createElement('div');
  greetingSection.className = 'story-greeting';

  const greetingInner = document.createElement('div');
  greetingInner.className = 'story-greeting__inner';

  const greetingPhotos = document.createElement('div');
  greetingPhotos.className = 'story-greeting__photos';

  const greeting = document.createElement('h1');
  greeting.className = 'greeting-text greeting-text--glitch';

  const softLine = document.createElement('p');
  softLine.className = 'story-greeting__soft typewriter';
  softLine.innerHTML =
    '<span class="typewriter__text"></span><span class="typewriter__cursor">|</span>';

  const scrollHint = document.createElement('p');
  scrollHint.className = 'story-greeting__scroll';
  scrollHint.textContent = 'scroll ↓';

  greetingInner.appendChild(greetingPhotos);
  greetingInner.appendChild(greeting);
  greetingInner.appendChild(softLine);
  greetingInner.appendChild(scrollHint);
  greetingSection.appendChild(greetingInner);

  function addPolaroid(className, src) {
    const wrap = document.createElement('div');
    wrap.className = `polaroid ${className}`;
    wrap.innerHTML = `<img alt="" />`;
    const img = wrap.querySelector('img');
    img.style.objectPosition = focusOf(src);
    const probe = new Image();
    probe.onload = () => {
      img.src = src;
      lc.trackTimeout(setTimeout(() => wrap.classList.add('polaroid--visible'), 400));
    };
    probe.src = src;
    greetingPhotos.appendChild(wrap);
  }

  if (CONFIG.photos?.polaroidA) {
    addPolaroid('polaroid--a', CONFIG.photos.polaroidA);
  }
  if (CONFIG.photos?.polaroidB) {
    addPolaroid('polaroid--b', CONFIG.photos.polaroidB);
  }

  // —— Cinematic chapter ——
  const cinematicTrack = document.createElement('div');
  cinematicTrack.className = 'cinematic-track';

  const sticky = document.createElement('div');
  sticky.className = 'cinematic-sticky';

  const photoWrap = document.createElement('div');
  photoWrap.className = 'cinematic-photo-wrap';

  // One photo layer per beat. Each beat has its own crop, so the photo moves like a camera.
  const beats = CONFIG.storyBeats ?? [];
  const photoLayers = beats.map((beat, i) => {
    const layer = document.createElement('div');
    layer.className = 'cinematic-photo cinematic-photo--placeholder';
    if (i === 0) layer.classList.add('cinematic-photo--active');
    const img = new Image();
    img.onload = () => {
      layer.classList.remove('cinematic-photo--placeholder');
      layer.style.backgroundImage = `url(${beat.photo})`;
      layer.style.backgroundPosition = beat.focus || focusOf(beat.photo);
    };
    img.src = beat.photo;
    photoWrap.appendChild(layer);
    return layer;
  });
  let activePhoto = 0;

  const vignette = document.createElement('div');
  vignette.className = 'cinematic-vignette';

  const linesWrap = document.createElement('div');
  linesWrap.className = 'cinematic-lines';

  // Each line is split into words so they can light up one at a time as she scrolls.
  const lineEls = beats.map((beat) => {
    const p = document.createElement('p');
    p.className = 'cinematic-line';
    p.innerHTML = beat.line
      .split(' ')
      .map((w) => `<span class="cinematic-word">${escapeHtml(w)}</span>`)
      .join(' ');
    linesWrap.appendChild(p);
    return { el: p, words: [...p.querySelectorAll('.cinematic-word')] };
  });

  const finale = document.createElement('p');
  finale.className = 'cinematic-finale';
  finale.textContent = CONFIG.cinematicFinale;

  photoWrap.appendChild(vignette);
  sticky.appendChild(photoWrap);
  sticky.appendChild(linesWrap);
  sticky.appendChild(finale);
  cinematicTrack.appendChild(sticky);

  // —— Film strip: scrolls sideways while she scrolls down ——
  const stripTrack = document.createElement('div');
  stripTrack.className = 'strip-track';
  const stripSticky = document.createElement('div');
  stripSticky.className = 'strip-sticky';
  const stripRail = document.createElement('div');
  stripRail.className = 'strip-rail';
  const stripPhotos = (CONFIG.gallery ?? []).filter((p) => p?.src);
  stripPhotos.forEach(({ src, caption }) => {
    const frame = document.createElement('figure');
    frame.className = 'strip-frame';
    frame.innerHTML = `
      <span class="strip-frame__img" style="background-image:url(${src});background-position:${focusOf(src)}"></span>
      <figcaption class="strip-frame__cap">${escapeHtml(caption ?? '')}</figcaption>
    `;
    stripRail.appendChild(frame);
  });
  const stripLabel = document.createElement('p');
  stripLabel.className = 'strip-label';
  stripLabel.textContent = CONFIG.storyStripLabel;
  stripSticky.append(stripLabel, stripRail);
  stripTrack.appendChild(stripSticky);

  // —— Hand-off to the photo-lens page (after the cinematic) ——
  const hubSection = document.createElement('div');
  hubSection.className = 'story-hub';

  const hubInner = document.createElement('div');
  hubInner.className = 'story-hub__inner';

  const hubIntro = document.createElement('p');
  hubIntro.className = 'story-hub__intro';
  hubIntro.textContent = CONFIG.storyHandoffIntro;

  const hubContinue = document.createElement('button');
  hubContinue.type = 'button';
  hubContinue.className = 'btn btn--primary story-hub__continue';
  hubContinue.textContent = CONFIG.storyContinueLabel;

  hubInner.appendChild(hubIntro);
  hubInner.appendChild(hubContinue);
  hubSection.appendChild(hubInner);

  track.appendChild(greetingSection);
  track.appendChild(cinematicTrack);
  track.appendChild(stripTrack);
  track.appendChild(hubSection);
  // A thin rail down the side: it fills as she scrolls, with a dot per chapter.
  const rail = document.createElement('div');
  rail.className = 'story-rail';
  rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = '<span class="story-rail__line"></span>';
  const railDots = ['greeting', 'story', 'photos', 'end'].map(() => {
    const dot = document.createElement('span');
    dot.className = 'story-rail__dot';
    rail.appendChild(dot);
    return dot;
  });

  scrollRoot.appendChild(track);
  element.appendChild(scrollRoot);
  element.appendChild(rail);

  const finalText = `Hey ${CONFIG.herName} 🌙`;
  const SOFT_CHAR_DELAY = 42;
  let savedScrollTop = 0;
  let hasVisited = false;

  /** How far through the cinematic chapter she is, 0 to 1. */
  function getCinematicProgress() {
    const top = cinematicTrack.offsetTop;
    const span = cinematicTrack.offsetHeight - scrollRoot.clientHeight;
    if (span <= 0) return 0;
    return clamp((scrollRoot.scrollTop - top) / span);
  }

  /** How far through the film strip she is, 0 to 1. */
  function getStripProgress() {
    const top = stripTrack.offsetTop;
    const span = stripTrack.offsetHeight - scrollRoot.clientHeight;
    if (span <= 0) return 0;
    return clamp((scrollRoot.scrollTop - top) / span);
  }

  const LINES_START = 0.1;
  const LINES_END = 0.82;

  function applyScrollProgress() {
    const p = getCinematicProgress();
    const beatSpan = (LINES_END - LINES_START) / Math.max(1, lineEls.length);

    // The photo opens up as the chapter starts, then pulls back at the end.
    const openPhase = clamp(p / 0.16);
    const exitPhase = clamp((p - 0.86) / 0.14);
    photoWrap.style.opacity = String(clamp(openPhase * 1.3) * (1 - exitPhase));
    photoWrap.style.transform = `scale(${lerp(lerp(1.14, 1, openPhase), 1.1, exitPhase)})`;
    vignette.style.opacity = String(lerp(0.3, 0.85, Math.max(exitPhase, 1 - openPhase)));

    lineEls.forEach(({ el, words }, i) => {
      const start = LINES_START + i * beatSpan;
      const local = clamp((p - start) / beatSpan);
      // The line holds while its words light up, then eases away as the next one starts.
      const inPhase = clamp(local / 0.55);
      const outPhase = clamp((local - 0.88) / 0.12);
      el.style.opacity = String(inPhase * (1 - outPhase));
      el.style.transform = `translateY(${lerp(22, 0, inPhase) + outPhase * -14}px)`;

      words.forEach((word, w) => {
        const at = words.length > 1 ? w / words.length : 0;
        const lit = local > at * 0.62 + 0.04;
        word.classList.toggle('cinematic-word--lit', lit);
      });

      // Hand the photo over as each beat takes over.
      if (local > 0.02 && local < 1 && i !== activePhoto) {
        photoLayers[activePhoto]?.classList.remove('cinematic-photo--active');
        photoLayers[i]?.classList.add('cinematic-photo--active');
        activePhoto = i;
      }
    });

    linesWrap.style.opacity = String(1 - exitPhase);

    const finalePhase = clamp((p - 0.88) / 0.12);
    finale.style.opacity = String(finalePhase);
    finale.style.transform = `translateY(${lerp(24, 0, finalePhase)}px) scale(${lerp(0.96, 1, finalePhase)})`;

    applyStripProgress();
    updateRail(p);
  }

  /** Slide the film strip sideways as she scrolls down past it. */
  function applyStripProgress() {
    const sp = getStripProgress();
    const travel = Math.max(0, stripRail.scrollWidth - stripSticky.clientWidth + 48);
    stripRail.style.transform = `translate3d(${-travel * sp}px, 0, 0)`;
    stripLabel.style.opacity = String(clamp(sp / 0.12) * (1 - clamp((sp - 0.9) / 0.1)));
  }

  /** Fill the little rail down the side so the scroll has a shape. */
  function updateRail(cineP) {
    const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
    const overall = maxScroll > 0 ? clamp(scrollRoot.scrollTop / maxScroll) : 0;
    rail.style.setProperty('--rail-fill', `${(overall * 100).toFixed(1)}%`);
    railDots.forEach((dot, i) => {
      const tops = [0, cinematicTrack.offsetTop, stripTrack.offsetTop, hubSection.offsetTop];
      const next = tops[i + 1] ?? Infinity;
      dot.classList.toggle(
        'story-rail__dot--on',
        scrollRoot.scrollTop >= tops[i] - 10 && scrollRoot.scrollTop < next - 10
      );
    });
    void cineP;
  }

  function scramble(text) {
    return text
      .split('')
      .map((ch) =>
        ch === ' ' ? ' ' : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      )
      .join('');
  }

  function runSoftTypewriter() {
    const text = CONFIG.greetingSoftLine;
    const textEl = softLine.querySelector('.typewriter__text');
    const cursor = softLine.querySelector('.typewriter__cursor');
    textEl.textContent = '';
    softLine.classList.add('story-greeting__soft--active');

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        textEl.textContent += text[i];
        i += 1;
      } else {
        clearInterval(interval);
        if (cursor) cursor.style.opacity = '0';
      }
    }, SOFT_CHAR_DELAY);
    lc.trackInterval(interval);
  }

  function runGlitch() {
    const start = Date.now();
    greeting.textContent = scramble(finalText);

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = elapsed / GLITCH_DURATION;

      if (progress >= 1) {
        clearInterval(interval);
        greeting.textContent = finalText;
        greeting.classList.remove('greeting-text--glitch');
        greeting.classList.add('greeting-text--resolved');
        runSoftTypewriter();
        return;
      }

      const revealCount = Math.floor(finalText.length * progress);
      greeting.textContent =
        finalText.slice(0, revealCount) + scramble(finalText.slice(revealCount));
    }, 50);
    lc.trackInterval(interval);
  }

  function goToExplore() {
    analytics.track(EVENTS.MANUAL_CONTINUE, { from: SCREENS.SCROLL_STORY, to: SCREENS.EXPLORE });
    manager.goTo(SCREENS.EXPLORE);
  }

  lc.bindListener(hubContinue, 'click', goToExplore);

  let rafId = null;
  /** @type {import('lenis').default | null} */
  let lenis = null;
  let lenisRafId = null;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function onScrollRaf() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      applyScrollProgress();
    });
  }

  function destroyLenis() {
    if (lenisRafId) {
      cancelAnimationFrame(lenisRafId);
      lenisRafId = null;
    }
    if (lenis) {
      lenis.destroy();
      lenis = null;
    }
  }

  function initLenis() {
    destroyLenis();

    lenis = new Lenis({
      wrapper: scrollRoot,
      content: track,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on('scroll', () => {
      applyScrollProgress();
    });

    function raf(time) {
      if (!lenis) return;
      lenis.raf(time);
      lenisRafId = requestAnimationFrame(raf);
    }
    lenisRafId = requestAnimationFrame(raf);
  }

  return {
    element,
    onEnter() {
      lc.reset();
      destroyLenis();
      scrollRoot.scrollTop = hasVisited ? savedScrollTop : 0;
      if (!hasVisited) {
        greeting.classList.add('greeting-text--glitch');
        greeting.classList.remove('greeting-text--resolved');
        softLine.classList.remove('story-greeting__soft--active');
        softLine.querySelector('.typewriter__text').textContent = '';
        const cursor = softLine.querySelector('.typewriter__cursor');
        if (cursor) cursor.style.opacity = '';
        runGlitch();
      }
      hasVisited = true;
      applyScrollProgress();

      if (prefersReducedMotion()) {
        lc.trackListener(scrollRoot, 'scroll', onScrollRaf, { passive: true });
      } else {
        initLenis();
      }
    },
    onExit() {
      savedScrollTop = scrollRoot.scrollTop;
      destroyLenis();
      lc.reset();
      if (rafId) cancelAnimationFrame(rafId);
    },
  };
}
