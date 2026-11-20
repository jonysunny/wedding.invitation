// Ambient Continuous Floating Confetti
// Elegant, romantic particles: lavender petals, lilac pieces, dusty mauve, champagne gold, sparkles
// Optimized for mobile: 6-8 particles on mobile, 12-14 on desktop, paused when hidden or reduced motion

interface AmbientParticle {
  x: number;
  y: number;
  baseX: number;
  speedY: number;
  swayAmplitude: number;
  swayFrequency: number;
  swayPhase: number;
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  tiltSpeed: number;
  size: number;
  aspectRatio: number;
  color: string;
  type: 'petal' | 'confetti' | 'gold' | 'sparkle';
  opacity: number;
}

export function initAmbientConfetti() {
  if (typeof window === 'undefined') return;

  const canvas = document.getElementById('ambient-confetti-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Check reduced motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  let animationFrameId: number | null = null;
  let isRunning = false;
  let particles: AmbientParticle[] = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = window.innerWidth;
  let height = window.innerHeight;

  const palette = {
    petal: ['#D8C4EC', '#CDB5E5', '#E3D3F6'],
    lilac: ['#BEA6D6', '#B298CD', '#9B7CB8'],
    mauve: ['#8F6C9F', '#7F5E9B', '#73558D'],
    gold: ['#E6D2A2', '#DFC28A', '#C5A56D'],
    sparkle: ['#FFFFFF', '#FDF8EC', '#F2E3C6']
  };

  function getParticleCount(): number {
    return window.innerWidth < 768 ? 7 : 14;
  }

  function createParticle(initialY?: number): AmbientParticle {
    const isMobile = window.innerWidth < 768;
    const rand = Math.random();
    let type: AmbientParticle['type'] = 'petal';
    let color: string;
    let size = isMobile ? Math.random() * 4 + 6 : Math.random() * 5 + 7;
    let aspectRatio = 1.3;

    if (rand < 0.40) {
      type = 'petal';
      color = palette.petal[Math.floor(Math.random() * palette.petal.length)];
      aspectRatio = 1.5 + Math.random() * 0.4;
      size = isMobile ? Math.random() * 3 + 6 : Math.random() * 4 + 8;
    } else if (rand < 0.65) {
      type = 'lilac';
      color = palette.lilac[Math.floor(Math.random() * palette.lilac.length)];
      aspectRatio = 0.8 + Math.random() * 0.6;
      size = isMobile ? Math.random() * 3 + 5 : Math.random() * 3.5 + 6;
    } else if (rand < 0.80) {
      type = 'gold';
      color = palette.gold[Math.floor(Math.random() * palette.gold.length)];
      aspectRatio = 1.1 + Math.random() * 0.3;
      size = isMobile ? Math.random() * 2.5 + 4 : Math.random() * 3 + 5;
    } else if (rand < 0.92) {
      type = 'mauve';
      color = palette.mauve[Math.floor(Math.random() * palette.mauve.length)];
      aspectRatio = 0.9 + Math.random() * 0.5;
      size = isMobile ? Math.random() * 2.5 + 5 : Math.random() * 3 + 6;
    } else {
      type = 'sparkle';
      color = palette.sparkle[Math.floor(Math.random() * palette.sparkle.length)];
      aspectRatio = 1.0;
      size = isMobile ? Math.random() * 2 + 3.5 : Math.random() * 3 + 4.5;
    }

    const x = Math.random() * width;
    const y = initialY !== undefined ? initialY : Math.random() * height;

    return {
      x,
      y,
      baseX: x,
      speedY: Math.random() * 0.55 + 0.35, // slow, gentle float (0.35px - 0.90px/frame)
      swayAmplitude: Math.random() * 18 + 10, // 10px - 28px gentle sway
      swayFrequency: Math.random() * 0.0018 + 0.0012,
      swayPhase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.015,
      tilt: Math.random() * Math.PI * 2,
      tiltSpeed: Math.random() * 0.02 + 0.01,
      size,
      aspectRatio,
      color,
      type,
      opacity: type === 'sparkle' ? Math.random() * 0.4 + 0.5 : Math.random() * 0.35 + 0.55
    };
  }

  function resize() {
    if (!canvas || !ctx) return;
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCount = getParticleCount();
    if (particles.length > targetCount) {
      particles = particles.slice(0, targetCount);
    } else {
      while (particles.length < targetCount) {
        particles.push(createParticle());
      }
    }
  }

  function initParticles() {
    const targetCount = getParticleCount();
    particles = [];
    for (let i = 0; i < targetCount; i++) {
      // Distribute evenly across vertical viewport initially so there is no blank delay
      const initialY = (height / targetCount) * i + Math.random() * (height / targetCount);
      particles.push(createParticle(initialY));
    }
  }

  function drawPetal(p: AmbientParticle) {
    if (!ctx) return;
    const w = p.size;
    const h = p.size * p.aspectRatio;
    ctx.beginPath();
    // Organic teardrop curved petal shape
    ctx.moveTo(0, -h / 2);
    ctx.bezierCurveTo(w / 1.8, -h / 4, w / 1.5, h / 3, 0, h / 2);
    ctx.bezierCurveTo(-w / 1.5, h / 3, -w / 1.8, -h / 4, 0, -h / 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawSparkle(p: AmbientParticle) {
    if (!ctx) return;
    const r = p.size;
    ctx.beginPath();
    // Elegant four-pointed wedding star
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, -r, 0);
    ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.closePath();
    ctx.fill();
  }

  function render(time: number) {
    if (!isRunning || !ctx) return;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Vertical drift
      p.y += p.speedY;

      // Gentle horizontal swaying
      const sway = Math.sin(time * p.swayFrequency + p.swayPhase) * p.swayAmplitude;
      p.x = p.baseX + sway;

      p.rotation += p.rotationSpeed;
      p.tilt += p.tiltSpeed;

      // Wrap-around from bottom to top
      if (p.y > height + 24) {
        p.y = -20;
        p.baseX = Math.random() * width;
        p.x = p.baseX;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(1, Math.cos(p.tilt)); // 3D flutter
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.type === 'petal') {
        drawPetal(p);
      } else if (p.type === 'sparkle') {
        drawSparkle(p);
      } else {
        // Confetti flake (lilac, mauve, gold)
        const pw = p.size;
        const ph = p.size * p.aspectRatio;
        ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      }

      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    resize();
    initParticles();
    canvas?.classList.add('active');
    animationFrameId = requestAnimationFrame(render);
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (ctx) ctx.clearRect(0, 0, width, height);
    canvas?.classList.remove('active');
  }

  // Handle visibility / backgrounding: pause to save CPU & battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (isRunning && animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    } else {
      if (isRunning && animationFrameId === null) {
        animationFrameId = requestAnimationFrame(render);
      }
    }
  });

  // Handle resize debounced
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (isRunning) resize();
    }, 150);
  }, { passive: true });

  // Start only after ribbon has opened
  const ribbonOverlay = document.getElementById('ribbon-opening-overlay');
  if (!ribbonOverlay || window.getComputedStyle(ribbonOverlay).display === 'none') {
    // Already opened or absent
    start();
  } else {
    // Wait for ribbon opening event
    window.addEventListener('wedding-ribbon-opened', () => {
      start();
    }, { once: true });
  }
}
