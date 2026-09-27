export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
export const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
export const MINUTES = ['00', '15', '30', '45'];
export const AMPM = ['AM', 'PM'];
export const WHEEL_ITEM_H = 40;
export const FILLABLE_SLOTS = 2;
export const ITINERARY_SLOT = 2;
export const DRAG_THRESHOLD = 8;

export function newActivityId() {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function toIsoDate(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export function formatDisplayDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDisplayTime(hour12, minute, ampm) {
  return `${hour12}:${minute} ${ampm}`;
}

export function normalizeLockIn(text) {
  return text
    .toLowerCase()
    .replace(/[''']/g, "'")
    .replace(/[^\w\s',]/g, '')
    .trim();
}

export function isLockInValid(text) {
  const n = normalizeLockIn(text).replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  return (
    n === "sure let's go" ||
    n === 'sure lets go' ||
    (n.includes('sure') && n.includes('let') && n.includes('go'))
  );
}
