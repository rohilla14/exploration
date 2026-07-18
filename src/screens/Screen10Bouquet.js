import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { createBouquetBuilder } from '../components/BouquetBuilder.js';

/** @param {{ analytics: import('../analytics/Analytics.js').Analytics, confetti: import('../core/Confetti.js').Confetti }} services */
export function createBouquetScreen({ analytics, confetti }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--bouquet';

  const builder = createBouquetBuilder({
    title: CONFIG.bouquetTitle,
    hint: CONFIG.bouquetHint,
    milestoneCount: CONFIG.bouquetMilestoneCount,
    milestoneMsg: CONFIG.bouquetMilestoneMsg,
    vaseLabel: CONFIG.bouquetVaseLabel,
    onFlowerPlaced({ flowerId, count }) {
      analytics.track(EVENTS.BOUQUET_FLOWER_PLACED, { flowerId, count });
      if (count % 3 === 0) confetti.burst(40);
    },
    onMilestone({ count }) {
      analytics.track(EVENTS.BOUQUET_COMPLETE, { count });
      confetti.burst(80);
    },
  });

  element.appendChild(builder.element);

  return {
    element,
    onEnter() {
      lc.reset();
      builder.reset();
    },
    onExit() {
      builder.reset();
      lc.reset();
    },
  };
}
