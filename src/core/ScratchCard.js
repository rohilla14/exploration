export class ScratchCard {
  constructor(container, message, { onProgress } = {}) {
    this.container = container;
    this.message = message;
    this.onProgress = onProgress;

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'scratch-card';

    this.reveal = document.createElement('div');
    this.reveal.className = 'scratch-card__reveal';
    this.reveal.textContent = message;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'scratch-card__canvas';

    this.wrapper.appendChild(this.reveal);
    this.wrapper.appendChild(this.canvas);
    container.appendChild(this.wrapper);

    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.scratchStarted = false;
    this.scratched = false;

    this._onPointerDown = (e) => this.startScratch(e);
    this._onPointerMove = (e) => this.scratch(e);
    this._onPointerUp = () => this.stopScratch();

    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  mount() {
    this.resize();
    this.drawOverlay();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.wrapper);
  }

  resize() {
    const rect = this.wrapper.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Never redraw overlay after scratching started — prevents wipe on layout shift
    if (!this.isDrawing && !this.scratchStarted && !this.scratched) {
      this.drawOverlay();
    }
  }

  drawOverlay() {
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    const grad = this.ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#c4788a');
    grad.addColorStop(0.45, '#e8b4bc');
    grad.addColorStop(1, '#a85d6c');
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 900; i++) {
      const shine = 180 + Math.random() * 75;
      this.ctx.fillStyle = `rgba(${shine},${shine - 40},${shine - 20},0.18)`;
      this.ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }

    this.ctx.fillStyle = 'rgba(255,248,245,0.75)';
    this.ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('scratch here', w / 2, h / 2);
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  startScratch(e) {
    e.preventDefault();
    this.isDrawing = true;
    this.canvas.setPointerCapture(e.pointerId);
    this.scratch(e);
  }

  scratch(e) {
    if (!this.isDrawing) return;
    this.scratchStarted = true;
    const { x, y } = this.getPos(e);
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 18, 0, Math.PI * 2);
    this.ctx.fill();

    this.checkProgress();
  }

  stopScratch() {
    this.isDrawing = false;
  }

  checkProgress() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const data = this.ctx.getImageData(0, 0, w, h).data;
    let transparent = 0;
    const step = 4 * Math.max(1, Math.floor(dpr * 2));
    for (let i = 3; i < data.length; i += step) {
      if (data[i] < 128) transparent++;
    }
    const total = data.length / step;
    const ratio = transparent / total;

    this.onProgress?.(ratio);

    if (ratio >= 0.55 && !this.scratched) {
      this.scratched = true;
      this.canvas.style.opacity = '0';
      this.canvas.style.pointerEvents = 'none';
      setTimeout(() => {
        this.canvas.remove();
      }, 400);
    }
  }

  destroy() {
    this.ro?.disconnect();
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    this.wrapper.remove();
  }
}
