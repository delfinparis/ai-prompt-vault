import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface ZillowData {
  address: string;
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  description: string;
  features: string[];
  yearBuilt?: string;
  lotSize?: string;
  propertyType?: string;
  [key: string]: any;
}

interface PipelineStage {
  stage: string;
  expert: string;
  output: string;
}

export async function POST(req: NextRequest) {
  try {
    const { zillowUrl, email } = await req.json();

    if (!zillowUrl || typeof zillowUrl !== 'string') {
      return NextResponse.json(
        { error: 'Zillow URL is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
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

    // STAGE 1: Fetch Zillow data
    const zillowData = await fetchZillowData(zillowUrl);

    // STAGE 2: Research additional information
    const additionalInfo = await researchPropertyInfo(zillowData, apiKey);

    // STAGE 3: Multi-expert pipeline
    const finalDescription = await runExpertPipeline(zillowData, additionalInfo, apiKey);

    // STAGE 4: Save to Google Sheets and send emails
    await saveToGoogleSheets({
      email,
      zillowUrl,
      address: zillowData.address,
      price: zillowData.price,
      originalDescription: zillowData.description,
      rewrittenDescription: finalDescription,
      timestamp: new Date().toISOString(),
    });

    await sendEmailToUser(email, zillowData, finalDescription);
    await notifyAdmin(email, zillowData);

    return NextResponse.json({
      success: true,
      message: 'Processing complete! Check your email in the next 5 minutes.',
      propertyData: zillowData,
    });

  } catch (error) {
    console.error('Error in zillow-rewrite API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fetch and extract all available data from Zillow listing
 */
async function fetchZillowData(url: string): Promise<ZillowData> {
  try {
    // Fetch the Zillow page with realistic browser headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`Zillow returned status ${response.status}. Please ensure the URL is valid and publicly accessible.`);
    }

    const html = await response.text();

    // Extract structured data from Zillow page
    // Zillow often includes JSON-LD structured data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    let structuredData: any = {};

    if (jsonLdMatch) {
      try {
        structuredData = JSON.parse(jsonLdMatch[1]);
      } catch (e) {
        console.warn('Could not parse JSON-LD data');
      }
    }

    // Extract key information using regex patterns
    const extractText = (pattern: RegExp): string => {
      const match = html.match(pattern);
      return match ? match[1].trim() : '';
    };

    const data: ZillowData = {
      address: extractText(/<h1[^>]*>(.*?)<\/h1>/) || structuredData.address?.streetAddress || '',
      price: extractText(/\$[\d,]+/) || '',
      beds: extractText(/(\d+)\s*bed/i) || '',
      baths: extractText(/(\d+(?:\.\d+)?)\s*bath/i) || '',
      sqft: extractText(/([\d,]+)\s*sqft/i) || '',
      description: extractDescription(html),
      features: extractFeatures(html),
      yearBuilt: extractText(/Built in (\d{4})/) || '',
      lotSize: extractText(/([\d,]+(?:\.\d+)?)\s*(?:acres?|sq\.?\s*ft\.?)(?:\s+lot)?/i) || '',
      propertyType: extractText(/Property Type:\s*([^<]+)/) || '',
    };

    // Validate we got at least some core data
    if (!data.address && !data.price) {
      throw new Error('Could not extract property data from Zillow. The page structure may have changed or the listing may be unavailable.');
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to fetch Zillow data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract description from Zillow HTML
 */
function extractDescription(html: string): string {
  // Try multiple patterns to find description
  const patterns = [
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/is,
    /<p[^>]*class="[^"]*remarks[^"]*"[^>]*>(.*?)<\/p>/is,
    /"description":"([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1]
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim();
    }
  }

  return '';
}

/**
 * Extract features list from Zillow HTML
 */
function extractFeatures(html: string): string[] {
  const features: string[] = [];

  // Look for common feature patterns
  const featurePatterns = [
    /class="[^"]*feature[^"]*"[^>]*>([^<]+)</gi,
    /<li[^>]*>([^<]+)<\/li>/gi,
  ];

  for (const pattern of featurePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const feature = match[1].trim();
      if (feature && feature.length > 3 && feature.length < 100) {
        features.push(feature);
      }
    }
  }

  return [...new Set(features)].slice(0, 20); // Dedupe and limit
}

/**
 * STAGE 2: Research additional property information using GPT
 */
async function researchPropertyInfo(zillowData: ZillowData, apiKey: string): Promise<string> {
  const researchPrompt = `You are a real estate research expert. I'm analyzing a property listing and need you to identify any additional information that could make the listing more appealing.

Property Details:
- Address: ${zillowData.address}
- Type: ${zillowData.propertyType}
- Year Built: ${zillowData.yearBuilt}
- Features: ${zillowData.features.slice(0, 10).join(', ')}

CRITICAL INSTRUCTION: Only suggest factual information that could reasonably be verified. DO NOT hallucinate or invent details. If you don't have reliable information, say "No additional verified information available."

What additional selling points might this property have based on:
1. Neighborhood amenities (schools, parks, shopping)
2. Architectural style or historical significance
3. Energy efficiency or green features
4. Recent market trends in this area

Keep your response concise (2-3 sentences max) and factual.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a factual real estate researcher. Only provide verified, general information. Never invent specific details about properties.'
          },
          { role: 'user', content: researchPrompt },
        ],
        temperature: 0.3, // Low temperature for factual accuracy
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.warn('Research step failed, continuing without additional info');
      return 'No additional information available.';
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No additional information available.';
  } catch (error) {
    console.warn('Research failed:', error);
    return 'No additional information available.';
  }
}

/**
 * STAGE 3: Multi-expert pipeline - sequential refinement
 */
async function runExpertPipeline(
  zillowData: ZillowData,
  additionalInfo: string,
  apiKey: string
): Promise<string> {

  const experts = [
    {
      name: 'Top 1% Real Estate Agent (30 years experience)',
      systemPrompt: `You are a top 1% real estate listing agent with 30 years of experience selling homes faster than average market time. You understand buyer psychology and know exactly what makes properties sell quickly. Your specialty is crafting listing descriptions that create urgency and desire.`,
      userPrompt: `Create a compelling listing description for this property. Focus on what makes buyers say "I need to see this NOW!"

Property Data:
${formatPropertyData(zillowData)}

Additional Context:
${additionalInfo}

Original Description:
${zillowData.description}

Write a fresh description that highlights the most compelling aspects. Be specific, vivid, and benefit-focused.`,
      temperature: 0.7,
    },
    {
      name: 'Master Copywriter (Advertising & Persuasion)',
      systemPrompt: `You are a master copywriter specializing in advertising and persuasion. You know how to use power words, create desire, and drive action. You understand the psychology of persuasion and craft copy that converts.`,
      userPrompt: `Refine this listing description using proven persuasion techniques. Make it more compelling while keeping it professional and authentic.

Current draft:
[PREVIOUS_OUTPUT]

Enhance the persuasive power while maintaining authenticity. Focus on emotional triggers and benefits.`,
      temperature: 0.7,
    },
    {
      name: 'Best-Selling Novelist',
      systemPrompt: `You are a best-selling novelist who writes gripping books that capture readers' imaginations. You know how to create vivid scenes, evoke emotion, and make readers feel like they're experiencing the story firsthand.`,
      userPrompt: `Add narrative flair to this listing description. Help readers visualize themselves living in this home. Create an emotional connection.

Current draft:
[PREVIOUS_OUTPUT]

Make it more immersive and imaginative while keeping it grounded in the property's actual features.`,
      temperature: 0.7,
    },
    {
      name: 'Editor-in-Chief & Journalist',
      systemPrompt: `You are an Editor-in-Chief and top journalist for a successful magazine designed to excite readers. You know how to make content punchy, engaging, and impossible to ignore. You cut fluff and maximize impact.`,
      userPrompt: `Edit this listing for maximum excitement and engagement. Tighten the copy, punch up the language, and make every word count.

Current draft:
[PREVIOUS_OUTPUT]

Polish it for a magazine audience. Make it exciting but professional.`,
      temperature: 0.6,
    },
    {
      name: 'Hollywood Script Polisher',
      systemPrompt: `You are a master final script polisher in Hollywood who knows how to put the final touches on content for maximum effect. You understand pacing, rhythm, and how to create that perfect "wow" moment.`,
      userPrompt: `Give this listing description the final Hollywood polish. The goal: exciting but not overly dramatic, not cheesy, professional, fun, unique, powerful, minimal, and engaging.

Current draft:
[PREVIOUS_OUTPUT]

CRITICAL: The final output MUST be a maximum of 1000 characters. Get as close to 1000 as possible without going over. Count every character including spaces and punctuation.

This is the final pass. Make it shine without overdoing it. Every word should earn its place. Maximize impact within the 1000 character limit.`,
      temperature: 0.5,
    },
  ];

  let currentOutput = '';

  // Run through each expert in sequence
  for (const expert of experts) {
    const userPrompt = expert.userPrompt.replace('[PREVIOUS_OUTPUT]', currentOutput);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: expert.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: expert.temperature,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pipeline failed at ${expert.name}`);
    }

    const data = await response.json();
    currentOutput = data.choices[0]?.message?.content || currentOutput;

    // Add small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return currentOutput;
}

/**
 * Format property data for the prompt
 */
function formatPropertyData(data: ZillowData): string {
  return `
- Address: ${data.address}
- Price: ${data.price}
- Beds: ${data.beds}
- Baths: ${data.baths}
- Square Feet: ${data.sqft}
- Year Built: ${data.yearBuilt}
- Lot Size: ${data.lotSize}
- Property Type: ${data.propertyType}
- Key Features: ${data.features.slice(0, 10).join(', ')}
`.trim();
}

/**
 * Save lead data to Google Sheets
 */
async function saveToGoogleSheets(data: {
  email: string;
  zillowUrl: string;
  address: string;
  price: string;
  originalDescription: string;
  rewrittenDescription: string;
  timestamp: string;
}) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!googleScriptUrl) {
      console.warn('Google Sheets webhook URL not configured');
      return;
    }

    await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveLead',
        data,
      }),
    });
  } catch (error) {
    console.error('Failed to save to Google Sheets:', error);
    // Don't throw - we don't want to fail the request if sheets fails
  }
}

/**
 * Send the rewritten description to the user
 */
async function sendEmailToUser(email: string, property: ZillowData, description: string) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!googleScriptUrl) {
      console.warn('Email webhook URL not configured');
      return;
    }

    await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
 * Notify admin (DJ) about new lead
 */
async function notifyAdmin(userEmail: string, property: ZillowData) {
  try {
    const googleScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!googleScriptUrl) {
      console.warn('Admin notification webhook URL not configured');
      return;
    }

    await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'notifyAdmin',
        data: {
          to: 'dj@kalerealty.com',
          subject: '🎯 New Listing Rewriter Lead!',
          userEmail,
          propertyAddress: property.address,
          propertyPrice: property.price,
          timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
        },
      }),
    });
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}
