# Google Apps Script Setup Guide

This guide will help you set up the Google Apps Script for lead capture and email delivery.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Listing Rewriter Leads" (or whatever you prefer)
4. Copy the **Spreadsheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - Example: If URL is `https://docs.google.com/spreadsheets/d/1abc123XYZ/edit`
   - Then SPREADSHEET_ID is `1abc123XYZ`

## Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any default code in the editor
3. Copy the entire contents of `Code.gs` from this folder
4. Paste it into the Apps Script editor
5. **IMPORTANT:** Update line 6 with your Spreadsheet ID:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with actual ID
   ```

## Step 3: Deploy as Web App

1. Click the **Deploy** button (top right)
2. Select **New deployment**
3. Click the gear icon ⚙️ next to "Select type"
4. Choose **Web app**
5. Configure settings:
   - **Description:** "Listing Rewriter Lead Capture"
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Click **Deploy**
7. **Copy the Web App URL** - you'll need this!
   - Format: `https://script.google.com/macros/s/[LONG_ID]/exec`

## Step 4: Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add a new variable:
   - **Key:** `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value:** [Paste the Web App URL from Step 3]
   - **Scope:** Production, Preview, Development (check all)
4. Save and redeploy your app

## Step 5: Set Up Email Sending from dj@kalerealty.com (Optional)

By default, emails will be sent from your Google account. To send from `dj@kalerealty.com`:

### Option A: Gmail Alias (Easiest)
1. Go to Gmail Settings → Accounts and Import
2. Add `dj@kalerealty.com` as a "Send mail as" address
3. Verify the address
4. Emails will show as from dj@kalerealty.com

### Option B: Professional Email Setup
1. Use Google Workspace with your domain
2. Set up dj@kalerealty.com as a Google Workspace account
3. Deploy the Apps Script from that account

## Step 6: Test the Integration

1. Go to your deployed app
2. Enter a test Zillow URL and your email
3. Click "Generate My Listing Description"
4. Check:
   - ✅ New row appears in Google Sheet
   - ✅ Email arrives at your inbox within 5 minutes
   - ✅ Admin notification arrives at dj@kalerealty.com

## Troubleshooting

### Emails not sending?
1. Check Apps Script execution logs: **Executions** tab in Apps Script editor
2. Verify the Web App URL is correct in Vercel
3. Make sure you deployed the latest version
4. Check Gmail's Sent folder

### Sheet not updating?
1. Verify SPREADSHEET_ID is correct
2. Check Apps Script has permission to access the sheet
3. Look at execution logs for errors

### "Permission denied" errors?
1. Re-deploy the Web App
2. Make sure "Execute as: Me" is selected
3. Grant necessary permissions when prompted

## Sheet Columns

The script creates these columns automatically:
- **Timestamp:** When the lead was captured
- **Email:** User's email address
- **Zillow URL:** Link to the original listing
- **Address:** Property address
- **Price:** Listing price
- **Original Description:** Zillow's description
- **Rewritten Description:** AI-enhanced version (max 1000 chars)

## Email Templates

The script sends two types of emails:

1. **User Email:** Beautifully formatted email with:
   - Property details
   - Character count
   - AI-enhanced description
   - Pro tip for using it
   - CTA to rewrite another listing

2. **Admin Notification:** Quick summary to dj@kalerealty.com with:
   - Lead email and contact info
   - Property details
   - Link to view full data in Google Sheets

## Security Notes

- The Web App URL is public but doesn't expose sensitive data
- Only the specified actions (saveLead, sendUserEmail, notifyAdmin) work
- Emails are sent via Google's MailApp (secure and reliable)
- Sheet access is controlled by your Google permissions
