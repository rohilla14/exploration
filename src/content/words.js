// Words that appear in the Letters and Conversations apps.
// Plain text only. Keep dashes out of anything that goes in here.
// Written the way he actually talks: short sentences, simple words, nothing fancy.

/**
 * Letters: each has a short title (shown in the list) and paragraphs (each entry is one line
 * or paragraph on the page).
 * @type {{ id: string, title: string, paragraphs: string[] }[]}
 */
export const LETTERS = [
  {
    id: 'quiet-parts',
    title: 'The quiet parts',
    paragraphs: [
      'I think about you more than I would admit out loud.',
      'Not in a loud way. You are just there, in the back of my head, while I am doing normal things.',
      'I will be in the middle of something and my head goes straight back to you.',
      'It feels like I knew you before I met you.',
    ],
  },
  {
    id: 'through-my-eyes',
    title: 'How I see you',
    paragraphs: [
      'If I could give you one thing, it would be to see yourself the way I see you.',
      'You would stop doubting yourself so much.',
      'I have never been able to talk to anyone the way I talk to you.',
      'You just get it. I do not have to explain myself.',
    ],
  },
  {
    id: 'say-it',
    title: 'Say it out loud',
    paragraphs: [
      'If you think something good about someone, tell them.',
      'Most people never hear it. They only hear what they did wrong and what they should fix.',
      'So when I say something to you, I mean it. I am not just being nice.',
      'I should say it more.',
    ],
  },
  {
    id: 'in-silence',
    title: 'Without saying it',
    paragraphs: [
      'I do not always say it out loud.',
      'Sometimes I just sit with it and that is enough for me.',
      'When you are not around I still carry it.',
      'And at night, in my head, you do not go anywhere.',
    ],
  },
  {
    id: 'tired',
    title: 'When I am tired',
    paragraphs: [
      'I think the closest thing to love is wanting someone when you are tired.',
      'I had the longest day. I did not want to talk to anyone.',
      'But I still wanted you sitting next to me.',
      'That is when I knew.',
    ],
  },
  {
    id: 'your-job',
    title: 'Nobody can do it for you',
    paragraphs: [
      'Nobody is going to love you exactly how you want. That part is on you.',
      'Nobody is going to fix what hurts. That is on you too.',
      'Nobody can make you feel whole if you keep handing them the broken parts.',
      'Nobody can make you feel like enough while you keep saying sorry for being too much.',
      'Nobody loves anyone perfectly. They can only love you honestly.',
      'That is the part I can do.',
    ],
  },
  {
    id: 'little-rules',
    title: 'Things I try to remember',
    paragraphs: [
      'I try not to expect much from people. Expecting is the part that hurts.',
      'Life is short so I would rather just enjoy it.',
      'Listen before you talk.',
      'Think before you write.',
      'Forgive before you ask for anything.',
      'Try before you quit.',
      'Live before you run out of time.',
    ],
  },
  {
    id: 'the-first-time',
    title: 'The first time',
    paragraphs: [
      'The first time we met, you hugged me like you had known me my whole life.',
      'Then you just took my hand and started walking. You were leading, and I was behind you, not saying anything.',
      'In my head I was just thinking the same word, over and over. Wow. Wow. Wow.',
      'I still think it sometimes, out of nowhere, remembering that exact moment.',
    ],
  },
];

/**
 * Conversations: two voices. `me: true` messages sit on the right.
 * @type {{ id: string, title: string, subtitle: string, messages: { me?: boolean, text: string }[] }[]}
 */
export const CONVERSATIONS = [
  {
    id: 'a-question',
    title: 'A question',
    subtitle: 'the honest one',
    messages: [
      { text: 'Can I ask you something?' },
      { me: true, text: 'Go ahead.' },
      { text: 'Have you ever been depressed?' },
      { me: true, text: 'Most of the time, yeah.' },
      { text: 'What does it feel like?' },
      { me: true, text: 'Hard to explain. You forget what better even felt like.' },
      {
        me: true,
        text: 'So you do things you think will help, and they do not. They make it worse.',
      },
      {
        me: true,
        text: 'And the things that would actually help are the ones I am most scared of doing.',
      },
      { me: true, text: 'So I just do not do them.' },
    ],
  },
  {
    id: 'what-i-love-most',
    title: 'What I like most',
    subtitle: 'about her',
    messages: [
      { text: 'So what do you like most about her?' },
      { me: true, text: 'She sees the good in people. Actually sees it.' },
      {
        me: true,
        text: 'She will be walking down the road, stop to talk to some aunty for 45 minutes, and then stay friends with her for years.',
      },
      { me: true, text: 'And she just likes me anyway. Whatever I do.' },
      { me: true, text: 'Her face when she laughs. That is the whole thing for me.' },
    ],
  },
];

/**
 * A single fixed message, always the same, for whenever she needs it. Not part of Letters on
 * purpose, this one has its own icon on the desktop so it is easy to find on a bad day.
 * @type {{ title: string, paragraphs: string[] }}
 */
export const HARD_DAY_NOTE = {
  title: 'For the hard days',
  paragraphs: [
    'If today is one of the hard ones, this is for you.',
    'You do not have to be okay right now. Not for me, not for anyone.',
    'The thing I love in you, how you notice people and make them feel like they matter, does not go away just because you cannot feel it today.',
    'I see you on the good days and the bad ones. This one does not change anything for me.',
    'Come back to this whenever you need to. I am not going anywhere.',
  ],
};
