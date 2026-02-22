import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, unit, price, beds, baths, sqft, description, email, optInTips } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Please provide an email address' },
        { status: 400 }
      );
    }

    if (!address || !description) {
      return NextResponse.json(
        { error: 'Address and description are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const fullAddress = unit ? `${address}, Unit ${unit}` : address;

    // Generate single polished description
    console.log('Generating rewritten description...');
    const rewrittenDescription = await generateDescription({
      address: fullAddress,
      price,
      beds,
      baths,
      sqft,
      description,
    }, apiKey);
    console.log('Description generated.');

    console.log('Saving to Google Sheets...');
    await saveToGoogleSheets({
      email,
      address: fullAddress,
      price: price || 'N/A',
      originalDescription: description,
      rewrittenDescription,
      timestamp: new Date().toISOString(),
      optInTips: optInTips ? 'Yes' : 'No',
    });

    console.log('Sending email to user:', email);
    await sendEmailToUser(email, {
      address: fullAddress,
      price: price || 'N/A',
      beds: beds || 'N/A',
      baths: baths || 'N/A',
    }, rewrittenDescription);

    console.log('Notifying admin...');
    await notifyAdmin(email, fullAddress);

    return NextResponse.json({
      success: true,
      message: 'Processing complete! Check your email in the next 5 minutes.',
      description: rewrittenDescription,
      characterCount: rewrittenDescription.length,
      address: fullAddress,
    });

  } catch (error) {
    console.error('Error in listing-rewrite API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Before/after example showing the transformation we want
const BEFORE_AFTER_EXAMPLE = `
BEFORE (typical MLS input):
"Solid brick 2-flat in Uptown. First floor unit has 3 beds 1 bath. Second floor is 2 beds 1 bath. Full basement. 2 car garage. Separate utilities. Good rental history. Near CTA Red Line. Needs some updating but great bones. Sold as-is."

AFTER (what you should produce):
"Solid brick 2-flat near the CTA Red Line in Uptown with separate utilities and a two-car garage. The first-floor unit offers three bedrooms and one bath, while the second floor holds a two-bedroom, one-bath layout above. A full basement sits below grade for additional flexibility. Rental history has been consistent, and the separate utility arrangement keeps operating costs straightforward for each unit. The building needs updating, but the brick construction and underlying structure remain sound. Sold as-is and priced to reflect the opportunity."

WHY THE AFTER IS BETTER:
- Choppy fragments ("Full basement. 2 car garage.") become flowing sentences that connect related ideas
- Abbreviations ("3 beds 1 bath") become polished text ("three bedrooms and one bath")
- Features are grouped logically (units described together, then building features, then condition)
- Reader is walked through the property top to bottom instead of random bullet-style facts
- Every single fact in the AFTER appears in the BEFORE — nothing was invented
`;

// Shared writing rules
const WRITING_RULES = `RULES — follow these exactly:

TRANSFORM THE WRITING — this is what makes the rewrite worth reading:
- Convert choppy fragments and bullet-style sentences into flowing, connected prose
- Spell out abbreviations: "3 beds 1 bath" becomes "three bedrooms and one bath," "2 car" becomes "two-car"
- Group related features together instead of listing them randomly
- Walk the reader through the property spatially: exterior/location, then main living areas, then bedrooms, then additional features
- Vary sentence length: mix shorter punchy sentences with longer ones that connect ideas
- Replace generic MLS shorthand with specific, human language (but only using facts from the source)
- Turn plain specs into context: "2 car garage" can become "a two-car garage off the alley" IF the alley is mentioned in the source
- Make the opening line specific and compelling — not a generic "Beautiful home in..." opener
- Close with the strongest remaining selling point or a forward-looking statement

STRICT FACTUAL ACCURACY — never violate these:
- ONLY state facts explicitly present in the PROPERTY DATA or ORIGINAL DESCRIPTION
- Do NOT invent distances, neighborhood details, sensory details, or features not in the source
- Do NOT add "original," "spacious," "updated," or other adjectives not supported by the source
- Do NOT speculate about investment returns, appreciation, or property value
- Do NOT change the property type or unit count
- If the source says "near" a landmark, say "near" — do not quantify the distance
- When in doubt, leave it out

BANNED PHRASES AND PATTERNS:
- "Welcome to" or "Step into" openings
- "boasts," "features," or "offers" as main verbs
- "Whether you're..." constructions
- "Don't miss" or "Act now"
- em dashes, exclamation points, colon lists, bold markers, bullet points
- "stunning," "amazing," "charming," "cozy," "unique," "motivated seller"

OUTPUT: exactly 800-1000 characters, one paragraph, no line breaks`;

// Types
interface PropertyData {
  address: string;
  price?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  description: string;
}

// Generate a single polished listing description
async function generateDescription(data: PropertyData, apiKey: string): Promise<string> {
  const userMessage = `PROPERTY DATA:
Address: ${data.address}
Price: ${data.price || 'Contact for price'} | Beds: ${data.beds || 'N/A'} | Baths: ${data.baths || 'N/A'} | Sq Ft: ${data.sqft || 'N/A'}

ORIGINAL DESCRIPTION:
${data.description}

Rewrite this listing description following the rules in your instructions. Before finalizing, verify every fact in your output appears in the PROPERTY DATA or ORIGINAL DESCRIPTION above. If you cannot verify a detail, remove it. Output only the description text, nothing else.`;

  return generateVariation({
    systemPrompt: `You are a listing description editor who transforms choppy, abbreviation-heavy MLS drafts into polished, flowing prose. Your job is to make the description read dramatically better while using ONLY the facts provided. You never add information — you restructure, connect, and elevate what's already there.

${WRITING_RULES}

TONE: Confident and approachable. Professional enough for MLS, warm enough to connect emotionally.

${BEFORE_AFTER_EXAMPLE}`,
    userMessage,
    temperature: 0.7,
    apiKey,
    label: 'Rewrite',
  });
}

async function generateVariation({
  systemPrompt,
  userMessage,
  temperature,
  apiKey,
  label,
}: {
  systemPrompt: string;
  userMessage: string;
  temperature: number;
  apiKey: string;
  label: string;
}): Promise<string> {
  console.log(`Generating ${label} variation...`);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${label} variation error:`, response.status, errorText);
    throw new Error(`Failed to generate ${label} variation: ${response.status}`);
  }

  const result = await response.json();
  let output = result.content?.[0]?.text || '';

  // Strip any wrapping quotes the model may add
  output = output.replace(/^["']|["']$/g, '').trim();

  // Validate length — retry once if outside 750-1050 range
  if (output.length < 750 || output.length > 1050) {
    console.log(`${label} variation length ${output.length} outside range, retrying...`);
    output = await retryForLength(output, apiKey, label);
  }

  console.log(`${label} variation done: ${output.length} chars`);
  return output;
}

async function retryForLength(draft: string, apiKey: string, label: string): Promise<string> {
  const direction = draft.length < 750 ? 'expand' : 'trim';
  const target = direction === 'expand' ? 'at least 800' : 'no more than 1000';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      temperature: 0.3,
      system: `You are a copy editor. ${direction === 'expand' ? 'Expand' : 'Tighten'} the following listing description to ${target} characters. Keep the same tone and style. Do not add any facts not already present. Output only the revised description.`,
      messages: [
        { role: 'user', content: draft },
      ],
    }),
  });

  if (!response.ok) {
    console.warn(`${label} length retry failed, using original`);
    return draft;
  }

  const result = await response.json();
  const revised = (result.content?.[0]?.text || draft).replace(/^["']|["']$/g, '').trim();
  console.log(`${label} retry result: ${revised.length} chars`);
  return revised;
}

async function saveToGoogleSheets(data: {
  email: string;
  address: string;
  price: string;
  originalDescription: string;
  rewrittenDescription: string;
  timestamp: string;
  optInTips: string;
}) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!googleScriptUrl) {
      console.error('Google Sheets webhook URL not configured');
      return;
    }

    console.log('Calling Google Sheets webhook for saveLead...');
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveLead', data }),
    });

    const result = await response.text();
    console.log('Google Sheets saveLead response:', result);
  } catch (error) {
    console.error('Failed to save to Google Sheets:', error);
  }
}

async function sendEmailToUser(email: string, property: { address: string; price: string; beds: string; baths: string }, description: string) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!googleScriptUrl) {
      console.error('Google Sheets webhook URL not configured');
      return;
    }

    console.log('Calling Google Sheets webhook for sendUserEmail to:', email);
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendUserEmail',
        data: {
          to: email,
          from: 'dj@kalerealty.com',
          subject: `Your AI-Enhanced Listing Description for ${property.address}`,
          propertyAddress: property.address,
          propertyPrice: property.price,
          propertyBeds: property.beds,
          propertyBaths: property.baths,
          description,
          characterCount: description.length,
        },
      }),
    });

    const result = await response.text();
    console.log('Google Sheets sendUserEmail response:', result);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

async function notifyAdmin(userEmail: string, address: string) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!googleScriptUrl) {
      console.error('Google Sheets webhook URL not configured');
      return;
    }

    console.log('Calling Google Sheets webhook for notifyAdmin...');
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'notifyAdmin',
        data: {
          to: 'dj@kalerealty.com',
          subject: 'New Listing Rewriter Lead!',
          userEmail,
          propertyAddress: address,
          propertyPrice: 'See Google Sheet',
          timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
        },
      }),
    });

    const result = await response.text();
    console.log('Google Sheets notifyAdmin response:', result);
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}
