import { createCatchHeartsGame } from './CatchHearts.js';
import { createThisOrThatGame } from './ThisOrThat.js';
import { createScratchNoteGame } from './ScratchNote.js';
import { createMemoryMatchGame } from './MemoryMatch.js';
import { createClickTargetGame } from './ClickTarget.js';

/** @typedef {import('../analytics/Analytics.js').Analytics} Analytics */

/**
 * Add or reorder games here — hub UI updates automatically.
 * @type {Array<{ id: string, emoji: string, name: string, factory: (container: HTMLElement, ctx: { analytics: Analytics, onComplete: (msg: string) => void }) => { start: () => void, destroy: () => void } }>}
 */
export const GAME_REGISTRY = [
  { id: 'hearts', emoji: '💖', name: 'Catch the Hearts', factory: createCatchHeartsGame },
  { id: 'tot', emoji: '🤔', name: 'This or That', factory: createThisOrThatGame },
  { id: 'scratch', emoji: '✨', name: 'Scratch Note', factory: createScratchNoteGame },
  { id: 'memory', emoji: '🃏', name: 'Memory Match', factory: createMemoryMatchGame },
  { id: 'chase', emoji: '🎯', name: 'Click the Target', factory: createClickTargetGame },
];
