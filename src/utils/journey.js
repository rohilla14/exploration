const JOURNEY_COMPLETE_KEY = 'exploration.journeyComplete';
const GREETING_INDEX_KEY = 'exploration.hubGreetingIndex';
const HUB_VISIT_PREFIX = 'exploration.hubVisit.';

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

  let index;
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

export function getHubAppLastVisit(appId) {
  try {
    return Number(localStorage.getItem(HUB_VISIT_PREFIX + appId) || '0') || 0;
  } catch {
    return 0;
  }
}

export function markHubAppVisited(appId) {
  try {
    localStorage.setItem(HUB_VISIT_PREFIX + appId, String(Date.now()));
  } catch {
    // ignore
  }
}

/** Parse SQLite datetime / ISO strings into ms. */
export function parseContentTime(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const normalized = String(value).includes('T')
    ? String(value)
    : `${String(value).replace(' ', 'T')}Z`;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : 0;
}

export function hasNewerContent(timestamps, lastVisitMs) {
  // No prior visit → no "new" badge (first look isn't treated as unread).
  if (!lastVisitMs) return false;
  return (timestamps || []).some((t) => parseContentTime(t) > lastVisitMs);
}
