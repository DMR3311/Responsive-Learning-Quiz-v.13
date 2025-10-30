// ============================================================================
// SIMPLIFIED Google Apps Script for Quiz Results
// Deploy as Web App: Execute as "Me", Access "Anyone"
// ============================================================================

const SPREADSHEET_ID = '1Dtp2HWlVhtPHxfH2aESoN2xT-gMo4jSrJzuvmpSUbDk';
const SHEET_NAME = 'Submissions';

// Health check
function doGet() {
  return ContentService.createTextOutput('OK - Script is running').setMimeType(ContentService.MimeType.TEXT);
}

// Main handler
function doPost(e) {
  try {
    // Parse request
    if (!e || !e.postData) {
      return respond({ ok: false, error: 'No data received' });
    }

    const payload = JSON.parse(e.postData.contents || '{}');

    // Validate required fields
    if (!payload.name || typeof payload.name !== 'string') {
      return respond({ ok: false, error: 'Missing name' });
    }

    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return respond({ ok: false, error: 'Invalid email' });
    }

    if (!payload.results_json || typeof payload.results_json !== 'object') {
      return respond({ ok: false, error: 'Missing results_json' });
    }

    if (!payload.results_json.version) {
      return respond({ ok: false, error: 'Missing version in results_json' });
    }

    // Write to sheet
    const success = writeToSheet(payload);

    if (success) {
      return respond({ ok: true, message: 'Data saved successfully' });
    } else {
      return respond({ ok: false, error: 'Failed to write to sheet' });
    }

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return respond({ ok: false, error: 'Server error: ' + error.toString() });
  }
}

function writeToSheet(payload) {
  try {
    // Open spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = ['timestamp', 'name', 'email', 'results_json', 'test_score', 'test_version'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }

    // Prepare row data
    const timestamp = new Date().toISOString();
    const name = payload.name.trim();
    const email = payload.email.toLowerCase().trim();
    const resultsJson = JSON.stringify(payload.results_json);
    const testScore = payload.results_json.score || '';
    const testVersion = payload.results_json.version || '';

    // Append row
    sheet.appendRow([timestamp, name, email, resultsJson, testScore, testVersion]);

    Logger.log('Successfully wrote row for: ' + email);
    return true;

  } catch (error) {
    Logger.log('Error writing to sheet: ' + error.toString());
    return false;
  }
}

function respond(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// Test function - run this in the script editor to test
function testSubmission() {
  const testEvent = {
    postData: {
      contents: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        results_json: {
          version: "v1.0",
          score: "15/20",
          summary: { total_questions: 20, mastery_answers: 15 }
        }
      })
    }
  };

  const result = doPost(testEvent);
  Logger.log(result.getContent());
}
