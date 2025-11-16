const API_BASE = (import.meta.env.VITE_WORDPRESS_API_URL || 'https://braintrain.org/wp-json').replace(/\/$/, '');
const AUTH_ENDPOINT = import.meta.env.VITE_WORDPRESS_AUTH_ENDPOINT || 'braintrain/v1/auth';

export async function loginOrRegister(name, email) {
  const url = `${API_BASE}/${AUTH_ENDPOINT}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email }),
  });

  const text = await resp.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    console.error('Failed to parse auth response JSON', e);
  }

  if (!resp.ok || !json || json.success === false) {
    const message = (json && (json.error || json.message)) || resp.statusText || 'Authentication failed';
    throw new Error(message);
  }

  const user = json.user || {
    id: json.user_id || null,
    email,
    name,
  };

  return {
    user,
    token: json.token || null,
  };
}
