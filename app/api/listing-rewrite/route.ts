import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { address, unit, price, beds, baths, sqft, description, email } = await req.json();

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

    const propertyResearch = await researchProperty(fullAddress, apiKey);
    const neighborhoodInfo = await researchNeighborhood(fullAddress, apiKey);
    const comparableListings = await findComparableListings(fullAddress, apiKey);

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
          content: `Find recent public real estate listings (last 30 days) for: ${address}. Search for active or recently sold listings for this exact address. Find property details like year built, lot size, HOA, features, upgrades. Return ONLY verified facts. If no listings found, say so.`,
        }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error('Failed to research property');
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No additional property information found.';
  } catch (error) {
    console.error('Property research error:', error);
    return 'Unable to research property details.';
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
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Research the neighborhood around: ${address}. Find nearby parks, shopping, public transit, attractions, schools, restaurants within 1 mile. Return ONLY factual information with names and distances.`,
        }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error('Failed to research neighborhood');
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No neighborhood information found.';
  } catch (error) {
    console.error('Neighborhood research error:', error);
    return 'Unable to research neighborhood amenities.';
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
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Find recently closed listings (last 30 days) near: ${address}. Look for sold properties within 0.5 miles. Review their descriptions for standout features. Note neighborhood highlights. Identify what attracted buyers.`,
        }],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error('Failed to research comparable listings');
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No comparable listings found.';
  } catch (error) {
    console.error('Comparable listings error:', error);
    return 'Unable to find comparable listings.';
  }
}

async function runExpertPipeline(data: any, apiKey: string): Promise<string> {
  const experts = [
    {
      name: 'Real Estate Agent',
      systemPrompt: 'You are a top 1% real estate agent with 30 years of experience.',
      userPrompt: `Analyze this property and create a compelling listing foundation.

Property: ${data.address}
Price: ${data.price}
Beds/Baths: ${data.beds}/${data.baths}
Sq Ft: ${data.sqft}

Current Description: ${data.description}

Research: ${data.propertyResearch}
Neighborhood: ${data.neighborhoodInfo}
Comparable Listings: ${data.comparableListings}

Highlight best features, incorporate verified amenities, use insights from nearby listings, create urgency, remain 100% factual.`,
      temperature: 0.7,
    },
    {
      name: 'Master Copywriter',
      systemPrompt: 'You are a master copywriter who creates irresistible sales copy.',
      userPrompt: 'Enhance this with powerful, benefit-driven copy. Make it benefit-focused, emotionally compelling, action-oriented, concise.\n\n[PREVIOUS_OUTPUT]',
      temperature: 0.8,
    },
    {
      name: 'Best-Selling Novelist',
      systemPrompt: 'You are a best-selling novelist who knows captivating stories.',
      userPrompt: 'Add narrative appeal. Create lifestyle aspiration, vivid sensory language, emotional connection, a story buyers want.\n\n[PREVIOUS_OUTPUT]',
      temperature: 0.7,
    },
    {
      name: 'Editor-in-Chief',
      systemPrompt: 'You are an Editor-in-Chief ensuring perfection.',
      userPrompt: 'Edit for maximum impact. Every word earns its place, perfect flow, no redundancy, professional yet engaging.\n\n[PREVIOUS_OUTPUT]',
      temperature: 0.5,
    },
    {
      name: 'Hollywood Script Polisher',
      systemPrompt: 'You are a Hollywood script polisher adding the wow factor.',
      userPrompt: 'Final polish. CRITICAL: Maximum 1000 characters. Get close to 1000 without going over. Exciting but not dramatic, professional, unique, powerful.\n\n[PREVIOUS_OUTPUT]',
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

    if (!response.ok) throw new Error(`Failed at ${expert.name} stage`);
    const result = await response.json();
    currentOutput = result.choices[0]?.message?.content || currentOutput;
  }

  return currentOutput;
}

async function saveToGoogleSheets(data: any) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!googleScriptUrl) return;

    await fetch(googleScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveLead', data }),
    });
  } catch (error) {
    console.error('Failed to save to Google Sheets:', error);
  }
}

async function sendEmailToUser(email: string, property: any, description: string) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!googleScriptUrl) return;

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
    console.error('Failed to send email:', error);
  }
}

async function notifyAdmin(userEmail: string, address: string) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!googleScriptUrl) return;

    await fetch(googleScriptUrl, {
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
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}
