const JOURNEY_COMPLETE_KEY = 'exploration.journeyComplete';
const GREETING_INDEX_KEY = 'exploration.hubGreetingIndex';

export function hasCompletedJourney() {
  try {
    return localStorage.getItem(JOURNEY_COMPLETE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markJourneyComplete() {
  try {
    localStorage.setItem(JOURNEY_COMPLETE_KEY, '1');
  } catch {
    // localStorage unavailable (private mode etc.) — safe to ignore
  }
}

/** Rotates through a list of greetings, one new line per visit, no repeats until it cycles. */
export function nextGreeting(greetings) {
  if (!Array.isArray(greetings) || !greetings.length) return '';

  let index = 0;
  try {
    index = Number(localStorage.getItem(GREETING_INDEX_KEY) || '0') || 0;
  } catch {
    index = 0;
  }

  const greeting = greetings[index % greetings.length];

  try {
    localStorage.setItem(GREETING_INDEX_KEY, String((index + 1) % greetings.length));
  } catch {
    // ignore
  }

  return greeting;
}
