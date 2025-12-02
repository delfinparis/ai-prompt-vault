/**
 * Google Apps Script for Kale AI Listing Rewriter
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
 * Create a Google Sheet with these tabs (sheets):
 * 1. "Users" - columns: id, email, passwordHash, credits, createdAt, lastLogin
 * 2. "Leads" - columns: timestamp, email, address, price, originalDescription, rewrittenDescription
 * 3. "EmailLog" - columns: timestamp, to, subject, status
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
      case 'createUser':
        result = createUser(payload);
        break;
      case 'getUser':
        result = getUser(payload.email);
        break;
      case 'getUserById':
        result = getUserById(payload.id);
        break;
      case 'updateUserCredits':
        result = updateUserCredits(payload.id, payload.email, payload.credits);
        break;
      case 'updateLastLogin':
        result = updateLastLogin(payload.id, payload.lastLogin);
        break;
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
    message: 'Kale AI Webhook is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============ USER MANAGEMENT ============

function createUser(userData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Users');

  // Create Users sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Users');
    sheet.appendRow(['id', 'email', 'passwordHash', 'credits', 'createdAt', 'lastLogin']);
  }

  // Check if user already exists
  const existingUser = findUserByEmail(userData.email);
  if (existingUser) {
    return { error: 'User already exists', user: existingUser };
  }

  // Add new user
  sheet.appendRow([
    userData.id,
    userData.email.toLowerCase(),
    userData.passwordHash,
    userData.credits || 1,
    userData.createdAt || new Date().toISOString(),
    ''
  ]);

  return {
    success: true,
    user: {
      id: userData.id,
      email: userData.email.toLowerCase(),
      credits: userData.credits || 1,
      createdAt: userData.createdAt
    }
  };
}

function getUser(email) {
  const user = findUserByEmail(email);
  if (user) {
    return { user };
  }
  return { user: null };
}

function getUserById(id) {
  const user = findUserById(id);
  if (user) {
    return { user };
  }
  return { user: null };
}

function findUserByEmail(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');

  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const normalizedEmail = email.toLowerCase();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().toLowerCase() === normalizedEmail) {
      return {
        id: data[i][0],
        email: data[i][1],
        passwordHash: data[i][2],
        credits: parseInt(data[i][3]) || 0,
        createdAt: data[i][4],
        lastLogin: data[i][5]
      };
    }
  }
  return null;
}

function findUserById(id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');

  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return {
        id: data[i][0],
        email: data[i][1],
        passwordHash: data[i][2],
        credits: parseInt(data[i][3]) || 0,
        createdAt: data[i][4],
        lastLogin: data[i][5]
      };
    }
  }
  return null;
}

function updateUserCredits(id, email, credits) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');

  if (!sheet) return { error: 'Users sheet not found' };

  const data = sheet.getDataRange().getValues();

  // Try to find by ID first, then by email
  for (let i = 1; i < data.length; i++) {
    const matchById = data[i][0] === id;
    const matchByEmail = email && data[i][1] && data[i][1].toString().toLowerCase() === email.toLowerCase();

    if (matchById || matchByEmail) {
      sheet.getRange(i + 1, 4).setValue(credits); // Column D = credits
      return { success: true, credits };
    }
  }

  return { error: 'User not found' };
}

function updateLastLogin(id, lastLogin) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');

  if (!sheet) return { error: 'Users sheet not found' };

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 6).setValue(lastLogin); // Column F = lastLogin
      return { success: true };
    }
  }

  return { error: 'User not found' };
}

// ============ LEAD MANAGEMENT ============

function saveLead(leadData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Leads');

  // Create Leads sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Leads');
    sheet.appendRow(['timestamp', 'email', 'address', 'price', 'originalDescription', 'rewrittenDescription']);
  }

  sheet.appendRow([
    leadData.timestamp || new Date().toISOString(),
    leadData.email,
    leadData.address,
    leadData.price || 'N/A',
    leadData.originalDescription,
    leadData.rewrittenDescription
  ]);

  return { success: true };
}

// ============ EMAIL FUNCTIONS ============

function sendUserEmail(emailData) {
  try {
    const subject = emailData.subject || `Your AI-Enhanced Listing Description for ${emailData.propertyAddress}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Your AI-Enhanced Listing</h1>
        </div>

        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Property Details</h2>
          <p style="color: #64748b;">
            <strong>Address:</strong> ${emailData.propertyAddress}<br>
            <strong>Price:</strong> ${emailData.propertyPrice}<br>
            <strong>Beds:</strong> ${emailData.propertyBeds} | <strong>Baths:</strong> ${emailData.propertyBaths}
          </p>

          <h2 style="color: #1e293b;">Your New Description</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="color: #334155; line-height: 1.6; margin: 0;">${emailData.description}</p>
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 10px;">
            Character count: ${emailData.characterCount || emailData.description.length}
          </p>
        </div>

        <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="color: #94a3b8; margin: 0; font-size: 14px;">
            Powered by Kale Realty AI Listing Rewriter
          </p>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: emailData.to,
      subject: subject,
      htmlBody: htmlBody,
      name: 'Kale Realty AI'
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
      name: 'Kale AI System'
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
    }

    sheet.appendRow([new Date().toISOString(), to, subject, status]);
  } catch (e) {
    // Silent fail for logging
  }
}

// ============ UTILITY FUNCTIONS ============

// Function to set up the spreadsheet structure (run once manually)
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Create Users sheet
  let usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
    usersSheet.appendRow(['id', 'email', 'passwordHash', 'credits', 'createdAt', 'lastLogin']);
    usersSheet.setFrozenRows(1);
  }

  // Create Leads sheet
  let leadsSheet = ss.getSheetByName('Leads');
  if (!leadsSheet) {
    leadsSheet = ss.insertSheet('Leads');
    leadsSheet.appendRow(['timestamp', 'email', 'address', 'price', 'originalDescription', 'rewrittenDescription']);
    leadsSheet.setFrozenRows(1);
  }

  // Create EmailLog sheet
  let emailLogSheet = ss.getSheetByName('EmailLog');
  if (!emailLogSheet) {
    emailLogSheet = ss.insertSheet('EmailLog');
    emailLogSheet.appendRow(['timestamp', 'to', 'subject', 'status']);
    emailLogSheet.setFrozenRows(1);
  }

  Logger.log('Spreadsheet setup complete!');
}

// Function to add credits to a user (for admin use)
function addCreditsToUser(email, creditsToAdd) {
  const user = findUserByEmail(email);
  if (!user) {
    Logger.log('User not found: ' + email);
    return;
  }

  const newCredits = (user.credits || 0) + creditsToAdd;
  updateUserCredits(user.id, email, newCredits);
  Logger.log('Updated ' + email + ' credits to: ' + newCredits);
}

// Example: Give delfinparis@gmail.com unlimited credits
function giveUnlimitedCredits() {
  addCreditsToUser('delfinparis@gmail.com', 9999);
}
