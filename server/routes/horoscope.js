import { Router } from 'express';
import { db } from '../db.js';

export const horoscopeRouter = Router();

const PERSONAL_FALLBACKS = [
  'Something soft settles into place today — a small certainty you have been circling without naming. Someone has been turning your words over carefully, the way you might hold a warm mug with both hands. You do not need to rush toward clarity; it is already walking toward you. Let the afternoon be quieter than your mind expects.',
  'A familiar restlessness shows up before lunch, then eases once you stop negotiating with it. Somewhere, someone is smiling at a detail only you would notice, and that thought alone is enough to warm a room. Trust the slower choice when two options appear. Your steadiness is doing more work than you give it credit for.',
  'Today favors honesty that does not need a speech — a look, a message left unfinished, a pause that says enough. Someone close has been carrying a quiet affection that has nowhere urgent to go, only somewhere true. You might feel slightly more seen than usual. That is not coincidence; that is attention finding its way home.',
  'The day asks less of your performance and more of your presence. You will know the difference by how your shoulders drop. Someone has been thinking about you in the soft hours, rehearsing nothing, wanting only the ordinary version of you. Give that version a little room. It is the one worth keeping.',
  'There is a gentle pull toward what feels rooted rather than impressive. Follow it without explaining yourself. Someone has noticed the way you make space for other people, and it has lodged somewhere tender. You do not have to earn the ease arriving later today. It was already meant for you.',
];

const TOGETHER_FALLBACKS = [
  'Something between you keeps choosing the long way around — not out of hesitation, but because the scenic route is where you both breathe easier. Today that patience looks like wisdom. A shared glance will do more than a plan. Keep leaving a little room for the unscripted good.',
  'The connection feels less like a spark and more like a lamp left on in another room — steady, waiting, quietly useful. Today favors small returns: a reply that arrives sooner, a joke that lands softer. You do not need a milestone. You need the ordinary minutes you already know how to share.',
  'There is a knowing between you that does not require proof, only practice. Today offers a chance to practice without trying so hard. One of you will reach first in a way that feels almost accidental. Catch it gently. The day is rooting for the version of you that stays curious.',
  'Whatever is building here prefers honesty over performance. Today that looks like saying the true thing a beat earlier than feels safe. The bond answers in kind. You will notice how easy silence becomes when neither of you is performing. Hold that ease; it is the real work.',
  'The day leans toward the two of you without announcing itself. A shared rhythm shows up in the small logistics — timing, tone, the joke you both almost tell. Let it be enough. Something quiet is on your side, and it does not need an audience to keep going.',
];

const PERSONAL_SYSTEM =
  "You write a short daily horoscope for a Taurus woman. Exactly 3-4 sentences. Warm, grounded, specific — never vague fortune-cookie filler. Somewhere in it, refer obliquely to a person in her life who has been thinking about her: never name them, never use 'he' or 'boyfriend' or 'partner', just 'someone'. Make it feel like the stars noticed something she hasn't said out loud yet. No emoji, no hashtags, no phrases like 'the stars say' or 'the universe wants'.";

const TOGETHER_SYSTEM =
  "You write a short daily reading about the connection between a Taurus woman and a Virgo man. Exactly 3-4 sentences. Both are earth signs — grounded, loyal, slow to open up, steady once they do. Draw on that real compatibility rather than generic astrology filler: the patience between them, the way neither rushes, the quiet consistency. Warm and a little knowing, never cheesy or saccharine. Written as though something is quietly rooting for them. No emoji, no hashtags, no phrases like 'the stars say' or 'the universe wants'.";

/** Today's date as YYYY-MM-DD in Asia/Kolkata. */
export function todayIst() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

/** Day-of-year (1–366) for a YYYY-MM-DD string — stable fallback index. */
function dayOfYear(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const start = Date.UTC(y, 0, 0);
  return Math.floor((utc - start) / 86_400_000);
}

function pickFallbacks(dateStr) {
  const idx = dayOfYear(dateStr) % PERSONAL_FALLBACKS.length;
  return {
    personal: PERSONAL_FALLBACKS[idx],
    together: TOGETHER_FALLBACKS[idx],
    source: 'fallback',
  };
}

function getCached(dateStr) {
  return db.prepare('SELECT date, personal, together, created_at FROM horoscopes WHERE date = ?').get(dateStr);
}

function saveReading(dateStr, personal, together) {
  db.prepare(
    `INSERT INTO horoscopes (date, personal, together)
     VALUES (?, ?, ?)
     ON CONFLICT(date) DO NOTHING`
  ).run(dateStr, personal, together);
  return getCached(dateStr);
}

function stripFence(text) {
  return String(text || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseReadings(raw) {
  const cleaned = stripFence(raw);
  try {
    const parsed = JSON.parse(cleaned);
    const personal = typeof parsed.personal === 'string' ? parsed.personal.trim() : '';
    const together = typeof parsed.together === 'string' ? parsed.together.trim() : '';
    if (personal && together) return { personal, together };
  } catch {
    // try to salvage with a loose match
  }
  return null;
}

async function callOpenRouter(dateStr) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://localhost',
      'X-Title': 'Our World gift site',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      max_tokens: 420,
      temperature: 0.85,
      messages: [
        {
          role: 'system',
          content: `${PERSONAL_SYSTEM}

Also write a second reading with this brief:
${TOGETHER_SYSTEM}

Return ONLY raw JSON with exactly these keys, no markdown fences:
{"personal":"...","together":"..."}`,
        },
        {
          role: 'user',
          content: `Date (IST): ${dateStr}\nWrite today's two readings.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  return parseReadings(content);
}

horoscopeRouter.get('/', async (_req, res) => {
  const date = todayIst();

  try {
    const cached = getCached(date);
    if (cached) {
      res.json({
        date: cached.date,
        personal: cached.personal,
        together: cached.together,
        source: 'cache',
      });
      return;
    }

    let personal;
    let together;
    let source = 'openrouter';

    try {
      const generated = await callOpenRouter(date);
      if (generated) {
        personal = generated.personal;
        together = generated.together;
      } else {
        const fb = pickFallbacks(date);
        personal = fb.personal;
        together = fb.together;
        source = 'fallback';
      }
    } catch (err) {
      console.warn('[horoscope]', err.message);
      const fb = pickFallbacks(date);
      personal = fb.personal;
      together = fb.together;
      source = 'fallback';
    }

    const saved = saveReading(date, personal, together) || {
      date,
      personal,
      together,
    };

    res.json({
      date: saved.date,
      personal: saved.personal,
      together: saved.together,
      source,
    });
  } catch (err) {
    console.warn('[horoscope/fatal]', err.message);
    const fb = pickFallbacks(date);
    res.json({ date, personal: fb.personal, together: fb.together, source: 'fallback' });
  }
});
