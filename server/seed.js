import { db } from './db.js';

const QUESTIONS = [
  {
    depth: 'light',
    prompt: "What's a tiny thing I do that makes you feel cared for?",
    myAnswer:
      'When you remember the small details I mentioned once and bring them back later.',
  },
  {
    depth: 'light',
    prompt: 'What song feels like "us" even if we haven\'t named it yet?',
    myAnswer:
      "Still deciding — but I know it when I hear soft guitars and your laugh in my head.",
  },
  {
    depth: 'closer',
    prompt: 'When do you feel most like yourself around me?',
    myAnswer:
      'When the jokes stop being performance and we can just sit in silence without fixing it.',
  },
  {
    depth: 'closer',
    prompt: "What's a fear you don't say out loud much, that you wish someone held gently?",
    myAnswer:
      "That I'll get the timing wrong — too much or too late — with people I care about.",
  },
  {
    depth: 'closer',
    prompt: 'What does "home" feel like for you, in a person?',
    myAnswer: 'Soft honesty. No scanning the room for exits.',
  },
  {
    depth: 'deep',
    prompt: 'What do you want us to still be laughing about in ten years?',
    myAnswer:
      'How seriously we took the little moments that ended up becoming everything.',
  },
  {
    depth: 'deep',
    prompt: "What's something you've never quite found the words for, that you want understood anyway?",
    myAnswer: 'How much quiet loyalty means to me — showing up without a speech.',
  },
  {
    depth: 'deep',
    prompt: 'If this connection had a promise (not a pressure), what would you want it to be?',
    myAnswer: 'That we keep choosing curiosity over assumptions.',
  },
];

const MOVIES = [
  { title: 'La La Land', note: 'for the almosts and the music', posterEmoji: '🎹' },
  { title: 'Before Sunrise', note: 'one long night of talking', posterEmoji: '🌙' },
  { title: 'The Grand Budapest Hotel', note: 'pretty chaos', posterEmoji: '🏨' },
  { title: 'Past Lives', note: 'what if / what is', posterEmoji: '✈️' },
];

const SONGS = [
  {
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    note: 'soft',
    addedBy: 'you',
  },
  {
    title: 'Lover',
    artist: 'Taylor Swift',
    note: "obvious and I'm not sorry",
    addedBy: 'you',
  },
  {
    title: 'Khairiyat',
    artist: 'Arijit Singh',
    note: 'for quiet evenings',
    addedBy: 'you',
  },
  {
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    note: 'dramatic on purpose',
    addedBy: 'you',
  },
];

const NOTES = [
  {
    kind: 'memory',
    body: 'That night we walked around talking about nothing and everything — I did not want it to end.',
  },
  {
    kind: 'memory',
    body: 'The way you laughed so hard you had to sit down. I still think about it.',
  },
  {
    kind: 'like',
    body: 'You remember tiny details about people you barely know, and you actually care.',
  },
  {
    kind: 'like',
    body: 'You are ridiculously easy to talk to. Always have been.',
  },
];

/** Seed starter content once when tables are empty. */
export function seedIfEmpty() {
  const curatedPrompt = QUESTIONS[0].prompt;
  const hasCurated = db.prepare('SELECT COUNT(*) AS c FROM questions WHERE prompt = ?').get(curatedPrompt).c;
  if (hasCurated === 0) {
    db.prepare('DELETE FROM question_answers').run();
    db.prepare('DELETE FROM questions').run();
    const insert = db.prepare('INSERT INTO questions (prompt, my_answer, depth) VALUES (?, ?, ?)');
    const tx = db.transaction(() => {
      QUESTIONS.forEach((q) => insert.run(q.prompt, q.myAnswer, q.depth));
    });
    tx();
    console.log(`[seed] Seeded ${QUESTIONS.length} deep-dive questions`);
  }

  const mCount = db.prepare('SELECT COUNT(*) AS c FROM movies').get().c;
  if (mCount === 0) {
    const insert = db.prepare(
      'INSERT INTO movies (title, note, poster_emoji, added_by) VALUES (?, ?, ?, ?)'
    );
    const tx = db.transaction(() => {
      MOVIES.forEach((m) => insert.run(m.title, m.note, m.posterEmoji, 'you'));
    });
    tx();
    console.log(`[seed] Added ${MOVIES.length} movies`);
  }

  const sCount = db.prepare('SELECT COUNT(*) AS c FROM songs').get().c;
  if (sCount === 0) {
    const insert = db.prepare(
      'INSERT INTO songs (title, artist, added_by, note) VALUES (?, ?, ?, ?)'
    );
    const tx = db.transaction(() => {
      SONGS.forEach((s) => insert.run(s.title, s.artist, s.addedBy, s.note));
    });
    tx();
    console.log(`[seed] Added ${SONGS.length} songs`);
  }

  const nCount = db.prepare('SELECT COUNT(*) AS c FROM love_notes').get().c;
  if (nCount === 0) {
    const insert = db.prepare('INSERT INTO love_notes (kind, body) VALUES (?, ?)');
    const tx = db.transaction(() => {
      NOTES.forEach((n) => insert.run(n.kind, n.body));
    });
    tx();
    console.log(`[seed] Added ${NOTES.length} love notes`);
  }
}

export { QUESTIONS };
