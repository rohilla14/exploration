import { hubApi } from '../hub/api.js';
import { escapeHtml } from '../utils/dom.js';

const TABS = [
  { id: 'notes', label: 'Memory Notes' },
  { id: 'questions', label: 'Questions' },
  { id: 'movies', label: 'Movies' },
  { id: 'songs', label: 'Songs' },
  { id: 'diary', label: 'Diary' },
];

let activeTab = 'notes';
/** @type {HTMLElement | null} */
let panelEl = null;

function fmtTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`).toLocaleString();
  } catch {
    return iso;
  }
}

/** @param {HTMLElement} root */
export function mountContentManager(root) {
  const container = document.createElement('section');
  container.className = 'panel content-manager';
  container.innerHTML = `
    <div class="panel__head">Content Manager</div>
    <div class="panel__body">
      <div class="cm-tabs">
        ${TABS.map((t) => `<button type="button" class="cm-tab${t.id === activeTab ? ' cm-tab--active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div class="cm-panel" data-role="cm-panel"></div>
    </div>
  `;
  root.appendChild(container);

  panelEl = container.querySelector('[data-role="cm-panel"]');

  container.querySelectorAll('.cm-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      container.querySelectorAll('.cm-tab').forEach((b) => b.classList.toggle('cm-tab--active', b === btn));
      renderActiveTab();
    });
  });

  renderActiveTab();
}

function renderActiveTab() {
  if (!panelEl) return;
  panelEl.innerHTML = '<div class="admin__loading">Loading…</div>';

  const renderers = {
    notes: renderNotesTab,
    questions: renderQuestionsTab,
    movies: renderMoviesTab,
    songs: renderSongsTab,
    diary: renderDiaryTab,
  };

  renderers[activeTab]?.().catch((err) => {
    if (panelEl) panelEl.innerHTML = `<div class="admin__error">Couldn't load: ${escapeHtml(err.message)}</div>`;
  });
}

async function renderNotesTab() {
  const notes = await hubApi.listLoveNotes();

  panelEl.innerHTML = `
    <form class="cm-form" data-role="notes-form">
      <select class="cm-form__select" name="kind">
        <option value="memory">Moment (reminds me of you)</option>
        <option value="like">Why I love you</option>
      </select>
      <input type="date" class="cm-form__date" name="occurredOn" />
      <textarea class="cm-form__textarea" name="body" placeholder="Write it here…" required></textarea>
      <button type="submit" class="btn btn--primary">Add note</button>
    </form>
    <div class="cm-list" data-role="notes-list"></div>
  `;

  const list = panelEl.querySelector('[data-role="notes-list"]');
  renderNotesList(list, notes);

  panelEl.querySelector('[data-role="notes-form"]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const body = form.body.value.trim();
    if (!body) return;

    const payload = {
      kind: form.kind.value,
      body,
      occurredOn: form.occurredOn.value || null,
    };

    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      const note = await hubApi.addLoveNote(payload);
      notes.unshift(note);
      renderNotesList(list, notes);
      form.reset();
    } catch (err) {
      alert(`Couldn't add note: ${err.message}`);
    } finally {
      btn.disabled = false;
    }
  });
}

function renderNotesList(list, notes) {
  if (!notes.length) {
    list.innerHTML = '<p class="detail-empty">No notes yet.</p>';
    return;
  }
  list.innerHTML = notes
    .map(
      (n) => `
      <div class="cm-item" data-id="${n.id}">
        <div class="cm-item__body">
          <span class="badge">${n.kind === 'memory' ? 'Moment' : 'Like'}</span>
          ${n.occurred_on ? `<span class="cm-item__date">${escapeHtml(n.occurred_on)}</span>` : ''}
          <p>${escapeHtml(n.body)}</p>
        </div>
        <button type="button" class="cm-item__delete" data-id="${n.id}" title="Delete">✕</button>
      </div>
    `
    )
    .join('');

  list.querySelectorAll('.cm-item__delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this note?')) return;
      const id = btn.dataset.id;
      try {
        await fetch(`/api/love-notes/${id}`, { method: 'DELETE' });
        const idx = notes.findIndex((n) => String(n.id) === id);
        if (idx >= 0) notes.splice(idx, 1);
        renderNotesList(list, notes);
      } catch (err) {
        alert(`Couldn't delete: ${err.message}`);
      }
    });
  });
}

async function renderQuestionsTab() {
  const questions = await hubApi.listQuestions();

  panelEl.innerHTML = `
    <form class="cm-form" data-role="q-form">
      <input type="text" class="cm-form__input" name="prompt" placeholder="Question prompt…" required />
      <textarea class="cm-form__textarea" name="myAnswer" placeholder="Your answer (revealed after she answers)…" required></textarea>
      <select class="cm-form__input" name="depth">
        <option value="light">Light</option>
        <option value="closer" selected>Closer</option>
        <option value="deep">Deep</option>
      </select>
      <button type="submit" class="btn btn--primary">Add question</button>
    </form>
    <div class="cm-list" data-role="q-list"></div>
  `;

  const list = panelEl.querySelector('[data-role="q-list"]');
  renderQuestionsList(list, questions);

  panelEl.querySelector('[data-role="q-form"]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const prompt = form.prompt.value.trim();
    const myAnswer = form.myAnswer.value.trim();
    const depth = form.depth.value;
    if (!prompt || !myAnswer) return;

    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      const q = await hubApi.addQuestion({ prompt, myAnswer, depth });
      questions.push({ ...q, her_answer: null, answered_at: null });
      renderQuestionsList(list, questions);
      form.reset();
    } catch (err) {
      alert(`Couldn't add question: ${err.message}`);
    } finally {
      btn.disabled = false;
    }
  });
}

function renderQuestionsList(list, questions) {
  if (!questions.length) {
    list.innerHTML = '<p class="detail-empty">No questions yet.</p>';
    return;
  }
  list.innerHTML = questions
    .map(
      (q) => `
      <div class="cm-item" data-id="${q.id}">
        <div class="cm-item__body">
          <p class="cm-item__title">${escapeHtml(q.prompt)}</p>
          <p class="cm-item__meta">${escapeHtml((q.depth || 'closer').toUpperCase())} · Your answer: ${escapeHtml(q.my_answer)}</p>
          ${
            q.her_answer
              ? `<p class="cm-item__meta cm-item__meta--answered">Her answer (${fmtTime(q.answered_at)}): ${escapeHtml(q.her_answer)}</p>`
              : '<p class="cm-item__meta cm-item__meta--pending">Not answered yet</p>'
          }
        </div>
        <button type="button" class="cm-item__delete" data-id="${q.id}" title="Delete">✕</button>
      </div>
    `
    )
    .join('');

  list.querySelectorAll('.cm-item__delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this question?')) return;
      const id = btn.dataset.id;
      try {
        await fetch(`/api/questions/${id}`, { method: 'DELETE' });
        const idx = questions.findIndex((q) => String(q.id) === id);
        if (idx >= 0) questions.splice(idx, 1);
        renderQuestionsList(list, questions);
      } catch (err) {
        alert(`Couldn't delete: ${err.message}`);
      }
    });
  });
}

async function renderMoviesTab() {
  const movies = await hubApi.listMovies();

  panelEl.innerHTML = `
    <form class="cm-form" data-role="movie-form">
      <input type="text" class="cm-form__input" name="title" placeholder="Movie title…" required />
      <input type="text" class="cm-form__input" name="posterEmoji" placeholder="Emoji (optional, defaults 🎬)" maxlength="4" />
      <textarea class="cm-form__textarea" name="note" placeholder="Optional note…"></textarea>
      <button type="submit" class="btn btn--primary">Add movie</button>
    </form>
    <div class="cm-list" data-role="movie-list"></div>
  `;

  const list = panelEl.querySelector('[data-role="movie-list"]');
  renderMoviesList(list, movies);

  panelEl.querySelector('[data-role="movie-form"]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.title.value.trim();
    if (!title) return;

    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      const movie = await hubApi.addMovie({
        title,
        note: form.note.value.trim() || null,
        posterEmoji: form.posterEmoji.value.trim() || null,
        addedBy: 'you',
      });
      movies.unshift(movie);
      renderMoviesList(list, movies);
      form.reset();
    } catch (err) {
      alert(`Couldn't add movie: ${err.message}`);
    } finally {
      btn.disabled = false;
    }
  });
}

function ratingFor(movie, rater) {
  return movie.ratings?.find((r) => r.rater === rater) ?? null;
}

function renderMoviesList(list, movies) {
  if (!movies.length) {
    list.innerHTML = '<p class="detail-empty">No movies yet.</p>';
    return;
  }

  list.innerHTML = movies
    .map((m) => {
      const her = ratingFor(m, 'her');
      const you = ratingFor(m, 'you');
      const match = her && you && Math.abs(her.rating - you.rating) <= 1;
      return `
      <div class="cm-item" data-id="${m.id}">
        <div class="cm-item__body">
          <p class="cm-item__title">${m.poster_emoji || '🎬'} ${escapeHtml(m.title)} ${match ? '<span class="badge badge--done">Match!</span>' : ''}</p>
          ${m.note ? `<p class="cm-item__meta">${escapeHtml(m.note)}</p>` : ''}
          <p class="cm-item__meta">Her rating: ${her ? `${her.rating}/5` : 'not yet'}</p>
          <p class="cm-item__meta">Your rating: ${you ? `${you.rating}/5` : 'not rated'}
            <span class="cm-rate-stars" data-id="${m.id}">
              ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="cm-star${you && n <= you.rating ? ' cm-star--filled' : ''}" data-value="${n}">★</button>`).join('')}
            </span>
          </p>
        </div>
        <button type="button" class="cm-item__delete" data-id="${m.id}" title="Delete">✕</button>
      </div>
    `;
    })
    .join('');

  list.querySelectorAll('.cm-rate-stars').forEach((box) => {
    box.querySelectorAll('.cm-star').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = box.dataset.id;
        const value = Number(btn.dataset.value);
        try {
          const result = await hubApi.rateMovie(id, { rater: 'you', rating: value });
          const movie = movies.find((m) => String(m.id) === id);
          if (movie) movie.ratings = result.ratings;
          renderMoviesList(list, movies);
        } catch (err) {
          alert(`Couldn't rate: ${err.message}`);
        }
      });
    });
  });

  list.querySelectorAll('.cm-item__delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this movie?')) return;
      const id = btn.dataset.id;
      try {
        await fetch(`/api/movies/${id}`, { method: 'DELETE' });
        const idx = movies.findIndex((m) => String(m.id) === id);
        if (idx >= 0) movies.splice(idx, 1);
        renderMoviesList(list, movies);
      } catch (err) {
        alert(`Couldn't delete: ${err.message}`);
      }
    });
  });
}

async function renderSongsTab() {
  const songs = await hubApi.listSongs();

  if (!songs.length) {
    panelEl.innerHTML = '<p class="detail-empty">No songs added yet.</p>';
    return;
  }

  panelEl.innerHTML = `
    <div class="cm-list">
      ${songs
        .map(
          (s) => `
        <div class="cm-item" data-id="${s.id}">
          <div class="cm-item__body">
            <p class="cm-item__title">${escapeHtml(s.title)}</p>
            <p class="cm-item__meta">${escapeHtml(s.artist ?? '')} · added by ${s.added_by} · ${fmtTime(s.added_at)}</p>
          </div>
          <button type="button" class="cm-item__delete" data-id="${s.id}" title="Delete">✕</button>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  panelEl.querySelectorAll('.cm-item__delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this song?')) return;
      try {
        await hubApi.deleteSong(btn.dataset.id);
        renderActiveTab();
      } catch (err) {
        alert(`Couldn't delete: ${err.message}`);
      }
    });
  });
}

async function renderDiaryTab() {
  const entries = await hubApi.listDiary();

  if (!entries.length) {
    panelEl.innerHTML = '<p class="detail-empty">No diary entries yet.</p>';
    return;
  }

  panelEl.innerHTML = `
    <div class="cm-list">
      ${entries
        .map(
          (e) => `
        <div class="cm-item">
          <div class="cm-item__body">
            <p class="cm-item__title">${e.mood ? `${e.mood} ` : ''}${escapeHtml(e.entry_date)}</p>
            <p class="cm-item__meta">${escapeHtml(e.body)}</p>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}
