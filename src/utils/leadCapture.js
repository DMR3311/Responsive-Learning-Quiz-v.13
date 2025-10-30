const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

export async function captureLeadAndResults(data) {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn('Google Apps Script URL not configured');
    return { ok: false, error: 'Integration not configured' };
  }

  const payload = {
    name: data.name,
    email: data.email,
    results_json: data.results_json,
    source_url: window.location.href,
    user_agent: navigator.userAgent
  };

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'cors'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lead capture failed:', errorText);
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Lead capture error:', error);
    return { ok: false, error: error.message };
  }
}

export async function captureInitialLead(name, email) {
  return captureLeadAndResults({
    name,
    email,
    results_json: {
      version: 'v1.0',
      score: 0,
      status: 'started',
      timestamp: new Date().toISOString()
    }
  });
}

export async function captureQuizResults(name, email, quizResults) {
  const resultsPayload = {
    version: 'v1.0',
    score: quizResults.totalScore || 0,
    percentage: quizResults.percentage || 0,
    domains: quizResults.domainScores || [],
    difficulty: quizResults.difficulty || 'mixed',
    mode: quizResults.mode || 'practice',
    total_questions: quizResults.totalQuestions || 0,
    correct_answers: quizResults.correctAnswers || 0,
    duration_sec: quizResults.duration || 0,
    completed_at: new Date().toISOString(),
    status: 'completed'
  };

  return captureLeadAndResults({
    name,
    email,
    results_json: resultsPayload
  });
}
