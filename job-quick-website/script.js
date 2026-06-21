const menuButton = document.querySelector(".menu-button");
const siteNav = document.querySelector(".site-nav");
const scrollTopButton = document.querySelector(".scroll-top-button");
const siteNavLinks = document.querySelectorAll(".site-nav a");
const homeScrollSpyLinks = document.querySelectorAll('.home-page .site-nav a[href^="#"]:not(.nav-cta)');
const pricingTrackButtons = document.querySelectorAll("[data-pricing-track]");
const pricingModeButtons = document.querySelectorAll("[data-pricing-mode]");
const pricingPanels = document.querySelectorAll(".pricing-panel");
const pricingSection = document.querySelector(".packages-pricing");
const pricingNote = document.querySelector(".pricing-note");
const customSelects = document.querySelectorAll("[data-custom-select]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const headerOffset = 92;
const lenisEasing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
const LenisConstructor = window.Lenis;
let lenis = null;
let rafId = null;

function initializeLenis() {
  if (prefersReducedMotion.matches || !LenisConstructor || lenis) return;

  lenis = new LenisConstructor({
    duration: 0.96,
    easing: lenisEasing,
    smoothWheel: true,
    wheelMultiplier: 0.92,
    touchMultiplier: 1.12,
    anchors: {
      offset: -headerOffset,
    },
  });
  window.lenis = lenis;

  function raf(time) {
    lenis?.raf(time);
    rafId = requestAnimationFrame(raf);
  }

  rafId = requestAnimationFrame(raf);
}

initializeLenis();

prefersReducedMotion.addEventListener("change", (event) => {
  if (event.matches && lenis) {
    lenis.destroy();
    lenis = null;
    window.lenis = null;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  } else if (!event.matches && !lenis) {
    initializeLenis();
  }
});

function closeMenu() {
  if (!menuButton || !siteNav) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
  siteNav.classList.remove("is-open");
}

function scrollToAnchorTarget(target, hash) {
  if (!target) return;

  if (!lenis || prefersReducedMotion.matches) {
    const targetY = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo(0, Math.max(0, targetY));
    if (hash) window.history.pushState(null, "", hash);
    return;
  }

  lenis.scrollTo(target, {
    offset: -headerOffset,
    duration: 0.9,
    easing: lenisEasing,
  });

  if (hash) window.history.pushState(null, "", hash);
}

function alignInitialHashPosition() {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (!target) return;

  requestAnimationFrame(() => {
    const targetY = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo(0, Math.max(0, targetY));
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    closeMenu();

    event.preventDefault();
    scrollToAnchorTarget(target, href);
  });
});

siteNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 1023) closeMenu();
  });
});

if (homeScrollSpyLinks.length) {
  const homeSections = [...homeScrollSpyLinks]
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href) return null;
      const target = document.querySelector(href);
      if (!target) return null;
      return { href, link, target };
    })
    .filter(Boolean);

  const syncHomeNavState = () => {
    const currentSection =
      homeSections.reduce((active, entry) => {
        const triggerTop = window.scrollY + headerOffset + 160;
        if (entry.target.offsetTop <= triggerTop) return entry;
        return active;
      }, homeSections[0]) || null;

    homeSections.forEach((entry) => {
      entry.link.classList.toggle("is-current", entry === currentSection);
    });
  };

  syncHomeNavState();
  window.addEventListener("scroll", syncHomeNavState, { passive: true });
  window.addEventListener("resize", syncHomeNavState);
}

if (menuButton && siteNav) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
    siteNav.classList.toggle("is-open", !isOpen);
  });
}

if (scrollTopButton) {
  const toggleScrollTopButton = () => {
    scrollTopButton.classList.toggle("is-visible", window.scrollY > 520);
  };

  scrollTopButton.addEventListener("click", () => {
    if (lenis && !prefersReducedMotion.matches) {
      lenis.scrollTo(0, {
        duration: 0.95,
        easing: lenisEasing,
      });
      return;
    }

    window.scrollTo(0, 0);
  });

  toggleScrollTopButton();
  window.addEventListener("scroll", toggleScrollTopButton, { passive: true });
}

if (customSelects.length) {
  const closeCustomSelects = (exceptSelect = null) => {
    customSelects.forEach((select) => {
      if (select === exceptSelect) return;
      const trigger = select.querySelector(".custom-select-trigger");
      select.classList.remove("is-open");
      trigger?.setAttribute("aria-expanded", "false");
    });
  };

  customSelects.forEach((select) => {
    const hiddenInput = select.querySelector('input[type="hidden"]');
    const trigger = select.querySelector(".custom-select-trigger");
    const value = select.querySelector(".custom-select-value");
    const menu = select.querySelector(".custom-select-menu");
    const options = select.querySelectorAll(".custom-select-option");

    if (!hiddenInput || !trigger || !value || !menu || !options.length) return;

    trigger.addEventListener("click", () => {
      const willOpen = !select.classList.contains("is-open");
      closeCustomSelects(select);
      select.classList.toggle("is-open", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) {
        menu.focus();
      }
    });

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const nextValue = option.dataset.value || option.textContent?.trim() || "";
        hiddenInput.value = nextValue;
        value.textContent = nextValue;

        options.forEach((item) => {
          const isSelected = item === option;
          item.classList.toggle("is-selected", isSelected);
          item.setAttribute("aria-selected", String(isSelected));
        });

        select.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      });
    });

    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        select.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (![...customSelects].some((select) => select.contains(event.target))) {
      closeCustomSelects();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCustomSelects();
    }
  });
}

document.querySelectorAll(".faq-item button").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    if (!item) return;

    const isOpen = item.classList.contains("is-open");
    document.querySelectorAll(".faq-item").forEach((faq) => {
      faq.classList.remove("is-open");
      faq.querySelector("button")?.setAttribute("aria-expanded", "false");
    });

    if (!isOpen) {
      item.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

if (pricingTrackButtons.length && pricingModeButtons.length && pricingPanels.length) {
  const pricingState = {
    track:
      document.querySelector("[data-pricing-track].is-active")?.dataset.pricingTrack || "standard",
    mode: document.querySelector("[data-pricing-mode].is-active")?.dataset.pricingMode || "self",
  };
  let pricingAnimationsReady = false;

  const getActivePricingPanel = () =>
    document.querySelector(`.pricing-panel[data-panel="${pricingState.track}-${pricingState.mode}"]`);

  const animatePricingPanel = (panel) => {
    if (!panel || prefersReducedMotion.matches) return;

    panel.classList.remove("is-animating");
    void panel.offsetWidth;
    panel.classList.add("is-animating");

    if (panel._animationTimeout) {
      window.clearTimeout(panel._animationTimeout);
    }

    panel._animationTimeout = window.setTimeout(() => {
      panel.classList.remove("is-animating");
    }, 1180);
  };

  const syncPricingPanels = () => {
    const activePanel = `${pricingState.track}-${pricingState.mode}`;
    let nextActivePanel = null;

    if (pricingNote) {
      pricingNote.hidden = pricingState.track !== "standard";
    }

    pricingTrackButtons.forEach((button) => {
      const isActive = button.dataset.pricingTrack === pricingState.track;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    pricingModeButtons.forEach((button) => {
      const isActive = button.dataset.pricingMode === pricingState.mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    pricingPanels.forEach((panel) => {
      const isActive = panel.dataset.panel === activePanel;
      panel.classList.toggle("is-active", isActive);
      if (isActive) nextActivePanel = panel;
    });

    if (pricingAnimationsReady) {
      animatePricingPanel(nextActivePanel);
    }
  };

  pricingTrackButtons.forEach((button) => {
    button.addEventListener("click", () => {
      pricingState.track = button.dataset.pricingTrack || "standard";
      syncPricingPanels();
    });
  });

  pricingModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      pricingState.mode = button.dataset.pricingMode || "self";
      syncPricingPanels();
    });
  });

  syncPricingPanels();

  if (pricingSection && !prefersReducedMotion.matches) {
    const pricingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          pricingAnimationsReady = true;
          animatePricingPanel(getActivePricingPanel());
          pricingObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.24, rootMargin: "0px 0px -8% 0px" }
    );

    pricingObserver.observe(pricingSection);
  } else {
    pricingAnimationsReady = true;
  }
}

const revealTargets = document.querySelectorAll(".reveal");
const immediateRevealTargets = new Set(
  document.querySelectorAll(".packages-page .packages-pricing .reveal, .packages-page .packages-cta-section .reveal")
);

revealTargets.forEach((target, index) => {
  const section = target.closest("section");
  const sectionReveals = section ? [...section.querySelectorAll(".reveal")] : [target];
  const localIndex = Math.max(0, sectionReveals.indexOf(target));
  target.style.setProperty("--reveal-delay", `${Math.min(localIndex * 110, 330)}ms`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
);

revealTargets.forEach((target, index) => {
  if (index < 3 || immediateRevealTargets.has(target)) return;
  revealObserver.observe(target);
});

requestAnimationFrame(() => {
  setTimeout(() => {
    revealTargets.forEach((target, index) => {
      if (index < 3 || immediateRevealTargets.has(target)) {
        target.classList.add("is-visible");
      }
    });
  }, 120);
});

window.addEventListener("load", alignInitialHashPosition);
