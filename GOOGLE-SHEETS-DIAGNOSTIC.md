# Google Sheets Integration Diagnostic

## Current Status
The quiz app is attempting to send data to Google Sheets but data is not appearing in the spreadsheet.

## Issues Identified

### 1. ✅ FIXED: Missing Environment Variable
- **Problem**: `.env` was missing `VITE_GOOGLE_APPS_SCRIPT_URL`
- **Solution**: Added to `.env` file
- **Status**: FIXED

### 2. ✅ FIXED: Large Payload Size
- **Problem**: HTML report in payload was very large (could exceed 100KB limit)
- **Solution**: Removed `html_report` field from payload
- **Status**: FIXED

### 3. ✅ FIXED: No-CORS Mode Hiding Errors
- **Problem**: Using `mode: 'no-cors'` prevented seeing response/error details
- **Solution**: Removed `mode: 'no-cors'` and added comprehensive logging
- **Status**: FIXED

### 4. ⚠️ NEEDS VERIFICATION: Google Apps Script Deployment

The Google Apps Script must be deployed with these settings:
- **Execute as**: Me (your Google account)
- **Who has access**: Anyone

To verify/fix:
1. Open the script editor: https://script.google.com/
2. Find the project with the script
3. Click "Deploy" → "Manage deployments"
4. Verify or create a new deployment with:
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
5. Copy the new deployment URL if changed

### 5. ⚠️ NEEDS VERIFICATION: Spreadsheet Permissions

The spreadsheet at `1Dtp2HWlVhtPHxfH2aESoN2xT-gMo4jSrJzuvmpSUbDk` must be:
- Owned by or shared with the Google account that deployed the script
- The script must have permission to write to it

To verify:
1. Open spreadsheet: https://docs.google.com/spreadsheets/d/1Dtp2HWlVhtPHxfH2aESoN2xT-gMo4jSrJzuvmpSUbDk/edit
2. Check that a "Submissions" sheet exists or will be created automatically
3. Verify the Google account that deployed the Apps Script has Editor access

## Testing Steps

### Step 1: Test the Integration with Browser Console
1. Open your quiz app
2. Open browser DevTools (F12)
3. Go to Console tab
4. Complete a quiz
5. Look for logs starting with `[GoogleSheets]`:
   - `[GoogleSheets] Webhook URL:` - Should show the script URL
   - `[GoogleSheets] Sending data:` - Should show the payload
   - `[GoogleSheets] Payload size:` - Should be under 100KB
   - `[GoogleSheets] Response status:` - Should be 200
   - `[GoogleSheets] Success response:` - Should show `{ok: true, ...}`

### Step 2: Use Test Page
1. Open `test-google-sheets.html` in your browser
2. Click "Test Health Check" - Should return "OK"
3. Click "Test Minimal POST" - Should succeed and show response
4. Click "Test Full Quiz Data" - Should succeed
5. Click "Open Spreadsheet" - Verify data appears in "Submissions" sheet

### Step 3: Check Spreadsheet
1. Open: https://docs.google.com/spreadsheets/d/1Dtp2HWlVhtPHxfH2aESoN2xT-gMo4jSrJzuvmpSUbDk/edit
2. Look for "Submissions" sheet
3. Check for new rows with test data

## Expected Payload Structure

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "results_json": {
    "version": "v1.0",
    "score": "24/30",
    "summary": {
      "accuracy": 80,
      "mode": "practice",
      "total_questions": 30,
      "mastery_answers": 24,
      "proficient_answers": 4,
      "developing_answers": 2,
      "avg_time_ms": 15000,
      "duration_sec": 450,
      "domains": [...]
    },
    "detailed_history": [...]
  }
}
```

## Common Error Messages

### "Missing or invalid name"
- Check that `user.name` exists and is not empty
- Verify user is logged in (not guest mode)

### "Invalid email address"
- Check that `user.email` is a valid email format
- Verify user authentication state

### "Payload too large"
- Check `[GoogleSheets] Payload size` in console
- Should be under 100KB (100,000 bytes)

### "Rate limit exceeded"
- Script limits 10 requests per IP per 60 seconds
- Wait a minute and try again

### HTTP 403 or 401
- Google Apps Script deployment settings are incorrect
- Redeploy with "Anyone" access

### No response / Network error
- Check internet connection
- Verify script URL is correct
- Check browser console for CORS errors

## Next Steps

1. **Enable detailed logging**: The app now has comprehensive console logging
2. **Test with test page**: Use `test-google-sheets.html` to isolate issues
3. **Verify deployment**: Check Google Apps Script deployment settings
4. **Check spreadsheet**: Verify data is actually not appearing vs. appearing in wrong place
5. **Review logs**: Share console output if errors persist
