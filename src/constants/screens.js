/** @readonly */
export const SCREENS = Object.freeze({
  LOADING: 'loading',
  SCROLL_STORY: 'scroll-story',
  EXPLORE: 'explore',
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
  SCREENS.EXPLORE,
  SCREENS.BIG_ASK,
  SCREENS.DATE_PLANNER,
  SCREENS.BOUQUET,
  SCREENS.CELEBRATION,
  SCREENS.HUB,
]);

export const PROGRESS_VISIBLE_FROM = SCREENS.BIG_ASK;
