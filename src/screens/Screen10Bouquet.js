import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { SCREENS } from '../constants/screens.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { createBouquetBuilder } from '../components/BouquetBuilder.js';

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics, confetti: import('../core/Confetti.js').Confetti }} services */
export function createBouquetScreen({ manager, analytics, confetti }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--bouquet';

  function goToCelebration(via, count) {
    analytics.track(EVENTS.MANUAL_CONTINUE, {
      from: SCREENS.BOUQUET,
      to: SCREENS.CELEBRATION,
      via,
      count,
    });
    manager.goTo(SCREENS.CELEBRATION);
  }

  const builder = createBouquetBuilder({
    title: CONFIG.bouquetTitle,
    hint: CONFIG.bouquetHint,
    milestoneCount: CONFIG.bouquetMilestoneCount,
    milestoneMsg: CONFIG.bouquetMilestoneMsg,
    vaseLabel: CONFIG.bouquetVaseLabel,
    continueLabel: CONFIG.bouquetContinueBtn,
    skipLabel: CONFIG.bouquetSkipCta,
    onFlowerPlaced({ flowerId, count }) {
      analytics.track(EVENTS.BOUQUET_FLOWER_PLACED, { flowerId, count });
      if (count % 3 === 0) confetti.burst(18);
    },
    onMilestone({ count }) {
      analytics.track(EVENTS.BOUQUET_COMPLETE, { count });
      confetti.burst(55);
    },
    onContinue({ count }) {
      goToCelebration('continue', count);
    },
    onSkip({ count }) {
      goToCelebration('skip', count);
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
