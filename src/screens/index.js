import { SCREENS } from '../constants/screens.js';
import { createLoadingScreen } from './Screen00Loading.js';
import { createExploreScreen } from './ScreenExplore.js';
import { createScrollStoryScreen } from './ScreenScrollStory.js';
import { createBigAskScreen } from './Screen07BigAsk.js';
import { createCelebrationScreen } from './Screen08Celebration.js';
import { createDatePlannerScreen } from './Screen09DatePlanner.js';
import { createBouquetScreen } from './Screen10Bouquet.js';
import { createHubScreen } from './Screen11Hub.js';

/**
 * Register every screen in flow order. To add a screen: create factory, add here.
 * @param {import('../core/App.js').AppServices} services
 */
export function registerScreens({ manager, analytics, confetti }) {
  manager.register(SCREENS.LOADING, createLoadingScreen({ manager, analytics }));
  manager.register(SCREENS.SCROLL_STORY, createScrollStoryScreen({ manager, analytics }));
  manager.register(SCREENS.EXPLORE, createExploreScreen({ manager, analytics }));
  manager.register(SCREENS.BIG_ASK, createBigAskScreen({ manager, analytics, confetti }));
  manager.register(SCREENS.DATE_PLANNER, createDatePlannerScreen({ manager, analytics, confetti }));
  manager.register(SCREENS.BOUQUET, createBouquetScreen({ manager, analytics, confetti }));
  manager.register(SCREENS.CELEBRATION, createCelebrationScreen({ manager, analytics, confetti }));
  manager.register(SCREENS.HUB, createHubScreen({ manager, analytics }));
}
