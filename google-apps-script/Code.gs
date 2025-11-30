// Google Apps Script for Listing Rewriter Lead Capture & Email
// Deploy this as a Web App and use the URL as GOOGLE_SHEETS_WEBHOOK_URL

// CONFIGURATION
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your Google Sheet ID
const SHEET_NAME = 'Leads';
const ADMIN_EMAIL = 'dj@kalerealty.com';

/**
 * Handle POST requests from the Next.js app
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    switch (data.action) {
      case 'saveLead':
        saveLead(data.data);
        break;
      case 'sendUserEmail':
        sendUserEmail(data.data);
        break;
      case 'notifyAdmin':
        notifyAdmin(data.data);
        break;
      default:
        return ContentService.createTextOutput(JSON.stringify({error: 'Unknown action'}));
    }

    return ContentService.createTextOutput(JSON.stringify({success: true}));
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}));
  }
}

/**
 * Save lead data to Google Sheets
 */
function saveLead(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Email', 'Zillow URL', 'Address', 'Price', 'Original Description', 'Rewritten Description']);
  }

  // Append the lead data
  sheet.appendRow([
    data.timestamp,
    data.email,
    data.zillowUrl,
    data.address,
    data.price,
    data.originalDescription,
    data.rewrittenDescription
  ]);
}

/**
 * Send the rewritten description to the user
 */
function sendUserEmail(data) {
  const subject = data.subject;
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
      color: white;
      padding: 30px;
      border-radius: 12px 12px 0 0;
      text-align: center;
    }
    .content {
      background: #f8fafc;
      padding: 30px;
      border-radius: 0 0 12px 12px;
    }
    .property-info {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #10b981;
    }
    .description {
      background: white;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #10b981;
      margin-bottom: 20px;
    }
    .stats {
      background: #e0f2fe;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .cta-button {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 28px;">✨ Your AI-Enhanced Listing Description</h1>
  </div>

  <div class="content">
    <div class="property-info">
      <h2 style="margin-top: 0; color: #0f172a;">Property Details</h2>
      <p><strong>Address:</strong> ${data.propertyAddress}</p>
      <p><strong>Price:</strong> ${data.propertyPrice}</p>
      <p><strong>Beds/Baths:</strong> ${data.propertyBeds} beds, ${data.propertyBaths} baths</p>
    </div>

    <div class="stats">
      <p style="margin: 0;"><strong>Character Count:</strong> ${data.characterCount} / 1000</p>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">Optimized for maximum impact</p>
    </div>

    <div class="description">
      <h3 style="margin-top: 0; color: #10b981;">Your New Listing Description</h3>
      <p style="line-height: 1.8; font-size: 15px;">${data.description}</p>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <strong style="color: #92400e;">⚡ Pro Tip:</strong>
      <p style="margin: 8px 0 0 0; color: #78350f;">
        This description was crafted by our 5-expert AI pipeline to create urgency and desire.
        Copy it directly to your listing to see faster showings and higher engagement!
      </p>
    </div>

    <div class="footer">
      <p>Need help with more listings? Visit our tool anytime!</p>
      <a href="https://ai-prompt-vault-two.vercel.app/" class="cta-button">Rewrite Another Listing</a>

      <p style="margin-top: 30px; font-size: 13px;">
        Questions? Reply to this email or contact us at<br/>
        <a href="mailto:${data.from}" style="color: #10b981;">${data.from}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  MailApp.sendEmail({
    to: data.to,
    subject: subject,
    htmlBody: htmlBody,
    replyTo: data.from,
    name: 'Kale Realty - AI Listing Tools'
  });
}

/**
 * Notify admin about new lead
 */
function notifyAdmin(data) {
  const subject = data.subject;
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .lead-info {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .info-row {
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">🎯 New Listing Rewriter Lead!</h1>
  </div>

  <div class="lead-info">
    <div class="info-row">
      <strong>Email:</strong> <a href="mailto:${data.userEmail}">${data.userEmail}</a>
    </div>
    <div class="info-row">
      <strong>Property:</strong> ${data.propertyAddress}
    </div>
    <div class="info-row">
      <strong>Price:</strong> ${data.propertyPrice}
    </div>
    <div class="info-row">
      <strong>Timestamp:</strong> ${data.timestamp}
    </div>
  </div>

  <p style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-top: 20px;">
    <strong>Action:</strong> The user has been sent their AI-enhanced listing description.
    Check the Google Sheet for full details and follow up if needed.
  </p>

  <p style="text-align: center; margin-top: 30px;">
    <a href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}"
       style="display: inline-block; background: #10b981; color: white; padding: 12px 30px;
              text-decoration: none; border-radius: 8px; font-weight: 600;">
      View Lead in Google Sheets
    </a>
  </p>
</body>
</html>
  `;

  MailApp.sendEmail({
    to: data.to,
    subject: subject,
    htmlBody: htmlBody,
    name: 'AI Listing Tool - Lead Notification'
  });
}
