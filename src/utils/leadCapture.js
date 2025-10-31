// src/utils/leadCapture.js
const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

function toFormBody(obj) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    params.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
  });
  return params;
}

export async function captureLeadAndResults(data) {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn('[LeadCapture] Google Apps Script URL not configured');
    return { ok: false, error: 'Integration not configured' };
  }

  const payload = {
    name: data.name?.trim() || '',
    email: (data.email || '').trim().toLowerCase(),
    results_json: data.results_json || {},
    source_url: typeof window !== 'undefined' ? window.location.href : '',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  };

  try {
    // IMPORTANT: No headers, no JSON. Use form body to avoid CORS preflight.
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: toFormBody(payload)
    });

    // GAS returns JSON text — parse safely
    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { ok: false, error: 'Invalid response from Apps Script', raw: text };
    }

    if (!response.ok) {
      console.error('[LeadCapture] HTTP error:', response.status, text);
      return { ok: false, error: `HTTP ${response.status}`, raw: result };
    }

    return result;
  } catch (err) {
    console.error('[LeadCapture] Network error:', err);
    return { ok: false, error: err.message };
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
    score: quizResults?.totalScore || 0,
    percentage: quizResults?.percentage || 0,
    domains: quizResults?.domainScores || [],
    difficulty: quizResults?.difficulty || 'mixed',
    mode: quizResults?.mode || 'practice',
    total_questions: quizResults?.totalQuestions || 0,
    correct_answers: quizResults?.correctAnswers || 0,
    duration_sec: quizResults?.duration || 0,
    completed_at: new Date().toISOString(),
    status: 'completed'
  };

  return captureLeadAndResults({
    name,
    email,
    results_json: resultsPayload
  });
}
