import { CONFIG } from '../config.js';
import { SCREENS } from '../constants/screens.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { GAME_REGISTRY } from '../games/registry.js';
import { getDoneGames, markGameDone } from '../utils/gameProgress.js';
import { createAmbientAtmosphere } from '../core/AmbientAtmosphere.js';
import { createMemoryLaneApp } from '../hub/apps/MemoryLane.js';
import { createAskMeAnythingApp } from '../hub/apps/AskMeAnything.js';
import { createOurPlaylistApp } from '../hub/apps/OurPlaylist.js';
import { createMovieNightsApp } from '../hub/apps/MovieNights.js';
import { createDearDiaryApp } from '../hub/apps/DearDiary.js';
import { createPhotoWallApp } from '../hub/apps/PhotoWall.js';
import { createHoroscopeApp } from '../hub/apps/Horoscope.js';
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

  const cinematicSrc = CONFIG.photos?.cinematic || '/assets/photo.jpeg';
  const photoLayer = document.createElement('div');
  photoLayer.className = 'cinematic-photo cinematic-photo--active cinematic-photo--placeholder';
  photoLayer.innerHTML = 'Your photo goes here<small>public/assets/photo.jpeg</small>';

  const cinematicImg = new Image();
  cinematicImg.src = cinematicSrc;
  cinematicImg.onload = () => {
    photoLayer.classList.remove('cinematic-photo--placeholder');
    photoLayer.textContent = '';
    photoLayer.style.backgroundImage = `url(${cinematicSrc})`;
  };
  photoWrap.appendChild(photoLayer);

  const vignette = document.createElement('div');
  vignette.className = 'cinematic-vignette';

  const linesWrap = document.createElement('div');
  linesWrap.className = 'cinematic-lines';

  CONFIG.cinematicLines.forEach((line) => {
    const p = document.createElement('p');
    p.className = 'cinematic-line';
    p.textContent = line;
    linesWrap.appendChild(p);
  });

  const finale = document.createElement('p');
  finale.className = 'cinematic-finale';
  finale.textContent = CONFIG.cinematicFinale;

  photoWrap.appendChild(vignette);
  sticky.appendChild(photoWrap);
  sticky.appendChild(linesWrap);
  sticky.appendChild(finale);
  cinematicTrack.appendChild(sticky);

  // —— Hub intro (after cinematic — scroll to see what's on the site) ——
  const hubSection = document.createElement('div');
  hubSection.className = 'story-hub';

  const hubInner = document.createElement('div');
  hubInner.className = 'story-hub__inner';

  const hubIntro = document.createElement('p');
  hubIntro.className = 'story-hub__intro';
  hubIntro.textContent = CONFIG.hubIntro;

  const hubGrid = document.createElement('div');
  hubGrid.className = 'story-hub__grid';

  const CARD_ACCENTS = [
    'var(--peach)',
    'var(--sky-soft)',
    'var(--rose-dusty)',
    'var(--sage)',
    'var(--butter)',
    'var(--cream-warm)',
  ];

  CONFIG.hubFeatures.forEach((feature, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'story-hub__card screen-card';
    card.dataset.featureId = feature.id;
    card.style.setProperty('--card-accent', CARD_ACCENTS[index % CARD_ACCENTS.length]);
    card.innerHTML = `
      <span class="story-hub__card-icon">${feature.icon}</span>
      <h3 class="story-hub__card-title">${feature.title}</h3>
      <p class="story-hub__card-desc">${feature.description}</p>
    `;
    card.addEventListener('click', () => openFeature(feature, card));
    card.addEventListener('pointermove', (e) => tiltCard(card, e));
    card.addEventListener('pointerleave', () => resetCardTilt(card));
    hubGrid.appendChild(card);
  });

  const hubContinue = document.createElement('button');
  hubContinue.type = 'button';
  hubContinue.className = 'btn btn--primary story-hub__continue';
  hubContinue.textContent = CONFIG.hubContinueLabel;

  hubInner.appendChild(hubIntro);
  hubInner.appendChild(hubGrid);
  hubInner.appendChild(hubContinue);
  hubSection.appendChild(hubInner);

  track.appendChild(greetingSection);
  track.appendChild(cinematicTrack);
  track.appendChild(hubSection);
  scrollRoot.appendChild(track);
  element.appendChild(scrollRoot);

  const featureOverlay = document.createElement('div');
  featureOverlay.className = 'story-hub-overlay';
  element.appendChild(featureOverlay);

  /** @type {{ destroy: () => void } | null} */
  let activeFeature = null;

  function closeFeature() {
    if (activeFeature) {
      activeFeature.destroy();
      activeFeature = null;
    }
    featureOverlay.classList.remove('story-hub-overlay--active', 'story-hub-overlay--enter');
    featureOverlay.style.removeProperty('--overlay-ox');
    featureOverlay.style.removeProperty('--overlay-oy');
    featureOverlay.innerHTML = '';
  }

  function tiltCard(card, e) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (e.pointerType === 'touch') return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--tilt-x', `${(-py * 6).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${(px * 7).toFixed(2)}deg`);
    card.classList.add('story-hub__card--tilting');
  }

  function resetCardTilt(card) {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
    card.classList.remove('story-hub__card--tilting');
  }

  function openFeatureOverlay(title, buildBody, originCard) {
    closeFeature();

    if (originCard) {
      const cardRect = originCard.getBoundingClientRect();
      const hostRect = element.getBoundingClientRect();
      const ox = ((cardRect.left + cardRect.width / 2 - hostRect.left) / hostRect.width) * 100;
      const oy = ((cardRect.top + cardRect.height / 2 - hostRect.top) / hostRect.height) * 100;
      featureOverlay.style.setProperty('--overlay-ox', `${ox}%`);
      featureOverlay.style.setProperty('--overlay-oy', `${oy}%`);
    } else {
      featureOverlay.style.setProperty('--overlay-ox', '50%');
      featureOverlay.style.setProperty('--overlay-oy', '50%');
    }

    featureOverlay.classList.add('story-hub-overlay--active');
    featureOverlay.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'story-hub-overlay__header';
    header.innerHTML = `<span>${title}</span>`;

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'story-hub-overlay__back';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', closeFeature);
    header.appendChild(backBtn);

    const area = document.createElement('div');
    area.className = 'story-hub-overlay__area';

    featureOverlay.appendChild(header);
    featureOverlay.appendChild(area);
    buildBody(area);

    requestAnimationFrame(() => {
      featureOverlay.classList.add('story-hub-overlay--enter');
    });
  }

  function openGamesPicker(area) {
    const done = getDoneGames();
    const grid = document.createElement('div');
    grid.className = 'games-grid';
    GAME_REGISTRY.forEach((game) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'game-card' + (done.has(game.id) ? ' game-card--done' : '');
      card.innerHTML = `
        <span class="game-card__emoji">${game.emoji}</span>
        <span class="game-card__name">${game.name}</span>
      `;
      card.addEventListener('click', () => {
        area.innerHTML = '';
        const header = featureOverlay.querySelector('.story-hub-overlay__header span');
        if (header) header.textContent = `${game.emoji} ${game.name}`;
        analytics.track(EVENTS.GAME_OPEN, { gameId: game.id, gameName: game.name, from: 'story-hub' });
        activeFeature = game.factory(area, {
          analytics,
          onComplete: (message) => {
            markGameDone(game.id);
            analytics.track(EVENTS.GAME_COMPLETE, { gameId: game.id, message });
            const result = document.createElement('div');
            result.className = 'game-result';
            result.innerHTML = `
              <p class="game-result__title">${message}</p>
              <button type="button" class="btn btn--secondary">Back to games</button>
            `;
            result.querySelector('button')?.addEventListener('click', () => {
              if (activeFeature) {
                activeFeature.destroy();
                activeFeature = null;
              }
              const title = featureOverlay.querySelector('.story-hub-overlay__header span');
              if (title) title.textContent = '🎮 Mini games';
              area.innerHTML = '';
              openGamesPicker(area);
            });
            area.appendChild(result);
          },
        });
        activeFeature.start();
      });
      grid.appendChild(card);
    });
    area.appendChild(grid);
  }

  function openFeature(feature, card) {
    analytics.track(EVENTS.HUB_APP_OPEN, { appId: feature.id, from: 'story-hub' });

    const appFactories = {
      notes: createMemoryLaneApp,
      photos: createPhotoWallApp,
      horoscope: createHoroscopeApp,
      questions: createAskMeAnythingApp,
      playlist: createOurPlaylistApp,
      movies: createMovieNightsApp,
      diary: createDearDiaryApp,
    };

    if (feature.id === 'games') {
      openFeatureOverlay(
        `${feature.icon} ${feature.title}`,
        (area) => {
          openGamesPicker(area);
        },
        card
      );
      return;
    }

    const factory = appFactories[feature.id];
    if (factory) {
      openFeatureOverlay(
        `${feature.icon} ${feature.title}`,
        (area) => {
          activeFeature = factory(area, { analytics });
          activeFeature.start();
        },
        card
      );
    }
  }

  const finalText = `Hey ${CONFIG.herName} 🌙`;
  const SOFT_CHAR_DELAY = 42;
  const lineEls = () => linesWrap.querySelectorAll('.cinematic-line');
  let savedScrollTop = 0;
  let hasVisited = false;

  function getCinematicProgress() {
    const greetingH = greetingSection.offsetHeight;
    const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
    const cinematicScrollable = maxScroll - greetingH;
    if (cinematicScrollable <= 0) return 0;
    return clamp((scrollRoot.scrollTop - greetingH) / cinematicScrollable);
  }

  function applyScrollProgress() {
    const p = getCinematicProgress();

    // Single cinematic photo — scale/parallax as text passes over it
    const photoPhase = clamp(p / 0.38);
    const scale = lerp(0.22, 1.08, photoPhase);
    const photoOpacity = clamp(photoPhase * 1.4);
    photoWrap.style.opacity = String(photoOpacity);
    photoWrap.style.transform = `scale(${scale})`;

    const linesStart = 0.32;
    const linesEnd = 0.72;
    const lineSpan = (linesEnd - linesStart) / CONFIG.cinematicLines.length;

    lineEls().forEach((line, i) => {
      const lineStart = linesStart + i * lineSpan;
      const lineProgress = clamp((p - lineStart) / (lineSpan * 0.85));
      line.style.opacity = String(lineProgress);
      line.style.transform = `translateY(${lerp(18, 0, lineProgress)}px)`;
    });

    const exitPhase = clamp((p - 0.68) / 0.2);
    photoWrap.style.opacity = String(lerp(photoOpacity, 0, exitPhase));
    photoWrap.style.transform = `scale(${lerp(scale, 1.2, exitPhase)})`;
    vignette.style.opacity = String(lerp(0.35, 0.85, exitPhase));
    linesWrap.style.opacity = String(1 - exitPhase);

    const finalePhase = clamp((p - 0.82) / 0.18);
    finale.style.opacity = String(finalePhase);
    finale.style.transform = `translateY(${lerp(24, 0, finalePhase)}px) scale(${lerp(0.96, 1, finalePhase)})`;
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

  function goToBigAsk() {
    analytics.track(EVENTS.MANUAL_CONTINUE, { from: SCREENS.SCROLL_STORY, to: SCREENS.BIG_ASK });
    manager.goTo(SCREENS.BIG_ASK);
  }

  lc.bindListener(hubContinue, 'click', goToBigAsk);

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
      closeFeature();
      destroyLenis();
      lc.reset();
      if (rafId) cancelAnimationFrame(rafId);
    },
  };
}
