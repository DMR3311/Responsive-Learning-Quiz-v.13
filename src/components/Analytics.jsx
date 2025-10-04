export function Analytics({ history, domainStats }) {
  const domains = ['time', 'social', 'evidence', 'logic', 'risk', 'probability', 'metacognition', 'critical'];

  const domainColors = {
    time: '#009DDC',
    social: '#F72585',
    evidence: '#5BD0F4',
    logic: '#10B981',
    risk: '#C41D56',
    probability: '#14B8A6',
    metacognition: '#3F90A9',
    critical: '#EF4444'
  };

  const getPercentage = (correct, total) => {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const domainPerformance = domains.map(domain => {
    const domainAnswers = history.filter(h => h.domain === domain);
    const optimal = domainAnswers.filter(h => h.answerClass === 'mastery').length;
    const total = domainAnswers.length;
    return {
      domain,
      optimal,
      total,
      percentage: getPercentage(optimal, total)
    };
  }).filter(d => d.total > 0);

  const overallCorrect = history.filter(h => h.answerClass === 'mastery').length;
  const overallPercentage = getPercentage(overallCorrect, history.length);

  return (
    <div className="analytics-container">
      <h2>Performance Analytics</h2>

      <div className="analytics-summary">
        <div className="summary-stat">
          <span className="stat-value">{overallPercentage}%</span>
          <span className="stat-label">Mastery Rate</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">{history.length}</span>
          <span className="stat-label">Questions Answered</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">{overallCorrect}</span>
          <span className="stat-label">Mastery Responses</span>
        </div>
      </div>

      <div className="domain-breakdown">
        <h3>Domain Performance</h3>
        {domainPerformance.map(({ domain, optimal, total, percentage }) => (
          <div key={domain} className="domain-stat">
            <div className="domain-header">
              <span className="domain-name">{domain}</span>
              <span className="domain-score">{optimal}/{total} ({percentage}%)</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: domainColors[domain]
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
