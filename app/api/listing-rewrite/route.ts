import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { address, unit, price, beds, baths, sqft, description, email } = await req.json();

    if (!address || !description) {
      return NextResponse.json(
        { error: 'Address and description are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const fullAddress = unit ? `${address}, Unit ${unit}` : address;
    const userEmail = email || 'anonymous@user.com';

    // OPTIMIZATION 1: Run all research calls in PARALLEL with gpt-4o-mini
    console.log('Starting parallel research...');
    const [propertyResearch, neighborhoodInfo, comparableListings] = await Promise.all([
      researchProperty(fullAddress, apiKey),
      researchNeighborhood(fullAddress, apiKey),
      findComparableListings(fullAddress, apiKey),
    ]);
    console.log('Research complete.');

    // OPTIMIZATION 2: Reduced to 2-pass pipeline (was 5 passes)
    const finalDescription = await runOptimizedPipeline({
      address: fullAddress,
      price,
      beds,
      baths,
      sqft,
      description,
      propertyResearch,
      neighborhoodInfo,
      comparableListings,
    }, apiKey);

    console.log('Saving to Google Sheets...');
    await saveToGoogleSheets({
      email: userEmail,
      address: fullAddress,
      price: price || 'N/A',
      originalDescription: description,
      rewrittenDescription: finalDescription,
      timestamp: new Date().toISOString(),
    });

    console.log('Sending email to user:', userEmail);
    await sendEmailToUser(userEmail, {
      address: fullAddress,
      price: price || 'N/A',
      beds: beds || 'N/A',
      baths: baths || 'N/A',
    }, finalDescription);

    console.log('Notifying admin...');
    await notifyAdmin(userEmail, fullAddress);

    return NextResponse.json({
      success: true,
      message: 'Processing complete! Check your email in the next 5 minutes.',
      description: finalDescription,
      characterCount: finalDescription.length,
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

// OPTIMIZATION: Use gpt-4o-mini for research (10x cheaper, same quality for factual lookups)
async function researchProperty(address: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate data researcher. Extract factual property details. Be concise. Never fabricate information.'
          },
          {
            role: 'user',
            content: `Research property at ${address}. Extract if available: year built, lot size, HOA fees, notable features, recent upgrades. Output as brief bullet points. Say "No data found" if nothing available.`
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('Property research error:', response.status);
      return 'No property data available.';
    }
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No property data available.';
  } catch (error) {
    console.error('Property research error:', error);
    return 'No property data available.';
  }
}

async function researchNeighborhood(address: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a neighborhood researcher. Provide factual local amenities with specific names and distances. Be concise.'
          },
          {
            role: 'user',
            content: `List amenities within 1 mile of ${address}: parks, transit, schools, shopping, restaurants. Include specific names and distances. Max 2-3 per category. Omit categories with nothing notable.`
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('Neighborhood research error:', response.status);
      return 'No neighborhood data available.';
    }
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No neighborhood data available.';
  } catch (error) {
    console.error('Neighborhood research error:', error);
    return 'No neighborhood data available.';
  }
}

async function findComparableListings(address: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate market analyst. Identify winning patterns from successful listings in the area.'
          },
          {
            role: 'user',
            content: `For properties near ${address}, what description patterns work best? List 2-3 key themes that resonate with buyers in this area (lifestyle benefits, neighborhood highlights, urgency triggers).`
          }
        ],
        max_tokens: 250,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error('Comparable listings error:', response.status);
      return 'No comparable data available.';
    }
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No comparable data available.';
  } catch (error) {
    console.error('Comparable listings error:', error);
    return 'No comparable data available.';
  }
}

// FEW-SHOT EXAMPLES: Real human-written MLS descriptions that convert
const FEW_SHOT_EXAMPLES = `
EXAMPLE 1 (Chicago condo, 847 chars):
"Sun-drenched corner unit in the heart of Lincoln Park with stunning skyline views from floor-to-ceiling windows. The open layout flows naturally from the chef's kitchen with quartz counters and stainless appliances to a generous living space perfect for entertaining. Primary suite includes a spa-like bath and custom closet system. Building amenities include 24-hour door staff, fitness center, and rooftop deck. Steps to the Diversey Brown Line, Lincoln Park Zoo, and some of the city's best dining along Halsted. Deeded parking included. One of the few units in this boutique building to hit the market this year."

EXAMPLE 2 (Suburban home, 912 chars):
"Original owner, meticulously maintained brick colonial on a quiet cul-de-sac in award-winning District 34. Hardwood floors throughout the main level lead to a remodeled kitchen with soft-close cabinetry, granite surfaces, and breakfast bar overlooking the family room. Four generous bedrooms upstairs include a primary with renovated en-suite. The finished basement adds flexible space for a home office, playroom, or gym. Mature landscaping surrounds the private backyard with bluestone patio, perfect for summer evenings. Walk to Avoca West Elementary. New roof 2022, HVAC 2021. Attached two-car garage with epoxy floors and built-in storage."
`;

// OPTIMIZED 2-PASS PIPELINE (was 5 passes)
async function runOptimizedPipeline(data: any, apiKey: string): Promise<string> {

  // PASS 1: Master Writer (combines agent + copywriter + novelist roles)
  console.log('Pass 1: Master Writer...');
  const masterWriterPrompt = `You are an elite real estate copywriter who has written thousands of MLS descriptions that sell homes fast and above asking price. You combine market expertise, persuasive copywriting, and storytelling into one compelling description.

PROPERTY DATA:
Address: ${data.address}
Price: ${data.price || 'Contact for price'} | Beds: ${data.beds || 'N/A'} | Baths: ${data.baths || 'N/A'} | Sq Ft: ${data.sqft || 'N/A'}

ORIGINAL DESCRIPTION:
${data.description}

RESEARCH CONTEXT:
Property: ${data.propertyResearch}
Neighborhood: ${data.neighborhoodInfo}
Market Insights: ${data.comparableListings}

${FEW_SHOT_EXAMPLES}

YOUR TASK:
Write a compelling listing description following these principles:

DO NOT:
- Use "Welcome to" or "Step into" openings
- Use "boasts," "features," or "offers" as main verbs
- Use "Whether you're..." constructions
- Use "Don't miss" or "Act now" clichés
- Use em dashes, exclamation points, or colon lists
- Use ** bold markers or bullet points
- Sound like AI wrote it

DO:
- Lead with the most specific, compelling detail (not generic praise)
- Convert features to lifestyle benefits (not "granite counters" but what that enables)
- Flow naturally from space to space like describing to a friend
- Include 1-2 neighborhood highlights woven naturally into the text
- Vary sentence length (mix short punchy with medium flow)
- End confidently but not pushy
- Keep factual and authentic

OUTPUT: One flowing paragraph, approximately 800-900 characters. No formatting, no line breaks.`;

  const pass1Response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: masterWriterPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!pass1Response.ok) {
    const errorText = await pass1Response.text();
    console.error('Master Writer error:', pass1Response.status, errorText);
    throw new Error(`Failed at Master Writer stage: ${pass1Response.status}`);
  }

  const pass1Result = await pass1Response.json();
  const draftDescription = pass1Result.choices[0]?.message?.content || data.description;

  // PASS 2: Final Polish (character count + human sound check)
  console.log('Pass 2: Final Polish...');
  const finalPolishPrompt = `You are a veteran MLS editor. Your only job is to polish this draft to exactly 950-1000 characters while ensuring it sounds completely human-written.

CURRENT DRAFT:
${draftDescription}

REQUIREMENTS:
1. Output must be exactly 950-1000 characters (count carefully)
2. ONE paragraph, no line breaks
3. Must sound like an experienced human agent wrote it, not AI

FINAL CHECKS - Remove if present:
- Em dashes (—) → use commas or periods
- Exclamation points → use periods
- "Welcome to" / "Step into" openings
- "boasts" / "features" / "offers" as verbs
- "Whether you're..." / "Imagine yourself..."
- Any ** or formatting markers
- Colon lists within sentences

If the draft is good, just adjust length. If it has AI tells, rewrite those phrases naturally.

OUTPUT: One clean paragraph, 950-1000 characters exactly, human-sounding.`;

  const pass2Response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: finalPolishPrompt }
      ],
      max_tokens: 500,
      temperature: 0.4,
    }),
  });

  if (!pass2Response.ok) {
    const errorText = await pass2Response.text();
    console.error('Final Polish error:', pass2Response.status, errorText);
    throw new Error(`Failed at Final Polish stage: ${pass2Response.status}`);
  }

  const pass2Result = await pass2Response.json();
  return pass2Result.choices[0]?.message?.content || draftDescription;
}

async function saveToGoogleSheets(data: any) {
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

async function sendEmailToUser(email: string, property: any, description: string) {
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
