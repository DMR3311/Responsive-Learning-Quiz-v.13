// src/utils/wordpress.js
// WordPress REST endpoint for quiz results. Primary reporting target.
const WP_ENDPOINT =
  import.meta.env.VITE_WP_ENDPOINT ||
  'https://braintrain.org/wp-json/braintrain/v1/results';

const WP_SECRET = import.meta.env.VITE_WP_RESULTS_SECRET || '';

export async function sendToWordPress(payload) {
  if (!WP_ENDPOINT) {
    console.warn('WordPress endpoint not configured');
    return { success: false, error: 'Not configured' };
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (WP_SECRET) {
      headers['X-Braintrain-Secret'] = WP_SECRET;
    }

    const resp = await fetch(WP_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // non-JSON response is allowed
    }

    return resp.ok
      ? { success: true, body: json || text }
      : { success: false, status: resp.status, body: text };
  } catch (err) {
    console.error('WP error:', err);
    return { success: false, error: String(err) };
  }
}
