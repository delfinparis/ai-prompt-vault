import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { description, style } = await req.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
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

    const systemPrompt = `You are an expert real estate copywriter who specializes in writing compelling, professional listing descriptions. Your goal is to transform basic property descriptions into engaging narratives that highlight key features, evoke emotion, and drive buyer interest.

Guidelines:
- Start with a captivating opening that sets the scene
- Highlight unique features and selling points
- Use descriptive, sensory language without being overly flowery
- Maintain professional tone while being engaging
- Focus on lifestyle benefits, not just features
- Keep the description concise but compelling (150-250 words ideal)
- Avoid clichés like "stunning" or "amazing" unless truly warranted
- Use proper grammar and punctuation
- Don't make claims that can't be verified
${style ? `- Write in a ${style} style` : ''}`;

    const userPrompt = `Rewrite this listing description to make it more compelling and professional:

${description}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to rewrite description' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rewrittenDescription = data.choices[0]?.message?.content;

    if (!rewrittenDescription) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rewritten: rewrittenDescription });
  } catch (error) {
    console.error('Error in rewrite API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
