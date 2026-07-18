export function initAmbientBackground() {
  const ambient = document.createElement('div');
  ambient.className = 'ambient';
  ambient.setAttribute('aria-hidden', 'true');
  ambient.innerHTML = `
    <div class="ambient__mesh"></div>
    <div class="ambient__blob ambient__blob--1"></div>
    <div class="ambient__blob ambient__blob--2"></div>
    <div class="ambient__blob ambient__blob--3"></div>
    <div class="ambient__grain"></div>
  `;
  document.body.prepend(ambient);
}
