export const sendToGoogleSheets = async (data) => {
  const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn('Google Apps Script URL not configured');
    return { success: false, error: 'Not configured' };
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      mode: 'no-cors'
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send to Google Sheets:', error);
    return { success: false, error: error.message };
  }
};

export const formatQuizDataForSheets = (user, mode, history, finalScore, questionTimes) => {
  const userName = user?.isGuest ? 'Guest' : (user?.email || 'Unknown');
  const userEmail = user?.email || 'guest@example.com';
  const totalQuestions = history.length;
  const optimalAnswers = history.filter(h => h.answerClass === 'mastery').length;
  const avgTime = questionTimes.length > 0
    ? Math.round(questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length)
    : 0;

  const domainBreakdown = history.reduce((acc, h) => {
    if (!acc[h.domain]) {
      acc[h.domain] = { total: 0, optimal: 0 };
    }
    acc[h.domain].total++;
    if (h.answerClass === 'mastery') {
      acc[h.domain].optimal++;
    }
    return acc;
  }, {});

  const domainStats = Object.entries(domainBreakdown).map(([domain, stats]) => ({
    id: domain,
    pct: Math.round((stats.optimal / stats.total) * 100)
  }));

  return {
    name: userName,
    email: userEmail,
    results_json: {
      version: 'v1.0',
      score: finalScore,
      mode: mode,
      total_questions: totalQuestions,
      optimal_answers: optimalAnswers,
      avg_time: avgTime,
      domains: domainStats,
      raw: history,
      duration_sec: Math.round((questionTimes.reduce((a, b) => a + b, 0)) / 1000)
    },
    source_url: window.location.href,
    user_agent: navigator.userAgent
  };
};
