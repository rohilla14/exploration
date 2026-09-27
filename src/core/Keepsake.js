const WIDTH = 1000;
const HEIGHT = 1400;
const PHOTO_HEIGHT = 860;
const PAD = 60;

const COLORS = {
  cream: '#fffaf4',
  border: '#7a3b45',
  burgundy: '#7a3b45',
  text: '#3d3530',
  textLight: '#7a6f68',
  accent: '#c96b7a',
};

/** Load an <img>, resolving once it can be drawn (same-origin site assets, no CORS issue). */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Cover-fit draw, same idea as CSS background-size: cover + a position. */
function drawCover(ctx, img, x, y, w, h, focusX = 0.5, focusY = 0.3) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x - (dw - w) * focusX;
  const dy = y - (dh - h) * focusY;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Wrap text to a max width, returning the lines it takes and the y it ends at. */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
  return curY;
}

/**
 * Draws a keepsake card: her photo, the day, the stops, a closing line. Meant to be saved as an
 * image, so everything is drawn onto one canvas rather than relying on a DOM screenshot (which
 * fonts, gradients and cross-browser rendering make unreliable).
 * @param {{ photoSrc: string, focus?: { x: number, y: number }, dateLine: string, timeLine: string,
 *   stops: string[], closingLine: string, herName: string }} data
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderKeepsakeCard(data) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  // Card base.
  ctx.fillStyle = COLORS.cream;
  roundRect(ctx, 0, 0, WIDTH, HEIGHT, 28);
  ctx.fill();

  // The photo, cover-fit, along the top.
  try {
    const img = await loadImage(data.photoSrc);
    drawCover(ctx, img, 0, 0, WIDTH, PHOTO_HEIGHT, data.focus?.x ?? 0.5, data.focus?.y ?? 0.28);
  } catch {
    ctx.fillStyle = '#e8cdd2';
    ctx.fillRect(0, 0, WIDTH, PHOTO_HEIGHT);
  }

  // A soft fade where the photo meets the panel below, so the seam is not a hard line.
  const fade = ctx.createLinearGradient(0, PHOTO_HEIGHT - 90, 0, PHOTO_HEIGHT);
  fade.addColorStop(0, 'rgba(255, 250, 244, 0)');
  fade.addColorStop(1, COLORS.cream);
  ctx.fillStyle = fade;
  ctx.fillRect(0, PHOTO_HEIGHT - 90, WIDTH, 90);

  // Wait for the site's own fonts, so this does not fall back to a system serif.
  try {
    await document.fonts.load('600 54px "Cormorant Garamond"');
    await document.fonts.load('500 30px "DM Mono"');
    await document.fonts.ready;
  } catch {
    // fonts API unsupported: falls back to default serif/mono, still readable
  }

  let y = PHOTO_HEIGHT + 70;

  ctx.fillStyle = COLORS.accent;
  ctx.font = '500 22px "DM Mono", monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('ONE DAY, THE TWO OF US', PAD, y);
  y += 56;

  ctx.fillStyle = COLORS.burgundy;
  ctx.font = '600 52px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(data.dateLine, PAD, y);
  y += 48;
  ctx.fillStyle = COLORS.textLight;
  ctx.font = '400 30px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(data.timeLine, PAD, y);
  y += 54;

  if (data.stops?.length) {
    ctx.strokeStyle = 'rgba(122, 59, 69, 0.25)';
    ctx.beginPath();
    ctx.moveTo(PAD, y - 20);
    ctx.lineTo(WIDTH - PAD, y - 20);
    ctx.stroke();

    ctx.fillStyle = COLORS.text;
    ctx.font = '400 30px "Cormorant Garamond", Georgia, serif';
    data.stops.forEach((stop, i) => {
      ctx.fillText(`${i + 1}.  ${stop}`, PAD, y);
      y += 44;
    });
    y += 10;
  }

  ctx.strokeStyle = 'rgba(122, 59, 69, 0.25)';
  ctx.beginPath();
  ctx.moveTo(PAD, y - 4);
  ctx.lineTo(WIDTH - PAD, y - 4);
  ctx.stroke();
  y += 46;

  ctx.fillStyle = COLORS.burgundy;
  ctx.font = 'italic 400 34px "Cormorant Garamond", Georgia, serif';
  wrapText(ctx, data.closingLine, PAD, y, WIDTH - PAD * 2, 44);

  // Outer border, drawn last so it sits on top of everything.
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 6;
  roundRect(ctx, 3, 3, WIDTH - 6, HEIGHT - 6, 26);
  ctx.stroke();

  return canvas;
}

/** Trigger a real file download of the canvas as a PNG. */
export function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}
