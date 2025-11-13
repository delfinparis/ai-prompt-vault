import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Privacy-first analytics endpoint
 * 
 * Stores events in memory (for demo) or forwards to your database/service.
 * Designed to be GDPR compliant - no PII, no cookies, no cross-domain tracking.
 * 
 * Usage:
 * POST /api/analytics
 * Body: { event: string, properties: Record<string, any>, timestamp?: number }
 * 
 * Example:
 * fetch('/api/analytics', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     event: 'rpv:wizard_start',
 *     properties: { source: 'header_cta' }
 *   })
 * });
 */

// In-memory store (resets on cold start - replace with database for production)
const events: Array<{
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userAgent?: string;
  referrer?: string;
}> = [];

// Rate limiting (simple in-memory implementation)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // events per IP per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT) {
    return false;
  }
  
  limit.count++;
  return true;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
    // Rate limiting
    const ip = req.headers['x-forwarded-for'] as string || 
               req.headers['x-real-ip'] as string || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    const { event, properties = {}, timestamp } = req.body;
    
    if (!event || typeof event !== 'string') {
      return res.status(400).json({ error: 'Invalid event name' });
    }
    
    // Validate event name (must start with rpv:)
    if (!event.startsWith('rpv:')) {
      return res.status(400).json({ error: 'Event must start with rpv:' });
    }
    
    // Store event (replace with database insert in production)
    const referrerHeader = req.headers.referer || req.headers.referrer;
    const eventRecord = {
      event,
      properties,
      timestamp: timestamp || Date.now(),
      userAgent: req.headers['user-agent'],
      referrer: Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader,
    };
    
    events.push(eventRecord);
    
    // Keep only last 1000 events (memory management)
    if (events.length > 1000) {
      events.shift();
    }
    
    // Optional: Forward to external service
    // await forwardToService(eventRecord);
    
    // Log in development/staging
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics]', event, properties);
    }
    
    return res.status(200).json({ 
      success: true,
      eventId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    });
    
  } catch (error) {
    console.error('[Analytics Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Optional: Forward events to external service
 * Uncomment and configure for production use
 */
/*
async function forwardToService(event: any) {
  // Example: Forward to PostHog
  await fetch('https://app.posthog.com/capture/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: process.env.POSTHOG_API_KEY,
      event: event.event,
      properties: event.properties,
      timestamp: new Date(event.timestamp).toISOString(),
    }),
  });
  
  // Example: Forward to your database
  // await db.insert('analytics_events', event);
}
*/
