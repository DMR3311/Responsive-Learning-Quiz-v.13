const WP_ENDPOINT =
  import.meta.env.VITE_WP_ENDPOINT ||
  'https://braintrain.org/wp-json/braintrain/v1/results';

const WP_SECRET = import.meta.env.VITE_WP_RESULTS_SECRET || '';

export async function sendToWordPress(payload) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (WP_SECRET) headers['X-Braintrain-Secret'] = WP_SECRET;

    const resp = await fetch(WP_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return resp.ok ? { success: true } : { success: false };
  } catch (err) {
    return { success: false };
  }
}
