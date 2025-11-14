import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS headers for client requests
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper to build specialized prompts for different content types
function buildPromptForContentType(contentType: string, inputs: any = {}): string {
  const { market, targetAudience, listingAddress, clientName, topic, tone = 'professional', length = 'medium' } = inputs;

  const lengthGuide = {
    short: '150-200 words',
    medium: '300-400 words',
    long: '500-600 words'
  };

  switch (contentType) {
    case 'newsletter':
      return `You are a top-producing real estate agent in ${market || 'the local market'}. Write a ${tone} email newsletter for your sphere of influence (${targetAudience || 'past clients and leads'}).

Length: ${lengthGuide[length as keyof typeof lengthGuide]}

Include:
1. A compelling subject line (provide this separately at the top)
2. Brief market update relevant to ${market || 'the area'} (1-2 stats about prices, inventory, or rates)
3. ${topic || 'One actionable tip for homeowners or a local event recommendation'}
4. Soft call-to-action (e.g., "Thinking of selling? Let's chat about your home's value")
5. Personal sign-off

Tone: ${tone}, conversational, value-first (not salesy)
Format: Ready to copy/paste into email

Subject Line:
[Write compelling subject here]

Email Body:
[Write newsletter here]`;

    case 'social-post':
      return `You are a real estate agent in ${market || 'the local market'}. Create an engaging ${tone} social media post ${listingAddress ? `showcasing the listing at ${listingAddress}` : `about ${topic || 'the current real estate market'}`}.

Length: ${length === 'short' ? '50-80 words' : length === 'medium' ? '100-150 words' : '150-200 words'}

Include:
1. Attention-grabbing opening (hook in first line)
2. ${listingAddress ? 'Key features and benefits of the property' : 'Valuable insight or tip'}
3. Call-to-action appropriate for social media
4. 5-7 relevant hashtags

Tone: ${tone}, engaging, scroll-stopping
Format: Ready to post

POST:
[Write post here]

HASHTAGS:
[List hashtags here]`;

    case 'prospecting-script':
      return `You are a top real estate coach. Write a natural, conversational ${tone} phone script for ${topic || 'cold calling FSBOs (For Sale By Owners)'}.

The script should:
1. Be 30-45 seconds for the initial pitch
2. Sound natural and conversational (not robotic)
3. Lead with value, not asking for business
4. Include 3 common objections and smooth responses
5. End with a low-pressure next step

Context: Agent working in ${market || 'a suburban market'}
Tone: ${tone}, confident but friendly

OPENING SCRIPT:
[Write opening here]

OBJECTION HANDLERS:
Objection 1: [Common objection]
Response: [Natural response]

Objection 2: [Common objection]
Response: [Natural response]

Objection 3: [Common objection]
Response: [Natural response]

CLOSING:
[Next step request]`;

    case 'follow-up-email':
      return `You are a real estate agent following up with ${clientName || 'a lead/past client'}. Write a ${tone} follow-up email that ${topic || 'checks in and provides value without being pushy'}.

Length: ${lengthGuide[length as keyof typeof lengthGuide]}

Include:
1. Subject line that gets opened
2. Personalized opening referencing previous interaction
3. Value offer (market update, property match, helpful resource)
4. Soft call-to-action
5. P.S. with additional value or personal touch

Context: ${market || 'Local market'}, ${targetAudience || 'general audience'}
Tone: ${tone}, helpful, relationship-building

Subject Line:
[Write subject here]

Email:
[Write email here]`;

    case 'referral-request':
      return `You are a real estate agent who just closed a successful transaction with ${clientName || 'a happy client'}. Write a ${tone} request for referrals that feels natural and not pushy.

Length: ${lengthGuide[length as keyof typeof lengthGuide]}

Include:
1. Gratitude for their business
2. Brief reminder of the great outcome
3. Natural segue to "who do you know?" ask
4. Make it easy for them to share your info
5. Offer value in return (free market analysis for their friends)

Tone: ${tone}, grateful, conversational
Format: Email or text message (specify both options)

EMAIL VERSION:
[Write email here]

TEXT MESSAGE VERSION:
[Write shorter text version here]`;

    case 'open-house-plan':
      return `You are a real estate agent planning an open house for ${listingAddress || 'a property'} in ${market || 'the area'}. Create a complete action plan and follow-up sequence.

Include:
1. Pre-event marketing plan (3-5 tactics)
2. Day-of checklist (what to bring, setup tasks)
3. Conversation starters and qualifying questions
4. Follow-up email template for attendees
5. Timeline (2 weeks before through 2 days after)

Target Audience: ${targetAudience || 'First-time buyers and local families'}
Property Type: ${topic || 'Single-family home'}

Format: Step-by-step action plan

OPEN HOUSE ACTION PLAN:
[Write comprehensive plan here]`;

    default:
      return `You are a real estate business coach. Help with the following request for an agent in ${market || 'the market'}:

${topic || 'Provide general real estate business advice'}

Tone: ${tone}, actionable, specific
Length: ${lengthGuide[length as keyof typeof lengthGuide]}`;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, userId, contentType, inputs } = req.body;

    if (!prompt && !contentType) {
      return res.status(400).json({ error: 'Prompt or contentType is required' });
    }

    // Build specialized prompt based on content type
    let finalPrompt = prompt;
    
    if (contentType) {
      finalPrompt = buildPromptForContentType(contentType, inputs);
    }

    // Get OpenAI API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'API not configured' });
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      return res.status(openaiResponse.status).json({ 
        error: 'AI generation failed',
        details: error 
      });
    }

    const data = await openaiResponse.json();
    const generatedText = data.choices[0]?.message?.content || '';

    // Parse out special sections if present (subject lines, hashtags, etc.)
    const metadata: any = {};
    
    if (contentType === 'newsletter' || contentType === 'follow-up-email') {
      const subjectMatch = generatedText.match(/Subject Line:\s*\n(.+?)(\n|$)/i);
      if (subjectMatch) {
        metadata.subject = subjectMatch[1].trim();
      }
    }
    
    if (contentType === 'social-post') {
      const hashtagMatch = generatedText.match(/HASHTAGS:\s*\n(.+?)$/is);
      if (hashtagMatch) {
        metadata.hashtags = hashtagMatch[1].trim().split(/\s+/).filter((h: string) => h.startsWith('#'));
      }
    }

    // Track usage (you'll expand this with database later)
    console.log(`Generation for user ${userId || 'anonymous'}: ${contentType || 'custom'}`);

    return res.status(200).json({
      success: true,
      output: generatedText,
      metadata,
      contentType,
      model: 'gpt-4o-mini',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
