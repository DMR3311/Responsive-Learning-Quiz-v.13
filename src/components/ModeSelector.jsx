export function ModeSelector({ selectedMode, onSelectMode, onStart }) {
  const modes = [
    {
      id: 'adaptive',
      name: 'Adaptive Mode',
      description: 'Adjusts to your performance - 20 questions',
      details: 'Dynamically adjusts difficulty based on your answers',
      duration: '~15 min',
      icon: '🎯',
      color: 'blue',
      features: ['Smart difficulty', 'Personalized path', 'Optimal learning']
    },
    {
      id: 'quick',
      name: 'Quick Assessment',
      description: '15 questions at medium difficulty',
      details: 'Perfect for a fast snapshot of your reasoning skills',
      duration: '~10 min',
      icon: '⚡',
      color: 'orange',
      features: ['Fast results', 'Core concepts', 'Time-efficient']
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive',
      description: 'Up to 30 questions for deep insights',
      details: 'Complete assessment across all reasoning domains',
      duration: '~20 min',
      icon: '🔬',
      color: 'red',
      features: ['Full coverage', 'Detailed analysis', 'In-depth feedback']
    },
    {
      id: 'domain',
      name: 'Domain Assessment',
      description: 'Focus on one specific skill area',
      details: 'Deep dive into a single reasoning domain with targeted questions',
      duration: '~8 min',
      icon: '🎓',
      color: 'green',
      features: ['Focused practice', 'Single domain', 'Skill mastery']
    }
  ];

  const selectedModeData = modes.find(m => m.id === selectedMode);

  return (
    <div className="mode-selector">
      <div className="mode-selector-header">
        <h2>Choose Your Challenge</h2>
        <p className="mode-selector-subtitle">Select the quiz mode that matches your goals</p>
      </div>

      <div className="mode-grid">
        {modes.map((mode) => (
          <button
            key={mode.id}
            className={`mode-card ${selectedMode === mode.id ? 'selected' : ''} ${mode.color}`}
            onClick={() => onSelectMode(mode.id)}
          >
            <div className="mode-card-content">
              <div className="mode-icon">{mode.icon}</div>
              <h3>{mode.name}</h3>
              <p className="mode-description">{mode.description}</p>
              <div className="mode-duration">
                <span className="duration-icon">⏱️</span>
                <span>{mode.duration}</span>
              </div>
              <ul className="mode-features">
                {mode.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="feature-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            {selectedMode === mode.id && (
              <div className="mode-selected-badge">Selected</div>
            )}
          </button>
        ))}
      </div>

      {selectedMode && selectedModeData && (
        <div className="mode-start-section">
          <div className="selected-mode-info">
            <span className="info-icon">{selectedModeData.icon}</span>
            <div>
              <strong>{selectedModeData.name}</strong>
              <p>{selectedModeData.details}</p>
            </div>
          </div>
          <button className="btn btn-primary btn-large" onClick={onStart}>
            Start Quiz →
          </button>
        </div>
      )}
    </div>
  );
}
