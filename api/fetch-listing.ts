import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('[fetch-listing] Missing OPENAI_API_KEY');
}

const client = new OpenAI({
  apiKey,
});

export interface ListingData {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt?: number;
  price?: number;
  propertyType?: string;
  description?: string;
  features?: string[];
  lotSize?: string;
  parking?: string;
  heating?: string;
  cooling?: string;
  found: boolean;
  source?: string; // 'zillow', 'redfin', 'mls', 'trulia', etc.
}

/**
 * Fetch listing data from public sources via OpenAI's web search capability
 *
 * This uses GPT-4o-mini to search for the property across Zillow, Redfin,
 * Trulia, Realtor.com, and MLS listings, then extracts structured data.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Prevent caching of API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Missing required field: address' });
    }

    console.log('[fetch-listing] Searching for property:', address);

    // Use GPT-4o-mini to search for the listing and extract data
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a real estate data extraction assistant. When given a property address, you search for current listings on Zillow, Redfin, Trulia, Realtor.com, and MLS databases.

Your task is to find the MOST CURRENT listing for the given address and extract structured property data.

IMPORTANT RULES:
1. Only return data if you find a CURRENT or RECENT listing (within last 6 months)
2. If the property is not currently listed or you can't find reliable data, set "found": false
3. Always return valid JSON in the exact format specified
4. Extract ALL available property details
5. Be conservative - if unsure about a value, omit it rather than guess

Return JSON in this exact format:
{
  "found": true/false,
  "address": "formatted address",
  "bedrooms": number,
  "bathrooms": number,
  "squareFeet": number,
  "yearBuilt": number (optional),
  "price": number (optional),
  "propertyType": "single-family/condo/townhouse/etc",
  "description": "listing description if available",
  "features": ["feature1", "feature2"],
  "lotSize": "0.25 acres" (optional),
  "parking": "2-car garage" (optional),
  "heating": "forced air" (optional),
  "cooling": "central AC" (optional),
  "source": "zillow/redfin/mls/trulia/etc"
}`
        },
        {
          role: "user",
          content: `Search for the current listing at: ${address}

Find this property on Zillow, Redfin, Trulia, Realtor.com, or MLS listings and extract all available data.

If you cannot find a current listing, return { "found": false, "address": "${address}" }`
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for factual accuracy
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let listingData: ListingData;

    try {
      listingData = JSON.parse(content);
    } catch (e) {
      console.error('[fetch-listing] Failed to parse JSON:', e);
      return res.status(500).json({
        error: 'Failed to parse listing data',
        found: false,
        address
      });
    }

    console.log('[fetch-listing] Result:', listingData.found ? 'Found listing' : 'No listing found');

    return res.status(200).json(listingData);
  } catch (error: any) {
    console.error('[fetch-listing] Error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to fetch listing data',
      found: false
    });
  }
}
