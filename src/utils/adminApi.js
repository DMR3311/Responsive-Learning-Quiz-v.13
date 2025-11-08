const wordpressBaseUrl = (import.meta.env.VITE_WORDPRESS_API_URL || 'https://braintrain.org/wp-json').replace(/\/$/, '');
const analyticsNamespace = import.meta.env.VITE_WORDPRESS_ANALYTICS_NAMESPACE || 'braintrain/v1';
const visitsEndpoint = import.meta.env.VITE_WORDPRESS_VISITS_ENDPOINT || `${analyticsNamespace}/analytics/visits`;
const signupsEndpoint = import.meta.env.VITE_WORDPRESS_SIGNUPS_ENDPOINT || `${analyticsNamespace}/marketing/email-signups`;
const purchasesEndpoint = import.meta.env.VITE_WORDPRESS_PURCHASES_ENDPOINT || `${analyticsNamespace}/commerce/orders`;
const schedulingEndpoint = import.meta.env.VITE_WORDPRESS_SCHEDULING_ENDPOINT || `${analyticsNamespace}/operations/schedule`;
const notificationsEndpoint = import.meta.env.VITE_WORDPRESS_NOTIFICATIONS_ENDPOINT || `${analyticsNamespace}/operations/notifications`;
const wordpressAppUser = import.meta.env.VITE_WORDPRESS_APP_USER;
const wordpressAppPassword = import.meta.env.VITE_WORDPRESS_APP_PASSWORD;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://0ec90b57d6e95fcbda19832f.supabase.co';

const parseJSON = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('Failed to parse JSON response:', error);
    return null;
  }
};

const withRangeParams = (url, range) => {
  if (!range) return url;
  const { start, end } = range;
  if (start) url.searchParams.set('start', new Date(start).toISOString());
  if (end) url.searchParams.set('end', new Date(end).toISOString());
  return url;
};

const toBase64 = (value) => {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(value);
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.btoa === 'function') {
    return globalThis.btoa(value);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value).toString('base64');
  }
  throw new Error('No base64 encoder available in this environment');
};

const createWordPressHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (wordpressAppUser && wordpressAppPassword) {
    const token = toBase64(`${wordpressAppUser}:${wordpressAppPassword}`);
    headers['Authorization'] = `Basic ${token}`;
  }
  return headers;
};

const fetchFromWordPress = async (endpoint, { range, signal } = {}) => {
  const url = new URL(`${wordpressBaseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`);
  withRangeParams(url, range);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: createWordPressHeaders(),
    signal,
  });

  if (!response.ok) {
    const errorBody = await parseJSON(response);
    const message = errorBody?.message || errorBody?.error || response.statusText;
    throw new Error(`WordPress API error (${endpoint}): ${message}`);
  }

  return parseJSON(response);
};

export const fetchSiteVisits = async ({ range, signal } = {}) => {
  return fetchFromWordPress(visitsEndpoint, { range, signal });
};

export const fetchEmailSignups = async ({ range, signal } = {}) => {
  return fetchFromWordPress(signupsEndpoint, { range, signal });
};

export const fetchClassPurchases = async ({ range, signal } = {}) => {
  return fetchFromWordPress(purchasesEndpoint, { range, signal });
};

export const fetchScheduleData = async ({ range, signal } = {}) => {
  return fetchFromWordPress(schedulingEndpoint, { range, signal });
};

export const fetchNotificationLog = async ({ range, signal } = {}) => {
  return fetchFromWordPress(notificationsEndpoint, { range, signal });
};

export const fetchQuizAnalytics = async ({ adminPassword, range, signal } = {}) => {
  const url = new URL(`${supabaseUrl}/functions/v1/admin-data`);
  withRangeParams(url, range);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': adminPassword ? `Bearer ${adminPassword}` : undefined,
      'Content-Type': 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    const errorBody = await parseJSON(response);
    const message = errorBody?.message || errorBody?.error || response.statusText;
    throw new Error(`Quiz analytics error: ${message}`);
  }

  return parseJSON(response);
};

export const generateFallbackSeries = (days, baseValue = 100, variance = 0.25) => {
  const series = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const change = (Math.random() - 0.5) * variance * baseValue;
    const value = Math.max(0, Math.round(baseValue + change));
    series.push({ date: date.toISOString().split('T')[0], value });
  }
  return series;
};

export const aggregateSeriesTotal = (series) => {
  if (!Array.isArray(series)) return 0;
  return series.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
};

export const calculateTrend = (series) => {
  if (!Array.isArray(series) || series.length < 2) return 0;
  const midpoint = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, midpoint);
  const secondHalf = series.slice(midpoint);
  const firstTotal = aggregateSeriesTotal(firstHalf);
  const secondTotal = aggregateSeriesTotal(secondHalf);
  if (firstTotal === 0) return secondTotal === 0 ? 0 : 100;
  return Number((((secondTotal - firstTotal) / firstTotal) * 100).toFixed(1));
};

export const normalizeSignupResponse = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return {
      total: data.length,
      series: data.map((entry) => ({
        date: entry.date || entry.created_at || entry.timestamp,
        value: entry.count || 1,
      })),
      recent: data
        .slice(0, 10)
        .map((entry) => ({
          email: entry.email || entry.contact || 'Unknown',
          date: entry.date || entry.created_at || entry.timestamp,
          source: entry.source || entry.form || 'Unknown',
        })),
      sources: Object.entries(
        data.reduce((acc, entry) => {
          const key = entry.source || entry.form || 'Unknown';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {})
      ).map(([label, value]) => ({ label, value })),
    };
  }

  return {
    total: data.total || 0,
    series: data.series || [],
    recent: data.recent || [],
    sources: data.sources || [],
  };
};

export const normalizeVisitResponse = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return {
      total: aggregateSeriesTotal(data.map((entry) => ({
        date: entry.date || entry.period,
        value: entry.visits || entry.sessions || entry.count || 0,
      }))),
      series: data.map((entry) => ({
        date: entry.date || entry.period,
        value: entry.visits || entry.sessions || entry.count || 0,
      })),
      breakdown: data
        .filter((entry) => entry.source)
        .map((entry) => ({
          label: entry.source,
          value: entry.count || entry.visits || entry.sessions || 0,
        })),
    };
  }

  return {
    total: data.total || aggregateSeriesTotal(data.series),
    series: data.series || [],
    breakdown: data.breakdown || [],
  };
};

export const normalizePurchaseResponse = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    const totalRevenue = data.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    return {
      totalRevenue,
      orderCount: data.length,
      topProducts: Object.entries(
        data.reduce((acc, order) => {
          if (!Array.isArray(order.items)) return acc;
          order.items.forEach((item) => {
            const key = item.name || item.product || 'Unknown';
            acc[key] = (acc[key] || 0) + (Number(item.quantity) || 0);
          });
          return acc;
        }, {})
      )
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity })),
      recentOrders: data
        .slice(0, 5)
        .map((order) => ({
          id: order.id || order.order_id,
          customer: order.customer || order.billing_name || 'Unknown',
          total: Number(order.total) || 0,
          status: order.status || 'completed',
          created_at: order.date || order.created_at,
        })),
    };
  }

  return {
    totalRevenue: data.totalRevenue || 0,
    orderCount: data.orderCount || 0,
    topProducts: data.topProducts || [],
    recentOrders: data.recentOrders || [],
  };
};

export const normalizeScheduleResponse = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return {
      upcoming: data.filter((entry) => entry.status === 'upcoming' || entry.status === 'confirmed'),
      overdue: data.filter((entry) => entry.status === 'overdue'),
      completed: data.filter((entry) => entry.status === 'completed'),
    };
  }

  return {
    upcoming: data.upcoming || [],
    overdue: data.overdue || [],
    completed: data.completed || [],
  };
};

export const normalizeNotificationResponse = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return {
      pending: data.filter((entry) => entry.status === 'pending'),
      sent: data.filter((entry) => entry.status === 'sent'),
      failed: data.filter((entry) => entry.status === 'failed'),
    };
  }

  return {
    pending: data.pending || [],
    sent: data.sent || [],
    failed: data.failed || [],
  };
};
