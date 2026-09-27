import { CONFIG } from '../../config.js';
import { EVENTS } from '../../constants/eventTypes.js';
import { hubApi } from '../api.js';
import { escapeHtml } from '../../utils/dom.js';
import { play as playNowPlaying, playingId, stop as stopNowPlaying } from '../../core/NowPlaying.js';

const SEARCH_DEBOUNCE_MS = 450;
const STAGGER_MS = 60;

/** @param {HTMLElement} container @param {{ analytics: import('../../analytics/Analytics.js').Analytics }} ctx */
export function createOurPlaylistApp(container, { analytics }) {
  let destroyed = false;
  let searchTimer = null;
  let songs = [];
  let filter = 'all'; // all | her | you
  let pendingTrack = null;
  /** @type {number | string | null} */
  let activeSongId = null;

  container.innerHTML = `
    <div class="hub-app hub-app--playlist">
      <p class="hub-app__subtitle">${CONFIG.playlistSubtitle}</p>

      <div class="playlist-search">
        <input type="text" class="playlist-search__input" placeholder="${CONFIG.playlistSearchPlaceholder}" />
        <div class="playlist-search__results" data-role="search-results"></div>
      </div>

      <form class="playlist-note-form" data-role="note-form" hidden>
        <p class="playlist-note-form__track" data-role="pending-label"></p>
        <input type="text" class="playlist-note-form__input" placeholder="${CONFIG.playlistNotePlaceholder}" />
        <input type="text" class="playlist-note-form__input" data-role="yt" placeholder="${CONFIG.playlistYoutubePlaceholder}" />
        <div class="playlist-note-form__actions">
          <button type="submit" class="btn btn--primary">${CONFIG.playlistAddWithNote}</button>
          <button type="button" class="btn btn--secondary" data-role="skip-note">${CONFIG.playlistSkipNote}</button>
        </div>
      </form>

      <div class="playlist-filters" data-role="filters">
        <button type="button" class="playlist-filter playlist-filter--active" data-filter="all">All</button>
        <button type="button" class="playlist-filter" data-filter="her">From her</button>
        <button type="button" class="playlist-filter" data-filter="you">From you</button>
        <button type="button" class="playlist-shuffle" data-role="shuffle">${CONFIG.playlistShuffle}</button>
      </div>

      <details class="playlist-bulk">
        <summary>${CONFIG.playlistBulkTitle}</summary>
        <p class="playlist-bulk__hint">${CONFIG.playlistBulkHint}</p>
        <form data-role="bulk-form">
          <textarea class="playlist-bulk__input" placeholder="${CONFIG.playlistBulkPlaceholder}" rows="4"></textarea>
          <button type="submit" class="btn btn--secondary">${CONFIG.playlistBulkSubmit}</button>
          <p class="playlist-bulk__result" data-role="bulk-result" hidden></p>
        </form>
      </details>

      <div class="playlist-list" data-role="list"><p class="hub-loading">Loading…</p></div>
    </div>
  `;

  const searchInput = container.querySelector('.playlist-search__input');
  const searchResults = container.querySelector('[data-role="search-results"]');
  const noteForm = container.querySelector('[data-role="note-form"]');
  const pendingLabel = container.querySelector('[data-role="pending-label"]');
  const noteInput = noteForm.querySelector('.playlist-note-form__input');
  const bulkForm = container.querySelector('[data-role="bulk-form"]');
  const bulkResult = container.querySelector('[data-role="bulk-result"]');
  const list = container.querySelector('[data-role="list"]');
  const filters = container.querySelector('[data-role="filters"]');

  filters.querySelectorAll('.playlist-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filters.querySelectorAll('.playlist-filter').forEach((b) => {
        b.classList.toggle('playlist-filter--active', b === btn);
      });
      renderSongList();
    });
  });

  function renderSearchResults(results, errorMessage) {
    if (errorMessage) {
      searchResults.innerHTML = `<p class="hub-error">${escapeHtml(errorMessage)}</p>
        <p class="playlist-setup-hint">${CONFIG.playlistSetupHint}</p>`;
      searchResults.classList.add('playlist-search__results--open');
      return;
    }
    if (!results.length) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('playlist-search__results--open');
      return;
    }

    searchResults.classList.add('playlist-search__results--open');
    searchResults.innerHTML = results
      .map(
        (r, i) => `
        <div class="playlist-result" data-index="${i}">
          ${r.albumArt ? `<img class="playlist-result__art" src="${escapeHtml(r.albumArt)}" alt="" />` : '<span class="playlist-result__art playlist-result__art--placeholder">🎵</span>'}
          <div class="playlist-result__meta">
            <span class="playlist-result__title">${escapeHtml(r.title)}</span>
            <span class="playlist-result__artist">${escapeHtml(r.artist)}</span>
          </div>
          <button type="button" class="btn btn--secondary playlist-result__add" data-index="${i}">Add</button>
        </div>
      `
      )
      .join('');

    searchResults.querySelectorAll('.playlist-result__add').forEach((btn) => {
      btn.addEventListener('click', () => beginAdd(results[Number(btn.dataset.index)]));
    });
  }

  function beginAdd(track) {
    pendingTrack = track;
    pendingLabel.textContent = `${track.title} · ${track.artist}`;
    noteInput.value = '';
    noteForm.hidden = false;
    renderSearchResults([]);
    searchInput.value = '';
    noteInput.focus();
  }

  async function commitAdd(note, youtubeId) {
    if (!pendingTrack) return;
    const track = pendingTrack;
    pendingTrack = null;
    noteForm.hidden = true;

    try {
      const song = await hubApi.addSong({
        spotifyId: track.spotifyId,
        title: track.title,
        artist: track.artist,
        albumArt: track.albumArt,
        previewUrl: track.previewUrl,
        addedBy: 'her',
        note: note || null,
        youtubeId: youtubeId || null,
      });
      if (destroyed) return;
      analytics.track(EVENTS.SONG_ADDED, { title: song.title, artist: song.artist });
      songs = [song, ...songs];
      renderSongList();
    } catch {
      pendingTrack = track;
      noteForm.hidden = false;
    }
  }

  container.querySelector('[data-role="shuffle"]')?.addEventListener('click', shuffleOurs);

  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const noteInput = noteForm.querySelector('.playlist-note-form__input');
    const ytInput = noteForm.querySelector('[data-role="yt"]');
    const note = noteInput.value.trim();
    const yt = ytInput.value.trim();
    noteInput.value = '';
    ytInput.value = '';
    commitAdd(note, yt);
  });

  noteForm.querySelector('[data-role="skip-note"]')?.addEventListener('click', () => {
    commitAdd('');
  });

  function filteredSongs() {
    if (filter === 'her') return songs.filter((s) => s.added_by === 'her');
    if (filter === 'you') return songs.filter((s) => s.added_by === 'you');
    return songs;
  }

  function artMarkup(song) {
    if (song.album_art) {
      return `<img class="playlist-song__art" src="${escapeHtml(song.album_art)}" alt="" loading="lazy" />`;
    }
    return `<span class="playlist-song__art playlist-song__art--placeholder" aria-hidden="true">🎵</span>`;
  }

  /** Pick a random song from the list and open its player. */
  /** Start or stop a song in the bar that lives outside the window. */
  function toggleSong(song) {
    if (playingId() === song.id) {
      stopNowPlaying();
      activeSongId = null;
    } else if (playNowPlaying(song)) {
      activeSongId = song.id;
      analytics.track(EVENTS.SONG_PLAY, { title: song.title, from: 'list' });
    } else {
      activeSongId = song.id;
    }
    renderSongList();
  }

  function shuffleOurs() {
    const pool = filteredSongs().filter((song) => song.youtube_id || song.spotify_id);
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    playNowPlaying(pick);
    activeSongId = pick.id;
    analytics.track(EVENTS.SONG_PLAY, { title: pick.title, from: 'shuffle' });
    renderSongList();
    container
      .querySelector(`.playlist-song[data-id="${pick.id}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function renderSongList() {
    const visible = filteredSongs();
    if (!songs.length) {
      list.innerHTML = `
        <div class="hub-empty playlist-empty">
          <p>${CONFIG.playlistEmpty}</p>
          <p class="playlist-setup-hint">${CONFIG.playlistSetupHint}</p>
        </div>
      `;
      return;
    }
    if (!visible.length) {
      list.innerHTML = `<p class="hub-empty">${CONFIG.playlistFilterEmpty}</p>`;
      return;
    }

    list.innerHTML = visible
      .map((s, i) => {
        const isActive = String(activeSongId) === String(s.id);
        const addedLabel = s.added_by === 'her' ? CONFIG.playlistAddedByHer : CONFIG.playlistAddedByYou;
        return `
        <article class="playlist-song${isActive ? ' playlist-song--active' : ''}"
                 data-id="${s.id}"
                 style="--stagger: ${i * STAGGER_MS}ms;">
          <button type="button" class="playlist-song__hit" data-role="toggle" aria-expanded="${isActive}" ${
            ''
          }>
            <span class="playlist-song__art-wrap">
              ${artMarkup(s)}
              ${isActive ? '<span class="playlist-song__eq" aria-hidden="true"><i></i><i></i><i></i></span>' : ''}
            </span>
            <span class="playlist-song__meta">
              <span class="playlist-song__title">${escapeHtml(s.title)}</span>
              <span class="playlist-song__artist">${escapeHtml(s.artist ?? '')}</span>
              ${s.note ? `<span class="playlist-song__note">${escapeHtml(s.note)}</span>` : ''}
              <span class="playlist-song__added">${escapeHtml(addedLabel)}</span>
            </span>
            ${
              s.youtube_id || s.spotify_id
                ? `<span class="playlist-song__cue">${isActive ? 'Hide player' : 'Play'}</span>`
                : ''
            }
          </button>
          ${isActive && !(s.youtube_id || s.spotify_id) ? `<p class="playlist-song__noplayer">${escapeHtml(CONFIG.playlistNoPlayer)}</p>` : ''}
        </article>
      `;
      })
      .join('');

    list.querySelectorAll('[data-role="toggle"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.playlist-song')?.dataset.id;
        if (!id) return;
        const song = songs.find((x) => String(x.id) === String(id));
        if (song) toggleSong(song);
      });
    });
  }

  async function loadSongs() {
    try {
      songs = await hubApi.listSongs();
      if (destroyed) return;
      renderSongList();
    } catch (err) {
      if (destroyed) return;
      list.innerHTML = `<p class="hub-error">Couldn't load songs right now (${err.message}).</p>`;
    }
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const query = searchInput.value.trim();
    if (!query) {
      renderSearchResults([]);
      return;
    }
    searchTimer = setTimeout(async () => {
      try {
        const results = await hubApi.searchSongs(query);
        if (destroyed) return;
        renderSearchResults(results);
      } catch (err) {
        if (destroyed) return;
        renderSearchResults([], err.message);
      }
    }, SEARCH_DEBOUNCE_MS);
  });

  bulkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const textarea = bulkForm.querySelector('textarea');
    const titles = textarea.value
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    if (!titles.length) return;

    const submitBtn = bulkForm.querySelector('button');
    submitBtn.disabled = true;
    bulkResult.hidden = true;

    try {
      const { added, notFound } = await hubApi.bulkImportSongs(titles, 'her');
      if (destroyed) return;
      analytics.track(EVENTS.SONG_BULK_IMPORT, { requested: titles.length, added: added.length });
      songs = [
        ...added.map((a) => ({
          ...a,
          spotify_id: a.spotifyId ?? a.spotify_id,
          album_art: a.albumArt ?? a.album_art,
          added_by: 'her',
        })),
        ...songs,
      ];
      renderSongList();
      textarea.value = '';
      bulkResult.hidden = false;
      bulkResult.textContent = notFound.length
        ? `Added ${added.length}. Couldn't find: ${notFound.join(', ')}`
        : `Added all ${added.length} songs`;
    } catch (err) {
      bulkResult.hidden = false;
      bulkResult.textContent = `Import failed (${err.message}).`;
    } finally {
      submitBtn.disabled = false;
    }
  });

  return {
    start() {
      loadSongs();
    },
    destroy() {
      destroyed = true;
      clearTimeout(searchTimer);
    },
  };
}
