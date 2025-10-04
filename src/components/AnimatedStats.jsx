import { useState, useEffect } from 'react';

export function AnimatedStats({ label, value, delay = 0, isPercentile = false, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now() + delay;
    const endValue = typeof value === 'number' ? value : 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }

      if (elapsed < duration) {
        const progress = elapsed / duration;
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(easeOutQuart * endValue);
        setDisplayValue(currentValue);
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, delay]);

  return (
    <div className={`result-stat animated ${isPercentile ? 'highlight' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {displayValue}{isPercentile ? 'th' : suffix}
      </span>
    </div>
  );
}
