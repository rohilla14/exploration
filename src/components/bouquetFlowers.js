/**
 * Bouquet visuals — transparent watercolor PNGs in public/assets/flowers/
 * Extra "color" variants reuse the same stem art with light CSS filters.
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
    // Color variants (same art, CSS filter via tint class)
    'rose-blush': '/assets/flowers/rose.png',
    'daisy-butter': '/assets/flowers/daisy.png',
    'tulip-lilac': '/assets/flowers/tulip.png',
  },
};

/** Optional per-type tint class for color variants. */
export const FLOWER_TINTS = {
  'rose-blush': 'bb-flower-art--blush',
  'daisy-butter': 'bb-flower-art--butter',
  'tulip-lilac': 'bb-flower-art--lilac',
};

/** @param {string} type @param {string} [className] */
export function flowerMarkup(type, className = 'bb-flower-art') {
  const src = BOUQUET_ASSETS.flowers[type] ?? BOUQUET_ASSETS.flowers.rose;
  const tint = FLOWER_TINTS[type] ? ` ${FLOWER_TINTS[type]}` : '';
  return `<img class="${className}${tint}" src="${src}" alt="" draggable="false" loading="eager" />`;
}

export function vaseMarkup() {
  return `<img class="bb-vase-art" src="${BOUQUET_ASSETS.vase}" alt="" draggable="false" />`;
}
