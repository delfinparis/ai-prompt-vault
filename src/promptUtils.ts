/* Utilities for prompts: types, prompt builder, merge logic, and placeholder helpers */

export type PromptItem = {
  title: string;
  quick?: string;
  role?: string;
  deliverable?: string;
  success?: string;
  inputs?: string;
  constraints?: string;
  tools?: string;
  iterate?: string;
  risk?: string;
  format?: string;
  audience?: string;
  module: string;
  index: number;
};

export type RemotePrompt = Omit<PromptItem, "module" | "index">;
export type RemotePayload = {
  version?: string;
  modules?: Record<string, RemotePrompt[]>;
};

export const buildFullPrompt = (p: PromptItem): string => {
  const moduleName = p.module || "Category";
  const title = p.title || "Prompt";
  const audience = p.audience || "[buyer/seller/investor/agent type in [market]]";
  const inputs =
    p.inputs ||
    "- KPIs = [list]\n- Tools = [list]\n- Timeline/Budget = [X]\n- Constraints = [plain, compliant language]";
  const deliverable = p.deliverable || "Bulleted steps + 1 table (fields relevant to this prompt).";
  const constraints = p.constraints || "≤ 400 words; use headings; avoid guarantees; fair-housing safe.";
  const quality = (p as any).quality || "Add ‘Why this works’ and 3 clarifying questions. Propose 2 ways to improve the first draft.";
  const success = p.success || "Define measurable outcomes (response rate %, time saved, appointments set).";
  const tools = p.tools || "Prefer Google Workspace, CRM, Make.com/Zapier, Notion, Canva as applicable.";
  const iterate = p.iterate || "End by asking 2–3 questions and offering a v2 refinement path.";
  const risk = p.risk || "Risk Check: keep claims verifiable; avoid protected-class targeting; keep language compliant.";

  return `Role & Outcome
Act as a ${p.role || "top 1% real-estate coach"} and produce: “${title}” for ${audience} in ${moduleName}.

Audience & Channel
Primary user = ${audience}. Output format = ${p.format || "bulleted brief + 1 table"}.

Facts / Inputs
${inputs}

Constraints
${constraints}

Deliverable
${deliverable}

Quality Controls
${quality}

Success Metrics
${success}

Tool Integration
${tools}

Iteration Loop
${iterate}

${risk}`;
};

export function mergeRemote(base: PromptItem[], remote: RemotePayload): PromptItem[] {
  if (!remote?.modules) return base;

  const result = [...base];
  const existing = new Set(base.map((b) => (b.title || "").toLowerCase().trim()));
  const baseModules = Array.from(new Set(base.map((b) => b.module)));

  const findModuleKey = (label: string): string | null => {
    const exact = baseModules.find((m) => m === label);
    if (exact) return exact;
    const target = label.trim().toLowerCase();
    const match = baseModules.find((m) => m.replace(/^Module\s+\d+\s+—\s+/i, "").trim().toLowerCase() === target);
    return match || null;
  };

  Object.entries(remote.modules).forEach(([rawModule, arr]) => {
    const targetModule = findModuleKey(rawModule);
    if (!targetModule) return;

    const existingInModule = result.filter((r) => r.module === targetModule);
    let nextIndex = existingInModule.length;

    arr.forEach((r) => {
      const t = (r.title || "").toLowerCase().trim();
      if (!t || existing.has(t)) return;

      result.push({
        ...r,
        module: targetModule,
        index: nextIndex++,
      });
      existing.add(t);
    });
  });

  return result;
}

export function extractPlaceholders(prompt: PromptItem): string[] {
  const text = buildFullPrompt(prompt);
  const regex = /\[(.*?)\]/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const content = match[1];
    if (content && !matches.includes(content)) {
      matches.push(content);
    }
  }
  return matches;
}

// Get helpful description and example for a placeholder
export function getPlaceholderHelp(placeholder: string): { description: string; example: string } {
  const lower = placeholder.toLowerCase();
  
  // Specific multi-option fields (buyer/seller/investor, etc.)
  if (lower === 'buyer/seller/investor') {
    return {
      description: "Pick ONE: Are you targeting buyers, sellers, or investors?",
      example: "buyers"
    };
  }
  
  if (lower === 'y') {
    return {
      description: "What's your maximum cost per lead? (just the number)",
      example: "50"
    };
  }
  
  if (lower === 'x') {
    return {
      description: "Enter a specific number or amount",
      example: "10"
    };
  }
  
  // Market/Location
  if (lower.includes('market') || lower.includes('city') || lower.includes('area') || lower.includes('neighborhood')) {
    return {
      description: "Your city or area (be specific - helps AI give local insights)",
      example: "Austin, TX"
    };
  }
  
  // Budget/Money
  if (lower.includes('$') || lower.includes('budget') || lower.includes('price') || lower.includes('cost')) {
    return {
      description: "Dollar amount (no need for $ symbol)",
      example: "5000"
    };
  }
  
  // Timeline/Date
  if (lower.includes('timeline') || lower.includes('date') || lower.includes('deadline') || lower.includes('day')) {
    return {
      description: "How much time? (e.g., 30 days, 90 days, 6 months)",
      example: "30 days"
    };
  }
  
  // Channel/Platform
  if (lower.includes('channel') || lower.includes('platform')) {
    return {
      description: "Which marketing channel? (pick ONE: Facebook Ads, Google Ads, Instagram, YouTube, Email, etc.)",
      example: "Facebook Ads"
    };
  }
  
  if (lower.includes('social')) {
    return {
      description: "Which social platform? (Instagram, Facebook, TikTok, LinkedIn, etc.)",
      example: "Instagram"
    };
  }
  
  // Niche/Type
  if (lower.includes('niche') || lower.includes('type') || lower.includes('persona')) {
    return {
      description: "Who specifically? (be narrow: luxury buyers, first-timers, downsizers, etc.)",
      example: "first-time buyers"
    };
  }
  
  // Buyer/Seller/Investor
  if (lower.includes('buyer') || lower.includes('seller') || lower.includes('investor')) {
    return {
      description: "Pick ONE: buyers, sellers, or investors",
      example: "buyers"
    };
  }
  
  // Strategy/Method
  if (lower.includes('strategy') || lower.includes('method') || lower.includes('approach')) {
    return {
      description: "What's your approach? (cold calling, door knocking, content, etc.)",
      example: "cold calling"
    };
  }
  
  // Goal/Target
  if (lower.includes('goal') || lower.includes('target') || lower.includes('objective')) {
    return {
      description: "What's the specific number you want to hit?",
      example: "50 leads per month"
    };
  }
  
  // Skill/Topic
  if (lower.includes('skill') || lower.includes('topic') || lower.includes('subject')) {
    return {
      description: "What skill or topic? (be specific)",
      example: "objection handling"
    };
  }
  
  // Number/Quantity
  if (lower.includes('#') || lower.includes('number') || lower.includes('count')) {
    return {
      description: "Just enter the number",
      example: "5"
    };
  }
  
  // Tool/Platform
  if (lower.includes('tool') || lower.includes('crm') || lower.includes('software')) {
    return {
      description: "Which tool/software? (the one you actually use)",
      example: "Follow Up Boss"
    };
  }
  
  // Property specific
  if (lower.includes('property') || lower.includes('listing') || lower.includes('home')) {
    return {
      description: "Property type/details (3bd/2ba, luxury condo, etc.)",
      example: "3bd/2ba single-family"
    };
  }
  
  // Scenario/Situation
  if (lower.includes('scenario') || lower.includes('situation') || lower.includes('case')) {
    return {
      description: "Describe the situation in plain English",
      example: "appraisal came in low"
    };
  }
  
  // URL/Link
  if (lower.includes('url') || lower.includes('link') || lower.includes('website')) {
    return {
      description: "Full website URL (include www or https)",
      example: "www.yoursite.com"
    };
  }
  
  // General fallback - extract the actual placeholder content and make it actionable
  const cleanPlaceholder = placeholder.replace(/[\[\]]/g, '').trim();
  
  return {
    description: `Enter your ${cleanPlaceholder} (be specific)`,
    example: cleanPlaceholder.split('/')[0].trim()
  };
}

// Simplify marketing jargon for real estate agents
export function simplifyJargon(text: string): string {
  return text
    .replace(/\bUTM\b/g, 'tracking link')
    .replace(/\bUTMs\b/g, 'tracking links')
    .replace(/\bKPI\b/g, 'goal metric')
    .replace(/\bKPIs\b/g, 'goal metrics')
    .replace(/\bCTA\b/g, 'call-to-action')
    .replace(/\bCTAs\b/g, 'calls-to-action')
    .replace(/\bCTR\b/g, 'click rate')
    .replace(/\bSEO\b/g, 'Google ranking')
    .replace(/\bGMB\b/g, 'Google Business Profile')
    .replace(/\bSOI\b/g, 'sphere of influence')
    .replace(/\bCRM\b/g, 'contact database')
    .replace(/\bSLA\b/g, 'response time')
    .replace(/\bSLAs\b/g, 'response times')
    .replace(/\bCSAT\b/g, 'satisfaction score')
    .replace(/\bCPL\b/g, 'cost per lead')
    .replace(/\bb-roll\b/g, 'extra footage');
}

export const applyReplacements = (text: string, values: Record<string, string>) => {
  if (!text) return text;
  return text.replace(/\[([^\[\]]+)\]/g, (match, key) => {
    const k = (key || "").trim();
    if (k in values && values[k] !== "") return values[k];
    return match;
  });
};
