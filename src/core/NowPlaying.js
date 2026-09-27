import { escapeHtml } from '../utils/dom.js';

/**
 * One player that lives outside every window, so a song keeps going when she closes the
 * playlist and opens something else. Only one song plays at a time.
 *
 * Browsers block a bare autoplay iframe, which leaves a dead play button on screen, so this
 * drives the real YouTube player API and calls play once it is ready. If the browser still
 * refuses, the player is large enough to press and there is a link out to YouTube.
 */
let bar = null;
let current = null;
/** @type {any} */
let ytPlayer = null;
let apiReady = null;
/** @type {((id: number | string | null) => void) | null} */
let onChange = null;

/** Load YouTube's iframe API once, and resolve when it is usable. */
function loadYouTubeApi() {
  if (apiReady) return apiReady;
  apiReady = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    if (!document.querySelector('script[data-yt-api]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.dataset.ytApi = '1';
      document.head.appendChild(tag);
    }
    // If the API never arrives (offline, blocked), fall back to a plain embed.
    setTimeout(() => resolve(window.YT ?? null), 6000);
  });
  return apiReady;
}

function ensureBar() {
  if (bar) return bar;
  bar = document.createElement('div');
  bar.className = 'nowplaying';
  bar.hidden = true;
  bar.innerHTML = `
    <div class="nowplaying__frame"><div data-role="mount"></div></div>
    <div class="nowplaying__meta">
      <span class="nowplaying__title" data-role="title"></span>
      <span class="nowplaying__artist" data-role="artist"></span>
      <a class="nowplaying__out" data-role="out" target="_blank" rel="noopener noreferrer">Open on YouTube</a>
    </div>
    <button type="button" class="nowplaying__stop" data-role="stop" aria-label="Stop the music">×</button>
  `;
  bar.querySelector('[data-role="stop"]').addEventListener('click', () => stop());
  document.body.appendChild(bar);
  return bar;
}

export function playingId() {
  return current?.id ?? null;
}

export function watchNowPlaying(fn) {
  onChange = fn;
}

/**
 * @param {{ id: number | string, title: string, artist?: string, youtube_id?: string, spotify_id?: string }} song
 * @returns {boolean} false when the song has nothing to play
 */
export function play(song) {
  if (!song.youtube_id && !song.spotify_id) return false;

  const el = ensureBar();
  const mount = el.querySelector('[data-role="mount"]');
  const out = el.querySelector('[data-role="out"]');
  el.querySelector('[data-role="title"]').textContent = song.title;
  el.querySelector('[data-role="artist"]').textContent = song.artist ?? '';
  el.hidden = false;
  el.classList.add('nowplaying--in');
  current = song;
  onChange?.(song.id);

  // Spotify has no comparable API here, so it stays a plain embed.
  if (!song.youtube_id) {
    destroyPlayer();
    mount.innerHTML = `<iframe class="nowplaying__embed"
        src="https://open.spotify.com/embed/track/${encodeURIComponent(song.spotify_id)}?utm_source=generator"
        title="${escapeHtml(song.title)}"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" loading="lazy"></iframe>`;
    out.href = `https://open.spotify.com/track/${encodeURIComponent(song.spotify_id)}`;
    out.textContent = 'Open in Spotify';
    return true;
  }

  out.href = `https://www.youtube.com/watch?v=${encodeURIComponent(song.youtube_id)}`;
  out.textContent = 'Open on YouTube';

  loadYouTubeApi().then((YT) => {
    if (current?.id !== song.id) return;

    if (!YT?.Player) {
      mount.innerHTML = `<iframe class="nowplaying__embed nowplaying__embed--yt"
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.youtube_id)}?autoplay=1&rel=0&playsinline=1"
          title="${escapeHtml(song.title)}"
          allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
      return;
    }

    if (ytPlayer?.loadVideoById) {
      ytPlayer.loadVideoById(song.youtube_id);
      return;
    }

    const host = document.createElement('div');
    host.className = 'nowplaying__embed nowplaying__embed--yt';
    mount.innerHTML = '';
    mount.appendChild(host);

    ytPlayer = new YT.Player(host, {
      videoId: song.youtube_id,
      playerVars: { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1 },
      events: {
        onReady: (e) => {
          // Asking the player directly gets past the plain autoplay block in most browsers.
          try {
            e.target.unMute?.();
            e.target.playVideo();
          } catch {
            // the viewer can still press play
          }
        },
      },
    });
  });

  return true;
}

function destroyPlayer() {
  try {
    ytPlayer?.destroy?.();
  } catch {
    // already gone
  }
  ytPlayer = null;
}

export function stop() {
  if (!bar) return;
  destroyPlayer();
  bar.querySelector('[data-role="mount"]').innerHTML = '';
  bar.hidden = true;
  bar.classList.remove('nowplaying--in');
  current = null;
  onChange?.(null);
}
