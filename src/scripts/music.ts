// Global singleton reference to prevent duplicate instances
let globalAudio: HTMLAudioElement | null = null;
let globalController: { play: () => Promise<void>; pause: () => void; toggle: () => void } | null = null;

const TARGET_VOLUME = 0.35; // Comfortable wedding background music volume
const FADE_DURATION_MS = 1500; // 1.5 seconds gentle fade-in

export const AUDIO_START_OFFSET = 3.25; // Skips leading silence in MP3 so song starts immediately

export function initMusic(audioSrc: string) {
  if (globalController) {
    return globalController;
  }

  const audio = new Audio();
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = TARGET_VOLUME;
  audio.src = audioSrc;
  globalAudio = audio;
  (window as any).__weddingAudio = audio;

  // Immediately seek past the 3.25s silence as soon as audio is ready
  const seekToStart = () => {
    if (audio.currentTime < AUDIO_START_OFFSET) {
      try {
        audio.currentTime = AUDIO_START_OFFSET;
      } catch (e) {}
    }
  };

  audio.addEventListener("loadedmetadata", seekToStart, { passive: true });
  audio.addEventListener("canplay", seekToStart, { passive: true });

  // If audio loops back to beginning, ensure it skips leading silence
  audio.addEventListener("timeupdate", () => {
    if (!audio.paused && audio.currentTime < 1.0) {
      audio.currentTime = AUDIO_START_OFFSET;
    }
  }, { passive: true });

  const toggleBtn = document.getElementById("music-toggle-btn");
  const iconPlaying = document.getElementById("music-icon-playing");
  const iconMuted = document.getElementById("music-icon-muted");

  let isPlaying = false;
  let fadeInterval: number | null = null;

  function updateUI() {
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

  async function playAudio(withFade = false) {
    if (isPlaying) return;
    try {
      if (audio.currentTime < AUDIO_START_OFFSET) {
        try {
          audio.currentTime = AUDIO_START_OFFSET;
        } catch (e) {}
      }
      // Instant target volume so melody is heard immediately
      audio.volume = TARGET_VOLUME;
      await audio.play();
      isPlaying = true;
      updateUI();
    } catch {
      // Browser autoplay policy prevented playback; keep paused UI for manual user tap
      isPlaying = false;
      updateUI();
    }
  }

  function pauseAudio() {
    if (fadeInterval) clearInterval(fadeInterval);
    audio.pause();
    isPlaying = false;
    updateUI();
  }

  function toggleAudio() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(false);
    }
  }

  toggleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAudio();
  });

  // Listen for ribbon opening event from guest interaction
  window.addEventListener("wedding-ribbon-start-opening", () => {
    if (!isPlaying) {
      playAudio(false);
    }
  });

  window.addEventListener("wedding-ribbon-opened", () => {
    if (!isPlaying) {
      playAudio(false);
    }
  });

  globalController = {
    play: () => playAudio(false),
    pause: pauseAudio,
    toggle: toggleAudio
  };
  (window as any).__weddingMusicController = globalController;

  return globalController;
}