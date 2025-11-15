
import type { VercelRequest, VercelResponse } from '@vercel/node';

// (Removed duplicate handler declaration. All logic is inside the main handler below.)

  export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Fix for Vercel: ensure body is parsed as JSON
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { prompt, userId, contentType, inputs = {}, barrierInfo } = req.body;

      // Extract variables from inputs
      const market = inputs.market;
      const tone = inputs.tone;
      const targetAudience = inputs.targetAudience;
      const length = inputs.length;
      const topic = inputs.topic;
      const listingAddress = inputs.listingAddress;
      const clientName = inputs.clientName;
      const lengthGuide = {
        short: '50-80 words',
        medium: '100-150 words',
        long: '150-200 words'
      };

      // Add barrier-specific instruction if provided
      let barrierInstruction = '';
      if (barrierInfo) {
        const barrierAdjustments: Record<string, string> = {
          'fear': 'Use softer, less aggressive language. Focus on being helpful rather than selling. Remove any pushy calls-to-action.',
          'skill': 'Make the language simple and easy to follow. Provide clear next steps. Use a conversational, teaching tone.',
          'authenticity': 'Write in a genuine, personal voice. Avoid corporate jargon. Sound like a real human having a conversation, not a salesperson.',
          'time': 'Keep it concise and action-oriented. Front-load the value. Make it quick to read and easy to act on.',
          'technical': 'Use simple, non-technical language. Explain any necessary terms. Make it beginner-friendly.',
          'motivation': 'Lead with impact and ROI. Show immediate value. Use encouraging, energizing language.'
        };
        const adjustment = barrierAdjustments[barrierInfo.barrierType] || '';
        if (adjustment) {
          barrierInstruction = `\n\nIMPORTANT CONTEXT: The user struggles with this because: "${barrierInfo.barrierLabel}"\nAdjust your response accordingly: ${adjustment}\n`;
        }
      }
      // ...existing code...

  switch (contentType) {
    case 'newsletter':
      return `You are a top-producing real estate agent in ${market || 'the local market'}. Write a ${tone} email newsletter for your sphere of influence (${targetAudience || 'past clients and leads'}).
${barrierInstruction}
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
${barrierInstruction}
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

    case 'open-house-plan':
      return `You are a real estate agent planning an open house for ${listingAddress || 'a property'} in ${market || 'the area'}. Create a complete action plan and follow-up sequence.
${barrierInstruction}
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
${barrierInstruction}
${topic || 'Provide general real estate business advice'}

Tone: ${tone}, actionable, specific
Length: ${lengthGuide[length as keyof typeof lengthGuide]}`;
  }
// End of try block
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
}
