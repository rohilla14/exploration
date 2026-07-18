/**
 * Bouquet visuals — transparent watercolor PNGs in public/assets/flowers/
 */

export const BOUQUET_ASSETS = {
  vase: '/assets/flowers/vase.png',
  flowers: {
    lotus: '/assets/flowers/lotus.png',
    rose: '/assets/flowers/rose.png',
    daisy: '/assets/flowers/daisy.png',
    tulip: '/assets/flowers/tulip.png',
    peony: '/assets/flowers/peony.png',
    sprig: '/assets/flowers/sprig.png',
  },
};

/** @param {string} type @param {string} [className] */
export function flowerMarkup(type, className = 'bb-flower-art') {
  const src = BOUQUET_ASSETS.flowers[type] ?? BOUQUET_ASSETS.flowers.rose;
  return `<img class="${className}" src="${src}" alt="" draggable="false" loading="eager" />`;
}

export function vaseMarkup() {
  return `<img class="bb-vase-art" src="${BOUQUET_ASSETS.vase}" alt="" draggable="false" />`;
}
