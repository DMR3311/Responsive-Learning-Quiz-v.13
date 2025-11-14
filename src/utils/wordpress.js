
// src/utils/wordpress.js
const WORDPRESS_API_BASE =
  import.meta.env.VITE_WORDPRESS_API_BASE ||
  'https://staging3.braintrain.org/wp-json/braintrain/v1';

export async function sendToWordPress(quizSummary) {
  try {
    const resp = await fetch(`${WORDPRESS_API_BASE}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quizSummary),
    });

    const text = await resp.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}

    return resp.ok
      ? { success: true, body: json || text }
      : { success: false, status: resp.status, body: text };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
