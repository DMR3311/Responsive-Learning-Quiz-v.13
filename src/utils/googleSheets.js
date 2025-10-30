export const sendToGoogleSheets = async (data) => {
  const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn('Google Apps Script URL not configured');
    return { success: false, error: 'Not configured' };
  }

  try {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    });

    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
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
  const timestamp = new Date().toISOString();
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

  return {
    'entry.1275479195': timestamp,
    'entry.2073083002': userName,
    'entry.115684590': mode,
    'entry.2127587595': finalScore,
    'entry.945932637': totalQuestions,
    'entry.972441326': optimalAnswers,
    'entry.137391057': avgTime,
    'entry.2014439510': Object.entries(domainBreakdown)
      .map(([domain, stats]) => `${domain}: ${stats.optimal}/${stats.total}`)
      .join(', '),
    'entry.1901019359': JSON.stringify(history)
  };
};
