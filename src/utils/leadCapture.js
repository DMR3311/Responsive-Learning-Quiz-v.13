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

    // src/utils/leadCapture.js

// --- Low-level sender: always use the Vercel proxy ---
async function postToSheets({ name, email, results_json }) {
  // basic client-side sanity checks
  const N = String(name || '').trim();
  const E = String(email || '').trim().toLowerCase();
  if (!N) throw new Error('Name required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(E)) throw new Error('Invalid email');
  if (!results_json || typeof results_json !== 'object') throw new Error('results_json required');
  if (!results_json.version) throw new Error('results_json.version required');

  const res = await fetch('/api/sheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: N,
      email: E,
      results_json,
      source_url: typeof window !== 'undefined' ? window.location.href : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    })
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { ok: res.ok, raw: text }; }

  if (!res.ok || data?.ok === false) {
    const msg = data?.error || `Sheets proxy failed (HTTP ${res.status})`;
    console.error('[LeadCapture] HTTP error:', res.status, text);
    throw new Error(msg);
  }
  return data;
}

// --- Public API used by your app ---

// Single entry point your code can call directly if it already has results
export async function captureLeadAndResults({ name, email, results_json }) {
  try {
    const result = await postToSheets({ name, email, results_json });
    return result; // { ok: true, ... } from GAS proxy
  } catch (err) {
    console.error('[LeadCapture] Network/logic error:', err);
    return { ok: false, error: err.message };
  }
}

// Fire when user starts the quiz (captures initial lead)
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

// Fire when user finishes the quiz (captures full results)
export async function captureQuizResults(name, email, quizResults) {
  const resultsPayload = {
    version: 'v1.0',
    score: quizResults?.totalScore ?? 0,
    percentage: quizResults?.percentage ?? 0,
    domains: quizResults?.domainScores ?? [],
    difficulty: quizResults?.difficulty ?? 'mixed',
    mode: quizResults?.mode ?? 'practice',
    total_questions: quizResults?.totalQuestions ?? 0,
    correct_answers: quizResults?.correctAnswers ?? 0,
    duration_sec: quizResults?.duration ?? 0,
    completed_at: new Date().toISOString(),
    status: 'completed'
  };

  return captureLeadAndResults({ name, email, results_json: resultsPayload });
}

