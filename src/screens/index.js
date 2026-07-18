import { SCREENS } from '../constants/screens.js';
import { createLoadingScreen } from './Screen00Loading.js';
import { createScrollStoryScreen } from './ScreenScrollStory.js';
import { createEnvelopeScreen } from './Screen02Envelope.js';
import { createReasonsScreen } from './Screen03Reasons.js';
import { createGamesHubScreen } from './Screen04GamesHub.js';
import { createAnticipationScreen } from './Screen05Anticipation.js';
import { createPreAskScreen } from './Screen06PreAsk.js';
import { createBigAskScreen } from './Screen07BigAsk.js';
import { createCelebrationScreen } from './Screen08Celebration.js';
import { createDatePlannerScreen } from './Screen09DatePlanner.js';
import { createBouquetScreen } from './Screen10Bouquet.js';

/**
 * Register every screen in flow order. To add a screen: create factory, add here.
 * @param {import('../core/App.js').AppServices} services
 */
export function registerScreens({ manager, analytics, confetti }) {
  manager.register(SCREENS.LOADING, createLoadingScreen({ manager, analytics }));
  manager.register(SCREENS.SCROLL_STORY, createScrollStoryScreen({ manager, analytics }));
  manager.register(SCREENS.BIG_ASK, createBigAskScreen({ manager, analytics }));
  manager.register(SCREENS.DATE_PLANNER, createDatePlannerScreen({ manager, analytics, confetti }));
  manager.register(SCREENS.BOUQUET, createBouquetScreen({ analytics, confetti }));
  manager.register(SCREENS.CELEBRATION, createCelebrationScreen({ analytics, confetti }));
  manager.register(SCREENS.ENVELOPE, createEnvelopeScreen({ manager, analytics }));
  manager.register(SCREENS.REASONS, createReasonsScreen({ manager, analytics }));
  manager.register(SCREENS.GAMES, createGamesHubScreen({ manager, analytics }));
  manager.register(SCREENS.ANTICIPATION, createAnticipationScreen({ manager, analytics }));
  manager.register(SCREENS.PRE_ASK, createPreAskScreen({ manager, analytics }));
}
