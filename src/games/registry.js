import { createCatchHeartsGame } from './CatchHearts.js';
import { createUsCheckGame } from './UsCheck.js';
import { createScratchNoteGame } from './ScratchNote.js';
import { createMemoryMatchGame } from './MemoryMatch.js';
import { createPulseGame } from './Pulse.js';

/** @typedef {import('../analytics/Analytics.js').Analytics} Analytics */

/**
 * Add or reorder games here — hub UI updates automatically.
 * @type {Array<{ id: string, emoji: string, name: string, factory: (container: HTMLElement, ctx: { analytics: Analytics, onComplete: (msg: string) => void }) => { start: () => void, destroy: () => void } }>}
 */
export const GAME_REGISTRY = [
  { id: 'hearts', emoji: '💖', name: 'Heart Rain', factory: createCatchHeartsGame },
  { id: 'us-check', emoji: '🪞', name: 'Us Check', factory: createUsCheckGame },
  { id: 'scratch', emoji: '✨', name: 'Scratch Note', factory: createScratchNoteGame },
  { id: 'memory', emoji: '🃏', name: 'Memory of Us', factory: createMemoryMatchGame },
  { id: 'pulse', emoji: '💓', name: 'Pulse', factory: createPulseGame },
];
