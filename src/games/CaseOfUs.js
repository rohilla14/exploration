import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { Confetti } from '../core/Confetti.js';
import { playChime, playPop } from '../utils/sfx.js';

const CATS = /** @type {const} */ (['where', 'when', 'what']);
const CAT_LABEL = { where: 'Where', when: 'When', what: 'What' };
const MARK = { blank: 0, yes: 1, no: 2 };

/**
 * @typedef {{ id: string, label: string }} Option
 * @typedef {{ where: Option[], when: Option[], what: Option[] }} Categories
 * @typedef {{ where: string, when: string, what: string }} Solution
 * @typedef {{ type: 'not', cat: string, value: string, text: string }
 *   | { type: 'or', cat: string, a: string, b: string, text: string }
 *   | { type: 'if', catA: string, valA: string, catB: string, valB: string, text: string }} Clue
 */

function pickN(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function buildCategories() {
  const moods = CONFIG.dateMoods || [];
  const placesMap = CONFIG.datePlaces || {};
  const allPlaces = Object.values(placesMap).flat().filter(Boolean);
  const times = (CONFIG.plannerTimePresets || []).map((t) => ({
    id: `when-${t.label.toLowerCase()}`,
    label: `${t.label} · ${t.hour}:${t.minute} ${t.ampm}`,
  }));
  // Need exactly 4 when-slots; pad from planner vocabulary if presets < 4
  if (times.length < 4) {
    const pads = [
      { id: 'when-morning', label: 'Morning · 11:00 AM' },
      { id: 'when-brunch', label: 'Brunch · 12:30 PM' },
    ];
    for (const p of pads) {
      if (times.length >= 4) break;
      if (!times.some((t) => t.id === p.id)) times.push(p);
    }
  }

  const what = pickN(
    moods.map((m) => ({ id: `what-${m.id}`, label: `${m.emoji} ${m.label}` })),
    4
  );
  const where = pickN(
    allPlaces.map((p, i) => ({ id: `where-${i}-${p.slice(0, 12)}`, label: p })),
    4
  ).map((o, i) => ({ ...o, id: `where-${i}` }));
  const when = pickN(times, 4);

  return { where, when, what };
}

function labelOf(cats, cat, id) {
  return cats[cat].find((o) => o.id === id)?.label ?? id;
}

function randomSolution(cats) {
  return {
    where: cats.where[Math.floor(Math.random() * cats.where.length)].id,
    when: cats.when[Math.floor(Math.random() * cats.when.length)].id,
    what: cats.what[Math.floor(Math.random() * cats.what.length)].id,
  };
}

/** @param {Clue} clue @param {Solution} a */
function clueHolds(clue, a) {
  if (clue.type === 'not') return a[clue.cat] !== clue.value;
  if (clue.type === 'or') return a[clue.cat] === clue.a || a[clue.cat] === clue.b;
  if (clue.type === 'if') {
    if (a[clue.catA] === clue.valA) return a[clue.catB] === clue.valB;
    return true;
  }
  return false;
}

/** Enumerate all assignments consistent with the clue set. */
export function solve(cats, clues) {
  /** @type {Solution[]} */
  const solutions = [];
  for (const w of cats.where) {
    for (const t of cats.when) {
      for (const h of cats.what) {
        const a = { where: w.id, when: t.id, what: h.id };
        if (clues.every((c) => clueHolds(c, a))) solutions.push(a);
      }
    }
  }
  return solutions;
}

/** @param {Categories} cats @param {Solution} solution */
function buildTrueCluePool(cats, solution) {
  /** @type {Clue[]} */
  const pool = [];

  for (const cat of CATS) {
    for (const opt of cats[cat]) {
      if (opt.id === solution[cat]) continue;
      pool.push({
        type: 'not',
        cat,
        value: opt.id,
        text: `It isn't ${opt.label}.`,
      });
    }
  }

  for (const cat of CATS) {
    const correct = solution[cat];
    const wrongs = cats[cat].filter((o) => o.id !== correct).map((o) => o.id);
    for (const w of wrongs) {
      pool.push({
        type: 'or',
        cat,
        a: correct,
        b: w,
        text: `It's either ${labelOf(cats, cat, correct)} or ${labelOf(cats, cat, w)}.`,
      });
    }
  }

  for (const catA of CATS) {
    for (const catB of CATS) {
      if (catA === catB) continue;
      // Useful conditional: solution antecedent → solution consequent
      pool.push({
        type: 'if',
        catA,
        valA: solution[catA],
        catB,
        valB: solution[catB],
        text: `If it's ${labelOf(cats, catA, solution[catA])}, then it's ${labelOf(cats, catB, solution[catB])}.`,
      });
      // Vacuous conditionals: wrong antecedent → any consequent (true)
      for (const wrong of cats[catA]) {
        if (wrong.id === solution[catA]) continue;
        for (const cons of cats[catB]) {
          pool.push({
            type: 'if',
            catA,
            valA: wrong.id,
            catB,
            valB: cons.id,
            text: `If it's ${wrong.label}, then it's ${cons.label}.`,
          });
        }
      }
    }
  }

  return pool;
}

function clueKey(c) {
  if (c.type === 'not') return `not:${c.cat}:${c.value}`;
  if (c.type === 'or') {
    const [a, b] = [c.a, c.b].sort();
    return `or:${c.cat}:${a}:${b}`;
  }
  return `if:${c.catA}:${c.valA}:${c.catB}:${c.valB}`;
}

/**
 * Generate a puzzle that is uniquely solvable with 5–7 clues.
 * @returns {{ categories: Categories, solution: Solution, clues: Clue[] }}
 */
export function generatePuzzle(maxAttempts = 80) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const categories = buildCategories();
    const solution = randomSolution(categories);
    const pool = buildTrueCluePool(categories, solution);
    // Prefer informative clues: shuffle with weight toward not/or/solution-ifs
    const ranked = [...pool].sort(() => Math.random() - 0.5);

    /** @type {Clue[]} */
    const selected = [];
    const seen = new Set();

    for (const clue of ranked) {
      const key = clueKey(clue);
      if (seen.has(key)) continue;
      // Skip vacuous ifs early while we still have room for stronger clues
      const isVacuousIf =
        clue.type === 'if' && clue.valA !== solution[clue.catA];
      if (isVacuousIf && selected.length < 3) continue;

      seen.add(key);
      selected.push(clue);
      const remaining = solve(categories, selected);
      if (remaining.length === 1) break;
      if (selected.length >= 12) break;
    }

    // Trim to 5–7 while keeping uniqueness
    let clues = selected;
    if (solve(categories, clues).length !== 1) continue;

    // Remove redundant clues from the end/middle
    let changed = true;
    while (changed && clues.length > 5) {
      changed = false;
      for (let i = clues.length - 1; i >= 0 && clues.length > 5; i--) {
        const trial = clues.filter((_, j) => j !== i);
        if (solve(categories, trial).length === 1) {
          clues = trial;
          changed = true;
        }
      }
    }

    // If fewer than 5, pad with true non-spoiling clues (still unique)
    if (clues.length < 5) {
      for (const clue of ranked) {
        if (clues.length >= 5) break;
        const key = clueKey(clue);
        if (clues.some((c) => clueKey(c) === key)) continue;
        const trial = [...clues, clue];
        if (solve(categories, trial).length === 1) clues = trial;
      }
    }

    // Cap at 7
    while (clues.length > 7) {
      let removed = false;
      for (let i = clues.length - 1; i >= 0; i--) {
        const trial = clues.filter((_, j) => j !== i);
        if (solve(categories, trial).length === 1) {
          clues = trial;
          removed = true;
          break;
        }
      }
      if (!removed) break;
    }

    const final = solve(categories, clues);
    if (
      final.length === 1 &&
      final[0].where === solution.where &&
      final[0].when === solution.when &&
      final[0].what === solution.what &&
      clues.length >= 5 &&
      clues.length <= 7
    ) {
      return { categories, solution, clues };
    }
  }

  throw new Error('Could not generate a uniquely solvable Case of Us puzzle');
}

/** @param {HTMLElement} container @param {{ analytics: import('../analytics/Analytics.js').Analytics, onComplete: (msg: string) => void }} ctx */
export function createCaseOfUsGame(container, { analytics, onComplete }) {
  const confetti = new Confetti();
  let destroyed = false;
  /** @type {ReturnType<typeof generatePuzzle> | null} */
  let puzzle = null;
  /** @type {Record<string, number>} */
  let marks = {};

  const root = document.createElement('div');
  root.className = 'case-of-us';
  container.appendChild(root);

  function markKey(cat, id) {
    return `${cat}:${id}`;
  }

  function cycleMark(cat, id) {
    const key = markKey(cat, id);
    const next = ((marks[key] ?? MARK.blank) + 1) % 3;
    marks[key] = next;
    playPop();
    analytics.track(EVENTS.INTERACTION_CLICK, {
      gameId: 'case-of-us',
      action: 'mark',
      cat,
      id,
      mark: next,
    });
    renderGridMarks();
  }

  function renderGridMarks() {
    root.querySelectorAll('.case-cell').forEach((btn) => {
      const cat = btn.dataset.cat;
      const id = btn.dataset.id;
      const mark = marks[markKey(cat, id)] ?? MARK.blank;
      btn.dataset.mark = String(mark);
      btn.setAttribute(
        'aria-label',
        mark === MARK.yes ? 'Marked yes' : mark === MARK.no ? 'Marked no' : 'Unmarked'
      );
      const glyph = btn.querySelector('.case-cell__glyph');
      if (glyph) {
        glyph.textContent = mark === MARK.yes ? '✓' : mark === MARK.no ? '✗' : '';
      }
    });
  }

  function closeAccusation() {
    root.querySelector('.case-accuse')?.remove();
  }

  function openAccusation() {
    if (!puzzle) return;
    closeAccusation();
    const { categories } = puzzle;

    const overlay = document.createElement('div');
    overlay.className = 'case-accuse';
    overlay.innerHTML = `
      <div class="case-accuse__card" role="dialog" aria-labelledby="case-accuse-title">
        <p class="case-accuse__eyebrow">The accusation</p>
        <h3 id="case-accuse-title" class="case-accuse__title">Name the date</h3>
        <p class="case-accuse__hint">Choose where, when, and what. No second chances on the reveal. Only on the verdict.</p>
        <label class="case-accuse__field">
          <span>Where</span>
          <select data-role="where">
            <option value="">Choose</option>
            ${categories.where.map((o) => `<option value="${o.id}">${o.label}</option>`).join('')}
          </select>
        </label>
        <label class="case-accuse__field">
          <span>When</span>
          <select data-role="when">
            <option value="">Choose</option>
            ${categories.when.map((o) => `<option value="${o.id}">${o.label}</option>`).join('')}
          </select>
        </label>
        <label class="case-accuse__field">
          <span>What</span>
          <select data-role="what">
            <option value="">Choose</option>
            ${categories.what.map((o) => `<option value="${o.id}">${o.label}</option>`).join('')}
          </select>
        </label>
        <p class="case-accuse__error" data-role="error" hidden></p>
        <div class="case-accuse__actions">
          <button type="button" class="case-accuse__cancel" data-role="cancel">Keep deducing</button>
          <button type="button" class="btn btn--primary" data-role="submit">Accuse</button>
        </div>
      </div>
    `;

    overlay.querySelector('[data-role="cancel"]')?.addEventListener('click', closeAccusation);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAccusation();
    });

    overlay.querySelector('[data-role="submit"]')?.addEventListener('click', () => {
      const where = /** @type {HTMLSelectElement} */ (overlay.querySelector('[data-role="where"]')).value;
      const when = /** @type {HTMLSelectElement} */ (overlay.querySelector('[data-role="when"]')).value;
      const what = /** @type {HTMLSelectElement} */ (overlay.querySelector('[data-role="what"]')).value;
      const error = overlay.querySelector('[data-role="error"]');

      if (!where || !when || !what) {
        if (error) {
          error.hidden = false;
          error.textContent = 'Fill in all three before you accuse.';
        }
        return;
      }

      const correct =
        where === puzzle.solution.where &&
        when === puzzle.solution.when &&
        what === puzzle.solution.what;

      analytics.track(EVENTS.INTERACTION_CLICK, {
        gameId: 'case-of-us',
        action: 'accuse',
        correct,
        accusation: { where, when, what },
      });

      if (!correct) {
        if (error) {
          error.hidden = false;
          error.textContent = 'Not quite. The case is still open, try another angle.';
        }
        return;
      }

      closeAccusation();
      revealWin();
    });

    root.appendChild(overlay);
  }

  function revealWin() {
    if (!puzzle || destroyed) return;
    const { categories, solution } = puzzle;
    playChime();
    confetti.burst(100);

    root.innerHTML = `
      <div class="case-of-us__win">
        <p class="case-of-us__eyebrow">Case closed</p>
        <h3 class="case-of-us__win-title">You cracked it.</h3>
        <ul class="case-of-us__verdict">
          <li><span>Where</span> ${labelOf(categories, 'where', solution.where)}</li>
          <li><span>When</span> ${labelOf(categories, 'when', solution.when)}</li>
          <li><span>What</span> ${labelOf(categories, 'what', solution.what)}</li>
        </ul>
      </div>
    `;

    onComplete('Case closed. You deduced the date.');
  }

  function render() {
    if (!puzzle) return;
    const { categories, clues } = puzzle;
    marks = {};

    root.innerHTML = `
      <header class="case-of-us__header">
        <p class="case-of-us__eyebrow">Case file</p>
        <h3 class="case-of-us__title">The Case of Us</h3>
        <p class="case-of-us__brief">A date is being planned. Deduce <em>where</em>, <em>when</em>, and <em>what</em> from the clues. Mark your notepad, nothing fills itself in.</p>
      </header>
      <div class="case-of-us__layout">
        <aside class="case-of-us__clues">
          <p class="case-of-us__clues-title">Clues</p>
          <ol class="case-clue-list">
            ${clues.map((c, i) => `<li class="case-clue"><span class="case-clue__n">${i + 1}</span><span class="case-clue__text">${c.text}</span></li>`).join('')}
          </ol>
        </aside>
        <div class="case-of-us__notepad">
          <p class="case-of-us__notepad-title">Notepad</p>
          <p class="case-of-us__legend"><span>✓ suspect</span><span>✗ ruled out</span></p>
          ${CATS.map(
            (cat) => `
            <section class="case-cat" data-cat="${cat}">
              <h4 class="case-cat__label">${CAT_LABEL[cat]}</h4>
              <div class="case-cat__rows">
                ${categories[cat]
                  .map(
                    (opt) => `
                  <button type="button" class="case-cell" data-cat="${cat}" data-id="${opt.id}" data-mark="0">
                    <span class="case-cell__label">${opt.label}</span>
                    <span class="case-cell__glyph" aria-hidden="true"></span>
                  </button>
                `
                  )
                  .join('')}
              </div>
            </section>
          `
          ).join('')}
        </div>
      </div>
      <button type="button" class="btn btn--primary case-of-us__accuse-btn" data-role="accuse">Make the accusation</button>
    `;

    root.querySelectorAll('.case-cell').forEach((btn) => {
      btn.addEventListener('click', () => cycleMark(btn.dataset.cat, btn.dataset.id));
    });
    root.querySelector('[data-role="accuse"]')?.addEventListener('click', openAccusation);
  }

  function start() {
    if (destroyed) return;
    puzzle = generatePuzzle();
    analytics.track(EVENTS.GAME_OPEN, {
      gameId: 'case-of-us',
      clueCount: puzzle.clues.length,
    });
    render();
  }

  function destroy() {
    destroyed = true;
    confetti.destroy();
    root.remove();
  }

  return { start, destroy };
}
