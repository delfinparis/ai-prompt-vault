/**
 * Google Apps Script for Listing Rewriter
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com and create a new project
 * 2. Copy this entire script into the Code.gs file
 * 3. Click "Deploy" > "New deployment"
 * 4. Select "Web app" as the type
 * 5. Set "Execute as" to "Me"
 * 6. Set "Who has access" to "Anyone"
 * 7. Click "Deploy" and copy the Web app URL
 * 8. Add the URL to Vercel as GOOGLE_SHEETS_WEBHOOK_URL
 *
 * SPREADSHEET SETUP:
 * Create a Google Sheet with these tabs:
 * 1. "Leads" - columns: timestamp, email, address, price, originalDescription, rewrittenDescription
 * 2. "EmailLog" - columns: timestamp, to, subject, status
 */

// Your Google Sheet ID (from the URL: docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit)
const SPREADSHEET_ID = '1tfHZc10MQ8ltW4rlaaWhoPeJ6oe3ds_wjBaoK0Rh2QY';

// Admin email for notifications
const ADMIN_EMAIL = 'dj@kalerealty.com';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.data;

    let result;

    switch (action) {
      case 'saveLead':
        result = saveLead(payload);
        break;
      case 'sendUserEmail':
        result = sendUserEmail(payload);
        break;
      case 'notifyAdmin':
        result = notifyAdmin(payload);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// For testing via GET request
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Listing Rewriter webhook is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============ LEAD MANAGEMENT ============

function saveLead(leadData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Leads');

  // Create Leads sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Leads');
    sheet.appendRow(['timestamp', 'email', 'address', 'price', 'originalDescription', 'rewrittenDescription', 'optInTips']);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    leadData.timestamp || new Date().toISOString(),
    leadData.email,
    leadData.address,
    leadData.price || 'N/A',
    leadData.originalDescription,
    leadData.rewrittenDescription,
    leadData.optInTips || 'No'
  ]);

  return { success: true };
}

// ============ EMAIL FUNCTIONS ============

function sendUserEmail(emailData) {
  try {
    const subject = emailData.subject || `Your AI-Enhanced Listing Description for ${emailData.propertyAddress}`;

    const htmlBody = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #012f66 0%, #023d85 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Your AI-Enhanced Description is Ready!</h1>
          <p style="color: #94a3b8; margin-top: 10px; font-size: 14px;">Copy it directly into your MLS</p>
        </div>

        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Property Details</h2>
          <p style="color: #64748b;">
            <strong>Address:</strong> ${emailData.propertyAddress}<br>
            <strong>Price:</strong> ${emailData.propertyPrice}<br>
            <strong>Beds:</strong> ${emailData.propertyBeds} | <strong>Baths:</strong> ${emailData.propertyBaths}
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">

          <h3 style="color: #1e293b; margin-bottom: 10px;">Your New Listing Description</h3>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #10b981;">
            <p style="color: #334155; line-height: 1.7; margin: 0;">${emailData.description}</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">${emailData.characterCount} characters</p>
          <p style="color: #94a3b8; font-size: 11px; font-style: italic; margin-top: 4px;">AI-generated &mdash; review for accuracy before posting to MLS</p>
        </div>

        <div style="background: #012f66; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
          <a href="https://listing.joinkale.com" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Rewrite Another Listing</a>
          <p style="color: #94a3b8; margin: 20px 0 10px 0; font-size: 14px;">
            Subscribe to <a href="https://www.youtube.com/@KeepingitRealPodcast" style="color: #38bdf8; text-decoration: none; font-weight: 600;">KeepingItRealPodcast</a> and learn the secrets of the top agents in the industry!
          </p>
          <p style="color: #94a3b8; margin: 8px 0 10px 0; font-size: 13px;">
            <a href="https://open.spotify.com/show/6lDHbQ8nfuV87QyqiELilc" style="color: #1DB954; text-decoration: none; font-weight: 600;">Spotify</a> &nbsp;&middot;&nbsp; <a href="https://podcasts.apple.com/us/podcast/keeping-it-real-podcast-secrets-of-top-1-realtors/id1237389947" style="color: #AF52DE; text-decoration: none; font-weight: 600;">Apple Podcasts</a>
          </p>
          <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 13px;">
            &copy; 2026 DJP3 Consulting Inc. Powered by AI.
          </p>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: emailData.to,
      subject: subject,
      htmlBody: htmlBody,
      name: 'Listing Rewriter'
    });

    // Log the email
    logEmail(emailData.to, subject, 'sent');

    return { success: true };
  } catch (error) {
    logEmail(emailData.to, emailData.subject, 'failed: ' + error.toString());
    return { error: error.toString() };
  }
}

function notifyAdmin(notifyData) {
  try {
    const subject = notifyData.subject || 'New Listing Rewriter Lead!';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #10b981;">New Lead Alert!</h2>
        <p><strong>User Email:</strong> ${notifyData.userEmail}</p>
        <p><strong>Property:</strong> ${notifyData.propertyAddress}</p>
        <p><strong>Time:</strong> ${notifyData.timestamp}</p>
        <hr>
        <p style="color: #64748b; font-size: 12px;">
          View all leads in your <a href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}">Google Sheet</a>
        </p>
      </div>
    `;

    MailApp.sendEmail({
      to: notifyData.to || ADMIN_EMAIL,
      subject: subject,
      htmlBody: htmlBody,
      name: 'Listing Rewriter'
    });

    return { success: true };
  } catch (error) {
    return { error: error.toString() };
  }
}

function logEmail(to, subject, status) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('EmailLog');

    if (!sheet) {
      sheet = ss.insertSheet('EmailLog');
      sheet.appendRow(['timestamp', 'to', 'subject', 'status']);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([new Date().toISOString(), to, subject, status]);
  } catch (e) {
    // Silent fail for logging
  }
}

// ============ SETUP ============

// Run this once manually to create the spreadsheet structure
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  let leadsSheet = ss.getSheetByName('Leads');
  if (!leadsSheet) {
    leadsSheet = ss.insertSheet('Leads');
    leadsSheet.appendRow(['timestamp', 'email', 'address', 'price', 'originalDescription', 'rewrittenDescription']);
    leadsSheet.setFrozenRows(1);
  }

  let emailLogSheet = ss.getSheetByName('EmailLog');
  if (!emailLogSheet) {
    emailLogSheet = ss.insertSheet('EmailLog');
    emailLogSheet.appendRow(['timestamp', 'to', 'subject', 'status']);
    emailLogSheet.setFrozenRows(1);
  }

  Logger.log('Spreadsheet setup complete!');
}
