// Event-Driven Live Wedding Countdown & Dynamic Post-Wedding Experience
// Manages the 3 distinct states:
// 1. Before 2026-12-29T16:00:00+05:30: Live 4-ring countdown
// 2. 2026-12-29T16:00:00+05:30 to 2026-12-30T00:00:00+05:30: "It's Our Special Day!"
// 3. From 2026-12-30T00:00:00+05:30 onwards: "Oops! You're Too Late! We're Married!"

export const WEDDING_START_ISO = "2026-12-29T16:00:00+05:30";
export const WEDDING_END_ISO = "2026-12-30T00:00:00+05:30";

export const WEDDING_START_EPOCH = Date.parse(WEDDING_START_ISO); // 1798540200000
export const WEDDING_END_EPOCH = Date.parse(WEDDING_END_ISO);     // 1798569000000

const RING_CIRCUMFERENCE = 263.89; // 2 * Math.PI * 42

export type CountdownState = "countdown" | "special-day" | "married";

export function getCountdownState(now: number): CountdownState {
  if (now < WEDDING_START_EPOCH) {
    return "countdown";
  } else if (now < WEDDING_END_EPOCH) {
    return "special-day";
  } else {
    return "married";
  }
}

function getCurrentTime(): number {
  if (typeof window !== "undefined" && (window as any).__MOCK_TIME__ !== undefined) {
    return Number((window as any).__MOCK_TIME__);
  }
  return Date.now();
}

function setRingProgress(el: HTMLElement | null, ratio: number) {
  if (!el) return;
  const clamped = Math.max(0, Math.min(1, ratio));
  // At ratio = 1 (full), offset = 0; at ratio = 0 (empty), offset = RING_CIRCUMFERENCE
  const offset = RING_CIRCUMFERENCE * (1 - clamped);
  el.style.strokeDashoffset = offset.toFixed(2);
}

function triggerCelebratoryConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const canvas = document.getElementById("countdown-confetti-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const section = document.getElementById("countdown-section");
  const rect = section?.getBoundingClientRect() || canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = rect.width || window.innerWidth;
  const h = rect.height || window.innerHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colors = [
    "#C5A56D", // Champagne Gold
    "#E2CA92", // Warm Soft Gold
    "#D8C4EC", // Soft Lavender
    "#BEA6D6", // Dusty Lilac
    "#9B7CB8", // Mauve
    "#73558D", // Deep Lavender
    "#FFFDF8"  // Ivory
  ];

  interface ConfettiParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    wobble: number;
    wobbleSpeed: number;
  }

  const particles: ConfettiParticle[] = [];
  const count = 55;
  const cx = w / 2;
  const cy = h / 2 - 20;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const speed = Math.random() * 3.8 + 1.8;
    particles.push({
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.8,
      size: Math.random() * 6 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 6,
      opacity: 1,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.08 + 0.04
    });
  }

  let startTime = performance.now();
  const duration = 2800; // 2.8 seconds

  function animate(nowTime: number) {
    const elapsed = nowTime - startTime;
    if (elapsed > duration) {
      ctx?.clearRect(0, 0, w, h);
      return;
    }

    ctx?.clearRect(0, 0, w, h);

    const fadeFactor = elapsed > 1800 ? Math.max(0, 1 - (elapsed - 1800) / 1000) : 1;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gentle gravity
      p.vx *= 0.985; // air resistance
      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      const currentOpacity = p.opacity * fadeFactor;
      if (currentOpacity <= 0) continue;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.scale(Math.cos(p.wobble), 1);
      ctx!.globalAlpha = currentOpacity;
      ctx!.fillStyle = p.color;

      ctx!.beginPath();
      if (typeof ctx!.roundRect === "function") {
        ctx!.roundRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65, 2);
      } else {
        ctx!.rect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
      }
      ctx!.fill();
      ctx!.restore();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

export function setupCountdownListener(defaultIsoDate: string = WEDDING_START_ISO) {
  const section = document.getElementById("countdown-section");
  const daysEl = document.getElementById("countdown-days");
  const hoursEl = document.getElementById("countdown-hours");
  const minsEl = document.getElementById("countdown-mins");
  const secsEl = document.getElementById("countdown-secs");

  const panelTimer = document.getElementById("countdown-state-timer");
  const panelSpecialDay = document.getElementById("countdown-state-special-day");
  const panelMarried = document.getElementById("countdown-state-married");

  const ringDays = document.getElementById("ring-days-meter");
  const ringHours = document.getElementById("ring-hours-meter");
  const ringMins = document.getElementById("ring-mins-meter");
  const ringSecs = document.getElementById("ring-secs-meter");

  if (!section) return;

  let countdownInterval: ReturnType<typeof setInterval> | null = null;
  let isActive = false;
  let currentState: CountdownState | null = null;
  let hasCelebratedSpecialDay = false;

  function updateDigit(el: HTMLElement, val: string) {
    if (el.textContent !== val) {
      el.textContent = val;
      el.classList.remove("digit-tick");
      void el.offsetWidth;
      el.classList.add("digit-tick");
    }
  }

  function applyState(newState: CountdownState, triggerConfetti: boolean = false) {
    const isStateChange = currentState !== newState;
    currentState = newState;

    if (panelTimer) panelTimer.style.display = newState === "countdown" ? "block" : "none";
    if (panelSpecialDay) panelSpecialDay.style.display = newState === "special-day" ? "block" : "none";
    if (panelMarried) panelMarried.style.display = newState === "married" ? "block" : "none";

    if (newState === "special-day" && triggerConfetti && !hasCelebratedSpecialDay) {
      hasCelebratedSpecialDay = true;
      triggerCelebratoryConfetti();
    }
  }

  function startCountdown() {
    if (isActive) return;
    isActive = true;

    // Reveal the countdown section with smooth entrance
    section!.classList.remove("countdown-dormant");
    section!.classList.add("countdown-active");
    section!.setAttribute("aria-hidden", "false");

    function tick() {
      const now = getCurrentTime();
      const state = getCountdownState(now);

      if (state === "countdown") {
        applyState("countdown", false);
        const distance = Math.max(0, WEDDING_START_EPOCH - now);

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (daysEl) updateDigit(daysEl, String(days).padStart(2, "0"));
        if (hoursEl) updateDigit(hoursEl, String(hours).padStart(2, "0"));
        if (minsEl) updateDigit(minsEl, String(minutes).padStart(2, "0"));
        if (secsEl) updateDigit(secsEl, String(seconds).padStart(2, "0"));

        setRingProgress(ringSecs, seconds / 60);
        setRingProgress(ringMins, minutes / 60);
        setRingProgress(ringHours, hours / 24);
        setRingProgress(ringDays, Math.min(1, days / 365));
      } else if (state === "special-day") {
        applyState("special-day", true);
      } else {
        applyState("married", false);
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      }
    }

    tick();
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(tick, 1000);
  }

  // Ensure storage is clear and countdown always starts dormant on page load/refresh
  try {
    sessionStorage.removeItem("wedding_scratch_revealed");
    localStorage.removeItem("wedding_scratch_revealed");
  } catch {}

  section.classList.add("countdown-dormant");
  section.classList.remove("countdown-active");
  section.setAttribute("aria-hidden", "true");

  // Listener for scratch-completion event: reveals countdown smoothly
  window.addEventListener("wedding-date-revealed", () => {
    startCountdown();
  }, { once: true });
}