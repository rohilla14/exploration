import { createGamesApp } from './apps/Games.js';
import { createLettersApp } from './apps/Letters.js';
import { createConversationsApp } from './apps/Conversations.js';
import { createMemoryLaneApp } from './apps/MemoryLane.js';
import { createAskMeAnythingApp } from './apps/AskMeAnything.js';
import { createOurPlaylistApp } from './apps/OurPlaylist.js';
import { createMovieNightsApp } from './apps/MovieNights.js';
import { createDearDiaryApp } from './apps/DearDiary.js';
import { createWhyIMadeThisApp } from './apps/WhyIMadeThis.js';
import { createPhotoWallApp } from './apps/PhotoWall.js';
import { createHoroscopeApp } from './apps/Horoscope.js';

/** @typedef {import('../analytics/Analytics.js').Analytics} Analytics */

/**
 * Add or reorder mini-apps here — hub UI updates automatically.
 * @type {Array<{ id: string, emoji: string, name: string, description: string, factory: (container: HTMLElement, ctx: { analytics: Analytics }) => { start: () => void, destroy: () => void } }>}
 */
export const HUB_REGISTRY = [
  { id: 'games', factory: createGamesApp },
  { id: 'memory-lane', factory: createMemoryLaneApp },
  { id: 'photos', factory: createPhotoWallApp },
  { id: 'horoscope', factory: createHoroscopeApp },
  { id: 'ask-me-anything', factory: createAskMeAnythingApp },
  { id: 'our-playlist', factory: createOurPlaylistApp },
  { id: 'movie-nights', factory: createMovieNightsApp },
  { id: 'dear-diary', factory: createDearDiaryApp },
  { id: 'letters', factory: createLettersApp },
  { id: 'conversations', factory: createConversationsApp },
  { id: 'why-i-made-this', factory: createWhyIMadeThisApp },
];
