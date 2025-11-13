// api/track.ts - Analytics tracking endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory tracking (in production, use a database or analytics service)
// For MVP, we'll just log to console and return success
// Future: Store in Vercel KV, Supabase, or PostHog

interface TrackingEvent {
  promptId: string;
  category?: string;
  source?: string;
  timestamp: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId, category, source } = req.body;

    if (!promptId) {
      return res.status(400).json({ error: 'promptId is required' });
    }

    const event: TrackingEvent = {
      promptId,
      category,
      source: source || 'gpt-store',
      timestamp: Date.now()
    };

    // Log the event (in production, send to analytics service)
    console.log('[GPT Analytics]', JSON.stringify(event));

    // Future: Store in database
    // await db.trackingEvents.create({ data: event });

    // Future: Send to PostHog/Plausible
    // await analytics.track('gpt_prompt_used', event);

    return res.status(200).json({
      success: true,
      message: 'Event tracked'
    });
  } catch (error) {
    console.error('Error in /api/track:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
