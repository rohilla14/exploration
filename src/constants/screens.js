/** @readonly */
export const SCREENS = Object.freeze({
  LOADING: 'loading',
  GREETING: 'greeting',
  SCROLL_STORY: 'scroll-story',
  ENVELOPE: 'envelope',
  REASONS: 'reasons',
  GAMES: 'games',
  ANTICIPATION: 'anticipation',
  PRE_ASK: 'pre-ask',
  BIG_ASK: 'big-ask',
  DATE_PLANNER: 'date-planner',
  BOUQUET: 'bouquet',
  CELEBRATION: 'celebration',
  HUB: 'hub',
});

/** Registration order — add/remove/reorder screens here only. */
export const SCREEN_ORDER = Object.freeze([
  SCREENS.LOADING,
  SCREENS.SCROLL_STORY,
  SCREENS.BIG_ASK,
  SCREENS.DATE_PLANNER,
  SCREENS.BOUQUET,
  SCREENS.CELEBRATION,
  SCREENS.HUB,
  SCREENS.ENVELOPE,
  SCREENS.REASONS,
  SCREENS.GAMES,
  SCREENS.ANTICIPATION,
  SCREENS.PRE_ASK,
]);

export const PROGRESS_VISIBLE_FROM = SCREENS.ENVELOPE;
