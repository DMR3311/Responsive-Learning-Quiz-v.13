import { useState } from 'react';

export function DifficultySelector({ onSelect, selectedDifficulty }) {
  const difficulties = [
    {
      id: 'adaptive',
      name: 'Adaptive',
      description: 'Adjusts to your performance',
      icon: '🎯',
      recommended: true
    },
    {
      id: 'quick',
      name: 'Quick Assessment',
      description: '15-20 questions',
      icon: '⚡',
      recommended: false
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive',
      description: '40+ questions for deep insights',
      icon: '🔬',
      recommended: false
    }
  ];

  return (
    <div className="difficulty-selector">
      <h3 className="selector-title">Choose Your Path</h3>
      <div className="difficulty-options">
        {difficulties.map((diff, index) => (
          <div
            key={diff.id}
            className={`difficulty-option ${selectedDifficulty === diff.id ? 'selected' : ''}`}
            onClick={() => onSelect(diff.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="difficulty-icon">{diff.icon}</div>
            <div className="difficulty-content">
              <h4>
                {diff.name}
                {diff.recommended && <span className="recommended-badge">Recommended</span>}
              </h4>
              <p>{diff.description}</p>
            </div>
            <div className="difficulty-check">
              {selectedDifficulty === diff.id && <span>✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
