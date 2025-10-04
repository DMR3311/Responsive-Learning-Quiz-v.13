import { useState, useEffect } from 'react';

export function ProgressBar({ currentQuestion, totalQuestions, avgTimePerQuestion }) {
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0);

  useEffect(() => {
    if (avgTimePerQuestion > 0) {
      const questionsRemaining = totalQuestions - currentQuestion;
      const timeLeft = Math.ceil(questionsRemaining * avgTimePerQuestion);
      setEstimatedTimeLeft(timeLeft);
    }
  }, [currentQuestion, totalQuestions, avgTimePerQuestion]);

  const percentage = (currentQuestion / totalQuestions) * 100;
  const minutes = Math.floor(estimatedTimeLeft / 60);
  const seconds = estimatedTimeLeft % 60;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="progress-text">
          Question {currentQuestion} of {totalQuestions}
        </span>
        {avgTimePerQuestion > 0 && estimatedTimeLeft > 0 && (
          <span className="time-estimate">
            ~{minutes}:{seconds.toString().padStart(2, '0')} left
          </span>
        )}
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
