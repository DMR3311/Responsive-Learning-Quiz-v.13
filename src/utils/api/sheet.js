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
    const upstream = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });

    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { ok: upstream.ok, raw: text }; }

    return res.status(upstream.ok ? 200 : upstream.status).json(data);
  } catch (err) {
    console.error('[api/sheets] Proxy error:', err);
    return res.status(502).json({ ok: false, error: 'Proxy error: ' + err.message });
  }
}
