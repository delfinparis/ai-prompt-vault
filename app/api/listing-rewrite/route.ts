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

    console.log('Saving to Google Sheets...');
    await saveToGoogleSheets({
      email,
      address: fullAddress,
      price: price || 'N/A',
      originalDescription: description,
      rewrittenDescription: finalDescription,
      timestamp: new Date().toISOString(),
    });

    console.log('Sending email to user:', email);
    await sendEmailToUser(email, {
      address: fullAddress,
      price: price || 'N/A',
      beds: beds || 'N/A',
      baths: baths || 'N/A',
    }, finalDescription);

    console.log('Notifying admin...');
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
        messages: [
          {
            role: 'system',
            content: 'You are a real estate data research specialist. Extract ONLY factual, verified information from public MLS listings and real estate databases. Never fabricate or assume details.'
          },
          {
            role: 'user',
            content: `Task: Research property at ${address}

Search scope:
- Recent public listings (last 30 days only)
- Active OR recently sold status
- Exact address match required

Extract these details if available:
1. Year built
2. Lot size
3. HOA fees/restrictions
4. Notable features (hardwood, updated kitchen, etc.)
5. Recent upgrades/renovations

Output format:
- Bullet points for found details
- State "No public listing data available" if nothing found
- Never invent information`
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
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
        messages: [
          {
            role: 'system',
            content: 'You are a neighborhood amenities researcher specializing in real estate location analysis. Provide accurate, factual information about local amenities with specific names and verified distances.'
          },
          {
            role: 'user',
            content: `Task: Map amenities near ${address}

Search radius: 1 mile maximum

Categories to research:
1. Parks & Recreation (names + distance)
2. Shopping & Retail centers
3. Public transit stops/stations
4. Notable attractions/landmarks
5. Highly-rated schools
6. Popular restaurants/dining

Output requirements:
- Include specific names (e.g., "Lincoln Park - 0.3 miles")
- Group by category
- Maximum 3 items per category
- Factual distances only
- Omit category if nothing notable within 1 mile`
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
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
        messages: [
          {
            role: 'system',
            content: 'You are a comparative market analysis expert. Analyze recently sold properties to identify winning description patterns and buyer attraction factors.'
          },
          {
            role: 'user',
            content: `Task: Analyze comparable sales near ${address}

Search criteria:
- Recently SOLD (last 30 days)
- Within 0.5 mile radius
- Similar property types preferred

Extract insights:
1. Most emphasized features in descriptions
2. Neighborhood selling points mentioned
3. Lifestyle benefits highlighted
4. Urgency triggers used

Deliver:
- 2-3 key patterns from successful listings
- Specific phrases/angles that worked
- Neighborhood themes that resonated
- Skip if no recent comparables found`
          }
        ],
        max_tokens: 400,
        temperature: 0.2,
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
      systemPrompt: `You are a top 1% real estate agent with 30 years of proven sales success. Your listings consistently generate multiple offers and sell above asking price because you focus on BENEFITS over features and create emotional urgency.`,
      userPrompt: `Create a compelling listing foundation that sells.

PROPERTY DATA:
Address: ${data.address}
Price: ${data.price} | Beds: ${data.beds} | Baths: ${data.baths} | Sq Ft: ${data.sqft}

ORIGINAL DESCRIPTION:
${data.description}

RESEARCH INSIGHTS:
Property Details: ${data.propertyResearch}
Neighborhood: ${data.neighborhoodInfo}
Successful Comparables: ${data.comparableListings}

YOUR MISSION:
1. Lead with the most powerful selling point (what makes buyers NEED to see this NOW)
2. Transform features into lifestyle benefits (don't just say "granite counters"—say what that MEANS for their life)
3. Weave in verified amenities naturally (parks, schools, shopping) as lifestyle perks
4. Apply winning patterns from comparable sales
5. Create urgency without being pushy
6. Stay 100% factual—never embellish

OUTPUT: A factual but irresistible listing foundation (400-600 words).`,
      temperature: 0.7,
    },
    {
      name: 'Master Copywriter',
      systemPrompt: `You are a master copywriter specializing in high-conversion sales copy. You've written copy that generated millions in real estate sales. You understand psychological triggers, power words, and benefit-driven language.`,
      userPrompt: `Transform this into sales copy that compels action.

CURRENT DRAFT:
[PREVIOUS_OUTPUT]

APPLY THESE TECHNIQUES:
1. Replace passive voice with active, vivid language
2. Convert every feature into a tangible benefit (What does the buyer GET? How does their life improve?)
3. Add sensory details that help buyers visualize living there
4. Use power words that trigger emotion (imagine, discover, retreat, sanctuary, haven)
5. Create micro-urgencies (opportunities don't last, rare find, etc.)
6. Keep it punchy—eliminate fluff

OUTPUT: Benefit-driven copy that makes buyers think "I need to see this NOW" (400-600 words).`,
      temperature: 0.8,
    },
    {
      name: 'Best-Selling Novelist',
      systemPrompt: `You are a best-selling novelist known for vivid, emotionally resonant storytelling. You make readers FEEL the scene. You create desire through narrative, not just description.`,
      userPrompt: `Add narrative magic that makes buyers fall in love.

CURRENT COPY:
[PREVIOUS_OUTPUT]

ENHANCE WITH:
1. Paint a "day in the life" moment (morning coffee on the deck, Sunday brunch in the kitchen, evening relaxation)
2. Use sensory language (warm sunlight, spacious feel, quiet neighborhood)
3. Create emotional connection to the lifestyle this home enables
4. Build aspiration—what version of themselves do buyers become here?
5. Keep it authentic and grounded in reality

CONSTRAINTS:
- Don't overwrite—maintain professional real estate tone
- Enhance, don't replace the factual foundation
- Avoid clichés ("dream home," "must see")

OUTPUT: Emotionally compelling copy that tells a story (400-600 words).`,
      temperature: 0.7,
    },
    {
      name: 'Editor-in-Chief',
      systemPrompt: `You are a ruthless Editor-in-Chief for a premium real estate publication. Every word must earn its place. You cut mercilessly to achieve maximum impact per word.`,
      userPrompt: `Edit this for maximum impact and efficiency.

CURRENT DRAFT:
[PREVIOUS_OUTPUT]

EDITORIAL STANDARDS:
1. Delete redundancies and filler words
2. Tighten every sentence—make each one punchy
3. Ensure perfect flow and rhythm
4. Verify tone is professional yet engaging (not stuffy, not too casual)
5. Check that benefits outweigh features 3:1
6. Confirm every claim is factual

FIX:
- Weak verbs → Strong verbs
- Long sentences → Mix of short punchy + medium flow
- Repetitive words → Varied vocabulary
- Generic phrases → Specific, memorable language

OUTPUT: Polished, tight copy (350-500 words).`,
      temperature: 0.5,
    },
    {
      name: 'Hollywood Script Polisher',
      systemPrompt: `You are a Hollywood script polisher who adds that final "wow factor" to million-dollar productions. You know how to hook an audience in seconds and keep them captivated.`,
      userPrompt: `Final polish—make this IRRESISTIBLE.

CURRENT DRAFT:
[PREVIOUS_OUTPUT]

CRITICAL REQUIREMENTS:
🎯 Maximum 1000 characters (hard limit—listings get cut off!)
🎯 Aim for 950-1000 for maximum real estate value
🎯 Maintain professional tone (exciting but not overhyped)
🎯 Preserve all factual accuracy
🎯 Front-load the hook—grab attention in the first sentence

POLISH CHECKLIST:
✓ Opening line is irresistible
✓ Every sentence drives desire
✓ Rhythm and pacing are perfect
✓ Benefits dominate features
✓ Ends with subtle urgency
✓ Character count: 950-1000

OUTPUT: The final, market-ready listing description (950-1000 characters exactly). Count characters carefully.`,
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
