interface Particle {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  a: number;
  warm: boolean;
}

const PARTICLE_COUNT = 24;

export function initParticles(canvas: HTMLCanvasElement): void {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let particles: Particle[] = [];

  const spawn = (init: boolean): Particle => ({
    x: Math.random() * width,
    y: init ? Math.random() * height : height + 10,
    r: 0.8 + Math.random() * 1.8,
    vy: 0.18 + Math.random() * 0.5,
    vx: (Math.random() - 0.5) * 0.12,
    a: 0.12 + Math.random() * 0.3,
    warm: Math.random() < 0.35,
  });

  const resize = () => {
    width = canvas.width = innerWidth;
    height = canvas.height = innerHeight;
  };

  let running = false;

  const loop = () => {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.y -= p.vy;
      p.x += p.vx;
      if (p.y < -12) Object.assign(p, spawn(false));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.warm ? `rgba(255,140,90,${p.a})` : `rgba(160,180,210,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(loop);
  };

  const start = () => {
    if (running) return;
    running = true;
    loop();
  };
  const stop = () => {
    running = false;
  };

  resize();
  particles = Array.from({ length: PARTICLE_COUNT }, () => spawn(true));
  addEventListener("resize", resize);
  // 非表示タブでは描画を止めて無駄な負荷を回避
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  start();
}
