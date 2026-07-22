const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SEARCH_URL = 'https://api.spotify.com/v1/search';

/** @type {{ token: string, expiresAt: number } | null} */
let cached = null;

function credentialsConfigured() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

async function getToken() {
  if (cached && cached.expiresAt > Date.now() + 5000) {
    return cached.token;
  }

  if (!credentialsConfigured()) {
    throw new Error(
      'Spotify search is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in server/.env (free at developer.spotify.com).'
    );
  }

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status}`);
  }

  const data = await res.json();
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cached.token;
}

/** @param {string} query @param {number} [limit] */
export async function searchTracks(query, limit = 8) {
  const token = await getToken();
  const url = new URL(SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'track');
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Spotify search failed: ${res.status}`);
  }

  const data = await res.json();
  return (data.tracks?.items ?? []).map((t) => ({
    spotifyId: t.id,
    title: t.name,
    artist: t.artists?.map((a) => a.name).join(', ') ?? '',
    albumArt: t.album?.images?.[1]?.url ?? t.album?.images?.[0]?.url ?? null,
    previewUrl: t.preview_url ?? null,
  }));
}

export { credentialsConfigured };
