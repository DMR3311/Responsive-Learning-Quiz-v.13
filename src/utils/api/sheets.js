// /api/sheets.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;
  if (!GAS_WEB_APP_URL) {
    return res.status(500).json({ ok: false, error: 'GAS_WEB_APP_URL is not set' });
  }

  try {
    // Forward the body to Google Apps Script Web App
    const f = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Vercel already parsed JSON into req.body if content-type is application/json
      body: JSON.stringify(req.body || {}),
    });

    const text = await f.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { ok: f.ok, raw: text }; }

    // Mirror GAS status
    return res.status(f.ok ? 200 : f.status).json(data);
  } catch (err) {
    console.error('[api/sheets] Proxy error:', err);
    return res.status(502).json({ ok: false, error: 'Proxy error: ' + err.message });
  }
}
