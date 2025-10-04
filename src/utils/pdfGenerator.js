export const generatePDFReport = (history, finalScore, user) => {
  const optimalAnswers = history.filter(h => h.answerClass === 'mastery').length;
  const typicalAnswers = history.filter(h => h.answerClass === 'proficient').length;
  const regressiveAnswers = history.filter(h => h.answerClass === 'developing').length;
  const overallAccuracy = Math.round((optimalAnswers / history.length) * 100);

  const domainStats = {};
  history.forEach(item => {
    if (!domainStats[item.domain]) {
      domainStats[item.domain] = {
        mastery: 0,
        proficient: 0,
        developing: 0,
        total: 0,
        scoreDelta: 0
      };
    }
    domainStats[item.domain].total++;
    domainStats[item.domain][item.answerClass]++;
    domainStats[item.domain].scoreDelta += item.scoreDelta;
  });

  const domainBreakdown = Object.entries(domainStats).map(([domain, stats]) => ({
    domain,
    ...stats,
    accuracy: Math.round((stats.mastery / stats.total) * 100)
  }));

  const timestamp = new Date().toLocaleString();
  const userName = user?.name || user?.email || 'Guest User';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Blueprint - Quiz Report</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #1a202c;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #F72585;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #F72585;
      margin: 0;
      font-size: 36px;
    }
    .header p {
      color: #718096;
      margin: 10px 0 0 0;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-box {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .stat-label {
      color: #718096;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .stat-value {
      color: #F72585;
      font-size: 32px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      color: #2d3748;
      font-size: 24px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
    }
    .breakdown-item {
      margin-bottom: 16px;
    }
    .breakdown-label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .color-box {
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }
    .color-mastery { background: #48bb78; }
    .color-proficient { background: #ed8936; }
    .color-developing { background: #f56565; }
    .breakdown-bar {
      width: 100%;
      height: 30px;
      background: #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
    }
    .breakdown-fill {
      height: 100%;
      float: left;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .fill-mastery { background: #48bb78; }
    .fill-proficient { background: #ed8936; }
    .fill-developing { background: #f56565; }
    .domain-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .domain-card {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
    }
    .domain-card h3 {
      color: #2d3748;
      margin-top: 0;
      text-transform: capitalize;
    }
    .domain-stat {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .domain-stat-label {
      color: #718096;
    }
    .domain-stat-value {
      font-weight: bold;
      color: #2d3748;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #718096;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${userName}'s Report</h1>
    <p>${timestamp}</p>
  </div>

  <div class="summary">
    <div class="stat-box">
      <div class="stat-label">Questions Answered</div>
      <div class="stat-value">${history.length}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Total Score</div>
      <div class="stat-value">${finalScore}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Mastery Responses</div>
      <div class="stat-value">${optimalAnswers}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Mastery Rate</div>
      <div class="stat-value">${overallAccuracy}%</div>
    </div>
  </div>

  <div class="section">
    <h2>Answer Breakdown</h2>
    <div class="breakdown-item">
      <div class="breakdown-label">
        <div class="color-box color-mastery"></div>
        <span>Mastery Responses (${optimalAnswers})</span>
      </div>
      <div class="breakdown-bar">
        <div class="breakdown-fill fill-mastery" style="width: ${(optimalAnswers / history.length) * 100}%">
          ${Math.round((optimalAnswers / history.length) * 100)}%
        </div>
      </div>
    </div>
    <div class="breakdown-item">
      <div class="breakdown-label">
        <div class="color-box color-proficient"></div>
        <span>Proficient Answers (${typicalAnswers})</span>
      </div>
      <div class="breakdown-bar">
        <div class="breakdown-fill fill-proficient" style="width: ${(typicalAnswers / history.length) * 100}%">
          ${Math.round((typicalAnswers / history.length) * 100)}%
        </div>
      </div>
    </div>
    <div class="breakdown-item">
      <div class="breakdown-label">
        <div class="color-box color-developing"></div>
        <span>Developing Skills (${regressiveAnswers})</span>
      </div>
      <div class="breakdown-bar">
        <div class="breakdown-fill fill-developing" style="width: ${(regressiveAnswers / history.length) * 100}%">
          ${Math.round((regressiveAnswers / history.length) * 100)}%
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Performance by Domain</h2>
    <div class="domain-grid">
      ${domainBreakdown.map(({ domain, total, accuracy, scoreDelta }) => `
        <div class="domain-card">
          <h3>${domain.charAt(0).toUpperCase() + domain.slice(1)}</h3>
          <div class="domain-stat">
            <span class="domain-stat-label">Questions:</span>
            <span class="domain-stat-value">${total}</span>
          </div>
          <div class="domain-stat">
            <span class="domain-stat-label">Mastery:</span>
            <span class="domain-stat-value">${accuracy}%</span>
          </div>
          <div class="domain-stat">
            <span class="domain-stat-label">Score:</span>
            <span class="domain-stat-value">${scoreDelta > 0 ? '+' : ''}${scoreDelta}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="footer">
    <p>Generated by Blueprint</p>
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `braintrain-report-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
