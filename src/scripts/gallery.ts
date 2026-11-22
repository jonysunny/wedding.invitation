export function initGallery() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".gallery-card"));
  const modal = document.getElementById("gallery-lightbox");
  const previewImg = document.getElementById("lightbox-preview-img") as HTMLImageElement;
  const previewTitle = document.getElementById("lightbox-preview-title");
  const previewCaption = document.getElementById("lightbox-preview-caption");
  const counterEl = document.getElementById("lightbox-counter");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  if (!modal || !previewImg || !closeBtn || !cards.length) return;

  // Move lightbox modal to document.body to escape transformed section containers
  if (modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }

  let currentIndex = 0;
  let isOpen = false;
  let savedScrollY = 0;
  let isTransitioning = false;

  function updateContent(index: number) {
    currentIndex = index;
    const card = cards[currentIndex];
    const src = card.getAttribute("data-src") || "";
    const title = card.getAttribute("data-title") || "";
    const caption = card.getAttribute("data-caption") || "";
    const alt = card.getAttribute("data-alt") || title;

    previewImg.src = src;
    previewImg.alt = alt;
    if (previewTitle) previewTitle.textContent = title;
    if (previewCaption) {
      previewCaption.textContent = caption;
      previewCaption.style.display = caption ? "block" : "none";
    }
    if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${cards.length}`;
  }

  function renderSlide(index: number) {
    if (isTransitioning) return;
    if (index < 0) index = cards.length - 1;
    if (index >= cards.length) index = 0;
    if (index === currentIndex && previewImg.src) return;

    isTransitioning = true;
    const nextCard = cards[index];
    const nextSrc = nextCard.getAttribute("data-src") || "";

    // Subtle fade-out of current image
    previewImg.style.opacity = "0.4";
    previewImg.style.transform = "scale(0.98)";

    const imgLoader = new Image();
    imgLoader.src = nextSrc;

    const finalize = () => {
      updateContent(index);
      requestAnimationFrame(() => {
        previewImg.style.opacity = "1";
        previewImg.style.transform = "scale(1)";
        isTransitioning = false;
      });
    };

    if (imgLoader.complete) {
      finalize();
    } else {
      imgLoader.onload = finalize;
      imgLoader.onerror = finalize;
    }
  }

  // Preload all gallery images in background to make lightbox switching instant
  function preloadGalleryImages() {
    cards.forEach(card => {
      const src = card.getAttribute("data-src");
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }

  if (document.readyState === "complete") {
    preloadGalleryImages();
  } else {
    window.addEventListener("load", preloadGalleryImages, { once: true });
  }

  function openModal(index: number) {
    if (isOpen) return; // Prevent repeated taps from opening duplicate previews
    isOpen = true;
    savedScrollY = window.scrollY;

    // Immediately load target photograph before displaying modal to prevent flash of previous photo
    previewImg.style.opacity = "1";
    previewImg.style.transform = "scale(1)";
    updateContent(index);

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Trigger subtle fade-in transition
    requestAnimationFrame(() => {
      modal.classList.add("is-active");
      closeBtn.focus();
    });
  }

  function closeModal() {
    if (!isOpen) return;
    isOpen = false;
    modal.classList.remove("is-active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    // Restore user's previous scroll position immediately
    window.scrollTo({ top: savedScrollY, behavior: "instant" });

    setTimeout(() => {
      if (!isOpen) {
        modal.style.display = "none";
        try {
          cards[currentIndex]?.focus({ preventScroll: true });
        } catch (e) {
          cards[currentIndex]?.focus();
        }
        window.scrollTo({ top: savedScrollY, behavior: "instant" });
      }
    }, 280);
  }

  function showNext() {
    renderSlide(currentIndex + 1);
  }

  function showPrev() {
    renderSlide(currentIndex - 1);
  }

  cards.forEach((card, idx) => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `View photo: ${card.getAttribute("data-title") || "Wedding photo"}`);

    card.addEventListener("click", () => openModal(idx));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(idx);
      }
    });
  });

  closeBtn.addEventListener("click", closeModal);
  prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    showPrev();
  });
  nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    showNext();
  });

  modal.addEventListener("click", (e) => {
    // Close when tapping the dark backdrop
    if (e.target === modal) closeModal();
  });

  // Keyboard navigation: Escape, Left Arrow, Right Arrow
  window.addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") {
      closeModal();
    } else if (e.key === "ArrowRight") {
      showNext();
    } else if (e.key === "ArrowLeft") {
      showPrev();
    }
  });

  // Mobile Touch Swipe support with clean threshold
  let touchStartX = 0;
  let touchStartY = 0;

  modal.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  modal.addEventListener("touchend", (e) => {
    if (e.changedTouches.length === 1) {
      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      // Ensure horizontal swipe is dominant over vertical scrolling
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          showNext();
        } else {
          showPrev();
        }
      }
    }
  }, { passive: true });
}

export function initScrollReveal() {
  const elements = document.querySelectorAll(".reveal-on-scroll");
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach(el => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01, rootMargin: "300px 0px 300px 0px" });

  elements.forEach(el => observer.observe(el));

  // When ribbon opening begins / completes, immediately reveal Section 2 (scratch) and visible items
  const onRibbonEvent = () => {
    const scratch = document.getElementById("scratch-reveal-section");
    if (scratch) scratch.classList.add("is-visible");
    const vh = window.innerHeight || 800;
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh + 300 && rect.bottom > -300) {
        el.classList.add("is-visible");
      }
    });
  };

  // Safe fallback: ensure sections become visible on scroll if observer is delayed
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const vh = window.innerHeight || 800;
        elements.forEach(el => {
          if (!el.classList.contains("is-visible")) {
            const rect = el.getBoundingClientRect();
            if (rect.top < vh + 200 && rect.bottom > -200) {
              el.classList.add("is-visible");
            }
          }
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener("wedding-ribbon-start-opening", onRibbonEvent);
  window.addEventListener("wedding-ribbon-opened", onRibbonEvent);
  window.addEventListener("wedding-envelope-opened", onRibbonEvent);
}