import { CONFIG } from '../../config.js';

/** Collect unique photo URLs from CONFIG for the wall. */
function collectPhotos() {
  const seen = new Set();
  /** @type {string[]} */
  const urls = [];

  function add(src) {
    if (!src || typeof src !== 'string' || seen.has(src)) return;
    seen.add(src);
    urls.push(src);
  }

  const photos = CONFIG.photos || {};
  add(photos.cinematic);
  add(photos.polaroidA);
  add(photos.polaroidB);
  add(photos.plannerAccent);
  add(photos.plannerWelcome);
  add(photos.celebration);
  add(CONFIG.loadingPhoto);
  add(CONFIG.whyIMadeThisPhoto);

  return urls;
}

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} ctx */
export function createPhotoWallApp(container, { analytics: _analytics }) {
  let destroyed = false;
  /** @type {(() => void) | null} */
  let closeLightbox = null;

  const urls = collectPhotos();

  container.innerHTML = `
    <div class="hub-app hub-app--photos">
      <p class="hub-app__subtitle">Us, collected.</p>
      <div class="photo-wall" data-role="wall"></div>
    </div>
  `;

  const wall = container.querySelector('[data-role="wall"]');

  function openLightbox(src) {
    closeLightbox?.();

    const overlay = document.createElement('div');
    overlay.className = 'photo-lightbox';
    overlay.innerHTML = `
      <button type="button" class="photo-lightbox__close" aria-label="Close">×</button>
      <img class="photo-lightbox__img" src="${src}" alt="" />
    `;

    const remove = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      closeLightbox = null;
    };

    const onKey = (e) => {
      if (e.key === 'Escape') remove();
    };

    overlay.querySelector('.photo-lightbox__close')?.addEventListener('click', remove);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) remove();
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    closeLightbox = remove;
  }

  function render() {
    if (!urls.length) {
      wall.innerHTML = `<p class="hub-empty">No photos yet.</p>`;
      return;
    }

    wall.innerHTML = urls
      .map(
        (src, i) => `
      <button type="button" class="photo-wall__item photo-wall__item--${(i % 3) + 1}" data-src="${src}">
        <img src="${src}" alt="" loading="lazy" />
      </button>
    `
      )
      .join('');

    wall.querySelectorAll('.photo-wall__item').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (destroyed) return;
        openLightbox(btn.dataset.src);
      });
    });
  }

  return {
    start() {
      render();
    },
    destroy() {
      destroyed = true;
      closeLightbox?.();
    },
  };
}
