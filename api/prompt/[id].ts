// api/prompt/[id].ts - Get a specific prompt by ID
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildFullPrompt } from '../../src/promptUtils';

// Module metadata (same as prompts.ts)
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
    // Get ID from query params (Vercel dynamic route)
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Prompt ID is required' });
    }

    // Dynamically import prompts
    const { prompts: fullPrompts } = await import('../../src/prompts');

    // Find the prompt by ID
    let foundPrompt: any = null;
    let moduleIdx = -1;
    let promptIdx = -1;

    for (let i = 0; i < fullPrompts.length; i++) {
      const modulePrompts = fullPrompts[i];
      for (let j = 0; j < modulePrompts.length; j++) {
        const moduleName = MODULE_NAMES[i + 1] || `Module ${i + 1}`;
        const promptId = `${moduleName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${j}`;
        
        if (promptId === id) {
          foundPrompt = modulePrompts[j];
          moduleIdx = i;
          promptIdx = j;
          break;
        }
      }
      if (foundPrompt) break;
    }

    if (!foundPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Build the full prompt details
    const moduleName = MODULE_NAMES[moduleIdx + 1];
    const tags = MODULE_TAGS[moduleIdx + 1] || [];
    
    const promptItem = {
      ...foundPrompt,
      module: moduleName,
      index: promptIdx,
      tags
    };

    const fullPromptText = buildFullPrompt(promptItem);

    // Parse inputs if they exist
    const inputs = foundPrompt.inputs ? foundPrompt.inputs.split('\n')
      .filter((line: string) => line.trim().startsWith('-'))
      .map((line: string) => {
        const match = line.match(/^-\s*([^=]+)=\s*(.+)$/);
        if (match) {
          return {
            name: match[1].trim(),
            placeholder: match[2].trim(),
            description: match[2].trim()
          };
        }
        return null;
      })
      .filter(Boolean) : [];

    return res.status(200).json({
      id,
      title: foundPrompt.title,
      category: moduleName,
      tags,
      fullPrompt: fullPromptText,
      inputs,
      format: foundPrompt.format || 'bulleted brief + 1 table',
      audience: foundPrompt.audience || '[buyer/seller/investor/agent type in [market]]',
      deliverable: foundPrompt.deliverable || '',
      success: foundPrompt.success || '',
      webLink: `https://ai-prompt-vault.vercel.app/?prompt=${id}`
    });
  } catch (error) {
    console.error('Error in /api/prompt/[id]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
