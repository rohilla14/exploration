import { db } from './db.js';

const QUESTIONS = [
  {
    depth: 'light',
    prompt: "What's a tiny thing I do that makes you feel cared for?",
    myAnswer: 'When you remember the small details I mentioned once and bring them back later.',
  },
  {
    depth: 'light',
    prompt: 'What song feels like "us" even if we haven\'t named it yet?',
    myAnswer: 'Still deciding, but I know it when I hear soft guitars and your laugh in my head.',
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
    myAnswer: "That I'll get the timing wrong, too much or too late, with people I care about.",
  },
  {
    depth: 'closer',
    prompt: 'What does "home" feel like for you, in a person?',
    myAnswer: 'Soft honesty. No scanning the room for exits.',
  },
  {
    depth: 'deep',
    prompt: 'What do you want us to still be laughing about in ten years?',
    myAnswer: 'How seriously we took the little moments that ended up becoming everything.',
  },
  {
    depth: 'deep',
    prompt:
      "What's something you've never quite found the words for, that you want understood anyway?",
    myAnswer: 'How much quiet loyalty means to me, showing up without a speech.',
  },
  {
    depth: 'deep',
    prompt: 'If this connection had a promise (not a pressure), what would you want it to be?',
    myAnswer: 'That we keep choosing curiosity over assumptions.',
  },
  {
    depth: 'closer',
    prompt: 'Would you change anything about the first day we met?',
    myAnswer: `Honestly? I'd change the date. I'd make it my birthday, because then I could say the best thing that ever happened to me happened the day I was born. Or maybe even earlier, I think I would've liked to have known you as a kid. To have grown up with you around.

I wonder what you were like at 10. Probably asking questions nobody had answers to. Probably already making people think harder about themselves without even realizing it.

But then again, maybe we met at exactly the right time. Maybe I needed to become who I am now to actually deserve that day.`,
  },
  {
    depth: 'light',
    prompt:
      'If we could pause the world for a day and do anything together, what would you want to do?',
    myAnswer: `I'd make you chai in the morning. Then find somewhere with the loudest, most overwhelming nature around us: mountains, water, wind, something that makes you feel small in the best way. And we'd just sit there. No agenda. Just that.

I'd want to watch you in a moment where you're completely at peace. No phone, no noise from the world. Just you being calm.

I think that version of you, completely unbothered, surrounded by something beautiful, would be the most stunning thing I've ever seen.

And then maybe we'd get lost on a walk and argue about which way to go back. That sounds perfect honestly.`,
  },
  {
    depth: 'deep',
    prompt: "What do you need most from me? Even if you don't always ask for it.",
    myAnswer: `This is the hard one. I don't share problems easily. I barely even listen to people most of the time. But I think what I need is for you to just hold me tight, not let me drift. I get impulsive, I stop eating, I go quiet and disappear into work.

I need you to call me out when I'm being an idiot. Not gently, actually call me out. I respond to that better than sympathy.

And share everything with me: your happy, your sad, your random 2am thoughts, the things you almost texted and then didn't. I want those too.

I function better when you're in my life. I think I always knew that. It just took me a while to admit it.`,
  },
  {
    depth: 'deep',
    prompt: 'If you had to describe our love in one sentence, what would it be?',
    // Placeholder in your voice: replace it with your own answer from the admin panel.
    myAnswer: "I'm still finding the right sentence. Ask me again in person.",
  },
  {
    depth: 'closer',
    prompt: 'Which memory of us is your favorite?',
    myAnswer: `I have too many and they all start from day one. Dancing with you on Ainvi Ainvi on New Year's. And you pulling me in to kiss you, twice. Actually my favorite is definitely the second time, because clearly once wasn't enough for you 😂

But honestly? The one I keep coming back to is quieter than all of those. We were just sitting together, Lost by Frank Ocean was playing, and I remember my feet on the ground and this feeling washing over me like: this is real. This is actually happening.

I wasn't thinking about anything else. Not work, not tomorrow, not what I should say next. Just that exact moment.

I've had a lot of moments in my life. Very few of them felt like that one. Like something I'd want to freeze and live inside for a while.

That one I'll carry for a very long time.`,
  },
  {
    depth: 'deep',
    prompt: "How do you want to be shown love on the days you're feeling low?",
    myAnswer: `Remind me to eat. I know that sounds small but I genuinely forget, and if I'm not okay, I've probably not eaten in 15 hours. Don't try to fix everything. Just check in. Tell me to get up.

Sometimes I don't even know I'm feeling low until someone points it out. I just go quiet and call it "being busy."

I think what I actually need on those days is someone who doesn't need me to explain it. Who just shows up and sits with me in it.

And maybe forces me to eat something. Genuinely. That would fix 60% of it.`,
  },
  {
    depth: 'light',
    prompt: "When we're older, what's something you hope we'll still be doing together?",
    myAnswer: `Asking each other these questions 😂

But if I'm being real, I want a home in the mountains. Not far from the city, like an hour or two out. Big land, lots of space, nature everywhere. The kind of place where mornings feel like a reward.

I want a garden we actually tend to. A dog that's too big for the house. Chai on the porch when it rains.

I want to still be the person you tell things to first. Before anyone else.

And I want us to still have evenings where a good song comes on and everything just stops for a moment. Like that Frank Ocean night. But we've collected a hundred more of those by then.

That's the life I'd want. Honestly.`,
  },
];

const MOVIES = [
  { title: 'La La Land', note: 'for the almosts and the music', posterEmoji: '🎹' },
  { title: 'Before Sunrise', note: 'one long night of talking', posterEmoji: '🌙' },
  { title: 'The Grand Budapest Hotel', note: 'pretty chaos', posterEmoji: '🏨' },
  { title: 'Past Lives', note: 'what if / what is', posterEmoji: '✈️' },
];

const SONGS = [
  // youtubeId is the official upload for each one, so every song plays in full.
  {
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    note: 'soft',
    addedBy: 'you',
    youtubeId: 'GxldQ9eX2wo',
  },
  {
    title: 'Lover',
    artist: 'Taylor Swift',
    note: "obvious and I'm not sorry",
    addedBy: 'you',
    youtubeId: '-BjZmE2gtdo',
  },
  {
    title: 'Khairiyat',
    artist: 'Arijit Singh',
    note: 'for the long drives',
    addedBy: 'you',
    youtubeId: 'DMRRC0rwO_I',
  },
  {
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    note: 'this one is ours now',
    addedBy: 'you',
    youtubeId: 'kPa7bsKwL-c',
  },
  {
    title: 'Lost',
    artist: 'Frank Ocean',
    note: 'the one that was playing when I knew',
    addedBy: 'you',
    youtubeId: 'J3DWAJGaf7o',
  },
  {
    title: 'Apocalypse',
    artist: 'Cigarettes After Sex',
    note: 'put this on and say nothing',
    addedBy: 'you',
    youtubeId: 'sElE_BfQ67s',
  },
  {
    title: 'Sweet',
    artist: 'Cigarettes After Sex',
    note: 'slow, for late nights',
    addedBy: 'you',
    youtubeId: 'pZ31pyTZdh0',
  },
  {
    title: 'Kesariya',
    artist: 'Arijit Singh',
    note: 'you already know',
    addedBy: 'you',
    youtubeId: '6RdS6wLu7RY',
  },
  {
    title: 'Agar Tum Saath Ho',
    artist: 'Arijit Singh & Alka Yagnik',
    note: 'the one that gets me every time',
    addedBy: 'you',
    youtubeId: 'xRb8hxwN5zc',
  },
  {
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    note: 'no explanation needed',
    addedBy: 'you',
    youtubeId: 'IJq0yyWug1k',
  },
];

const NOTES = [
  {
    kind: 'memory',
    body: 'That night we walked around talking about nothing and everything, I did not want it to end.',
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

/** Seed starter content; questions are idempotent per prompt. */
/** Long dashes never show up in what she reads, including text saved in the database earlier. */
async function stripDashesFromStoredText() {
  const targets = [
    ['questions', 'prompt'],
    ['questions', 'my_answer'],
    ['love_notes', 'body'],
    ['songs', 'note'],
    ['movies', 'note'],
    ['horoscopes', 'personal'],
    ['horoscopes', 'together'],
  ];
  for (const [table, col] of targets) {
    await db
      .prepare(
        `UPDATE ${table}
           SET ${col} = replace(replace(replace(${col}, ' — ', ', '), ' – ', ', '), '—', ', ')
         WHERE ${col} LIKE '%—%' OR ${col} LIKE '%–%'`
      )
      .run();
  }
}

/** Fill in YouTube links on songs that were seeded before links existed, and add any new ones. */
async function topUpSongLinks() {
  const setLink = db.prepare(
    'UPDATE songs SET youtube_id = ? WHERE title = ? AND youtube_id IS NULL'
  );
  const exists = db.prepare('SELECT id FROM songs WHERE title = ?');
  const add = db.prepare(
    'INSERT INTO songs (title, artist, added_by, note, youtube_id) VALUES (?, ?, ?, ?, ?)'
  );
  for (const s of SONGS) {
    if (await exists.get(s.title)) await setLink.run(s.youtubeId ?? null, s.title);
    else await add.run(s.title, s.artist, s.addedBy, s.note, s.youtubeId ?? null);
  }
}

export async function seedIfEmpty() {
  await topUpSongLinks();
  await stripDashesFromStoredText();
  const insert = db.prepare('INSERT INTO questions (prompt, my_answer, depth) VALUES (?, ?, ?)');
  const updateAnswer = db.prepare(
    'UPDATE questions SET my_answer = ? WHERE prompt = ? AND my_answer IS NULL'
  );
  const existsCheck = db.prepare('SELECT id, my_answer FROM questions WHERE prompt = ?');
  let inserted = 0;
  let updated = 0;
  for (const q of QUESTIONS) {
    const existing = await existsCheck.get(q.prompt);
    if (!existing) {
      await insert.run(q.prompt, q.myAnswer, q.depth);
      inserted += 1;
    } else if (existing.my_answer == null && q.myAnswer != null) {
      await updateAnswer.run(q.myAnswer, q.prompt);
      updated += 1;
    }
  }
  if (inserted || updated) {
    console.log(`[seed] Questions: ${inserted} inserted, ${updated} updated`);
  }

  const mCount = (await db.prepare('SELECT COUNT(*) AS c FROM movies').get()).c;
  if (mCount === 0) {
    const insertMovies = db.prepare(
      'INSERT INTO movies (title, note, poster_emoji, added_by) VALUES (?, ?, ?, ?)'
    );
    for (const m of MOVIES) {
      await insertMovies.run(m.title, m.note, m.posterEmoji, 'you');
    }
    console.log(`[seed] Added ${MOVIES.length} movies`);
  }

  const sCount = (await db.prepare('SELECT COUNT(*) AS c FROM songs').get()).c;
  if (sCount === 0) {
    const insertSongs = db.prepare(
      'INSERT INTO songs (title, artist, added_by, note, youtube_id) VALUES (?, ?, ?, ?, ?)'
    );
    for (const s of SONGS) {
      await insertSongs.run(s.title, s.artist, s.addedBy, s.note, s.youtubeId ?? null);
    }
    console.log(`[seed] Added ${SONGS.length} songs`);
  }

  const nCount = (await db.prepare('SELECT COUNT(*) AS c FROM love_notes').get()).c;
  if (nCount === 0) {
    const insertNotes = db.prepare('INSERT INTO love_notes (kind, body) VALUES (?, ?)');
    for (const n of NOTES) {
      await insertNotes.run(n.kind, n.body);
    }
    console.log(`[seed] Added ${NOTES.length} love notes`);
  }
}

export { QUESTIONS };
