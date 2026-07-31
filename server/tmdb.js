const SEARCH_URL = 'https://api.themoviedb.org/3/search/movie';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

function credentialsConfigured() {
  return Boolean(process.env.TMDB_API_KEY);
}

/** @param {string} query @param {number} [limit] */
export async function searchMovies(query, limit = 8) {
  if (!credentialsConfigured()) {
    throw new Error(
      'TMDB search is not configured. Set TMDB_API_KEY in server/.env (free at themoviedb.org/settings/api).'
    );
  }

  const url = new URL(SEARCH_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('api_key', process.env.TMDB_API_KEY);
  url.searchParams.set('include_adult', 'false');

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`TMDB search failed: ${res.status}`);
  }

  const data = await res.json();
  return (data.results ?? []).slice(0, limit).map((m) => ({
    tmdbId: m.id,
    title: m.title,
    year: m.release_date ? String(m.release_date).slice(0, 4) : null,
    posterPath: m.poster_path ? `${POSTER_BASE}${m.poster_path}` : null,
    overview: m.overview || null,
  }));
}

export { credentialsConfigured };
