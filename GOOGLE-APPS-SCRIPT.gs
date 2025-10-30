// ============================================================================
// Braintrain Quiz Results - Google Apps Script Web App
// ============================================================================
// Deploy as Web App with "Anyone" access to receive CORS POST requests
// ============================================================================

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================
const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  SHEET_NAME: 'Submissions',
  DEDUP_WINDOW_MIN: 5,

  KIT_MODE: 'webhook',
  KIT_API_BASE: 'https://api.convertkit.com/v3',
  KIT_API_KEY: 'YOUR_KIT_API_KEY_HERE',
  KIT_FORM_ID: 'YOUR_KIT_FORM_ID_HERE',
  KIT_TAGS: ['braintrain-quiz', 'lead-magnet'],
  KIT_WEBHOOK_URL: 'YOUR_KIT_WEBHOOK_URL_HERE',

  MAX_PAYLOAD_SIZE: 100 * 1024,
  RATE_LIMIT_PER_IP: 10,
  RATE_LIMIT_WINDOW_SEC: 60
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

function doPost(e) {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (!e || !e.postData) {
      return createResponse_({ ok: false, error: 'No data received' }, corsHeaders);
    }

    const contentLength = e.postData.length;
    if (contentLength > CONFIG.MAX_PAYLOAD_SIZE) {
      return createResponse_({ ok: false, error: 'Payload too large' }, corsHeaders);
    }

    const clientIp = e.parameter.userip || 'unknown';
    if (!checkRateLimit_(clientIp)) {
      return createResponse_({ ok: false, error: 'Rate limit exceeded' }, corsHeaders);
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      logError_('JSON parse error', err);
      return createResponse_({ ok: false, error: 'Invalid JSON' }, corsHeaders);
    }

    const validation = validatePayload_(payload);
    if (!validation.valid) {
      return createResponse_({ ok: false, error: validation.error }, corsHeaders);
    }

    const dedupeKey = computeDedupeKey_(payload.email, payload.results_json);
    if (isDuplicate_(dedupeKey)) {
      return createResponse_({ ok: true, dedup: true, message: 'Duplicate submission ignored' }, corsHeaders);
    }

    const rowData = prepareRowData_(payload);
    const success = appendToSheet_(rowData);

    if (!success) {
      return createResponse_({ ok: false, error: 'Failed to write to sheet' }, corsHeaders);
    }

    markAsProcessed_(dedupeKey);

    notifyKit_(payload);

    return createResponse_({ ok: true, message: 'Submission recorded successfully' }, corsHeaders);

  } catch (err) {
    logError_('Unexpected error in doPost', err);
    return createResponse_({ ok: false, error: 'Internal server error' }, corsHeaders);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify({ ok: true }))
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

// ============================================================================
// VALIDATION
// ============================================================================

function validatePayload_(payload) {
  if (!payload.name || typeof payload.name !== 'string') {
    return { valid: false, error: 'Missing or invalid name' };
  }

  const name = stripHtml_(payload.name.trim());
  if (name.length < 1 || name.length > 100) {
    return { valid: false, error: 'Name must be 1-100 characters' };
  }

  if (!payload.email || !isValidEmail_(payload.email)) {
    return { valid: false, error: 'Invalid email address' };
  }

  if (!payload.results_json || typeof payload.results_json !== 'object') {
    return { valid: false, error: 'Missing or invalid results_json' };
  }

  const results = payload.results_json;
  if (!results.score || typeof results.score !== 'number') {
    return { valid: false, error: 'results_json must include numeric score' };
  }

  if (!results.version || typeof results.version !== 'string') {
    return { valid: false, error: 'results_json must include version string' };
  }

  return { valid: true };
}

function isValidEmail_(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function stripHtml_(str) {
  return str.replace(/<[^>]*>/g, '');
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

function computeDedupeKey_(email, resultsJson) {
  const input = email.toLowerCase() + JSON.stringify(resultsJson);
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8
  ).map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function isDuplicate_(dedupeKey) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(dedupeKey);
  return cached !== null;
}

function markAsProcessed_(dedupeKey) {
  const cache = CacheService.getScriptCache();
  cache.put(dedupeKey, '1', CONFIG.DEDUP_WINDOW_MIN * 60);
}

// ============================================================================
// RATE LIMITING
// ============================================================================

function checkRateLimit_(ip) {
  const cache = CacheService.getScriptCache();
  const key = 'ratelimit_' + ip;
  const count = cache.get(key);

  if (count === null) {
    cache.put(key, '1', CONFIG.RATE_LIMIT_WINDOW_SEC);
    return true;
  }

  const currentCount = parseInt(count);
  if (currentCount >= CONFIG.RATE_LIMIT_PER_IP) {
    return false;
  }

  cache.put(key, String(currentCount + 1), CONFIG.RATE_LIMIT_WINDOW_SEC);
  return true;
}

// ============================================================================
// SHEET OPERATIONS
// ============================================================================

function prepareRowData_(payload) {
  const timestamp = new Date().toISOString();
  const name = stripHtml_(payload.name.trim());
  const email = payload.email.toLowerCase().trim();
  const resultsJson = JSON.stringify(payload.results_json);
  const testScore = payload.results_json.score || 0;
  const testVersion = payload.results_json.version || 'unknown';
  const sourceUrl = payload.source_url || '';
  const userAgent = payload.user_agent || '';

  return [
    timestamp,
    name,
    email,
    resultsJson,
    testScore,
    testVersion,
    sourceUrl,
    userAgent
  ];
}

function appendToSheet_(rowData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      const headers = [
        'timestamp',
        'name',
        'email',
        'results_json',
        'test_score',
        'test_version',
        'source_url',
        'user_agent'
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }

    sheet.appendRow(rowData);
    return true;

  } catch (err) {
    logError_('Failed to append to sheet', err);
    return false;
  }
}

// ============================================================================
// KIT INTEGRATION
// ============================================================================

function notifyKit_(payload) {
  if (CONFIG.KIT_MODE === 'off') {
    return;
  }

  try {
    if (CONFIG.KIT_MODE === 'api') {
      notifyKitApi_(payload);
    } else if (CONFIG.KIT_MODE === 'webhook') {
      notifyKitWebhook_(payload);
    }
  } catch (err) {
    logError_('Kit notification failed', err);
  }
}

function notifyKitApi_(payload) {
  const url = `${CONFIG.KIT_API_BASE}/forms/${CONFIG.KIT_FORM_ID}/subscribe`;

  const tags = [...CONFIG.KIT_TAGS];
  if (payload.results_json.version) {
    tags.push(`test:${payload.results_json.version}`);
  }
  if (payload.results_json.score) {
    const bucket = getScoreBucket_(payload.results_json.score);
    tags.push(`score:${bucket}`);
  }
  if (payload.source_url) {
    try {
      const host = new URL(payload.source_url).hostname;
      tags.push(`source:${host}`);
    } catch (e) {}
  }

  const requestPayload = {
    api_key: CONFIG.KIT_API_KEY,
    email: payload.email,
    first_name: payload.name,
    tags: tags,
    fields: {
      quiz_score: payload.results_json.score,
      quiz_version: payload.results_json.version,
      quiz_results: JSON.stringify(payload.results_json)
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(requestPayload),
    muteHttpExceptions: true
  };

  retryWithBackoff_(() => {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error(`Kit API returned ${code}: ${response.getContentText()}`);
    }
  });
}

function notifyKitWebhook_(payload) {
  if (!CONFIG.KIT_WEBHOOK_URL || CONFIG.KIT_WEBHOOK_URL === 'YOUR_KIT_WEBHOOK_URL_HERE') {
    return;
  }

  const webhookPayload = {
    email: payload.email,
    name: payload.name,
    quiz_score: payload.results_json.score,
    quiz_version: payload.results_json.version,
    quiz_results: payload.results_json,
    source_url: payload.source_url,
    timestamp: new Date().toISOString()
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(webhookPayload),
    muteHttpExceptions: true
  };

  retryWithBackoff_(() => {
    const response = UrlFetchApp.fetch(CONFIG.KIT_WEBHOOK_URL, options);
    const code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error(`Kit webhook returned ${code}: ${response.getContentText()}`);
    }
  });
}

function getScoreBucket_(score) {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'average';
  return 'needs-improvement';
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

function retryWithBackoff_(fn, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      fn();
      return;
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        Utilities.sleep(delay);
      }
    }
  }

  logError_('All retry attempts failed', lastError);
}

// ============================================================================
// UTILITIES
// ============================================================================

function createResponse_(data, headers) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

function logError_(message, error) {
  console.error(`${message}: ${error.toString()}`);
  if (error.stack) {
    console.error(error.stack);
  }
}

// ============================================================================
// TEST FUNCTION
// ============================================================================

function testSubmission() {
  const testPayload = {
    postData: {
      contents: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        results_json: {
          version: "v1.0",
          score: 85,
          domains: [
            { id: "logic", pct: 90 },
            { id: "creativity", pct: 80 }
          ],
          raw: [1, 0, 1, 1, 0, 1],
          duration_sec: 300
        },
        source_url: "https://braintrain.org/quiz",
        user_agent: "Mozilla/5.0"
      }),
      length: 500
    },
    parameter: {
      userip: '127.0.0.1'
    }
  };

  const response = doPost(testPayload);
  Logger.log(response.getContent());
}
