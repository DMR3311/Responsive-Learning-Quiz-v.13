import { useState, useEffect } from 'react';

export function Timer({ duration, onTimeUp, isActive }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onTimeUp]);

  const percentage = (timeLeft / duration) * 100;
  const isCritical = timeLeft <= 10;
  const isUrgent = percentage < 25 && !isCritical;
  const isWarning = percentage < 50 && percentage >= 25;

  if (timeLeft <= 10 && timeLeft > 0) {
    console.log('🚨 TIMER WARNING:', {
      timeLeft,
      isCritical,
      duration,
      percentage: percentage.toFixed(1),
      className: isCritical ? 'critical-warning' : ''
    });
  }

  return (
    <div className={`timer-container ${isCritical ? 'critical-warning' : ''}`}>
      {isCritical && (
        <div className="timer-warning-text" style={{ marginBottom: '12px', fontSize: '16px' }}>
          ⚠️ TIME RUNNING OUT! ⚠️
        </div>
      )}
      <div className="timer-display">
        <span className={`timer-value ${isCritical ? 'critical' : isUrgent ? 'urgent' : isWarning ? 'warning' : ''}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="timer-bar">
        <div
          className={`timer-fill ${isCritical ? 'critical' : isUrgent ? 'urgent' : isWarning ? 'warning' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
