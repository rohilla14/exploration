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
    "There's games, little notes, silly questions, and a surprise at the end. Explore at your own pace, it's all for you.",
  hubFeatures: [
    {
      icon: '🎮',
      title: 'Mini games',
      description: "Quick silly things to play when you're bored. More coming soon.",
    },
    {
      icon: '📝',
      title: 'Notes',
      description: 'Little things I notice about you, the good stuff.',
    },
    {
      icon: '💭',
      title: 'Questions',
      description: "Random curiosities I've been saving. Answer whenever.",
    },
  ],
  hubContinueLabel: 'Ready for the surprise? →',

  bigAskQuestion: 'Would you like to go out with me?',
  bigAskNoCapturedMsg: "Nice try! That button's stuck now. Yes is right there 😄",

  plannerWelcomeEyebrow: 'She said yes!',
  plannerWelcomeTitle: "I'm still smiling.",
  plannerWelcomeSub: 'Pick a day, a time, and somewhere nice in Delhi. I will be there.',
  plannerWelcomeBtn: "Let's plan our date →",
  plannerPaletteTitle: 'Build your day',
  plannerActivityPrompt: 'Drag spots onto your day. Add as many as you like.',
  plannerItineraryHint: 'Drop here · drag cards to reorder',
  plannerSlotHints: [
    'Drag a day onto the board →',
    'Spin the wheels, then hit Next →',
    'Add coffee, dinner, walks… mix and match',
    'Happy with the plan? Lock it in →',
  ],
  plannerSteps: ['Day', 'Meet at', 'Our day', 'Locked in'],
  plannerWhenChipLabel: 'When',
  plannerConfirmBtn: 'Lock it in!',
  plannerLockInTitle: 'Make it official',
  plannerLockInPrompt: 'Type "sure, let\'s go" to seal the plan',
  plannerLockInPlaceholder: "sure, let's go",
  plannerLockInError: 'Almost! Type sure, let\'s go',
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

  heartsTarget: 10,
};
