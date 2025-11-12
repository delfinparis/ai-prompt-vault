"use client";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { prompts as fullPrompts } from "./prompts";

/* ---------- Types ---------- */
type PromptItem = {
  id: string;
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
  addedDate?: string; // ISO date string for "New" badge tracking
  tags?: string[]; // Tags for filtering (e.g., ["social media", "cold outreach"])
};

type RemotePrompt = Omit<PromptItem, "module" | "index" | "id">;
type RemotePayload = {
  version?: string;
  modules?: Record<string, RemotePrompt[]>;
};

/* ---------- Constants ---------- */

// same Apps Script URL you already use
const REMOTE_JSON_URL =
  "https://script.google.com/macros/s/AKfycbww3SrcmhMY8IMPiSmj7OdqM3cUSVtfU0LuyVtqF9mvdbQjhdoHXASfMhEg4cam577dRw/exec";

const KEY_REMOTE_CACHE = "rpv:remoteCache";
const KEY_REMOTE_VER = "rpv:remoteVersion";

// internal module titles used when attaching data
const MODULE_TITLES = [
  "Lead Generation & Marketing",
  "Operations & Time Management",
  "Goal Setting & Accountability",
  "Listing & Buyer Presentations",
  "Client Experience & Retention",
  "Finance & Profitability",
  "Negotiation & Deal Strategy",
  "Buyer Journey & Search Tools",
  "Sphere & Community Marketing",
  "Digital Ads & AI Tools",
  "Automation & Workflows",
  "Realtor Resources & Intelligence",
];

// strip "Module X —" for labels
const displayName = (m: string) => m.replace(/^Module\s+\d+\s+—\s+/i, "");

// Available tags for filtering
const AVAILABLE_TAGS = [
  "Social Media",
  "Cold Outreach",
  "Email",
  "Scripts",
  "Compliance",
  "Video",
  "Marketing",
  "Client Experience",
  "Lead Generation",
  "Automation",
  "Analysis",
  "Strategy",
];

/* ---------- ID Helpers ---------- */

const slugify = (s: string): string =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const shortHash = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  // convert to unsigned and base36 for compactness
  return (h >>> 0).toString(36).slice(0, 6);
};

const generatePromptId = (title: string, moduleName: string, index?: number): string => {
  const base = `${slugify(title || "untitled")}__${shortHash(displayName(moduleName))}`;
  // include index only if provided to reduce chance of collision in same module
  return typeof index === "number" ? `${base}-${index}` : base;
};

/* ---------- Challenge Cards for Problem-First UX ---------- */

type ChallengeCard = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  promptTitles: string[]; // Exact prompt titles to show
};

const CHALLENGE_CARDS: ChallengeCard[] = [
  {
    id: "need-leads",
    emoji: "🎯",
    title: "I need more leads",
    description: "Get more eyes on your business",
    promptTitles: [
      "Ad-Library Audit for RE Pros",
      "Local Market Authority Calendar",
      "Buyer Lead-Gen Funnel Planner",
      "SEO + Keyword Strategy for RE",
      "Community Partnership Outreach",
    ],
  },
  {
    id: "convert-leads",
    emoji: "💰",
    title: "Converting leads to appointments",
    description: "Turn prospects into meetings",
    promptTitles: [
      "First-Time Buyer Qual Call Script",
      "Seller Pre-List Consult Outline",
      "Buyer Consult Outline + Questionnaire",
      "Email Nurture Sequence Builder",
      "Phone Script: Cold Lead Reactivation",
    ],
  },
  {
    id: "follow-up",
    emoji: "📞",
    title: "Following up consistently",
    description: "Stay top of mind without being pushy",
    promptTitles: [
      "Touch-Point Tracker & Calendar",
      "CRM + Follow-Up Workflow Setup",
      "Recurring Email Template Set",
      "Text/SMS Campaign Sequence",
      "Voice-Drop & Voicemail Script Set",
    ],
  },
  {
    id: "social-media",
    emoji: "📱",
    title: "Standing out on social media",
    description: "Build authority and attract clients online",
    promptTitles: [
      "30-Day Content Calendar (IG/FB/TikTok)",
      "Viral Hook & Caption Templates",
      "Short-Form Video Script Pack",
      "Story Template Library (IG/FB)",
      "Post Performance Analyzer",
    ],
  },
  {
    id: "get-listings",
    emoji: "🏠",
    title: "Getting more listings",
    description: "Win seller appointments and contracts",
    promptTitles: [
      "Expired / FSBO Letter + Email Templates",
      "CMA Presentation Outline",
      "Listing Pitch Deck Builder",
      "Pre-List Package & Timeline",
      "Sphere-to-Listing Nurture System",
    ],
  },
  {
    id: "time-management",
    emoji: "⏰",
    title: "Managing my time better",
    description: "Work smarter, not harder",
    promptTitles: [
      "Weekly Sprint Planner (KPIs + Tasks)",
      "Time-Block Daily Schedule",
      "Delegation & VA Onboarding Checklist",
      "Meeting Audit & Optimization",
      "Energy Map & Peak Hours Planner",
    ],
  },
  {
    id: "automation",
    emoji: "💡",
    title: "Building systems & automation",
    description: "Leverage tech to scale",
    promptTitles: [
      "CRM + Follow-Up Workflow Setup",
      "Zapier / Make Automation Ideas",
      "AI Agent Setup (ChatGPT, Claude)",
      "Email/SMS Drip Campaign Builder",
      "SOP Template Library",
    ],
  },
  {
    id: "sphere",
    emoji: "🤝",
    title: "Nurturing my sphere",
    description: "Turn relationships into referrals",
    promptTitles: [
      "Sphere Event Ideas + Promotion Plan",
      "Quarterly Touch-Point Campaign",
      "Referral Ask Script + Email Templates",
      "Client Appreciation System",
      "Community Partnership Outreach",
    ],
  },
];

/* ---------- Challenge Diagnostics (Dev) ---------- */

type ChallengeDiagnostics = {
  challenges: Array<{
    id: string;
    title: string;
    totalDeclared: number;
    found: number;
    missing: string[];
    suggestions: Record<string, string[]>; // missing -> suggested matches
  }>;
  unusedPrompts: string[]; // prompts never referenced by any challenge card
};

// Basic Levenshtein distance for fuzzy suggestions
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp: number[] = Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = tmp;
    }
  }
  return dp[n];
}

function computeChallengeDiagnostics(allPrompts: PromptItem[]): ChallengeDiagnostics {
  const titleMap = new Map<string, PromptItem>();
  allPrompts.forEach(p => titleMap.set((p.title || "").toLowerCase().trim(), p));
  const referenced = new Set<string>();
  const challengesDiag = CHALLENGE_CARDS.map(c => {
    const missing: string[] = [];
    const suggestions: Record<string, string[]> = {};
    let foundCount = 0;
    c.promptTitles.forEach(t => {
      const key = t.toLowerCase().trim();
      if (titleMap.has(key)) {
        foundCount++; referenced.add(key);
      } else {
        missing.push(t);
        // build top 3 suggestions using distance & simple contains
        const candidates = allPrompts
          .map(p => p.title)
          .filter(Boolean) as string[];
        const scored = candidates.map(s => ({ s, d: levenshtein(t.toLowerCase(), s.toLowerCase()) }));
        scored.sort((a, b) => a.d - b.d);
        suggestions[t] = scored.slice(0, 3).map(x => x.s);
      }
    });
    return {
      id: c.id,
      title: c.title,
      totalDeclared: c.promptTitles.length,
      found: foundCount,
      missing,
      suggestions,
    };
  });
  // unused prompts (exclude those without titles just in case)
  const unusedPrompts = allPrompts
    .filter(p => p.title && !referenced.has(p.title.toLowerCase().trim()))
    .map(p => p.title);
  return { challenges: challengesDiag, unusedPrompts };
}

type DataHealth = {
  total: number;
  withTags: number;
  withAddedDate: number;
  modules: Array<{
    module: string;
    count: number;
    withTags: number;
    withAddedDate: number;
  }>;
};

function computeDataHealth(allPrompts: PromptItem[]): DataHealth {
  const total = allPrompts.length;
  let withTags = 0;
  let withAddedDate = 0;
  const byModule: Record<string, { count: number; withTags: number; withAddedDate: number }> = {};

  allPrompts.forEach((p) => {
    const hasTags = Array.isArray(p.tags) && p.tags.length > 0;
    const hasDate = !!p.addedDate;
    if (hasTags) withTags++;
    if (hasDate) withAddedDate++;

    const key = p.module;
    if (!byModule[key]) byModule[key] = { count: 0, withTags: 0, withAddedDate: 0 };
    byModule[key].count++;
    if (hasTags) byModule[key].withTags++;
    if (hasDate) byModule[key].withAddedDate++;
  });

  const modules = Object.entries(byModule)
    .map(([module, v]) => ({ module, ...v }))
    .sort((a, b) => a.module.localeCompare(b.module));

  return { total, withTags, withAddedDate, modules };
}

/* ---------- Tracking Hook ---------- */
const trackEvent = (name: string, data?: Record<string, any>) => {
  try {
    window.dispatchEvent(
      new CustomEvent("rpv_event", { detail: { name, ...data } })
    );
    // window.gtag?.("event", name, data);
    // window.fbq?.("trackCustom", name, data);
  } catch {
    // no-op if tracking not wired
  }
};

/* ---------- Category Card Meta ---------- */

type CategoryMeta = {
  id: number;
  moduleKey: string; // "Module X — Name"
  label: string;
  emoji: string;
  tagline: string;
};

const CATEGORY_CARDS: CategoryMeta[] = [
  {
    id: 1,
    moduleKey: `Module 1 — ${MODULE_TITLES[0]}`,
    label: "Get More Leads",
    emoji: "📣",
    tagline: "Prompts for ads, content, funnels, and campaigns.",
  },
  {
    id: 2,
    moduleKey: `Module 2 — ${MODULE_TITLES[1]}`,
    label: "Fix My Systems",
    emoji: "🧩",
    tagline: "Checklists, SOPs, and daily/weekly workflows.",
  },
  {
    id: 3,
    moduleKey: `Module 3 — ${MODULE_TITLES[2]}`,
    label: "Hit My Goals",
    emoji: "🎯",
    tagline: "Scorecards, habit templates, and sprints.",
  },
  {
    id: 4,
    moduleKey: `Module 4 — ${MODULE_TITLES[3]}`,
    label: "Win More Appointments",
    emoji: "📅",
    tagline: "Scripts and outlines for buyers and sellers.",
  },
  {
    id: 5,
    moduleKey: `Module 5 — ${MODULE_TITLES[4]}`,
    label: "Wow My Clients",
    emoji: "✨",
    tagline: "Onboarding, updates, and surprise & delight.",
  },
  {
    id: 6,
    moduleKey: `Module 6 — ${MODULE_TITLES[5]}`,
    label: "Boost My Profit",
    emoji: "💰",
    tagline: "Cashflow, budgets, and profitability audits.",
  },
  {
    id: 7,
    moduleKey: `Module 7 — ${MODULE_TITLES[6]}`,
    label: "Win More Deals",
    emoji: "🤝",
    tagline: "Negotiation playbooks and deal rescues.",
  },
  {
    id: 8,
    moduleKey: `Module 8 — ${MODULE_TITLES[7]}`,
    label: "Find Better Homes",
    emoji: "🏡",
    tagline: "Search strategies and buyer tools.",
  },
  {
    id: 9,
    moduleKey: `Module 9 — ${MODULE_TITLES[8]}`,
    label: "Nurture My Sphere",
    emoji: "🌱",
    tagline: "Touch plans, events, and local content.",
  },
  {
    id: 10,
    moduleKey: `Module 10 — ${MODULE_TITLES[9]}`,
    label: "Improve My Marketing",
    emoji: "📈",
    tagline: "Funnels, CRO, and AI-powered assets.",
  },
  {
    id: 11,
    moduleKey: `Module 11 — ${MODULE_TITLES[10]}`,
    label: "Automate My Business",
    emoji: "⚙️",
    tagline: "Lead routing, drips, and bots.",
  },
  {
    id: 12,
    moduleKey: `Module 12 — ${MODULE_TITLES[11]}`,
    label: "Level Up & Learn",
    emoji: "📚",
    tagline: "Curated learning and research prompts.",
  },
];

/* ---------- Data: attach module labels ---------- */

const attachModule = (
  moduleIndex: number,
  items: Array<Omit<PromptItem, "module" | "index" | "id"> & { id?: string }>
): PromptItem[] => {
  const moduleName = `Module ${moduleIndex} — ${MODULE_TITLES[moduleIndex - 1]}`;
  return items.map((p, i) => {
    const id = p.id || generatePromptId(p.title, moduleName, i);
    return {
      id,
      ...p,
      module: moduleName,
      index: i,
    } as PromptItem;
  });
};

/* ---------- Prompt Builder ---------- */

const buildFullPrompt = (p: PromptItem): string => {
  const moduleName = p.module || "Category";
  const title = p.title || "Prompt";
  const audience =
    p.audience || "[who this is for] in [your market/city]";
  const inputs =
    p.inputs ||
    [
      "- KPIs: list 2–3 measurable targets (e.g., 10 leads/week; CPL <$15)",
      "- Tools: list the tools you’ll use (e.g., Follow Up Boss, Zapier, Google Sheets)",
      "- Timeline/Budget: e.g., 90 days; $500/mo",
      "- Constraints: any rules/compliance limits (plain, fair-housing safe)"
    ].join("\n");
  const deliverable =
    p.deliverable ||
    "Bullet points plus one table with the key fields this prompt needs (we’ll propose columns).";
  const constraints =
    p.constraints || "Under 400 words. Use clear headings. No guarantees. Fair-housing safe.";
  const quality =
    (p as any).quality ||
    "Include ‘Why this works’ and ask 2–3 clarifying questions. Propose 2 ways to improve v1.";
  const success =
    p.success ||
    "State success in numbers (e.g., response rate %, time saved, appointments set).";
  const tools =
    p.tools || "Use Google Workspace, your CRM, Make/Zapier, Notion, Canva where helpful.";
  const iterate =
    p.iterate || "End by asking 2–3 questions and suggest a simple path to a v2 draft.";
  const risk =
    p.risk ||
    "Risk check: claims must be verifiable; avoid protected‑class targeting; keep language compliant.";

  return `Role & Outcome
Act as a ${p.role || "top 1% real‑estate coach"}. Create: “${title}” for ${audience} in ${moduleName}.

Audience & Output
Primary user: ${audience}. Output format: ${p.format || "bulleted brief + 1 table"}.

Facts / Inputs (fill these in)
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

/* ---------- Personalization Helper ---------- */

const extractTokens = (text: string): string[] => {
  const out = new Set<string>();
  const re = /\[([^\[\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const token = (m[1] || "").trim();
    if (token) out.add(token);
  }
  return Array.from(out);
};

const explainToken = (token: string): string => {
  const raw = token.trim();
  const t = raw.toLowerCase();

  // Locations
  if (t === "market" || t === "city" || t === "area" || t.includes("market/city") || t.includes("city/county") || t.includes("neighborhood") || t.includes("submarket") || t.includes("county")) {
    return "Your location (e.g., ‘Austin, TX’, ‘West Loop, Chicago’, or ‘Orange County, CA’).";
  }

  // Audience / niche / persona
  if (t.includes("buyer/seller") || t.includes("buyer / seller") || t.includes("investor") || t.includes("niche")) {
    return "Choose the audience or niche (e.g., ‘first‑time buyers’, ‘move‑up sellers’, ‘small multi‑fam investors’).";
  }
  if (t.includes("persona") || t.includes("profile")) {
    return "Brief client description (e.g., ‘young family relocating’, ‘VA buyer, 10% down’).";
  }

  // Channels & sources
  if (t === "channel" || t.includes("channel")) {
    return "Marketing channel (e.g., Instagram Reels, YouTube, Google Ads, Email).";
  }
  if (t.includes("source")) {
    return "Lead source (e.g., ‘Zillow’, ‘Open House’, ‘Website form’, ‘Facebook Ads’).";
  }

  // Numbers, money, ranges
  if (raw.startsWith("$") || t === "$x" || t === "$y") {
    return "Dollar amount (e.g., ‘$500’, ‘$2,000/mo’, ‘$15 CPL’).";
  }
  if (t === "#" || raw.includes("#")) {
    return "A number/count (e.g., ‘3’, ‘10’, ‘25’).";
  }
  if (t === "x" || t === "y") {
    return "A number, date, or percent that fits the line (e.g., ‘90 days’, ‘20%’, ‘T+14’).";
  }
  if (/[xy]\s*–\s*[xy]/i.test(t) || t.includes("–")) {
    return "A range (usually minutes, %, or count), e.g., ‘15–30’.";
  }

  // Tools / tech
  if (t === "tools" || t === "tool" || t.includes("tools")) {
    return "List the tools you use (e.g., ‘Follow Up Boss, Zapier, Google Sheets, Notion’).";
  }

  // Criteria / search
  if (t.includes("criteria")) {
    return "Buyer search criteria (price, beds, baths, area, features).";
  }

  // Compliance / organization
  if (t.includes("state/brokerage")) {
    return "Your state or brokerage context for compliance (e.g., ‘Texas’, ‘Keller Williams’).";
  }

  // Financing
  if (t.includes("credit/income")) {
    return "Borrower profile (e.g., ‘720 FICO, W‑2, 10% down’, ‘Self‑employed, 2 yrs’).";
  }

  // Links / pages
  if (t === "url" || t === "page") {
    return "Paste the web page URL (e.g., ‘https://yourdomain.com/landing’).";
  }

  // Event themes
  if (t.includes("season/theme") || t.includes("theme")) {
    return "Event theme/season (e.g., ‘Summer BBQ’, ‘Holiday Toy Drive’).";
  }

  // List helper
  if (t.includes("list")) {
    return "Paste a short list with a clear structure (e.g., 10–25 items: ‘First Last — role — phone/email’ or ‘Neighborhood — avg price — turnover’).";
  }
  // Default fallback
  return "Replace with your details. If it looks like a place, use your city/area; if it looks numeric, use a realistic number or $ amount.";
};

const isNewPrompt = (prompt: PromptItem): boolean => {
  if (!prompt.addedDate) return false;
  const added = new Date(prompt.addedDate);
  const now = new Date();
  const daysDiff = (now.getTime() - added.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff >= 0 && daysDiff <= 7;
};

/* ---------- Personalization Clarity Simulation (Dev) ---------- */

type Persona = {
  city: string;
  area: string;
  state: string;
  niche: string; // audience
  channel: string;
  source: string;
  budgetMonthly: number;
  priceMin: number;
  priceMax: number;
  beds: number;
  baths: number;
  brokerage: string;
  tools: string[];
  credit: string; // e.g., '720 FICO, W-2, 10% down'
  url: string;
  theme: string;
};

type TokenKind =
  | 'market' | 'audience' | 'channel' | 'source' | 'currency' | 'number' | 'range' | 'tools'
  | 'criteria' | 'compliance' | 'financing' | 'url' | 'theme' | 'list_generic' | 'unknown';

const rand = (n: number) => Math.floor(Math.random() * n);
const choice = <T,>(arr: T[]): T => arr[rand(arr.length)];

const SAMPLE_CITIES = [
  'Austin, TX','Tampa, FL','Phoenix, AZ','Boise, ID','Nashville, TN','Denver, CO','Seattle, WA','Raleigh, NC','Charlotte, NC','San Diego, CA'
];
const SAMPLE_AREAS = ['Downtown','Suburbs','West Loop','South End','Old Town','Northwest','Eastside'];
const SAMPLE_STATES = ['TX','FL','AZ','ID','TN','CO','WA','NC','CA'];
const SAMPLE_NICHES = ['First-time buyers','Move-up sellers','Investors','Relocating families','VA buyers','Luxury sellers','Downsizers'];
const SAMPLE_CHANNELS = ['Instagram Reels','YouTube','Google Ads','Email','TikTok','Open House'];
const SAMPLE_SOURCES = ['Zillow','Website form','Open House','Referral','Facebook Ads'];
const SAMPLE_BROKERAGES = ['Keller Williams','eXp Realty','Compass','Coldwell Banker','RE/MAX'];
const SAMPLE_TOOLS = ['Follow Up Boss','Zapier','Google Sheets','Notion','Mailchimp','Canva'];
const SAMPLE_THEMES = ['Summer BBQ','Back-to-School','Holiday Toy Drive','Spring Clean-Up','Fall Festival'];

const generatePersona = (): Persona => {
  const city = choice(SAMPLE_CITIES);
  return {
    city,
    area: choice(SAMPLE_AREAS),
    state: choice(SAMPLE_STATES),
    niche: choice(SAMPLE_NICHES),
    channel: choice(SAMPLE_CHANNELS),
    source: choice(SAMPLE_SOURCES),
    budgetMonthly: 250 + rand(1250),
    priceMin: 200000 + rand(400000),
    priceMax: 600000 + rand(700000),
    beds: 2 + rand(3),
    baths: 1 + rand(2),
    brokerage: choice(SAMPLE_BROKERAGES),
    tools: Array.from({ length: 3 }, () => choice(SAMPLE_TOOLS)),
    credit: choice(['720 FICO, W-2, 10% down','680 FICO, self-employed, 20% down','750 FICO, VA loan']),
    url: 'https://example.com/'.concat(String(rand(9999))),
    theme: choice(SAMPLE_THEMES),
  };
};

const classifyToken = (token: string): TokenKind => {
  const raw = token.trim();
  const t = raw.toLowerCase();
  if (t === 'market' || t === 'city' || t === 'area' || t.includes('market/city') || t.includes('neighborhood') || t.includes('county')) return 'market';
  if (t.includes('buyer/seller') || t.includes('investor') || t.includes('niche') || t.includes('audience')) return 'audience';
  if (t === 'channel' || t.includes('channel')) return 'channel';
  if (t.includes('source')) return 'source';
  if (raw.startsWith('$') || t === '$x' || t === '$y') return 'currency';
  if (t === '#' || /\bcount\b/.test(t) || /\bnumber\b/.test(t)) return 'number';
  if (t === 'x' || t === 'y') return 'number';
  if (/[xy]\s*–\s*[xy]/i.test(t) || t.includes('–')) return 'range';
  if (t === 'tools' || t.includes('tools')) return 'tools';
  if (t.includes('criteria')) return 'criteria';
  if (t.includes('state/brokerage')) return 'compliance';
  if (t.includes('credit/income')) return 'financing';
  if (t === 'url' || t === 'page' || t.includes('link')) return 'url';
  if (t.includes('theme')) return 'theme';
  if (t.includes('list')) return 'list_generic';
  return 'unknown';
};

const resolveToken = (kind: TokenKind, persona: Persona): string | null => {
  switch (kind) {
    case 'market': return persona.city;
    case 'audience': return persona.niche;
    case 'channel': return persona.channel;
    case 'source': return persona.source;
    case 'currency': return `$${persona.budgetMonthly}`;
    case 'number': return String(3 + rand(7));
    case 'range': return `${10 + rand(10)}–${20 + rand(20)}`;
    case 'tools': return Array.from(new Set(persona.tools)).join(', ');
    case 'criteria': return `$${persona.priceMin.toLocaleString()}–$${persona.priceMax.toLocaleString()}, ${persona.beds}+ beds, ${persona.baths}+ baths, ${persona.area}`;
    case 'compliance': return `${persona.state} / ${persona.brokerage}`;
    case 'financing': return persona.credit;
    case 'url': return persona.url;
    case 'theme': return persona.theme;
    case 'list_generic': return null;
    case 'unknown': return null;
  }
};

type ClarityRow = {
  token: string;
  kind: TokenKind;
  promptsWithToken: number;
  unresolvedRate: number; // 0..1
  explanation: string;
  sampleValue?: string;
  suggestion: string;
};

const suggestRewrite = (token: string, kind: TokenKind): string => {
  if (kind === 'list_generic') {
    return 'Paste a short list with a clear structure (e.g., 10–25 items: “First Last — role — phone/email” or “Neighborhood — avg price — turnover”).';
  }
  if (kind === 'unknown') {
    return 'Make the placeholder specific (who/what/format). Example: “[city, state]”, “$ monthly budget”, or “URL to landing page”.';
  }
  const map: Partial<Record<TokenKind, string>> = {
    market: 'Use “City, ST” (e.g., Austin, TX).',
    audience: 'Name the audience/niche (e.g., first‑time buyers).',
    channel: 'Pick one channel (e.g., Instagram Reels).',
    source: 'Lead source (e.g., Open House, Zillow).',
    currency: 'Enter a $ amount (e.g., $500/mo).',
    number: 'Enter a number (e.g., 3, 10, 25).',
    range: 'Enter a range like “15–30”.',
    tools: 'List tools separated by commas (e.g., FUB, Zapier, Sheets).',
    criteria: 'Price range + beds/baths + area.',
    compliance: 'Your state / brokerage name.',
    financing: 'Credit/income snapshot (e.g., 720 FICO, W‑2, 10% down).',
    url: 'Paste a full URL (https://…).',
    theme: 'Event theme/season (e.g., Summer BBQ).',
  };
  return map[kind] || 'Make the placeholder concrete with who/what/format.';
};

function computePersonalizationClarity(allPrompts: PromptItem[], N = 1000): ClarityRow[] {
  const tokensPerPrompt: Record<string, Set<string>> = {};
  allPrompts.forEach((p) => {
    const toks = extractTokens(buildFullPrompt(p));
    tokensPerPrompt[p.id] = new Set(toks);
  });
  const tokenSet = new Set<string>();
  Object.values(tokensPerPrompt).forEach(s => s.forEach(t => tokenSet.add(t)));

  const personas = Array.from({ length: N }, generatePersona);

  const rows: ClarityRow[] = [];
  tokenSet.forEach((tok) => {
    const kind = classifyToken(tok);
    const explanation = explainToken(tok);
    const promptsWithToken = Object.values(tokensPerPrompt).filter(s => s.has(tok)).length;
    let unresolved = 0;
    let sample: string | undefined = undefined;
    for (let i = 0; i < personas.length; i++) {
      const val = resolveToken(kind, personas[i]);
      if (!val) unresolved++;
      else if (!sample) sample = val;
    }
    const unresolvedRate = personas.length ? unresolved / personas.length : 0;
    rows.push({ token: tok, kind, promptsWithToken, unresolvedRate, explanation, sampleValue: sample, suggestion: suggestRewrite(tok, kind) });
  });
  rows.sort((a, b) => b.unresolvedRate - a.unresolvedRate || b.promptsWithToken - a.promptsWithToken);
  return rows;
}

/* ---------- Merge Remote Prompts ---------- */

function mergeRemote(base: PromptItem[], remote: RemotePayload): PromptItem[] {
  if (!remote?.modules) return base;

  const result = [...base];
  const existing = new Set(
    base.map((b) => (b.title || "").toLowerCase().trim())
  );

  const baseModules = Array.from(new Set(base.map((b) => b.module)));

  const findModuleKey = (label: string): string | null => {
    // try exact
    const exact = baseModules.find((m) => m === label);
    if (exact) return exact;

    const target = label.trim().toLowerCase();
    // try by displayName
    const match = baseModules.find(
      (m) => displayName(m).trim().toLowerCase() === target
    );
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

      const idx = nextIndex++;
      const id = (r as any).id || generatePromptId(r.title, targetModule, idx);
      result.push({
        id,
        ...(r as any),
        module: targetModule,
        index: idx,
      } as PromptItem);
      existing.add(t);
    });
  });

  return result;
}

/* ---------- Main Component ---------- */

export default function AIPromptVault() {
  const [data, setData] = useState<PromptItem[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTips, setShowTips] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("rpv:showTips");
      if (v === "false") return false;
      if (v === "true") return true;
    } catch {}
    return true; // default on
  });
  const [showFillModal, setShowFillModal] = useState(false);
  const [fillTokens, setFillTokens] = useState<string[]>([]);
  const [fillValues, setFillValues] = useState<Record<string, string>>({});
  const [saveDefaults, setSaveDefaults] = useState(true);
  const [tokenValues, setTokenValues] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem("rpv:tokenVals");
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });
  const [showImportArea, setShowImportArea] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string>("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const rawIds = localStorage.getItem("rpv:favoritesIds");
      return rawIds ? new Set(JSON.parse(rawIds) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });
  const [recentPrompts, setRecentPrompts] = useState<Array<{id: string; timestamp: number}>>(() => {
    try {
      const rawIds = localStorage.getItem("rpv:recentIds");
      return rawIds ? JSON.parse(rawIds) : [];
    } catch {
      return [];
    }
  });
  const [viewMode, setViewMode] = useState<"browse" | "library">("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [copyCount, setCopyCount] = useState<Record<string, number>>(() => {
    try {
      const rawIds = localStorage.getItem("rpv:copyCountIds");
      return rawIds ? JSON.parse(rawIds) : {};
    } catch {
      return {};
    }
  });

  const [visibleSearchResults, setVisibleSearchResults] = useState(20);
  const [visibleFavorites, setVisibleFavorites] = useState(20);
  const [visibleRecent, setVisibleRecent] = useState(20);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Challenge-based onboarding
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(() => {
    try {
      const hasUsed = localStorage.getItem("rpv:hasUsedVault");
      return !hasUsed;
    } catch {
      return true;
    }
  });
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [showOnboardingTip, setShowOnboardingTip] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  // Command palette & shortcuts
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const paletteInputRef = useRef<HTMLInputElement>(null);
  // Personalization clarity results
  const [clarityRows, setClarityRows] = useState<ClarityRow[] | null>(null);
  const [clarityRunning, setClarityRunning] = useState(false);

  // Keyboard shortcuts: Dev panel, palette, favorites/library, diagnostics, focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Alt+D (legacy dev toggle)
      if (e.altKey && e.key.toLowerCase() === 'd') {
        setShowDevPanel(prev => !prev);
        trackEvent('dev_panel_toggled', { open: !showDevPanel });
      }
      // Cmd+K → open command palette
      if (e.metaKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowPalette(true);
        setPaletteQuery("");
        setTimeout(() => paletteInputRef.current?.focus(), 10);
        trackEvent('palette_opened', {});
      }
      // Cmd+Shift+F → open Library (favorites & recent)
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setViewMode('library');
        trackEvent('shortcut_favorites', {});
      }
      // Cmd+Shift+D → toggle diagnostics
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setShowDevPanel(prev => !prev);
        trackEvent('shortcut_diagnostics', { open: !showDevPanel });
      }
      // Cmd+P → focus search input
      if (e.metaKey && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        searchInputRef.current?.focus();
        trackEvent('shortcut_focus_search', {});
      }
      // Escape → close palette
      if (showPalette && e.key === 'Escape') {
        setShowPalette(false);
        trackEvent('palette_closed', { via: 'escape' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showDevPanel, showPalette]);

  const diagnostics = useMemo(() => computeChallengeDiagnostics(data), [data]);
  const dataHealth = useMemo(() => computeDataHealth(data), [data]);

  const runClaritySim = useCallback(() => {
    setClarityRunning(true);
    // yield to UI; compute next tick
    setTimeout(() => {
      const rows = computePersonalizationClarity(data, 1000);
      setClarityRows(rows);
      setClarityRunning(false);
      trackEvent('clarity_sim_ran', { tokens: rows.length, topConfusion: rows[0]?.token });
    }, 0);
  }, [data]);

  // preload base + remote
  useEffect(() => {
    const baseArr: PromptItem[] = fullPrompts.flatMap((m, i) =>
      attachModule(i + 1, m)
    );
    setData(baseArr);

    (async () => {
      try {
        // apply cached remote if present
        const cachedStr = localStorage.getItem(KEY_REMOTE_CACHE);
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr) as RemotePayload;
            const merged = mergeRemote(baseArr, cached);
            setData(merged);
          } catch {
            // ignore cache parse errors
          }
        }

        // fetch fresh
        const res = await fetch(REMOTE_JSON_URL, { cache: "no-store" });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const remote = (await res.json()) as RemotePayload;
        const ver = remote.version || "";
        const oldVer = localStorage.getItem(KEY_REMOTE_VER);

        if (!oldVer || oldVer !== ver) {
          const merged = mergeRemote(baseArr, remote);
          setData(merged);
          localStorage.setItem(KEY_REMOTE_CACHE, JSON.stringify(remote));
          localStorage.setItem(KEY_REMOTE_VER, ver);
        }
      } catch (e) {
        console.warn("Remote prompts not loaded:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // One-time migration from title-based storage to id-based storage
  useEffect(() => {
    if (loading || data.length === 0) return;
    try {
      const migrated = localStorage.getItem('rpv:migratedIds');
      if (!migrated) {
        const titleToId: Record<string, string> = {};
        data.forEach(p => { titleToId[p.title.toLowerCase().trim()] = p.id; });

        // favorites
        const legacyFavRaw = localStorage.getItem('rpv:favorites');
        if (legacyFavRaw) {
          const favTitles: string[] = JSON.parse(legacyFavRaw);
          const favIds = favTitles.map(t => titleToId[t.toLowerCase().trim()]).filter(Boolean);
          localStorage.setItem('rpv:favoritesIds', JSON.stringify(favIds));
          setFavorites(new Set(favIds));
        }

        // recent
        const legacyRecentRaw = localStorage.getItem('rpv:recent');
        if (legacyRecentRaw) {
          const legacyRecent: Array<{title: string; module: string; timestamp: number}> = JSON.parse(legacyRecentRaw);
          const recentIds = legacyRecent.map(r => ({ id: titleToId[r.title.toLowerCase().trim()], timestamp: r.timestamp })).filter(r => !!r.id);
          localStorage.setItem('rpv:recentIds', JSON.stringify(recentIds));
          setRecentPrompts(recentIds);
        }

        // copyCount
        const legacyCopyRaw = localStorage.getItem('rpv:copyCount');
        if (legacyCopyRaw) {
          const legacyCopy: Record<string, number> = JSON.parse(legacyCopyRaw);
            const newMap: Record<string, number> = {};
            Object.entries(legacyCopy).forEach(([title, cnt]) => {
              const id = titleToId[title.toLowerCase().trim()];
              if (id) newMap[id] = cnt;
            });
            localStorage.setItem('rpv:copyCountIds', JSON.stringify(newMap));
            setCopyCount(newMap);
        }

        localStorage.setItem('rpv:migratedIds', 'true');
      } else {
        // ensure state hydrated from id stores if available
        const favIdsRaw = localStorage.getItem('rpv:favoritesIds');
        if (favIdsRaw) setFavorites(new Set(JSON.parse(favIdsRaw)));
        const recentIdsRaw = localStorage.getItem('rpv:recentIds');
        if (recentIdsRaw) setRecentPrompts(JSON.parse(recentIdsRaw));
        const copyIdsRaw = localStorage.getItem('rpv:copyCountIds');
        if (copyIdsRaw) setCopyCount(JSON.parse(copyIdsRaw));
      }
    } catch (e) {
      console.warn('ID migration failed', e);
    }
  }, [loading, data]);

  const promptsForSelected = selectedModule
    ? data.filter((d) => d.module === selectedModule)
    : [];

  const filteredData = searchQuery.trim() || selectedTags.length > 0
    ? data.filter((p) => {
        // Search filter
        const q = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery.trim() || (
          (p.title || "").toLowerCase().includes(q) ||
          (p.quick || "").toLowerCase().includes(q) ||
          (p.role || "").toLowerCase().includes(q) ||
          (p.module || "").toLowerCase().includes(q)
        );
        
        // Tag filter (match all selected tags)
        const matchesTags = selectedTags.length === 0 || 
          selectedTags.every(tag => p.tags?.includes(tag));
        
        return matchesSearch && matchesTags;
      })
    : data;

  const currentPrompt =
    selectedModule != null && selectedIndex != null
      ? data.find(
          (d) => d.module === selectedModule && d.index === selectedIndex
        ) || null
      : null;

  const handleCopy = async () => {
    if (!currentPrompt) return;
    const txt = buildFullPrompt(currentPrompt);

    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }

    setCopied(true);
    trackEvent("prompt_copied", {
      title: currentPrompt.title,
      module: currentPrompt.module,
    });
    addToRecent(currentPrompt);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleCopyText = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    if (currentPrompt) {
      addToRecent(currentPrompt);
    }
    setTimeout(() => setCopied(false), 1200);
  };

  const addToRecent = (prompt: PromptItem) => {
    const entry = { id: prompt.id, timestamp: Date.now() };
    setRecentPrompts((prev) => {
      const filtered = prev.filter((p) => p.id !== entry.id);
      const updated = [entry, ...filtered].slice(0, 10); // keep last 10
      try { localStorage.setItem("rpv:recentIds", JSON.stringify(updated)); } catch {}
      return updated;
    });
    // Track copy count
    setCopyCount((prev) => {
      const next = { ...prev, [entry.id]: (prev[entry.id] || 0) + 1 };
      try { localStorage.setItem("rpv:copyCountIds", JSON.stringify(next)); } catch {}
      return next;
    });
    
    // Mark user as having used the vault
    if (isFirstTimeUser) {
      try { 
        localStorage.setItem("rpv:hasUsedVault", "true"); 
        setIsFirstTimeUser(false);
        // Show onboarding tip after first copy
        if (Object.keys(tokenValues).length === 0) {
          setShowOnboardingTip(true);
          setTimeout(() => setShowOnboardingTip(false), 8000);
        }
      } catch {}
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try { localStorage.setItem("rpv:favoritesIds", JSON.stringify(Array.from(next))); } catch {}
      trackEvent("favorite_toggled", { id, isFavorite: next.has(id) });
      return next;
    });
  };

  const replaceTokensInText = (text: string, values: Record<string, string>) => {
    return text.replace(/\[([^\[\]]+)\]/g, (m, g1) => {
      const key = (g1 || "").trim();
      const val = values[key];
      return typeof val === "string" && val.length ? val : m;
    });
  };

  const canPersonalizeWithSaved = (text: string): boolean => {
    const toks = extractTokens(text);
    return toks.some((t) => (tokenValues[t] || "").length > 0);
  };

  const getSuggestedValue = (token: string): string => {
    const t = token.trim().toLowerCase();
    // If this token already has a saved value, use it
    if (tokenValues[token]) return tokenValues[token];
    // Auto-suggest logic for market/city
    const marketKeys = Object.keys(tokenValues).filter((k) => {
      const kl = k.toLowerCase();
      return kl === "market" || kl === "city" || kl === "area" || kl.includes("market") || kl.includes("city");
    });
    if ((t === "market" || t === "city" || t === "area" || t.includes("market") || t.includes("city")) && marketKeys.length > 0) {
      return tokenValues[marketKeys[0]] || "";
    }
    return "";
  };

  // Get prompts for a specific challenge
  const getPromptsForChallenge = (challengeId: string): PromptItem[] => {
    const challenge = CHALLENGE_CARDS.find(c => c.id === challengeId);
    if (!challenge) return [];
    return data.filter(p => challenge.promptTitles.includes(p.title));
  };

  // Get recommended prompts based on usage patterns
  const getRecommendedPrompts = (): PromptItem[] => {
    if (Object.keys(copyCount).length === 0) return [];
    
    // Find most-copied module
    const moduleCounts: Record<string, number> = {};
    Object.entries(copyCount).forEach(([id, count]) => {
      const prompt = data.find(p => p.id === id);
      if (prompt) {
        moduleCounts[prompt.module] = (moduleCounts[prompt.module] || 0) + count;
      }
    });
    
    const topModule = Object.entries(moduleCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    if (!topModule) return [];
    
    // Return prompts from that module that user hasn't copied yet
    return data
      .filter(p => p.module === topModule && !copyCount[p.id])
      .slice(0, 5);
  };

  const getLastUsedPrompt = (): PromptItem | null => {
    if (recentPrompts.length === 0) return null;
    const recent = recentPrompts[0];
    return data.find(p => p.id === recent.id) || null;
  };

  // Command Palette: commands and filtering
  type CommandItem = { id: string; title: string; run: () => void; subtitle?: string };
  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      { id: 'focus_search', title: 'Focus Search', run: () => { searchInputRef.current?.focus(); setShowPalette(false); trackEvent('cmd_focus_search', {}); }, subtitle: 'Cmd+P' },
      { id: 'toggle_diagnostics', title: showDevPanel ? 'Hide Diagnostics' : 'Show Diagnostics', run: () => { setShowDevPanel(p => !p); setShowPalette(false); trackEvent('cmd_toggle_diagnostics', { open: !showDevPanel }); }, subtitle: 'Cmd+Shift+D' },
      { id: 'open_library', title: 'Open Library (Favorites & Recent)', run: () => { setViewMode('library'); setShowPalette(false); trackEvent('cmd_open_library', {}); }, subtitle: 'Cmd+Shift+F' },
      { id: 'browse_all', title: 'Browse All Prompts', run: () => { setViewMode('browse'); setSelectedModule(''); setShowPalette(false); trackEvent('cmd_browse_all', {}); } },
    ];
    if (currentPrompt) {
      items.push(
        { id: 'copy_long_prompt', title: 'Copy Current Prompt', run: () => { handleCopy(); setShowPalette(false); trackEvent('cmd_copy_prompt', { id: currentPrompt.id }); } },
        { id: 'copy_personalized', title: 'Copy Personalized (if filled)', run: () => { const txt = buildFullPrompt(currentPrompt); if (canPersonalizeWithSaved(txt)) { const personalized = replaceTokensInText(txt, tokenValues); handleCopyText(personalized); } setShowPalette(false); trackEvent('cmd_copy_personalized', { id: currentPrompt.id }); } },
        { id: 'toggle_favorite_current', title: favorites.has(currentPrompt.id) ? 'Unfavorite Current Prompt' : 'Favorite Current Prompt', run: () => { toggleFavorite(currentPrompt.id); setShowPalette(false); trackEvent('cmd_toggle_favorite_current', { id: currentPrompt.id }); } }
      );
    }
    if (recentPrompts.length > 0) {
      const recent = recentPrompts[0];
      items.push({ id: 'open_last_prompt', title: 'Open Most Recent Prompt', run: () => {
        const p = data.find(pp => pp.id === recent.id); if (p) { setSelectedModule(p.module); setSelectedIndex(p.index); setViewMode('browse'); } setShowPalette(false); trackEvent('cmd_open_recent', { id: recent.id }); }, subtitle: new Date(recent.timestamp).toLocaleString() });
    }
    items.push(
      { id: 'clear_search', title: 'Clear Search & Filters', run: () => { setSearchQuery(''); setSelectedTags([]); setShowPalette(false); trackEvent('cmd_clear_search', {}); } },
      { id: 'open_quick_fill', title: 'Open Quick Fill', run: () => { const txt = currentPrompt ? buildFullPrompt(currentPrompt) : ''; const toks = txt ? extractTokens(txt) : []; setFillTokens(toks); setFillValues(toks.reduce((acc, t) => { acc[t] = tokenValues[t] || getSuggestedValue(t) || ''; return acc; }, {} as Record<string,string>)); setShowFillModal(true); setShowPalette(false); trackEvent('cmd_open_quick_fill', {}); } }
    );
    return items;
  }, [currentPrompt, favorites, recentPrompts, showDevPanel, searchQuery, selectedTags, data, tokenValues]);

  const filteredCommands = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(c => c.title.toLowerCase().includes(q) || (c.subtitle || '').toLowerCase().includes(q));
  }, [paletteQuery, commands]);

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        padding: "32px 20px 40px",
        fontFamily:
          "system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial,sans-serif",
        background: "linear-gradient(#f9fafb, #ffffff)",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#020617",
            marginBottom: 6,
          }}
        >
          AI Prompt Vault for Real Estate Agents
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", maxWidth: 620 }}>
          Pick a category below and grab a ready-made prompt for your next
          marketing, systems, or client problem.
        </div>
        <div style={{ marginTop: 14 }}>
          <input
            type="text"
            value={searchQuery}
            ref={searchInputRef}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                setViewMode("browse");
                setSelectedModule("");
              }
            }}
            placeholder="Search prompts by keyword, role, or module..."
            style={{
              width: "100%",
              maxWidth: 500,
              height: 42,
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              padding: "0 18px",
              fontSize: 14,
              background: "#ffffff",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#2563eb";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={() => setViewMode("browse")}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: viewMode === "browse" ? "1px solid #2563eb" : "1px solid #e5e7eb",
              background: viewMode === "browse" ? "#eef2ff" : "#ffffff",
              color: viewMode === "browse" ? "#1e40af" : "#64748b",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Browse All
          </button>
          <button
            onClick={() => setViewMode("library")}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: viewMode === "library" ? "1px solid #2563eb" : "1px solid #e5e7eb",
              background: viewMode === "library" ? "#eef2ff" : "#ffffff",
              color: viewMode === "library" ? "#1e40af" : "#64748b",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            My Library {(() => {
              const uniqueIds = new Set<string>([...Array.from(favorites), ...recentPrompts.map(r => r.id)]);
              return uniqueIds.size > 0 ? `(${uniqueIds.size})` : "";
            })()}
          </button>
        </div>
      </header>

      {/* Developer Diagnostics Panel (Alt + D) */}
      {showDevPanel && (
        <div style={{
          marginBottom: 28,
          padding: 18,
          border: '1px solid #e5e7eb',
          background: '#f8fafc',
          borderRadius: 14,
          fontSize: 12,
          lineHeight: 1.5,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>🔍 Challenge Mapping Diagnostics</div>
            <button
              onClick={() => setShowDevPanel(false)}
              style={{
                border: '1px solid #e5e7eb',
                background: '#ffffff',
                color: '#64748b',
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 999,
                cursor: 'pointer'
              }}
            >Close</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {diagnostics.challenges.map(c => (
              <div key={c.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: c.missing.length ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                    {c.found}/{c.totalDeclared} matched {c.missing.length ? `(missing ${c.missing.length})` : '✓'}
                  </div>
                </div>
                {c.missing.length > 0 && (
                  <div style={{ fontSize: 11, color: '#334155' }}>
                    Missing:
                    <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                      {c.missing.map(m => (
                        <li key={m} style={{ marginBottom: 2 }}>
                          <span style={{ color: '#dc2626' }}>{m}</span>
                          {c.suggestions[m]?.length ? (
                            <span style={{ color: '#64748b' }}> → try: {c.suggestions[m].join(' · ')}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Personalization Clarity */}
          <div style={{ marginTop: 18, padding: 14, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>🧩 Personalization Clarity</div>
              <button
                onClick={runClaritySim}
                disabled={clarityRunning}
                style={{
                  fontSize: 11,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid #e5e7eb',
                  background: clarityRunning ? '#e5e7eb' : '#0f172a',
                  color: '#ffffff',
                  cursor: clarityRunning ? 'not-allowed' : 'pointer'
                }}
              >{clarityRunning ? 'Running…' : 'Run 1,000-agent simulation'}</button>
            </div>
            {clarityRows && (
              <div style={{ marginTop: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', fontSize: 10, color: '#64748b' }}>
                      <th style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0' }}>Token</th>
                      <th style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0' }}>Kind</th>
                      <th style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0' }}>Prompts</th>
                      <th style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0' }}>Confusion%</th>
                      <th style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0' }}>Suggestion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clarityRows.filter(r => r.unresolvedRate > 0).slice(0, 10).map((r, i) => {
                      const pct = Math.round(r.unresolvedRate * 100);
                      const badgeStyle = (pct: number) => {
                        let bg = '#dcfce7'; let color = '#166534';
                        if (pct >= 75) { bg = '#fee2e2'; color = '#991b1b'; }
                        else if (pct >= 25) { bg = '#fef9c3'; color = '#92400e'; }
                        return { background: bg, color, fontWeight: 700, padding: '2px 6px', borderRadius: 6, fontSize: 10 };
                      };
                      return (
                        <tr key={r.token + i} style={{ fontSize: 11, color: '#0f172a' }}>
                          <td style={{ padding: '6px 6px', borderBottom: '1px solid #f1f5f9', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>[{r.token}]<div style={{ fontSize: 10, color: '#64748b' }}>{r.explanation}</div></td>
                          <td style={{ padding: '6px 6px', borderBottom: '1px solid #f1f5f9' }}>{r.kind}</td>
                          <td style={{ padding: '6px 6px', borderBottom: '1px solid #f1f5f9' }}>{r.promptsWithToken}</td>
                          <td style={{ padding: '6px 6px', borderBottom: '1px solid #f1f5f9' }}><span style={badgeStyle(pct)}>{pct}%</span></td>
                          <td style={{ padding: '6px 6px', borderBottom: '1px solid #f1f5f9' }}>{r.suggestion}</td>
                        </tr>
                      );
                    })}
                    {clarityRows.filter(r => r.unresolvedRate > 0).length === 0 && (
                      <tr><td colSpan={5} style={{ padding: 8, fontSize: 12, color: '#64748b' }}>No confusion detected. Nice!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Data Health Summary */}
          <div style={{ marginTop: 18, padding: 14, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>📊 Data Health</div>
            <div style={{ fontSize: 11, color: '#475569', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(() => {
                const tagPct = dataHealth.total ? Math.round((dataHealth.withTags / dataHealth.total) * 100) : 0;
                const datePct = dataHealth.total ? Math.round((dataHealth.withAddedDate / dataHealth.total) * 100) : 0;
                const pctBadge = (pct: number) => {
                  let bg = '#f1f5f9'; let color = '#475569'; let b = '1px solid #e2e8f0';
                  if (pct < 25) { bg = '#fee2e2'; color = '#991b1b'; b = '1px solid #fecaca'; }
                  else if (pct < 75) { bg = '#fef9c3'; color = '#92400e'; b = '1px solid #fde68a'; }
                  else { bg = '#dcfce7'; color = '#166534'; b = '1px solid #bbf7d0'; }
                  return { background: bg, color, border: b };
                };
                return (
                  <>
                    <span>Total: {dataHealth.total}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Tags: {dataHealth.withTags}
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.05em', ...pctBadge(tagPct) }}>{tagPct}%</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      addedDate: {dataHealth.withAddedDate}
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.05em', ...pctBadge(datePct) }}>{datePct}%</span>
                    </span>
                  </>
                );
              })()}
            </div>
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Module Breakdown</summary>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr style={{ textAlign: 'left', fontSize: 10, color: '#64748b' }}>
                    <th style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0' }}>Module</th>
                    <th style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0' }}>Prompts</th>
                    <th style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0' }}>Tags%</th>
                    <th style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0' }}>New%</th>
                  </tr>
                </thead>
                <tbody>
                  {dataHealth.modules.map(m => {
                    const tagPct = m.count ? Math.round((m.withTags / m.count) * 100) : 0;
                    const datePct = m.count ? Math.round((m.withAddedDate / m.count) * 100) : 0;
                    const badgeStyle = (pct: number) => {
                      let bg = '#f1f5f9'; let color = '#475569';
                      if (pct < 25) { bg = '#fee2e2'; color = '#991b1b'; }
                      else if (pct < 75) { bg = '#fef9c3'; color = '#92400e'; }
                      else { bg = '#dcfce7'; color = '#166534'; }
                      return { background: bg, color, fontWeight: 600, padding: '2px 6px', borderRadius: 6 };
                    };
                    return (
                      <tr key={m.module} style={{ fontSize: 10, color: '#0f172a' }}>
                        <td style={{ padding: '4px 6px', borderBottom: '1px solid #f1f5f9' }}>{displayName(m.module)}</td>
                        <td style={{ padding: '4px 6px', borderBottom: '1px solid #f1f5f9' }}>{m.count}</td>
                        <td style={{ padding: '4px 6px', borderBottom: '1px solid #f1f5f9' }}><span style={badgeStyle(tagPct)}>{tagPct}%</span></td>
                        <td style={{ padding: '4px 6px', borderBottom: '1px solid #f1f5f9' }}><span style={badgeStyle(datePct)}>{datePct}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
            {dataHealth.withTags === 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: '#dc2626' }}>
                No tags detected. Populate tags[] in remote data to unlock filtering.
              </div>
            )}
            {dataHealth.withAddedDate === 0 && (
              <div style={{ marginTop: 4, fontSize: 11, color: '#dc2626' }}>
                No addedDate values found. Add ISO dates to enable "New" badges.
              </div>
            )}
          </div>
          {diagnostics.unusedPrompts.length > 0 && (
            <div style={{ marginTop: 14, fontSize: 11, color: '#475569' }}>
              <strong>Unreferenced prompts ({diagnostics.unusedPrompts.length}):</strong> {diagnostics.unusedPrompts.slice(0, 12).join(' | ')}{diagnostics.unusedPrompts.length > 12 ? ' …' : ''}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 10, color: '#64748b' }}>Hint: Press Alt + D to toggle this panel.</div>
        </div>
      )}

      {/* First-Time User: Challenge-Based Onboarding */}
      {isFirstTimeUser && !selectedChallenge && viewMode === "browse" && !searchQuery.trim() && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ 
            background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)", 
            borderRadius: 20, 
            padding: "32px 28px",
            border: "1px solid #c7d2fe",
            marginBottom: 24
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1e40af", marginBottom: 8 }}>
              👋 Welcome to Your AI Prompt Vault
            </div>
            <div style={{ fontSize: 15, color: "#475569", lineHeight: 1.6 }}>
              Let's get you results fast. What's your biggest challenge right now?
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}>
            {CHALLENGE_CARDS.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => {
                  setSelectedChallenge(challenge.id);
                  trackEvent("challenge_selected", { challengeId: challenge.id, title: challenge.title });
                }}
                style={{
                  textAlign: "left",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  padding: "20px 18px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  transition: "all 120ms ease",
                  boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(15,23,42,0.12)";
                  e.currentTarget.style.borderColor = "#2563eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.04)";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 4 }}>{challenge.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                  {challenge.title}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>
                  {challenge.description}
                </div>
              </button>
            ))}
          </div>

          <div style={{ 
            marginTop: 24, 
            textAlign: "center", 
            fontSize: 13, 
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}>
            <span>Or</span>
            <button
              onClick={() => {
                setIsFirstTimeUser(false);
                localStorage.setItem("rpv:hasUsedVault", "true");
                trackEvent("skip_onboarding");
              }}
              style={{
                color: "#2563eb",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              skip and browse all {data.length} prompts →
            </button>
          </div>
        </div>
      )}

      {/* Challenge Results View */}
      {selectedChallenge && viewMode === "browse" && (
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => {
              setSelectedChallenge(null);
              setSelectedModule("");
              setSelectedIndex(null);
            }}
            style={{
              fontSize: 13,
              color: "#2563eb",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 16,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ← Back to challenges
          </button>

          {(() => {
            const challenge = CHALLENGE_CARDS.find(c => c.id === selectedChallenge);
            const prompts = getPromptsForChallenge(selectedChallenge);
            
            return (
              <>
                <div style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  borderRadius: 16,
                  padding: "24px",
                  border: "1px solid #bbf7d0",
                  marginBottom: 20
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#166534", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    {challenge?.emoji} {challenge?.title}
                  </div>
                  <div style={{ fontSize: 14, color: "#15803d" }}>
                    {prompts.length} prompts curated to help you solve this challenge
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {prompts.map((p) => (
                    <div
                      key={`${p.module}-${p.index}`}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: 16,
                        cursor: "pointer",
                        transition: "all 100ms ease",
                      }}
                      onClick={() => {
                        setSelectedModule(p.module);
                        setSelectedIndex(p.index);
                        setSelectedChallenge(null);
                        trackEvent("challenge_prompt_selected", { 
                          challengeId: selectedChallenge, 
                          promptTitle: p.title 
                        });
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#2563eb";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(37,99,235,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                          {p.title}
                        </div>
                        {isNewPrompt(p) && (
                          <span style={{
                            fontSize: 9,
                            padding: "2px 5px",
                            background: "#dcfce7",
                            color: "#166534",
                            borderRadius: 3,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}>
                            New
                          </span>
                        )}
                      </div>
                      {p.quick && (
                        <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                          {p.quick}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Returning User: Smart Home View */}
      {!isFirstTimeUser && !selectedChallenge && !selectedModule && viewMode === "browse" && !searchQuery.trim() && selectedTags.length === 0 && (
        <div style={{ marginBottom: 32 }}>
          {/* Continue Where You Left Off */}
          {(() => {
            const lastPrompt = getLastUsedPrompt();
            if (lastPrompt) {
              return (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                    ⚡ Continue Where You Left Off
                  </div>
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 16,
                      cursor: "pointer",
                      transition: "all 100ms ease",
                    }}
                    onClick={() => {
                      setSelectedModule(lastPrompt.module);
                      setSelectedIndex(lastPrompt.index);
                      trackEvent("continue_last_prompt", { title: lastPrompt.title });
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#2563eb";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(37,99,235,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                      {lastPrompt.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {displayName(lastPrompt.module)}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Recommended for You */}
          {(() => {
            const recommended = getRecommendedPrompts();
            if (recommended.length > 0) {
              return (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                    💡 Recommended for You
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {recommended.map((p) => (
                      <div
                        key={`${p.module}-${p.index}`}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          padding: 14,
                          cursor: "pointer",
                          transition: "all 100ms ease",
                        }}
                        onClick={() => {
                          setSelectedModule(p.module);
                          setSelectedIndex(p.index);
                          trackEvent("recommended_prompt_clicked", { title: p.title });
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#2563eb";
                          e.currentTarget.style.boxShadow = "0 6px 16px rgba(37,99,235,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e5e7eb";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {displayName(p.module)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Quick Actions - Challenge Cards */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
              🎯 Quick Actions
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}>
              {CHALLENGE_CARDS.slice(0, 4).map((challenge) => (
                <button
                  key={challenge.id}
                  onClick={() => {
                    setSelectedChallenge(challenge.id);
                    trackEvent("quick_action_selected", { challengeId: challenge.id });
                  }}
                  style={{
                    textAlign: "left",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "14px",
                    cursor: "pointer",
                    transition: "all 100ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#2563eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{challenge.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    {challenge.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === "browse" && (
        <>
      {/* Tag Filter Chips */}
      {!searchQuery.trim() && (
        <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Filter by tags:</span>
          {AVAILABLE_TAGS.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => {
                  if (isActive) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                  trackEvent("tag_filter_toggled", { tag, active: !isActive });
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: isActive ? "1px solid #2563eb" : "1px solid #e5e7eb",
                  background: isActive ? "#eef2ff" : "#ffffff",
                  color: isActive ? "#1e40af" : "#64748b",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {tag} {isActive && "✓"}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={() => {
                setSelectedTags([]);
                trackEvent("tag_filter_cleared");
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #ef4444",
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}
      {/* Search Results */}
      {(searchQuery.trim() || selectedTags.length > 0) && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
            {searchQuery.trim() ? "Search Results" : "Filtered Results"} ({filteredData.length})
          </div>
          {filteredData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
              <div style={{ fontSize: 14 }}>
                {searchQuery.trim() 
                  ? `No prompts found for "${searchQuery}"`
                  : `No prompts match the selected tags`
                }
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredData.slice(0, visibleSearchResults).map((p) => (
                <div
                  key={`${p.module}-${p.index}`}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedModule(p.module);
                    setSelectedIndex(p.index);
                    setSearchQuery("");
                    setSelectedTags([]);
                    trackEvent("search_prompt_selected", { title: p.title, query: searchQuery, tags: selectedTags });
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      {p.title}
                      {isNewPrompt(p) && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 5px",
                            background: "#dcfce7",
                            color: "#166534",
                            borderRadius: 3,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                      {displayName(p.module)}
                    </div>
                    {p.quick && (
                      <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>
                        {p.quick.length > 120 ? p.quick.substring(0, 120) + "..." : p.quick}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(p.id);
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: favorites.has(p.id) ? "1px solid #fbbf24" : "1px solid #e5e7eb",
                        background: favorites.has(p.id) ? "#fef3c7" : "#ffffff",
                        color: favorites.has(p.id) ? "#92400e" : "#94a3b8",
                        fontSize: 16,
                        cursor: "pointer",
                      }}
                    >
                      {favorites.has(p.id) ? "⭐" : "☆"}
                    </button>
                  </div>
                </div>
              ))}
              </div>
              {filteredData.length > visibleSearchResults && (
                <button
                  onClick={() => setVisibleSearchResults(visibleSearchResults + 20)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: 10,
                  }}
                >
                  Load more ({filteredData.length - visibleSearchResults} remaining)
                </button>
              )}
            </>
          )}
        </div>
      )}

      {!searchQuery.trim() && (
        <>
      {/* Category cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        {CATEGORY_CARDS.map((cat) => {
          const isActive = selectedModule === cat.moduleKey;
          return (
            <button
              key={cat.id}
              onClick={() => {
                const nextModule =
                  selectedModule === cat.moduleKey ? "" : cat.moduleKey;
                setSelectedModule(nextModule);
                setSelectedIndex(null);
                trackEvent("module_selected", {
                  module: nextModule || "none",
                  label: cat.label,
                });
              }}
              style={{
                textAlign: "left",
                borderRadius: 16,
                padding: "14px 14px 13px",
                border: isActive ? "1px solid #2563eb" : "1px solid #e5e7eb",
                background: isActive ? "#eef2ff" : "#ffffff",
                boxShadow: isActive
                  ? "0 14px 30px rgba(37,99,235,0.18)"
                  : "0 10px 24px rgba(15,23,42,0.06)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                transition:
                  "transform 120ms ease, box-shadow 120ms ease, background 120ms ease, border-color 120ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#020617",
                  }}
                >
                  {cat.label}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {cat.tagline}
              </span>
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      {!selectedModule && (
        <p
          style={{
            fontSize: 12,
            color: "#9ca3af",
            marginBottom: 10,
          }}
        >
          Choose a category above to see the prompts.
        </p>
      )}

      {selectedModule && (
        <section style={{ marginTop: 8 }}>
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                Prompts in {displayName(selectedModule)}
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                Pick a prompt, then copy the long version into ChatGPT. Replace
                the items in [brackets] with your details (e.g., [market] →
                “Tampa, FL”, [$X] → “$500/mo”).
              </div>
            </div>

            <select
              value={selectedIndex ?? ""}
              onChange={(e) => {
                const idx =
                  e.target.value === "" ? null : Number(e.target.value);
                setSelectedIndex(idx);
                if (idx != null) {
                  const p = promptsForSelected.find(
                    (d) => d.index === idx
                  );
                  trackEvent("prompt_selected", {
                    module: selectedModule,
                    title: p?.title,
                  });
                }
              }}
              style={{
                height: 40,
                minWidth: 220,
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                padding: "0 14px",
                background: "#ffffff",
                fontSize: 13,
                color: "#111827",
              }}
            >
              <option value="">
                {promptsForSelected.length
                  ? "Choose a prompt…"
                  : "No prompts found"}
              </option>
              {promptsForSelected.map((p) => (
                <option key={p.index} value={p.index}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {currentPrompt && (
            <div
              style={{
                marginTop: 10,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: 18,
                boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
              }}
            >
              {(() => {
                // precompute once for rendering (no-op return)
                const txt = buildFullPrompt(currentPrompt);
                extractTokens(txt);
                return null;
              })()}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 9px",
                    background: "#eef2ff",
                    color: "#334155",
                    borderRadius: 999,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontWeight: 600,
                  }}
                >
                  {displayName(currentPrompt.module)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 9px",
                    background: "#f9fafb",
                    color: "#4b5563",
                    borderRadius: 999,
                  }}
                >
                  Long Prompt
                </span>
                <button
                  onClick={() => toggleFavorite(currentPrompt.id)}
                  style={{
                    fontSize: 11,
                    padding: "3px 9px",
                    border: favorites.has(currentPrompt.id) ? "1px solid #fbbf24" : "1px solid #e5e7eb",
                    background: favorites.has(currentPrompt.id) ? "#fef3c7" : "#ffffff",
                    color: favorites.has(currentPrompt.id) ? "#92400e" : "#94a3b8",
                    borderRadius: 999,
                    cursor: "pointer",
                    marginLeft: "auto",
                  }}
                  title={favorites.has(currentPrompt.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  {favorites.has(currentPrompt.id) ? "⭐ Favorited" : "☆ Favorite"}
                </button>
              </div>

              <div
                style={{
                  fontWeight: 800,
                  margin: "4px 0 8px",
                  fontSize: 18,
                  color: "#020617",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {currentPrompt.title || "Untitled Prompt"}
                {isNewPrompt(currentPrompt) && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      background: "#dcfce7",
                      color: "#166534",
                      borderRadius: 4,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    New
                  </span>
                )}
              </div>

              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                  color: "#111827",
                  fontSize: 14,
                }}
              >
                {buildFullPrompt(currentPrompt)}
              </div>

              {/* Personalization helper */}
              {(() => {
                const txt = buildFullPrompt(currentPrompt);
                const tokens = extractTokens(txt);
                if (!tokens.length) return null;
                if (!showTips) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const next = true;
                        setShowTips(next);
                        try { localStorage.setItem("rpv:showTips", String(next)); } catch {}
                      }}
                      style={{
                        marginTop: 14,
                        fontSize: 11,
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fcd34d",
                        borderRadius: 999,
                        padding: "6px 12px",
                        cursor: "pointer",
                        alignSelf: "flex-start",
                      }}
                    >
                      Show personalization tips
                    </button>
                  );
                }
                return (
                  <div
                    style={{
                      marginTop: 14,
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#78350f",
                        marginBottom: 6,
                      }}
                    >
                      Personalize these fields
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: "#92400e", fontSize: 13 }}>
                      {tokens.map((tk) => (
                        <li key={tk} style={{ marginBottom: 4 }}>
                          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                            [{tk}]
                          </span>
                          {" "}— {explainToken(tk)}
                        </li>
                      ))}
                    </ul>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => {
                          const next = false;
                          setShowTips(next);
                          try { localStorage.setItem("rpv:showTips", String(next)); } catch {}
                        }}
                        style={{
                          fontSize: 11,
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fcd34d",
                          borderRadius: 999,
                          padding: "4px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Hide tips
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const txt2 = buildFullPrompt(currentPrompt);
                          const toks = extractTokens(txt2);
                          setFillTokens(toks);
                          setFillValues(toks.reduce((acc, t) => {
                            const suggested = getSuggestedValue(t);
                            acc[t] = suggested || tokenValues[t] || "";
                            return acc;
                          }, {} as Record<string,string>));
                          setShowFillModal(true);
                        }}
                        style={{
                          fontSize: 11,
                          background: "#fff",
                          color: "#92400e",
                          border: "1px solid #fcd34d",
                          borderRadius: 999,
                          padding: "4px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Quick Fill
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {(() => {
                  const txt = currentPrompt ? buildFullPrompt(currentPrompt) : "";
                  if (txt && canPersonalizeWithSaved(txt)) {
                    const personalized = replaceTokensInText(txt, tokenValues);
                    const toks = extractTokens(txt);
                    const replacedList = toks.filter((t) => (tokenValues[t] || "").length > 0).map((t) => `[${t}] → "${tokenValues[t]}"`);
                    return (
                      <div
                        style={{ position: "relative", display: "inline-block" }}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      >
                        <button
                          onClick={() => handleCopyText(personalized)}
                          style={{
                            height: 42,
                            borderRadius: 999,
                            border: "1px solid #e5e7eb",
                            padding: "0 16px",
                            background: "#2563eb",
                            color: "#f9fafb",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {copied ? "Copied!" : "Copy personalized"}
                        </button>
                        {showTooltip && replacedList.length > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: "calc(100% + 8px)",
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: "#0f172a",
                              color: "#f9fafb",
                              fontSize: 12,
                              padding: "8px 12px",
                              borderRadius: 8,
                              whiteSpace: "nowrap",
                              maxWidth: 320,
                              zIndex: 100,
                              boxShadow: "0 4px 12px rgba(15,23,42,0.3)",
                            }}
                          >
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>Replaced values:</div>
                            {replacedList.map((r, i) => (
                              <div key={i} style={{ fontSize: 11, opacity: 0.9 }}>{r}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
                <button
                  onClick={handleCopy}
                  style={{
                    height: 42,
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    padding: "0 16px",
                    background: "#0f172a",
                    color: "#f9fafb",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {copied ? "Copied!" : "Copy prompt"}
                </button>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  Copy → paste into ChatGPT → tweak the bracketed fields →
                  run.
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {loading && !selectedModule && (
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>
          Loading prompts…
        </p>
      )}
      </>
      )}
      </>
      )}

      {viewMode === "library" && (
        <div style={{ marginTop: 20 }}>
          {favorites.size === 0 && recentPrompts.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
                No favorites yet
              </div>
              <div style={{ fontSize: 13 }}>
                Star prompts while browsing to save them here for quick access.
              </div>
            </div>
          )}
          {/* Popular Prompts */}
          {Object.keys(copyCount).length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                🔥 Most Popular
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data
                  .filter((p) => copyCount[p.id] > 0)
                  .sort((a, b) => (copyCount[b.id] || 0) - (copyCount[a.id] || 0))
                  .slice(0, 5)
                  .map((p) => (
                    <div
                      key={p.title}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                            {p.title}
                          </div>
                          {isNewPrompt(p) && (
                            <span
                              style={{
                                fontSize: 9,
                                padding: "2px 5px",
                                background: "#dcfce7",
                                color: "#166534",
                                borderRadius: 3,
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                              }}
                            >
                              New
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: 999 }}>
                            {copyCount[p.id]} {copyCount[p.id] === 1 ? "copy" : "copies"}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{displayName(p.module)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            setSelectedModule(p.module);
                            setSelectedIndex(p.index);
                            setViewMode("browse");
                            trackEvent("library_popular_opened", { title: p.title });
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            border: "1px solid #e5e7eb",
                            background: "#0f172a",
                            color: "#f9fafb",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => toggleFavorite(p.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: favorites.has(p.title) ? "1px solid #fbbf24" : "1px solid #e5e7eb",
                            background: favorites.has(p.title) ? "#fef3c7" : "#ffffff",
                            color: favorites.has(p.title) ? "#92400e" : "#94a3b8",
                            fontSize: 16,
                            cursor: "pointer",
                          }}
                        >
                          {favorites.has(p.title) ? "⭐" : "☆"}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {favorites.size > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                ⭐ Favorites ({favorites.size})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.filter((p) => favorites.has(p.title)).slice(0, visibleFavorites).map((p) => (
                  <div
                    key={p.title}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        {p.title}
                        {isNewPrompt(p) && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: "2px 5px",
                              background: "#dcfce7",
                              color: "#166534",
                              borderRadius: 3,
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                            }}
                          >
                            New
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{displayName(p.module)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          setSelectedModule(p.module);
                          setSelectedIndex(p.index);
                          setViewMode("browse");
                          trackEvent("library_prompt_opened", { title: p.title });
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "1px solid #e5e7eb",
                          background: "#0f172a",
                          color: "#f9fafb",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => toggleFavorite(p.id)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: "1px solid #fbbf24",
                          background: "#fef3c7",
                          color: "#92400e",
                          fontSize: 16,
                          cursor: "pointer",
                        }}
                      >
                        ⭐
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {favorites.size > visibleFavorites && (
                <button
                  onClick={() => setVisibleFavorites(visibleFavorites + 20)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: 10,
                  }}
                >
                  Load more ({favorites.size - visibleFavorites} remaining)
                </button>
              )}
            </div>
          )}
          {recentPrompts.length > 0 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                🕒 Recent ({recentPrompts.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentPrompts.slice(0, visibleRecent).map((r, i) => {
                  const prompt = data.find((p) => p.id === r.id);
                  if (!prompt) return null;
                  const isFav = favorites.has(r.id);
                  return (
                    <div
                      key={i}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                          {prompt.title}
                          {isNewPrompt(prompt) && (
                            <span
                              style={{
                                fontSize: 9,
                                padding: "2px 5px",
                                background: "#dcfce7",
                                color: "#166534",
                                borderRadius: 3,
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                              }}
                            >
                              New
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {displayName(prompt.module)} · {new Date(r.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            setSelectedModule(prompt.module);
                            setSelectedIndex(prompt.index);
                            setViewMode("browse");
                            trackEvent("library_prompt_opened", { id: prompt.id });
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            border: "1px solid #e5e7eb",
                            background: "#0f172a",
                            color: "#f9fafb",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => toggleFavorite(r.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: isFav ? "1px solid #fbbf24" : "1px solid #e5e7eb",
                            background: isFav ? "#fef3c7" : "#ffffff",
                            color: isFav ? "#92400e" : "#94a3b8",
                            fontSize: 16,
                            cursor: "pointer",
                          }}
                        >
                          {isFav ? "⭐" : "☆"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {recentPrompts.length > visibleRecent && (
                <button
                  onClick={() => setVisibleRecent(visibleRecent + 20)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: 10,
                  }}
                >
                  Load more ({recentPrompts.length - visibleRecent} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Onboarding Tip */}
      {/* Command Palette Overlay */}
      {showPalette && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPalette(false);
              trackEvent('palette_closed', { via: 'backdrop' });
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,0.55)',
            zIndex: 2000,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            style={{
              maxWidth: 640,
              margin: '12vh auto 0',
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              boxShadow: '0 24px 60px rgba(15,23,42,0.35)',
            }}
          >
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
              <input
                ref={paletteInputRef}
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Type a command… (e.g., 'focus', 'favorites', 'diagnostics')"
                style={{
                  width: '100%', height: 40, borderRadius: 8, border: '1px solid #e5e7eb',
                  padding: '0 12px', fontSize: 14, outline: 'none'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredCommands[0]) {
                    filteredCommands[0].run();
                  }
                }}
              />
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
              {filteredCommands.length === 0 && (
                <div style={{ padding: 12, fontSize: 13, color: '#64748b' }}>No commands match "{paletteQuery}"</div>
              )}
              {filteredCommands.map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => cmd.run()}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: 8
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 14, color: '#0f172a' }}>{cmd.title}</span>
                  {cmd.subtitle && (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{cmd.subtitle}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tip */}
      {showOnboardingTip && (
        <div
          style={{
            position: "fixed",
            bottom: 30,
            right: 30,
            maxWidth: 380,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            padding: "18px 20px",
            borderRadius: 16,
            boxShadow: "0 16px 40px rgba(15,23,42,0.35)",
            zIndex: 1001,
            border: "1px solid rgba(255,255,255,0.1)",
            animation: "slideInUp 300ms ease",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ fontSize: 24 }}>💡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "#fbbf24" }}>
                Pro Tip: Save Time with Quick Fill
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#cbd5e1", marginBottom: 12 }}>
                Fill out your personalization once (market, budget, niche, etc.) and every prompt will auto-populate. No more copy-pasting!
              </div>
              <button
                onClick={() => {
                  setShowOnboardingTip(false);
                  setShowFillModal(true);
                }}
                style={{
                  background: "#fbbf24",
                  color: "#0f172a",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Set up Quick Fill →
              </button>
            </div>
            <button
              onClick={() => setShowOnboardingTip(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: 18,
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Quick Fill Modal */}
      {showFillModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "80px 20px 40px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 22,
              boxShadow: "0 18px 40px rgba(15,23,42,0.25)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              position: "relative",
            }}
          >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Quick Fill Personalization</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    // Export tokenValues as JSON
                    try {
                      const blob = new Blob([JSON.stringify(tokenValues, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "ai-prompt-vault-personalization.json";
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    } catch {}
                  }}
                  style={{
                    background: "#ecfeff",
                    border: "1px solid #67e8f9",
                    color: "#0e7490",
                    borderRadius: 8,
                    fontSize: 12,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportArea((v) => !v);
                    setImportError("");
                  }}
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    borderRadius: 8,
                    fontSize: 12,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  {showImportArea ? "Hide Import" : "Import"}
                </button>
                <button
                  onClick={() => setShowFillModal(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 12,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Fill in your details below. These replace the matching [tokens] when you copy the personalized prompt.
            </div>
            {showImportArea && (
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: 10, borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: "#9a3412", marginBottom: 6 }}>Paste exported JSON to import saved values.</div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={6}
                  style={{ width: "100%", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, borderRadius: 8, border: "1px solid #fbbf24", padding: 8 }}
                  placeholder={'{\n  "market": "Austin, TX",\n  "$X": "$500/mo"\n}'}
                />
                {importError && (
                  <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 6 }}>{importError}</div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        setImportError("");
                        const parsed = JSON.parse(importText) as Record<string, unknown>;
                        const cleaned: Record<string, string> = {};
                        Object.entries(parsed || {}).forEach(([k, v]) => {
                          if (typeof k === "string" && typeof v === "string") cleaned[k] = v;
                        });
                        const merged = { ...tokenValues, ...cleaned };
                        setTokenValues(merged);
                        try { localStorage.setItem("rpv:tokenVals", JSON.stringify(merged)); } catch {}
                        // Also update current form fields when relevant
                        setFillValues((prev) => {
                          const next = { ...prev };
                          fillTokens.forEach((t) => {
                            if (!next[t] && merged[t]) next[t] = merged[t];
                          });
                          return next;
                        });
                        setShowImportArea(false);
                        setImportText("");
                      } catch (e) {
                        setImportError("Invalid JSON. Please paste a valid JSON object of key/value pairs.");
                      }
                    }}
                    style={{
                      background: "#ecfccb",
                      border: "1px solid #a3e635",
                      color: "#3f6212",
                      borderRadius: 8,
                      fontSize: 12,
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Import JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportArea(false);
                      setImportText("");
                      setImportError("");
                    }}
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      color: "#0f172a",
                      borderRadius: 8,
                      fontSize: 12,
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // save defaults if requested
                if (saveDefaults) {
                  const merged = { ...tokenValues, ...fillValues };
                  setTokenValues(merged);
                  try { localStorage.setItem("rpv:tokenVals", JSON.stringify(merged)); } catch {}
                }
                if (currentPrompt) {
                  const personalized = replaceTokensInText(buildFullPrompt(currentPrompt), fillValues);
                  handleCopyText(personalized);
                  trackEvent("prompt_personalized_copied", { title: currentPrompt.title, module: currentPrompt.module });
                }
                setShowFillModal(false);
              }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
                {fillTokens.map((tk) => (
                  <label key={tk} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#0f172a" }}>
                    <span style={{ fontWeight: 600 }}>[{tk}]</span>
                    <input
                      value={fillValues[tk] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFillValues((prev) => ({ ...prev, [tk]: val }));
                      }}
                      placeholder={explainToken(tk)}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        padding: "0 10px",
                        fontSize: 13,
                        background: "#ffffff",
                      }}
                    />
                  </label>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#0f172a" }}>
                <input
                  type="checkbox"
                  checked={saveDefaults}
                  onChange={(e) => setSaveDefaults(e.target.checked)}
                  style={{ width: 14, height: 14 }}
                />
                Save these values for next time
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="submit"
                  style={{
                    height: 40,
                    borderRadius: 999,
                    border: "1px solid #0f172a",
                    background: "#0f172a",
                    color: "#f8fafc",
                    padding: "0 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {copied ? "Copied!" : "Copy personalized"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFillModal(false);
                  }}
                  style={{
                    height: 40,
                    borderRadius: 999,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    padding: "0 18px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Clear all saved personalization values?")) {
                      setTokenValues({});
                      try { localStorage.removeItem("rpv:tokenVals"); } catch {}
                      setFillValues({});
                      trackEvent("token_values_reset");
                    }
                  }}
                  style={{
                    height: 40,
                    borderRadius: 999,
                    border: "1px solid #fca5a5",
                    background: "#ffffff",
                    color: "#dc2626",
                    padding: "0 18px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginLeft: "auto",
                  }}
                >
                  Reset all
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}