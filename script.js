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

let pageTransitionRun = 0;
let pageContentAnimation;

async function showPage(page) {
  const nextPage = normalizePage(page);
  const run = ++pageTransitionRun;
  pageContentAnimation?.cancel();
  const previousPanel = panels.find(panel => panel.classList.contains("active"));
  const nextPanel = panels.find(panel => panel.dataset.pagePanel === nextPage);
  const animateContent = previousPanel && previousPanel !== nextPanel &&
    !PROJECT_PAGES.includes(previousPanel.dataset.pagePanel) &&
    !PROJECT_PAGES.includes(nextPage) &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isProjectPage = PROJECT_PAGES.includes(nextPage);
  const activeSegmentPage = isProjectPage ? DEFAULT_PAGE : nextPage;
  const slideDirection = nextPage === "photos" ? 1 : -1;

  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === activeSegmentPage);
  });

  if (animateContent) {
    pageContentAnimation = previousPanel.animate([
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 0, transform: `translateX(${-12 * slideDirection}px)` },
    ], { duration: 110, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });
    try { await pageContentAnimation.finished; } catch { return; }
    if (run !== pageTransitionRun) return;
    pageContentAnimation.cancel();
  }

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.pagePanel === nextPage);
  });

  segment?.classList.toggle("is-hidden", isProjectPage);
  document.body.classList.toggle("project-page-active", isProjectPage);
  document.body.classList.toggle("loyalty-page-active", nextPage === "loyalty-program");
  document.dispatchEvent(new Event('page-layout-change'));

  if (window.location.hash !== `#${nextPage}`) {
    history.replaceState(null, "", `#${nextPage}`);
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  if (animateContent) {
    pageContentAnimation = nextPanel.animate([
      { opacity: 0, transform: `translateX(${24 * slideDirection}px)` },
      { opacity: 1, transform: "translateX(0)" },
    ], { duration: 300, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
  }
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
  const projectTargets = document.querySelectorAll(".case-card[data-project], .challenge-card, .case-card:has(.case-sustainability-cover)");

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
      const comingSoon = !target.hasAttribute("data-project");
      target.classList.toggle("project-hover", !comingSoon);
      projectCursor.classList.toggle("coming-soon", comingSoon);
      projectCursor.querySelector(".project-cursor-label").textContent = comingSoon ? "coming soon..." : "Подробнее";
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
  const introPuzzlesEnabled = false;
  const portfolioIntro = document.querySelector(".portfolio-intro");
  const helloTitle = document.querySelector(".hello-title");

  if (!portfolioIntro || !helloTitle) return;
  if (!introPuzzlesEnabled) {
    const puzzleLayer = portfolioIntro.querySelector(".puzzle-layer");
    if (puzzleLayer) puzzleLayer.hidden = true;
    portfolioIntro.classList.remove("puzzles-enter", "puzzles-visible", "puzzles-leave");
    return;
  }

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

// Reserve the same text height on both landing screens so the greeting stays put.
function initPhotosIntroPosition() {
  const reference = document.querySelector('.page-portfolio .intro-copy > p');
  const copy = document.querySelector('.photos-hero .intro-copy');
  const paragraph = copy?.querySelector('p');
  if (!reference || !paragraph) return;

  const measure = reference.cloneNode(true);
  measure.setAttribute('aria-hidden', 'true');
  Object.assign(measure.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    height: 'auto',
    top: '0',
    left: '0',
    right: '0',
  });
  copy.append(measure);

  const sync = () => {
    if (!copy.getBoundingClientRect().width) return;
    paragraph.style.height = `${measure.getBoundingClientRect().height}px`;
  };
  new ResizeObserver(sync).observe(copy);
  document.addEventListener('page-layout-change', sync);
  document.fonts.ready.then(sync);
  sync();
}

initTypography();
initPhotosIntroPosition();
initNavigation();
initProjectCursor();
initIntroPuzzles();
initCoverVideoPlaybackRates();
initDeferredMedia();
initStickyHeaderThreshold();

// Photos greeting: repeat the camera sequence during hover or keyboard focus.
function initPhotosGreeting() {
  const title = document.querySelector(".page-photos .hello-title");
  const portrait = title?.querySelector(".hello-photo");
  if (!portrait) return;
  const sources = [
    "portrait-look-right-20260825.svg",
    "photos-camera-1.svg", "photos-camera-2.svg",
    ...Array.from({ length: 7 }, (_, i) => `photos-flash-${i + 1}.svg`),
    "portrait-look-right-20260825.svg",
  ];
  const frames = sources.map((source) => {
    const image = new Image();
    image.className = "hello-photo-pixel photos-camera-frame";
    image.alt = "";
    image.src = `assets/${source}`;
    portrait.append(image);
    return image;
  });
  const ready = Promise.all(frames.map(image => image.decode()));
  ready.catch(() => {});
  const durations = [360, 200, 240, 95, 95, 95, 95, 95, 95, 120, 220];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer;
  let generation = 0;
  let active = false;
  const show = index => frames.forEach((frame, i) => frame.classList.toggle("is-current", i === index));
  const stop = () => {
    generation++;
    active = false;
    clearTimeout(timer);
    title.classList.remove("photos-camera-active");
    show(-1);
  };
  const start = async () => {
    if (active) return;
    active = true;
    const run = ++generation;
    try { await ready; } catch { if (run === generation) stop(); return; }
    if (run !== generation) return;
    title.classList.add("photos-camera-active");
    show(0);
    if (reducedMotion.matches) return;
    const advance = index => {
      if (run !== generation) return;
      show(index);
      timer = setTimeout(() => {
        if (index + 1 < frames.length) advance(index + 1);
        else advance(0);
      }, durations[index]);
    };
    advance(0);
  };
  title.addEventListener("mouseenter", start);
  title.addEventListener("mouseleave", () => {
    if (!title.matches(":focus-visible")) stop();
  });
  title.addEventListener("focusin", start);
  title.addEventListener("focusout", () => {
    if (!title.matches(":hover")) stop();
  });
  window.addEventListener("hashchange", stop);
}
initPhotosGreeting();

// Sample each lower original SVG inside the upper glass silhouette. This also
// works on file://, where external CSS masks/backdrop sampling can be blocked.
function initPuzzleLayout() {
  const layer = document.querySelector('.page-portfolio .portfolio-intro .puzzle-layer');
  if (!layer) return;
  const update = () => {
    layer.style.setProperty('--puzzle-scale', Math.min(1, (window.innerWidth - 48) / 1392));
  };
  window.addEventListener('resize', update);
  document.addEventListener('page-layout-change', update);
  update();
}
initPuzzleLayout();
