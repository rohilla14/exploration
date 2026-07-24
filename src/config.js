// ============================================================
// CUSTOMIZE HERE — swap placeholder content before sharing
// ============================================================
//
// 📷 YOUR PHOTOS (in public/assets/)
//
//   photo.jpeg                              → cinematic scroll
//   IMG_2852.JPG                            → polaroid A
//   628bf372-9d06-4db2-9acd-14e13021f468.jpg → polaroid B
//   cacb8ec6-cba6-4214-9f62-0759952ade21.jpg → planner welcome
//   245eedf8-8997-4501-b6c9-a70cd89b94e1.jpg → spare / swap in anytime
//
// ============================================================

export const CONFIG = {
  herName: 'Rhea',

  loadingText: 'Psst… unwrapping something for you.',

  greetingSoftLine:
    "Hey! I made you a little corner of the internet. Wander around, take your time, keep scrolling.",

  cinematicPhoto: '/assets/photo.jpeg',

  photos: {
    cinematic: '/assets/photo.jpeg',
    polaroidA: '/assets/IMG_2852.JPG',
    polaroidB: '/assets/628bf372-9d06-4db2-9acd-14e13021f468.jpg',
    plannerAccent: '/assets/cacb8ec6-cba6-4214-9f62-0759952ade21.jpg',
    polaroidCaptions: { a: '✨', b: 'that day' },
  },

  cinematicLines: [
    'Some days feel ordinary',
    'until someone makes them feel special.',
    'I notice the small things,',
    'a laugh, a look, a room feeling warmer.',
    'So I built this, like a present you open one scroll at a time.',
  ],
  cinematicFinale: 'Welcome to your present. 🎁',

  hubIntro:
    "Games, notes, questions, our songs, movie nights, and a diary — tap any card. When you're ready, the surprise is waiting.",
  hubFeatures: [
    {
      id: 'games',
      icon: '🎮',
      title: 'Mini games',
      description: 'Catch hearts, match memories, pulse to the beat.',
    },
    {
      id: 'notes',
      icon: '📝',
      title: 'Notes',
      description: 'Moments and things I love about you.',
    },
    {
      id: 'questions',
      icon: '💭',
      title: 'Deep Dive',
      description: 'Answer first — then see what I said.',
    },
    {
      id: 'playlist',
      icon: '🎵',
      title: 'Our Playlist',
      description: 'Search, add, and listen together.',
    },
    {
      id: 'movies',
      icon: '🎬',
      title: 'Movie Nights',
      description: 'Watchlist, rate separately, see if we match.',
    },
    {
      id: 'diary',
      icon: '📔',
      title: 'Dear Diary',
      description: 'Thoughts, day by day.',
    },
  ],
  hubContinueLabel: 'Ready for the surprise? →',

  bigAskQuestion: 'Would you like to go out with me?',
  bigAskNoCapturedMsg: "Nice try! That button's stuck now. Yes is right there 😄",

  plannerWelcomeEyebrow: 'She said yes!',
  plannerWelcomeTitle: "I'm still smiling.",
  plannerWelcomeSub: 'Tap a day, pick a time, build the itinerary. I will be there.',
  plannerWelcomeBtn: "Let's plan our date →",
  plannerPaletteTitle: 'Build your day',
  plannerActivityPrompt: 'Pick a mood, then tap places to add stops.',
  plannerItineraryHint: 'Tap places below · reorder with ↑ ↓',
  plannerSlotHints: [
    'Tap a day on the calendar →',
    'Pick a time preset or spin the wheels →',
    'Choose a mood, then tap places →',
    'Happy with the plan? Lock it in →',
  ],
  plannerSteps: ['Day', 'Meet at', 'Our day', 'Locked in'],
  plannerWhenChipLabel: 'When',
  plannerConfirmBtn: 'Lock it in!',
  plannerLockInTitle: 'Make it official',
  plannerLockInPrompt: 'Type "sure, let\'s go" (commas optional) to seal the plan',
  plannerLockInPlaceholder: "sure, let's go",
  plannerLockInError: 'Almost! Type exactly: sure, let\'s go',
  plannerTimePresets: [
    { label: 'Afternoon', hour: '3', minute: '00', ampm: 'PM' },
    { label: 'Evening', hour: '7', minute: '00', ampm: 'PM' },
    { label: 'Night', hour: '9', minute: '30', ampm: 'PM' },
  ],
  plannerDateReveal: "It's happening!",
  plannerFlowersCta: 'Now build your flower pot →',

  dateMoods: [
    { id: 'coffee', emoji: '☕', label: 'Coffee date', tagline: 'Good coffee, easy conversation' },
    { id: 'dinner', emoji: '🍽️', label: 'Dinner out', tagline: 'Sit down and take our time' },
    { id: 'outdoors', emoji: '🌿', label: 'Outdoors', tagline: 'Fresh air and a walk' },
    { id: 'dessert', emoji: '🍰', label: 'Dessert run', tagline: 'Something sweet after' },
    { id: 'explore', emoji: '🚶', label: 'Explore Delhi', tagline: 'Pick a neighbourhood and wander' },
  ],

  datePlaces: {
    coffee: [
      'Diggin, Chanakyapuri',
      'Blue Tokai, Saket',
      "Ammi's, Haus Khas Village",
      'The Grammar Room, Mehrauli',
    ],
    dinner: [
      'Indian Accent, The Lodhi',
      'Olive Bar & Kitchen, One Golden Mile',
      'Diggin Cafe, Anand Lok',
      'Town Hall, Khan Market',
    ],
    outdoors: [
      'Lodhi Art District walk',
      'Sunder Nursery',
      'India Habitat Centre gardens',
      'Sanjay Van (easy trail)',
    ],
    dessert: [
      'The Big Chill Cakery, Khan Market',
      "Wenger's, Connaught Place",
      "Elma's Bakery, Haus Khas",
      'The Pastry Palace, Saket',
    ],
    explore: [
      'Khan Market stroll',
      'Dilli Haat, INA',
      'National Gallery of Modern Art',
      "Humayun's Tomb (evening)",
    ],
  },

  bouquetTitle: 'Arrange your bouquet',
  bouquetHint: 'Drag stems into the vase. They fan out like a real arrangement.',
  bouquetVaseLabel: "Rhea's flower pot 🪴",
  bouquetMilestoneCount: 5,
  bouquetMilestoneMsg: 'So cute already. Keep going if you want 🪷',

  insideJoke: '[INSERT INSIDE JOKE HERE]',

  reasons: [
    'You make ordinary days feel like something worth remembering.',
    'Your laugh is genuinely one of my favourite sounds.',
    "Every plan is better when you're in it.",
    'You put up with my jokes and still smile.',
    'I just really like being around you.',
  ],

  hiddenNote: "Psst… you're kind of incredible. Just saying. ✨",
  hiddenNoteSecond: 'Also: thank you for being here. Really.',

  heartsTarget: 12,

  memoryPairs: [
    { emoji: '☕', label: 'that walk' },
    { emoji: '🌙', label: 'late talk' },
    { emoji: '📷', label: 'polaroid' },
    { emoji: '🔑', label: 'your laugh' },
    { emoji: '⭐', label: 'little win' },
    { emoji: '💖', label: 'us' },
  ],

  usCheckPairs: [
    {
      a: 'Sunrise walk',
      b: 'Midnight drive',
      myPick: 'Midnight drive',
      myReveal: 'I would have said… midnight drive, windows down.',
    },
    {
      a: 'Cook together',
      b: 'Order in and talk for hours',
      myPick: 'Order in and talk for hours',
      myReveal: 'I would have said… order in. The talking is the point.',
    },
    {
      a: 'Spontaneous trip',
      b: 'Planned perfect day',
      myPick: 'Planned perfect day',
      myReveal: 'I would have said… planned day with one spontaneous detour.',
    },
    {
      a: 'Quiet bookstore',
      b: 'Loud concert',
      myPick: 'Quiet bookstore',
      myReveal: 'I would have said… bookstore — then coffee next door.',
    },
    {
      a: 'Rainy day indoors',
      b: 'Sunny picnic',
      myPick: 'Rainy day indoors',
      myReveal: 'I would have said… rainy day. Blanket. You.',
    },
    {
      a: 'One long deep talk',
      b: 'Ten silly voice notes',
      myPick: 'One long deep talk',
      myReveal: 'I would have said… both, but if I pick: deep talk.',
    },
  ],

  thisOrThatQuestions: [
    { a: 'Chai ☕', b: 'Coffee ☕' },
    { a: 'Beach 🏖️', b: 'Mountains ⛰️' },
    { a: 'Movie night 🎬', b: 'Game night 🎮' },
    { a: 'Sunrise 🌅', b: 'Sunset 🌇' },
  ],

  anticipationCaptions: [
    'wrapping the present…',
    'adding extra sparkle…',
    'double-checking everything…',
    'almost ready…',
    'okay here we go…',
  ],

  closingLine: "Can't wait. 🥳",

  smileCounterLabel: 'smile?',
  smileTiers: [
    { min: 0, emoji: '😊', label: 'smile?', glow: 0 },
    { min: 1, emoji: '🙂', label: 'one smile!', glow: 1 },
    { min: 3, emoji: '😄', label: 'keep going', glow: 1 },
    { min: 5, emoji: '🥰', label: 'so cute', glow: 2 },
    { min: 10, emoji: '😍', label: 'stop it', glow: 2 },
    { min: 15, emoji: '💕', label: 'melting', glow: 3 },
    { min: 25, emoji: '🌸', label: 'flower power', glow: 3 },
    { min: 40, emoji: '✨', label: 'radiant', glow: 4 },
    { min: 60, emoji: '💖', label: 'legendary smiles', glow: 4 },
  ],
  smileHoverMessages: [
    'that smile counts ✨',
    'see, I knew it',
    'okay that was cute',
    'yay, +1',
    'keep that one',
    'noted and appreciated',
    'my favourite sound',
    'you have a nice smile',
    'worth the wait',
    'okay fine, me too',
  ],
  smileHoverMessagesHigh: [
    'okay you are adorable',
    'my heart cannot',
    'stop being cute',
    'this is illegal levels of cute',
    'certified smile gremlin',
    'I am keeping every single one',
    'you win. always.',
    'the universe approves',
    'peak cuteness achieved',
    'okay I am smiling too now',
  ],

  easterEggMessage: 'You found the secret spot. The universe says: good choice. ✨',

  hubTitle: 'Our World',
  hubSubtitle: 'Come back anytime, this little corner is always here for us.',
  hubEnterCta: 'Enter Our World →',
  hubReturnGreetings: [
    'Hey you. Welcome back 💛',
    'Look who came to visit 🌸',
    'I was hoping you would stop by.',
    "Hi love, I'm always happy to see you here.",
    'Back again? I like that.',
    "This corner missed you a little.",
    "Hey, take your time, it's all yours.",
  ],
  hubApps: [
    {
      id: 'memory-lane',
      emoji: '🌸',
      name: 'Memory Lane',
      description: 'Moments and things I love about you',
    },
    {
      id: 'ask-me-anything',
      emoji: '💭',
      name: 'Deep Dive',
      description: 'Answer first — then see what I said',
    },
    {
      id: 'our-playlist',
      emoji: '🎵',
      name: 'Our Playlist',
      description: 'Songs, add your own, listen together',
    },
    {
      id: 'movie-nights',
      emoji: '🎬',
      name: 'Movie Nights',
      description: 'Our watchlist, rate separately, see if we match',
    },
    {
      id: 'dear-diary',
      emoji: '📔',
      name: 'Dear Diary',
      description: 'Jot down your thoughts, day by day',
    },
  ],

  memoryLaneTabMoments: 'Moments',
  memoryLaneTabLikes: 'Why I love you',
  memoryLaneEmptyMoments: 'No moments added yet, check back soon 🌷',
  memoryLaneEmptyLikes: 'Nothing here yet, more coming soon 💛',

  askMeTitle: 'Deep Dive',
  askMeSubtitle: 'One question at a time. Answer first — then I reveal mine.',
  askMeEmpty: 'No questions yet, check back soon.',
  askMePlaceholder: 'Type your answer privately…',
  askMeSubmit: 'Lock in & reveal',
  askMeYourAnswerLabel: 'You said',
  askMeMyAnswerLabel: 'I said',
  askMeRevealHold: 'Holding your answer… revealing mine…',
  askMeNext: 'Next question →',
  askMeAllDone: 'You answered everything. Our scrapbook is waiting.',
  askMeScrapbookLabel: 'Our answers',
  askMeScrapbookEmpty: 'Answer a question first — it will land here.',
  askMeSparkLoading: 'Finding a spark…',
  askMeSparkFallback: 'Interesting — ask what made that feel true.',

  playlistTitle: 'Our Playlist',
  playlistSubtitle: 'Search, add a note, and press play together.',
  playlistSearchPlaceholder: 'Search a song or artist…',
  playlistEmpty: 'No songs yet — search above to add the first one.',
  playlistSetupHint: 'Need Spotify search? Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to server/.env',
  playlistFilterEmpty: 'Nothing in this filter yet.',
  playlistNotePlaceholder: 'This reminds me of…',
  playlistAddWithNote: 'Add song',
  playlistSkipNote: 'Skip note',
  playlistAddedByYou: 'from you',
  playlistAddedByHer: 'from her',
  playlistBulkTitle: 'Bring over liked songs',
  playlistBulkHint: 'Paste song titles, one per line.',
  playlistBulkPlaceholder: 'Song title 1\nSong title 2\nSong title 3',
  playlistBulkSubmit: 'Import songs',

  movieTitle: 'Movie Nights',
  movieSubtitle: 'Poster board, dual ratings, see if we match.',
  movieEmpty: 'No movies yet — add the first one below.',
  movieAddPlaceholder: 'Movie title…',
  movieAddNotePlaceholder: 'Optional note…',
  movieAddSubmit: 'Log film',
  movieMatchMsg: 'We matched',
  movieYourRating: 'You',
  movieHisRating: 'Him',
  movieAffinity: '{matches} matches of {total} shared ratings · {pct}% affinity',

  diaryTitle: 'Dear Diary',
  diarySubtitle: 'Write down whatever is on your mind, day by day.',
  diaryPlaceholder: 'Dear diary…',
  diarySubmit: 'Save entry',
  diaryEmpty: 'No entries yet, your first thought is one text box away 📝',
  diaryMoods: ['😊', '😌', '😢', '😍', '😤', '😴', '🥰', '😔'],
  diaryAiPromptLoading: 'Finding a gentle prompt…',
  diaryAiPromptFallback: 'What made you smile today, even a little?',

  thisOrThatReactionLoading: '…',
};
