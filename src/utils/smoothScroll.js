let scrollAnimation = null;

export const smoothScrollToTop = (duration = 600) => {
  if (scrollAnimation) {
    cancelAnimationFrame(scrollAnimation);
    scrollAnimation = null;
  }

  const start = window.pageYOffset || document.documentElement.scrollTop;

  if (start === 0) {
    return;
  }

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
      scrollAnimation = requestAnimationFrame(scroll);
    } else {
      scrollAnimation = null;
    }
  };

  scrollAnimation = requestAnimationFrame(scroll);
};
