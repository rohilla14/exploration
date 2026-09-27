import { CONFIG } from '../config.js';

/**
 * Where to anchor a photo when it is cropped to fill a box (CSS background-position / object-position).
 * Every photo has its face position listed in CONFIG.photoFocus so faces never get cropped out.
 * @param {string} src
 * @param {string} [fallback]
 */
export function focusOf(src, fallback = '50% 35%') {
  return CONFIG.photoFocus?.[src] ?? fallback;
}

/** Probe whether an image exists before showing it (graceful hide if missing). */
export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * @param {HTMLElement} el
 * @param {string} src
 * @param {'cover' | 'contain'} [fit]
 */
export async function applyBackgroundPhoto(el, src, fit = 'cover') {
  const img = await loadImage(src);
  if (!img) return false;
  el.classList.remove('photo-slot--empty');
  el.style.backgroundImage = `url(${src})`;
  el.style.backgroundSize = fit;
  el.style.backgroundPosition = focusOf(src, 'center');
  el.textContent = '';
  return true;
}

export async function applyCoverBackground(el, src) {
  const img = await loadImage(src);
  if (!img) return false;
  el.classList.remove('photo-slot--empty');
  el.style.backgroundImage = `url(${src})`;
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = focusOf(src, 'center');
  el.textContent = '';
  return true;
}

/**
 * @param {HTMLElement} el
 * @param {string} src
 */
export async function applyPortraitHeroPhoto(el, src) {
  const img = await loadImage(src);
  if (!img) return false;

  el.classList.remove('photo-slot--empty');
  el.textContent = '';
  el.style.backgroundImage = '';
  el.style.backgroundSize = '';
  el.style.backgroundPosition = '';

  const blur = document.createElement('div');
  blur.className = 'photo-hero__blur';
  blur.style.backgroundImage = `url(${src})`;
  blur.setAttribute('aria-hidden', 'true');

  const main = document.createElement('img');
  main.className = 'photo-hero__img';
  main.src = src;
  main.alt = '';
  main.draggable = false;

  el.appendChild(blur);
  el.appendChild(main);
  return true;
}

/**
 * @param {HTMLImageElement} imgEl
 * @param {string} src
 */
export async function applyImgPhoto(imgEl, src) {
  const img = await loadImage(src);
  if (!img) return false;
  imgEl.src = src;
  imgEl.closest('.photo-slot')?.classList.remove('photo-slot--empty');
  return true;
}
