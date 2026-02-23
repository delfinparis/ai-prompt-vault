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
    const subject = `${emailData.propertyAddress} - rewritten description`;

    const body = `Here's the rewritten listing description for ${emailData.propertyAddress}.

---

${emailData.description}

---

${emailData.characterCount} characters. Give it a once-over before posting to MLS since it's AI-generated.

- DJ`;

    MailApp.sendEmail({
      to: emailData.to,
      subject: subject,
      body: body,
      name: 'DJ from Listing Rewriter',
      replyTo: 'dj@kalerealty.com'
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
