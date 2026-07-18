/** Human-readable labels for event types shown in the timeline */
export const EVENT_LABELS = {
  session_start: 'Session started',
  screen_enter: 'Entered screen',
  screen_exit: 'Left screen',
  auto_advance: 'Auto-advanced',
  manual_continue: 'Continued manually',
  nav_back: 'Went back a step',
  envelope_open: 'Opened envelope',
  scratch_progress: 'Scratching card',
  scratch_complete: 'Card revealed',
  all_reasons_scratched: 'All reasons revealed',
  game_open: 'Opened game',
  game_complete: 'Finished game',
  game_back: 'Back to game hub',
  game_hub_continue: 'Left game hub',
  this_or_that_choice: 'This or That pick',
  heart_caught: 'Caught a heart',
  memory_match: 'Memory match',
  chase_dodge: 'Dodge!',
  anticipation_complete: 'Anticipation bar done',
  big_ask_yes: 'Said YES 💕',
  big_ask_no_give_up: 'No button gave up',
  big_ask_no_dodge: 'Chased the No button',
  date_confirm: 'Confirmed date',
  smile_press: 'Smile counter tap',
  interaction_click: 'Click',
  interaction_pointer: 'Tap / press',
  interaction_move: 'Mouse moved',
  date_planner_step: 'Planner step',
  bouquet_flower_placed: 'Bouquet flower placed',
  bouquet_complete: 'Bouquet complete',
  audio_toggle: 'Toggled music',
  easter_egg_click: 'Secret heart tap',
  easter_egg_open: 'Easter egg found',
  visibility_hidden: 'Tab hidden',
  visibility_visible: 'Tab visible',
};

export const SCREEN_LABELS = {
  loading: 'Loading',
  'scroll-story': 'Scroll Story',
  greeting: 'Greeting',
  envelope: 'Envelope',
  reasons: 'Reasons',
  games: 'Mini Games',
  anticipation: 'Anticipation',
  'pre-ask': 'Pre-Ask',
  'big-ask': 'The Big Ask',
  'date-planner': 'Date Planner',
  bouquet: 'Bouquet',
  celebration: 'Celebration',
};

/** @param {string} type */
export function eventLabel(type) {
  return EVENT_LABELS[type] ?? type.replace(/_/g, ' ');
}

/** @param {string | null} id */
export function screenLabel(id) {
  if (!id) return 'Not set';
  return SCREEN_LABELS[id] ?? id;
}

/** @param {string} type */
export function eventTone(type) {
  if (type === 'big_ask_yes' || type === 'date_confirm') return 'highlight';
  if (type.startsWith('interaction_')) return 'interaction';
  if (type.startsWith('game_') || type === 'heart_caught') return 'game';
  if (type.startsWith('screen_')) return 'nav';
  if (type.includes('scratch')) return 'scratch';
  return 'default';
}
