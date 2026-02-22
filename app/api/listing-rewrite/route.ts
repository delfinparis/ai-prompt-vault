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

// Few-shot examples: real human-written MLS descriptions that convert
const FEW_SHOT_EXAMPLES = `
EXAMPLE 1 (Chicago condo, 620 chars):
"Sun-drenched corner unit in the heart of Lincoln Park with skyline views from floor-to-ceiling windows. The open layout flows from the kitchen with quartz counters and stainless appliances to a generous living space. Primary suite includes an en-suite bath and custom closet system. Building amenities include 24-hour door staff, fitness center, and rooftop deck. Steps to the Diversey Brown Line and Lincoln Park Zoo. Deeded parking included. One of the few units in this boutique building to hit the market this year."

EXAMPLE 2 (Suburban home, 680 chars):
"Meticulously maintained brick colonial on a quiet cul-de-sac in award-winning District 34. Hardwood floors throughout the main level lead to a remodeled kitchen with soft-close cabinetry, granite surfaces, and breakfast bar overlooking the family room. Four bedrooms upstairs include a primary with renovated en-suite. The finished basement adds flexible space below grade. Private backyard with bluestone patio. Walk to Avoca West Elementary. New roof 2022, HVAC 2021. Attached two-car garage."
`;

// Shared writing rules
const WRITING_RULES = `RULES — follow these exactly:

DO NOT:
- Use "Welcome to" or "Step into" openings
- Use "boasts," "features," or "offers" as main verbs
- Use "Whether you're..." constructions
- Use "Don't miss" or "Act now" cliches
- Use em dashes, exclamation points, or colon lists
- Use ** bold markers or bullet points
- Use "stunning," "amazing," "charming," "cozy," "unique," or "motivated seller"
- Sound like AI wrote it

STRICT FACTUAL ACCURACY — this is the most important rule:
- ONLY state facts explicitly present in the PROPERTY DATA or ORIGINAL DESCRIPTION
- Do NOT invent specific distances (e.g., do not turn "near" into "two blocks from" or "steps from")
- Do NOT add neighborhood amenities, restaurants, shops, parks, landmarks, or area descriptions not in the source
- Do NOT describe the neighborhood as "vibrant," "bustling," "diverse," "revitalizing," or any other characterization not in the source
- Do NOT add the word "original" to features unless the source says "original"
- Do NOT invent sensory details about light, sound, views, or smells not in the source
- Do NOT add "storage" or other features/uses to rooms unless explicitly stated
- Do NOT speculate about investment returns, appreciation, cash flow, or property value
- Do NOT make "separate utilities" more specific (e.g., do not say "separate meters" or "separate billing")
- Do NOT change the property type (e.g., do not call a 2-flat a 3-flat)
- If the source says "near" a landmark, say "near" — do not upgrade or quantify the distance
- When in doubt, leave it out. Omitting a detail is always better than inventing one.
- To fill the character count, elaborate on STATED features (how rooms connect, how finishes work together) rather than inventing NEW facts. Rephrase and expand what exists — do not add what doesn't.

DO:
- Lead with the most specific, compelling detail (not generic praise)
- Convert stated features to lifestyle benefits (but do not invent features)
- Flow naturally from space to space
- Only reference features, specs, and details present in the PROPERTY DATA or ORIGINAL DESCRIPTION
- Output exactly 600-800 characters, one paragraph, no line breaks`;

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
    systemPrompt: `You are a top-producing listing agent with 20 years of experience and over 1,000 transactions. You write descriptions that lead with the single strongest selling point, weave in key specs naturally, and close with one moment of lifestyle appeal. You know what buyers actually care about and what makes them book a showing.

${WRITING_RULES}

TONE: Confident and approachable. Lead with the strongest feature. Mix practical details with one lifestyle moment. Professional enough for MLS, warm enough to connect emotionally. The sweet spot that appeals to the broadest range of buyers.

${FEW_SHOT_EXAMPLES}`,
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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
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

  // Validate length — retry once if outside 550-850 range
  if (output.length < 550 || output.length > 850) {
    console.log(`${label} variation length ${output.length} outside range, retrying...`);
    output = await retryForLength(output, apiKey, label);
  }

  console.log(`${label} variation done: ${output.length} chars`);
  return output;
}

async function retryForLength(draft: string, apiKey: string, label: string): Promise<string> {
  const direction = draft.length < 550 ? 'expand' : 'trim';
  const target = direction === 'expand' ? 'at least 600' : 'no more than 800';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
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
