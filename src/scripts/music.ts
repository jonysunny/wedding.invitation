// Global singleton reference to prevent duplicate instances
let globalAudio: HTMLAudioElement | null = null;
let globalController: { play: () => Promise<void>; pause: () => void; toggle: () => void; isPlaying: () => boolean } | null = null;

const TARGET_VOLUME = 0.45; // Comfortable wedding background music volume
export const SILENCE_TRIM_OFFSET = 0.46; // Skip initial 0.46s digital silence so piano note begins immediately

export function initMusic(audioSrc?: string) {
  if (globalController) {
    return globalController;
  }

  // Bind directly to the preloaded DOM audio element, or fallback to new Audio
  const audio = (document.getElementById("wedding-bgm-audio") as HTMLAudioElement) || new Audio(audioSrc || "/wedding.invitation/audio/jony-sunny-new-bgm.mp3");
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = TARGET_VOLUME;
  if (audioSrc && !audio.src) {
    audio.src = audioSrc;
  }
  globalAudio = audio;
  (window as any).__weddingAudio = audio;

  // Prime start time past the leading silence as soon as audio metadata loads
  const primeStartTime = () => {
    if (audio.currentTime < SILENCE_TRIM_OFFSET) {
      try {
        audio.currentTime = SILENCE_TRIM_OFFSET;
      } catch (e) {}
    }
  };

  if (audio.readyState >= 1) {
    primeStartTime();
  } else {
    audio.addEventListener("loadedmetadata", primeStartTime, { passive: true });
    audio.addEventListener("canplay", primeStartTime, { passive: true });
  }

  // When audio loops back to beginning, ensure it skips leading digital silence
  audio.addEventListener("timeupdate", () => {
    if (!audio.paused && audio.currentTime < SILENCE_TRIM_OFFSET) {
      try {
        audio.currentTime = SILENCE_TRIM_OFFSET;
      } catch (e) {}
    }
  }, { passive: true });

  const toggleBtn = document.getElementById("music-toggle-btn");
  const iconPlaying = document.getElementById("music-icon-playing");
  const iconMuted = document.getElementById("music-icon-muted");

  let isPlaying = !audio.paused;

  function updateUI() {
    isPlaying = !audio.paused;
    if (isPlaying) {
      toggleBtn?.classList.remove("spin-paused");
      toggleBtn?.setAttribute("aria-pressed", "true");
      toggleBtn?.setAttribute("aria-label", "Pause wedding background music");
      if (iconPlaying) iconPlaying.style.display = "block";
      if (iconMuted) iconMuted.style.display = "none";
    } else {
      toggleBtn?.classList.add("spin-paused");
      toggleBtn?.setAttribute("aria-pressed", "false");
      toggleBtn?.setAttribute("aria-label", "Play wedding background music");
      if (iconPlaying) iconPlaying.style.display = "none";
      if (iconMuted) iconMuted.style.display = "block";
    }
  }

  // React to native audio play/pause events directly
  audio.addEventListener("play", updateUI);
  audio.addEventListener("pause", updateUI);
  audio.addEventListener("playing", updateUI);

  async function playAudio(withFade = false) {
    if (!audio.paused) return;
    try {
      if (audio.currentTime < SILENCE_TRIM_OFFSET) {
        try {
          audio.currentTime = SILENCE_TRIM_OFFSET;
        } catch (e) {}
      }
      audio.volume = TARGET_VOLUME;
      await audio.play();
      updateUI();
    } catch {
      // Browser autoplay policy prevented playback; keep paused UI for manual user tap
      updateUI();
    }
  }

  function pauseAudio() {
    audio.pause();
    updateUI();
  }

  function toggleAudio() {
    if (!audio.paused) {
      pauseAudio();
    } else {
      playAudio(false);
    }
  }

  toggleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAudio();
  });

  // Listen ONLY for ribbon start opening event from guest interaction (NOT animation end)
  window.addEventListener("wedding-ribbon-start-opening", () => {
    if (audio.paused) {
      playAudio(false);
    }
  });

  globalController = {
    play: () => playAudio(false),
    pause: pauseAudio,
    toggle: toggleAudio,
    isPlaying: () => !audio.paused
  };
  (window as any).__weddingMusicController = globalController;

  return globalController;
}