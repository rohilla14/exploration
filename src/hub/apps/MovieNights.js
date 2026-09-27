import { CONFIG } from '../../config.js';
import { EVENTS } from '../../constants/eventTypes.js';
import { hubApi } from '../api.js';
import { debounce } from '../../utils/async.js';
import { escapeHtml } from '../../utils/dom.js';

const STARS = [1, 2, 3, 4, 5];
const SEARCH_DEBOUNCE_MS = 300;

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} ctx */
export function createMovieNightsApp(container, { analytics }) {
  let destroyed = false;
  let movies = [];

  container.innerHTML = `
    <div class="hub-app hub-app--movies">
      <p class="hub-app__subtitle">${CONFIG.movieSubtitle}</p>
      <p class="movie-affinity" data-role="affinity" hidden></p>

      <div class="movie-search">
        <input type="text" class="movie-search__input" placeholder="${CONFIG.movieSearchPlaceholder}" />
        <div class="movie-search__results" data-role="search-results"></div>
      </div>

      <form class="movie-add-form" data-role="add-form">
        <input type="text" class="movie-add-form__title" placeholder="${CONFIG.movieAddPlaceholder}" required />
        <input type="text" class="movie-add-form__note" placeholder="${CONFIG.movieAddNotePlaceholder}" />
        <button type="submit" class="btn btn--primary movie-add-form__submit">${CONFIG.movieAddSubmit}</button>
      </form>
      <div class="movie-spin">
        <button type="button" class="btn btn--secondary movie-spin__btn" data-role="spin">${CONFIG.movieSpinBtn}</button>
        <p class="movie-spin__result" data-role="spin-result" hidden></p>
      </div>
      <div class="movie-grid" data-role="list"><p class="hub-loading">Loading…</p></div>
    </div>
  `;

  const list = container.querySelector('[data-role="list"]');
  const spinBtn = container.querySelector('[data-role="spin"]');
  const spinResult = container.querySelector('[data-role="spin-result"]');
  const affinityEl = container.querySelector('[data-role="affinity"]');
  const addForm = container.querySelector('[data-role="add-form"]');
  const searchInput = container.querySelector('.movie-search__input');
  const searchResults = container.querySelector('[data-role="search-results"]');

  function ratingFor(movie, rater) {
    return movie.ratings?.find((r) => r.rater === rater) ?? null;
  }

  function bothRated(movie) {
    return Boolean(ratingFor(movie, 'her') && ratingFor(movie, 'you'));
  }

  function isMatch(movie) {
    const her = ratingFor(movie, 'her');
    const you = ratingFor(movie, 'you');
    return Boolean(her && you && Math.abs(her.rating - you.rating) <= 1);
  }

  function updateAffinity() {
    const dual = movies.filter(bothRated);
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

  function posterArtMarkup(movie) {
    if (movie.poster_path) {
      return `<img class="movie-poster__img" src="${escapeHtml(movie.poster_path)}" alt="" loading="lazy" />`;
    }
    return `
      <div class="movie-poster__placeholder">
        <span class="movie-poster__emoji">${escapeHtml(movie.poster_emoji || '🎬')}</span>
        <span class="movie-poster__placeholder-label">No poster yet</span>
      </div>
    `;
  }

  function renderCard(movie) {
    const herRating = ratingFor(movie, 'her');
    const hisRating = ratingFor(movie, 'you');
    const matched = isMatch(movie);
    const dual = bothRated(movie);

    const card = document.createElement('article');
    card.className = [
      'movie-poster',
      matched ? 'movie-poster--match' : '',
      dual && !matched ? 'movie-poster--rated' : '',
      movie.poster_path ? '' : 'movie-poster--placeholder',
    ]
      .filter(Boolean)
      .join(' ');
    card.dataset.id = String(movie.id);

    card.innerHTML = `
      <div class="movie-poster__frame">
        <div class="movie-poster__art" aria-hidden="true">
          ${posterArtMarkup(movie)}
        </div>
        ${
          matched
            ? `<span class="movie-poster__badge">${CONFIG.movieMatchMsg}</span>`
            : dual
              ? `<span class="movie-poster__badge movie-poster__badge--soft">Both rated</span>`
              : ''
        }
        <div class="movie-poster__overlay">
          <p class="movie-poster__title">${escapeHtml(movie.title)}</p>
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
      </div>
    `;

    card.querySelectorAll('[data-role="her-rating"] .movie-star').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
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
      list.innerHTML = `
        <div class="hub-empty">
          <p>${CONFIG.movieEmpty}</p>
          <p class="movie-setup-hint">${CONFIG.movieSetupHint}</p>
        </div>
      `;
      return;
    }
    list.innerHTML = '';
    movies.forEach((movie) => list.appendChild(renderCard(movie)));
  }

  function renderSearchResults(results, errorMessage) {
    if (errorMessage) {
      searchResults.innerHTML = `<p class="hub-error">${escapeHtml(errorMessage)}</p>
        <p class="movie-setup-hint">${CONFIG.movieSetupHint}</p>`;
      searchResults.classList.add('movie-search__results--open');
      return;
    }
    if (!results.length) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('movie-search__results--open');
      return;
    }

    searchResults.classList.add('movie-search__results--open');
    searchResults.innerHTML = results
      .map(
        (r, i) => `
        <div class="movie-result" data-index="${i}">
          ${
            r.posterPath
              ? `<img class="movie-result__art" src="${escapeHtml(r.posterPath)}" alt="" />`
              : '<span class="movie-result__art movie-result__art--placeholder">🎬</span>'
          }
          <div class="movie-result__meta">
            <span class="movie-result__title">${escapeHtml(r.title)}</span>
            <span class="movie-result__year">${escapeHtml(r.year || '')}</span>
          </div>
          <button type="button" class="btn btn--secondary movie-result__add" data-index="${i}">Add</button>
        </div>
      `
      )
      .join('');

    searchResults.querySelectorAll('.movie-result__add').forEach((btn) => {
      btn.addEventListener('click', () => addFromSearch(results[Number(btn.dataset.index)]));
    });
  }

  async function addFromSearch(result) {
    try {
      const movie = await hubApi.addMovie({
        title: result.year ? `${result.title} (${result.year})` : result.title,
        tmdbId: result.tmdbId,
        posterPath: result.posterPath,
        addedBy: 'her',
      });
      if (destroyed) return;
      analytics.track(EVENTS.MOVIE_ADDED, { movieId: movie.id, title: movie.title, tmdbId: result.tmdbId });
      movies = [movie, ...movies];
      renderSearchResults([]);
      searchInput.value = '';
      renderList();
    } catch {
      // leave search open so they can retry
    }
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

  const runSearch = debounce(async (query) => {
    try {
      const results = await hubApi.searchMovies(query);
      if (destroyed) return;
      renderSearchResults(results);
    } catch (err) {
      if (destroyed) return;
      renderSearchResults([], err.message);
    }
  }, SEARCH_DEBOUNCE_MS);

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (!query) {
      renderSearchResults([]);
      return;
    }
    runSearch(query);
  });

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

  /** Roll through the watchlist for a second, then land on tonight's film. */
  function spinForTonight() {
    if (!movies.length || spinBtn.disabled) return;
    spinBtn.disabled = true;
    spinResult.hidden = false;
    spinResult.classList.remove('movie-spin__result--landed');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pick = movies[Math.floor(Math.random() * movies.length)];

    const land = () => {
      spinResult.textContent = `${CONFIG.movieSpinPrefix} ${pick.title}`;
      spinResult.classList.add('movie-spin__result--landed');
      spinBtn.disabled = false;
      analytics.track(EVENTS.MOVIE_SPIN, { title: pick.title });
      container
        .querySelector(`.movie-poster[data-id="${pick.id}"]`)
        ?.classList.add('movie-poster--picked');
    };

    container
      .querySelectorAll('.movie-poster--picked')
      .forEach((el) => el.classList.remove('movie-poster--picked'));

    if (reduce) {
      land();
      return;
    }

    let ticks = 0;
    const roll = setInterval(() => {
      const passing = movies[Math.floor(Math.random() * movies.length)];
      spinResult.textContent = passing.title;
      ticks += 1;
      if (ticks > 14) {
        clearInterval(roll);
        land();
      }
    }, 70);
  }

  spinBtn.addEventListener('click', spinForTonight);

  return {
    start() {
      load();
    },
    destroy() {
      destroyed = true;
    },
  };
}
