// ============================================================================
// Braintrain Quiz Results - Google Apps Script Web App
// Deploy as Web App: Execute as "Me", Access "Anyone"
// ============================================================================

const CONFIG = {
  SPREADSHEET_ID: '1Dtp2HWlVhtPHxfH2aESoN2xT-gMo4jSrJzuvmpSUbDk',
  SHEET_NAME: 'Submissions',
  DEDUP_WINDOW_MIN: 5,

  // Kit disabled here; re-enable later if needed
  KIT_MODE: 'off',

  MAX_PAYLOAD_SIZE: 100 * 1024, // 100KB
  RATE_LIMIT_PER_IP: 10,
  RATE_LIMIT_WINDOW_SEC: 60
};

// Health check so GET /exec doesn’t 404
function doGet() {
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

// NOTE: Apps Script cannot set arbitrary response headers via ContentService.
// Avoid preflight by sending application/x-www-form-urlencoded from the browser,
// or proxy JSON through a worker. This handler supports BOTH formats.
function doPost(e) {
  try {
    if (!e || !e.postData) return createResponse_({ ok: false, error: 'No data received' }, 400);

    // Size guard
    const contentLen = (e.postData.contents || '').length;
    if (contentLen > CONFIG.MAX_PAYLOAD_SIZE) {
      return createResponse_({ ok: false, error: 'Payload too large' }, 413);
    }

    // Rate limit
    const ip = getIp_(e);
    if (!checkRateLimit_(ip)) return createResponse_({ ok: false, error: 'Rate limit exceeded' }, 429);

    // Parse body (JSON or form-encoded)
    const payload = parseBody_(e);

    // Validate
    const v = validatePayload_(payload);
    if (!v.valid) return createResponse_({ ok: false, error: v.error }, 400);

    // Dedupe
    const dedupeKey = computeDedupeKey_(payload.email, payload.results_json);
    if (isDuplicate_(dedupeKey)) {
      return createResponse_({ ok: true, dedup: true, message: 'Duplicate submission ignored' }, 200);
    }

    // Append
    const row = prepareRowData_(payload);
    const ok = appendToSheet_(row);
    if (!ok) return createResponse_({ ok: false, error: 'Failed to write to sheet' }, 500);

    // Seal dedupe
    markAsProcessed_(dedupeKey);

    // Optional downstream
    notifyKit_(payload);

    return createResponse_({ ok: true, message: 'Submission recorded successfully' }, 200);

  } catch (err) {
    logError_('Unexpected error in doPost', err);
    return createResponse_({ ok: false, error: 'Internal server error' }, 500);
  }
}

// ============================================================================
// Parsing & Validation
// ============================================================================

function parseBody_(e) {
  const type = String(e.postData.type || '').toLowerCase();
  // Accept JSON and form-encoded
  if (type.indexOf('application/json') !== -1) {
    return JSON.parse(e.postData.contents || '{}');
  } else {
    // form-encoded lands in e.parameter
    const p = Object.assign({}, e.parameter || {});
    // If results_json is a string, parse it
    if (typeof p.results_json === 'string') {
      try { p.results_json = JSON.parse(p.results_json); } catch (_) {}
    }
    return p;
  }
}

function validatePayload_(payload) {
  // name
  if (!payload.name || typeof payload.name !== 'string') return { valid: false, error: 'Missing or invalid name' };
  const name = stripHtml_(payload.name.trim());
  if (name.length < 1 || name.length > 100) return { valid: false, error: 'Name must be 1-100 characters' };

  // email
  if (!payload.email || !isValidEmail_(payload.email)) return { valid: false, error: 'Invalid email address' };

  // results_json
  const r = payload.results_json;
  if (!r || typeof r !== 'object') return { valid: false, error: 'Missing or invalid results_json' };

  // score: allow number OR string (e.g., 24 or "24/30")
  if (typeof r.score !== 'number' && typeof r.score !== 'string') {
    return { valid: false, error: 'results_json.score must be number or string' };
  }

  // version: require string
  if (!r.version || typeof r.version !== 'string') {
    return { valid: false, error: 'results_json.version must be a string' };
  }

  return { valid: true };
}

// ============================================================================
// Dedupe & Rate Limit
// ============================================================================

function computeDedupeKey_(email, resultsJson) {
  const input = email.toLowerCase() + JSON.stringify(resultsJson);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function isDuplicate_(dedupeKey) {
  const cache = CacheService.getScriptCache();
  return cache.get(dedupeKey) !== null;
}

function markAsProcessed_(dedupeKey) {
  CacheService.getScriptCache().put(dedupeKey, '1', CONFIG.DEDUP_WINDOW_MIN * 60);
}

function getIp_(e) {
  const h = (e.headers || {});
  return (e.parameter && e.parameter.userip) || h['x-forwarded-for'] || h['x-real-ip'] || 'unknown';
}

function checkRateLimit_(ip) {
  const cache = CacheService.getScriptCache();
  const key = 'rl_' + ip;
  const cur = Number(cache.get(key) || '0') + 1;
  cache.put(key, String(cur), CONFIG.RATE_LIMIT_WINDOW_SEC);
  return cur <= CONFIG.RATE_LIMIT_PER_IP;
}

// ============================================================================
// Sheet I/O
// ============================================================================

function prepareRowData_(payload) {
  const ts = new Date().toISOString();
  const name = stripHtml_(payload.name.trim());
  const email = payload.email.toLowerCase().trim();
  const r = payload.results_json || {};
  const resultsStr = JSON.stringify(r);

  // normalize score/version for columns
  const testVersion = r.version || 'unknown';
  let testScore = '';
  if (typeof r.score === 'number') testScore = String(r.score);
  else if (typeof r.score === 'string') testScore = r.score;

  // columns: timestamp, name, email, results_json, test_score, test_version
  return [ts, name, email, resultsStr, testScore, testVersion];
}

function appendToSheet_(row) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(CONFIG.SHEET_NAME);
      const headers = ['timestamp','name','email','results_json','test_score','test_version'];
      sh.getRange(1,1,1,headers.length).setValues([headers]);
      sh.setFrozenRows(1);
    }
    sh.appendRow(row);
    return true;
  } catch (err) {
    logError_('Failed to append to sheet', err);
    return false;
  }
}

// ============================================================================
// Kit stub (disabled here)
// ============================================================================

function notifyKit_(_payload) {
  if (CONFIG.KIT_MODE === 'off') return;
  // Implement Kit v4 calls when you enable KIT_MODE='api'
}

// ============================================================================
// Utils
// ============================================================================

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function stripHtml_(s) {
  return String(s || '').replace(/<[^>]*>/g, '');
}

function logError_(message, error) {
  console.error(message, error);
  Logger.log(message + ': ' + (error ? error.toString() : 'unknown error'));
}

function createResponse_(obj, statusCode) {
  const out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  // Apps Script doesn't allow arbitrary headers here. Status code is set by HtmlService only,
  // but ContentService always returns 200. We include a status field in JSON for clients if needed.
  return out;
}

// ============================================================================
// Local test
// ============================================================================

function testSubmission() {
  const e = {
    postData: {
      type: 'application/json',
      contents: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        results_json: {
          version: "v1.0",
          score: 24,
          summary: { accuracy: 80, total_questions: 10 }
        }
      })
    },
    headers: { 'x-forwarded-for': '127.0.0.1' },
    parameter: {}
  };
  const res = doPost(e);
  Logger.log(res.getContent());
}
