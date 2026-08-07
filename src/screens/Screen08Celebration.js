import { CONFIG } from '../config.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { SCREENS } from '../constants/screens.js';

const PLAN_KEY = 'exploration.datePlan';

function formatPlanDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics, confetti: import('../core/Confetti.js').Confetti }} services */
export function createCelebrationScreen({ manager, analytics, confetti }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--celebration';

  const inner = document.createElement('div');
  inner.className = 'screen__inner celebration__inner';

  const photo = document.createElement('div');
  photo.className = 'celebration-photo celebration-photo--placeholder';
  photo.textContent = 'Your photo goes here 💕';

  const img = new Image();
  img.src =
    CONFIG.photos?.celebration ||
    CONFIG.photos?.cinematic ||
    '/assets/photo.jpeg';
  img.onload = () => {
    photo.classList.remove('celebration-photo--placeholder');
    photo.textContent = '';
    photo.style.backgroundImage = `url(${img.src})`;
    photo.style.backgroundSize = 'cover';
    photo.style.backgroundPosition = 'center';
  };

  const headline = document.createElement('h2');
  headline.className = 'celebration-headline';

  const planSummary = document.createElement('div');
  planSummary.className = 'celebration-plan';
  planSummary.hidden = true;

  const closing = document.createElement('p');
  closing.className = 'celebration-closing';
  closing.textContent = CONFIG.closingLine;

  const hubBtn = document.createElement('button');
  hubBtn.type = 'button';
  hubBtn.className = 'btn btn--primary celebration-hub-btn';
  hubBtn.textContent = CONFIG.hubEnterCta;
  hubBtn.addEventListener('click', () => {
    analytics.track(EVENTS.HUB_APP_OPEN, { from: 'celebration' });
    manager.goTo(SCREENS.HUB);
  });

  inner.appendChild(photo);
  inner.appendChild(headline);
  inner.appendChild(planSummary);
  inner.appendChild(closing);
  inner.appendChild(hubBtn);
  element.appendChild(inner);

  function readPlan() {
    try {
      return JSON.parse(sessionStorage.getItem(PLAN_KEY) || 'null');
    } catch {
      return null;
    }
  }

  return {
    element,
    onEnter() {
      lc.reset();
      photo.classList.remove('celebration-photo--visible');

      const plan = readPlan();
      if (plan?.selectedDate) {
        headline.textContent = `It's a date, ${CONFIG.herName}!`;
        planSummary.hidden = false;
        const activities = Array.isArray(plan.activities) ? plan.activities : [];
        const legacyMood = plan.moodId ? CONFIG.dateMoods.find((m) => m.id === plan.moodId) : null;
        const legacyPlace = plan.place;

        let activitiesHtml = '';
        if (activities.length) {
          activitiesHtml = `
            <ol class="celebration-plan__itinerary">
              ${activities
                .map(
                  (a) =>
                    `<li class="celebration-plan__stop">${a.emoji || '📍'} ${a.place}${a.moodLabel ? ` <span class="celebration-plan__mood">(${a.moodLabel})</span>` : ''}</li>`
                )
                .join('')}
            </ol>
          `;
        } else if (legacyPlace) {
          activitiesHtml = `<p class="celebration-plan__line">${legacyMood ? `${legacyMood.emoji} ${legacyMood.label} · ` : ''}📍 ${legacyPlace}</p>`;
        }

        planSummary.innerHTML = `
          <p class="celebration-plan__line">📅 ${formatPlanDate(plan.selectedDate)}</p>
          <p class="celebration-plan__line">🕐 ${plan.selectedTime || ''}</p>
          ${activitiesHtml}
        `;
      } else {
        headline.textContent = 'Yay!';
        planSummary.hidden = true;
      }

      lc.trackTimeout(
        setTimeout(() => {
          confetti.burst(120);
          photo.classList.add('celebration-photo--visible');
          analytics.track(EVENTS.DATE_CONFIRM, plan ?? {});
        }, 300)
      );
    },
    onExit() {
      lc.reset();
    },
  };
}
