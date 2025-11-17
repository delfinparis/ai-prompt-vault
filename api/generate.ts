import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('[generate] Missing OPENAI_API_KEY. Did you set it in Vercel environment variables?');
}

const client = new OpenAI({
  apiKey,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is not set. Add it to Vercel environment variables.',
    });
  }

  try {
    const { prompt, userInput } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing required field: prompt' });
    }

    console.log('[generate] Calling OpenAI with prompt length:', prompt.length);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional real estate content writer. Generate high-quality, ready-to-use content based on the user's prompt. Follow the instructions exactly and produce polished, professional output."
        },
        {
          role: "user",
          content: prompt
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const output = completion.choices[0]?.message?.content || '';

    console.log('[generate] Success! Output length:', output.length);

    return res.status(200).json({
      success: true,
      output,
      model: 'gpt-4o-mini',
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('[generate] Error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate content',
      details: String(error)
    });
  }
}
