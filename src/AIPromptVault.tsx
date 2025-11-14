"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { buildEnhancedWizardPrompt } from "./wizardPromptBuilder";
import { computeQualityMeta } from "./qualityMeter";
import confetti from "canvas-confetti";
import "./AIPromptVault.css";
import { prompts as fullPrompts } from "./prompts";
import { PromptItem, buildFullPrompt, extractPlaceholders, applyReplacements, getPlaceholderHelp, simplifyJargon } from "./promptUtils";
import { useDebounce } from "./hooks/useDebounce";
import { useAgentProfile, AgentProfile } from "./hooks/useAgentProfile";
import { AgentProfileSetup } from "./components/AgentProfileSetup";
import { EditablePromptText } from "./components/EditablePromptText";
import { computeMissingPlaceholders } from "./guardrailUtils";

/* ---------- Constants ---------- */
// Optional: GPT store URL for cross-traffic CTA
const GPT_STORE_URL = process.env.REACT_APP_GPT_STORE_URL;
const KEY_FAVORITES = "rpv:favorites";
const KEY_COUNTS = "rpv:copyCounts";
const KEY_RECENT = "rpv:recentCopied";
const KEY_SAVED_FIELDS = "rpv:savedFields";
const KEY_ONBOARDED = "rpv:onboarded";
const KEY_DARK_MODE = "rpv:darkMode";
const KEY_FIRST_COPY = "rpv:firstCopy";
const KEY_FIELD_HISTORY = "rpv:fieldHistory";
const KEY_COLLECTIONS = "rpv:collections";
const KEY_CUSTOM_PROMPTS = "rpv:customPrompts";
const KEY_SEQUENCES = "rpv:sequences";
const KEY_SESSION_HISTORY = "rpv:sessionHistory";
// const KEY_GENERATIONS = "rpv:generations"; // Reserved for future use
const KEY_GENERATION_COUNT = "rpv:generationCount";
const KEY_SAVED_OUTPUTS = "rpv:savedOutputs";
const KEY_INLINE_PREVIEW = "rpv:inlinePreview";
const KEY_USE_DEFAULTS = "rpv:useDefaults";
const KEY_INLINE_PREVIEW_PER_PROMPT = "rpv:inlinePreviewPerPrompt";
const KEY_COPY_GUARDRAIL_SUPPRESS = "rpv:copyGuardrailSuppress";
const KEY_INLINE_TIP_SEEN = "rpv:inlineTipSeen";
const KEY_STATS = "rpv:stats";
const KEY_LAST_VISIT = "rpv:lastVisit";
const KEY_WIZARD_DISMISSED = "rpv:wizardDismissed";

// Static follow-up mapping for conversation starters (curated for multi-turn depth)
// Referenced in LAUNCH_NOW_GUIDE.md for GPT instructions; reserved for future web app integration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const STARTER_FOLLOW_UPS: Record<string, { title: string; reason: string }[]> = {
  "Listing Description That Converts": [
    { title: "Pricing Strategy Script", reason: "Set the right price after you write compelling copy" },
    { title: "Open House Promo Pack", reason: "Drive traffic to your new listing" },
    { title: "Listing Refresh Plan", reason: "Know how to pivot if it sits too long" }
  ],
  "Create a FSBO conversion script for my market": [
    { title: "Commission Value Conversation", reason: "Handle fee objections with confidence" },
    { title: "Listing Launch Timeline (T-14→T+14)", reason: "Show them what they're missing without you" },
    { title: "Pricing Strategy Script", reason: "Win the pricing conversation upfront" }
  ],
  "Build my 90-day marketing plan": [
    { title: "Instagram Reels Calendar (30 Days)", reason: "Execute content for first 30 days" },
    { title: "Local SEO Starter Kit", reason: "Build organic visibility alongside ads" },
    { title: "Weekly Productivity Audit", reason: "Free up time to execute the plan" }
  ],
  "Write a sphere nurture email campaign": [
    { title: "Review-to-Referral Bridge", reason: "Turn happy clients into referral sources" },
    { title: "Home-Anniversary Automation", reason: "Stay top-of-mind with past clients" },
    { title: "Client-Appreciation Event", reason: "Deepen relationships beyond email" }
  ],
  "Generate a buyer presentation outline": [
    { title: "Multiple-Offer Strategy", reason: "Prepare buyers for competitive markets" },
    { title: "Buyer Onboarding Journey", reason: "Set clear expectations from day one" },
    { title: "Needs-Match Matrix", reason: "Help buyers prioritize what matters" }
  ],
  "Show me prompts for lead generation": [
    { title: "90-Day Inbound Lead Blueprint", reason: "Build a complete lead gen system" },
    { title: "Landing Page CRO Audit", reason: "Optimize your lead capture pages" },
    { title: "7-Day Follow-Up Sequence", reason: "Convert more leads with better follow-up" }
  ]
};

// Free tier limits
// const FREE_PROMPTS_PER_MONTH = 10; // Reserved for future paywall
const FREE_GENERATIONS_PER_MONTH = 3;

// Module names (descriptive, not numbered)
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

// Tag mapping for each module
const MODULE_TAGS: Record<number, string[]> = {
  1: ["leads", "marketing", "content"],
  2: ["systems", "productivity", "workflow"],
  3: ["goals", "planning", "accountability"],
   4: ["listing", "buyer", "presentation", "listing-toolkit"],
  5: ["client", "service", "followup"],
  6: ["finance", "profit", "budget"],
  7: ["negotiation", "deals", "strategy"],
  8: ["buyer", "search", "tools"],
  9: ["sphere", "community", "nurture"],
  10: ["marketing", "ads", "ai"],
  11: ["automation", "workflow", "tech"],
  12: ["learning", "research", "intel"]
};

/* ---------- Types for Sequence Tracking ---------- */
interface SequencePair {
  from: string;  // First prompt ID
  to: string;    // Second prompt ID
  count: number; // How many times this pair occurred
  lastUsed: number; // Timestamp
}

interface SessionCopy {
  promptId: string;
  timestamp: number;
  module: string;
  title: string;
}

interface SequenceData {
  pairs: Record<string, SequencePair>; // Key: "fromId->toId"
  totalSequences: number;
}

interface SuggestionMeta {
  prompt: PromptItem;
  source: 'sequence' | 'tag' | 'module';
  sequenceCount?: number;
  percentage?: number;
}

interface GeneratedOutput {
  id: string;
  promptId: string;
  promptTitle: string;
  input: string;
  output: string;
  timestamp: number;
  model: string;
}

/* ---------- Tracking ---------- */
const trackEvent = (name: string, data?: Record<string, any>) => {
  try {
    window.dispatchEvent(new CustomEvent("rpv_event", { detail: { name, ...data } }));
    
    // Send to Plausible Analytics (if installed)
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(name, { props: data });
    }
    
    // Send to PostHog (if installed)
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(name, data);
    }
    
    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', name, data);
    }
  } catch {}
};

/* ---------- Placeholder Refinement & Overrides ---------- */
// Removes non-user-input placeholders and fixes nested bracket artifacts.
export function refinePlaceholders(list: string[], promptTitle: string): string[] {
  return list
    .map(ph => ph.trim())
    // Drop directive / non-input placeholders
    .filter(ph => !/plain, compliant language/i.test(ph))
    // Remove broken nested bracket artifacts (outer chunks that still contain '[')
    .filter(ph => !ph.includes('['))
    // Deduplicate
    .filter((ph, i, arr) => arr.indexOf(ph) === i);
}

// Apply contextual overrides for description/example while reusing existing help logic.
export function getEffectiveHelp(placeholder: string, promptTitle: string): { description: string; example: string } {
  const lower = placeholder.toLowerCase();

  // FSBO situation override
  if (lower.includes('describe their situation')) {
    return {
      description: "Describe the seller's specific situation (motivation, timing pressure, condition)",
      example: "Inherited property; wants fast sale before probate closes"
    };
  }

  // Target cost per lead override
  if (lower.includes('target cost per lead')) {
    return {
      description: "Target cost per lead (number only, no $)",
      example: "200"
    };
  }

  // Context-aware override for the generic placeholder "X"
  if (lower.trim() === 'x') {
    // Special-case: 90-Day plan prefers a days-focused frame
    if (/90-Day Inbound Lead Blueprint/i.test(promptTitle)) {
      return {
        description: "Number of days for the first execution milestone (focus period before optimization)",
        example: "30"
      };
    }

    const looksLikeDays = /(timeline|day|days|schedule|calendar|plan|sprint|countdown|launch)/i.test(promptTitle);
    const looksLikeBudget = /(budget|ad\b|ads\b|facebook|instagram|youtube|ppc|cpl|cost|spend|marketing)/i.test(promptTitle);

    if (looksLikeDays && !looksLikeBudget) {
      return {
        description: "Number of days (just the number)",
        example: "30"
      };
    }
    if (looksLikeBudget && !looksLikeDays) {
      return {
        description: "Budget number (just the number, no $)",
        example: "200"
      };
    }
    return {
      description: "Timeline or budget number (just the number)",
      example: "30"
    };
  }

  // Fall back to existing helper
  return getPlaceholderHelp(placeholder);
}

/* ---------- Main Component ---------- */
export default function AIPromptVault() {
  const [search, setSearch] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copyCounts, setCopyCounts] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [savedFieldValues, setSavedFieldValues] = useState<Record<string, string>>({});
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [recentlyCopied, setRecentlyCopied] = useState<string[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showFavoritesView, setShowFavoritesView] = useState<boolean>(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [showFollowUps, setShowFollowUps] = useState<boolean>(false);
  const [followUpPrompts, setFollowUpPrompts] = useState<PromptItem[]>([]);
  const [followUpMeta, setFollowUpMeta] = useState<SuggestionMeta[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fieldHistory, setFieldHistory] = useState<Record<string, string[]>>({});
  const [collections, setCollections] = useState<Record<string, string[]>>({ "My Favorites": [] });
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [customPrompts, setCustomPrompts] = useState<PromptItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Wizard state (lightweight 3-step flow)
  const [wizardOpen, setWizardOpen] = useState<boolean>(() => {
    try {
      const dismissed = localStorage.getItem(KEY_WIZARD_DISMISSED) === 'true';
      const countsRaw = localStorage.getItem(KEY_COUNTS);
      const counts = countsRaw ? JSON.parse(countsRaw) as Record<string, number> : {};
      const total = Object.values(counts).reduce((s, c) => s + (c || 0), 0);
      // Show wizard by default on true first-time (no copies) and not dismissed
      return !dismissed && total === 0;
    } catch { return true; }
  });
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardChallenge, setWizardChallenge] = useState<string | null>(null);
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>({});
  const [wizardResultText, setWizardResultText] = useState<string>("");
  const [wizardSelectedPrompt, setWizardSelectedPrompt] = useState<PromptItem | null>(null);
  const [wizardCustomChallenge, setWizardCustomChallenge] = useState<string>('');
  // Chip selections (multi-select) keyed by question id
  const [wizardSelections, setWizardSelections] = useState<Record<string, string[]>>({});

  // Quality meter threshold tracking
  const lastQualityScoreRef = useRef<number>(0);

  // Quality meta now imported from qualityMeter.ts

  // Emit threshold events when quality crosses tiers during Step 2
  useEffect(() => {
    if (wizardStep !== 2 || !wizardChallenge) return;
    const cfg = CHALLENGES.find(c => c.key === wizardChallenge);
    if (!cfg) return;
    const { score, suggestions } = computeQualityMeta(wizardAnswers, cfg);
    const last = lastQualityScoreRef.current;
    [45, 65, 85].forEach(t => {
      if (last < t && score >= t) {
        trackEvent('rpv:wizard_quality_threshold', { from: last, to: t, challenge: wizardChallenge, suggestionsRemaining: suggestions });
      }
    });
    lastQualityScoreRef.current = score;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardAnswers, wizardChallenge, wizardStep]);

  // Preset option chips for common questions
  const WIZARD_OPTION_SETS: Record<string, string[]> = {
    channel: ['Instagram', 'Email Newsletter', 'YouTube', 'Open Houses', 'Referral Outreach', 'LinkedIn'],
    tone: ['Friendly', 'Direct', 'Authoritative', 'Helpful', 'Empathetic'],
    cadence: ['Daily', 'Every 3 Days', 'Weekly', 'Bi-Weekly'],
    urgency: ['ASAP', 'Next 30 days', 'This quarter', 'Just researching'],
    obstacle: ['Pricing', 'Emotions', 'Slow Response', 'Fear of Commitment', 'Low Urgency'],
    timeBlocks: ['Prospecting AM', 'Follow-Up Midday', 'Admin Friday', 'Content Batch Monday', 'Client Updates PM'],
    biggestBlocker: ['Context Switching', 'Procrastination', 'Low Energy', 'Distractions', 'Overwhelm']
  };

  const toggleWizardChip = (questionId: string, value: string) => {
    setWizardSelections(prev => {
      const existing = prev[questionId] || [];
      const isSelected = existing.includes(value);
      const next = isSelected ? existing.filter(v => v !== value) : [...existing, value];
      const updated = { ...prev, [questionId]: next };
      // Reflect into wizardAnswers (comma separated + any custom text if present)
      const customPart = (wizardAnswers[questionId + '_custom'] || '').trim();
      const combined = [...next, customPart].filter(Boolean).join(', ');
      setWizardAnswers(ans => ({ ...ans, [questionId]: combined }));
      trackEvent('rpv:wizard_chip_select', { questionId, value, selected: !isSelected });
      return updated;
    });
  };

  const updateWizardCustomForQuestion = (questionId: string, text: string) => {
    setWizardAnswers(prev => {
      // store raw custom in a hidden key to avoid losing chip toggles
      const next = { ...prev, [questionId + '_custom']: text };
      const chips = wizardSelections[questionId] || [];
      next[questionId] = [...chips, text.trim()].filter(Boolean).join(', ');
      return next;
    });
  };
  
  // A/B test: Wizard CTA variant
  const [wizardCTAVariant] = useState<'A' | 'B' | 'C'>(() => {
    try {
      const saved = localStorage.getItem('rpv:abWizardCTA');
      if (saved && ['A', 'B', 'C'].includes(saved)) return saved as 'A' | 'B' | 'C';
      const variant = ['A', 'B', 'C'][Math.floor(Math.random() * 3)] as 'A' | 'B' | 'C';
      localStorage.setItem('rpv:abWizardCTA', variant);
      return variant;
    } catch { return 'A'; }
  });
  
  // Sequence tracking state
  const [sequences, setSequences] = useState<SequenceData>({ pairs: {}, totalSequences: 0 });
  const [sessionHistory, setSessionHistory] = useState<SessionCopy[]>([]);
  
  // AI Generation state
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [savedOutputs, setSavedOutputs] = useState<GeneratedOutput[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState<boolean>(false);
  const [useDefaults, setUseDefaults] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(KEY_USE_DEFAULTS);
      return saved ? JSON.parse(saved) === true : false;
    } catch {
      return false;
    }
  });
  const [defaultsAppliedCount, setDefaultsAppliedCount] = useState<number>(0);
  
  // Agent profile integration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { profile, isProfileComplete, saveProfile, getAutoFillValue } = useAgentProfile();
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  // Optional inline editing preview (non-disruptive to current field flow)
  const [showInlinePreview, setShowInlinePreview] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(KEY_INLINE_PREVIEW);
      return saved ? JSON.parse(saved) === true : false;
    } catch {
      return false;
    }
  });
  const [inlinePreviewPrefs, setInlinePreviewPrefs] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(KEY_INLINE_PREVIEW_PER_PROMPT);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  // One-time keyboard tip for Inline/Form
  const [inlineTipSeen, setInlineTipSeen] = useState<boolean>(() => {
    try { return localStorage.getItem(KEY_INLINE_TIP_SEEN) === 'true'; } catch { return false; }
  });
  // Basic analytics counters
  type Stats = { inlineEnabled: number; formEnabled: number; guardrailTriggered: number; autoFillApplied: number };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState<Stats>(() => {
    try { const saved = localStorage.getItem(KEY_STATS); return saved ? JSON.parse(saved) as Stats : { inlineEnabled: 0, formEnabled: 0, guardrailTriggered: 0, autoFillApplied: 0 }; } catch { return { inlineEnabled: 0, formEnabled: 0, guardrailTriggered: 0, autoFillApplied: 0 }; }
  });
  const updateStats = useCallback((delta: Partial<Stats>) => {
    setStats(prev => { const next: Stats = { inlineEnabled: prev.inlineEnabled + (delta.inlineEnabled || 0), formEnabled: prev.formEnabled + (delta.formEnabled || 0), guardrailTriggered: prev.guardrailTriggered + (delta.guardrailTriggered || 0), autoFillApplied: prev.autoFillApplied + (delta.autoFillApplied || 0) }; try { localStorage.setItem(KEY_STATS, JSON.stringify(next)); } catch {} return next; });
  }, []);
  // Copy guardrail state
  const [showMissingFieldsPrompt, setShowMissingFieldsPrompt] = useState<boolean>(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [guardrailDontAskAgain, setGuardrailDontAskAgain] = useState<boolean>(false);
  const [guardrailSuppressPrefs, setGuardrailSuppressPrefs] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(KEY_COPY_GUARDRAIL_SUPPRESS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  // Debounced search for performance
  const debouncedSearch = useDebounce(search, 200);
  
  // Detect Kale branding from URL parameter
  const isKaleBranded = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('kale') === 'true';
  }, []);
  
  // Detect embed mode (hide header for iframe embedding)
  const isEmbedMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('embed') === 'true';
  }, []);
  
  // Calculate current dark mode state (for tooltip)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getDarkModeState = useCallback(() => {
    const saved = localStorage.getItem(KEY_DARK_MODE);
    if (saved === null) return 'auto';
    if (saved === 'true') return 'dark';
    return 'light';
  }, []);
  
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const fieldInputRef = React.useRef<HTMLInputElement>(null);
  
  // Return visit tracking
  useEffect(() => {
    try {
      const last = localStorage.getItem(KEY_LAST_VISIT);
      const now = Date.now();
      if (last) {
        const days = Math.max(0, Math.floor((now - Number(last)) / (1000 * 60 * 60 * 24)));
        trackEvent('rpv:return_visit', { days_since_last: days });
      }
      localStorage.setItem(KEY_LAST_VISIT, String(now));
    } catch {}
  }, []);
  
  // Detect OS for paste-hint
  const isMac = useMemo(() => {
    try {
      return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
    } catch {
      return false;
    }
  }, []);

  // Apply saved defaults into current placeholder fields (fill only empty ones)
  const applyDefaultsForPlaceholders = useCallback((placeholders: string[]): number => {
    if (!placeholders || placeholders.length === 0) return 0;
    let applied = 0;
    let autoApplied = 0;
    const next = { ...fieldValues };
    placeholders.forEach((ph) => {
      if (!next[ph]) {
        // First try saved field values (user's previous inputs)
        if (savedFieldValues[ph]) {
          next[ph] = savedFieldValues[ph];
          applied++;
        } 
        // Then try auto-fill from agent profile
        else {
          const autoFillValue = getAutoFillValue(ph);
          if (autoFillValue) {
            next[ph] = autoFillValue;
            applied++;
            autoApplied++;
          }
        }
      }
    });
    if (applied > 0) {
      setFieldValues(next);
    }
    if (autoApplied > 0) {
      updateStats({ autoFillApplied: autoApplied });
    }
    return applied;
  }, [fieldValues, savedFieldValues, getAutoFillValue, updateStats]);

  // Load all prompts with tags
  const allPrompts = useMemo(() => {
    const basePrompts = fullPrompts.flatMap((modulePrompts, moduleIdx) => {
      const moduleName = MODULE_NAMES[moduleIdx + 1] || `Module ${moduleIdx + 1}`;
      const tags = MODULE_TAGS[moduleIdx + 1] || [];
      
      return modulePrompts.map((p: any, idx: number) => ({
        ...p,
        module: moduleName,
        index: idx,
        tags,
        id: `${moduleName}-${idx}`,
      }));
    });
    
    // Merge with custom prompts
    return [...basePrompts, ...customPrompts];
  }, [customPrompts]);

  // Load favorites & counts from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(KEY_FAVORITES);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      
      const savedCounts = localStorage.getItem(KEY_COUNTS);
      if (savedCounts) setCopyCounts(JSON.parse(savedCounts));
      
      const savedRecent = localStorage.getItem(KEY_RECENT);
      if (savedRecent) setRecentlyCopied(JSON.parse(savedRecent));
      
      const savedFields = localStorage.getItem(KEY_SAVED_FIELDS);
      if (savedFields) setSavedFieldValues(JSON.parse(savedFields));
      
      // Load field history
      const savedHistory = localStorage.getItem(KEY_FIELD_HISTORY);
      if (savedHistory) setFieldHistory(JSON.parse(savedHistory));
      
      // Load collections
      const savedCollections = localStorage.getItem(KEY_COLLECTIONS);
      if (savedCollections) setCollections(JSON.parse(savedCollections));
      
      // Load custom prompts
      const savedCustomPrompts = localStorage.getItem(KEY_CUSTOM_PROMPTS);
      if (savedCustomPrompts) setCustomPrompts(JSON.parse(savedCustomPrompts));
      
      // Load sequence tracking data
      const savedSequences = localStorage.getItem(KEY_SEQUENCES);
      if (savedSequences) {
        setSequences(JSON.parse(savedSequences));
      }
      
      // Load session history (resets on page load, but we'll keep last session)
      const savedSessionHistory = localStorage.getItem(KEY_SESSION_HISTORY);
      if (savedSessionHistory) {
        const history: SessionCopy[] = JSON.parse(savedSessionHistory);
        // Keep only recent history from last 30 minutes
        const thirtyMinsAgo = Date.now() - (30 * 60 * 1000);
        const recentHistory = history.filter(h => h.timestamp > thirtyMinsAgo);
        setSessionHistory(recentHistory);
        localStorage.setItem(KEY_SESSION_HISTORY, JSON.stringify(recentHistory));
      }
      
      // Load generation count and reset monthly
      const savedGenCount = localStorage.getItem(KEY_GENERATION_COUNT);
      if (savedGenCount) {
        const data = JSON.parse(savedGenCount);
        const now = new Date();
        const savedDate = new Date(data.month);
        
        // Reset if it's a new month
        if (now.getMonth() !== savedDate.getMonth() || now.getFullYear() !== savedDate.getFullYear()) {
          setGenerationCount(0);
          localStorage.setItem(KEY_GENERATION_COUNT, JSON.stringify({ count: 0, month: now.toISOString() }));
        } else {
          setGenerationCount(data.count || 0);
        }
      }
      
      // Load saved outputs
      const savedOutputsData = localStorage.getItem(KEY_SAVED_OUTPUTS);
      if (savedOutputsData) {
        setSavedOutputs(JSON.parse(savedOutputsData));
      }
      
      // Check if user has seen onboarding
      const hasOnboarded = localStorage.getItem(KEY_ONBOARDED);
      if (!hasOnboarded) {
        setShowOnboarding(true);
      }
      
      // Check if user has completed profile setup
      // Only show after user's first successful copy (not on initial load)
      // This prevents interrupting exploration for new users
      
      // Set last updated timestamp
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      setLastUpdated(`${dateStr} at ${timeStr}`);
      
      // Load dark mode preference (or detect system preference)
      const savedDarkMode = localStorage.getItem(KEY_DARK_MODE);
      let isDark = false;
      
      if (savedDarkMode) {
        // User has explicit preference
        isDark = savedDarkMode === 'true';
      } else {
        // Auto-detect system preference
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setDarkMode(isDark);
      document.body.classList.toggle('dark-mode', isDark);
      
      // Apply Kale branding if parameter detected
      if (isKaleBranded) {
        document.body.classList.add('kale-branded');
      }
      
      // Apply embed mode styling if parameter detected
      if (isEmbedMode) {
        document.body.classList.add('embed-mode');
      }
      
      // Listen for system theme changes
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        // Only auto-update if user hasn't set explicit preference
        if (!localStorage.getItem(KEY_DARK_MODE)) {
          setDarkMode(e.matches);
          document.body.classList.toggle('dark-mode', e.matches);
        }
      };
      
      darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
      
      // Simulate brief loading for skeleton cards
      setTimeout(() => setIsLoading(false), 300);
      
      // Cleanup
      return () => darkModeMediaQuery.removeEventListener('change', handleSystemThemeChange);
    } catch {}
  }, [isKaleBranded, isEmbedMode, isProfileComplete]);

  // Track home view variant (wizard vs library)
  useEffect(() => {
    trackEvent('rpv:view_home', { variant: wizardOpen ? 'wizard' : 'library' });
  }, [wizardOpen]);

  // Search/filter prompts (using debounced search for performance)
  const filteredPrompts = useMemo(() => {
    let filtered = allPrompts;
    
    // Filter by active collection
    if (activeCollection) {
      const collectionIds = collections[activeCollection] || [];
      filtered = filtered.filter((p: any) => collectionIds.includes(p.id));
    }
    
    // Filter by active tag
    if (activeTag) {
      filtered = filtered.filter((p: any) => p.tags?.includes(activeTag));
    }
    
    // Filter by search term (debounced)
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter((p: any) => 
        p.title.toLowerCase().includes(term) ||
        p.quick?.toLowerCase().includes(term) ||
        p.tags?.some((t: string) => t.includes(term))
      );
    }
    
    return filtered;
  }, [debouncedSearch, activeTag, activeCollection, collections, allPrompts]);

  // Hot prompts: top 5 by copy count
  const hotPrompts = useMemo(() => {
    return [...allPrompts]
      .sort((a: any, b: any) => (copyCounts[b.id] || 0) - (copyCounts[a.id] || 0))
      .slice(0, 5);
  }, [allPrompts, copyCounts]);

  // Prompts to display
  const displayPrompts = (search || activeTag || activeCollection) ? filteredPrompts : hotPrompts;

  // Favorite prompts
  const favoritePrompts = useMemo(() => {
    return allPrompts.filter((p: any) => favorites.includes(p.id));
  }, [favorites, allPrompts]);

  // Recently copied prompts
  const recentPrompts = useMemo(() => {
    return recentlyCopied
      .map(id => allPrompts.find((p: any) => p.id === id))
      .filter(Boolean)
      .slice(0, 3);
  }, [recentlyCopied, allPrompts]);

  // Record a sequence pair (when user copies prompt B shortly after prompt A)
  const recordSequence = useCallback((fromId: string, toId: string) => {
    const pairKey = `${fromId}->${toId}`;
    const now = Date.now();
    
    const updatedSequences = { ...sequences };
    
    if (updatedSequences.pairs[pairKey]) {
      // Increment existing pair
      updatedSequences.pairs[pairKey].count++;
      updatedSequences.pairs[pairKey].lastUsed = now;
    } else {
      // Create new pair
      updatedSequences.pairs[pairKey] = {
        from: fromId,
        to: toId,
        count: 1,
        lastUsed: now
      };
    }
    
    updatedSequences.totalSequences++;
    
    // Save to state and localStorage
    setSequences(updatedSequences);
    localStorage.setItem(KEY_SEQUENCES, JSON.stringify(updatedSequences));
    
    // Track analytics event
    trackEvent("sequence_recorded", { 
      from: fromId, 
      to: toId, 
      count: updatedSequences.pairs[pairKey].count 
    });
  }, [sequences]);

  // Get enhanced suggestions with metadata
  const getEnhancedSuggestions = useCallback((promptId: string, limit: number = 3): SuggestionMeta[] => {
    const suggestions: SuggestionMeta[] = [];
    
    // Priority 1: Sequence-based suggestions
    const relevantPairs = Object.values(sequences.pairs)
      .filter(pair => pair.from === promptId)
      .sort((a, b) => b.count - a.count);
    
    // Calculate total uses of this source prompt (for percentages)
    const totalUsesFromThisPrompt = relevantPairs.reduce((sum, pair) => sum + pair.count, 0);
    
    for (const pair of relevantPairs.slice(0, limit)) {
      const prompt = allPrompts.find((p: any) => p.id === pair.to);
      if (prompt) {
        const percentage = totalUsesFromThisPrompt > 0 
          ? Math.round((pair.count / totalUsesFromThisPrompt) * 100)
          : 0;
        
        suggestions.push({
          prompt,
          source: 'sequence',
          sequenceCount: pair.count,
          percentage
        });
      }
    }
    
    // If we need more suggestions, fall back to tag/module matching
    if (suggestions.length < limit) {
      const currentPrompt = allPrompts.find((p: any) => p.id === promptId);
      if (currentPrompt) {
        const promptTags = (currentPrompt as any).tags || [];
        const promptModule = currentPrompt.module;
        
        const tagMatches = allPrompts
          .filter((p: any) => {
            if (p.id === promptId) return false;
            if (suggestions.some(s => (s.prompt as any).id === p.id)) return false; // Don't duplicate
            
            const pTags = p.tags || [];
            const hasCommonTag = promptTags.some((tag: string) => pTags.includes(tag));
            return hasCommonTag;
          })
          .slice(0, limit - suggestions.length);
        
        for (const prompt of tagMatches) {
          suggestions.push({
            prompt,
            source: 'tag'
          });
        }
        
        // Fill remaining with module matches
        if (suggestions.length < limit) {
          const moduleMatches = allPrompts
            .filter((p: any) => {
              if (p.id === promptId) return false;
              if (suggestions.some(s => (s.prompt as any).id === p.id)) return false;
              return p.module === promptModule;
            })
            .slice(0, limit - suggestions.length);
          
          for (const prompt of moduleMatches) {
            suggestions.push({
              prompt,
              source: 'module'
            });
          }
        }
      }
    }
    
    return suggestions.slice(0, limit);
  }, [sequences, allPrompts]);

  // Compute missing fields for a prompt
  const getMissingFields = useCallback((prompt: PromptItem): string[] => {
    return computeMissingPlaceholders(prompt, fieldValues);
  }, [fieldValues]);

  // Actual copy logic (shared by normal flow and guardrail "Copy anyway")
  const proceedCopy = useCallback(async (prompt: PromptItem) => {
    const fullText = buildFullPrompt(prompt);
    const finalText = applyReplacements(fullText, fieldValues);
    
    // Add UTM tracking to GPT deep-link when opening ChatGPT (if used later)
    const utmParams = 'utm_source=app&utm_medium=copy&utm_campaign=gpt-link';
    try {
      await navigator.clipboard.writeText(finalText);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 5000);
      
      // Update copy count
      const id = (prompt as any).id;
      const newCounts = { ...copyCounts, [id]: (copyCounts[id] || 0) + 1 };
      setCopyCounts(newCounts);
      localStorage.setItem(KEY_COUNTS, JSON.stringify(newCounts));
      
      // Update recently copied (keep last 10)
      const newRecent = [id, ...recentlyCopied.filter(rid => rid !== id)].slice(0, 10);
      setRecentlyCopied(newRecent);
      localStorage.setItem(KEY_RECENT, JSON.stringify(newRecent));
      
      // Record sequence if there's a previous prompt in session
      if (sessionHistory.length > 0) {
        const lastCopy = sessionHistory[sessionHistory.length - 1];
        const timeSinceLastCopy = Date.now() - lastCopy.timestamp;
        
        // Only record as sequence if within 5 minutes (300000ms)
        if (timeSinceLastCopy < 300000 && lastCopy.promptId !== id) {
          recordSequence(lastCopy.promptId, id);
        }
      }
      
      // Add current copy to session history
      const newSessionCopy: SessionCopy = {
        promptId: id,
        timestamp: Date.now(),
        module: prompt.module,
        title: prompt.title
      };
      const updatedSessionHistory = [...sessionHistory, newSessionCopy].slice(-10); // Keep last 10
      setSessionHistory(updatedSessionHistory);
      localStorage.setItem(KEY_SESSION_HISTORY, JSON.stringify(updatedSessionHistory));
      
      // Generate enhanced follow-up suggestions with metadata
      const enhancedSuggestions = getEnhancedSuggestions(id, 3);
      
      setFollowUpMeta(enhancedSuggestions);
      setFollowUpPrompts(enhancedSuggestions.map(s => s.prompt));
      setShowFollowUps(true);
      
      // Check if this is the user's first copy ever
      const hasCompletedFirstCopy = localStorage.getItem(KEY_FIRST_COPY);
      if (!hasCompletedFirstCopy) {
        // Trigger confetti celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#06b6d4', '#f59e0b', '#ec4899'],
        });
        localStorage.setItem(KEY_FIRST_COPY, 'true');
        
        // Show profile setup after first successful copy (if not completed yet)
        if (!isProfileComplete) {
          setTimeout(() => setShowProfileSetup(true), 2000);
        }
      }
      
  trackEvent("prompt_copied", { title: prompt.title, module: prompt.module, utm: utmParams });
    } catch (err) {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = finalText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fieldValues, copyCounts, recentlyCopied, sessionHistory, getEnhancedSuggestions, recordSequence, isProfileComplete]);

  // Copy handler with guardrail for missing fields
  const handleCopy = useCallback(async (prompt: PromptItem) => {
    const missing = getMissingFields(prompt);
    const pid = (prompt as any).id;
    const suppressed = pid ? Boolean(guardrailSuppressPrefs[pid]) : false;
    // Only guard when 2 or more missing fields and not suppressed for this prompt
    if (!suppressed && missing.length >= 2) {
      setMissingFields(missing);
      setGuardrailDontAskAgain(false);
      setShowMissingFieldsPrompt(true);
      trackEvent("copy_guardrail_triggered", { title: prompt.title, missingCount: missing.length });
      updateStats({ guardrailTriggered: 1 });
      return;
    }
    await proceedCopy(prompt);
  }, [getMissingFields, proceedCopy, guardrailSuppressPrefs, updateStats]);

  // Keyboard shortcuts (consolidated)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      
      // ⌘K or Ctrl+K to focus search
      if (modifier && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      
      // ? to show keyboard shortcuts help
      if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
        return;
      }
      
      // i = Inline mode, f = Form mode (only in detail modal and when not typing)
      if (selectedPrompt && !isInputFocused) {
        const pid = (selectedPrompt as any).id;
        if (e.key === 'i') {
          e.preventDefault();
          if (!showInlinePreview) {
            setShowInlinePreview(true);
            try { localStorage.setItem(KEY_INLINE_PREVIEW, JSON.stringify(true)); } catch {}
            if (pid) {
              const next = { ...inlinePreviewPrefs, [pid]: true };
              setInlinePreviewPrefs(next);
              try { localStorage.setItem(KEY_INLINE_PREVIEW_PER_PROMPT, JSON.stringify(next)); } catch {}
            }
            trackEvent('inline_preview_toggled', { enabled: true, title: selectedPrompt.title, source: 'kbd' });
            updateStats({ inlineEnabled: 1 });
            if (!inlineTipSeen) { setInlineTipSeen(true); try { localStorage.setItem(KEY_INLINE_TIP_SEEN, 'true'); } catch {} }
          }
          return;
        }
        if (e.key === 'f') {
          e.preventDefault();
          if (showInlinePreview) {
            setShowInlinePreview(false);
            try { localStorage.setItem(KEY_INLINE_PREVIEW, JSON.stringify(false)); } catch {}
            if (pid) {
              const next = { ...inlinePreviewPrefs, [pid]: false };
              setInlinePreviewPrefs(next);
              try { localStorage.setItem(KEY_INLINE_PREVIEW_PER_PROMPT, JSON.stringify(next)); } catch {}
            }
            trackEvent('inline_preview_toggled', { enabled: false, title: selectedPrompt.title, source: 'kbd' });
            updateStats({ formEnabled: 1 });
            if (!inlineTipSeen) { setInlineTipSeen(true); try { localStorage.setItem(KEY_INLINE_TIP_SEEN, 'true'); } catch {} }
          }
          return;
        }
      }
      
      // Escape to close modals or clear search (priority order)
      if (e.key === 'Escape') {
        if (showKeyboardShortcuts) {
          setShowKeyboardShortcuts(false);
        } else if (showUpgradeModal) {
          setShowUpgradeModal(false);
        } else if (selectedPrompt) {
          setSelectedPrompt(null);
        } else if (showOnboarding) {
          setShowOnboarding(false);
          localStorage.setItem(KEY_ONBOARDED, 'true');
        } else if (showFollowUps) {
          setShowFollowUps(false);
        } else if (search) {
          setSearch('');
          searchInputRef.current?.blur();
        }
        return;
      }
      
      // ⌘Enter or Ctrl+Enter to copy when modal is open
      if (modifier && e.key === 'Enter' && selectedPrompt && !isInputFocused) {
        e.preventDefault();
        handleCopy(selectedPrompt);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPrompt, showOnboarding, showFollowUps, showUpgradeModal, showKeyboardShortcuts, search, handleCopy, showInlinePreview, inlinePreviewPrefs, inlineTipSeen, updateStats]);

  // Export prompt as .txt file
  const handleExport = (prompt: PromptItem) => {
    const fullText = buildFullPrompt(prompt);
    const finalText = applyReplacements(fullText, fieldValues);
    
    // Create filename from prompt title (sanitized)
    const filename = `${prompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    
    // Create blob and download
    const blob = new Blob([finalText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    trackEvent("prompt_exported", { title: prompt.title, module: prompt.module });
  };

  // Generate AI output
  const handleGenerate = async (prompt: PromptItem) => {
    // Check usage limits (free tier) - DISABLED FOR NOW
    // if (generationCount >= FREE_GENERATIONS_PER_MONTH) {
    //   setShowUpgradeModal(true);
    //   trackEvent("generation_limit_hit", { count: generationCount });
    //   return;
    // }

    setIsGenerating(true);
    setGeneratedOutput(null);

    try {
      const fullText = buildFullPrompt(prompt);
      const finalText = applyReplacements(fullText, fieldValues);

      // Call our serverless function
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalText,
          userId: 'free-user', // You'll replace this with actual user ID later
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setGeneratedOutput(data.output);

      // Increment generation count
      const newCount = generationCount + 1;
      setGenerationCount(newCount);
      localStorage.setItem(
        KEY_GENERATION_COUNT,
        JSON.stringify({ count: newCount, month: new Date().toISOString() })
      );

      // Save to outputs history
      const output: GeneratedOutput = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        promptId: (prompt as any).id,
        promptTitle: prompt.title,
        input: finalText,
        output: data.output,
        timestamp: Date.now(),
        model: data.model || 'gpt-4o-mini',
      };

      const newOutputs = [output, ...savedOutputs].slice(0, 50); // Keep last 50
      setSavedOutputs(newOutputs);
      localStorage.setItem(KEY_SAVED_OUTPUTS, JSON.stringify(newOutputs));

      // Confetti on first generation
      if (newCount === 1) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#06b6d4', '#f59e0b', '#ec4899'],
        });
      }

      trackEvent("generation_success", { 
        promptTitle: prompt.title, 
        count: newCount,
        remainingFree: FREE_GENERATIONS_PER_MONTH - newCount 
      });

    } catch (error) {
      console.error('Generation error:', error);
      setGeneratedOutput('⚠️ Generation failed. Please try again.');
      trackEvent("generation_error", { error: String(error) });
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = (promptId: string) => {
    const newFavs = favorites.includes(promptId)
      ? favorites.filter(id => id !== promptId)
      : [...favorites, promptId];
    
    setFavorites(newFavs);
    localStorage.setItem(KEY_FAVORITES, JSON.stringify(newFavs));
    
    // Also sync with "My Favorites" collection
    if (newFavs.includes(promptId)) {
      addToCollection("My Favorites", promptId);
    } else {
      // Remove from My Favorites collection
      const updatedCollections = {
        ...collections,
        "My Favorites": (collections["My Favorites"] || []).filter(id => id !== promptId)
      };
      setCollections(updatedCollections);
      localStorage.setItem(KEY_COLLECTIONS, JSON.stringify(updatedCollections));
    }
    
    trackEvent("favorite_toggled", { promptId, action: newFavs.includes(promptId) ? "add" : "remove" });
  };

  // Toggle dark mode (3-state: light → dark → auto)
  const toggleDarkMode = () => {
    const savedDarkMode = localStorage.getItem(KEY_DARK_MODE);
    
    if (savedDarkMode === null) {
      // Currently auto, user in light mode → switch to dark
      setDarkMode(true);
      localStorage.setItem(KEY_DARK_MODE, 'true');
      document.body.classList.add('dark-mode');
      trackEvent("dark_mode_toggled", { enabled: true, mode: 'dark' });
    } else if (savedDarkMode === 'true') {
      // Currently dark → switch to light
      setDarkMode(false);
      localStorage.setItem(KEY_DARK_MODE, 'false');
      document.body.classList.remove('dark-mode');
      trackEvent("dark_mode_toggled", { enabled: false, mode: 'light' });
    } else {
      // Currently light → switch to auto (system preference)
      localStorage.removeItem(KEY_DARK_MODE);
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(systemPrefersDark);
      document.body.classList.toggle('dark-mode', systemPrefersDark);
      trackEvent("dark_mode_toggled", { enabled: systemPrefersDark, mode: 'auto' });
    }
  };

  // Add prompt to collection
  const addToCollection = (collectionName: string, promptId: string) => {
    const updatedCollections = {
      ...collections,
      [collectionName]: [...(collections[collectionName] || []), promptId].filter((id, idx, arr) => arr.indexOf(id) === idx)
    };
    setCollections(updatedCollections);
    localStorage.setItem(KEY_COLLECTIONS, JSON.stringify(updatedCollections));
    trackEvent("prompt_added_to_collection", { collectionName, promptId });
  };

  // Duplicate prompt (create custom version)
  const duplicatePrompt = (prompt: PromptItem) => {
    const customId = `custom-${Date.now()}`;
    const duplicated: any = {
      ...prompt,
      id: customId,
      title: `${prompt.title} (My Version)`,
      module: "My Custom Prompts",
      tags: [...((prompt as any).tags || []), "custom"],
    };
    
    const updatedCustomPrompts = [...customPrompts, duplicated];
    setCustomPrompts(updatedCustomPrompts);
    localStorage.setItem(KEY_CUSTOM_PROMPTS, JSON.stringify(updatedCustomPrompts));
    
    // Auto-select the new custom prompt for editing
    setSelectedPrompt(duplicated);
    showToast("✨ Custom version created!");
    trackEvent("prompt_duplicated", { originalId: (prompt as any).id, customId });
  };

  // Show toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Select prompt for detail view
  const selectPrompt = (prompt: PromptItem) => {
    setSelectedPrompt(prompt);
    
    // Pre-fill field values from saved fields
    const placeholders = extractPlaceholders(prompt);
    const prefilledValues: Record<string, string> = {};
    placeholders.forEach(ph => {
      if (savedFieldValues[ph]) {
        prefilledValues[ph] = savedFieldValues[ph];
      }
    });
    
    setFieldValues(prefilledValues);
    setCurrentFieldIndex(0);
    // Initialize inline preview from per-prompt prefs (fallback to current global)
    try {
      const pid = (prompt as any).id;
      if (pid && inlinePreviewPrefs && Object.prototype.hasOwnProperty.call(inlinePreviewPrefs, pid)) {
        setShowInlinePreview(Boolean(inlinePreviewPrefs[pid]));
      }
    } catch {}
    trackEvent("prompt_selected", { title: prompt.title });
  };
  
  // Update field value and save to localStorage
  const updateFieldValue = (field: string, value: string) => {
    // Immediately update the field value for responsive typing
    setFieldValues(prev => ({ ...prev, [field]: value }));
  };
  
  // Debounced save to localStorage (avoid disrupting typing)
  const debouncedSaveFieldValue = useCallback((field: string, value: string) => {
    if (value.trim()) {
      const newSavedFields = { ...savedFieldValues, [field]: value };
      setSavedFieldValues(newSavedFields);
      localStorage.setItem(KEY_SAVED_FIELDS, JSON.stringify(newSavedFields));
      
      // Update field history (keep last 5 unique values per field)
      const currentHistory = fieldHistory[field] || [];
      const newHistory = [value, ...currentHistory.filter(v => v !== value)].slice(0, 5);
      const updatedHistory = { ...fieldHistory, [field]: newHistory };
      setFieldHistory(updatedHistory);
      localStorage.setItem(KEY_FIELD_HISTORY, JSON.stringify(updatedHistory));
    }
  }, [savedFieldValues, fieldHistory]);
  
  // Save field values after user stops typing (500ms debounce)
  const debouncedSave = useDebounce(fieldValues, 500);
  useEffect(() => {
    Object.entries(debouncedSave).forEach(([field, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        debouncedSaveFieldValue(field, value);
      }
    });
  }, [debouncedSave, debouncedSaveFieldValue]);

  // Animated house + lightning bolt icon
  const LoadingOverlay = () => (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000, animation:'fadeIn 160ms ease-out' }}>
      <div style={{ background:'var(--surface)', padding:32, borderRadius:16, width:'min(520px,90vw)', display:'flex', flexDirection:'column', alignItems:'center', gap:16, border:'1px solid var(--border)', boxShadow:'var(--shadow-lg)' }}>
        <div style={{ fontWeight:800, fontSize:16 }}>Preparing your AI-generated content…</div>
        <div style={{ fontSize:13, color:'var(--muted)', textAlign:'center' }}>Optimizing prompt and assembling structured output.</div>
        <div style={{ width:'100%', height:6, background:'var(--surface-hover)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ width:'40%', height:'100%', background:'linear-gradient(90deg,var(--primary),var(--accent))', animation:'pulse 1.2s infinite alternate' }} />
        </div>
      </div>
    </div>
  );

  // ------- Wizard Config -------
  type WizardChallenge = {
    key: string;
    label: string;
    description: string;
    defaultPromptTitle: string;
    questions: { id: string; label: string; placeholder?: string; help?: string }[];
    followups: string[];
  };

  const CHALLENGES: WizardChallenge[] = [
    {
      key: 'lead-gen',
      label: 'Lead Generation',
      description: 'Pick a channel and goal to start booking appointments',
      defaultPromptTitle: '90-Day Inbound Lead Blueprint',
      questions: [
        { id: 'market', label: 'Your market/city', placeholder: 'e.g., Austin, TX', help: 'Example: "Austin, TX – focus on downtown condos."' },
        { id: 'niche', label: 'Your niche (optional)', placeholder: 'first-time buyers, luxury, investors', help: 'Example: "First-time buyers and young professionals."' },
        { id: 'channel', label: 'Primary channel', placeholder: 'Instagram, Email, Cold outreach', help: 'Example: "Instagram and a weekly email newsletter."' },
      ],
      followups: ['Landing Page CRO Audit', '7-Day Follow-Up Sequence']
    },
    {
      key: 'listing',
      label: 'Listing Launch',
      description: 'Create high-converting property copy and launch assets',
      defaultPromptTitle: 'Listing Description That Converts',
      questions: [
        { id: 'propertyType', label: 'Property type', placeholder: '3-bed single family, condo, townhome', help: 'Example: "Luxury 2BR condo with rooftop deck."' },
        { id: 'area', label: 'Area (address or neighborhood)', placeholder: 'e.g., Bouldin Creek, Austin', help: 'Example: "Bouldin Creek near South Congress."' },
        { id: 'features', label: '3–5 standout features', placeholder: 'chef kitchen, rooftop deck, EV charger', help: 'Example: "Chef kitchen, EV charger, floor-to-ceiling windows."' },
        { id: 'tier', label: 'Positioning tier', placeholder: 'entry-level, mid-range, luxury', help: 'Example: "Luxury tier targeting move-up buyers."' },
      ],
      followups: ['Open House Promo Pack', 'Pricing Strategy Script']
    },
    {
      key: 'followup',
      label: 'Follow-Up',
      description: 'Turn more leads into conversations with timely messages',
      defaultPromptTitle: '7-Day Follow-Up Sequence',
      questions: [
        { id: 'leadSource', label: 'Lead source', placeholder: 'Zillow, open house, IG DM, referral', help: 'Example: "Zillow inquiry after open house."' },
        { id: 'tone', label: 'Tone', placeholder: 'helpful, direct, friendly', help: 'Example: "Friendly but confident."' },
        { id: 'cadence', label: 'Cadence', placeholder: '7 days, 14 days', help: 'Example: "Every 7 days for 3 weeks."' },
      ],
      followups: ['Review-to-Referral Bridge', 'Home-Anniversary Automation']
    },
    {
      key: 'social',
      label: 'Social Content',
      description: 'Publish a month of content without the overwhelm',
      defaultPromptTitle: 'Instagram Reels Calendar (30 Days)',
      questions: [
        { id: 'niche', label: 'Audience/niche', placeholder: 'relocators, luxury, first-time buyers', help: 'Example: "First-time buyers relocating to Austin."' },
        { id: 'goal', label: 'Primary goal', placeholder: 'reach, replies, appointments', help: 'Example: "Book appointments (DM replies)."' },
      ],
      followups: ['90-Day Inbound Lead Blueprint']
    },
    {
      key: 'buyer-prep',
      label: 'Buyer Prep',
      description: 'Set clear expectations and win in competitive markets',
      defaultPromptTitle: 'Buyer Onboarding Journey',
      questions: [
        { id: 'market', label: 'Your market/city', placeholder: 'e.g., Denver, CO', help: 'Example: "Denver – Highlands neighborhood focus."' },
        { id: 'price', label: 'Price range (optional)', placeholder: '$400k–$700k', help: 'Example: "$450k–$650k typical."' },
        { id: 'urgency', label: 'Urgency', placeholder: 'moving in 60 days, just browsing', help: 'Example: "Must move in 60 days for job transfer."' },
      ],
      followups: ['Multiple-Offer Strategy', 'Needs-Match Matrix']
    },
    {
      key: 'systems',
      label: 'Time & Systems',
      description: 'Get your week under control and free up time',
      defaultPromptTitle: 'Weekly Productivity Audit',
      questions: [
        { id: 'topGoal', label: 'Top outcome this week', placeholder: 'book 5 appts, prep new listing', help: 'Example: "Book 5 buyer consults & prep one new listing."' },
        { id: 'timePerDay', label: 'Time available per day', placeholder: 'e.g., 90 minutes', help: 'Example: "~90 minutes of focused time daily."' },
      ],
      followups: ['90-Day Inbound Lead Blueprint']
    },
    {
      key: 'client',
      label: 'Client Management & Negotiation',
      description: 'Handle expectations and negotiate winning deals',
      defaultPromptTitle: 'Client Communication & Negotiation Strategy',
      questions: [
        { id: 'situation', label: 'Current client situation', placeholder: 'e.g., buyer losing offers, seller stalling', help: 'Example: "Buyer has lost 3 offers in competitive mid-range segment."' },
        { id: 'clientType', label: 'Client type', placeholder: 'first-time buyer, luxury seller, investor', help: 'Example: "First-time buyer relocating for tech job."' },
        { id: 'obstacle', label: 'Biggest obstacle', placeholder: 'pricing, emotions, slow response', help: 'Example: "Emotional decision-making causing overbidding hesitation."' },
      ],
      followups: ['Multiple-Offer Strategy']
    },
    {
      key: 'productivity',
      label: 'Productivity & Organization',
      description: 'Prioritize, structure, and systemize your week',
      defaultPromptTitle: 'Personal Productivity Systems Builder',
      questions: [
        { id: 'topGoal', label: 'Primary outcome this quarter', placeholder: 'increase listings, close 15 transactions', help: 'Example: "Close 12 transactions with 3 new listings."' },
        { id: 'timeBlocks', label: 'Existing time blocks', placeholder: 'prospecting AM, admin Fri', help: 'Example: "Prospecting 8-9am, admin Friday afternoons."' },
        { id: 'biggestBlocker', label: 'Biggest blocker', placeholder: 'context switching, procrastination', help: 'Example: "Context switching between CRM + email kills focus."' },
      ],
      followups: ['Weekly Productivity Audit']
    },
    {
      key: 'market',
      label: 'Market Knowledge & Strategy',
      description: 'Position clients and your brand ahead of shifts',
      defaultPromptTitle: 'Local Market Trend Briefing',
      questions: [
        { id: 'market', label: 'Your market', placeholder: 'e.g., Phoenix AZ metro', help: 'Example: "Phoenix AZ – East Valley focus."' },
        { id: 'shiftConcern', label: 'Shift or trend concern', placeholder: 'inventory drop, rates rising', help: 'Example: "Inventory tightening + rising rates causing buyer hesitation."' },
        { id: 'strategicGoal', label: 'Strategic goal', placeholder: 'educate buyers, attract listings', help: 'Example: "Educate move-up buyers & attract listing consultations."' },
      ],
      followups: ['Pricing Strategy Script']
    },
    {
      key: 'custom',
      label: 'Your Custom Challenge',
      description: 'Refine and turn your unique situation into a powerful prompt',
      defaultPromptTitle: 'Tailored Strategy & Action Plan',
      questions: [
        { id: 'challengeSummary', label: 'Brief summary', placeholder: 'What is happening?', help: 'Example: "Past clients not engaging with quarterly updates."' },
        { id: 'desiredOutcome', label: 'Desired outcome', placeholder: 'What success looks like', help: 'Example: "Re-engage 30% of past clients & book 5 reviews."' },
        { id: 'blockers', label: 'Current blockers', placeholder: 'list 1–2', help: 'Example: "Low email open rate, weak CTA."' },
      ],
      followups: []
    },
  ];

  // Consolidated high-level challenge categories (tap-friendly)
  const CHALLENGE_CATEGORIES = [
    { key: 'lead-gen', label: 'Lead Generation & Conversion', examples: ['Generating leads','Converting leads','Referral network','Social media','Open houses'] },
    { key: 'listing', label: 'Listing & Marketing', examples: ['Low inventory','Pricing','Listing marketing','Presentations','Reviews'] },
    { key: 'client', label: 'Client Management & Negotiation', examples: ['Expectations','Negotiations','Multiple offers','Luxury + first-time','Retention'] },
    { key: 'productivity', label: 'Productivity & Organization', examples: ['Time management','Organization','Paperwork','Work/life','Scaling'] },
    { key: 'market', label: 'Market Knowledge & Strategy', examples: ['Trends','Shifts','Competition','Branding','Faster closings'] },
  ];

  const startWizard = React.useCallback(() => {
    setWizardOpen(true);
    setWizardStep(1);
    setWizardChallenge(null);
    setWizardResultText("");
    setWizardSelectedPrompt(null);
    // Only reset answers if wizard is not already open
    setWizardAnswers({});
    trackEvent('rpv:wizard_start');
  }, []);

  const dismissWizard = () => {
    setWizardOpen(false);
    try { localStorage.setItem(KEY_WIZARD_DISMISSED, 'true'); } catch {}
  };

  const selectChallenge = (key: string) => {
    setWizardChallenge(key);
    setWizardStep(2);
    trackEvent('rpv:wizard_category_select', { challenge: key });
    // Pre-select a couple sensible defaults if present to reduce friction
    try {
      const cfg = CHALLENGES.find(c => c.key === key);
      if (!cfg) return;
      const defaults: Record<string, string[]> = {};
      if (cfg.questions.some(q => q.id === 'tone')) {
        defaults['tone'] = ['Helpful'];
      }
      if (cfg.questions.some(q => q.id === 'cadence')) {
        defaults['cadence'] = ['Weekly'];
      }
      if (Object.keys(defaults).length) {
        setWizardSelections(prev => ({ ...prev, ...defaults }));
        setWizardAnswers(prev => {
          const next = { ...prev } as Record<string, string>;
          Object.entries(defaults).forEach(([id, values]) => {
            const custom = (prev[id + '_custom'] || '').trim();
            next[id] = [...values, custom].filter(Boolean).join(', ');
          });
          return next;
        });
      }
    } catch {}
  };

  const findPromptByTitle = (title: string): PromptItem | null => {
    const p = allPrompts.find((pp: any) => (pp.title || '').toLowerCase() === title.toLowerCase());
    return p || null;
  };


  const completeDrilldown = () => {
    if (!wizardChallenge) return;
    const config = CHALLENGES.find(c => c.key === wizardChallenge);
    if (!config) return;
    const prompt = findPromptByTitle(config.defaultPromptTitle);
    setWizardSelectedPrompt(prompt);
    const base = prompt ? buildFullPrompt(prompt) : 'You are an expert real estate marketing assistant.';
    const finalText = buildEnhancedWizardPrompt(base, wizardChallenge, wizardAnswers);
    setWizardResultText(finalText);
    setWizardStep(3);
    const answerMeta = Object.entries(wizardAnswers).filter(([k]) => !k.endsWith('_custom')).map(([k, v]) => ({ k, len: (v || '').length }));
    trackEvent('rpv:wizard_generate', { challenge: wizardChallenge, answers: answerMeta, totalChars: answerMeta.reduce((s, a) => s + a.len, 0) });
    const { score, suggestions } = computeQualityMeta(wizardAnswers, config);
    trackEvent('rpv:wizard_quality_generate', { challenge: wizardChallenge, score, suggestionsRemaining: suggestions });
  };
  // (Quality meta helper removed; using inline meter only)

  const copyAndOpenGPT = async () => {
    try {
      await navigator.clipboard.writeText(wizardResultText);
      trackEvent('rpv:wizard_prompt_copy', { challenge: wizardChallenge, length: wizardResultText.length });
      if (GPT_STORE_URL) {
        trackEvent('rpv:cta_gpt_click', { label: 'wizard_result', variant: wizardCTAVariant });
        window.open(GPT_STORE_URL as string, '_blank');
      }
    } catch {}
  };

  const WizardModal: React.FC = () => {
    if (!wizardOpen) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: 'var(--surface)', color: 'var(--text)', width: 'min(720px, 96vw)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>From blank page to ready-to-use in 60 seconds</h2>
            <button onClick={dismissWizard} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }} aria-label="Close wizard">×</button>
          </div>
          <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: 14 }}>Tell us your challenge, we’ll drill down, and hand you the perfect prompt to paste into ChatGPT.</p>

          {wizardStep === 1 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
                {CHALLENGE_CATEGORIES.map(cat => (
                  <button key={cat.key} onClick={() => selectChallenge(cat.key)} style={{ textAlign: 'left', padding: 16, background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'all 160ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>{cat.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{cat.examples.join(', ')}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <input
                  type="text"
                  placeholder="Or describe your unique challenge..."
                  value={wizardCustomChallenge}
                  onChange={(e) => setWizardCustomChallenge(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', marginTop: 8 }}
                />
                {wizardCustomChallenge && (
                  <button onClick={() => { trackEvent('rpv:wizard_custom_challenge_submit', { chars: wizardCustomChallenge.length }); setWizardChallenge('custom'); setWizardStep(2); }} style={{ marginTop: 10, background: 'var(--primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontWeight: 800 }}>Use my challenge →</button>
                )}
              </div>
              <div style={{ marginTop: 12, textAlign: 'right' }}>
                <button onClick={dismissWizard} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>Skip and browse the library →</button>
              </div>
            </div>
          )}

          {wizardStep === 2 && wizardChallenge && (
            <div>
              {(() => {
                const c = CHALLENGES.find(x => x.key === wizardChallenge)!;
                return (
                  <div>
                    <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 800 }}>{c.label}</h3>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                      Provide complete, specific answers (full sentences are best). The more context, the stronger your tailored prompt.<br />
                      <b>Tip:</b> Mention audience, timeframe, tone, and any constraints.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {c.questions.map(q => (
                        <div key={q.id}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{q.label}</label>
                          {WIZARD_OPTION_SETS[q.id] ? (
                            <>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                {WIZARD_OPTION_SETS[q.id].map(opt => {
                                  const active = (wizardSelections[q.id] || []).includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => toggleWizardChip(q.id, opt)}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: 999,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        border: '1px solid ' + (active ? 'var(--primary)' : 'var(--border)'),
                                        background: active ? 'var(--primary)' : 'var(--surface-hover)',
                                        color: active ? 'var(--text-inverse)' : 'var(--text)',
                                        fontWeight: 600
                                      }}
                                    >{opt}</button>
                                  );
                                })}
                              </div>
                              <input
                                type="text"
                                placeholder={q.placeholder + ' (add custom)'}
                                value={wizardAnswers[q.id + '_custom'] || ''}
                                onChange={(e) => updateWizardCustomForQuestion(q.id, e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                              />
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                                Selected: {wizardAnswers[q.id] || 'None'}
                              </div>
                              {q.help && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{q.help}</div>}
                              {(/goal|desiredOutcome|topGoal|situation|challengeSummary/i.test(q.id)) && (
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontStyle: 'italic' }}>
                                  What good looks like: specific, measurable, with a timeframe. E.g., "Book 5 consults in 30 days."
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <input
                                type="text"
                                placeholder={q.placeholder}
                                value={wizardAnswers[q.id] || ''}
                                onChange={(e) => setWizardAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                              />
                              {q.help && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{q.help}</div>}
                              {(/goal|desiredOutcome|topGoal|situation|challengeSummary/i.test(q.id)) && (
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontStyle: 'italic' }}>
                                  What good looks like: specific, measurable, with a timeframe. E.g., "Book 5 consults in 30 days."
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {(() => {
                      // Quality meter evaluation
                      const answerEntries = Object.entries(wizardAnswers).filter(([k]) => !k.endsWith('_custom'));
                      const nonEmpty = answerEntries.filter(([, v]) => String(v).trim().length > 0);
                      const lenTotal = nonEmpty.reduce((s, [, v]) => s + v.length, 0);
                      const hasGoal = /goal|topGoal|desiredOutcome|strategicGoal/.test(nonEmpty.map(([k]) => k).join(','));
                      const hasBlocker = /obstacle|blocker|blockers|biggestBlocker|shiftConcern/.test(nonEmpty.map(([k]) => k).join(','));
                      const hasSituation = /market|propertyType|challengeSummary|situation|clientType/.test(nonEmpty.map(([k]) => k).join(','));
                      const hasTone = /tone/.test(nonEmpty.map(([k]) => k).join(','));
                      const hasTimeframe = /urgency|cadence|timeframe/.test(nonEmpty.map(([k]) => k).join(','));
                      // Scoring weights
                      let score = 0;
                      if (hasSituation) score += 25;
                      if (hasGoal) score += 20;
                      if (hasBlocker) score += 20;
                      if (hasTone) score += 10;
                      if (hasTimeframe) score += 10;
                      // Length bonus (up to 15)
                      const lengthBonus = Math.min(15, Math.floor(lenTotal / 140 * 15));
                      score += lengthBonus;
                      const tier = score >= 85 ? 'Excellent' : score >= 65 ? 'Strong' : score >= 45 ? 'Moderate' : 'Needs More Detail';
                      const suggestions: string[] = [];
                      if (!hasSituation) suggestions.push('Describe your market or core situation.');
                      if (!hasGoal) suggestions.push('Add a clear, measurable goal.');
                      if (!hasBlocker) suggestions.push('Mention the biggest blocker or obstacle.');
                      if (!hasTimeframe) suggestions.push('Add urgency or timeframe (e.g., 30 days).');
                      if (!hasTone) suggestions.push('Specify tone (friendly, authoritative, etc.).');
                      if (lengthBonus < 8) suggestions.push('Provide fuller sentence answers for depth.');
                      return (
                        <div style={{ marginTop: 18, border: '1px solid var(--border)', borderRadius: 12, padding: 12, background: 'var(--surface-hover)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>Quality Meter</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: tier === 'Excellent' ? 'var(--primary)' : tier === 'Strong' ? 'var(--accent)' : 'var(--warn, #d97706)' }}>{tier}</div>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <div style={{ height: 6, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(score, 100)}%`, height: '100%', background: score >= 85 ? 'var(--primary)' : score >= 65 ? 'var(--accent)' : score >= 45 ? 'orange' : 'var(--border)' }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Score {score}/100 · Inputs filled {nonEmpty.length}/{c.questions.length}</div>
                          </div>
                          {suggestions.length > 0 && (
                            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                              {suggestions.slice(0, 4).map(s => <li key={s}>{s}</li>)}
                            </ul>
                          )}
                          {!hasTimeframe && (
                            <div style={{ marginTop: 8 }}>
                              <span style={{ fontSize: 11, color: 'var(--muted)', marginRight: 6 }}>Quick add timeframe:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  // Prefer urgency/timeframe/cadence in that order
                                  const tfId = (c.questions.find(q => q.id === 'urgency')?.id)
                                    || (c.questions.find(q => q.id === 'timeframe')?.id)
                                    || (c.questions.find(q => q.id === 'cadence')?.id);
                                  if (!tfId) return;
                                  if (WIZARD_OPTION_SETS[tfId]) {
                                    // Set chip and answer
                                    setWizardSelections(prev => ({ ...prev, [tfId]: ['Next 30 days'] }));
                                    setWizardAnswers(prev => ({ ...prev, [tfId]: ['Next 30 days', (prev[tfId + '_custom'] || '').trim()].filter(Boolean).join(', ') }));
                                  } else {
                                    setWizardAnswers(prev => ({ ...prev, [tfId]: 'Next 30 days' }));
                                  }
                                  trackEvent('rpv:wizard_quick_timeframe', { id: tfId, value: 'Next 30 days' });
                                }}
                                style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--badge-bg)' }}
                              >Next 30 days</button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                      <button onClick={() => setWizardStep(1)} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}>← Back</button>
                      <button onClick={completeDrilldown} style={{ background: 'var(--primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontWeight: 800 }}>See my tailored prompt →</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {wizardStep === 3 && (
            <div>
              <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 800 }}>Your tailored prompt</h3>
              <div style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                {wizardResultText}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={copyAndOpenGPT} style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'var(--text-inverse)', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 800, cursor: 'pointer' }}>
                  Copy & Open ChatGPT →
                </button>
                {wizardSelectedPrompt && (
                  <button onClick={() => { setSelectedPrompt(wizardSelectedPrompt!); setWizardOpen(false); }} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>Edit in app</button>
                )}
                <button onClick={dismissWizard} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer' }}>Close</button>
              </div>
              {/* Refinement cues as 1-click chips */}
              {(() => {
                const cues: string[] = [];
                const lc = (txt: string) => (txt || '').toLowerCase();
                const market = wizardAnswers['market'] || wizardAnswers['area'] || '';
                const tone = wizardAnswers['tone'] || '';
                // Generic helpful cues
                cues.push('Make it more concise (keep core actions)');
                if (market) cues.push(`Add one local market stat for ${market}`);
                cues.push('Turn Objectives into SMART goals');
                if (tone) cues.push(`Rewrite with a more ${lc(tone)} tone`);
                cues.push('Generate 3 compelling subject lines');
                return (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Refine with 1 click</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {cues.map(c => (
                        <button
                          key={c}
                          onClick={async () => {
                            const appended = `${wizardResultText}\n\nRefinement request: ${c}`;
                            try {
                              await navigator.clipboard.writeText(appended);
                              trackEvent('rpv:wizard_refinement_cue_copy', { cue: c });
                              if (GPT_STORE_URL) window.open(GPT_STORE_URL as string, '_blank');
                            } catch {}
                          }}
                          style={{ padding: '8px 12px', background: 'var(--badge-bg)', border: '1px solid var(--border)', borderRadius: 999, cursor: 'pointer', fontSize: 12 }}
                        >{c}</button>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {wizardChallenge && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Next best actions</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {CHALLENGES.find(c => c.key === wizardChallenge)!.followups.map(f => (
                      <button key={f} onClick={() => { trackEvent('rpv:followup_prompt_click', { label: f, source: 'wizard' }); const p = allPrompts.find((pp: any) => (pp.title || '').toLowerCase() === f.toLowerCase()); if (p) { setSelectedPrompt(p); setWizardOpen(false); } }}
                        style={{ padding: '8px 12px', background: 'var(--badge-bg)', border: '1px solid var(--border)', borderRadius: 999, cursor: 'pointer', fontSize: 12 }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Lightweight Admin Dashboard: listen to rpv_event when ?admin=1
  const [showAdminDashboard] = useState<boolean>(() => typeof window !== 'undefined' && window.location.search.includes('admin=1'));
  const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState(() => ({
      categories: {} as Record<string, number>,
      generates: 0,
      copies: 0,
      qualityGenerates: 0,
      avgGenerateScore: 0,
      qualityThresholds: { 45: 0, 65: 0, 85: 0 } as Record<number, number>,
    }));
    useEffect(() => {
      const handler = (e: Event) => {
        const { name, data } = (e as CustomEvent).detail || {};
        setStats(prev => {
          const next = { ...prev, categories: { ...prev.categories }, qualityThresholds: { ...prev.qualityThresholds } };
          if (name === 'rpv:wizard_category_select') {
            const c = data?.challenge || 'unknown';
            next.categories[c] = (next.categories[c] || 0) + 1;
          } else if (name === 'rpv:wizard_generate') {
            next.generates += 1;
          } else if (name === 'rpv:wizard_prompt_copy') {
            next.copies += 1;
          } else if (name === 'rpv:wizard_quality_generate') {
            next.qualityGenerates += 1;
            const score = Number(data?.score || 0);
            const n = next.qualityGenerates;
            next.avgGenerateScore = Math.round(((prev.avgGenerateScore * (n - 1)) + score) / n);
          } else if (name === 'rpv:wizard_quality_threshold') {
            const to = Number(data?.to);
            if (to === 45 || to === 65 || to === 85) next.qualityThresholds[to] = (next.qualityThresholds[to] || 0) + 1;
          }
          return next;
        });
      };
      window.addEventListener('rpv_event', handler as any);
      return () => window.removeEventListener('rpv_event', handler as any);
    }, []);
    return (
      <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 5000, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, boxShadow: 'var(--shadow-lg)', minWidth: 240 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>Admin Dashboard</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          <div><strong>Generates</strong><div>{stats.generates}</div></div>
          <div><strong>Copies</strong><div>{stats.copies}</div></div>
          <div><strong>Qual. Gen</strong><div>{stats.qualityGenerates}</div></div>
          <div><strong>Avg Score</strong><div>{stats.avgGenerateScore}</div></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <strong>Thresholds</strong>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span>45: {stats.qualityThresholds[45]}</span>
              <span>65: {stats.qualityThresholds[65]}</span>
              <span>85: {stats.qualityThresholds[85]}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // (Duplicate LoadingOverlay removed)

  return (
    <>
      <WizardModal />
      {isGenerating && <LoadingOverlay />}
      <div className="rpv-app rpv-container">
      {!isEmbedMode && (
        <header className="rpv-header" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="title" style={{ margin: 0 }}>🏡 AI Prompt Vault</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GPT_STORE_URL && (
                <button
                  onClick={() => { trackEvent('rpv:cta_gpt_click', { label: 'header', variant: wizardCTAVariant }); window.open(GPT_STORE_URL as string, '_blank'); }}
                  style={{ padding: '10px 14px', background: 'linear-gradient(135deg,var(--primary) 0%, var(--accent) 100%)', border: '2px solid var(--primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text-inverse)' }}
                >
                  🧠 Use in ChatGPT →
                </button>
              )}
              <button
                onClick={startWizard}
                style={{ padding: '10px 14px', background: 'var(--surface-hover)', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
              >
                🧭 Start Wizard
              </button>
              {isProfileComplete && (
                <button
                  onClick={() => setShowProfileSetup(true)}
                  style={{ padding: '10px 14px', background: 'var(--surface-hover)', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  👤 Profile
                </button>
              )}
              <button
                onClick={toggleDarkMode}
                style={{ padding: '10px 14px', background: 'var(--surface-hover)', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 16, fontWeight: 600, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 160ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--surface-elevated)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.35)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                title={(() => {
                  try {
                    const saved = localStorage.getItem(KEY_DARK_MODE);
                    if (saved === null) return `Auto mode (currently ${darkMode ? 'dark' : 'light'}). Click to switch to ${darkMode ? 'light' : 'dark'} mode.`;
                    return saved === 'true' ? 'Dark mode. Click to switch to light.' : 'Light mode. Click to switch to auto.';
                  } catch { return 'Toggle dark mode'; }
                })()}
                aria-label="Toggle dark mode"
                aria-pressed={(() => {
                  try {
                    const saved = localStorage.getItem(KEY_DARK_MODE);
                    if (saved === null) return 'mixed' as any; // tri-state: auto
                    return saved === 'true';
                  } catch { return false; }
                })()}
              >
                {(() => {
                  try {
                    const saved = localStorage.getItem(KEY_DARK_MODE);
                    const icon = darkMode ? '☀️' : '🌙';
                    if (saved === null) {
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', marginRight: 6, border: '1px solid var(--border)', borderRadius: 6, padding: '0 4px', lineHeight: '14px' }}>A</span>
                          {icon}
                        </span>
                      );
                    }
                    return icon;
                  } catch {
                    return darkMode ? '☀️' : '🌙';
                  }
                })()}
              </button>
            </div>
          </div>
        </header>
      )}
        <p className="subtitle" style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
          Marketing plans, listing copy & lead generation — ready in seconds
        </p>
        {lastUpdated && (
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
            ✨ Last updated: {lastUpdated}
          </p>
        )}

        {/* Search Bar */}
        <div style={{ maxWidth: 640, position: "relative", marginBottom: 20 }}>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Try: listing description, social media, lead generation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rpv-search-hero"
            style={{
              width: "100%",
              fontSize: 16,
              padding: "14px 20px",
              paddingRight: search ? "20px" : "120px",
              borderRadius: "var(--radius-pill)",
              border: "2px solid var(--border)",
              background: "var(--surface)",
              fontFamily: "var(--font-stack)",
            }}
          />
          {!search && (
            <span
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 12,
                color: "var(--muted)",
                pointerEvents: "none",
              }}
            >
              Press <kbd style={{ 
                padding: "2px 6px", 
                background: "var(--badge-bg)", 
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600 
              }}>⌘K</kbd> to search
            </span>
          )}
        </div>

        {/* Active filters */}
        {(activeTag || search) && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Active filters:</span>
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="filter-pill"
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--primary)",
                  color: "var(--text-inverse)",
                  border: "none",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                #{activeTag} <span style={{ fontSize: 14 }}>×</span>
              </button>
            )}
            {(search || activeTag) && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveTag(null);
                }}
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear all
              </button>
            )}
          </div>
        )}
      

      {/* Usage Dashboard - only show if user has activity */}
      {!search && !activeTag && !activeCollection && (
        Object.values(copyCounts).reduce((sum, count) => sum + count, 0) > 0 ||
        favorites.length > 0 ||
        recentlyCopied.length > 0
      ) && (
        <section style={{ 
          marginBottom: 32,
          padding: 20,
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-hover) 100%)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          animation: "fadeIn 400ms ease-out",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
            📊 Your Activity
          </h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)", marginBottom: 4 }}>
                {Object.values(copyCounts).reduce((sum, count) => sum + count, 0)}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                Prompts Copied
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--success)", marginBottom: 4 }}>
                {favorites.length}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                Favorites
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--warning)", marginBottom: 4 }}>
                {recentlyCopied.length}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                Recently Used
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--purple)", marginBottom: 4 }}>
                {Object.keys(collections).length}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                Collections
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recently Copied (if exists and not searching) */}
      {recentPrompts.length > 0 && !search && !activeTag && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
            ⚡ Recently Copied
          </h2>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
            {recentPrompts.map((prompt: any) => (
              <button
                key={prompt.id}
                onClick={() => selectPrompt(prompt)}
                className="recent-chip"
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--surface-hover)",
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 180ms ease",
                }}
              >
                {prompt.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Collections Filter */}
      {Object.keys(collections).length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Collections:</span>
            {Object.keys(collections).map((collectionName) => (
              <button
                key={collectionName}
                onClick={() => setActiveCollection(activeCollection === collectionName ? null : collectionName)}
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  background: activeCollection === collectionName ? "var(--primary)" : "var(--surface-hover)",
                  color: activeCollection === collectionName ? "var(--surface)" : "var(--text)",
                  border: "none",
                  borderRadius: "var(--radius-pill)",
                  cursor: "pointer",
                  transition: "all 160ms ease",
                  transform: "scale(1)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                📁 {collectionName} ({collections[collectionName].length})
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Featured Prompts for New Users */}
      {!search && !activeTag && !activeCollection && Object.values(copyCounts).reduce((sum, count) => sum + count, 0) === 0 && (
        <section style={{ 
          marginBottom: 32,
          padding: 24,
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.08) 100%)",
          borderRadius: "var(--radius-md)",
          border: "2px solid var(--primary)",
          animation: "fadeIn 500ms ease-out",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            ⭐ Start Here - Most Popular
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>
            These prompts help agents get results fast. Pick one to try:
          </p>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {[
              {
                title: "90-Day Inbound Lead Blueprint",
                emoji: "🎯",
                description: "Complete marketing plan to generate consistent leads",
                tag: "marketing"
              },
              {
                title: "Listing Description That Converts",
                emoji: "✍️",
                description: "Write compelling property descriptions that sell",
                tag: "listing"
              },
              {
                title: "Instagram Reels Calendar (30 Days)",
                emoji: "📱",
                description: "Month of social content ideas ready to post",
                tag: "social"
              }
            ].map((featured) => {
              const prompt = allPrompts.find((p: any) => p.title === featured.title);
              if (!prompt) return null;
              
              return (
                <button
                  key={featured.title}
                  onClick={() => selectPrompt(prompt)}
                  style={{
                    padding: 20,
                    background: "var(--surface)",
                    border: "2px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{featured.emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                    {featured.title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
                    {featured.description}
                  </div>
                  <div style={{ 
                    display: "inline-block",
                    padding: "4px 10px",
                    background: "var(--badge-bg)",
                    color: "var(--primary)",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    #{featured.tag}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Hot Right Now / Search Results */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
            {activeTag 
              ? `#${activeTag} (${filteredPrompts.length})` 
              : search 
              ? `Search Results (${filteredPrompts.length})` 
              : Object.values(copyCounts).reduce((sum, count) => sum + count, 0) > 0
              ? "🔥 Hot Right Now"
              : "🚀 All Prompts"}
          </h2>
          {!search && !activeTag && (
            <button
              onClick={() => setSearch(" ")}
              style={{
                fontSize: 14,
                color: "var(--primary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Browse all {allPrompts.length} prompts →
            </button>
          )}
        </div>

        {/* Prompt Cards */}
        <div className="prompt-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayPrompts.length === 0 && (
            <div className="empty-state" style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
                {search || activeTag ? "No prompts found" : "No prompts available"}
              </h3>
              <p style={{ color: "var(--muted)", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
                {search 
                  ? `We couldn't find any prompts matching "${search}". Try a different search term.`
                  : activeTag
                  ? `No prompts tagged with #${activeTag}. Try a different tag.`
                  : "Start by searching for what you need."
                }
              </p>
              {(search || activeTag) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
                    Popular searches:
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                    {["listing", "leads", "social", "followup", "negotiation"].map(term => (
                      <button
                        key={term}
                        onClick={() => {
                          setSearch(term);
                          setActiveTag(null);
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "var(--radius-pill)",
                          background: "var(--badge-bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "all 160ms ease",
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSearch("");
                      setActiveTag(null);
                    }}
                    style={{
                      marginTop: 12,
                      padding: "8px 16px",
                      fontSize: 14,
                      color: "var(--primary)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    ← Clear and browse all
                  </button>
                </div>
              )}
            </div>
          )}
          
          {displayPrompts.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "80px 20px",
              maxWidth: 480,
              margin: "0 auto",
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
                No prompts found
              </h3>
              <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
                {search 
                  ? `Try different keywords or browse all ${allPrompts.length} prompts`
                  : activeTag 
                    ? "No prompts match this category"
                    : "No prompts available"}
              </p>
              {(search || activeTag) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveTag(null);
                  }}
                  style={{
                    padding: "12px 24px",
                    background: "var(--primary)",
                    color: "var(--text-inverse)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View All Prompts
                </button>
              )}
            </div>
          )}
          
          {isLoading ? (
            // Loading skeleton cards
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
            }}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="skeleton"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: 20,
                    height: 160,
                  }}
                >
                  <div className="skeleton" style={{ width: "70%", height: 20, borderRadius: 4, marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: "100%", height: 16, borderRadius: 4, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: "90%", height: 16, borderRadius: 4, marginBottom: 16 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 12 }} />
                    <div className="skeleton" style={{ width: 70, height: 24, borderRadius: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {displayPrompts.map((prompt: any) => {
            const isFavorite = favorites.includes(prompt.id);
            const uses = copyCounts[prompt.id] || 0;
            const isHovered = hoveredCard === prompt.id;
            const isTrending = hotPrompts.slice(0, 3).some((hp: any) => hp.id === prompt.id) && uses >= 5;
            
            return (
              <div
                key={prompt.id}
                className="prompt-card-v2"
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${isHovered ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: 20,
                  cursor: "pointer",
                  transition: "all 180ms ease",
                  transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                  boxShadow: isHovered ? "var(--shadow-md)" : "none",
                  position: "relative",
                }}
                onClick={() => selectPrompt(prompt)}
                onMouseEnter={() => setHoveredCard(prompt.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {isTrending && (
                  <div style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "linear-gradient(135deg, var(--error) 0%, var(--warning) 100%)",
                    color: "var(--text-inverse)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
                  }}>
                    🔥 Trending
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 8, paddingRight: isTrending ? 100 : 0 }}>
                      {prompt.title}
                    </h3>
                    {prompt.module === "My Custom Prompts" && (
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        background: "var(--purple)",
                        color: "var(--text-inverse)",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: "var(--radius-pill)",
                        marginBottom: 4,
                      }}>
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(prompt.id);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: 20,
                      cursor: "pointer",
                      padding: 4,
                      transition: "transform 160ms ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {isFavorite ? "⭐" : "☆"}
                  </button>
                </div>

                <p style={{ 
                  fontSize: 14, 
                  color: "var(--muted)", 
                  lineHeight: 1.5, 
                  marginBottom: 12,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: isHovered ? 3 : 2,
                  WebkitBoxOrient: "vertical",
                  transition: "all 180ms ease",
                }}>
                  {prompt.quick}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {prompt.tags?.map((tag: string) => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTag(tag);
                          setSearch("");
                          trackEvent("tag_clicked", { tag });
                        }}
                        className="badge tag-badge"
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-pill)",
                          background: activeTag === tag ? "var(--primary)" : "var(--surface-hover)",
                          color: activeTag === tag ? "var(--surface)" : "var(--text-secondary)",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 160ms ease",
                        }}
                        onMouseEnter={(e) => {
                          if (activeTag !== tag) {
                            e.currentTarget.style.background = "#e2e8f0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTag !== tag) {
                            e.currentTarget.style.background = "var(--surface-hover)";
                          }
                        }}
                        title={`Filter by #${tag}`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {uses > 0 && (
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>
                        👥 {uses}
                      </span>
                    )}
                    {isHovered && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const shareUrl = `${window.location.origin}${window.location.pathname}?prompt=${encodeURIComponent(prompt.title)}`;
                            navigator.clipboard.writeText(shareUrl);
                            // Could show a mini-toast here
                          }}
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text)",
                            background: "var(--badge-bg)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-pill)",
                            cursor: "pointer",
                            animation: "slideIn 200ms ease-out",
                            transition: "all 160ms ease",
                          }}
                          title="Copy link to this prompt"
                        >
                          🔗 Share
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(prompt);
                          }}
                          className="quick-copy-btn"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text-inverse)",
                            background: "var(--primary)",
                            border: "none",
                            borderRadius: "var(--radius-pill)",
                            cursor: "pointer",
                            animation: "slideIn 200ms ease-out",
                            transition: "all 160ms ease",
                          }}
                          title="Quick copy (without opening details)"
                        >
                          📋 Quick Copy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      {selectedPrompt && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setSelectedPrompt(null)}
        >
          <div
            className="modal-content"
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-md)",
              maxWidth: 680,
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              padding: 32, 
              overflowY: "auto",
              flex: 1,
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
                {selectedPrompt.title}
              </h2>
              <button
                onClick={() => setSelectedPrompt(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "var(--muted)",
                }}
              >
                ×
              </button>
            </div>
            
            {/* What You'll Get */}
            {selectedPrompt.deliverable && (
              <div style={{ 
                background: "var(--info-bg)",
                border: "1px solid var(--info)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 16px",
                marginBottom: 20,
              }}>
                <p style={{ 
                  fontSize: 13, 
                  fontWeight: 600,
                  color: "var(--info-text)", 
                  marginBottom: 4,
                }}>
                  📦 What you'll get:
                </p>
                <p style={{ 
                  fontSize: 14, 
                  color: "var(--info-text)", 
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {simplifyJargon(selectedPrompt.deliverable)}
                </p>
              </div>
            )}
            {selectedPrompt.title === "Listing Description That Converts" && (
              <div style={{
                background: "var(--warning-bg)",
                border: "1px solid var(--warning)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                marginBottom: 16,
              }}>
                <p style={{
                  fontSize: 12,
                  margin: 0,
                  lineHeight: 1.5,
                  color: "var(--warning-text)",
                  fontWeight: 500
                }}>
                  ⚖️ Fair Housing Reminder: Avoid demographic descriptors (age, family status, ethnicity, religion, disability). Use neutral lifestyle phrasing ("near parks" vs. "great for families"). Don’t imply exclusivity or preference. Double-check for anything that could reference protected classes before publishing.
                </p>
              </div>
            )}

            {/* Editable Fields - DocuSign Style Progressive Flow */}
            {(() => {
              const rawPlaceholders = extractPlaceholders(selectedPrompt);
              const placeholders = refinePlaceholders(rawPlaceholders, selectedPrompt.title);
              if (placeholders.length > 0) {
                const currentField = placeholders[currentFieldIndex];
                const isLastField = currentFieldIndex === placeholders.length - 1;
                const helpInfo = getEffectiveHelp(currentField, selectedPrompt.title);

                return (
                  <div style={{ marginBottom: 20 }}>
                    {/* Inline editing preview toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                          Quick Setup (1–2 min)
                        </h3>
                        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
                          Step {currentFieldIndex + 1} of {placeholders.length}
                        </span>
                      </div>
                      {/* Segmented control: Form | Inline */}
                      <div
                        role="tablist"
                        aria-label="Editing mode"
                        style={{
                          display: "inline-flex",
                          background: "var(--surface-hover)",
                          border: "1px solid var(--border)",
                          borderRadius: 9999,
                          padding: 2,
                          gap: 2,
                        }}
                      >
                        <button
                          role="tab"
                          aria-selected={!showInlinePreview}
                          onClick={() => {
                            if (!selectedPrompt) return;
                            const pid = (selectedPrompt as any).id;
                            if (showInlinePreview) {
                              setShowInlinePreview(false);
                              try { localStorage.setItem(KEY_INLINE_PREVIEW, JSON.stringify(false)); } catch {}
                              if (pid) {
                                const next = { ...inlinePreviewPrefs, [pid]: false };
                                setInlinePreviewPrefs(next);
                                try { localStorage.setItem(KEY_INLINE_PREVIEW_PER_PROMPT, JSON.stringify(next)); } catch {}
                              }
                              trackEvent("inline_preview_toggled", { enabled: false, title: selectedPrompt.title });
                              updateStats({ formEnabled: 1 });
                              if (!inlineTipSeen) { setInlineTipSeen(true); try { localStorage.setItem(KEY_INLINE_TIP_SEEN, 'true'); } catch {} }
                            }
                          }}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 9999,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            color: !showInlinePreview ? "var(--text-inverse)" : "var(--text)",
                            background: !showInlinePreview ? "var(--primary)" : "transparent",
                          }}
                          title="Fill fields using the quick form"
                        >
                          Form
                        </button>
                        <button
                          role="tab"
                          aria-selected={showInlinePreview}
                          onClick={() => {
                            if (!selectedPrompt) return;
                            const pid = (selectedPrompt as any).id;
                            if (!showInlinePreview) {
                              setShowInlinePreview(true);
                              try { localStorage.setItem(KEY_INLINE_PREVIEW, JSON.stringify(true)); } catch {}
                              if (pid) {
                                const next = { ...inlinePreviewPrefs, [pid]: true };
                                setInlinePreviewPrefs(next);
                                try { localStorage.setItem(KEY_INLINE_PREVIEW_PER_PROMPT, JSON.stringify(next)); } catch {}
                              }
                              trackEvent("inline_preview_toggled", { enabled: true, title: selectedPrompt.title });
                              updateStats({ inlineEnabled: 1 });
                              if (!inlineTipSeen) { setInlineTipSeen(true); try { localStorage.setItem(KEY_INLINE_TIP_SEEN, 'true'); } catch {} }
                            }
                          }}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 9999,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            color: showInlinePreview ? "var(--text-inverse)" : "var(--text)",
                            background: showInlinePreview ? "var(--primary)" : "transparent",
                          }}
                          title="Inline: edit fields directly inside the prompt. Changes update the same values used for Copy/Export."
                        >
                          Inline
                        </button>
                      </div>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      
                      {/* Use My Defaults toggle */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)" }}>
                          <input
                            type="checkbox"
                            checked={useDefaults}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setUseDefaults(checked);
                              try { localStorage.setItem(KEY_USE_DEFAULTS, JSON.stringify(checked)); } catch {}
                              if (checked) {
                                const count = applyDefaultsForPlaceholders(placeholders);
                                setDefaultsAppliedCount(count);
                              } else {
                                setDefaultsAppliedCount(0);
                              }
                            }}
                          />
                          Use my defaults
                        </label>
                        {useDefaults && (
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>
                            {defaultsAppliedCount > 0 ? `Filled ${defaultsAppliedCount} of ${placeholders.length}` : `No saved values found`}
                          </span>
                        )}
                      </div>

                      {/* Inline mode helper */}
                      {showInlinePreview && (
                        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 12px' }}>
                          Edits in Inline mode update the same fields used for Copy and Export.
                        </p>
                      )}
                      {!inlineTipSeen && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span>Tip: Press <kbd style={{padding:'2px 6px',border:'1px solid var(--border)',borderRadius:4, background:'var(--surface-hover)'}}>i</kbd> for Inline, <kbd style={{padding:'2px 6px',border:'1px solid var(--border)',borderRadius:4, background:'var(--surface-hover)'}}>f</kbd> for Form.</span>
                          <button
                            onClick={() => { setInlineTipSeen(true); try { localStorage.setItem(KEY_INLINE_TIP_SEEN, 'true'); } catch {} }}
                            style={{ fontSize: 12, border: 'none', background: 'transparent', color: 'var(--text)', cursor: 'pointer', textDecoration: 'underline' }}
                            aria-label="Dismiss tip"
                          >
                            Got it
                          </button>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div style={{ 
                        height: 4, 
                        background: "var(--border)", 
                        borderRadius: 999,
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${((currentFieldIndex + 1) / placeholders.length) * 100}%`,
                          background: "var(--primary)",
                          transition: "width 300ms ease",
                        }} />
                      </div>
                    </div>

                    {/* Current Field - Large & Focused */}
                    <div 
                      style={{
                        background: "var(--surface-hover)",
                        border: "2px solid var(--primary)",
                        borderRadius: "var(--radius-md)",
                        padding: 24,
                        marginBottom: 16,
                        animation: "slideIn 220ms ease-out",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontSize: 15,
                          fontWeight: 600,
                          marginBottom: 8,
                          color: "var(--text)",
                          lineHeight: 1.4,
                        }}
                      >
                        {helpInfo.description}
                      </label>
                      
                      {savedFieldValues[currentField] && (
                        <p style={{
                          fontSize: 11,
                          color: "var(--success)",
                          marginBottom: 8,
                          fontWeight: 500,
                        }}>
                          ✓ Pre-filled from last time
                        </p>
                      )}
                      {(() => {
                        const autoVal = getAutoFillValue(currentField);
                        const isAutoFilled = autoVal && fieldValues[currentField] === autoVal && !savedFieldValues[currentField];
                        if (!isAutoFilled) return null;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <p style={{
                              fontSize: 11,
                              color: 'var(--success)',
                              margin: 0,
                              fontWeight: 500,
                            }}>
                              ✓ Auto-filled from profile
                            </p>
                            <button
                              onClick={() => updateFieldValue(currentField, '')}
                              style={{
                                fontSize: 11,
                                padding: '4px 8px',
                                borderRadius: 9999,
                                border: '1px solid var(--border)',
                                background: 'var(--surface-hover)',
                                cursor: 'pointer',
                                color: 'var(--text)'
                              }}
                              title="Clear this auto-filled value"
                            >
                              Revert
                            </button>
                          </div>
                        );
                      })()}
                      
                      {/* Quick-select chips for field history */}
                      {fieldHistory[currentField] && fieldHistory[currentField].length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 500 }}>
                            Recently used:
                          </p>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {fieldHistory[currentField].slice(0, 3).map((historyValue, idx) => (
                              <button
                                key={idx}
                                onClick={() => updateFieldValue(currentField, historyValue)}
                                style={{
                                  padding: "4px 10px",
                                  fontSize: 12,
                                  background: fieldValues[currentField] === historyValue ? "var(--primary)" : "var(--surface-hover)",
                                  color: fieldValues[currentField] === historyValue ? "var(--surface)" : "var(--text)",
                                  border: "1px solid",
                                  borderColor: fieldValues[currentField] === historyValue ? "var(--primary)" : "var(--border)",
                                  borderRadius: "var(--radius-pill)",
                                  cursor: "pointer",
                                  transition: "all 160ms ease",
                                  fontFamily: "var(--font-stack)",
                                  fontWeight: 500,
                                }}
                              >
                                {historyValue.length > 20 ? `${historyValue.substring(0, 20)}...` : historyValue}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <input
                        ref={fieldInputRef}
                        type="text"
                        value={fieldValues[currentField] || ""}
                        onChange={(e) => updateFieldValue(currentField, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isLastField) {
                            e.preventDefault();
                            setCurrentFieldIndex(currentFieldIndex + 1);
                          } else if (e.key === "Enter" && isLastField && fieldValues[currentField]?.trim()) {
                            handleCopy(selectedPrompt);
                          }
                        }}
                        placeholder={helpInfo.example}
                        style={{
                          width: "100%",
                          maxWidth: 480,
                          padding: "14px 16px",
                          borderRadius: "var(--radius-sm)",
                          border: "2px solid var(--border)",
                          fontSize: 15,
                          fontFamily: "var(--font-stack)",
                          transition: "all 160ms ease",
                        }}
                        autoFocus
                      />
                    </div>

                    {/* Navigation Buttons */}
                    <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                      <button
                        onClick={() => setCurrentFieldIndex(Math.max(0, currentFieldIndex - 1))}
                        disabled={currentFieldIndex === 0}
                        style={{
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          color: currentFieldIndex === 0 ? "var(--muted)" : "var(--text)",
                          background: currentFieldIndex === 0 ? "var(--surface-hover)" : "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          cursor: currentFieldIndex === 0 ? "not-allowed" : "pointer",
                          opacity: currentFieldIndex === 0 ? 0.5 : 1,
                        }}
                      >
                        ← Back
                      </button>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* Skip for now: show base prompt immediately */}
                        <button
                          onClick={() => {
                            const fullText = buildFullPrompt(selectedPrompt);
                            const finalText = applyReplacements(fullText, fieldValues);
                            setGeneratedOutput(finalText);
                            trackEvent("personalize_skip", { promptTitle: selectedPrompt.title });
                          }}
                          style={{
                            padding: "8px 10px",
                            fontSize: 13,
                            color: "var(--muted)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          Skip for now
                        </button>

                        {!isLastField ? (
                          <button
                            onClick={() => setCurrentFieldIndex(currentFieldIndex + 1)}
                            style={{
                              padding: "10px 24px",
                              fontSize: 14,
                              fontWeight: 600,
                              color: "var(--text-inverse)",
                              background: "var(--primary)",
                              border: "none",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                            }}
                          >
                            Next →
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerate(selectedPrompt)}
                            disabled={isGenerating}
                            style={{
                              padding: "12px 24px",
                              fontSize: 15,
                              fontWeight: 600,
                              color: "#fff",
                              background: isGenerating 
                                ? "#94a3b8" 
                                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              border: "none",
                              borderRadius: "var(--radius-sm)",
                              cursor: isGenerating ? "not-allowed" : "pointer",
                              transition: "all 160ms ease",
                              opacity: isGenerating ? 0.7 : 1,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isGenerating ? "⏳ Personalizing..." : "✨ Personalize Prompt"}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              }
              
              // No fields - show prompt preview
              return (
                <div
                  style={{
                    background: "var(--surface-hover)",
                    padding: 16,
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                    marginBottom: 20,
                    fontFamily: "ui-monospace, monospace",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {buildFullPrompt(selectedPrompt)}
                </div>
              );
            })()}

            {/* Optional Inline Editing Preview (shows below the field flow; low-risk addition) */}
            {(() => {
              const ph = refinePlaceholders(extractPlaceholders(selectedPrompt), selectedPrompt.title);
              if (!showInlinePreview || ph.length === 0) return null;
              return (
                <div
                  style={{
                    background: "var(--surface-hover)",
                    padding: 16,
                    borderRadius: "var(--radius-sm)",
                    marginBottom: 20,
                    border: "1px dashed var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>Inline editing preview</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Edit bracketed fields directly below</span>
                  </div>
                  <EditablePromptText
                    text={buildFullPrompt(selectedPrompt)}
                    fieldValues={fieldValues}
                    onFieldChange={(field, value) => updateFieldValue(field, value)}
                    savedFieldHistory={fieldHistory}
                  />
                </div>
              );
            })()}

            {/* Action Buttons - Only show if no fields OR all fields viewed */}
            {(() => {
              const placeholders = refinePlaceholders(extractPlaceholders(selectedPrompt), selectedPrompt.title);
              const hasFields = placeholders.length > 0;
              
              // Only show action buttons if no fields, or if we're on the last field
              if (!hasFields) {
                return (
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <button
                      onClick={() => handleCopy(selectedPrompt)}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        padding: "12px 24px",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text-inverse)",
                        background: "var(--primary)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "all 160ms ease",
                      }}
                    >
                      {copied ? "✓ Copied!" : "📋 Copy Prompt"}
                    </button>
                    
                    <button
                      onClick={() => handleExport(selectedPrompt)}
                      style={{
                        padding: "12px 20px",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text)",
                        background: "var(--badge-bg)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "all 160ms ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e2e8f0";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--surface-hover)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      title="Download as .txt file"
                    >
                      💾
                    </button>
                    
                    <button
                      onClick={() => duplicatePrompt(selectedPrompt)}
                      style={{
                        padding: "12px 20px",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text)",
                        background: "var(--badge-bg)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "all 160ms ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e2e8f0";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--surface-hover)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      title="Duplicate and customize"
                    >
                      📑
                    </button>
                    
                    <button
                      onClick={() => toggleFavorite((selectedPrompt as any).id)}
                      style={{
                        padding: "12px 20px",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text)",
                        background: "var(--badge-bg)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "all 160ms ease",
                      }}
                    >
                      {favorites.includes((selectedPrompt as any).id) ? "⭐ Saved" : "☆ Save"}
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* AI Generated Output */}
            {generatedOutput && (
              <div style={{ marginTop: 20, marginBottom: 20 }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  marginBottom: 12 
                }}>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 700, 
                    color: "var(--text)" 
                  }}>
                    ✨ Your Personalized Prompt
                  </div>
                  <button
                    onClick={() => {
                      setGeneratedOutput(null);
                      setFieldValues({});
                    }}
                    style={{
                      marginLeft: "auto",
                      padding: "6px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--muted)",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedOutput(null);
                      setFieldValues({});
                    }}
                    style={{
                      padding: "6px 12px",
                      fontSize: 13,
                      color: "var(--muted)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Clear
                  </button>
                </div>
                <div style={{
                  background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                  padding: 20,
                  borderRadius: "var(--radius-sm)",
                  border: "2px solid #667eea",
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--text)",
                  whiteSpace: "pre-wrap",
                  maxHeight: 400,
                  overflowY: "auto",
                }}>
                  {generatedOutput}
                </div>
                <div style={{ 
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "center"
                }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedOutput);
                      window.open('https://chatgpt.com/g/g-6915d91d08e08191a802f75e4d926d7b-ai-workflow-assistant-for-real-estate-agents', '_blank');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{
                      padding: "14px 32px",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#fff",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      transition: "all 160ms ease",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                    }}
                  >
                    {copied ? "✓ Copied! Opening ChatGPT..." : "📋 Copy Prompt & Open ChatGPT"}
                  </button>
                </div>
                <div style={{ 
                  fontSize: 13, 
                  color: "var(--muted)", 
                  marginTop: 12,
                  textAlign: "center",
                  lineHeight: 1.5
                }}>
                  {isMac ? (
                    <>
                      When ChatGPT opens, paste your prompt with <kbd style={{ padding: "2px 6px", background: "var(--badge-bg)", borderRadius: 4, fontWeight: 600 }}>⌘+V</kbd>
                    </>
                  ) : (
                    <>
                      When ChatGPT opens, paste your prompt with <kbd style={{ padding: "2px 6px", background: "var(--badge-bg)", borderRadius: 4, fontWeight: 600 }}>Ctrl+V</kbd>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Keyboard shortcuts hint */}
            <div style={{ 
              fontSize: 11, 
              color: "var(--muted)", 
              textAlign: "center",
              padding: "8px 0"
            }}>
              <kbd style={{ padding: "2px 6px", background: "var(--badge-bg)", borderRadius: 4, fontWeight: 600 }}>⌘</kbd> + <kbd style={{ padding: "2px 6px", background: "var(--badge-bg)", borderRadius: 4, fontWeight: 600 }}>Enter</kbd> to copy · <kbd style={{ padding: "2px 6px", background: "var(--badge-bg)", borderRadius: 4, fontWeight: 600 }}>ESC</kbd> to close
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Guardrail Modal: missing fields confirmation */}
      {showMissingFieldsPrompt && selectedPrompt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20,
          }}
          onClick={() => setShowMissingFieldsPrompt(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: 520,
              padding: 24,
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8, color: 'var(--text)' }}>Some fields are empty</h3>
            <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: 14 }}>
              You have {missingFields.length} empty field{missingFields.length > 1 ? 's' : ''}. You can fill them now or copy anyway.
            </p>
            <div style={{
              background: 'var(--surface-hover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
              marginBottom: 16,
              maxHeight: 140,
              overflow: 'auto',
              fontSize: 13,
              color: 'var(--text)'
            }}>
              {missingFields.slice(0, 8).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)' }} />
                  <code style={{ background: 'transparent' }}>[{f}]</code>
                </div>
              ))}
              {missingFields.length > 8 && (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>+ {missingFields.length - 8} more…</div>
              )}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>
              <input type="checkbox" checked={guardrailDontAskAgain} onChange={(e) => setGuardrailDontAskAgain(e.target.checked)} />
              Don’t ask again for this prompt
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  // Focus first missing field in the progressive flow
                  const ph = refinePlaceholders(extractPlaceholders(selectedPrompt), selectedPrompt.title);
                  const firstMissing = missingFields[0];
                  const idx = ph.indexOf(firstMissing);
                  if (idx >= 0) setCurrentFieldIndex(idx);
                  setShowMissingFieldsPrompt(false);
                }}
                style={{
                  padding: '10px 14px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: 'var(--text)'
                }}
              >
                Fill fields
              </button>
              <button
                onClick={async () => {
                  setShowMissingFieldsPrompt(false);
                  if (guardrailDontAskAgain) {
                    const pid = (selectedPrompt as any).id;
                    if (pid) {
                      const next = { ...guardrailSuppressPrefs, [pid]: true };
                      setGuardrailSuppressPrefs(next);
                      try { localStorage.setItem(KEY_COPY_GUARDRAIL_SUPPRESS, JSON.stringify(next)); } catch {}
                    }
                  }
                  await proceedCopy(selectedPrompt);
                }}
                style={{
                  padding: '10px 14px',
                  background: 'var(--primary)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Copy anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Quick Access (Bottom Right FAB) */}
      {favorites.length > 0 && !showFavoritesView && (
        <button
          onClick={() => {
            setShowFavoritesView(true);
            setSearch("");
            setActiveTag(null);
            trackEvent("favorites_opened");
          }}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--primary)",
            color: "var(--text-inverse)",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
            transition: "all 180ms ease",
          }}
          title={`View ${favorites.length} saved prompts`}
        >
          ⭐
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "var(--error)",
              color: "var(--text-inverse)",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {favorites.length}
          </span>
        </button>
      )}

      {/* Favorites Panel */}
      {showFavoritesView && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowFavoritesView(false)}
        >
          <div
            className="modal-content"
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-md)",
              maxWidth: 720,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              padding: 32,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
                  ⭐ Saved Prompts
                </h2>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  {favoritePrompts.length} prompt{favoritePrompts.length !== 1 ? "s" : ""} saved for quick access
                </p>
              </div>
              <button
                onClick={() => setShowFavoritesView(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "var(--muted)",
                }}
              >
                ×
              </button>
            </div>

            {favoritePrompts.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
                  No saved prompts yet
                </h3>
                <p style={{ color: "var(--muted)", marginBottom: 20 }}>
                  Click the star on any prompt to save it here for quick access.
                </p>
                <button
                  onClick={() => setShowFavoritesView(false)}
                  style={{
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-inverse)",
                    background: "var(--primary)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                  }}
                >
                  Browse Prompts
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {favoritePrompts.map((prompt: any) => {
                  const uses = copyCounts[prompt.id] || 0;
                  return (
                    <div
                      key={prompt.id}
                      style={{
                        background: "var(--surface-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        padding: 16,
                        cursor: "pointer",
                        transition: "all 180ms ease",
                      }}
                      onClick={() => {
                        selectPrompt(prompt);
                        setShowFavoritesView(false);
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
                          {prompt.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(prompt.id);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            fontSize: 18,
                            cursor: "pointer",
                            padding: 4,
                          }}
                          title="Remove from favorites"
                        >
                          ⭐
                        </button>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 8 }}>
                        {prompt.quick?.slice(0, 120)}...
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--muted)" }}>
                        <span>{prompt.tags?.map((t: string) => `#${t}`).join(" ")}</span>
                        {uses > 0 && <span>· Copied {uses}×</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copy Success Toast */}
      {copied && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--success)",
            color: "var(--text-inverse)",
            padding: "16px 24px",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            zIndex: 10000,
            animation: "slideUp 300ms ease-out",
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
            ✓ Copied!
          </div>
          <div style={{ fontSize: 13, marginBottom: 12, opacity: 0.9 }}>
            Now paste into ChatGPT or Claude
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a
              href="https://chatgpt.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-inverse)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 160ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
            >
              Open ChatGPT →
            </a>
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-inverse)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 160ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
            >
              Open Claude →
            </a>
          </div>
        </div>
      )}

      {/* Follow-up Suggestions Modal */}
      {showFollowUps && followUpPrompts.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1500,
            padding: 20,
          }}
          onClick={() => setShowFollowUps(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-md)",
              maxWidth: 520,
              width: "100%",
              padding: 32,
              animation: "slideUp 300ms ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>�</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
                Continue Your Workflow
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>
                Complete the sequence with these related prompts
              </p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {followUpMeta.map((meta, idx: number) => {
                const prompt = meta.prompt;
                const isSequence = meta.source === 'sequence';
                const isTag = meta.source === 'tag';
                
                // Determine badge content
                let badge = '';
                let badgeColor = '';
                let subtext = '';
                
                if (isSequence && meta.sequenceCount && meta.sequenceCount >= 3) {
                  badge = '✨';
                  badgeColor = '#f59e0b';
                  const percentage = meta.percentage || 0;
                  subtext = percentage > 60 
                    ? `${percentage}% of agents use this next (${meta.sequenceCount}x)`
                    : `Strong pattern (used ${meta.sequenceCount}x after this)`;
                } else if (isSequence) {
                  badge = '📊';
                  badgeColor = '#3b82f6';
                  subtext = `Emerging pattern (${meta.sequenceCount || 0}x)`;
                } else if (isTag) {
                  badge = '🏷️';
                  badgeColor = '#6b7280';
                  subtext = 'Related by category';
                } else {
                  badge = '📂';
                  badgeColor = '#6b7280';
                  subtext = 'Same module';
                }
                
                return (
                  <button
                    key={(prompt as any).id}
                    onClick={() => {
                      setShowFollowUps(false);
                      setSelectedPrompt(prompt);
                    }}
                    style={{
                      padding: "16px",
                      background: isSequence ? "linear-gradient(135deg, var(--surface) 0%, var(--surface-hover) 100%)" : "var(--surface)",
                      border: isSequence ? "2px solid var(--primary)" : "2px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 160ms ease",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ 
                      position: "absolute", 
                      top: 8, 
                      right: 8, 
                      background: isSequence ? badgeColor : "var(--muted-bg)",
                      color: "white",
                      fontSize: 16,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isSequence ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
                    }}>
                      {badge}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: "var(--text)", paddingRight: 36 }}>
                      {prompt.title}
                    </div>
                    {subtext && (
                      <div style={{ 
                        fontSize: 12, 
                        color: isSequence ? "var(--primary)" : "var(--muted)", 
                        marginBottom: 6,
                        fontWeight: isSequence ? 600 : 400
                      }}>
                        {subtext}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}>
                      {prompt.role ? (prompt.role.slice(0, 80) + (prompt.role.length > 80 ? "..." : "")) : ""}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <button
                onClick={async () => {
                  // Copy all prompts in sequence with separators
                  const sequenceText = followUpPrompts.map((p: any, idx: number) => {
                    const fullText = buildFullPrompt(p);
                    const finalText = applyReplacements(fullText, fieldValues);
                    return `--- PROMPT ${idx + 1}: ${p.title} ---\n\n${finalText}`;
                  }).join('\n\n==========\n\n');
                  
                  try {
                    await navigator.clipboard.writeText(sequenceText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    setShowFollowUps(false);
                  } catch {}
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "var(--primary)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-inverse)",
                  cursor: "pointer",
                }}
              >
                🔗 Copy All ({followUpPrompts.length})
              </button>
            </div>
            
            <button
              onClick={() => setShowFollowUps(false)}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                border: "2px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--muted)",
                cursor: "pointer",
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-md)",
              maxWidth: 540,
              width: "100%",
              padding: 40,
              textAlign: "center",
              animation: "slideUp 300ms ease-out",
            }}
          >
            {onboardingStep === 0 && (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏡</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>
                  Welcome to AI Prompt Vault
                </h2>
                <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, marginBottom: 32 }}>
                  AI prompts designed specifically for real estate agents. Get instant marketing plans, social media content, and lead generation strategies — with new prompts added daily.
                </p>
                <button
                  onClick={() => setOnboardingStep(1)}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    background: "var(--primary)",
                    color: "var(--text-inverse)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Let's Go →
                </button>
              </>
            )}

            {onboardingStep === 1 && (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>
                  How It Works
                </h2>
                <div style={{ textAlign: "left", marginBottom: 32 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                    <div style={{ 
                      minWidth: 32, 
                      height: 32, 
                      borderRadius: "50%", 
                      background: "var(--badge-primary-bg)", 
                      color: "var(--primary)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                    }}>1</div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>Search or browse</h3>
                      <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
                        Find the perfect prompt for your task
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                    <div style={{ 
                      minWidth: 32, 
                      height: 32, 
                      borderRadius: "50%", 
                      background: "var(--badge-primary-bg)", 
                      color: "var(--primary)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                    }}>2</div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>Personalize it</h3>
                      <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
                        Fill in your city, niche, and details (saved for next time!)
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ 
                      minWidth: 32, 
                      height: 32, 
                      borderRadius: "50%", 
                      background: "var(--badge-primary-bg)", 
                      color: "var(--primary)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                    }}>3</div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>Paste into AI</h3>
                      <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
                        Use it in ChatGPT or Claude and get results in seconds
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOnboardingStep(2)}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    background: "var(--primary)",
                    color: "var(--text-inverse)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Next →
                </button>
              </>
            )}

            {onboardingStep === 2 && (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>
                  Start with a Popular Prompt
                </h2>
                <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
                  Try one of these to get started:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  <button
                    onClick={() => {
                      const prompt = allPrompts.find((p: any) => p.title === "90-Day Inbound Lead Blueprint");
                      if (prompt) {
                        setShowOnboarding(false);
                        localStorage.setItem(KEY_ONBOARDED, "true");
                        selectPrompt(prompt);
                      }
                    }}
                    style={{
                      padding: "12px 16px",
                      background: "var(--surface-hover)",
                      border: "2px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      color: "var(--text)",
                    }}
                  >
                    📈 90-Day Marketing Plan
                  </button>
                  <button
                    onClick={() => {
                      const prompt = allPrompts.find((p: any) => p.title === "Instagram Reels Calendar (30 Days)");
                      if (prompt) {
                        setShowOnboarding(false);
                        localStorage.setItem(KEY_ONBOARDED, "true");
                        selectPrompt(prompt);
                      }
                    }}
                    style={{
                      padding: "12px 16px",
                      background: "var(--surface-hover)",
                      border: "2px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      color: "var(--text)",
                    }}
                  >
                    📱 30 Days of Social Media Content
                  </button>
                  <button
                    onClick={() => {
                      const prompt = allPrompts.find((p: any) => p.title === "Listing Lead Magnet Funnel");
                      if (prompt) {
                        setShowOnboarding(false);
                        localStorage.setItem(KEY_ONBOARDED, "true");
                        selectPrompt(prompt);
                      }
                    }}
                    style={{
                      padding: "12px 16px",
                      background: "var(--surface-hover)",
                      border: "2px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      color: "var(--text)",
                    }}
                  >
                    ✍️ Create a Lead Magnet Funnel
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem(KEY_ONBOARDED, "true");
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    background: "var(--primary)",
                    color: "var(--text-inverse)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Browse All Prompts
                </button>
              </>
            )}

            <button
              onClick={() => {
                setShowOnboarding(false);
                localStorage.setItem(KEY_ONBOARDED, "true");
              }}
              style={{
                marginTop: 16,
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Skip intro
            </button>
          </div>
        </div>
      )}

      {/* Agent Profile Setup Modal */}
      {showProfileSetup && (
        <AgentProfileSetup
          onComplete={(updatedProfile: Partial<AgentProfile>) => {
            saveProfile(updatedProfile);
            setShowProfileSetup(false);
          }}
          onSkip={() => setShowProfileSetup(false)}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3000,
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: "24px",
            padding: "48px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
            border: "2px solid #667eea",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✨</div>
            <h2 style={{ 
              fontSize: "28px", 
              fontWeight: 700, 
              marginBottom: "16px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Upgrade to Keep Generating
            </h2>
            <p style={{ 
              fontSize: "16px", 
              color: "#64748b", 
              marginBottom: "32px",
              lineHeight: "1.6",
            }}>
              You've used all <strong>3 free AI generations</strong> this month.<br />
              Upgrade to Pro for unlimited prompts and <strong>100 AI generations per month</strong>.
            </p>
            
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              color: "white",
            }}>
              <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>Pro Plan</div>
              <div style={{ fontSize: "42px", fontWeight: 700, marginBottom: "4px" }}>
                $14.50<span style={{ fontSize: "20px", fontWeight: 400 }}>/month</span>
              </div>
              <div style={{ fontSize: "14px", opacity: 0.9, textDecoration: "line-through" }}>$29/month</div>
              <div style={{ fontSize: "16px", fontWeight: 600, marginTop: "12px" }}>🎉 50% off first month</div>
            </div>

            <div style={{
              textAlign: "left",
              background: "#f8fafc",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "32px",
              fontSize: "14px",
              lineHeight: "1.8",
            }}>
              <div style={{ marginBottom: "8px" }}>✓ <strong>100 AI generations</strong> per month</div>
              <div style={{ marginBottom: "8px" }}>✓ <strong>Unlimited</strong> prompt access</div>
              <div style={{ marginBottom: "8px" }}>✓ Save and export all outputs</div>
              <div>✓ Smart workflow suggestions</div>
            </div>

            <button
              onClick={() => {
                trackEvent("upgrade_modal_clicked", { source: "ai_limit" });
                window.open("https://buy.stripe.com/test_your_link_here", "_blank");
              }}
              style={{
                width: "100%",
                padding: "16px 32px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: "12px",
                transition: "transform 150ms ease, box-shadow 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Upgrade Now - Save 50%
            </button>

            <button
              onClick={() => {
                setShowUpgradeModal(false);
                trackEvent("upgrade_modal_dismissed", { source: "ai_limit" });
              }}
              style={{
                width: "100%",
                padding: "16px 32px",
                background: "transparent",
                color: "#64748b",
                border: "none",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#334155"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardShortcuts && (
        <div
          onClick={() => setShowKeyboardShortcuts(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            backdropFilter: "blur(4px)",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: 16,
              maxWidth: 480,
              width: "100%",
              padding: 32,
              boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginRight: 12 }}>⌨️</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Keyboard Shortcuts
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { keys: ["⌘", "K"], or: "Ctrl+K", action: "Focus search" },
                { keys: ["⌘", "↵"], or: "Ctrl+Enter", action: "Copy prompt" },
                { keys: ["Esc"], action: "Close modal / Clear search" },
                { keys: ["?"], action: "Show this help" },
              ].map((shortcut, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {shortcut.keys.map((key, j) => (
                      <div
                        key={j}
                        style={{
                          padding: "4px 10px",
                          background: "var(--surface-hover)",
                          border: "1.5px solid var(--border)",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text)",
                          minWidth: 28,
                          textAlign: "center",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {key}
                      </div>
                    ))}
                    {shortcut.or && (
                      <>
                        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>
                          or
                        </span>
                        <div
                          style={{
                            padding: "4px 10px",
                            background: "var(--surface-hover)",
                            border: "1.5px solid var(--border)",
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text)",
                            fontFamily: "ui-monospace, monospace",
                          }}
                        >
                          {shortcut.or}
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    {shortcut.action}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowKeyboardShortcuts(false)}
              style={{
                marginTop: 24,
                width: "100%",
                padding: "12px 24px",
                background: "var(--primary)",
                color: "var(--text-inverse)",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--text)",
          color: "var(--text-inverse)",
          padding: "12px 24px",
          borderRadius: "var(--radius-pill)",
          fontSize: 14,
          fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 2000,
          animation: "slideUp 300ms ease-out",
        }}>
          {toastMessage}
        </div>
      )}
    </div>
    {showAdminDashboard && <AdminDashboard />}
    </>
  );
}
