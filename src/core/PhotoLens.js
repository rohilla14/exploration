const FOLLOW = 0.14;
const IDLE_MS = 2600;
const WANDER_MS = 2400;

/**
 * Full-bleed photo background with a soft round "lens" that follows the pointer and swaps that
 * part of the picture for another photo (chosen by which 3 x 3 region the pointer is in).
 * A copy of the main photo sits above the lens around the face, so the face is never covered.
 *
 * Layers are inserted behind everything else in `host`; the host must be positioned.
 * @param {HTMLElement} host
 * Each reveal is `{ src, fx, fy, zoom? }`: (fx, fy) is the point of interest in that photo (0-1), which is
 * kept centred inside the lens as it moves, like a porthole onto the other picture.
 * The screen is split into `cols` x `rows` regions, one photo per region.
 * @param {{ photo: string, posY?: number, cols?: number, rows?: number, face: { cx: number, cy: number, rx: number, ry: number }, reveals: ({ src: string, fx: number, fy: number, zoom?: number } | null)[] }} options
 */
export function createPhotoLens(host, { photo, posY = 0.5, cols = 3, rows = 3, face, reveals }) {
  const layer = (cls) => {
    const div = document.createElement('div');
    div.className = `lens__layer ${cls}`;
    return div;
  };
  const base = layer('lens__base');
  const revealA = layer('lens__reveal');
  const revealB = layer('lens__reveal');
  const keeper = layer('lens__keeper');
  const shade = layer('lens__shade');
  const ring = document.createElement('div');
  ring.className = 'lens__ring';
  base.style.backgroundImage = `url(${photo})`;
  keeper.style.backgroundImage = `url(${photo})`;
  base.style.backgroundPosition = keeper.style.backgroundPosition = `center ${posY * 100}%`;
  host.classList.add('lens-host');
  host.prepend(base, revealA, revealB, keeper, shade, ring);

  const coarse = window.matchMedia('(pointer: coarse)');
  const outerCells = reveals.map((r, i) => (r ? i : -1)).filter((i) => i >= 0);

  /** @type {Map<string, { w: number, h: number }>} natural sizes, so the porthole can be sized. */
  const sizes = new Map();
  reveals.forEach((r) => {
    if (!r) return;
    const img = new Image();
    img.onload = () => sizes.set(r.src, { w: img.naturalWidth, h: img.naturalHeight });
    img.src = r.src;
  });

  let naturalW = 0;
  let naturalH = 0;
  const probe = new Image();
  probe.onload = () => {
    naturalW = probe.naturalWidth;
    naturalH = probe.naturalHeight;
    measure();
  };
  probe.src = photo;

  let W = 0;
  let H = 0;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let lastInput = 0;
  let wanderAt = 0;
  let wanderIdx = 0;
  let pointerDown = false;
  let cell = -1;
  let front = revealA;
  let back = revealB;
  let frontReveal = null;
  let backReveal = null;
  let raf = 0;
  let running = false;

  /** Where the face lands after the photo is cover-fitted to the host. */
  function measure() {
    W = host.clientWidth;
    H = host.clientHeight;
    if (!W || !H || !naturalW) return;
    const scale = Math.max(W / naturalW, H / naturalH);
    const dispW = naturalW * scale;
    const dispH = naturalH * scale;
    const offX = (W - dispW) / 2;
    const offY = (H - dispH) * posY;
    host.style.setProperty('--fx', `${offX + face.cx * dispW}px`);
    host.style.setProperty('--fy', `${offY + face.cy * dispH}px`);
    host.style.setProperty('--frx', `${face.rx * dispW}px`);
    host.style.setProperty('--fry', `${face.ry * dispH}px`);
    host.style.setProperty('--lr', `${Math.round(Math.min(Math.max(Math.min(W, H) * 0.24, 120), 240))}px`);
  }

  function cellAt(px, py) {
    const col = Math.min(cols - 1, Math.max(0, Math.floor((px / W) * cols)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor((py / H) * rows)));
    return row * cols + col;
  }

  function showCell(next) {
    if (next === cell) return;
    cell = next;
    const reveal = reveals[next];
    if (!reveal) {
      front.classList.remove('lens__reveal--on');
      return;
    }
    // swap layers so the old photo fades out while the new one fades in
    [front, back] = [back, front];
    [frontReveal, backReveal] = [reveal, frontReveal];
    front.style.backgroundImage = `url(${reveal.src})`;
    front.classList.add('lens__reveal--on');
    back.classList.remove('lens__reveal--on');
  }

  /** Size and place a reveal photo so its point of interest sits at the lens centre. */
  function placeReveal(layerEl, reveal) {
    const size = reveal && sizes.get(reveal.src);
    if (!size) return;
    const lr = parseFloat(host.style.getPropertyValue('--lr')) || 180;
    const lensD = lr * 2;
    let dispW = lensD * (reveal.zoom ?? 2.6);
    let dispH = (dispW * size.h) / size.w;
    if (dispH < lensD * 1.1) {
      dispH = lensD * 1.1;
      dispW = (dispH * size.w) / size.h;
    }
    layerEl.style.backgroundSize = `${dispW}px ${dispH}px`;
    layerEl.style.backgroundPosition = `${x - reveal.fx * dispW}px ${y - reveal.fy * dispH}px`;
  }

  function tick(now) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (coarse.matches && !pointerDown && now - lastInput > IDLE_MS && outerCells.length) {
      // Touch screens have no hover: drift through the regions on their own.
      if (now - wanderAt > WANDER_MS) {
        wanderAt = now;
        wanderIdx = (wanderIdx + 1) % outerCells.length;
        const c = outerCells[wanderIdx];
        targetX = ((c % cols) + 0.5) * (W / cols);
        targetY = (Math.floor(c / cols) + 0.5) * (H / rows);
      }
    }
    x += (targetX - x) * FOLLOW;
    y += (targetY - y) * FOLLOW;
    host.style.setProperty('--lx', `${x.toFixed(1)}px`);
    host.style.setProperty('--ly', `${y.toFixed(1)}px`);
    showCell(cellAt(x, y));
    placeReveal(front, frontReveal);
    placeReveal(back, backReveal);
  }

  function onPointerMove(e) {
    const rect = host.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    lastInput = performance.now();
    host.classList.add('lens-host--active');
  }
  const onDown = (e) => {
    pointerDown = true;
    onPointerMove(e);
  };
  const onUp = () => {
    pointerDown = false;
    lastInput = performance.now();
  };

  host.addEventListener('pointermove', onPointerMove);
  host.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('resize', measure);

  return {
    start() {
      measure();
      x = targetX = W * 0.2;
      y = targetY = H * 0.2;
      cell = -1;
      frontReveal = backReveal = null;
      lastInput = wanderAt = performance.now();
      host.classList.remove('lens-host--active');
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', measure);
    },
  };
}
