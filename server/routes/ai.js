import { Router } from 'express';

export const aiRouter = Router();

const FALLBACKS = [
  'Interesting overlap — ask her what made that answer feel true.',
  'Hold that for a second. What surprised you most?',
  'Cute. Follow up with: tell me more about that.',
  'That one might deserve a longer walk and no phones.',
  'Keep going — the next answer might surprise you both.',
];

aiRouter.post('/spark', async (req, res) => {
  const { prompt, herAnswer, myAnswer } = req.body ?? {};
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
              'You write one short warm conversation spark (max 18 words) for a private couple app after both answered a deep question. No quotes, no hashtags, no emoji spam.',
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
    const spark = data?.choices?.[0]?.message?.content?.trim();
    res.json({
      spark: spark || FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
      source: spark ? 'openrouter' : 'fallback',
    });
  } catch (err) {
    console.warn('[ai/spark]', err.message);
    res.json({ spark: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)], source: 'fallback' });
  }
});
