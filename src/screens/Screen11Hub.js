import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import {
  nextGreeting,
  getHubAppLastVisit,
  markHubAppVisited,
  hasNewerContent,
  markJourneyComplete,
} from '../utils/journey.js';
import { HUB_REGISTRY } from '../hub/registry.js';
import { createAmbientAtmosphere } from '../core/AmbientAtmosphere.js';
import { createPhotoLens } from '../core/PhotoLens.js';
import { hubApi } from '../hub/api.js';
import { escapeHtml } from '../utils/dom.js';

const COARSE_POINTER = window.matchMedia('(pointer: coarse)');
const COMPACT_LAYOUT = window.matchMedia('(max-width: 720px)');

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics }} services */
export function createHubScreen({ manager, analytics }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--hub';

  const atmosphere = createAmbientAtmosphere(element, { intensity: 'hub' });

  const desk = document.createElement('div');
  desk.className = 'desk';

  const iconGrid = document.createElement('div');
  iconGrid.className = 'desk__icons';

  const note = document.createElement('aside');
  note.className = 'desk__note';
  const greeting = document.createElement('p');
  greeting.className = 'desk__note-greeting';
  const noteSub = document.createElement('p');
  noteSub.className = 'desk__note-sub';
  noteSub.textContent = CONFIG.hubSubtitle;
  note.append(greeting, noteSub);

  const windowLayer = document.createElement('div');
  windowLayer.className = 'desk__windows';

  // Days together, counting up from the date in config.
  const days = document.createElement('p');
  days.className = 'desk__days';
  note.appendChild(days);

  function updateDays() {
    const since = new Date(`${CONFIG.togetherSince}T00:00:00`);
    if (Number.isNaN(since.getTime())) {
      days.hidden = true;
      return;
    }
    const n = Math.max(0, Math.floor((Date.now() - since.getTime()) / 86400000));
    days.textContent = `${n} ${CONFIG.hubDaysLabel}`;
  }

  // Right click the wallpaper for a small menu, like a real desktop.
  const menu = document.createElement('div');
  menu.className = 'deskmenu';
  menu.hidden = true;
  menu.innerHTML = `
    <p class="deskmenu__head">${escapeHtml(CONFIG.hubMenuTitle)}</p>
    <button type="button" data-act="shuffle">${escapeHtml(CONFIG.hubMenuShuffle)}</button>
    <button type="button" data-act="tidy">${escapeHtml(CONFIG.hubMenuTidy)}</button>
    <button type="button" data-act="about">${escapeHtml(CONFIG.hubMenuAbout)}</button>
  `;

  // A short boot screen the first time she opens the desktop in a session.
  const boot = document.createElement('div');
  boot.className = 'boot';
  boot.hidden = true;
  boot.innerHTML = `<div class="boot__inner"><span class="boot__heart">♡</span><p class="boot__line" data-role="boot-line"></p><span class="boot__bar"><i></i></span></div>`;

  desk.append(iconGrid, note, windowLayer, menu);

  // Wallpaper: her photo, with the cursor lens revealing other photos of her.
  const lens = createPhotoLens(desk, CONFIG.hubWallpaper);

  const startMenu = document.createElement('div');
  startMenu.className = 'startmenu';
  startMenu.hidden = true;

  const taskbar = document.createElement('div');
  taskbar.className = 'taskbar';
  const startBtn = document.createElement('button');
  startBtn.type = 'button';
  startBtn.className = 'taskbar__start';
  startBtn.setAttribute('aria-haspopup', 'true');
  startBtn.innerHTML = `<span aria-hidden="true">♡</span> ${escapeHtml(CONFIG.hubTitle)}`;
  const taskApps = document.createElement('div');
  taskApps.className = 'taskbar__apps';
  const clock = document.createElement('div');
  clock.className = 'taskbar__clock';
  taskbar.append(startBtn, taskApps, clock);

  element.append(desk, startMenu, taskbar, boot);
  startBtn.addEventListener('click', () => toggleStartMenu());

  /** @type {Map<string, { win: HTMLElement, app: { destroy: () => void }, taskBtn: HTMLButtonElement }>} */
  const openWindows = new Map();
  let zCounter = 10;
  let bootDone = false;
  let cascade = 0;

  async function fetchNewFlags() {
    const flags = {
      'memory-lane': false,
      'ask-me-anything': false,
      'our-playlist': false,
      'movie-nights': false,
      'dear-diary': false,
    };

    try {
      const [notes, questions, songs, movies, diary] = await Promise.all([
        hubApi.listLoveNotes().catch(() => []),
        hubApi.listQuestions().catch(() => []),
        hubApi.listSongs().catch(() => []),
        hubApi.listMovies().catch(() => []),
        hubApi.listDiary().catch(() => []),
      ]);

      flags['memory-lane'] = hasNewerContent(
        notes.map((n) => n.created_at),
        getHubAppLastVisit('memory-lane')
      );
      flags['ask-me-anything'] = hasNewerContent(
        questions.map((q) => q.created_at),
        getHubAppLastVisit('ask-me-anything')
      );
      flags['our-playlist'] = hasNewerContent(
        songs.map((s) => s.added_at),
        getHubAppLastVisit('our-playlist')
      );
      flags['movie-nights'] = hasNewerContent(
        movies.map((m) => m.added_at),
        getHubAppLastVisit('movie-nights')
      );
      flags['dear-diary'] = hasNewerContent(
        diary.map((d) => d.updated_at || d.created_at),
        getHubAppLastVisit('dear-diary')
      );
    } catch {
      // badges are optional — hub still works offline-ish
    }

    return flags;
  }

  async function buildIcons() {
    iconGrid.innerHTML = '';
    startMenu.innerHTML = '';
    const newFlags = await fetchNewFlags();

    const menuList = document.createElement('div');
    menuList.className = 'startmenu__list';

    CONFIG.hubApps.forEach((meta) => {
      // A "navigateTo" entry isn't a windowed mini-app: it leaves the desktop entirely and
      // plays a whole screen (the proposal, currently), returning here when that is done.
      if (meta.navigateTo) {
        const goThere = () => {
          analytics.track(EVENTS.HUB_APP_OPEN, { appId: meta.id, appName: meta.name });
          manager.goTo(meta.navigateTo);
        };

        const icon = document.createElement('button');
        icon.type = 'button';
        icon.className = 'desk-icon desk-icon--surprise';
        icon.dataset.appId = meta.id;
        icon.title = meta.description;
        icon.innerHTML = `
          <span class="desk-icon__tile">${meta.emoji}</span>
          <span class="desk-icon__name">${escapeHtml(meta.name)}</span>
        `;
        // No select-first dance here — a tap or click goes straight there.
        icon.addEventListener('click', goThere);
        enableIconDrag(icon);
        iconGrid.appendChild(icon);

        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'startmenu__item startmenu__item--surprise';
        item.innerHTML = `<span class="startmenu__emoji">${meta.emoji}</span><span><strong>${escapeHtml(meta.name)}</strong><small>${escapeHtml(meta.description)}</small></span>`;
        item.addEventListener('click', () => {
          toggleStartMenu(false);
          goThere();
        });
        menuList.appendChild(item);
        return;
      }

      const entry = HUB_REGISTRY.find((r) => r.id === meta.id);
      if (!entry) return;

      const icon = document.createElement('button');
      icon.type = 'button';
      icon.className = 'desk-icon';
      icon.dataset.appId = meta.id;
      icon.title = meta.description;
      icon.innerHTML = `
        ${newFlags[meta.id] ? '<span class="desk-icon__badge" aria-label="New content"></span>' : ''}
        <span class="desk-icon__tile">${meta.emoji}</span>
        <span class="desk-icon__name">${escapeHtml(meta.name)}</span>
      `;
      icon.addEventListener('click', (e) => {
        // Mouse: click selects, double-click opens. Touch and keyboard: open straight away.
        if (e.detail === 1 && !COARSE_POINTER.matches) {
          iconGrid.querySelectorAll('.desk-icon--selected').forEach((n) => n.classList.remove('desk-icon--selected'));
          icon.classList.add('desk-icon--selected');
          return;
        }
        launchApp(meta, entry);
      });
      enableIconDrag(icon);
      iconGrid.appendChild(icon);

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'startmenu__item';
      item.innerHTML = `<span class="startmenu__emoji">${meta.emoji}</span><span><strong>${escapeHtml(meta.name)}</strong><small>${escapeHtml(meta.description)}</small></span>`;
      item.addEventListener('click', () => {
        toggleStartMenu(false);
        launchApp(meta, entry);
      });
      menuList.appendChild(item);
    });

    startMenu.appendChild(menuList);
  }

  const ICON_POS_KEY = 'exploration.iconPositions';

  function readIconPositions() {
    try {
      return JSON.parse(localStorage.getItem(ICON_POS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveIconPositions(pos) {
    try {
      localStorage.setItem(ICON_POS_KEY, JSON.stringify(pos));
    } catch {
      // storage blocked: icons simply go back to the grid next time
    }
  }

  /** Put icons back where she last dragged them. */
  function applyIconPositions() {
    const pos = readIconPositions();
    iconGrid.querySelectorAll('.desk-icon').forEach((icon) => {
      const p = pos[icon.dataset.appId];
      if (!p) return;
      icon.classList.add('desk-icon--placed');
      icon.style.left = `${p.x}px`;
      icon.style.top = `${p.y}px`;
    });
  }

  function tidyIcons() {
    saveIconPositions({});
    iconGrid.querySelectorAll('.desk-icon').forEach((icon) => {
      icon.classList.remove('desk-icon--placed');
      icon.style.removeProperty('left');
      icon.style.removeProperty('top');
    });
  }

  /** Drag an icon anywhere on the desktop; where she drops it is remembered. */
  function enableIconDrag(icon) {
    icon.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (COMPACT_LAYOUT.matches) return;
      const gridRect = iconGrid.getBoundingClientRect();
      const rect = icon.getBoundingClientRect();
      const grabX = e.clientX - rect.left;
      const grabY = e.clientY - rect.top;
      let moved = false;

      const move = (ev) => {
        if (!moved && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 6) return;
        if (!moved) {
          moved = true;
          icon.setPointerCapture(ev.pointerId);
          icon.classList.add('desk-icon--placed', 'desk-icon--dragging');
        }
        const x = Math.min(Math.max(ev.clientX - grabX - gridRect.left, 0), gridRect.width - rect.width);
        const y = Math.min(Math.max(ev.clientY - grabY - gridRect.top, 0), gridRect.height - rect.height);
        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;
      };

      const up = () => {
        icon.removeEventListener('pointermove', move);
        icon.removeEventListener('pointerup', up);
        icon.removeEventListener('pointercancel', up);
        if (!moved) return;
        icon.classList.remove('desk-icon--dragging');
        const pos = readIconPositions();
        pos[icon.dataset.appId] = {
          x: parseFloat(icon.style.left) || 0,
          y: parseFloat(icon.style.top) || 0,
        };
        saveIconPositions(pos);
      };

      icon.addEventListener('pointermove', move);
      icon.addEventListener('pointerup', up);
      icon.addEventListener('pointercancel', up);
    });
  }

  function openMenuAt(x, y) {
    menu.hidden = false;
    const r = desk.getBoundingClientRect();
    menu.style.left = `${Math.min(x - r.left, r.width - menu.offsetWidth - 8)}px`;
    menu.style.top = `${Math.min(y - r.top, r.height - menu.offsetHeight - 8)}px`;
  }

  menu.addEventListener('click', (e) => {
    const act = e.target.closest('button')?.dataset.act;
    menu.hidden = true;
    if (act === 'tidy') tidyIcons();
    if (act === 'shuffle') shuffleWallpaper();
    if (act === 'about') {
      note.classList.add('desk__note--flash');
      noteSub.textContent = CONFIG.hubAboutText;
      setTimeout(() => note.classList.remove('desk__note--flash'), 900);
    }
  });

  /** Swap the wallpaper for another photo of her, keeping the lens working. */
  function shuffleWallpaper() {
    const pool = (CONFIG.hubWallpaper.reveals ?? []).filter(Boolean);
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    desk.querySelector('.lens__base').style.backgroundImage = `url(${pick.src})`;
    desk.querySelector('.lens__keeper').style.backgroundImage = `url(${pick.src})`;
  }

  /** A short start up the first time the desktop opens in this session. */
  function runBoot() {
    const lines = CONFIG.hubBootLines ?? [];
    if (!lines.length || bootDone || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bootDone = true;
      return;
    }
    bootDone = true;
    boot.hidden = false;
    const lineEl = boot.querySelector('[data-role="boot-line"]');
    lines.forEach((line, i) => {
      lc.trackTimeout(
        setTimeout(() => {
          lineEl.textContent = line;
        }, i * 620)
      );
    });
    lc.trackTimeout(
      setTimeout(() => {
        boot.classList.add('boot--out');
        lc.trackTimeout(
          setTimeout(() => {
            boot.hidden = true;
            boot.classList.remove('boot--out');
          }, 600)
        );
      }, lines.length * 620)
    );
  }

  function toggleStartMenu(force) {
    const show = force ?? startMenu.hidden;
    startMenu.hidden = !show;
    startBtn.classList.toggle('taskbar__start--open', show);
  }

  function focusWindow(id) {
    openWindows.forEach((entry, key) => {
      const active = key === id;
      entry.taskBtn.classList.toggle('taskbar__app--active', active && !entry.win.classList.contains('win--min'));
      entry.win.classList.toggle('win--focused', active);
    });
    const target = openWindows.get(id);
    if (target) target.win.style.zIndex = String(++zCounter);
  }

  function launchApp(meta, entry) {
    const existing = openWindows.get(meta.id);
    if (existing) {
      existing.win.classList.remove('win--min');
      focusWindow(meta.id);
      return;
    }

    markHubAppVisited(meta.id);
    iconGrid.querySelector(`[data-app-id="${meta.id}"] .desk-icon__badge`)?.remove();
    analytics.track(EVENTS.HUB_APP_OPEN, { appId: meta.id, appName: meta.name });

    const win = document.createElement('section');
    win.className = 'win';
    win.setAttribute('aria-label', meta.name);
    const offset = (cascade++ % 6) * 28;
    win.style.left = `calc(50% - min(340px, 46vw) + ${offset}px)`;
    win.style.top = `${24 + offset}px`;

    const bar = document.createElement('header');
    bar.className = 'win__bar';
    bar.innerHTML = `
      <span class="win__dots">
        <button type="button" class="win__dot win__dot--close" aria-label="Close ${escapeHtml(meta.name)}"></button>
        <button type="button" class="win__dot win__dot--min" aria-label="Minimize"></button>
        <button type="button" class="win__dot win__dot--max" aria-label="Maximize"></button>
      </span>
      <span class="win__title">${meta.emoji} ${escapeHtml(meta.name)}</span>
    `;

    const appArea = document.createElement('div');
    appArea.className = 'hub-app-area win__body';
    win.append(bar, appArea);
    windowLayer.appendChild(win);

    const taskBtn = document.createElement('button');
    taskBtn.type = 'button';
    taskBtn.className = 'taskbar__app';
    taskBtn.innerHTML = `${meta.emoji} <span>${escapeHtml(meta.name)}</span>`;
    taskApps.appendChild(taskBtn);

    const app = entry.factory(appArea, { analytics });
    openWindows.set(meta.id, { win, app, taskBtn });
    app.start();
    focusWindow(meta.id);

    win.addEventListener('pointerdown', () => focusWindow(meta.id));
    taskBtn.addEventListener('click', () => {
      const minimized = win.classList.contains('win--min');
      const focused = win.classList.contains('win--focused');
      if (minimized || !focused) {
        win.classList.remove('win--min');
        focusWindow(meta.id);
      } else {
        win.classList.add('win--min');
        focusWindow(null);
      }
    });
    bar.querySelector('.win__dot--close').addEventListener('click', () => closeApp(meta.id));
    bar.querySelector('.win__dot--min').addEventListener('click', () => {
      win.classList.add('win--min');
      focusWindow(null);
    });
    const toggleMax = () => win.classList.toggle('win--max');
    bar.querySelector('.win__dot--max').addEventListener('click', toggleMax);
    bar.addEventListener('dblclick', (e) => {
      if (!e.target.closest('.win__dot')) toggleMax();
    });

    enableDrag(win, bar);
  }

  /** Drag a window by its title bar, keeping the bar inside the desktop. */
  function enableDrag(win, handle) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.win__dot') || win.classList.contains('win--max')) return;
      if (COMPACT_LAYOUT.matches) return;
      const layer = windowLayer.getBoundingClientRect();
      const rect = win.getBoundingClientRect();
      const grabX = e.clientX - rect.left;
      const grabY = e.clientY - rect.top;
      handle.setPointerCapture(e.pointerId);
      win.classList.add('win--dragging');

      const move = (ev) => {
        const x = Math.min(Math.max(ev.clientX - grabX - layer.left, -rect.width + 120), layer.width - 120);
        const y = Math.min(Math.max(ev.clientY - grabY - layer.top, 0), layer.height - 44);
        win.style.left = `${x}px`;
        win.style.top = `${y}px`;
      };
      const up = () => {
        win.classList.remove('win--dragging');
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  }

  function closeApp(id) {
    const entry = openWindows.get(id);
    if (!entry) return;
    analytics.track(EVENTS.HUB_APP_BACK, { hadActiveApp: true, appId: id });
    entry.app.destroy();
    entry.win.remove();
    entry.taskBtn.remove();
    openWindows.delete(id);
  }

  function closeAllApps() {
    [...openWindows.keys()].forEach(closeApp);
  }

  function updateClock() {
    clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  return {
    element,
    onEnter() {
      lc.reset();
      // Reaching the desktop at all is "the journey": from now on the site opens straight here.
      // The ask-and-plan flow is optional from this point, so it can't be what gates that.
      markJourneyComplete();
      lens.start();
      greeting.textContent = nextGreeting(CONFIG.hubReturnGreetings);
      toggleStartMenu(false);
      updateClock();
      lc.trackInterval(setInterval(updateClock, 15000));
      lc.trackListener(element, 'pointerdown', (e) => {
        if (!e.target.closest('.startmenu, .taskbar__start')) toggleStartMenu(false);
        if (!e.target.closest('.deskmenu')) menu.hidden = true;
        if (!e.target.closest('.desk-icon')) {
          iconGrid.querySelectorAll('.desk-icon--selected').forEach((n) => n.classList.remove('desk-icon--selected'));
        }
      });
      updateDays();
      runBoot();
      buildIcons().then(applyIconPositions);
      lc.trackListener(desk, 'contextmenu', (e) => {
        if (e.target.closest('.desk-icon, .win')) return;
        e.preventDefault();
        openMenuAt(e.clientX, e.clientY);
      });
    },
    onExit() {
      lens.stop();
      closeAllApps();
      lc.reset();
    },
    destroy() {
      lens.destroy();
      atmosphere.destroy();
    },
  };
}
