import './styles/variables.css';
import './styles/global.css';
import './styles/lively.css';
import './styles/screens.css';
import './styles/cinematic.css';
import './styles/planner.css';
import './styles/bouquet.css';
import './styles/photos.css';
import './styles/smile-counter.css';
import './styles/hub.css';
import './styles/desktop.css';
import './styles/theme.css';
import './styles/words.css';

import { App } from './core/App.js';

App.init();

// Installable app: register the service worker in production builds only, so dev hot-reload
// is never served stale files.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
