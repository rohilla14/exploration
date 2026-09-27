import { CONFIG } from '../../config.js';
import { escapeHtml } from '../../utils/dom.js';

/** Every gallery photo, in config order (captions are optional). */
function collectPhotos() {
  return (CONFIG.gallery ?? []).filter((p) => p?.src);
}

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} ctx */
export function createPhotoWallApp(container, { analytics: _analytics }) {
  let destroyed = false;
  /** @type {(() => void) | null} */
  let closeLightbox = null;

  const photos = collectPhotos();

  container.innerHTML = `
    <div class="hub-app hub-app--photos">
      <p class="hub-app__subtitle">Us, collected.</p>
      <div class="photo-wall" data-role="wall"></div>
    </div>
  `;

  const wall = container.querySelector('[data-role="wall"]');

  function openLightbox(src, caption = '') {
    closeLightbox?.();

    const overlay = document.createElement('div');
    overlay.className = 'photo-lightbox';
    overlay.innerHTML = `
      <button type="button" class="photo-lightbox__close" aria-label="Close">×</button>
      <figure class="photo-lightbox__figure">
        <img class="photo-lightbox__img" src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" />
        ${caption ? `<figcaption class="photo-lightbox__caption">${escapeHtml(caption)}</figcaption>` : ''}
      </figure>
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
    if (!photos.length) {
      wall.innerHTML = `<p class="hub-empty">No photos yet.</p>`;
      return;
    }

    wall.innerHTML = photos
      .map(
        ({ src, caption = '' }, i) => `
      <button type="button" class="photo-wall__item photo-wall__item--${(i % 3) + 1}" data-src="${escapeHtml(src)}" data-caption="${escapeHtml(caption)}">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" loading="lazy" />
        ${caption ? `<span class="photo-wall__caption">${escapeHtml(caption)}</span>` : ''}
      </button>
    `
      )
      .join('');

    wall.querySelectorAll('.photo-wall__item').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (destroyed) return;
        openLightbox(btn.dataset.src, btn.dataset.caption);
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
