import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { address, unit, price, beds, baths, sqft, description, email } = await req.json();

    // Validation
    if (!address || !description || !email) {
      return NextResponse.json(
        { error: 'Address, description, and email are required' },
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

    // STAGE 1: Research property with web search
    const propertyResearch = await researchProperty(fullAddress, apiKey);

    // STAGE 2: Research neighborhood amenities
    const neighborhoodInfo = await researchNeighborhood(fullAddress, apiKey);

    // STAGE 3: Find comparable listings
    const comparableListings = await findComparableListings(fullAddress, apiKey);

    // STAGE 4: Run 5-expert pipeline
    const finalDescription = await runExpertPipeline({
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

    // STAGE 5: Save to Google Sheets and send emails
    await saveToGoogleSheets({
      email,
      address: fullAddress,
      price: price || 'N/A',
      originalDescription: description,
      rewrittenDescription: finalDescription,
      timestamp: new Date().toISOString(),
    });

    await sendEmailToUser(email, {
      address: fullAddress,
      price: price || 'N/A',
      beds: beds || 'N/A',
      baths: baths || 'N/A',
    }, finalDescription);

    await notifyAdmin(email, fullAddress);

    return NextResponse.json({
      success: true,
      message: 'Processing complete! Check your email in the next 5 minutes.',
    });

  } catch (error) {
    console.error('Error in listing-rewrite API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Research property using OpenAI web search
 */
async function researchProperty(address: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Find recent public real estate listings (last 30 days) for the property at: ${address}

Search for:
1. Any active or recently sold listings for this exact address
2. Property details (year built, lot size, HOA, special features, upgrades)
3. ONLY factual information - NO speculation or assumptions

Return ONLY verified facts you find. If no listings found, say so.`,
        }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to research property');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No additional property information found.';
  } catch (error) {
    console.error('Property research error:', error);
    return 'Unable to research property details.';
  }
}

/**
 * Research neighborhood amenities
 */
async function researchNeighborhood(address: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Research the immediate neighborhood around: ${address}

Find:
1. Nearby parks and green spaces (within 1 mile)
2. Shopping centers and retail (within 1 mile)
3. Public transportation access
4. Notable attractions or amenities
5. Highly-rated schools
6. Restaurants and entertainment

Return ONLY factual, verifiable information about what's near this address. Be specific with names and distances.`,
        }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to research neighborhood');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No neighborhood information found.';
  } catch (error) {
    console.error('Neighborhood research error:', error);
    return 'Unable to research neighborhood amenities.';
  }
}

/**
 * Find comparable listings
 */
async function findComparableListings(address: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Find recently closed real estate listings (last 30 days) NEAR: ${address}

Look for:
1. Sold properties within 0.5 miles
2. Review their listing descriptions for standout features
3. Note any neighborhood highlights they mentioned
4. Identify what made them attractive to buyers

Return insights about what nearby sellers emphasized in their descriptions. Focus on area features that attracted buyers.`,
        }],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to research comparable listings');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No comparable listings found.';
  } catch (error) {
    console.error('Comparable listings error:', error);
    return 'Unable to find comparable listings.';
  }
}

/**
 * Run the 5-expert pipeline
 */
async function runExpertPipeline(data: any, apiKey: string): Promise<string> {
  const experts = [
    {
      name: 'Real Estate Agent',
      systemPrompt: `You are a top 1% real estate agent with 30 years of experience. You know what sells homes.`,
      userPrompt: `Analyze this property and create a compelling listing foundation.

Property: ${data.address}
Price: ${data.price}
Beds/Baths: ${data.beds}/${data.baths}
Sq Ft: ${data.sqft}

Current Description:
${data.description}

Research Findings:
${data.propertyResearch}

Neighborhood Amenities:
${data.neighborhoodInfo}

Comparable Listings Insights:
${data.comparableListings}

Create a strong foundation that:
1. Highlights the property's best features
2. Incorporates verified neighborhood amenities
3. Uses insights from successful nearby listings
4. Creates urgency and desire
5. Remains 100% factual - NO embellishment`,
      temperature: 0.7,
    },
    {
      name: 'Master Copywriter',
      systemPrompt: `You are a master copywriter who creates irresistible sales copy.`,
      userPrompt: `Enhance this listing description with powerful, benefit-driven copy.

Current draft:
[PREVIOUS_OUTPUT]

Make it:
- Benefit-focused (what the buyer gains)
- Emotionally compelling
- Action-oriented
- Concise and impactful`,
      temperature: 0.8,
    },
    {
      name: 'Best-Selling Novelist',
      systemPrompt: `You are a best-selling novelist who knows how to tell captivating stories.`,
      userPrompt: `Add narrative appeal to this listing.

Current draft:
[PREVIOUS_OUTPUT]

Create:
- A sense of lifestyle and aspiration
- Vivid, sensory language
- Emotional connection
- A story buyers want to be part of`,
      temperature: 0.7,
    },
    {
      name: 'Editor-in-Chief',
      systemPrompt: `You are an Editor-in-Chief who ensures perfection in every word.`,
      userPrompt: `Edit this listing for maximum impact.

Current draft:
[PREVIOUS_OUTPUT]

Ensure:
- Every word earns its place
- Perfect flow and rhythm
- No redundancy
- Professional yet engaging tone
- Grammatically flawless`,
      temperature: 0.5,
    },
    {
      name: 'Hollywood Script Polisher',
      systemPrompt: `You are a Hollywood script polisher who adds the final wow factor.`,
      userPrompt: `Give this listing the final Hollywood polish.

Current draft:
[PREVIOUS_OUTPUT]

CRITICAL: Maximum 1000 characters. Get as close to 1000 as possible without going over.

Make it:
- Exciting but not overly dramatic
- Professional and unique
- Powerful and minimal
- Engaging with perfect pacing

Count every character including spaces. This is the final pass.`,
      temperature: 0.5,
    },
  ];

  let currentOutput = '';

  for (const expert of experts) {
    const userPrompt = expert.userPrompt.replace('[PREVIOUS_OUTPUT]', currentOutput || data.description);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: expert.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: expert.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed at ${expert.name} stage`);
    }

    const result = await response.json();
    currentOutput = result.choices[0]?.message?.content || currentOutput;
  }

  return currentOutput;
}

/**
 * Save to Google Sheets
 */
async function saveToGoogleSheets(data: any) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!googleScriptUrl) {
      console.warn('Google Sheets webhook URL not configured');
      return;
    }

    await fetch(googleScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveLead',
        data,
      }),
    });
  } catch (error) {
    console.error('Failed to save to Google Sheets:', error);
  }
}

/**
 * Send email to user
 */
async function sendEmailToUser(email: string, property: any, description: string) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!googleScriptUrl) {
      console.warn('Email webhook URL not configured');
      return;
    }

    await fetch(googleScriptUrl, {
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
  } catch (error) {
    console.error('Failed to send email to user:', error);
  }
}

/**
 * Notify admin
 */
async function notifyAdmin(userEmail: string, address: string) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!googleScriptUrl) {
      console.warn('Admin notification webhook URL not configured');
      return;
    }

    await fetch(googleScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'notifyAdmin',
        data: {
          to: 'dj@kalerealty.com',
          subject: '<¯ New Listing Rewriter Lead!',
          userEmail,
          propertyAddress: address,
          propertyPrice: 'See Google Sheet',
          timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
        },
      }),
    });
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}
