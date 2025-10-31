// api/sheets.js
export default async function handler(req, res) {
  // Allow these origins to call the API (your WP page + quiz app)
  const allowed = [
    'https://braintrain.org',
    'https://www.braintrain.org',
    'https://responsive-learning-quiz-v-13.vercel.app'
  ];
  const origin = req.headers.origin || '';
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { name, email, results_json, source_url, user_agent } = req.body || {};
    if (!name || !email || !results_json) {
      return res.status(400).json({ ok: false, error: 'Missing name, email, or results_json' });
    }

    const gasUrl = process.env.GAS_WEB_APP_URL;
    if (!gasUrl) return res.status(500).json({ ok: false, error: 'GAS_WEB_APP_URL not configured' });

    // Send to GAS as form-encoded (simplest for Apps Script)
    const form = new URLSearchParams();
    form.set('name', name);
    form.set('email', email);
    form.set('results_json', JSON.stringify(results_json));
    form.set('source_url', source_url || '');
    form.set('user_agent', user_agent || '');

    const forward = await fetch(gasUrl, { method: 'POST', body: form });
    const text = await forward.text();

    let data;
    try { data = JSON.parse(text); } catch { data = { ok: true, raw: text }; }

    const status = forward.ok ? 200 : 502;
    res.status(status).json(data);
  } catch (err) {
    console.error('[api/sheets] error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
