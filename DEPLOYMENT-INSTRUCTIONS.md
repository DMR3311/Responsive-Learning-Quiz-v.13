# CRITICAL: Google Apps Script Deployment Instructions

## The Problem

Your current deployment is **corrupted or outdated**. It references code that doesn't exist (`corsHeaders`).

## The Solution

You need to **CREATE A COMPLETELY NEW DEPLOYMENT** from scratch.

---

## Step-by-Step Instructions

### 1. Open Google Apps Script

Go to your spreadsheet:
https://docs.google.com/spreadsheets/d/1Dtp2HWlVhtPHxfH2aESoN2xT-gMo4jSrJzuvmpSUbDk/edit

Then: **Extensions** → **Apps Script**

### 2. Delete ALL Old Code

- Select ALL the code in the editor (Ctrl+A / Cmd+A)
- Delete it completely
- The editor should be blank

### 3. Copy the New Simplified Script

Open the file **`GOOGLE-APPS-SCRIPT-SIMPLE.gs`** from this project and copy ALL of it.

Paste it into the blank Apps Script editor.

### 4. Save the Script

Click the **Save** icon (or Ctrl+S / Cmd+S)

Wait for "Saved" confirmation.

### 5. Test in the Editor (Optional but Recommended)

1. Select the function `testSubmission` from the dropdown
2. Click **Run**
3. Authorize the script if prompted (Review Permissions → Advanced → Allow)
4. Check the execution log (View → Logs) - should show "Successfully wrote row"
5. Check your spreadsheet - you should see a new "Submissions" sheet with test data

### 6. CREATE NEW DEPLOYMENT

**CRITICAL:** You must create a **NEW** deployment, not reuse the old one.

1. Click **Deploy** → **New deployment**
2. Click the **gear icon** ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in:
   - **Description**: "Quiz Results v3" (or any name)
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. **COPY THE NEW WEB APP URL** - it will look like:
   ```
   https://script.google.com/macros/s/XXXXXX.../exec
   ```

### 7. Update Your .env File

Replace BOTH URLs in `.env` with the NEW URL from step 6:

```
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_NEW_URL/exec
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_NEW_URL/exec
```

### 8. Test the New Deployment

Run this command (replace YOUR_NEW_URL):

```bash
curl -X GET "https://script.google.com/macros/s/YOUR_NEW_URL/exec"
```

Expected response: `OK - Script is running`

Then test POST:

```bash
curl -X POST "https://script.google.com/macros/s/YOUR_NEW_URL/exec" \
  -H "Content-Type: application/json" \
  -d '{"name":"Curl Test","email":"curl@test.com","results_json":{"version":"v1.0","score":"5/10"}}'
```

Expected response: `{"ok":true,"message":"Data saved successfully"}`

### 9. Verify in Spreadsheet

Check https://docs.google.com/spreadsheets/d/1Dtp2HWlVhtPHxfH2aESoN2xT-gMo4jSrJzuvmpSUbDk/edit

You should see:
- A sheet named "Submissions"
- Headers: timestamp, name, email, results_json, test_score, test_version
- Your test data rows

---

## Why This Approach?

1. **Simplified code** - removed all complex features that could cause errors
2. **Fresh deployment** - avoids any cached/corrupted old versions
3. **Easy to test** - includes test function you can run in the editor
4. **Clear logging** - errors show exactly what went wrong

## Common Issues

### "Script function not found"
- You didn't save the code after pasting
- Go back to step 4

### "Authorization required"
- Click "Review Permissions"
- Click "Advanced"
- Click "Go to [project name] (unsafe)"
- Click "Allow"

### Still getting old errors?
- You're using the OLD deployment URL
- Make sure you created a **NEW** deployment in step 6
- Update BOTH URLs in `.env` with the new one

### "You do not have permission to call SpreadsheetApp.openById"
- Your Google account doesn't have access to the spreadsheet
- Share the spreadsheet with yourself as Editor

---

## Need Help?

If you get any error message, share:
1. The exact error message
2. The response from the curl GET test (step 8)
3. The response from the curl POST test (step 8)
