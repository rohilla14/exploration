import { CONFIG } from '../../config.js';
import { EVENTS } from '../../constants/eventTypes.js';
import { hubApi } from '../api.js';

const STARS = [1, 2, 3, 4, 5];

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} ctx */
export function createMovieNightsApp(container, { analytics }) {
  let destroyed = false;
  let movies = [];

  container.innerHTML = `
    <div class="hub-app hub-app--movies">
      <p class="hub-app__subtitle">${CONFIG.movieSubtitle}</p>
      <p class="movie-affinity" data-role="affinity" hidden></p>
      <form class="movie-add-form" data-role="add-form">
        <input type="text" class="movie-add-form__title" placeholder="${CONFIG.movieAddPlaceholder}" required />
        <input type="text" class="movie-add-form__note" placeholder="${CONFIG.movieAddNotePlaceholder}" />
        <button type="submit" class="btn btn--primary movie-add-form__submit">${CONFIG.movieAddSubmit}</button>
      </form>
      <div class="movie-grid" data-role="list"><p class="hub-loading">Loading…</p></div>
    </div>
  `;

  const list = container.querySelector('[data-role="list"]');
  const affinityEl = container.querySelector('[data-role="affinity"]');
  const addForm = container.querySelector('[data-role="add-form"]');

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function ratingFor(movie, rater) {
    return movie.ratings?.find((r) => r.rater === rater) ?? null;
  }

  function isMatch(movie) {
    const her = ratingFor(movie, 'her');
    const you = ratingFor(movie, 'you');
    return Boolean(her && you && Math.abs(her.rating - you.rating) <= 1);
  }

  function updateAffinity() {
    const dual = movies.filter((m) => ratingFor(m, 'her') && ratingFor(m, 'you'));
    const matches = dual.filter(isMatch).length;
    if (!dual.length) {
      affinityEl.hidden = true;
      return;
    }
    affinityEl.hidden = false;
    const pct = Math.round((matches / dual.length) * 100);
    affinityEl.textContent = CONFIG.movieAffinity
      .replace('{matches}', String(matches))
      .replace('{total}', String(dual.length))
      .replace('{pct}', String(pct));
  }

  function starsMarkup(current, interactive) {
    return STARS.map(
      (n) => `
        <button type="button" class="movie-star${n <= current ? ' movie-star--filled' : ''}" data-value="${n}" ${
          interactive ? '' : 'disabled'
        } aria-label="${n} stars">★</button>
      `
    ).join('');
  }

  function renderCard(movie) {
    const herRating = ratingFor(movie, 'her');
    const hisRating = ratingFor(movie, 'you');
    const matched = isMatch(movie);

    const card = document.createElement('article');
    card.className = `movie-poster${matched ? ' movie-poster--match' : ''}`;
    card.innerHTML = `
      <div class="movie-poster__art" aria-hidden="true">
        <span class="movie-poster__emoji">${movie.poster_emoji || '🎬'}</span>
      </div>
      <div class="movie-poster__body">
        <div class="movie-poster__top">
          <p class="movie-poster__title">${escapeHtml(movie.title)}</p>
          ${matched ? `<span class="movie-card__match">${CONFIG.movieMatchMsg}</span>` : ''}
        </div>
        ${movie.note ? `<p class="movie-poster__note">${escapeHtml(movie.note)}</p>` : ''}
        <div class="movie-card__ratings">
          <div class="movie-card__rating" data-role="her-rating">
            <span class="movie-card__rating-label">${CONFIG.movieYourRating}</span>
            <div class="movie-stars">${starsMarkup(herRating?.rating ?? 0, true)}</div>
          </div>
          <div class="movie-card__rating">
            <span class="movie-card__rating-label">${CONFIG.movieHisRating}</span>
            <div class="movie-stars">${starsMarkup(hisRating?.rating ?? 0, false)}</div>
          </div>
        </div>
      </div>
    `;

    card.querySelectorAll('[data-role="her-rating"] .movie-star').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const value = Number(btn.dataset.value);
        try {
          const result = await hubApi.rateMovie(movie.id, { rater: 'her', rating: value });
          if (destroyed) return;
          movie.ratings = result.ratings;
          analytics.track(EVENTS.MOVIE_RATED, { movieId: movie.id, rater: 'her', rating: value });
          renderList();
        } catch {
          // keep UI
        }
      });
    });

    return card;
  }

  function renderList() {
    updateAffinity();
    if (!movies.length) {
      list.innerHTML = `<p class="hub-empty">${CONFIG.movieEmpty}</p>`;
      return;
    }
    list.innerHTML = '';
    movies.forEach((movie) => list.appendChild(renderCard(movie)));
  }

  async function load() {
    try {
      movies = await hubApi.listMovies();
      if (destroyed) return;
      renderList();
    } catch (err) {
      if (destroyed) return;
      list.innerHTML = `<p class="hub-error">Couldn't load movies right now (${err.message}).</p>`;
    }
  }

  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = addForm.querySelector('.movie-add-form__title');
    const noteInput = addForm.querySelector('.movie-add-form__note');
    const title = titleInput.value.trim();
    if (!title) return;

    const submitBtn = addForm.querySelector('button');
    submitBtn.disabled = true;

    try {
      const movie = await hubApi.addMovie({ title, note: noteInput.value.trim() || null, addedBy: 'her' });
      if (destroyed) return;
      analytics.track(EVENTS.MOVIE_ADDED, { movieId: movie.id, title });
      movies = [movie, ...movies];
      titleInput.value = '';
      noteInput.value = '';
      renderList();
    } catch {
      // retry
    } finally {
      submitBtn.disabled = false;
    }
  });

  return {
    start() {
      load();
    },
    destroy() {
      destroyed = true;
    },
  };
}
