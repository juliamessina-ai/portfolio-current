const PROJECT_PAGES = ["mark-formelle", "loyalty-program", "design-system"];
const DEFAULT_PAGE = "portfolio";
const PAGE_SELECTOR = "[data-page]";
const PANEL_SELECTOR = "[data-page-panel]";

const buttons = Array.from(document.querySelectorAll(PAGE_SELECTOR));
const panels = Array.from(document.querySelectorAll(PANEL_SELECTOR));
const segment = document.querySelector(".segment");

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function initTypography() {
  const skipTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "SVG"]);
  const shortWords =
    "а|в|во|и|к|ко|о|об|обо|от|до|из|за|на|над|не|но|о|по|под|при|про|с|со|у|для|без";
  const shortWordPattern = new RegExp(`(^|[\\s([{«„])(${shortWords})(\\s+)`, "giu");
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement && !skipTags.has(node.parentElement.tagName)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    node.nodeValue = node.nodeValue
      .replace(shortWordPattern, "$1$2\u00A0")
      .replace(/№\s+(\d)/g, "№\u00A0$1")
      .replace(/(\d)\s+(points|THB|день|дня|дней|порции|порций|горках|год|года|лет)/giu, "$1\u00A0$2");
  });
}

function normalizePage(page) {
  return page === "photos" || PROJECT_PAGES.includes(page) ? page : DEFAULT_PAGE;
}

function showPage(page) {
  const nextPage = normalizePage(page);
  const isProjectPage = PROJECT_PAGES.includes(nextPage);
  const activeSegmentPage = isProjectPage ? DEFAULT_PAGE : nextPage;

  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === activeSegmentPage);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.pagePanel === nextPage);
  });

  segment?.classList.toggle("is-hidden", isProjectPage);
  document.body.classList.toggle("project-page-active", isProjectPage);
  document.body.classList.toggle("loyalty-page-active", nextPage === "loyalty-program");

  if (window.location.hash !== `#${nextPage}`) {
    history.replaceState(null, "", `#${nextPage}`);
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function initNavigation() {
  buttons.forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  document.querySelectorAll("[data-project]").forEach((project) => {
    const openProject = () => showPage(project.dataset.project);

    project.addEventListener("click", openProject);
    project.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProject();
      }
    });
  });

  window.addEventListener("hashchange", () => {
    showPage(window.location.hash.replace("#", ""));
  });

  showPage(window.location.hash.replace("#", ""));
}

function initProjectCursor() {
  const projectCursor = document.querySelector(".project-cursor");
  const projectTargets = document.querySelectorAll(".case-card[data-project], .challenge-card");

  if (!projectCursor) return;

  let cursorFrame;
  let isCursorVisible = false;
  const cursorTarget = { x: -999, y: -999 };
  const cursorPosition = { x: -999, y: -999 };

  const renderProjectCursor = () => {
    cursorPosition.x += (cursorTarget.x - cursorPosition.x) * 0.18;
    cursorPosition.y += (cursorTarget.y - cursorPosition.y) * 0.18;
    projectCursor.style.transform = `translate3d(${cursorPosition.x}px, ${cursorPosition.y}px, 0)`;

    const isStillMoving =
      Math.abs(cursorTarget.x - cursorPosition.x) > 0.35 ||
      Math.abs(cursorTarget.y - cursorPosition.y) > 0.35;

    if (isCursorVisible || isStillMoving) {
      cursorFrame = window.requestAnimationFrame(renderProjectCursor);
    } else {
      cursorFrame = null;
    }
  };

  const startCursorAnimation = () => {
    if (!cursorFrame) {
      cursorFrame = window.requestAnimationFrame(renderProjectCursor);
    }
  };

  const moveProjectCursor = (event) => {
    const cursorWidth = projectCursor.offsetWidth || 122;
    cursorTarget.x = event.clientX - cursorWidth / 2;
    cursorTarget.y = event.clientY - 40;
    startCursorAnimation();
  };

  projectTargets.forEach((target) => {
    target.addEventListener("mouseenter", (event) => {
      target.classList.add("project-hover");
      isCursorVisible = true;
      cursorPosition.x = event.clientX - (projectCursor.offsetWidth || 122) / 2;
      cursorPosition.y = event.clientY - 40;
      projectCursor.classList.add("visible");
      moveProjectCursor(event);
    });

    target.addEventListener("mousemove", moveProjectCursor);

    target.addEventListener("mouseleave", () => {
      target.classList.remove("project-hover");
      isCursorVisible = false;
      projectCursor.classList.remove("visible");
    });
  });
}

function initIntroPuzzles() {
  const introPuzzlesEnabled = true;
  const portfolioIntro = document.querySelector(".portfolio-intro");
  const helloTitle = document.querySelector(".hello-title");

  if (!introPuzzlesEnabled || !portfolioIntro || !helloTitle) return;

  let puzzleLeaveTimer;

  helloTitle.addEventListener("mouseenter", () => {
    window.clearTimeout(puzzleLeaveTimer);
    portfolioIntro.classList.remove("puzzles-leave");
    portfolioIntro.classList.add("puzzles-enter", "puzzles-visible");
  });

  helloTitle.addEventListener("mouseleave", () => {
    portfolioIntro.classList.remove("puzzles-enter", "puzzles-visible");
    portfolioIntro.classList.add("puzzles-leave");

    puzzleLeaveTimer = window.setTimeout(() => {
      portfolioIntro.classList.remove("puzzles-leave");
    }, 560);
  });
}

function initAlternateIntroHover() {
  const helloTitle = document.querySelector(".hello-title");

  if (!helloTitle) return;

  let interferenceTimer;

  const activate = () => {
    window.clearTimeout(interferenceTimer);
    document.body.classList.add("portfolio-alt-hover", "portfolio-alt-interference");
    interferenceTimer = window.setTimeout(() => {
      document.body.classList.remove("portfolio-alt-interference");
    }, 780);
  };

  const deactivate = () => {
    window.clearTimeout(interferenceTimer);
    document.body.classList.remove("portfolio-alt-hover", "portfolio-alt-interference");
  };

  helloTitle.addEventListener("mouseenter", activate);
  helloTitle.addEventListener("mouseleave", deactivate);
  helloTitle.addEventListener("focusin", activate);
  helloTitle.addEventListener("focusout", deactivate);
}

function initCoverVideoPlaybackRates() {
  document.querySelectorAll("video[data-playback-rate]").forEach((video) => {
    const playbackRate = Number(video.dataset.playbackRate);

    if (!Number.isFinite(playbackRate) || playbackRate <= 0) return;

    const applyPlaybackRate = () => {
      video.defaultPlaybackRate = playbackRate;
      video.playbackRate = playbackRate;
    };

    applyPlaybackRate();
    video.addEventListener("loadedmetadata", applyPlaybackRate);
  });
}

function initDeferredMedia() {
  const deferredFrames = document.querySelectorAll("iframe[data-src]");
  const deferredVideos = Array.from(document.querySelectorAll("video")).filter(
    (video) =>
      video.dataset.src || video.querySelector("source[data-src]")
  );

  const loadFrame = (frame) => {
    if (!frame.dataset.src) return;
    frame.src = frame.dataset.src;
    frame.removeAttribute("data-src");
  };

  const loadVideo = (video) => {
    let sourceAdded = false;

    if (video.dataset.src) {
      video.src = video.dataset.src;
      video.removeAttribute("data-src");
      sourceAdded = true;
    }

    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
      sourceAdded = true;
    });

    if (sourceAdded) video.load();
  };

  if (!("IntersectionObserver" in window)) {
    deferredFrames.forEach(loadFrame);
    deferredVideos.forEach((video) => {
      loadVideo(video);
      video.play().catch(() => {});
    });
    return;
  }

  const frameObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadFrame(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "100px 0px" }
  );

  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting) {
          loadVideo(video);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: "350px 0px", threshold: 0.01 }
  );

  deferredFrames.forEach((frame) => frameObserver.observe(frame));
  deferredVideos.forEach((video) => videoObserver.observe(video));
}

function initStickyHeaderThreshold() {
  const header = document.querySelector(".site-header");
  const portfolioCases = document.querySelector(".page-portfolio .cases");
  const portfolioPage = document.querySelector(".page-portfolio");

  if (!header) return;

  const updateHeaderPosition = () => {
    const offset = Math.max(0, 10 - window.scrollY);
    header.style.setProperty("--header-stick-offset", `${offset}px`);
    const currentHash = window.location.hash || "#portfolio";
    const isPortfolio = currentHash === "#portfolio";
    const fadeStart = 16;
    const fadeDistance = 120;
    const progress = isPortfolio
      ? Math.min(1, Math.max(0, (window.scrollY - fadeStart) / fadeDistance))
      : 0;

    header.style.setProperty("--portfolio-nav-opacity", (1 - progress).toFixed(3));
    header.style.setProperty("--portfolio-nav-blur", `${(12 * progress).toFixed(2)}px`);
    document.body.classList.toggle("portfolio-nav-hidden", isPortfolio && progress >= 0.98);

    if (portfolioCases) {
      portfolioCases.style.removeProperty("--projects-blur");
      portfolioCases.style.removeProperty("--projects-opacity");
    }

    if (portfolioPage) {
      const bottomBlurDistance = 380;
      const bottomBlurOpacity = isPortfolio
        ? 1 - Math.min(1, Math.max(0, window.scrollY / bottomBlurDistance))
        : 0;

      portfolioPage.style.setProperty("--bottom-blur-opacity", bottomBlurOpacity.toFixed(3));
    }
  };

  updateHeaderPosition();
  window.addEventListener("scroll", updateHeaderPosition, { passive: true });
  window.addEventListener("hashchange", updateHeaderPosition);
}

initTypography();
initNavigation();
initProjectCursor();
initIntroPuzzles();
initCoverVideoPlaybackRates();
initDeferredMedia();
initStickyHeaderThreshold();
