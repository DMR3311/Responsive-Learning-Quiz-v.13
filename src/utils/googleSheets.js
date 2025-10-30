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
  const userName = user?.isGuest ? 'Guest' : (user?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown');
  const userEmail = user?.email || 'guest@example.com';
  const totalQuestions = history.length;
  const masteryAnswers = history.filter(h => h.answerClass === 'mastery').length;
  const proficientAnswers = history.filter(h => h.answerClass === 'proficient').length;
  const developingAnswers = history.filter(h => h.answerClass === 'developing').length;
  const overallAccuracy = totalQuestions > 0 ? Math.round((masteryAnswers / totalQuestions) * 100) : 0;

  const avgTime = questionTimes.length > 0
    ? Math.round(questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length)
    : 0;

  const domainBreakdown = history.reduce((acc, h) => {
    if (!acc[h.domain]) {
      acc[h.domain] = { mastery: 0, proficient: 0, developing: 0, total: 0, scoreDelta: 0 };
    }
    acc[h.domain].total++;
    acc[h.domain][h.answerClass]++;
    acc[h.domain].scoreDelta += h.scoreDelta;
    return acc;
  }, {});

  const domainReport = Object.entries(domainBreakdown).map(([domain, stats]) => {
    const accuracy = Math.round((stats.mastery / stats.total) * 100);
    return `${domain.toUpperCase()}: ${accuracy}% mastery (${stats.mastery}/${stats.total} optimal, Score: ${stats.scoreDelta})`;
  }).join('\n');

  const performanceLevel = overallAccuracy >= 80 ? 'Excellent' :
                          overallAccuracy >= 60 ? 'Good' :
                          overallAccuracy >= 40 ? 'Average' : 'Developing';

  const readableReport = `
QUIZ RESULTS REPORT
==================
Name: ${userName}
Email: ${userEmail}
Mode: ${mode}
Date: ${new Date().toLocaleString()}

OVERALL PERFORMANCE
-------------------
Final Score: ${finalScore} points
Accuracy: ${overallAccuracy}%
Performance Level: ${performanceLevel}
Questions Answered: ${totalQuestions}

ANSWER BREAKDOWN
----------------
✓ Mastery: ${masteryAnswers} questions (${Math.round((masteryAnswers/totalQuestions)*100)}%)
○ Proficient: ${proficientAnswers} questions (${Math.round((proficientAnswers/totalQuestions)*100)}%)
△ Developing: ${developingAnswers} questions (${Math.round((developingAnswers/totalQuestions)*100)}%)

DOMAIN PERFORMANCE
------------------
${domainReport}

TIMING
------
Average Time per Question: ${avgTime}ms
Total Duration: ${Math.round((questionTimes.reduce((a, b) => a + b, 0)) / 1000)}s
`;

  return {
    name: userName,
    email: userEmail,
    results_json: {
      report: readableReport,
      summary: {
        version: 'v1.0',
        score: finalScore,
        accuracy: overallAccuracy,
        performance_level: performanceLevel,
        mode: mode,
        total_questions: totalQuestions,
        mastery_answers: masteryAnswers,
        proficient_answers: proficientAnswers,
        developing_answers: developingAnswers,
        avg_time_ms: avgTime,
        duration_sec: Math.round((questionTimes.reduce((a, b) => a + b, 0)) / 1000),
        domains: Object.entries(domainBreakdown).map(([domain, stats]) => ({
          domain,
          accuracy: Math.round((stats.mastery / stats.total) * 100),
          mastery: stats.mastery,
          proficient: stats.proficient,
          developing: stats.developing,
          total: stats.total,
          score_delta: stats.scoreDelta
        }))
      },
      detailed_history: history
    },
    source_url: window.location.href,
    user_agent: navigator.userAgent
  };
};
