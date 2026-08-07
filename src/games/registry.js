import { createCaseOfUsGame } from './CaseOfUs.js';
import { createCatchHeartsGame } from './CatchHearts.js';
import { createUsCheckGame } from './UsCheck.js';
import { createMemoryMatchGame } from './MemoryMatch.js';

/** @typedef {import('../analytics/Analytics.js').Analytics} Analytics */

/**
 * Add or reorder games here — hub UI updates automatically.
 * @type {Array<{ id: string, emoji: string, name: string, factory: (container: HTMLElement, ctx: { analytics: Analytics, onComplete: (msg: string) => void }) => { start: () => void, destroy: () => void } }>}
 */
export const GAME_REGISTRY = [
  { id: 'case-of-us', emoji: '🔍', name: 'The Case of Us', factory: createCaseOfUsGame },
  { id: 'hearts', emoji: '💖', name: 'Heart Rain', factory: createCatchHeartsGame },
  { id: 'us-check', emoji: '🪞', name: 'Us Check', factory: createUsCheckGame },
  { id: 'memory', emoji: '🃏', name: 'Memory of Us', factory: createMemoryMatchGame },
];
