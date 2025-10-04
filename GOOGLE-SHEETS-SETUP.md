# Google Sheets Setup Guide

This guide will help you set up Google Forms to collect quiz results automatically into a Google Sheet.

## Step 1: Create a Google Form

1. Go to https://forms.google.com
2. Click the "+" button to create a new form
3. Name your form "Braintrain Quiz Results"

## Step 2: Add Form Fields

Add the following **Short answer** questions to your form:

1. **Timestamp** (Short answer)
2. **Username** (Short answer)
3. **Mode** (Short answer)
4. **Final Score** (Short answer)
5. **Total Questions** (Short answer)
6. **Optimal Answers** (Short answer)
7. **Avg Time Per Question** (Short answer)
8. **Domain Breakdown** (Paragraph)
9. **Detailed History** (Paragraph)

## Step 3: Get the Form Submission URL

1. Click the **Send** button (top right)
2. Click the **Link** tab (chain icon)
3. Click **Shorten URL** if desired
4. Copy the form URL (it will look like: `https://docs.google.com/forms/d/e/[FORM_ID]/viewform`)
5. Change `/viewform` to `/formResponse` at the end
   - Example: `https://docs.google.com/forms/d/e/1FAIpQLSe.../formResponse`

## Step 4: Get Field Entry IDs

1. Open your form
2. Click **Preview** (eye icon at top)
3. Right-click on the page and select **View Page Source** or **Inspect**
4. Search for `entry.` in the source code
5. Find the entry IDs for each field (they look like `entry.123456789`)

You'll need to map these in the code:
- `entry.timestamp` → Your timestamp field entry ID
- `entry.username` → Your username field entry ID
- `entry.mode` → Your mode field entry ID
- etc.

## Step 5: Update the Code

Open `src/utils/googleSheets.js` and update the entry IDs in the `formatQuizDataForSheets` function:

```javascript
return {
  'entry.XXXXXXXXX': timestamp,      // Replace XXXXXXXXX with your timestamp entry ID
  'entry.YYYYYYYYY': userName,       // Replace YYYYYYYYY with your username entry ID
  'entry.ZZZZZZZZZ': mode,          // Replace ZZZZZZZZZ with your mode entry ID
  // ... etc for all fields
};
```

## Step 6: Set the Environment Variable

Create a `.env` file in your project root (if it doesn't exist) and add:

```
VITE_GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse
```

Replace `YOUR_FORM_ID` with your actual form ID.

## Step 7: View Responses

1. Go back to your Google Form
2. Click the **Responses** tab
3. Click the Google Sheets icon to create a linked spreadsheet
4. All quiz submissions will automatically appear in this spreadsheet

## Testing

1. Deploy your app to Vercel
2. Complete a quiz
3. Check your Google Sheet for the new response

## Important Notes

- The form submission uses `mode: 'no-cors'`, so you won't see error messages if it fails
- Test with a simple form first to ensure the entry IDs are correct
- Make sure the form is set to accept responses (not closed)
- Responses appear immediately in the linked Google Sheet

## Alternative: Simple Version (No Entry IDs)

If you want a simpler setup without mapping entry IDs:

1. Create a Google Form with just one **Paragraph** field
2. Submit all quiz data as a JSON string to that single field
3. Parse the JSON in Google Sheets using Apps Script if needed

This is easier to set up but harder to analyze in the spreadsheet.
