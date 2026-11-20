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

  const shimmer = container.querySelector(".scratch-foil-shimmer") as HTMLElement | null;
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

  // Draw inner inset heart outline for delicate double-rim styling
  function drawInnerHeartPath(context: CanvasRenderingContext2D, w: number, h: number, scale: number = 0.88) {
    context.save();
    context.translate(w * 0.5, h * 0.46);
    context.scale(scale, scale);
    context.translate(-w * 0.5, -h * 0.46);
    drawHeartPath(context, w, h);
    context.restore();
  }

  // Draw embossed botanical floral vine & damask filigree pattern
  function drawEmbossedFloralPatterns(context: CanvasRenderingContext2D, w: number, h: number) {
    const cx = w * 0.5;
    const cy = h * 0.43;

    function renderFloralPass(color: string, ox: number, oy: number, lineWidth: number = 1.4) {
      context.save();
      context.translate(ox, oy);
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.lineCap = "round";
      context.lineJoin = "round";

      // 1. Symmetrical Top Vine Flourishes curving from center dip into lobes
      // Left lobe vine
      context.beginPath();
      context.moveTo(cx - w * 0.04, h * 0.20);
      context.bezierCurveTo(cx - w * 0.14, h * 0.12, cx - w * 0.30, h * 0.13, cx - w * 0.30, h * 0.25);
      context.bezierCurveTo(cx - w * 0.30, h * 0.34, cx - w * 0.18, h * 0.35, cx - w * 0.14, h * 0.29);
      context.stroke();

      // Left lobe leaves
      context.beginPath();
      context.moveTo(cx - w * 0.22, h * 0.15);
      context.quadraticCurveTo(cx - w * 0.27, h * 0.10, cx - w * 0.23, h * 0.07);
      context.quadraticCurveTo(cx - w * 0.19, h * 0.10, cx - w * 0.22, h * 0.15);
      context.stroke();

      context.beginPath();
      context.moveTo(cx - w * 0.28, h * 0.22);
      context.quadraticCurveTo(cx - w * 0.35, h * 0.17, cx - w * 0.38, h * 0.14);
      context.stroke();

      // Right lobe vine
      context.beginPath();
      context.moveTo(cx + w * 0.04, h * 0.20);
      context.bezierCurveTo(cx + w * 0.14, h * 0.12, cx + w * 0.30, h * 0.13, cx + w * 0.30, h * 0.25);
      context.bezierCurveTo(cx + w * 0.30, h * 0.34, cx + w * 0.18, h * 0.35, cx + w * 0.14, h * 0.29);
      context.stroke();

      // Right lobe leaves
      context.beginPath();
      context.moveTo(cx + w * 0.22, h * 0.15);
      context.quadraticCurveTo(cx + w * 0.27, h * 0.10, cx + w * 0.23, h * 0.07);
      context.quadraticCurveTo(cx + w * 0.19, h * 0.10, cx + w * 0.22, h * 0.15);
      context.stroke();

      context.beginPath();
      context.moveTo(cx + w * 0.28, h * 0.22);
      context.quadraticCurveTo(cx + w * 0.35, h * 0.17, cx + w * 0.38, h * 0.14);
      context.stroke();

      // 2. Central Floral Medallion Flourish (Delicate 4-petal royal crest motif)
      const mr = w * 0.055;
      context.beginPath();
      context.moveTo(cx, cy - mr * 1.4);
      context.bezierCurveTo(cx - mr * 0.9, cy - mr * 0.9, cx - mr * 1.4, cy, cx, cy + mr * 1.4);
      context.bezierCurveTo(cx + mr * 1.4, cy, cx + mr * 0.9, cy - mr * 0.9, cx, cy - mr * 1.4);
      context.stroke();

      context.beginPath();
      context.moveTo(cx - mr * 1.4, cy);
      context.bezierCurveTo(cx - mr * 0.9, cy - mr * 0.9, cx, cy - mr * 1.4, cx + mr * 1.4, cy);
      context.bezierCurveTo(cx, cy + mr * 1.4, cx - mr * 0.9, cy + mr * 0.9, cx - mr * 1.4, cy);
      context.stroke();

      // 3. Lower V-Stem Vines converging gently toward bottom tip
      context.beginPath();
      context.moveTo(cx - w * 0.22, h * 0.44);
      context.bezierCurveTo(cx - w * 0.16, h * 0.58, cx - w * 0.08, h * 0.70, cx, h * 0.84);
      context.stroke();

      context.beginPath();
      context.moveTo(cx + w * 0.22, h * 0.44);
      context.bezierCurveTo(cx + w * 0.16, h * 0.58, cx + w * 0.08, h * 0.70, cx, h * 0.84);
      context.stroke();

      // Tiny lower lateral leaf sprigs
      context.beginPath();
      context.moveTo(cx - w * 0.14, h * 0.54);
      context.quadraticCurveTo(cx - w * 0.20, h * 0.56, cx - w * 0.22, h * 0.52);
      context.stroke();

      context.beginPath();
      context.moveTo(cx + w * 0.14, h * 0.54);
      context.quadraticCurveTo(cx + w * 0.20, h * 0.56, cx + w * 0.22, h * 0.52);
      context.stroke();

      context.restore();
    }

    // Shadow pass (creates 3D physical pressed depth)
    renderFloralPass("rgba(68, 38, 92, 0.40)", 1.2, 1.2, 1.6);
    // Specular highlight pass (creates metallic edge reflection)
    renderFloralPass("rgba(255, 255, 255, 0.48)", -1.0, -1.0, 1.4);
    // Champagne gold center inlay pass
    renderFloralPass("rgba(226, 202, 146, 0.70)", 0, 0, 1.0);
  }

  // Paint luxury lavender metallic-foil coating with embossed floral filigree
  function paintCoating() {
    if (!ctx) return;
    resizeCanvas();
    ctx.save();
    
    // Clip strictly to heart shape
    drawHeartPath(ctx, displayWidth, displayHeight);
    ctx.clip();

    // 1. Multi-stop Lavender Metallic-Foil Base Gradient
    // Radial glow originating from upper center for rich metallic dome reflection
    const radGrad = ctx.createRadialGradient(
      displayWidth * 0.48, displayHeight * 0.32, displayWidth * 0.05,
      displayWidth * 0.50, displayHeight * 0.45, displayWidth * 0.65
    );
    radGrad.addColorStop(0, "#F7EEFE");    // Shimmering Soft Lilac Gleam
    radGrad.addColorStop(0.22, "#E8D5F6"); // Polished Lilac Foil
    radGrad.addColorStop(0.46, "#C8ACDE"); // Dusty Mauve
    radGrad.addColorStop(0.70, "#9C77B7"); // Rich Royal Lavender
    radGrad.addColorStop(0.88, "#765093"); // Deep Lavender
    radGrad.addColorStop(1.0, "#5A3777");  // Velvet Mauve Shadow Border

    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // 2. Subtle diagonal champagne-gold metallic luster sheen bands
    ctx.fillStyle = "rgba(243, 226, 185, 0.16)";
    for (let x = -displayWidth; x < displayWidth * 2; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 28, 0);
      ctx.lineTo(x + displayHeight + 28, displayHeight);
      ctx.lineTo(x + displayHeight, displayHeight);
      ctx.fill();
    }

    // 3. Subtle embossed floral relief patterns & ornamental filigree
    drawEmbossedFloralPatterns(ctx, displayWidth, displayHeight);

    // 4. Delicate inner inset champagne-gold filigree heart outline
    ctx.strokeStyle = "rgba(226, 202, 146, 0.78)";
    ctx.lineWidth = 1.2;
    drawInnerHeartPath(ctx, displayWidth, displayHeight, 0.88);
    ctx.stroke();

    // 5. Center ornamental gold pistil pearl
    ctx.fillStyle = "rgba(235, 215, 165, 0.95)";
    ctx.beginPath();
    ctx.arc(displayWidth * 0.5, displayHeight * 0.43, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Fine micro-foil sparkle speckles (delicate champagne gold and starlight white)
    for (let i = 0; i < 260; i++) {
      const sx = Math.random() * displayWidth;
      const sy = Math.random() * displayHeight;
      const sr = Math.random() * 1.5 + 0.35;
      const alpha = Math.random() * 0.7 + 0.25;
      ctx.fillStyle = i % 3 === 0 
        ? `rgba(226, 202, 146, ${alpha})` 
        : (i % 3 === 1 ? `rgba(255, 255, 255, ${alpha})` : `rgba(220, 200, 242, ${alpha})`);
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Outer champagne-gold primary heart rim
    ctx.strokeStyle = "rgba(197, 165, 109, 0.95)";
    ctx.lineWidth = 3.5;
    drawHeartPath(ctx, displayWidth, displayHeight);
    ctx.stroke();

    // 8. Outer delicate highlight hairline
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 0.8;
    drawHeartPath(ctx, displayWidth, displayHeight);
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