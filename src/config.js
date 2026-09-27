// ============================================================
// CUSTOMIZE HERE, swap placeholder content before sharing
// ============================================================
//
// 📷 YOUR PHOTOS (in public/assets/)
//
//   Every photo is listed once in `gallery` below (captions show in the Photos app and the
//   desktop photo frame). The named slots in `photos` pick which ones headline each screen.
//   Keep files under ~1600px on the long edge.
//
// ============================================================

export const CONFIG = {
  herName: 'Rhea',

  // false: every visit starts at the Setup Screen (use this while you are building and testing).
  // true: once she has seen the whole journey, later visits open straight on the desktop.
  // Switch it to true before you send her the link.
  returnVisitorsSkipToDesktop: false,

  loadingText: 'Psst… unwrapping something for you.',
  loadingSteps: [
    'Unpacking the good memories…',
    'Tuning our songs…',
    'Folding in small moments…',
    'Picking out flowers…',
    'Saving you a seat…',
  ],
  loadingDone: 'All set. Ready when you are.',

  loadingPhoto: '/assets/us-mirror.jpg',

  // Hub wallpaper: a photo of her only. Moving the cursor over the desktop opens a soft "lens"
  // that swaps that part of the picture for another photo, while her face stays untouched.
  hubWallpaper: {
    photo: '/assets/gate-portrait.jpg',
    // Which part of a tall photo stays visible on a wide screen (0 = top, 1 = bottom).
    posY: 0.33,
    // Where her face is, as fractions of the photo (centre + radii). The lens never covers it.
    face: { cx: 0.55, cy: 0.33, rx: 0.22, ry: 0.15 },
    // The screen is split into a 4 x 3 grid, so every photo in the gallery gets its own region.
    // Order runs left to right, top row first. fx and fy are where the faces sit in that photo
    // (0 to 1) and the lens keeps that point centred. zoom sets how close in: 1 shows the whole
    // width, 2 shows half of it. The wallpaper photo itself is the only one not repeated here.
    cols: 4,
    rows: 3,
    reveals: [
      { src: '/assets/stairs.jpg', fx: 0.62, fy: 0.2, zoom: 2.2 },
      { src: '/assets/birthday-cake.jpg', fx: 0.49, fy: 0.28, zoom: 2 },
      { src: '/assets/us-dinner.jpg', fx: 0.53, fy: 0.34, zoom: 2.4 },
      { src: '/assets/pomegranate-mirror.jpg', fx: 0.48, fy: 0.45, zoom: 2.2 },
      { src: '/assets/candid-call.jpg', fx: 0.5, fy: 0.4, zoom: 2.2 },
      { src: '/assets/mirror-lilies.jpg', fx: 0.57, fy: 0.4, zoom: 2 },
      { src: '/assets/plant-cafe.jpg', fx: 0.57, fy: 0.36, zoom: 1.7 },
      { src: '/assets/car-ride.jpg', fx: 0.36, fy: 0.45, zoom: 2.4 },
      { src: '/assets/pomegranate-pout.jpg', fx: 0.42, fy: 0.4, zoom: 2 },
      { src: '/assets/close-up.jpg', fx: 0.52, fy: 0.45, zoom: 1 },
      { src: '/assets/us-mirror.jpg', fx: 0.53, fy: 0.42, zoom: 2.3 },
      { src: '/assets/mirror-terrace.jpg', fx: 0.36, fy: 0.41, zoom: 3.4 },
    ],
    // Lens-only page after the story: her photo, nothing else, so she can explore it.
    exploreHint: 'Move your cursor around. Something is hiding in the picture.',
    enterLabel: 'Come on in →',
  },

  // Where the face is in each photo (x% y%), so any crop keeps her face in view.
  photoFocus: {
    '/assets/us-dinner.jpg': '50% 30%',
    '/assets/us-mirror.jpg': '50% 42%',
    '/assets/mirror-terrace.jpg': '50% 44%',
    '/assets/stairs.jpg': '50% 20%',
    '/assets/birthday-cake.jpg': '50% 27%',
    '/assets/gate-portrait.jpg': '55% 33%',
    '/assets/pomegranate-mirror.jpg': '50% 45%',
    '/assets/pomegranate-pout.jpg': '50% 36%',
    '/assets/plant-cafe.jpg': '50% 40%',
    '/assets/mirror-lilies.jpg': '50% 38%',
    '/assets/car-ride.jpg': '20% 40%',
    '/assets/close-up.jpg': '50% 45%',
    '/assets/candid-call.jpg': '45% 42%',
  },

  photos: {
    // Two small photos that settle in beside the greeting when the story opens.
    polaroidA: '/assets/mirror-terrace.jpg',
    polaroidB: '/assets/stairs.jpg',
    // "Some days feel ordinary…" in the scroll story: only the dinner photo of the two of you
    cinematicCycle: ['/assets/us-dinner.jpg'],
    // setup wizard side panel
    loadingCollage: [
      '/assets/close-up.jpg',
      '/assets/pomegranate-pout.jpg',
      '/assets/candid-call.jpg',
    ],
    plannerAccent: '/assets/birthday-cake.jpg',
    plannerWelcome: '/assets/birthday-cake.jpg',
    celebration: '/assets/pomegranate-mirror.jpg',
  },

  // All photos: Photos app, desktop photo frame. Edit captions freely.
  gallery: [
    { src: '/assets/us-dinner.jpg', caption: 'Us, dinner glow' },
    { src: '/assets/us-mirror.jpg', caption: 'Two of us, one mirror' },
    { src: '/assets/mirror-terrace.jpg', caption: 'That terrace' },
    { src: '/assets/stairs.jpg', caption: 'Climbing toward something good' },
    { src: '/assets/birthday-cake.jpg', caption: 'Cake first' },
    { src: '/assets/gate-portrait.jpg', caption: 'The red gate' },
    { src: '/assets/pomegranate-mirror.jpg', caption: 'Pomegranate walls' },
    { src: '/assets/pomegranate-pout.jpg', caption: 'The pout' },
    { src: '/assets/plant-cafe.jpg', caption: 'Plant café' },
    { src: '/assets/mirror-lilies.jpg', caption: 'Lilies in the mirror' },
    { src: '/assets/car-ride.jpg', caption: 'Back seat energy' },
    { src: '/assets/close-up.jpg', caption: 'Up close' },
    { src: '/assets/candid-call.jpg', caption: 'Mid sentence' },
  ],

  greetingSoftLine:
    "You make ordinary days feel like something worth remembering. Take your time here, there's more to find.",

  // Story beats. Each line gets its own framing, so the photo moves like a camera as she scrolls.
  // Only photos of the two of you belong here. focus is where the crop sits (x% y%).
  storyBeats: [
    { line: 'Some days feel ordinary', photo: '/assets/us-dinner.jpg', focus: '50% 30%' },
    {
      line: 'until someone makes them feel special.',
      photo: '/assets/us-dinner.jpg',
      focus: '64% 30%',
    },
    { line: 'I notice the small things,', photo: '/assets/us-mirror.jpg', focus: '50% 40%' },
    {
      line: 'a laugh, a look, a room feeling warmer.',
      photo: '/assets/us-mirror.jpg',
      focus: '60% 36%',
    },
    {
      line: 'So I built this, like a present you open one scroll at a time.',
      photo: '/assets/us-dinner.jpg',
      focus: '50% 26%',
    },
  ],
  cinematicFinale: 'Welcome to your present. 🎁',

  // The film strip chapter: scrolls sideways while she scrolls down.
  storyStripLabel: 'and every version of you I have kept',
  storyStripEnd: 'Keep going.',

  hubIntro:
    "Games, notes, questions, our songs, movie nights, and a diary, tap any card. When you're ready, the surprise is waiting.",
  hubFeatures: [
    {
      id: 'games',
      icon: '🎮',
      title: 'Mini games',
      description: 'Crack the case, catch hearts, match memories.',
    },
    {
      id: 'notes',
      icon: '📝',
      title: 'Things I Love',
      description: 'The list I keep adding to.',
    },
    {
      id: 'photos',
      icon: '📸',
      title: 'Photos',
      description: 'Us, collected.',
    },
    {
      id: 'horoscope',
      icon: '🔮',
      title: 'Today',
      description: 'What the day looks like, for you and for us.',
    },
    {
      id: 'questions',
      icon: '💭',
      title: 'Deep Dive',
      description: 'Answer first, then see what I said.',
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

  plannerWelcomeEyebrow: 'She said yes.',
  plannerWelcomeTitle: "I haven't stopped smiling.",
  plannerWelcomeSub: "Pick a day, a time, a plan. I'll show up for all three.",
  plannerWelcomeBtn: "Let's build the day →",
  plannerWindowTitle: 'plan our day.app',
  plannerAskDay: 'Pick a day. Any day you like.',
  plannerAskTime: 'What time suits you?',
  plannerAskVibe: 'What kind of day are we having?',
  plannerAskStops: 'Pick up to three stops. Tap to add or remove.',
  plannerCustomTimeLabel: 'Or set your own time',
  plannerNextLabel: 'Next →',
  plannerConfirmBtn: 'Lock it in',
  plannerTicketBrand: 'One day, the two of us',
  plannerTicketSeat: 'Seat: next to me',
  plannerTicketEmptyDay: 'not picked yet',
  plannerTicketEmptyTime: 'not picked yet',
  plannerTicketEmptyPlan: 'Nothing added yet. Pick a vibe, then a stop.',
  plannerStampText: 'Confirmed. I will be there.',
  plannerTimePresets: [
    { label: 'Afternoon', hour: '3', minute: '00', ampm: 'PM' },
    { label: 'Evening', hour: '7', minute: '00', ampm: 'PM' },
    { label: 'Night', hour: '9', minute: '30', ampm: 'PM' },
  ],
  plannerDateReveal: "It's really happening.",

  dateMoods: [
    {
      id: 'coffee',
      emoji: '☕',
      label: 'Coffee date',
      tagline: 'Good coffee, better conversation',
    },
    { id: 'dinner', emoji: '🍽️', label: 'Dinner out', tagline: 'Sit down and stay awhile' },
    { id: 'outdoors', emoji: '🌿', label: 'Outdoors', tagline: 'Fresh air and a slow walk' },
    {
      id: 'dessert',
      emoji: '🍰',
      label: 'Dessert run',
      tagline: 'Something sweet, no occasion needed',
    },
    {
      id: 'explore',
      emoji: '🚶',
      label: 'Explore Delhi',
      tagline: 'Pick a neighbourhood, get a little lost',
    },
  ],

  moodImages: {
    coffee: '/assets/moods/coffee.jpg',
    dinner: '/assets/moods/dinner.jpg',
    outdoors: '/assets/moods/outdoors.jpg',
    dessert: '/assets/moods/dessert.jpg',
    explore: '/assets/moods/explore.jpg',
  },

  // Stops offered for each vibe. name is what lands on the ticket, note is the little line under it.
  datePlaces: {
    coffee: [
      {
        name: 'Blue Tokai, Champa Gali',
        note: 'Tucked down an art lane. Slow mornings, good beans.',
      },
      { name: 'Diggin, Chanakyapuri', note: 'Ivy on the walls, fairy lights, tables outside.' },
      { name: 'Cafe Dori, Chhatarpur', note: 'Airy and quiet. Built for long conversations.' },
      { name: 'Mia Bella, Hauz Khas Village', note: 'Terrace table with the lake below.' },
    ],
    dinner: [
      {
        name: 'Olive Bar & Kitchen, Mehrauli',
        note: 'Whitewashed courtyard, candles, the Qutub behind you.',
      },
      { name: 'Cafe Lota, Crafts Museum', note: 'Regional food done properly, garden seating.' },
      { name: 'Town Hall, Khan Market', note: 'Easy and buzzy. Good for a first proper dinner.' },
      { name: 'Indian Accent, The Lodhi', note: 'The big one. We would have to book ahead.' },
    ],
    outdoors: [
      { name: 'Sunder Nursery', note: 'Old tombs in a garden. Go an hour before sunset.' },
      { name: 'Lodhi Garden', note: 'The classic. A long walk and no plan at all.' },
      { name: 'Garden of Five Senses, Saket', note: 'Sculptures and paths that keep turning.' },
      {
        name: 'Parthasarathy Rocks, JNU',
        note: 'Best sunset in the city and almost nobody knows.',
      },
    ],
    dessert: [
      { name: 'Big Chill Cakery, Khan Market', note: 'Order two. Share neither.' },
      { name: "Wenger's, Connaught Place", note: 'Open since 1926. Get the patties too.' },
      { name: "Elma's Bakery, Hauz Khas", note: 'Floral wallpaper and very good cake.' },
      { name: "L'Opera, Khan Market", note: 'Macarons and a quiet corner table.' },
    ],
    explore: [
      { name: 'Champa Gali, Saidulajaib', note: 'One lane, a dozen small places to duck into.' },
      { name: 'Dilli Haat, INA', note: 'Crafts from everywhere. Eat your way down the row.' },
      { name: "Humayun's Tomb at golden hour", note: 'Emptier than you expect close to closing.' },
      { name: 'Sunset Cinema Club', note: 'A film outdoors, beanbags and a blanket.' },
    ],
  },

  bouquetTitle: 'Pick her flowers',
  bouquetHint: 'Tap a stem to drop it in, or drag if you prefer.',
  bouquetVaseLabel: "Rhea's flower pot",
  bouquetMilestoneCount: 5,
  bouquetMilestoneMsg: 'Looking lovely already. Add more, or continue whenever.',
  bouquetContinueBtn: 'On to the good part →',
  bouquetSkipCta: 'Skip for now',

  // Swap this for your actual inside joke whenever you want. Shown after 5 taps on the little
  // heart (bottom left, on most screens). Kept generic for now so nothing broken shows on screen.
  insideJoke: 'you already know the one.',

  reasons: [
    "You've ruined ordinary Tuesdays for me. They all feel a little empty without you in them.",
    'Your laugh has genuinely wrecked my ability to focus mid conversation. Repeatedly.',
    "Every plan is at least 40% better just because you're the one making fun of it with me.",
    "You've heard my worst jokes on repeat and somehow still laugh. That's basically a superpower.",
    "I like being around you more than I'm willing to admit out loud. Consider this me admitting it.",
  ],

  hiddenNote: "Not to make this weird, but you're kind of incredible. That's it, that's the note.",
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
      myReveal: 'I would have said… bookstore, then coffee next door.',
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
    'double checking everything…',
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

  easterEggMessage: 'You found the secret spot. [INSERT INSIDE JOKE HERE] ✨',

  storyHandoffIntro: "There's a little world here, made just for you. Take a look around.",
  storyContinueLabel: 'Take a look around →',

  // Used by the little counter on the desktop. Set this to the day you two started.
  togetherSince: '2025-12-31',
  hubDaysLabel: 'days of us',

  hubBootLines: ['Waking up Our World…', 'Loading the good parts…', 'Ready.'],
  hubMenuTitle: 'Our World',
  hubMenuShuffle: 'Shuffle the wallpaper',
  hubMenuTidy: 'Tidy the icons',
  hubMenuAbout: 'About us',
  hubAboutText: 'Built by hand, one evening at a time, for you.',

  hubTitle: 'Our World',
  hubSubtitle: 'Come back anytime, this little corner is always here for us.',
  hubEnterCta: 'Enter Our World →',
  hubReturnGreetings: [
    'Hey you. Welcome back 💛',
    'Look who came to visit 🌸',
    'I was hoping you would stop by.',
    "Hi love, I'm always happy to see you here.",
    'Back again? I like that.',
    'This corner missed you a little.',
    "Hey, take your time, it's all yours.",
  ],
  hubApps: [
    // navigateTo (not a windowed app) sends her through the whole ask-and-plan flow: the
    // question, then the planner, then flowers, then the celebration, back here when it is
    // done. It must match a value in SCREENS (src/constants/screens.js).
    {
      id: 'date-surprise',
      emoji: '🎟️',
      name: 'in case you wanna go out with me',
      description: 'no pressure, open it whenever',
      navigateTo: 'big-ask',
    },
    {
      id: 'games',
      emoji: '🎮',
      name: 'Mini games',
      description: 'Crack the case, catch hearts, match memories',
    },
    {
      id: 'memory-lane',
      emoji: '🌸',
      name: 'Memory Lane',
      description: 'Moments and things I love about you',
    },
    {
      id: 'photos',
      emoji: '📸',
      name: 'Photos',
      description: 'Us, collected.',
    },
    {
      id: 'horoscope',
      emoji: '🔮',
      name: 'Today',
      description: 'What the day looks like, for you and for us.',
    },
    {
      id: 'ask-me-anything',
      emoji: '💭',
      name: 'Deep Dive',
      description: 'Answer first, then see what I said',
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
    {
      id: 'letters',
      emoji: '✉️',
      name: 'Letters',
      description: 'Things I wanted to say properly',
    },
    {
      id: 'conversations',
      emoji: '💬',
      name: 'Conversations',
      description: 'Two small chats worth keeping',
    },
    {
      id: 'why-i-made-this',
      emoji: '💌',
      name: 'Why I Made This',
      description: 'The real reason this exists',
    },
  ],

  memoryLaneTabMoments: 'Moments',
  memoryLaneTabLikes: 'Why I love you',
  memoryLaneEmptyMoments: 'No moments added yet, check back soon 🌷',
  memoryLaneEmptyLikes: 'Nothing here yet, more coming soon 💛',

  askMeTitle: 'Deep Dive',
  askMeSubtitle: 'One question at a time. Answer first, then I reveal mine.',
  askMeEmpty: 'No questions yet, check back soon.',
  askMePlaceholder: 'Type your answer privately…',
  askMeSubmit: 'Lock in & reveal',
  askMeYourAnswerLabel: 'You said',
  askMeMyAnswerLabel: 'I said',
  askMeRevealHold: 'Holding your answer… revealing mine…',
  askMeNext: 'Next question →',
  askMeAllDone: 'You answered everything. Our scrapbook is waiting.',
  askMeScrapbookLabel: 'Our answers',
  askMeScrapbookEmpty: 'Answer a question first, it will land here.',
  askMeSparkLoading: 'Finding a spark…',
  askMeSparkFallback: 'Interesting, ask what made that feel true.',

  playlistTitle: 'Our Playlist',
  playlistSubtitle: 'Search, add a note, and press play together.',
  playlistSearchPlaceholder: 'Search a song or artist…',
  playlistShuffle: '🎲 Shuffle ours',
  playlistYoutubePlaceholder: 'YouTube link (optional, so it plays in full)',
  playlistNoPlayer: 'No player linked yet. Add a YouTube link to hear this one.',
  playlistEmpty: 'No songs yet, search above to add the first one.',
  playlistSetupHint:
    'Need Spotify search? Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to server/.env',
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
  movieSpinBtn: '🎬 Pick tonight for us',
  movieSpinPrefix: 'Tonight it is',
  movieEmpty: 'No movies yet, search above or add one below.',
  movieSearchPlaceholder: 'Search a movie…',
  movieAddPlaceholder: 'Or type a title manually…',
  movieAddNotePlaceholder: 'Optional note…',
  movieAddSubmit: 'Log film',
  movieMatchMsg: 'We matched',
  movieYourRating: 'You',
  movieHisRating: 'Him',
  movieAffinity: '{matches} matches of {total} shared ratings · {pct}% affinity',
  movieSetupHint:
    'Need movie search? Add TMDB_API_KEY to server/.env (free at themoviedb.org/settings/api).',

  diaryTitle: 'Dear Diary',
  diarySubtitle: 'Write down whatever is on your mind, day by day.',
  diaryPlaceholder: 'Dear diary…',
  diarySubmit: 'Save entry',
  diaryEmpty: 'No entries yet, your first thought is one text box away 📝',
  diaryMoods: ['😊', '😌', '😢', '😍', '😤', '😴', '🥰', '😔'],
  diaryAiPromptLoading: 'Finding a gentle prompt…',
  diaryAiPromptFallback: 'What made you smile today, even a little?',

  thisOrThatReactionLoading: '…',

  whyIMadeThisText: [
    'I made this because I realized I was always around but never really there.',
    'I was so focused on what I wanted that I never stopped to understand what mattered to you, or even to me.',
    "You used to ask me questions about myself, what I feel, what I want, and I'd go blank. Not because I didn't care. But because I'd never stopped to think about any of it.",
    "The time we didn't talk is when it hit me. I missed this. Not just talking to you, but what talking to you does to me. You're the only person who made me want to actually figure myself out.",
    'This is me showing up with answers. And with effort. Finally.',
  ],
  whyIMadeThisPhoto: '/assets/car-ride.jpg',
};
