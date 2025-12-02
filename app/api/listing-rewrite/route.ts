import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { updateUserCredits } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Check for auth token
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    let userEmail: string = 'anonymous@user.com';
    let userCredits: number = 0;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        userId = decoded.id;
        userEmail = decoded.email;
        userCredits = decoded.credits;

        // Check if user has credits
        if (userCredits < 1) {
          return NextResponse.json(
            { error: 'No credits remaining. Please purchase more credits to continue.' },
            { status: 402 }
          );
        }
      }
    }

    // If no valid auth, require email in body (free tier / anonymous)
    const body = await req.json();
    const { address, unit, price, beds, baths, sqft, description, email } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Please log in or provide an email address' },
        { status: 401 }
      );
    }

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
    const finalEmail = email || userEmail;

    // OPTIMIZATION 1: Run all research calls in PARALLEL with gpt-4o-mini
    console.log('Starting parallel research...');
    const [propertyResearch, neighborhoodInfo, comparableListings] = await Promise.all([
      researchProperty(fullAddress, apiKey),
      researchNeighborhood(fullAddress, apiKey),
      findComparableListings(fullAddress, apiKey),
    ]);
    console.log('Research complete.');

    // Generate all 3 variations (professional, fun, balanced)
    const variations = await generateAllVariations({
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

    // Deduct credit if user is authenticated
    if (userId) {
      const newCredits = userCredits - 1;
      console.log(`Deducting credit for user ${userId}. Credits: ${userCredits} -> ${newCredits}`);
      await updateUserCredits(userId, newCredits, finalEmail);
    }

    console.log('Saving to Google Sheets...');
    await saveToGoogleSheets({
      email: finalEmail,
      address: fullAddress,
      price: price || 'N/A',
      originalDescription: description,
      rewrittenDescription: variations.balanced, // Save balanced as default
      timestamp: new Date().toISOString(),
    });

    console.log('Sending email to user:', finalEmail);
    await sendEmailToUser(finalEmail, {
      address: fullAddress,
      price: price || 'N/A',
      beds: beds || 'N/A',
      baths: baths || 'N/A',
    }, variations);

    console.log('Notifying admin...');
    await notifyAdmin(finalEmail, fullAddress);

    return NextResponse.json({
      success: true,
      message: 'Processing complete! Check your email in the next 5 minutes.',
      variations,
      description: variations.balanced, // Keep for backwards compatibility
      characterCount: variations.balanced.length,
      address: fullAddress,
      creditsRemaining: userId ? userCredits - 1 : undefined,
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

// Types for variations
interface DescriptionVariations {
  professional: string;
  fun: string;
  balanced: string;
}

// Generate all 3 variations in parallel (same cost - one API call each but run simultaneously)
async function generateAllVariations(data: any, apiKey: string): Promise<DescriptionVariations> {
  console.log('Generating 3 variations in parallel...');

  const baseContext = `PROPERTY DATA:
Address: ${data.address}
Price: ${data.price || 'Contact for price'} | Beds: ${data.beds || 'N/A'} | Baths: ${data.baths || 'N/A'} | Sq Ft: ${data.sqft || 'N/A'}

ORIGINAL DESCRIPTION:
${data.description}

RESEARCH CONTEXT:
Property: ${data.propertyResearch}
Neighborhood: ${data.neighborhoodInfo}
Market Insights: ${data.comparableListings}

${FEW_SHOT_EXAMPLES}`;

  const baseRules = `DO NOT:
- Use "Welcome to" or "Step into" openings
- Use "boasts," "features," or "offers" as main verbs
- Use "Whether you're..." constructions
- Use "Don't miss" or "Act now" clichés
- Use em dashes, exclamation points, or colon lists
- Use ** bold markers or bullet points
- Sound like AI wrote it

DO:
- Lead with the most specific, compelling detail (not generic praise)
- Convert features to lifestyle benefits
- Flow naturally from space to space
- Include 1-2 neighborhood highlights woven naturally into the text
- Keep factual and authentic
- Output exactly 800-900 characters, one paragraph, no line breaks`;

  // Professional tone prompt
  const professionalPrompt = `You are an elite real estate copywriter writing for luxury brokerages and high-end MLS listings.

${baseContext}

TONE: Professional & Sophisticated
- Formal but not stuffy
- Emphasize investment value, quality finishes, and prestige
- Use precise, elevated language
- Appeal to discerning buyers who value quality and exclusivity
- Subtle confidence, understated elegance

${baseRules}`;

  // Fun/Engaging tone prompt
  const funPrompt = `You are a creative real estate copywriter known for engaging, personality-filled listings that stand out.

${baseContext}

TONE: Fun & Engaging
- Warm, conversational, and inviting
- Paint vivid lifestyle pictures (weekend BBQs, morning coffee on the patio)
- Use sensory language and emotional hooks
- Make readers smile and imagine themselves living there
- Energetic but not over-the-top

${baseRules}`;

  // Balanced tone prompt
  const balancedPrompt = `You are an experienced real estate copywriter who blends professionalism with warmth.

${baseContext}

TONE: Balanced (Professional + Engaging)
- Professional enough for MLS, warm enough to connect emotionally
- Mix practical details with lifestyle benefits
- Confident but approachable
- Appeal to a broad range of buyers
- The sweet spot between formal and friendly

${baseRules}`;

  // Run all 3 in parallel
  const [professionalResult, funResult, balancedResult] = await Promise.all([
    generateSingleVariation(professionalPrompt, apiKey, 'Professional'),
    generateSingleVariation(funPrompt, apiKey, 'Fun'),
    generateSingleVariation(balancedPrompt, apiKey, 'Balanced'),
  ]);

  console.log('All 3 variations generated successfully.');

  return {
    professional: professionalResult,
    fun: funResult,
    balanced: balancedResult,
  };
}

async function generateSingleVariation(prompt: string, apiKey: string, label: string): Promise<string> {
  console.log(`Generating ${label} variation...`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${label} variation error:`, response.status, errorText);
    throw new Error(`Failed to generate ${label} variation: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || '';
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

async function sendEmailToUser(email: string, property: any, variations: DescriptionVariations) {
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
          subject: `Your 3 AI-Enhanced Listing Descriptions for ${property.address}`,
          propertyAddress: property.address,
          propertyPrice: property.price,
          propertyBeds: property.beds,
          propertyBaths: property.baths,
          // Send all 3 variations
          professionalDescription: variations.professional,
          funDescription: variations.fun,
          balancedDescription: variations.balanced,
          // Keep backward compatibility
          description: variations.balanced,
          characterCount: variations.balanced.length,
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
