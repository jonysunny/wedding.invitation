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
  let totalHeartPixels = 0;
  let scratchedPixels = 0;
  let moveCounter = 0;

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

  const shimmer = container.querySelector(".scratch-velvet-sheen, .scratch-foil-shimmer") as HTMLElement | null;
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

  // Paint Option 1: Royal Velvet Heart Coating
  function paintCoating() {
    if (!ctx) return;
    resizeCanvas();
    ctx.save();
    
    const w = displayWidth;
    const h = displayHeight;

    // Clip strictly to heart shape
    drawHeartPath(ctx, w, h);
    ctx.clip();

    // 1. Deep Royal Velvet Base Foundation (Rich Lavender / Amethyst Fabric Tonal Blend)
    const baseGrad = ctx.createLinearGradient(w * 0.25, 0, w * 0.75, h);
    baseGrad.addColorStop(0.0, "#8558A7"); // Luminous upper velvet
    baseGrad.addColorStop(0.28, "#724794"); // Rich royal lavender
    baseGrad.addColorStop(0.58, "#5A337A"); // Deep amethyst velvet
    baseGrad.addColorStop(0.85, "#462263"); // Shadowed velvet pile
    baseGrad.addColorStop(1.0, "#35174D"); // Deepest bottom velvet shadow
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Soft Pillowed Cushion Depth (Upholstered 3D Velvet Dome)
    // Primary plush light dome on upper-left lobe
    const lobeLightL = ctx.createRadialGradient(
      w * 0.36, h * 0.30, w * 0.04,
      w * 0.36, h * 0.32, w * 0.42
    );
    lobeLightL.addColorStop(0, "rgba(206, 178, 235, 0.48)"); // Soft plush lilac sheen
    lobeLightL.addColorStop(0.45, "rgba(168, 134, 202, 0.25)");
    lobeLightL.addColorStop(1, "rgba(100, 55, 140, 0)");
    ctx.fillStyle = lobeLightL;
    ctx.fillRect(0, 0, w, h);

    // Secondary plush light dome on upper-right lobe
    const lobeLightR = ctx.createRadialGradient(
      w * 0.68, h * 0.34, w * 0.04,
      w * 0.68, h * 0.36, w * 0.38
    );
    lobeLightR.addColorStop(0, "rgba(196, 168, 226, 0.38)");
    lobeLightR.addColorStop(0.50, "rgba(152, 118, 186, 0.18)");
    lobeLightR.addColorStop(1, "rgba(90, 48, 128, 0)");
    ctx.fillStyle = lobeLightR;
    ctx.fillRect(0, 0, w, h);

    // Subtle lower center plush bounce
    const bounceLight = ctx.createRadialGradient(
      w * 0.50, h * 0.68, w * 0.02,
      w * 0.50, h * 0.68, w * 0.30
    );
    bounceLight.addColorStop(0, "rgba(180, 150, 212, 0.22)");
    bounceLight.addColorStop(1, "rgba(75, 38, 105, 0)");
    ctx.fillStyle = bounceLight;
    ctx.fillRect(0, 0, w, h);

    // 3. Natural Velvet Nap & Fabric Folds (Smooth, Organic Tonal Shifts)
    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    // Nap sweep 1: Gentle diagonal velvet wave across left lobe into center
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.18);
    ctx.bezierCurveTo(w * 0.28, h * 0.26, w * 0.42, h * 0.42, w * 0.52, h * 0.62);
    ctx.bezierCurveTo(w * 0.42, h * 0.64, w * 0.24, h * 0.44, w * 0.10, h * 0.32);
    ctx.closePath();
    const napGrad1 = ctx.createLinearGradient(w * 0.12, h * 0.18, w * 0.52, h * 0.62);
    napGrad1.addColorStop(0, "rgba(225, 204, 246, 0.14)");
    napGrad1.addColorStop(0.5, "rgba(200, 172, 228, 0.08)");
    napGrad1.addColorStop(1, "rgba(135, 95, 170, 0)");
    ctx.fillStyle = napGrad1;
    ctx.fill();

    // Nap sweep 2: Counter soft sweep on right lobe
    ctx.beginPath();
    ctx.moveTo(w * 0.88, h * 0.22);
    ctx.bezierCurveTo(w * 0.72, h * 0.32, w * 0.58, h * 0.46, w * 0.48, h * 0.66);
    ctx.bezierCurveTo(w * 0.56, h * 0.68, w * 0.74, h * 0.48, w * 0.90, h * 0.34);
    ctx.closePath();
    const napGrad2 = ctx.createLinearGradient(w * 0.88, h * 0.22, w * 0.48, h * 0.66);
    napGrad2.addColorStop(0, "rgba(215, 192, 240, 0.12)");
    napGrad2.addColorStop(0.5, "rgba(188, 158, 220, 0.07)");
    napGrad2.addColorStop(1, "rgba(120, 80, 155, 0)");
    ctx.fillStyle = napGrad2;
    ctx.fill();

    // Soft velvet cleft indentation shadow (between the two top lobes)
    const cleftShadow = ctx.createRadialGradient(
      w * 0.50, h * 0.16, 1,
      w * 0.50, h * 0.24, w * 0.18
    );
    cleftShadow.addColorStop(0, "rgba(32, 10, 48, 0.48)");
    cleftShadow.addColorStop(0.55, "rgba(45, 18, 64, 0.22)");
    cleftShadow.addColorStop(1, "rgba(70, 32, 95, 0)");
    ctx.fillStyle = cleftShadow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 4. Velvet Micro-Fiber Pile Texture (Tactile Fabric Weave Grain)
    ctx.save();
    const grainCount = Math.round(w * h * 0.012);
    for (let i = 0; i < grainCount; i++) {
      const gx = Math.random() * w;
      const gy = Math.random() * h;
      const gr = Math.random() * 1.2 + 0.3;
      const isLight = i % 2 === 0;
      ctx.fillStyle = isLight 
        ? `rgba(240, 225, 255, ${Math.random() * 0.045 + 0.015})`
        : `rgba(28, 8, 42, ${Math.random() * 0.055 + 0.02})`;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Plush Velvet Padded Perimeter (Cushioned Pillow Edge Shadow)
    ctx.save();
    ctx.strokeStyle = "rgba(24, 7, 36, 0.48)";
    ctx.lineWidth = 10;
    drawHeartPath(ctx, w, h);
    ctx.stroke();

    ctx.strokeStyle = "rgba(32, 10, 48, 0.30)";
    ctx.lineWidth = 18;
    drawHeartPath(ctx, w, h);
    ctx.stroke();
    ctx.restore();

    // 6. Refined Champagne-Gold Soft Stitched Edge Rim
    // Soft outer warm glow
    ctx.strokeStyle = "rgba(235, 215, 175, 0.28)";
    ctx.lineWidth = 4.0;
    drawHeartPath(ctx, w, h);
    ctx.stroke();

    // Delicate main champagne gold rim
    ctx.strokeStyle = "rgba(215, 190, 145, 0.75)";
    ctx.lineWidth = 1.8;
    drawHeartPath(ctx, w, h);
    ctx.stroke();

    // Fine inner velvet seam hairline
    ctx.strokeStyle = "rgba(245, 230, 200, 0.38)";
    ctx.lineWidth = 0.8;
    drawHeartPath(ctx, w, h);
    ctx.stroke();

    ctx.restore();

    // Count initial solid heart pixels for threshold calculation
    calculateInitialHeartArea();
  }

  function calculateInitialHeartArea() {
    if (!ctx || !canvas) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    totalHeartPixels = 0;
    for (let i = 3; i < imgData.length; i += 16) { // sample every 4th pixel
      if (imgData[i] > 100) {
        totalHeartPixels++;
      }
    }
  }

  function checkScratchPercentage() {
    if (isRevealed || !ctx || !canvas || totalHeartPixels === 0) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let solidPixels = 0;
    for (let i = 3; i < imgData.length; i += 16) {
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
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    
    // Smooth scratch brush scaled with display width
    const brushRadius = Math.max(26, Math.round(displayWidth * 0.085));

    ctx.lineWidth = brushRadius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.restore();
  }

  function eraseCircle(x: number, y: number) {
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    
    // Smooth scratch brush scaled with display width
    const brushRadius = Math.max(26, Math.round(displayWidth * 0.085));
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.beginPath();
    ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function getCanvasCoords(e: PointerEvent): { x: number; y: number } {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function onPointerDown(e: PointerEvent) {
    if (isRevealed) return;
    isDrawing = true;
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
    moveCounter++;
    if (moveCounter % 4 === 0) {
      checkScratchPercentage();
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (!isDrawing) return;
    isDrawing = false;
    try {
      canvas?.releasePointerCapture(e.pointerId);
    } catch {}
    checkScratchPercentage();
  }

  // Pointer Events Registration (clean up previous if any)
  canvas.onpointerdown = onPointerDown;
  canvas.onpointermove = onPointerMove;
  canvas.onpointerup = onPointerUp;
  canvas.onpointercancel = onPointerUp;

  // Accessible Fallback Button (if present in DOM)
  if (accessibleBtn) {
    accessibleBtn.addEventListener("click", () => {
      completeReveal(false);
    });
  }

  // Paint the initial coating
  paintCoating();
}