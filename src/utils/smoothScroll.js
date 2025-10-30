export const smoothScrollToTop = (duration = 600) => {
  const start = window.pageYOffset || document.documentElement.scrollTop;
  const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  };

  const scroll = () => {
    const currentTime = 'now' in window.performance ? performance.now() : new Date().getTime();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easeProgress = easeInOutCubic(progress);
    window.scrollTo(0, start * (1 - easeProgress));

    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  };

  requestAnimationFrame(scroll);
};
