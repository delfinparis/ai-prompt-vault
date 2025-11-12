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
    "- KPIs = [your specific goals - example: 50 leads/month, 15% conversion rate, $200 cost per lead]\n- Tools = [the actual tools you use - example: Follow Up Boss, Canva, Facebook Ads Manager]\n- Timeline/Budget = [X]\n- Constraints = [plain, compliant language]";
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
  
  // KPIs and Goals - super specific
  if (lower.includes('kpi') || lower === 'list' || lower.includes('your specific goals')) {
    return {
      description: "Your measurable goals - be specific with numbers and timeframes",
      example: "50 new leads per month, 15% conversion rate, $200 cost per lead, 3 closings per month"
    };
  }
  
  if (lower.includes('your goals') || lower.includes('goal metric')) {
    return {
      description: "What success looks like in numbers",
      example: "Close 25 transactions this year, build a database of 500 contacts, generate 10 referrals per quarter"
    };
  }
  
  // Tools - with real tool names
  if (lower.includes('tools') || lower.includes('the actual tools you use')) {
    return {
      description: "Name the specific software, platforms, or tools you actually use in your business",
      example: "Follow Up Boss, Canva, Facebook Ads Manager, Zillow Premier Agent, BombBomb video email"
    };
  }
  
  // Lists - context-specific examples
  if (lower === 'list') {
    return {
      description: "Your specific items - give real examples from your business",
      example: "50 leads per month, 15% conversion, $200 cost per lead, 3 closings monthly"
    };
  }
  
  // Specific multi-option fields (buyer/seller/investor, etc.)
  if (lower === 'buyer/seller/investor') {
    return {
      description: "Pick ONE: Are you targeting buyers, sellers, or investors?",
      example: "buyers"
    };
  }
  
  if (lower === 'y') {
    return {
      description: "Your maximum cost per lead (just the dollar amount, no $ sign needed)",
      example: "50"
    };
  }
  
  if (lower === 'x') {
    return {
      description: "Enter the specific number or amount",
      example: "10"
    };
  }
  
  // Market/Location - emphasize specificity
  if (lower.includes('market') || lower.includes('city') || lower.includes('area') || lower.includes('neighborhood')) {
    return {
      description: "Your specific city, neighborhood, or area - be as specific as possible so the AI understands your local market",
      example: "South Austin, TX (78704 zip)" 
    };
  }
  
  // Budget/Money - clear format
  if (lower.includes('$') || lower.includes('budget') || lower.includes('price') || lower.includes('cost')) {
    return {
      description: "Dollar amount (you can skip the $ symbol)",
      example: "5000"
    };
  }
  
  // Timeline/Date - with realistic realtor timeframes
  if (lower.includes('timeline') || lower.includes('date') || lower.includes('deadline') || lower.includes('day')) {
    return {
      description: "How long do you have? Use realistic timeframes for real estate",
      example: "30 days" 
    };
  }
  
  // Channel/Platform - specific options
  if (lower.includes('channel') || lower.includes('platform')) {
    return {
      description: "Which ONE marketing channel will you focus on? (pick your primary channel)",
      example: "Facebook Ads"
    };
  }
  
  if (lower.includes('social')) {
    return {
      description: "Which ONE social platform is your main focus?",
      example: "Instagram"
    };
  }
  
  // Niche/Type - encourage specificity
  if (lower.includes('niche') || lower.includes('type') || lower.includes('persona')) {
    return {
      description: "Get specific! The narrower your target, the better the AI's suggestions",
      example: "first-time homebuyers under 35 with $300k budget"
    };
  }
  
  // Buyer/Seller/Investor
  if (lower.includes('buyer') || lower.includes('seller') || lower.includes('investor')) {
    return {
      description: "Pick ONE: buyers, sellers, or investors (stay focused on one audience)",
      example: "buyers"
    };
  }
  
  // Strategy/Method - real prospecting methods
  if (lower.includes('strategy') || lower.includes('method') || lower.includes('approach')) {
    return {
      description: "What's your main lead generation or prospecting method?",
      example: "door knocking in my farm area"
    };
  }
  
  // Goal/Target - super concrete
  if (lower.includes('goal') || lower.includes('target') || lower.includes('objective')) {
    return {
      description: "Your specific, measurable target - include the number and timeframe",
      example: "50 qualified leads per month"
    };
  }
  
  // Skill/Topic - real skills
  if (lower.includes('skill') || lower.includes('topic') || lower.includes('subject')) {
    return {
      description: "What specific skill do you want to improve?",
      example: "handling price objections on listing appointments"
    };
  }
  
  // Number/Quantity
  if (lower.includes('#') || lower.includes('number') || lower.includes('count')) {
    return {
      description: "Just the number (no extra words)",
      example: "5"
    };
  }
  
  // Tool/Platform - CRM emphasis
  if (lower.includes('tool') || lower.includes('crm') || lower.includes('software')) {
    return {
      description: "Name the actual tool/software you use (or want to use)",
      example: "Follow Up Boss"
    };
  }
  
  // Property specific - realistic descriptions
  if (lower.includes('property') || lower.includes('listing') || lower.includes('home')) {
    return {
      description: "Describe the property type and key features",
      example: "3bd/2ba single-family home, 1,800 sqft, built 2015"
    };
  }
  
  // Scenario/Situation - real deal situations
  if (lower.includes('scenario') || lower.includes('situation') || lower.includes('case')) {
    return {
      description: "Describe the specific situation you're dealing with in plain English",
      example: "appraisal came in $15k low and seller won't budge on price"
    };
  }
  
  // URL/Link
  if (lower.includes('url') || lower.includes('link') || lower.includes('website')) {
    return {
      description: "Your full website URL (include https:// or www)",
      example: "www.yourrealtorsite.com"
    };
  }
  
  // General fallback - much improved with context
  const cleanPlaceholder = placeholder.replace(/[[\]]/g, '').trim();
  
  // Smart fallback based on common patterns
  if (cleanPlaceholder.length < 15) {
    return {
      description: `Describe your ${cleanPlaceholder} - be specific with real examples from your business`,
      example: cleanPlaceholder.includes('/') ? cleanPlaceholder.split('/')[0].trim() : `your ${cleanPlaceholder}`
    };
  }
  
  return {
    description: `${cleanPlaceholder} - use specific details from your actual business`,
    example: "Example: your specific situation or details"
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
  return text.replace(/\[([^[\]]+)\]/g, (match, key) => {
    const k = (key || "").trim();
    if (k in values && values[k] !== "") return values[k];
    return match;
  });
};
