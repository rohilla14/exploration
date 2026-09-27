const PARALLAX = 14;
const SPECK_COUNT = 18;

/**
 * Which way the light is leaning right now. The whole page is tinted by this,
 * so opening the site in the morning does not look the same as opening it at night.
 */
function timeOfDay(hour = new Date().getHours()) {
  if (hour < 5) return 'night';
  if (hour < 11) return 'morning';
  if (hour < 16) return 'day';
  if (hour < 20) return 'sunset';
  return 'night';
}

export function initAmbientBackground() {
  const ambient = document.createElement('div');
  ambient.className = 'ambient';
  ambient.setAttribute('aria-hidden', 'true');
  ambient.innerHTML = `
    <div class="ambient__mesh"></div>
    <div class="ambient__blob ambient__blob--1"></div>
    <div class="ambient__blob ambient__blob--2"></div>
    <div class="ambient__blob ambient__blob--3"></div>
    <div class="ambient__specks"></div>
    <div class="ambient__grain"></div>
  `;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Dust in sunlight: a few slow specks, skipped when motion is reduced.
  const specks = ambient.querySelector('.ambient__specks');
  if (!reduce) {
    for (let i = 0; i < SPECK_COUNT; i++) {
      const s = document.createElement('span');
      s.className = 'ambient__speck';
      s.style.setProperty('--x', `${Math.random() * 100}%`);
      s.style.setProperty('--size', `${2 + Math.random() * 3}px`);
      s.style.setProperty('--dur', `${18 + Math.random() * 22}s`);
      s.style.setProperty('--delay', `${-Math.random() * 30}s`);
      s.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
      specks.appendChild(s);
    }
  }

  function applyTime() {
    document.body.dataset.daypart = timeOfDay();
  }
  applyTime();
  // Check now and then so a long visit can roll from evening into night.
  setInterval(applyTime, 10 * 60 * 1000);

  document.body.prepend(ambient);

  // The background leans a little against the cursor, which gives the flat colour some depth.
  if (!reduce && !window.matchMedia('(pointer: coarse)').matches) {
    let raf = 0;
    let tx = 0;
    let ty = 0;
    window.addEventListener(
      'pointermove',
      (e) => {
        tx = (e.clientX / window.innerWidth - 0.5) * PARALLAX;
        ty = (e.clientY / window.innerHeight - 0.5) * PARALLAX;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          ambient.style.setProperty('--par-x', `${tx.toFixed(1)}px`);
          ambient.style.setProperty('--par-y', `${ty.toFixed(1)}px`);
        });
      },
      { passive: true }
    );
  }
}
