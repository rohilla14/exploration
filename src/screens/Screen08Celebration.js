import { CONFIG } from '../config.js';
import { windowBar } from '../utils/dom.js';
import { EVENTS } from '../constants/eventTypes.js';
import { createLifecycle } from '../utils/lifecycle.js';
import { SCREENS } from '../constants/screens.js';
import { focusOf } from '../utils/photos.js';
import { renderKeepsakeCard, downloadCanvas } from '../core/Keepsake.js';
import { play as playSong, playingId } from '../core/NowPlaying.js';

const PLAN_KEY = 'exploration.datePlan';

function formatPlanDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

/** "50% 45%" → { x: 0.5, y: 0.45 }, for the canvas card (CSS position strings elsewhere in the
 * config are percentages of the box, same idea as background-position). */
function parseFocus(cssPosition) {
  const m = String(cssPosition ?? '').match(/(-?[\d.]+)%\s+(-?[\d.]+)%/);
  return m ? { x: Number(m[1]) / 100, y: Number(m[2]) / 100 } : { x: 0.5, y: 0.3 };
}

/** @param {{ manager: import('../core/ScreenManager.js').ScreenManager, analytics: import('../analytics/Analytics.js').Analytics, confetti: import('../core/Confetti.js').Confetti }} services */
export function createCelebrationScreen({ manager, analytics, confetti }) {
  const lc = createLifecycle();

  const element = document.createElement('section');
  element.className = 'screen screen--celebration';

  const inner = document.createElement('div');
  inner.className = 'screen__inner celebration__inner win';

  const photo = document.createElement('div');
  photo.className = 'celebration-photo celebration-photo--placeholder';
  photo.textContent = 'Your photo goes here 💕';

  const img = new Image();
  img.src = CONFIG.photos?.celebration || CONFIG.gallery[0]?.src || '';
  img.onload = () => {
    photo.classList.remove('celebration-photo--placeholder');
    photo.textContent = '';
    photo.style.backgroundImage = `url(${img.src})`;
    photo.style.backgroundSize = 'cover';
    photo.style.backgroundPosition = focusOf(CONFIG.photos?.celebration);
  };

  const headline = document.createElement('h2');
  headline.className = 'celebration-headline';

  const planSummary = document.createElement('div');
  planSummary.className = 'celebration-plan';
  planSummary.hidden = true;

  const closing = document.createElement('p');
  closing.className = 'celebration-closing';
  closing.textContent = CONFIG.closingLine;

  // A keepsake she can actually keep: drawn to a canvas (not a DOM screenshot, which fonts and
  // gradients make unreliable) so it looks the same wherever it ends up.
  const keepsake = document.createElement('div');
  keepsake.className = 'celebration-keepsake';
  keepsake.hidden = true;
  keepsake.innerHTML = `
    <p class="celebration-keepsake__label">${CONFIG.celebrationKeepsakeLabel}</p>
    <div class="celebration-keepsake__frame" data-role="frame"></div>
    <div class="celebration-keepsake__actions">
      <button type="button" class="btn btn--secondary celebration-keepsake__song" data-role="song">
        ${CONFIG.celebrationSong ? CONFIG.celebrationPlaySongCta : ''}
      </button>
      <button type="button" class="btn btn--primary celebration-keepsake__save" data-role="save">
        ${CONFIG.celebrationSaveCta}
      </button>
    </div>
  `;
  if (!CONFIG.celebrationSong) keepsake.querySelector('[data-role="song"]').hidden = true;

  const hubBtn = document.createElement('button');
  hubBtn.type = 'button';
  hubBtn.className = 'btn btn--primary celebration-hub-btn';
  hubBtn.textContent = CONFIG.hubEnterCta;
  hubBtn.addEventListener('click', () => {
    analytics.track(EVENTS.HUB_APP_OPEN, { from: 'celebration' });
    manager.goTo(SCREENS.HUB);
  });

  const body = document.createElement('div');
  body.className = 'celebration__body';
  body.append(photo, headline, planSummary, closing, keepsake, hubBtn);
  inner.append(windowBar('she said yes.txt'), body);
  element.appendChild(inner);

  function readPlan() {
    try {
      return JSON.parse(sessionStorage.getItem(PLAN_KEY) || 'null');
    } catch {
      return null;
    }
  }

  /** Draw the keepsake card and wire its two buttons. Guarded against a second, overlapping
   * call (she could in principle replay this screen before the first render finishes). */
  let renderToken = 0;
  async function buildKeepsake(plan) {
    const token = ++renderToken;
    const frame = keepsake.querySelector('[data-role="frame"]');
    const saveBtn = keepsake.querySelector('[data-role="save"]');
    const songBtn = keepsake.querySelector('[data-role="song"]');
    frame.innerHTML = '';
    saveBtn.disabled = true;

    const activities = Array.isArray(plan.activities) ? plan.activities : [];
    const photoSrc = CONFIG.photos?.celebration || CONFIG.gallery[0]?.src || '';

    let canvas;
    try {
      canvas = await renderKeepsakeCard({
        photoSrc,
        focus: parseFocus(focusOf(photoSrc)),
        herName: CONFIG.herName,
        dateLine: formatPlanDate(plan.selectedDate),
        timeLine: plan.selectedTime || '',
        stops: activities.map((a) => `${a.emoji || '📍'} ${a.place}`),
        closingLine: CONFIG.closingLine,
      });
    } catch (err) {
      console.warn('[celebration] Could not draw the keepsake card', err);
      return;
    }
    if (token !== renderToken) return; // a newer render started; drop this one

    canvas.className = 'celebration-keepsake__canvas';
    frame.appendChild(canvas);
    saveBtn.disabled = false;

    saveBtn.onclick = () => {
      analytics.track(EVENTS.MANUAL_CONTINUE, { from: 'celebration', to: 'keepsake-download' });
      downloadCanvas(canvas, `${CONFIG.herName.toLowerCase()}-and-me.png`);
    };

    if (CONFIG.celebrationSong) {
      songBtn.onclick = () => {
        playSong(CONFIG.celebrationSong);
        songBtn.textContent = CONFIG.celebrationPlayingSongCta;
        songBtn.disabled = true;
        lc.trackTimeout(
          setTimeout(() => {
            if (playingId() !== CONFIG.celebrationSong.id) songBtn.disabled = false;
          }, 1200)
        );
      };
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

        keepsake.hidden = false;
        buildKeepsake(plan);
      } else {
        headline.textContent = 'Yay!';
        planSummary.hidden = true;
        keepsake.hidden = true;
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
