import { flowerMarkup, vaseMarkup } from './bouquetFlowers.js';

// ── Bouquet slots — x is % of arrangement half-width ──
const BOUQUET_SLOTS = [
  { id: 'center', x: 0, rot: 0, scale: 1.05, z: 3 },
  { id: 'left-1', x: -20, rot: -14, scale: 1.0, z: 4 },
  { id: 'right-1', x: 20, rot: 14, scale: 1.0, z: 4 },
  { id: 'left-2', x: -38, rot: -24, scale: 0.96, z: 6 },
  { id: 'right-2', x: 38, rot: 24, scale: 0.96, z: 6 },
  { id: 'left-3', x: -55, rot: -32, scale: 0.92, z: 7 },
  { id: 'right-3', x: 55, rot: 32, scale: 0.92, z: 7 },
  { id: 'back-left', x: -12, rot: -8, scale: 1.02, z: 2 },
  { id: 'back-right', x: 12, rot: 8, scale: 1.02, z: 2 },
  { id: 'front', x: 0, rot: 3, scale: 0.98, z: 5 },
];

const JITTER_X = 3;
const JITTER_ROT = 3;
const SETTLE_MS = 420;

const FLOWER_TYPES = [
  { id: 'lotus', name: 'Lotus', tag: 'fav ✨' },
  { id: 'rose', name: 'Rose' },
  { id: 'rose-blush', name: 'Blush rose' },
  { id: 'daisy', name: 'Daisy' },
  { id: 'daisy-butter', name: 'Butter daisy' },
  { id: 'tulip', name: 'Tulip' },
  { id: 'tulip-lilac', name: 'Lilac tulip' },
  { id: 'peony', name: 'Peony' },
  { id: 'sprig', name: 'Filler' },
];

/**
 * Cycle through fan slots so every flower lands in a distinct position.
 * @param {number} index — 0-based placement count
 * @param {number} clientX
 * @param {DOMRect} pileRect
 */
function pickSlot(index, clientX, pileRect) {
  const centerX = pileRect.left + pileRect.width / 2;
  const dropBias = ((clientX - centerX) / pileRect.width) * 100 * 0.12;
  const slot = BOUQUET_SLOTS[index % BOUQUET_SLOTS.length];

  return {
    ...slot,
    x: slot.x + dropBias,
    id: `${slot.id}-${index}`,
  };
}

/**
 * Self-contained drag-flowers-into-vase component.
 */
export function createBouquetBuilder(options = {}) {
  const {
    title = 'Build your bouquet',
    hint = 'Drag flowers into the vase',
    milestoneCount = 5,
    milestoneMsg = "It's already beautiful. Keep going.",
    vaseLabel = '',
    onFlowerPlaced,
    onMilestone,
  } = options;

  const root = document.createElement('div');
  root.className = 'bb';
  root.innerHTML = `
    <header class="bb-header">
      <p class="bb-header__eyebrow">Fresh picks</p>
      <h2 class="bb-header__title">${title}</h2>
      <p class="bb-header__hint">${hint}</p>
      <button type="button" class="bb-clear">Start over</button>
    </header>
    <div class="bb-stage">
      <div class="bb-surface">
        <div class="bb-composition">
          <div class="bb-vase-stack">
            <div class="bb-arrangement" aria-hidden="true"></div>
            <div class="bb-vase-wrap">
              <div class="bb-drop-zone" aria-hidden="true"></div>
              ${vaseMarkup()}
              ${vaseLabel ? `<p class="bb-vase-label">${vaseLabel}</p>` : ''}
              <div class="bb-vase-shadow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="bb-tray">
      <p class="bb-tray__label">Choose your stems</p>
      <div class="bb-tray__row"></div>
    </div>
    <p class="bb-milestone" hidden></p>
  `;

  const dropZone = root.querySelector('.bb-drop-zone');
  const arrangement = root.querySelector('.bb-arrangement');
  const trayRow = root.querySelector('.bb-tray__row');
  const clearBtn = root.querySelector('.bb-clear');
  const milestoneEl = root.querySelector('.bb-milestone');

  let placedCount = 0;
  let milestoneShown = false;
  let drag = null;
  const unbind = [];

  function bind(el, type, fn) {
    el.addEventListener(type, fn);
    unbind.push(() => el.removeEventListener(type, fn));
  }

  function isInDropZone(clientX, clientY) {
    const r = dropZone.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (clientX - cx) / (r.width / 2);
    const dy = (clientY - cy) / (r.height / 2);
    return dx * dx + dy * dy <= 1.25;
  }

  function createTrayFlower(type) {
    const meta = FLOWER_TYPES.find((f) => f.id === type);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bb-tray__flower';
    btn.dataset.flowerType = type;
    btn.setAttribute('aria-label', `Drag ${meta?.name || type}`);
    btn.innerHTML = `
      ${flowerMarkup(type, 'bb-flower-art bb-flower-art--tray')}
      <span class="bb-tray__name">${meta?.name || type}</span>
      ${meta?.tag ? `<span class="bb-tray__tag">${meta.tag}</span>` : ''}
    `;
    bind(btn, 'pointerdown', (e) => startDrag(e, type, btn));
    return btn;
  }

  function buildTray() {
    trayRow.innerHTML = '';
    FLOWER_TYPES.forEach((f) => trayRow.appendChild(createTrayFlower(f.id)));
  }

  function startDrag(e, type, source) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    source.setPointerCapture(e.pointerId);

    const r = source.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'bb-ghost';
    ghost.innerHTML = flowerMarkup(type, 'bb-flower-art bb-flower-art--ghost');
    ghost.style.width = `${r.width}px`;
    document.body.appendChild(ghost);

    drag = {
      type,
      ghost,
      source,
      pointerId: e.pointerId,
      offsetX: e.clientX - r.left - r.width / 2,
      offsetY: e.clientY - r.top - r.height / 2,
    };

    source.classList.add('bb-tray__flower--dragging');
    moveGhost(e.clientX, e.clientY);
    dropZone.classList.remove('bb-drop-zone--active');
    root.classList.remove('bb--drop-hover');
    document.body.classList.add('bb-dragging');
  }

  function moveGhost(x, y) {
    if (!drag?.ghost) return;
    drag.ghost.style.left = `${x - drag.offsetX}px`;
    drag.ghost.style.top = `${y - drag.offsetY}px`;
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    moveGhost(e.clientX, e.clientY);
    const over = isInDropZone(e.clientX, e.clientY);
    dropZone.classList.toggle('bb-drop-zone--active', over);
    root.classList.toggle('bb--drop-hover', over);
  }

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;

    const { type, ghost, source } = drag;
    const valid = isInDropZone(e.clientX, e.clientY);

    try {
      source.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    source.classList.remove('bb-tray__flower--dragging');
    dropZone.classList.remove('bb-drop-zone--active');
    root.classList.remove('bb--drop-hover');
    document.body.classList.remove('bb-dragging');

    if (valid) {
      ghost.remove();
      placeFlower(type, e.clientX, e.clientY);
    } else {
      returnGhostToTray();
    }

    drag = null;
  }

  function returnGhostToTray() {
    if (!drag) return;
    const { ghost, source } = drag;
    const trayRect = source.getBoundingClientRect();
    ghost.style.transition = `left ${SETTLE_MS}ms var(--bb-ease-out), top ${SETTLE_MS}ms var(--bb-ease-out), opacity ${SETTLE_MS}ms ease`;
    ghost.style.left = `${trayRect.left + trayRect.width / 2 - parseFloat(ghost.style.width) / 2}px`;
    ghost.style.top = `${trayRect.top}px`;
    ghost.style.opacity = '0';
    window.setTimeout(() => ghost.remove(), SETTLE_MS);
  }

  function updateBouquetScale(count) {
    const bloom = count <= 1 ? 1 : Math.max(0.55, 1 - (count - 1) * 0.068);
    const spread = count <= 1 ? 1 : Math.max(0.52, 1 - (count - 1) * 0.058);
    root.style.setProperty('--bb-bloom-scale', String(bloom));
    root.style.setProperty('--bb-spread', String(spread));

    const w = arrangement.clientWidth;
    arrangement.querySelectorAll('.bb-stem').forEach((stem) => {
      const baseX = Number(stem.dataset.baseX) || 0;
      stem.style.setProperty('--px', `${(baseX / 100) * w * 0.46 * spread}px`);
    });
  }

  function placeFlower(type, clientX, clientY) {
    const index = placedCount;
    placedCount += 1;
    const pileRect = arrangement.getBoundingClientRect();
    const slot = pickSlot(index, clientX, pileRect);

    const baseX = slot.x + (Math.random() - 0.5) * JITTER_X;
    const rot = slot.rot + (Math.random() - 0.5) * JITTER_ROT;
    const scale = slot.scale + (Math.random() - 0.5) * 0.03;

    const el = document.createElement('div');
    el.className = 'bb-stem';
    el.dataset.slot = slot.id;
    el.dataset.flower = type;
    el.dataset.baseX = String(baseX);
    el.style.setProperty('--prot', `${rot}deg`);
    el.style.setProperty('--pscale', String(scale));
    el.style.zIndex = String(slot.z);
    el.innerHTML = flowerMarkup(type, 'bb-flower-art bb-flower-art--placed');

    arrangement.appendChild(el);
    root.classList.toggle('bb--has-flowers', placedCount > 0);
    root.dataset.count = String(placedCount);
    updateBouquetScale(placedCount);

    onFlowerPlaced?.({ flowerId: type, count: placedCount });

    if (!milestoneShown && placedCount >= milestoneCount) {
      milestoneShown = true;
      milestoneEl.textContent = milestoneMsg;
      milestoneEl.hidden = false;
      onMilestone?.({ count: placedCount });
    }
  }

  function clearVase() {
    placedCount = 0;
    milestoneShown = false;
    arrangement.innerHTML = '';
    milestoneEl.hidden = true;
    milestoneEl.textContent = '';
    root.classList.remove('bb--has-flowers');
    root.dataset.count = '0';
    updateBouquetScale(0);
  }

  bind(document, 'pointermove', onPointerMove);
  bind(document, 'pointerup', endDrag);
  bind(document, 'pointercancel', endDrag);
  bind(clearBtn, 'click', clearVase);
  buildTray();
  updateBouquetScale(0);

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
      document.body.classList.remove('bb-dragging');
      clearVase();
      buildTray();
    },
    destroy() {
      drag?.ghost?.remove();
      drag = null;
      unbind.forEach((fn) => fn());
      root.remove();
    },
  };
}
