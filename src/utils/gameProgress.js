const KEY = 'exploration.gamesDone';

function readSet() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function writeSet(set) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export function markGameDone(gameId) {
  const set = readSet();
  set.add(gameId);
  writeSet(set);
  return set;
}

export function isGameDone(gameId) {
  return readSet().has(gameId);
}

export function getDoneGames() {
  return readSet();
}
