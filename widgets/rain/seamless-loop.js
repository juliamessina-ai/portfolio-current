(() => {
  const videos = Array.from(document.querySelectorAll(".rain-video"));

  if (videos.length < 2) {
    return;
  }

  const fadeSeconds = 1.2;
  let activeIndex = 0;
  let isTransitioning = false;

  videos.forEach((video, index) => {
    video.loop = false;
    video.muted = true;

    if (index !== activeIndex) {
      video.pause();
      video.currentTime = 0;
    }
  });

  const crossfade = async () => {
    if (isTransitioning) {
      return;
    }

    isTransitioning = true;

    const current = videos[activeIndex];
    const nextIndex = (activeIndex + 1) % videos.length;
    const next = videos[nextIndex];

    next.currentTime = 0;

    try {
      await next.play();
    } catch {
      isTransitioning = false;
      return;
    }

    next.classList.add("is-visible");
    current.classList.remove("is-visible");

    window.setTimeout(() => {
      current.pause();
      current.currentTime = 0;
      activeIndex = nextIndex;
      isTransitioning = false;
    }, fadeSeconds * 1000);
  };

  const monitor = () => {
    const current = videos[activeIndex];

    if (
      !isTransitioning &&
      Number.isFinite(current.duration) &&
      current.duration > fadeSeconds &&
      current.currentTime >= current.duration - fadeSeconds
    ) {
      crossfade();
    }

    window.requestAnimationFrame(monitor);
  };

  videos.forEach((video) => {
    video.addEventListener("ended", crossfade);
  });

  videos[activeIndex].play().catch(() => {});
  window.requestAnimationFrame(monitor);
})();

