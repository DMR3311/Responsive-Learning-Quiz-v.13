export const sendToGoogleSheets = async (data) => {
  const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbwN3B4td-NV2PEC0bn_ARjXFOOWtOZAQ29OxHIgXkTzppAxMTNtFfe76uQV_z8UzaI/exec';

  console.log('[GoogleSheets] Webhook URL:', GOOGLE_APPS_SCRIPT_URL);

  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn('[GoogleSheets] URL not configured');
    return { success: false, error: 'Not configured' };
  }

  const payloadSize = JSON.stringify(data).length;
  console.log('[GoogleSheets] Sending data:', data);
  console.log('[GoogleSheets] Payload size:', payloadSize, 'bytes');

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    console.log('[GoogleSheets] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleSheets] Error response:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    console.log('[GoogleSheets] Success response:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[GoogleSheets] Request failed:', error);
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

  // Calculate maximum possible score (mastery answers get highest score_delta)
  const maxPossibleScore = history.reduce((sum, item) => {
    // For difficulty 3 questions, mastery gets +5 bonus
    const bonus = item.difficulty === 3 && item.answerClass === 'mastery' ? 5 : 0;
    // Maximum base score_delta for mastery is typically 3, but we use the actual mastery score
    return sum + (item.answerClass === 'mastery' ? item.scoreDelta :
                  item.difficulty === 3 ? 8 : // 3 base + 5 bonus for level 3
                  item.difficulty === 2 ? 2 :
                  1); // difficulty 1
  }, 0);

  const scoreDisplay = `${finalScore}/${maxPossibleScore}`;

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

  const domainStats = Object.entries(domainBreakdown).map(([domain, stats]) => ({
    domain,
    ...stats,
    accuracy: Math.round((stats.mastery / stats.total) * 100)
  }));

  const timestamp = new Date().toLocaleString();

  return {
    name: userName,
    email: userEmail,
    results_json: {
      version: 'v1.0',
      score: scoreDisplay,
      summary: {
        accuracy: overallAccuracy,
        mode: mode,
        total_questions: totalQuestions,
        mastery_answers: masteryAnswers,
        proficient_answers: proficientAnswers,
        developing_answers: developingAnswers,
        avg_time_ms: avgTime,
        duration_sec: Math.round((questionTimes.reduce((a, b) => a + b, 0)) / 1000),
        domains: domainStats.map(({ domain, accuracy, mastery, proficient, developing, total, scoreDelta }) => ({
          domain,
          accuracy,
          mastery,
          proficient,
          developing,
          total,
          score_delta: scoreDelta
        }))
      },
      detailed_history: history.map(h => ({
        domain: h.domain,
        difficulty: h.difficulty,
        answer_class: h.answerClass,
        score_delta: h.scoreDelta
      }))
    }
  };
};
