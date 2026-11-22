// Scratch to Reveal Date Handler

export function initScratchCard() {
  const container = document.getElementById("scratch-card-container");
  const canvas = document.getElementById("scratch-canvas") as HTMLCanvasElement | null;
  const instructionPill = document.getElementById("scratch-instruction-pill");
  const accessibleBtn = document.getElementById("reveal-date-accessible-btn");

  if (!canvas || !container) return;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  let isDrawing = false;
  let isRevealed = false;
  let hasStartedScratching = false;
  let totalHeartPixels = 0;
  let scratchedPixels = 0;
  let moveCounter = 0;

  // Preload photorealistic Luxury Lavender Silk texture
  const silkImg = new Image();
  silkImg.src = "/wedding.invitation/assets/decorations/lavender-silk-texture.jpg";
  silkImg.onload = () => {
    if (!isRevealed && !hasStartedScratching) {
      paintCoating();
    }
  };

  // Dynamic responsive canvas dimensions matching the heart container
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let displayWidth = 340;
  let displayHeight = 320;

  // Always ensure clean reset on page refresh / load: do not persist scratch state
  try {
    sessionStorage.removeItem("wedding_scratch_revealed");
    localStorage.removeItem("wedding_scratch_revealed");
  } catch {}

  // Explicitly ensure DOM elements start in the pristine unrevealed state
  container.setAttribute("data-revealed", "false");
  canvas.style.display = "block";
  canvas.style.opacity = "1";
  canvas.style.transform = "none";
  canvas.style.pointerEvents = "auto";
  canvas.style.transition = "none";

  const shimmer = container.querySelector(".scratch-silk-sheen, .scratch-velvet-sheen, .scratch-foil-shimmer") as HTMLElement | null;
  if (shimmer) {
    shimmer.style.opacity = "";
    shimmer.style.display = "";
  }

  if (instructionPill) {
    instructionPill.style.display = "";
    instructionPill.style.opacity = "";
    instructionPill.style.pointerEvents = "";
  }

  if (accessibleBtn) {
    accessibleBtn.style.display = "";
  }

  function completeReveal(immediate: boolean = false) {
    if (isRevealed) return;
    isRevealed = true;
    container.setAttribute("data-revealed", "true");

    if (shimmer) {
      shimmer.style.opacity = "0";
      shimmer.style.pointerEvents = "none";
    }

    if (canvas) {
      if (immediate) {
        canvas.style.display = "none";
      } else {
        canvas.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        canvas.style.opacity = "0";
        canvas.style.transform = "scale(1.05)";
        canvas.style.pointerEvents = "none";
      }
    }

    if (instructionPill) {
      instructionPill.style.display = "none";
    }

    if (accessibleBtn) {
      accessibleBtn.style.display = "none";
    }

    // DISPATCH CRITICAL EVENT TO WAKE UP LIVE WEDDING COUNTDOWN (4:00 PM IST)
    console.log("Date successfully revealed! Dispatching 'wedding-date-revealed' event...");
    window.dispatchEvent(new CustomEvent("wedding-date-revealed", {
      detail: {
        date: "2026-12-29T16:00:00+05:30",
        formatted: "Tuesday, 29 December 2026"
      }
    }));

    // Trigger one-time elegant paper-confetti celebration around the heart
    if (!immediate) {
      triggerPaperConfetti();
    }
  }

  function triggerPaperConfetti() {
    if (typeof window === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const confettiCanvas = document.getElementById("scratch-confetti-canvas") as HTMLCanvasElement | null;
    if (!confettiCanvas) return;

    const ctx = confettiCanvas.getContext("2d");
    if (!ctx) return;

    const rect = confettiCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = rect.width || 600;
    const h = rect.height || 480;
    confettiCanvas.width = w * dpr;
    confettiCanvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2;
    const cy = h / 2 - 12;
    const radiusX = Math.min(w * 0.28, 165);
    const radiusY = radiusX * 0.9;

    // Small paper pieces in champagne gold, lavender, dusty lilac, mauve, and pure ivory
    const colors = [
      "#C5A56D", // Champagne Gold
      "#E2CA92", // Warm Soft Gold
      "#D8C4EC", // Soft Lavender
      "#BEA6D6", // Dusty Lilac
      "#9B7CB8", // Mauve
      "#73558D", // Deep Lavender
      "#FFFDF8", // Pure Ivory
      "#F7F2FD"  // Light Lavender Paper
    ];

    interface PaperParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      w: number;
      h: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      tilt: number;
      tiltSpeed: number;
    }

    const particleCount = 70;
    const particles: PaperParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Distribute evenly along heart perimeter so confetti bursts outward around the heart
      const t = (i / particleCount) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

      const startX = cx + (hx / 16) * radiusX;
      const startY = cy + (hy / 16) * radiusY;

      // Radial burst outwards away from heart center
      const angle = Math.atan2(startY - cy, startX - cx);
      const speed = Math.random() * 3.6 + 2.2;
      const vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 1.2;
      const vy = Math.sin(angle) * speed - (Math.random() * 1.6 + 0.6); // slight upward lift

      particles.push({
        x: startX,
        y: startY,
        vx,
        vy,
        w: Math.random() * 3.5 + 4.5, // 4.5px - 8px width
        h: Math.random() * 5 + 6,     // 6px - 11px length
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.12,
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: Math.random() * 0.08 + 0.04
      });
    }

    const startTime = performance.now();
    const duration = 2000; // 2.0s duration

    function render(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, w, h);

      // Fade out smoothly during final 600ms
      const alpha = progress > 0.7 ? Math.max(0, 1 - (progress - 0.7) / 0.3) : 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Air drag + gentle floating gravity
        p.vx *= 0.965;
        p.vy = p.vy * 0.975 + 0.10;
        p.x += p.vx;
        p.y += p.vy;

        p.rotation += p.rotationSpeed;
        p.tilt += p.tiltSpeed;

        if (alpha <= 0) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(1, Math.cos(p.tilt)); // 3D paper flutter flipping
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (progress < 1) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    }

    requestAnimationFrame(render);
  }

  function resizeCanvas() {
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      displayWidth = Math.round(rect.width);
      displayHeight = Math.round(rect.height);
    } else {
      displayWidth = Math.min(Math.round(window.innerWidth * 0.82), 380);
      displayHeight = Math.round(displayWidth * (320 / 340));
    }

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Draw heart path matching the SVG clip-path exactly (0..1 normalized curve scaled to w x h)
  function drawHeartPath(context: CanvasRenderingContext2D, w: number, h: number) {
    context.beginPath();
    context.moveTo(w * 0.5, h * 0.16);
    // top-left lobe
    context.bezierCurveTo(w * 0.5, h * 0.05, w * 0.35, 0, w * 0.24, 0);
    context.bezierCurveTo(w * 0.10, 0, 0, h * 0.12, 0, h * 0.28);
    // left edge to bottom tip
    context.bezierCurveTo(0, h * 0.52, w * 0.33, h * 0.74, w * 0.5, h * 0.98);
    // bottom tip to right edge
    context.bezierCurveTo(w * 0.67, h * 0.74, w * 1.0, h * 0.52, w * 1.0, h * 0.28);
    // top-right lobe back to center
    context.bezierCurveTo(w * 1.0, h * 0.12, w * 0.90, 0, w * 0.76, 0);
    context.bezierCurveTo(w * 0.65, 0, w * 0.5, h * 0.05, w * 0.5, h * 0.16);
    context.closePath();
  }

  // Paint Luxury Lavender Silk / Satin Heart Coating
  function paintCoating() {
    if (!ctx) return;
    resizeCanvas();
    ctx.save();
    
    const w = displayWidth;
    const h = displayHeight;

    // Clip strictly to heart shape
    drawHeartPath(ctx, w, h);
    ctx.clip();

    // 1. Fully Opaque Lavender Silk Foundation Gradient (100% opaque, immediate coverage)
    // Palette: Highlight #DED0F0, Main #C5AFE0, Lilac #AD91C9, Soft shadow #9474B2
    const silkGrad = ctx.createLinearGradient(0, 0, w, h);
    silkGrad.addColorStop(0.0, "#E8DCF8"); // Luminous upper-left silk reflection
    silkGrad.addColorStop(0.20, "#DED0F0"); // Silk highlight
    silkGrad.addColorStop(0.52, "#C5AFE0"); // Main luxurious lavender
    silkGrad.addColorStop(0.80, "#AD91C9"); // Lilac fold transition
    silkGrad.addColorStop(1.0, "#9474B2");  // Soft shadow
    ctx.fillStyle = silkGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Render Realistic Lavender Silk Texture Artwork (if loaded)
    if (silkImg.complete && silkImg.naturalWidth > 0) {
      ctx.drawImage(silkImg, 0, 0, w, h);

      // Subtle upper-left soft lighting accent to enhance 3D fullness and match ribbon lighting
      const silkLightAccent = ctx.createRadialGradient(
        w * 0.35, h * 0.28, w * 0.04,
        w * 0.35, h * 0.28, w * 0.45
      );
      silkLightAccent.addColorStop(0, "rgba(255, 255, 255, 0.20)");
      silkLightAccent.addColorStop(0.5, "rgba(238, 225, 252, 0.08)");
      silkLightAccent.addColorStop(1, "rgba(197, 175, 224, 0)");
      ctx.fillStyle = silkLightAccent;
      ctx.fillRect(0, 0, w, h);
    } else {
      // Procedural natural silky reflections and subtle 3D depth from upper-left
      const lobeLightL = ctx.createRadialGradient(
        w * 0.35, h * 0.28, w * 0.04,
        w * 0.35, h * 0.28, w * 0.40
      );
      lobeLightL.addColorStop(0, "rgba(255, 255, 255, 0.32)");
      lobeLightL.addColorStop(0.5, "rgba(222, 208, 240, 0.14)");
      lobeLightL.addColorStop(1, "rgba(173, 145, 201, 0)");
      ctx.fillStyle = lobeLightL;
      ctx.fillRect(0, 0, w, h);

      const lobeLightR = ctx.createRadialGradient(
        w * 0.68, h * 0.32, w * 0.04,
        w * 0.68, h * 0.32, w * 0.36
      );
      lobeLightR.addColorStop(0, "rgba(245, 235, 255, 0.22)");
      lobeLightR.addColorStop(0.5, "rgba(215, 195, 238, 0.10)");
      lobeLightR.addColorStop(1, "rgba(173, 145, 201, 0)");
      ctx.fillStyle = lobeLightR;
      ctx.fillRect(0, 0, w, h);
    }

    // 3. Smooth, subtle edge depth (Natural soft rim - NO gold, NO heavy borders)
    ctx.strokeStyle = "rgba(148, 116, 178, 0.22)";
    ctx.lineWidth = 1.6;
    drawHeartPath(ctx, w, h);
    ctx.stroke();

    // Delicate upper silk highlight edge
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h * 0.45);
    ctx.clip();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.0;
    drawHeartPath(ctx, w, h);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Count initial solid heart pixels for threshold calculation
    // Count initial solid heart pixels using low-res offscreen sample mask
    initSampleMask();
  }

  // Low-resolution offscreen sampling canvas (68x64) for near-instant 99% faster completion checks
  const SAMPLE_W = 68;
  const SAMPLE_H = 64;
  let sampleCanvas: HTMLCanvasElement | null = null;
  let sampleCtx: CanvasRenderingContext2D | null = null;

  function initSampleMask() {
    if (!sampleCanvas) {
      sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = SAMPLE_W;
      sampleCanvas.height = SAMPLE_H;
      sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    }
    if (!sampleCtx) return;

    sampleCtx.clearRect(0, 0, SAMPLE_W, SAMPLE_H);
    sampleCtx.save();
    sampleCtx.fillStyle = "#FFFFFF";
    drawHeartPath(sampleCtx, SAMPLE_W, SAMPLE_H);
    sampleCtx.fill();
    sampleCtx.restore();

    // Count initial heart pixels on sample mask
    const imgData = sampleCtx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
    totalHeartPixels = 0;
    for (let i = 3; i < imgData.length; i += 4) {
      if (imgData[i] > 100) {
        totalHeartPixels++;
      }
    }
  }

  let lastCheckTime = 0;
  function checkScratchPercentage(force = false) {
    if (isRevealed || !sampleCtx || totalHeartPixels === 0) return;
    const now = performance.now();
    // Throttle checks to at most once every 120ms during active dragging, unless forced on pointerup
    if (!force && now - lastCheckTime < 120) return;
    lastCheckTime = now;

    const imgData = sampleCtx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
    let solidPixels = 0;
    for (let i = 3; i < imgData.length; i += 4) {
      if (imgData[i] > 80) {
        solidPixels++;
      }
    }
    const percentCleared = 1 - solidPixels / totalHeartPixels;

    // Trigger reveal when user has scratched 40% of the heart
    if (percentCleared >= 0.40) {
      completeReveal(false);
    }
  }

  let lastX = 0;
  let lastY = 0;

  function erasePath(x1: number, y1: number, x2: number, y2: number) {
    if (!ctx) return;
    const brushRadius = Math.max(26, Math.round(displayWidth * 0.085));

    // 1. Erase on primary display canvas
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = brushRadius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();

    // 2. Mirror erase on sample mask for fast completion checking
    if (sampleCtx) {
      const scaleX = SAMPLE_W / displayWidth;
      const scaleY = SAMPLE_H / displayHeight;
      const sampleBrushRadius = brushRadius * scaleX;

      sampleCtx.save();
      sampleCtx.globalCompositeOperation = "destination-out";
      sampleCtx.lineWidth = sampleBrushRadius * 2;
      sampleCtx.lineCap = "round";
      sampleCtx.lineJoin = "round";
      sampleCtx.beginPath();
      sampleCtx.moveTo(x1 * scaleX, y1 * scaleY);
      sampleCtx.lineTo(x2 * scaleX, y2 * scaleY);
      sampleCtx.stroke();
      sampleCtx.restore();
    }
  }

  function eraseCircle(x: number, y: number) {
    if (!ctx) return;
    const brushRadius = Math.max(26, Math.round(displayWidth * 0.085));

    // 1. Primary display canvas
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Sample mask
    if (sampleCtx) {
      const scaleX = SAMPLE_W / displayWidth;
      const scaleY = SAMPLE_H / displayHeight;
      const sampleBrushRadius = brushRadius * scaleX;

      sampleCtx.save();
      sampleCtx.globalCompositeOperation = "destination-out";
      sampleCtx.fillStyle = "rgba(0,0,0,1)";
      sampleCtx.beginPath();
      sampleCtx.arc(x * scaleX, y * scaleY, sampleBrushRadius, 0, Math.PI * 2);
      sampleCtx.fill();
      sampleCtx.restore();
    }
  }

  // Cached canvas bounding rectangle to avoid layout thrashing during finger movement
  let cachedCanvasRect: DOMRect | null = null;

  function updateCanvasRect() {
    if (canvas) {
      cachedCanvasRect = canvas.getBoundingClientRect();
    }
  }

  function getCanvasCoords(e: PointerEvent): { x: number; y: number } {
    if (!cachedCanvasRect) {
      updateCanvasRect();
    }
    const rect = cachedCanvasRect || { left: 0, top: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function onPointerDown(e: PointerEvent) {
    if (isRevealed) return;
    isDrawing = true;
    hasStartedScratching = true;
    updateCanvasRect();

    try {
      canvas?.setPointerCapture(e.pointerId);
    } catch {}

    if (instructionPill) {
      instructionPill.style.opacity = "0";
      instructionPill.style.pointerEvents = "none";
    }

    const coords = getCanvasCoords(e);
    lastX = coords.x;
    lastY = coords.y;
    eraseCircle(coords.x, coords.y);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDrawing || isRevealed) return;
    const coords = getCanvasCoords(e);
    erasePath(lastX, lastY, coords.x, coords.y);
    eraseCircle(coords.x, coords.y);
    lastX = coords.x;
    lastY = coords.y;
    checkScratchPercentage(false);
  }

  function onPointerUp(e: PointerEvent) {
    if (!isDrawing) return;
    isDrawing = false;
    try {
      canvas?.releasePointerCapture(e.pointerId);
    } catch {}
    checkScratchPercentage(true);
  }

  function onPointerCancel(e: PointerEvent) {
    if (!isDrawing) return;
    isDrawing = false;
    try {
      canvas?.releasePointerCapture(e.pointerId);
    } catch {}
  }

  // Update cached rect on window scroll / resize
  window.addEventListener("scroll", () => { cachedCanvasRect = null; }, { passive: true });
  window.addEventListener("resize", () => { cachedCanvasRect = null; }, { passive: true });

  // Pointer Events Registration (clean up previous if any)
  canvas.style.touchAction = "none";
  canvas.onpointerdown = onPointerDown;
  canvas.onpointermove = onPointerMove;
  canvas.onpointerup = onPointerUp;
  canvas.onpointercancel = onPointerCancel;

  // Accessible Fallback Button (if present in DOM)
  if (accessibleBtn) {
    accessibleBtn.addEventListener("click", () => {
      completeReveal(false);
    });
  }

  // Paint the initial coating
  paintCoating();
}