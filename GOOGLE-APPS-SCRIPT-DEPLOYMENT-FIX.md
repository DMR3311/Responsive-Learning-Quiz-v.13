# Google Apps Script Deployment Fix

## Problem Identified

The Google Apps Script is returning an error:
```
ReferenceError: corsHeaders is not defined (line 216)
```

This indicates the deployed version of the script is **outdated or corrupt**. The current `GOOGLE-APPS-SCRIPT.gs` file is correct, but it needs to be redeployed.

## Solution: Redeploy the Script

### Step 1: Copy the Updated Script

The corrected script is in `GOOGLE-APPS-SCRIPT.gs` in this project. It now includes:
- The missing `logError_()` function
- All necessary functions for handling submissions
- Proper error handling

### Step 2: Access Google Apps Script Editor

1. Go to https://script.google.com/
2. Find your existing project (or create a new one if needed)
3. The script should be associated with your spreadsheet

**OR** open directly from spreadsheet:
1. Go to https://docs.google.com/spreadsheets/d/1Dtp2HWlVhtPHxfH2aESoN2xT-gMo4jSrJzuvmpSUbDk/edit
2. Click **Extensions** → **Apps Script**

### Step 3: Replace the Code

1. In the Apps Script editor, select all existing code (Ctrl+A or Cmd+A)
2. Delete it
3. Copy the entire contents of `GOOGLE-APPS-SCRIPT.gs` from this project
4. Paste it into the Apps Script editor
5. Click **Save** (or Ctrl+S)

### Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon next to "Select type" → Choose **Web app**
3. Configure:
   - **Description**: "Quiz Results Collector v2" (or any description)
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone**
4. Click **Deploy**
5. **IMPORTANT**: Copy the new **Web app URL** that appears

### Step 5: Update Environment Variable

If the URL changed, update your `.env` file:

```
VITE_GOOGLE_SHEETS_WEBHOOK_URL=<paste-new-url-here>
VITE_GOOGLE_APPS_SCRIPT_URL=<paste-new-url-here>
```

### Step 6: Test the Deployment

Test using curl:

```bash
curl -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","results_json":{"version":"v1.0","score":"10/20"}}'
```

Expected response:
```json
{"ok":true,"message":"Submission recorded successfully"}
```

### Step 7: Verify in Spreadsheet

1. Go to https://docs.google.com/spreadsheets/d/1Dtp2HWlVhtPHxfH2aESoN2xT-gMo4jSrJzuvmpSUbDk/edit
2. Look for a sheet called **"Submissions"**
3. You should see a new row with:
   - timestamp
   - name: "Test User"
   - email: "test@example.com"
   - results_json: (JSON object)
   - test_score: "10/20"
   - test_version: "v1.0"

## Troubleshooting

### "Authorization required"
- You need to authorize the script
- Click **Review Permissions** when prompted
- Sign in with your Google account
- Click **Advanced** → **Go to [project name] (unsafe)**
- Click **Allow**

### "Script function not found: doGet"
- The script wasn't saved properly
- Go back to Step 3 and ensure you saved the code

### "Exception: You do not have permission to call SpreadsheetApp.openById"
- The Google account deploying the script needs access to the spreadsheet
- Share the spreadsheet with your Google account as Editor

### Still not working?
1. Check the Execution log in Apps Script: **View** → **Executions**
2. Look for errors in recent runs
3. Use the test page `test-google-sheets.html` to see detailed error messages

## Current Script URL

The URL from your `.env` file:
```
https://script.google.com/macros/s/AKfycbwN3B4td-NV2PEC0bn_ARjXFOOWtOZAQ29OxHIgXkTzppAxMTNtFfe76uQV_z8UzaI/exec
```

After redeployment, this URL might change. Make sure to update both environment variables if it does.
