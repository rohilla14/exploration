import { flowerMarkup, vaseFrontMarkup, vaseMarkup } from './bouquetFlowers.js';

/** Fan slots, denser center cluster so a few stems already look like a bouquet. */
const BOUQUET_SLOTS = [
  { id: 'center', x: 0, rot: -2, scale: 1.05, z: 5 },
  { id: 'left-1', x: -16, rot: -17, scale: 0.94, z: 6 },
  { id: 'right-1', x: 16, rot: 17, scale: 0.94, z: 6 },
  { id: 'left-2', x: -28, rot: -32, scale: 0.84, z: 4 },
  { id: 'right-2', x: 28, rot: 32, scale: 0.84, z: 4 },
  { id: 'back-l', x: -10, rot: -8, scale: 1.0, z: 2 },
  { id: 'back-r', x: 10, rot: 8, scale: 1.0, z: 2 },
  { id: 'left-3', x: -38, rot: -44, scale: 0.72, z: 7 },
  { id: 'right-3', x: 38, rot: 44, scale: 0.72, z: 7 },
  { id: 'front', x: 4, rot: 5, scale: 0.86, z: 8 },
];

/** Half the vase opening as a share of the vase width, kept a little narrower than the real gap. */
const MOUTH_HALF_WIDTH = 0.072;
const MAX_BASE_X = 38;
const JITTER_X = 2.5;
const JITTER_ROT = 2.5;
const SETTLE_MS = 380;

/** Real stems only, hue-rotated “variants” looked cheap in the tray. */
const FLOWER_TYPES = [
  { id: 'lotus', name: 'Lotus', tag: 'fav' },
  { id: 'rose', name: 'Rose' },
  { id: 'peony', name: 'Peony' },
  { id: 'tulip', name: 'Tulip' },
  { id: 'lily', name: 'Lily' },
  { id: 'daisy', name: 'Daisy' },
  { id: 'sprig', name: 'Greens' },
];

/**
 * @param {number} index
 * @param {number} clientX
 * @param {DOMRect} pileRect
 */
function pickSlot(index, clientX, pileRect) {
  const centerX = pileRect.left + pileRect.width / 2;
  const dropBias = ((clientX - centerX) / pileRect.width) * 100 * 0.1;
  const slot = BOUQUET_SLOTS[index % BOUQUET_SLOTS.length];

  return {
    ...slot,
    x: slot.x + dropBias,
    id: `${slot.id}-${index}`,
  };
}

/**
 * Self-contained arrange-flowers-into-vase component.
 * Supports drag-and-drop and tap-to-add (better on touch).
 */
export function createBouquetBuilder(options = {}) {
  const {
    title = 'Build your bouquet',
    hint = 'Tap a stem or drag it into the vase',
    milestoneCount = 5,
    milestoneMsg = "It's already beautiful. Keep going.",
    vaseLabel = '',
    continueLabel = 'These are for you →',
    skipLabel = 'Skip for now',
    onFlowerPlaced,
    onMilestone,
    onContinue,
    onSkip,
  } = options;

  const root = document.createElement('div');
  root.className = 'bb';
  root.dataset.count = '0';
  root.innerHTML = `
    <header class="bb-header">
      <p class="bb-header__eyebrow">A little something</p>
      <h2 class="bb-header__title">${title}</h2>
      <p class="bb-header__hint">${hint}</p>
    </header>
    <div class="bb-stage">
      <div class="bb-surface">
        <div class="bb-composition">
          <div class="bb-vase-stack">
            <div class="bb-arrangement" aria-hidden="true"></div>
            <div class="bb-vase-wrap">
              <div class="bb-drop-zone" aria-hidden="true"></div>
              ${vaseMarkup()}
              ${vaseFrontMarkup()}
              ${vaseLabel ? `<p class="bb-vase-label">${vaseLabel}</p>` : ''}
              <div class="bb-vase-shadow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="bb-tray">
      <div class="bb-tray__top">
        <p class="bb-tray__label">Pick a stem</p>
        <button type="button" class="bb-clear" hidden>Clear</button>
      </div>
      <div class="bb-tray__row"></div>
    </div>
    <p class="bb-milestone" hidden></p>
    <footer class="bb-footer">
      <p class="bb-footer__count" data-role="count">Empty vase. Add a flower to begin</p>
      <div class="bb-footer__actions">
        <button type="button" class="bb-skip">${skipLabel}</button>
        <button type="button" class="btn btn--primary bb-continue">${continueLabel}</button>
      </div>
    </footer>
  `;

  const dropZone = root.querySelector('.bb-drop-zone');
  const arrangement = root.querySelector('.bb-arrangement');
  const trayRow = root.querySelector('.bb-tray__row');
  const clearBtn = root.querySelector('.bb-clear');
  const milestoneEl = root.querySelector('.bb-milestone');
  const countEl = root.querySelector('[data-role="count"]');
  const continueBtn = root.querySelector('.bb-continue');
  const skipBtn = root.querySelector('.bb-skip');

  let placedCount = 0;
  let milestoneShown = false;
  let drag = null;
  /** @type {{ type: string, x: number, y: number, t: number } | null} */
  let pointerDown = null;
  /** @type {HTMLElement[]} */
  const stems = [];
  const unbind = [];
  const TAP_MS = 320;
  const TAP_SLOP = 12;
  const REMOVE_MS = 280;

  function bind(el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    unbind.push(() => el.removeEventListener(type, fn, opts));
  }

  function isInDropZone(clientX, clientY) {
    const r = dropZone.getBoundingClientRect();
    const padX = r.width * 0.15;
    const padY = r.height * 0.2;
    return (
      clientX >= r.left - padX &&
      clientX <= r.right + padX &&
      clientY >= r.top - padY &&
      clientY <= r.bottom + padY
    );
  }

  function updateChrome() {
    root.classList.toggle('bb--has-flowers', placedCount > 0);
    root.dataset.count = String(placedCount);
    clearBtn.hidden = placedCount === 0;

    if (placedCount === 0) {
      countEl.textContent = 'Empty vase. Add a flower to begin';
    } else if (placedCount === 1) {
      countEl.textContent = '1 stem in the vase';
    } else {
      countEl.textContent = `${placedCount} stems in the vase`;
    }
  }

  function createTrayFlower(type) {
    const meta = FLOWER_TYPES.find((f) => f.id === type);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bb-tray__flower';
    btn.dataset.flowerType = type;
    btn.setAttribute('aria-label', `Add ${meta?.name || type}`);
    btn.innerHTML = `
      ${flowerMarkup(type, 'bb-flower-art bb-flower-art--tray')}
      <span class="bb-tray__name">${meta?.name || type}</span>
      ${meta?.tag ? `<span class="bb-tray__tag">${meta.tag}</span>` : ''}
    `;
    bind(btn, 'pointerdown', (e) => onTrayPointerDown(e, type, btn));
    return btn;
  }

  function buildTray() {
    trayRow.innerHTML = '';
    FLOWER_TYPES.forEach((f) => trayRow.appendChild(createTrayFlower(f.id)));
  }

  function onTrayPointerDown(e, type, source) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    source.setPointerCapture(e.pointerId);
    pointerDown = { type, x: e.clientX, y: e.clientY, t: performance.now() };

    const r = source.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'bb-ghost';
    ghost.hidden = true;
    ghost.innerHTML = flowerMarkup(type, 'bb-flower-art bb-flower-art--ghost');
    ghost.style.width = `${Math.max(r.width, 72)}px`;
    document.body.appendChild(ghost);

    drag = {
      type,
      ghost,
      source,
      pointerId: e.pointerId,
      offsetX: e.clientX - r.left - r.width / 2,
      offsetY: e.clientY - r.top - r.height / 2,
      moved: false,
    };
  }

  function moveGhost(x, y) {
    if (!drag?.ghost) return;
    drag.ghost.hidden = false;
    drag.ghost.style.left = `${x - drag.offsetX}px`;
    drag.ghost.style.top = `${y - drag.offsetY}px`;
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;

    const dx = e.clientX - (pointerDown?.x ?? e.clientX);
    const dy = e.clientY - (pointerDown?.y ?? e.clientY);
    if (!drag.moved && Math.hypot(dx, dy) > TAP_SLOP) {
      drag.moved = true;
      drag.source.classList.add('bb-tray__flower--dragging');
      document.body.classList.add('bb-dragging');
      moveGhost(e.clientX, e.clientY);
    }

    if (!drag.moved) return;

    moveGhost(e.clientX, e.clientY);
    const over = isInDropZone(e.clientX, e.clientY);
    dropZone.classList.toggle('bb-drop-zone--active', over);
    root.classList.toggle('bb--drop-hover', over);
  }

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;

    const { type, ghost, source, moved } = drag;
    const elapsed = performance.now() - (pointerDown?.t ?? 0);
    const isTap = !moved && elapsed <= TAP_MS;

    try {
      source.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    source.classList.remove('bb-tray__flower--dragging');
    dropZone.classList.remove('bb-drop-zone--active');
    root.classList.remove('bb--drop-hover');
    document.body.classList.remove('bb-dragging');

    if (isTap) {
      ghost.remove();
      placeFlower(type);
    } else if (moved && isInDropZone(e.clientX, e.clientY)) {
      ghost.remove();
      placeFlower(type, e.clientX);
    } else if (moved) {
      returnGhostToTray();
    } else {
      ghost.remove();
    }

    drag = null;
    pointerDown = null;
  }

  function returnGhostToTray() {
    if (!drag) return;
    const { ghost, source } = drag;
    const trayRect = source.getBoundingClientRect();
    const width = parseFloat(ghost.style.width) || 72;
    ghost.style.transition = `left ${SETTLE_MS}ms var(--bb-ease-out), top ${SETTLE_MS}ms var(--bb-ease-out), opacity ${SETTLE_MS}ms ease`;
    ghost.style.left = `${trayRect.left + trayRect.width / 2 - width / 2}px`;
    ghost.style.top = `${trayRect.top}px`;
    ghost.style.opacity = '0';
    window.setTimeout(() => ghost.remove(), SETTLE_MS);
  }

  function updateBouquetScale(count) {
    // Keep blooms readable, only a gentle tuck as the vase fills.
    const bloom = count <= 1 ? 1 : Math.max(0.82, 1 - (count - 1) * 0.028);
    const spread = count <= 1 ? 1 : Math.max(0.78, 1 - (count - 1) * 0.022);
    root.style.setProperty('--bb-bloom-scale', String(bloom));
    root.style.setProperty('--bb-spread', String(spread));

    // The vase opening is about 19% of the vase width: keep every stem base inside it.
    const vaseW = (arrangement.clientWidth || 1) / 1.2;
    const mouthHalf = vaseW * MOUTH_HALF_WIDTH;
    arrangement.querySelectorAll('.bb-stem').forEach((stem) => {
      const baseX = Number(stem.dataset.baseX) || 0;
      const t = Math.max(-1, Math.min(1, baseX / MAX_BASE_X));
      stem.style.setProperty('--px', `${t * mouthHalf * spread}px`);
    });
  }

  function placeFlower(type, clientX) {
    const index = placedCount;
    placedCount += 1;
    const pileRect = arrangement.getBoundingClientRect();
    const cx = clientX ?? pileRect.left + pileRect.width / 2;
    const slot = pickSlot(index, cx, pileRect);

    const baseX = slot.x + (Math.random() - 0.5) * JITTER_X;
    const rot = slot.rot + (Math.random() - 0.5) * JITTER_ROT;
    const scale = slot.scale + (Math.random() - 0.5) * 0.04;

    const el = document.createElement('div');
    el.className = 'bb-stem';
    el.dataset.slot = slot.id;
    el.dataset.flower = type;
    el.dataset.baseX = String(baseX);
    el.style.setProperty('--prot', `${rot}deg`);
    el.style.setProperty('--pscale', String(scale));
    el.style.setProperty('--sway-delay', `${(index % 5) * 0.35}s`);
    el.style.zIndex = String(slot.z);
    el.innerHTML = `
      ${flowerMarkup(type, 'bb-flower-art bb-flower-art--placed')}
      <button type="button" class="bb-stem__remove" aria-label="Remove flower">×</button>
    `;

    const removeBtn = el.querySelector('.bb-stem__remove');
    removeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      removeStem(el);
    });
    el.addEventListener('click', (e) => {
      if (e.target.closest('.bb-stem__remove')) return;
      removeStem(el);
    });

    arrangement.appendChild(el);
    stems.push(el);
    updateBouquetScale(placedCount);
    updateChrome();

    onFlowerPlaced?.({ flowerId: type, count: placedCount });

    if (!milestoneShown && placedCount >= milestoneCount) {
      milestoneShown = true;
      milestoneEl.textContent = milestoneMsg;
      milestoneEl.hidden = false;
      onMilestone?.({ count: placedCount });
    }
  }

  function removeStem(el) {
    if (!el?.isConnected || el.classList.contains('bb-stem--removing')) return;

    const idx = stems.indexOf(el);
    if (idx === -1) return;

    el.classList.add('bb-stem--removing');
    window.setTimeout(() => {
      const i = stems.indexOf(el);
      if (i !== -1) stems.splice(i, 1);
      el.remove();
      placedCount = stems.length;
      if (placedCount < milestoneCount) {
        milestoneShown = false;
        milestoneEl.hidden = true;
        milestoneEl.textContent = '';
      }
      updateBouquetScale(placedCount);
      updateChrome();
    }, REMOVE_MS);
  }

  function clearVase() {
    placedCount = 0;
    milestoneShown = false;
    stems.length = 0;
    arrangement.innerHTML = '';
    milestoneEl.hidden = true;
    milestoneEl.textContent = '';
    updateBouquetScale(0);
    updateChrome();
  }

  bind(document, 'pointermove', onPointerMove);
  bind(document, 'pointerup', endDrag);
  bind(document, 'pointercancel', endDrag);
  bind(clearBtn, 'click', clearVase);
  bind(continueBtn, 'click', () => {
    onContinue?.({ count: placedCount });
  });
  bind(skipBtn, 'click', () => onSkip?.({ count: placedCount }));
  buildTray();
  updateBouquetScale(0);
  updateChrome();

  const resizeObs = new ResizeObserver(() => {
    if (placedCount > 0) updateBouquetScale(placedCount);
  });
  resizeObs.observe(arrangement);
  unbind.push(() => resizeObs.disconnect());

  return {
    element: root,
    reset() {
      drag?.ghost?.remove();
      drag = null;
      pointerDown = null;
      document.body.classList.remove('bb-dragging');
      clearVase();
      buildTray();
    },
    destroy() {
      drag?.ghost?.remove();
      drag = null;
      pointerDown = null;
      unbind.forEach((fn) => fn());
      root.remove();
    },
  };
}
