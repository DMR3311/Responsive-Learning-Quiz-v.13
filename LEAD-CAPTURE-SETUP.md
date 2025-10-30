# Lead Capture & Google Sheets Integration Setup Guide

This guide provides step-by-step instructions to set up the lead capture system that sends quiz sign-in data and results to Google Sheets with Kit integration.

---

## Table of Contents

1. [Google Sheets Setup](#1-google-sheets-setup)
2. [Google Apps Script Deployment](#2-google-apps-script-deployment)
3. [Frontend Configuration](#3-frontend-configuration)
4. [Kit Integration Options](#4-kit-integration-options)
5. [Testing](#5-testing)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Google Sheets Setup

### Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Rename it to `Braintrain_Test_Results`

### Step 2: Create the Submissions Tab

1. Rename the default sheet to `Submissions`
2. Add the following headers in Row 1:
   - **A1**: `timestamp`
   - **B1**: `name`
   - **C1**: `email`
   - **D1**: `results_json`
   - **E1**: `test_score`
   - **F1**: `test_version`
   - **G1**: `source_url`
   - **H1**: `user_agent`

3. **Format the header row**:
   - Select Row 1
   - Make it bold
   - Add a background color (optional)

### Step 3: Get Your Spreadsheet ID

1. Look at the URL of your spreadsheet:
   ```
   https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
   ```
2. Copy the ID part (between `/d/` and `/edit`): `1a2b3c4d5e6f7g8h9i0j`
3. Save this ID - you'll need it in the next section

---

## 2. Google Apps Script Deployment

### Step 1: Open Apps Script Editor

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any default code in the editor

### Step 2: Paste the Code

1. Open the file `GOOGLE-APPS-SCRIPT.gs` from your project
2. Copy the entire contents
3. Paste it into the Apps Script editor

### Step 3: Configure Settings

Update the `CONFIG` object at the top of the script:

```javascript
const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',  // Paste your Spreadsheet ID here
  SHEET_NAME: 'Submissions',
  DEDUP_WINDOW_MIN: 5,

  // Kit settings - configure later
  KIT_MODE: 'off',  // Start with 'off', change to 'webhook' or 'api' after Kit setup
  KIT_API_BASE: 'https://api.convertkit.com/v3',
  KIT_API_KEY: 'YOUR_KIT_API_KEY_HERE',
  KIT_FORM_ID: 'YOUR_KIT_FORM_ID_HERE',
  KIT_TAGS: ['braintrain-quiz', 'lead-magnet'],
  KIT_WEBHOOK_URL: 'YOUR_KIT_WEBHOOK_URL_HERE',

  // Security settings
  MAX_PAYLOAD_SIZE: 100 * 1024,
  RATE_LIMIT_PER_IP: 10,
  RATE_LIMIT_WINDOW_SEC: 60
};
```

### Step 4: Deploy as Web App

1. Click the **Deploy** button (top right) → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: `Braintrain Quiz Lead Capture v1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone`
5. Click **Deploy**
6. Review permissions:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Your Project Name] (unsafe)**
   - Click **Allow**
7. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```
8. Save this URL - you'll need it for frontend configuration

---

## 3. Frontend Configuration

### Step 1: Update Environment Variables

1. Open the `.env` file in your project root
2. Update the Google Apps Script URL:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbz.../exec
   ```

### Step 2: Rebuild the Application

```bash
npm run build
```

### Step 3: Deploy Your Site

Deploy to your hosting platform (Netlify, Vercel, GitHub Pages, etc.)

---

## 4. Kit Integration Options

You have two options for integrating with Kit (ConvertKit):

### Option A: Zapier/Make (No-Code Solution)

#### Using Zapier:

1. **Create a Zap**:
   - Trigger: **Google Sheets** → **New Spreadsheet Row**
   - Select your `Braintrain_Test_Results` spreadsheet
   - Select the `Submissions` worksheet

2. **Add Action**:
   - App: **Kit (ConvertKit)**
   - Action: **Add Subscriber to Form** or **Add Subscriber to Tag**

3. **Map Fields**:
   - Email: `email` (Column C)
   - First Name: `name` (Column B)
   - Custom Fields:
     - `quiz_score`: `test_score` (Column E)
     - `quiz_version`: `test_version` (Column F)

4. **Add Tags** (optional):
   - Create a formatter step to add dynamic tags:
     - `test:{{test_version}}`
     - `score:{{score_bucket}}` (use code to bucket scores: excellent/good/average/needs-improvement)
     - `source:{{source_host}}`

5. **Test and Activate**

#### Using Make (Integromat):

1. Create a new Scenario
2. Add **Google Sheets** → **Watch Rows** module
3. Add **Kit** → **Create/Update Subscriber** module
4. Map fields similar to Zapier
5. Activate scenario

### Option B: Direct API Integration

To use the direct Kit API integration:

#### Step 1: Get Kit API Credentials

1. Log into your [Kit account](https://app.convertkit.com)
2. Go to **Settings** → **Advanced** → **API & Webhooks**
3. Copy your **API Secret** (not API Key)
4. Get your **Form ID**:
   - Go to **Forms**
   - Click on the form you want to use
   - The ID is in the URL: `https://app.convertkit.com/forms/designers/123456/edit`

#### Step 2: Update Apps Script Configuration

1. Open your Apps Script editor
2. Update the CONFIG object:

```javascript
const CONFIG = {
  // ... other settings ...

  KIT_MODE: 'api',  // Change from 'off' to 'api'
  KIT_API_KEY: 'your_actual_api_secret_here',
  KIT_FORM_ID: '123456',
  KIT_TAGS: ['braintrain-quiz', 'lead-magnet'],

  // ... other settings ...
};
```

3. **Save** the script
4. **Deploy** → **Manage deployments** → **Edit** → **Version**: New version → **Deploy**

#### Step 3: Configure Custom Fields in Kit (Optional)

1. In Kit, go to **Settings** → **Custom Fields**
2. Create the following fields:
   - `quiz_score` (Number)
   - `quiz_version` (Text)
   - `quiz_results` (Text)

### Option C: Webhook Integration

If you prefer webhooks:

#### Step 1: Set up Kit Automation

1. In Kit, create a new **Automation**
2. Set the trigger to **Webhook**
3. Copy the webhook URL

#### Step 2: Update Apps Script

```javascript
const CONFIG = {
  // ... other settings ...

  KIT_MODE: 'webhook',
  KIT_WEBHOOK_URL: 'https://your-kit-webhook-url-here',

  // ... other settings ...
};
```

3. Save and redeploy the script

---

## 5. Testing

### Test 1: Manual Test with curl

Use this command to test your Google Apps Script endpoint:

```bash
curl -X POST \
  'YOUR_WEB_APP_URL' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "results_json": {
      "version": "v1.0",
      "score": 85,
      "domains": [
        {"id": "logic", "pct": 90},
        {"id": "creativity", "pct": 80}
      ],
      "raw": [1, 0, 1, 1, 0, 1],
      "duration_sec": 300
    },
    "source_url": "https://braintrain.org/quiz",
    "user_agent": "Mozilla/5.0"
  }'
```

**Expected Response**:
```json
{
  "ok": true,
  "message": "Submission recorded successfully"
}
```

### Test 2: Check Google Sheet

1. Open your `Braintrain_Test_Results` spreadsheet
2. Look at the `Submissions` tab
3. You should see a new row with the test data

### Test 3: End-to-End Test

1. Go to your deployed quiz application
2. Enter a name and email (use a test email you control)
3. Click "Start the Quiz"
4. Complete the quiz
5. Check your Google Sheet for two entries:
   - One with `status: "started"`
   - One with `status: "completed"` and full results

### Test 4: Kit Integration Test

1. Check your Kit dashboard for the new subscriber
2. Verify tags were applied correctly
3. Check if any automation was triggered

### Test Cases to Verify

- ✅ Valid submission creates a new row
- ✅ Invalid email is rejected
- ✅ Missing required fields are rejected
- ✅ Duplicate submissions within 5 minutes are ignored
- ✅ Large payloads (>100KB) are rejected
- ✅ Rate limiting works (try 11 requests in quick succession)
- ✅ Kit receives subscriber data with correct tags

---

## 6. Troubleshooting

### Issue: "No data received" error

**Solution**: Make sure you're sending a POST request with JSON content-type header.

### Issue: "Invalid JSON" error

**Solution**: Verify your payload is valid JSON. Use a JSON validator.

### Issue: "Missing or invalid name/email/results_json" error

**Solution**: Check that all required fields are present and correctly formatted.

### Issue: No data appearing in Google Sheet

**Possible Causes**:
1. Wrong `SPREADSHEET_ID` in CONFIG
2. Sheet name doesn't match (must be exactly "Submissions")
3. Script not deployed or deployed incorrectly

**Solution**:
1. Verify your Spreadsheet ID
2. Check sheet name (case-sensitive)
3. Redeploy: **Deploy** → **Manage deployments** → **Edit** → **New version** → **Deploy**

### Issue: Kit integration not working

**For API Mode**:
- Verify your API Secret is correct (not API Key)
- Check Form ID is correct
- Make sure KIT_MODE is set to 'api'

**For Webhook Mode**:
- Verify webhook URL is correct and active
- Check Kit automation is enabled
- Look at Kit webhook logs for errors

**For Zapier/Make**:
- Check if Zap/Scenario is enabled
- Look at task history for errors
- Verify field mappings

### Issue: CORS errors in browser console

**Solution**: This is normal during development. The Apps Script handles CORS correctly when deployed as a Web App with "Anyone" access.

### Issue: Rate limit exceeded

**Solution**: You're sending too many requests. Wait 60 seconds and try again. Adjust `RATE_LIMIT_PER_IP` in CONFIG if needed.

### Issue: Leaked Web App URL

**Solution**: Create a new deployment:
1. **Deploy** → **Manage deployments**
2. **Archive** the old deployment
3. Create a **New deployment**
4. Update your `.env` file with the new URL
5. Redeploy your frontend

### Check Apps Script Logs

1. In Apps Script editor, click **Executions** (left sidebar)
2. Click on any failed execution to see error details
3. Use `console.log()` in the script for debugging

### Test Function in Apps Script

Run the built-in test function:

1. In Apps Script editor, select `testSubmission` from the function dropdown
2. Click **Run**
3. Check the **Execution log** for results

---

## Sample Payload

Here's a complete example of what the application sends:

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "results_json": {
    "version": "v1.0",
    "score": 87,
    "percentage": 87,
    "domains": [
      {
        "domain": "logic",
        "mastery": 5,
        "proficient": 2,
        "developing": 1,
        "total": 8,
        "scoreDelta": 15,
        "accuracy": 63
      },
      {
        "domain": "memory",
        "mastery": 4,
        "proficient": 1,
        "developing": 0,
        "total": 5,
        "scoreDelta": 12,
        "accuracy": 80
      }
    ],
    "difficulty": "mixed",
    "mode": "practice",
    "total_questions": 13,
    "correct_answers": 9,
    "duration_sec": 312,
    "completed_at": "2025-10-30T14:23:45.123Z",
    "status": "completed",
    "streak": 3
  },
  "source_url": "https://your-site.com/quiz",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
```

---

## Data Flow Diagram

```
Quiz Sign-In
     ↓
[User enters name & email]
     ↓
captureInitialLead()
     ↓
POST to Google Apps Script
     ↓
Google Sheet Row Created (status: "started")
     ↓
[User completes quiz]
     ↓
captureQuizResults()
     ↓
POST to Google Apps Script
     ↓
Google Sheet Row Created (status: "completed")
     ↓
Kit Integration Triggered
     ↓
- Subscriber added/updated
- Tags applied
- Automation started (if configured)
```

---

## Security Notes

1. **API Keys**: Never commit API keys to version control. Use environment variables.

2. **Web App URL**: The Google Apps Script Web App URL is public, but:
   - Has built-in rate limiting
   - Validates all inputs
   - Strips HTML from inputs
   - Limits payload size to 100KB
   - Uses deduplication to prevent spam

3. **HTTPS**: All communication uses HTTPS encryption

4. **Rotation**: If your Web App URL is compromised, archive the deployment and create a new one

---

## Additional Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Kit API Documentation](https://developers.convertkit.com/)
- [Zapier Google Sheets Integration](https://zapier.com/apps/google-sheets/integrations)
- [Make (Integromat) Documentation](https://www.make.com/en/help)

---

## Support

If you encounter issues not covered in this guide:

1. Check the **Troubleshooting** section above
2. Review Google Apps Script **Execution logs**
3. Test with the provided curl command
4. Verify all configuration values are correct

---

**Setup Complete!** 🎉

Your lead capture system is now ready to collect quiz sign-ins and results, store them in Google Sheets, and trigger follow-ups via Kit.
