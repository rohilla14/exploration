import { Router } from 'express';
import { noDashes } from '../utils/text.js';

export const aiRouter = Router();

/** Trim and cap user-supplied text before it reaches the model prompt. */
function clip(value, max = 400) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

const FALLBACKS = [
  'Interesting overlap, ask her what made that answer feel true.',
  'Hold that for a second. What surprised you most?',
  'Cute. Follow up with: tell me more about that.',
  'That one might deserve a longer walk and no phones.',
  'Keep going, the next answer might surprise you both.',
];

aiRouter.post('/spark', async (req, res) => {
  const { prompt: rawPrompt, herAnswer: rawHer, myAnswer: rawMine } = req.body ?? {};
  const prompt = clip(rawPrompt);
  const herAnswer = clip(rawHer);
  const myAnswer = clip(rawMine);
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) {
    res.json({ spark: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)], source: 'fallback' });
    return;
  }

  try {
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
        max_tokens: 60,
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content:
              'You write one short warm conversation spark (max 18 words) for a private couple app after both answered a deep question. No quotes, no hashtags, no emoji spam. Never use dashes or hyphens.',
          },
          {
            role: 'user',
            content: `Question: ${prompt}\nShe said: ${herAnswer}\nHe said: ${myAnswer}\nSpark:`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter ${response.status}`);
    }

    const data = await response.json();
    const spark = noDashes(data?.choices?.[0]?.message?.content);
    res.json({
      spark: spark || FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
      source: spark ? 'openrouter' : 'fallback',
    });
  } catch (err) {
    console.warn('[ai/spark]', err.message);
    res.json({ spark: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)], source: 'fallback' });
  }
});

const DIARY_PROMPT_FALLBACKS = [
  'What made you smile today, even a little?',
  'Which quiet moment do you want to keep?',
  'What are you looking forward to sharing?',
  'Who or what felt closest to you today?',
  'What would you tell past-you about tonight?',
];

aiRouter.post('/diary-prompt', async (req, res) => {
  const recentMood = clip(req.body?.recentMood, 16);
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) {
    res.json({
      prompt: DIARY_PROMPT_FALLBACKS[Math.floor(Math.random() * DIARY_PROMPT_FALLBACKS.length)],
      source: 'fallback',
    });
    return;
  }

  try {
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
        max_tokens: 60,
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content:
              "You write one short, warm diary journaling prompt (max 15 words) for a private couple's diary app. Casual, gentle, never cheesy or generic like 'how was your day'.",
          },
          {
            role: 'user',
            content: recentMood
              ? `Recent mood emoji: ${recentMood}\nDiary prompt:`
              : 'Diary prompt:',
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter ${response.status}`);
    }

    const data = await response.json();
    const prompt = noDashes(data?.choices?.[0]?.message?.content);
    res.json({
      prompt: prompt || DIARY_PROMPT_FALLBACKS[Math.floor(Math.random() * DIARY_PROMPT_FALLBACKS.length)],
      source: prompt ? 'openrouter' : 'fallback',
    });
  } catch (err) {
    console.warn('[ai/diary-prompt]', err.message);
    res.json({
      prompt: DIARY_PROMPT_FALLBACKS[Math.floor(Math.random() * DIARY_PROMPT_FALLBACKS.length)],
      source: 'fallback',
    });
  }
});

const THIS_OR_THAT_FALLBACKS = [
  'Bold choice. I respect it.',
  'Okay noted, strong taste.',
  'Hmm. Predictable? Maybe. Cute? Yes.',
  'That one says a lot about you.',
  'Interesting. We should unpack that later.',
];

aiRouter.post('/this-or-that-reaction', async (req, res) => {
  const question = { a: clip(req.body?.question?.a, 120), b: clip(req.body?.question?.b, 120) };
  const herPick = clip(req.body?.herPick);
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) {
    res.json({
      reaction: THIS_OR_THAT_FALLBACKS[Math.floor(Math.random() * THIS_OR_THAT_FALLBACKS.length)],
      source: 'fallback',
    });
    return;
  }

  try {
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
        max_tokens: 60,
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content:
              "You write one short, playful reaction (max 15 words) to someone's this-or-that answer in a private couple's app. Light teasing tone, never mean, no hashtags or emoji spam.",
          },
          {
            role: 'user',
            content: `Options: ${question?.a ?? ''} vs ${question?.b ?? ''}\nShe picked: ${herPick}\nReaction:`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter ${response.status}`);
    }

    const data = await response.json();
    const reaction = noDashes(data?.choices?.[0]?.message?.content);
    res.json({
      reaction:
        reaction || THIS_OR_THAT_FALLBACKS[Math.floor(Math.random() * THIS_OR_THAT_FALLBACKS.length)],
      source: reaction ? 'openrouter' : 'fallback',
    });
  } catch (err) {
    console.warn('[ai/this-or-that-reaction]', err.message);
    res.json({
      reaction: THIS_OR_THAT_FALLBACKS[Math.floor(Math.random() * THIS_OR_THAT_FALLBACKS.length)],
      source: 'fallback',
    });
  }
});
