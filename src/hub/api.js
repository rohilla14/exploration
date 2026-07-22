const API = '/api';

async function request(path, options = {}) {
  const hasBody = options.body !== undefined;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: hasBody ? { 'Content-Type': 'application/json', ...options.headers } : options.headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const hubApi = {
  listLoveNotes(kind) {
    return request(kind ? `/love-notes?kind=${kind}` : '/love-notes');
  },
  addLoveNote(payload) {
    return request('/love-notes', { method: 'POST', body: payload });
  },

  listQuestions() {
    return request('/questions');
  },
  addQuestion(payload) {
    return request('/questions', { method: 'POST', body: payload });
  },
  answerQuestion(id, herAnswer) {
    return request(`/questions/${id}/answer`, { method: 'POST', body: { herAnswer } });
  },

  listMovies() {
    return request('/movies');
  },
  addMovie(payload) {
    return request('/movies', { method: 'POST', body: payload });
  },
  rateMovie(id, payload) {
    return request(`/movies/${id}/rate`, { method: 'POST', body: payload });
  },

  searchSongs(q) {
    return request(`/music/search?q=${encodeURIComponent(q)}`);
  },
  listSongs() {
    return request('/music/songs');
  },
  addSong(payload) {
    return request('/music/songs', { method: 'POST', body: payload });
  },
  bulkImportSongs(titles, addedBy) {
    return request('/music/songs/bulk-import', { method: 'POST', body: { titles, addedBy } });
  },
  deleteSong(id) {
    return request(`/music/songs/${id}`, { method: 'DELETE' });
  },

  listDiary(month) {
    return request(month ? `/diary?month=${month}` : '/diary');
  },
  addDiaryEntry(payload) {
    return request('/diary', { method: 'POST', body: payload });
  },
  updateDiaryEntry(id, payload) {
    return request(`/diary/${id}`, { method: 'PATCH', body: payload });
  },
  deleteDiaryEntry(id) {
    return request(`/diary/${id}`, { method: 'DELETE' });
  },

  aiSpark(payload) {
    return request('/ai/spark', { method: 'POST', body: payload });
  },
};
