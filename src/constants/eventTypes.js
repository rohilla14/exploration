/** @readonly — single source of truth for analytics event names */
export const EVENTS = Object.freeze({
  SESSION_START: 'session_start',
  SCREEN_ENTER: 'screen_enter',
  SCREEN_EXIT: 'screen_exit',
  AUTO_ADVANCE: 'auto_advance',
  MANUAL_CONTINUE: 'manual_continue',
  NAV_BACK: 'nav_back',

  ENVELOPE_OPEN: 'envelope_open',
  SCRATCH_PROGRESS: 'scratch_progress',
  SCRATCH_COMPLETE: 'scratch_complete',
  ALL_REASONS_SCRATCHED: 'all_reasons_scratched',

  GAME_OPEN: 'game_open',
  GAME_COMPLETE: 'game_complete',
  GAME_BACK: 'game_back',
  GAME_HUB_CONTINUE: 'game_hub_continue',

  THIS_OR_THAT_CHOICE: 'this_or_that_choice',
  HEART_CAUGHT: 'heart_caught',
  MEMORY_MATCH: 'memory_match',
  CHASE_DODGE: 'chase_dodge',

  ANTICIPATION_COMPLETE: 'anticipation_complete',
  BIG_ASK_YES: 'big_ask_yes',
  BIG_ASK_NO_GIVE_UP: 'big_ask_no_give_up',
  BIG_ASK_NO_DODGE: 'big_ask_no_dodge',

  DATE_CONFIRM: 'date_confirm',
  DATE_PLANNER_STEP: 'date_planner_step',
  BOUQUET_FLOWER_PLACED: 'bouquet_flower_placed',
  BOUQUET_COMPLETE: 'bouquet_complete',
  SMILE_PRESS: 'smile_press',
  INTERACTION_CLICK: 'interaction_click',
  INTERACTION_POINTER: 'interaction_pointer',
  INTERACTION_MOVE: 'interaction_move',
  AUDIO_TOGGLE: 'audio_toggle',
  EASTER_EGG_CLICK: 'easter_egg_click',
  EASTER_EGG_OPEN: 'easter_egg_open',

  CLICK: 'click',
  VISIBILITY_HIDDEN: 'visibility_hidden',
  VISIBILITY_VISIBLE: 'visibility_visible',
});
