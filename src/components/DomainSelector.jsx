import { getDomainConfig } from '../utils/domainConfig';

export function DomainSelector({ selectedDomain, onSelectDomain, onStart }) {
  const domains = [
    {
      id: 'time',
      description: 'Assess your ability to delay gratification, plan ahead, and consider future consequences'
    },
    {
      id: 'social',
      description: 'Evaluate your understanding of social dynamics, empathy, and interpersonal reasoning'
    },
    {
      id: 'evidence',
      description: 'Test your skills in analyzing information, identifying credible sources, and drawing conclusions'
    },
    {
      id: 'risk',
      description: 'Measure your capability to assess dangers, weigh options, and make safe decisions'
    },
    {
      id: 'critical',
      description: 'Challenge your logical reasoning, problem-solving, and analytical thinking abilities'
    },
    {
      id: 'metacognition',
      description: 'Explore your awareness of your own thinking processes and learning strategies'
    }
  ];

  return (
    <div className="domain-selector">
      <div className="domain-selector-header">
        <h2>Choose Your Domain</h2>
        <p className="domain-selector-subtitle">Focus on one specific reasoning skill with 10 targeted questions</p>
      </div>

      <div className="domain-grid">
        {domains.map((domain) => {
          const config = getDomainConfig(domain.id);
          return (
            <button
              key={domain.id}
              className={`domain-card ${selectedDomain === domain.id ? 'selected' : ''}`}
              onClick={() => onSelectDomain(domain.id)}
              style={{
                '--domain-color': config.color,
                '--domain-bg': config.bgColor,
                '--domain-border': config.borderColor
              }}
            >
              <div className="domain-card-content">
                <div className="domain-icon">{config.icon}</div>
                <h3>{config.name}</h3>
                <p className="domain-description">{domain.description}</p>
                <div className="domain-info">
                  <span className="question-count">10 questions</span>
                  <span className="duration">~8 min</span>
                </div>
              </div>
              {selectedDomain === domain.id && (
                <div className="domain-selected-badge">Selected</div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDomain && (
        <div className="domain-start-section">
          <div className="selected-domain-info">
            <span className="info-icon">{getDomainConfig(selectedDomain).icon}</span>
            <div>
              <strong>{getDomainConfig(selectedDomain).name} Assessment</strong>
              <p>10 adaptive questions focused on this domain</p>
            </div>
          </div>
          <button className="btn btn-primary btn-large" onClick={onStart}>
            Start Assessment →
          </button>
        </div>
      )}
    </div>
  );
}
