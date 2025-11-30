# Quick Start Guide

## Step 1: Add Your API Keys

Edit the `.env.local` file and add your actual API keys:

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-proj-xxxxx  # Get from https://platform.openai.com/api-keys

# Google Sheets Webhook URL (from Apps Script deployment)
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Step 2: Restart the Dev Server

After adding your API keys:

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
npm run dev
```

## Step 3: Test the App

1. Open http://localhost:3000
2. Paste a Zillow listing URL
3. Enter your email address
4. Click "Generate My Listing Description"
5. Wait for the 7-stage pipeline to complete
6. Check your email in 5 minutes!

## Step 4: Deploy to Vercel

Add the same environment variables to Vercel:

1. Go to https://vercel.com/your-project/settings/environment-variables
2. Add:
   - `OPENAI_API_KEY` = [your OpenAI key]
   - `GOOGLE_SHEETS_WEBHOOK_URL` = [your Apps Script URL]
3. Redeploy

## Troubleshooting

- **"OpenAI API key not configured"** → Make sure you've added the key to `.env.local` and restarted the server
- **Email not received** → Check Google Apps Script execution logs
- **No data in Google Sheets** → Verify the SPREADSHEET_ID in Code.gs is correct

## Google Sheets

Your leads are being saved to:
https://docs.google.com/spreadsheets/d/1tfHZc10MQ8ltW4rlaaWhoPeJ6oe3ds_wjBaoK0Rh2QY/edit

## Need Help?

Check the detailed setup guide in `google-apps-script/SETUP.md`
