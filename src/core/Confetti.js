const COLORS = ['#e8b4b8', '#b8d8ec', '#f5c6a8', '#c45c4a', '#b5c4aa', '#f9e4b7'];

export class Confetti {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'confetti-canvas';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.raf = null;
    this.running = false;

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 180) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.35;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 120,
        y: cy + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 4,
        size: 6 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 12,
        life: 1,
        decay: 0.004 + Math.random() * 0.006,
      });
    }

    if (!this.running) {
      this.running = true;
      this.tick();
    }
  }

  tick() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.particles = this.particles.filter((p) => {
      p.vy += 0.18;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life -= p.decay;

      if (p.life <= 0) return false;

      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
      return true;
    });

    if (this.particles.length > 0) {
      this.raf = requestAnimationFrame(() => this.tick());
    } else {
      this.running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._onResize);
    this.canvas.remove();
    this.particles = [];
  }
}
