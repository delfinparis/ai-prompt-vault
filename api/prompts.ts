// api/prompts.ts - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Module metadata
const MODULE_NAMES: Record<number, string> = {
  1: "Marketing & Lead Generation",
  2: "Daily Systems & Productivity",
  3: "Goals & Accountability",
  4: "Listings & Buyer Presentations",
  5: "Client Service & Follow-Up",
  6: "Finance & Business Planning",
  7: "Negotiation & Deal Strategy",
  8: "Home Search & Market Intel",
  9: "Database & Referral Engine",
  10: "Tech, AI & Marketing Automation",
  11: "AI Workflows & Automation",
  12: "Learning & Industry Resources"
};

const MODULE_TAGS: Record<number, string[]> = {
  1: ["leads", "marketing", "content"],
  2: ["systems", "productivity", "workflow"],
  3: ["goals", "planning", "accountability"],
  4: ["listing", "buyer", "presentation"],
  5: ["client", "service", "followup"],
  6: ["finance", "profit", "budget"],
  7: ["negotiation", "deals", "strategy"],
  8: ["buyer", "search", "tools"],
  9: ["sphere", "community", "nurture"],
  10: ["marketing", "ads", "ai"],
  11: ["automation", "workflow", "tech"],
  12: ["learning", "research", "intel"]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, search } = req.query;
    const categoryLower = typeof category === 'string' ? category.toLowerCase() : null;
    const searchLower = typeof search === 'string' ? search.toLowerCase() : null;

  // Dynamically import prompts from server-side lib to avoid importing frontend src/
  const { prompts: fullPrompts } = await import('../lib/prompts');

    // Build full prompt list with metadata
    const allPrompts = fullPrompts.flatMap((modulePrompts: any[], moduleIdx: number) => {
      const moduleName = MODULE_NAMES[moduleIdx + 1] || `Module ${moduleIdx + 1}`;
      const tags = MODULE_TAGS[moduleIdx + 1] || [];
      
      return modulePrompts.map((p: any, idx: number) => ({
        id: `${moduleName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx}`,
        title: p.title,
        category: moduleName,
        tags,
        description: p.quick || p.deliverable || '',
        popularity: 0, // Could be pulled from analytics in future
      }));
    });

    // Filter by category
    let filtered = allPrompts;
    if (categoryLower) {
      filtered = filtered.filter((p: any) => 
        p.category.toLowerCase().includes(categoryLower) ||
        p.tags.some((tag: string) => tag.includes(categoryLower))
      );
    }

    // Filter by search
    if (searchLower) {
      filtered = filtered.filter((p: any) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags.some((tag: string) => tag.includes(searchLower))
      );
    }

    return res.status(200).json({
      prompts: filtered,
      total: filtered.length,
      categories: Object.values(MODULE_NAMES),
    });
  } catch (error) {
    console.error('Error in /api/prompts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
