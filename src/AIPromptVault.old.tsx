"use client";
import React, { useEffect, useState, useMemo } from "react";
import "./AIPromptVault.css";
import { prompts as fullPrompts } from "./prompts";
import {
  PromptItem,
  buildFullPrompt,
  mergeRemote,
  extractPlaceholders,
  applyReplacements,
  RemotePayload,
} from "./promptUtils";

/* ---------- Types ---------- */

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
  items: Omit<PromptItem, "module" | "index">[]
): PromptItem[] => {
  const moduleName = `Module ${moduleIndex} — ${MODULE_TITLES[moduleIndex - 1]}`;
  return items.map((p, i) => ({
    ...p,
    module: moduleName,
    index: i,
  }));
};

/* ---------- Prompt Builder ---------- */


/* ---------- Merge Remote Prompts ---------- */



/* ---------- Main Component ---------- */

export default function AIPromptVault() {
  // accessibility: element that opened the onboarding modal so we can return focus
  const onboardOpenerRef = React.useRef<HTMLButtonElement | null>(null);
  // polite status messages for screen readers
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [data, setData] = useState<PromptItem[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<{
    id: string;
    module: string;
    index: number;
    title: string;
    values: Record<string, string>;
    createdAt: string;
  }[]>([]);
  const [recentFills, setRecentFills] = useState<Record<string, string>[]>([]);
  const [showFull, setShowFull] = useState(true);
  const [variations, setVariations] = useState<string[] | null>(null);
  const [renameModalId, setRenameModalId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [modalInput, setModalInput] = useState("");
  const [deploySha, setDeploySha] = useState<string | null>(null);
  const [copyCounts, setCopyCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [abVariant, setAbVariant] = useState<string | null>(null);
  const [intent, setIntent] = useState<string | null>(null);
  const [showAll, setShowAll] = useState<boolean>(false);
  // Onboarding modal state
  const [showOnboard, setShowOnboard] = useState<boolean>(() => {
    try {
      return !localStorage.getItem("rpv:onboardSeen");
    } catch {
      return true;
    }
  });
  const [onboardStep, setOnboardStep] = useState<number>(1);
  const [onboardAnswers, setOnboardAnswers] = useState<{ intent?: string; role?: string; market?: string }>({});
  const [topPicks, setTopPicks] = useState<PromptItem[] | null>(null);
  const [showFavoritesPanel, setShowFavoritesPanel] = useState<boolean>(false);
  const onboardModalRef = React.useRef<HTMLDivElement | null>(null);

  const ONBOARD_INTENTS: { key: string; label: string; moduleKey?: string; emoji: string }[] = [
    { key: "leads", label: "Get more leads", moduleKey: CATEGORY_CARDS[0].moduleKey, emoji: "📣" },
    { key: "listing", label: "Create a listing", moduleKey: CATEGORY_CARDS[3].moduleKey, emoji: "🏡" },
    { key: "open_house", label: "Run an open house", moduleKey: CATEGORY_CARDS[3].moduleKey, emoji: "🏷️" },
    { key: "followups", label: "Improve follow-ups", moduleKey: CATEGORY_CARDS[4].moduleKey, emoji: "✨" },
    { key: "social", label: "Create social content", moduleKey: CATEGORY_CARDS[9].moduleKey, emoji: "📈" },
    { key: "automate", label: "Automate my leads", moduleKey: CATEGORY_CARDS[10].moduleKey, emoji: "⚙️" },
    { key: "other", label: "Other / Browse", emoji: "🔍" },
  ];

  const ROLE_OPTIONS = [
    "Solo agent",
    "Team lead",
    "Buyer specialist",
    "Listing specialist",
    "Investor agent",
    "Broker / manager",
  ];

  const KEY_FAVORITES = "rpv:favorites";
  const KEY_RECENT = "rpv:recentFills";
  const KEY_COUNTS = "rpv:copyCounts";

  const INTENT_PILLS = [
    { key: "leads", label: "Get more leads" },
    { key: "listing", label: "Create a listing" },
    { key: "followups", label: "Automate follow-ups" },
    { key: "social", label: "Create social content" },
  ];

  // preload base + remote
  useEffect(() => {
    // assign a simple client-side A/B variant if not present
    try {
      let v = localStorage.getItem('rpv:ab');
      if (!v) {
        v = Math.random() < 0.5 ? 'A' : 'B';
        localStorage.setItem('rpv:ab', v);
        trackEvent('ab_assigned', { variant: v });
      }
      setAbVariant(v);
    } catch {}

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

  const promptsForSelected = selectedModule
    ? data.filter((d) => d.module === selectedModule)
    : [];

  const filteredPrompts = useMemo(() => {
    if (!searchTerm || !promptsForSelected.length) return promptsForSelected;
    const q = searchTerm.toLowerCase().trim();
    return promptsForSelected.filter((p) => {
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.quick || "").toLowerCase().includes(q) ||
        (p.role || "").toLowerCase().includes(q)
      );
    });
  }, [promptsForSelected, searchTerm]);

  const currentPrompt =
    selectedModule != null && selectedIndex != null
      ? data.find(
          (d) => d.module === selectedModule && d.index === selectedIndex
        ) || null
      : null;

  // Utility: find unique bracketed tokens like [market], [buyer], etc.
  const extractPlaceholders = (p: PromptItem | null): string[] => {
    if (!p) return [];
    // concatenate all text fields from the prompt item
    const vals = [
      p.title,
      p.quick,
      p.role,
      p.deliverable,
      p.success,
      p.inputs,
      p.constraints,
      p.tools,
      p.iterate,
      p.risk,
      p.format,
      p.audience,
    ]
      .filter(Boolean)
      .join(" ");

    const rx = /\[([^\[\]]+)\]/g;
    const found = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = rx.exec(vals))) {
      const tok = m[1].trim();
      if (tok) found.add(tok);
    }

    // Also run extraction on the built full prompt (covers defaults)
    const built = buildFullPrompt(p);
    rx.lastIndex = 0;
    while ((m = rx.exec(built))) {
      const tok = m[1].trim();
      if (tok) found.add(tok);
    }

    return Array.from(found);
  };

  // initialize fieldValues when currentPrompt changes
  useEffect(() => {
    const toks = extractPlaceholders(currentPrompt);
    const map: Record<string, string> = {};
    toks.forEach((t) => {
      // sensible initial value: prefer a small sample value to speed entry
      map[t] = SAMPLE_DEFAULTS[t.toLowerCase()] || "";
    });
    setFieldValues(map);
  }, [currentPrompt]);

  // keyboard shortcut: press 'c' to copy when not focused in an input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT" || (active as HTMLElement).isContentEditable);
      if (typing) return;
      if (e.key === "c" || e.key === "C") {
        // copy only if a prompt is selected
        if (currentPrompt) {
          e.preventDefault();
          handleCopy();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentPrompt, fieldValues]);

  // load favorites/recent from localStorage on mount
  useEffect(() => {
    try {
      const fav = localStorage.getItem(KEY_FAVORITES);
      if (fav) setFavorites(JSON.parse(fav));
    } catch {}
    try {
      const rec = localStorage.getItem(KEY_RECENT);
      if (rec) setRecentFills(JSON.parse(rec));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_FAVORITES, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_RECENT, JSON.stringify(recentFills));
    } catch {}
  }, [recentFills]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY_COUNTS);
      if (raw) setCopyCounts(JSON.parse(raw));
    } catch {}
  }, []);

  // compute suggestions based on onboarding answers
  const computeTopPicks = (answers: { intent?: string; role?: string; market?: string }) => {
    if (!answers.intent) return [] as PromptItem[];
    const intent = ONBOARD_INTENTS.find((i) => i.key === answers.intent);
    if (!intent || !intent.moduleKey) return [] as PromptItem[];
    const candidates = data.filter((d) => d.module === intent.moduleKey);
    const qMarket = (answers.market || "").toLowerCase();
    const qRole = (answers.role || "").toLowerCase();
    const scored = candidates
      .map((p) => {
        let score = 0;
        if ((p.title || "").toLowerCase().includes(qRole) || (p.role || "").toLowerCase().includes(qRole)) score += 20;
        const built = buildFullPrompt(p).toLowerCase();
        if (qMarket && built.includes(qMarket)) score += 30;
        const key = `${p.module}||${p.title}`;
        score += (copyCounts?.[key] || 0);
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.p);
    return scored;
  };

  // Compute the visible category cards (top 6 unless showAll)
  const visibleCategoryCards = useMemo(() => {
    if (showAll) return CATEGORY_CARDS;
    const picks = topPicks || [];
    const pickModules = new Set(picks.map((p) => p.module));
    const sorted = [...CATEGORY_CARDS].sort((a, b) => {
      const aScore = pickModules.has(a.moduleKey) ? 0 : 1;
      const bScore = pickModules.has(b.moduleKey) ? 0 : 1;
      return aScore - bScore || a.id - b.id;
    });
    return sorted.slice(0, 6);
  }, [showAll, topPicks]);

  const recommendedModules = useMemo(() => {
    if (!intent) return new Set<string>();
    const intentObj = ONBOARD_INTENTS.find((i) => i.key === intent);
    if (!intentObj || !intentObj.moduleKey) return new Set<string>();
    return new Set([intentObj.moduleKey]);
  }, [intent]);

  // helper to close the onboarding modal in a consistent, accessible way
  const closeOnboard = (reason?: string) => {
    setShowOnboard(false);
    try {
      localStorage.setItem('rpv:onboardSeen', '1');
    } catch {}
    // return focus to opener if present
    try {
      onboardOpenerRef.current?.focus();
    } catch {}
    trackEvent('onboard_closed', { reason });
  };

  const openOnboard = () => {
    setShowOnboard(true);
    setOnboardStep(1);
    trackEvent('onboard_opened');
  };

  // announce changes to assistive tech when top picks are available
  useEffect(() => {
    if (topPicks && topPicks.length > 0) {
      const msg = `${topPicks.length} tailored prompt${topPicks.length > 1 ? 's' : ''} ready`;
      setStatusMessage(msg);
      trackEvent('top_picks_announced', { count: topPicks.length });
      const t = setTimeout(() => setStatusMessage(''), 3500);
      return () => clearTimeout(t);
    }
  }, [topPicks]);

  // focus trap + Escape handler for onboarding modal
  useEffect(() => {
    if (!showOnboard) return;
    const modal = onboardModalRef.current;
    const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const nodes = modal ? Array.from(modal.querySelectorAll(focusable)) as HTMLElement[] : [];
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (first) first.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeOnboard('escape');
        trackEvent('onboard_closed_escape');
      }
      if (e.key === 'Tab') {
        if (!nodes.length) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showOnboard]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_COUNTS, JSON.stringify(copyCounts));
    } catch {}
  }, [copyCounts]);

  const saveFavorite = () => {
    if (!currentPrompt) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fav = {
      id,
      module: currentPrompt.module,
      index: currentPrompt.index,
      title: currentPrompt.title || "Untitled",
      values: fieldValues,
      createdAt: new Date().toISOString(),
    };
    setFavorites((s) => [fav, ...s].slice(0, 50));
    trackEvent("favorite_saved", { title: fav.title });
  };

  const removeFavorite = (id: string) => {
    setFavorites((s) => s.filter((f) => f.id !== id));
    trackEvent("favorite_removed", { id });
  };

  const applyFavorite = (id: string) => {
    const f = favorites.find((x) => x.id === id);
    if (!f) return;
    setSelectedModule(f.module);
    setSelectedIndex(f.index);
    setFieldValues(f.values || {});
    trackEvent("favorite_applied", { title: f.title });
  };

  const pushRecent = (values: Record<string, string>) => {
    setRecentFills((s) => {
      const next = [values, ...s];
      return next.slice(0, 20);
    });
  };

  // sample default values for common placeholders (lowercase keys)
  const SAMPLE_DEFAULTS: Record<string, string> = {
    market: "Denver, CO",
    city: "San Diego",
    neighborhood: "Capitol Hill",
    buyer: "first-time buyer",
    seller: "motivated seller",
    investor: "cash investor",
    budget: "$650k",
    timeline: "30 days",
    list: "[list]",
    tools: "Google Sheets, Canva",
  };

  const PRESET_SETS: Record<string, Record<string, string>> = {
    "Use sample defaults": SAMPLE_DEFAULTS,
    "Open house quick": { event: "Open House", time: "Sat 1-4pm", market: SAMPLE_DEFAULTS.market },
    "Buyer intro": { buyer: "first-time buyer", timeline: "30 days", budget: SAMPLE_DEFAULTS.budget },
  };

  const applyReplacements = (text: string, values: Record<string, string>) => {
    if (!text) return text;
    return text.replace(/\[([^\[\]]+)\]/g, (match, key) => {
      const k = (key || "").trim();
      if (k in values && values[k] !== "") return values[k];
      return match; // leave placeholder if no value
    });
  };

  const renderedPrompt = useMemo(() => {
    if (!currentPrompt) return "";
    const txt = buildFullPrompt(currentPrompt);
    return applyReplacements(txt, fieldValues);
  }, [currentPrompt, fieldValues]);

  const handleCopy = async () => {
    if (!currentPrompt) return;
    const txt = renderedPrompt || buildFullPrompt(currentPrompt);

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
    try {
      setStatusMessage('Copied prompt to clipboard');
      setTimeout(() => setStatusMessage(''), 3200);
    } catch {}
    // save the filled values to recent history
    try {
      pushRecent(fieldValues);
    } catch {}
    // increment copy counts
    try {
      const key = `${currentPrompt.module}||${currentPrompt.title}`;
      setCopyCounts((s) => ({ ...(s || {}), [key]: (s?.[key] || 0) + 1 }));
    } catch {}
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className={`rpv-app rpv-container ${abVariant ? `ab-${abVariant}` : ''}`}>
      {/* polite status region for screen readers */}
      <div id="rpv-status" aria-live="polite" className="sr-only">{statusMessage}</div>
      {/* Header */}
      <header className="rpv-header">
        <div className="rpv-header-row">
          <div>
            <div className="title">AI Prompt Vault for Real Estate Agents</div>
            <div className="subtitle">Pick a category below and grab a ready-made prompt for your next marketing, systems, or client problem.</div>
            {/* Intent chooser: a quick this-or-that to reduce overwhelm */}
            <div className="intent-pills" role="tablist" aria-label="Quick intents">
              {INTENT_PILLS.map((p) => (
                <button
                  key={p.key}
                  className={`intent-pill ${intent === p.key ? 'active' : ''}`}
                  onClick={() => { setIntent(intent === p.key ? null : p.key); trackEvent('intent_selected', { intent: p.key }); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="controls">
            <button ref={onboardOpenerRef} onClick={openOnboard} className="rpv-btn rpv-btn-lg rpv-btn-primary">Get tailored prompts</button>
            <button
              className="rpv-btn rpv-btn-ghost"
              onClick={() => {
                try {
                  localStorage.removeItem('rpv:onboardSeen');
                } catch {}
                openOnboard();
                trackEvent('onboard_retake');
              }}
              title="Retake onboarding"
              aria-label="Retake onboarding"
              style={{ padding: '0 10px' }}
            >Retake</button>
            <button
              className="rpv-btn rpv-btn-ghost"
              onClick={() => {
                if (!window.confirm('Clear all saved favorites? This cannot be undone.')) return;
                setFavorites([]);
                try { localStorage.removeItem(KEY_FAVORITES); } catch {}
                setStatusMessage('Favorites cleared');
                setTimeout(() => setStatusMessage(''), 2500);
                trackEvent('favorites_cleared');
              }}
              title="Clear favorites"
              aria-label="Clear favorites"
              style={{ padding: '0 10px' }}
            >Clear favs</button>
            <button
              className="rpv-btn rpv-btn-ghost"
              onClick={() => {
                if (!window.confirm('Clear recent fills?')) return;
                setRecentFills([]);
                try { localStorage.removeItem(KEY_RECENT); } catch {}
                setStatusMessage('Recent fills cleared');
                setTimeout(() => setStatusMessage(''), 2500);
                trackEvent('recent_cleared');
              }}
              title="Clear recent fills"
              aria-label="Clear recent fills"
              style={{ padding: '0 10px' }}
            >Clear recent</button>
          </div>
        </div>
      </header>

      {/* Onboarding modal (A - guided flow) */}
      {showOnboard && (
        <div className="rpv-modal-backdrop" onClick={() => closeOnboard('backdrop')}>
    <div ref={onboardModalRef} role="dialog" aria-modal="true" aria-labelledby="onboard-title" className="rpv-modal rpv-modal-lg" onClick={(e) => e.stopPropagation()}>
            <h3 id="onboard-title" style={{ marginBottom: 6 }}>What do you want to do right now?</h3>
            <div style={{ color: '#6b7280', marginBottom: 12 }}>Pick one — we'll surface ready-to-use prompts.</div>
            <div className="rpv-stepper" aria-hidden>
              <div className={`rpv-step ${onboardStep === 1 ? 'active' : ''}`}>1</div>
              <div className={`rpv-step ${onboardStep === 2 ? 'active' : ''}`}>2</div>
              <div className={`rpv-step ${onboardStep === 3 ? 'active' : ''}`}>3</div>
            </div>
            {onboardStep === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
                  {ONBOARD_INTENTS.map((it) => (
                  <button key={it.key} onClick={() => { setOnboardAnswers(a => ({ ...a, intent: it.key })); setOnboardStep(2); trackEvent('onboard_intent', { intent: it.key }); }} className="rpv-btn" style={{ padding: 12, borderRadius: 12, textAlign: 'left', minHeight: 72 }}>
                    <div style={{ fontSize: 18 }}>{it.emoji}</div>
                    <div style={{ fontWeight: 700 }}>{it.label}</div>
                  </button>
                ))}
              </div>
            )}

            {onboardStep === 2 && (
              <div>
                <h4 style={{ marginTop: 6 }}>Which best describes you?</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {ROLE_OPTIONS.map((r) => (
                    <button key={r} onClick={() => { setOnboardAnswers(a => ({ ...a, role: r })); setOnboardStep(3); trackEvent('onboard_role', { role: r }); }} className="rpv-btn rpv-btn-ghost" style={{ padding: '8px 10px' }}>{r}</button>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => setOnboardStep(1)} className="rpv-btn">Back</button>
                  <button onClick={() => { setOnboardStep(3); trackEvent('onboard_skip_role'); }} className="rpv-btn rpv-btn-ghost">Skip</button>
                </div>
              </div>
            )}

            {onboardStep === 3 && (
              <div>
                <h4 style={{ marginTop: 6 }}>Where are you focused? (optional)</h4>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input placeholder="City or neighborhood (e.g., Denver, CO)" value={onboardAnswers.market || ''} onChange={(e) => setOnboardAnswers(a => ({ ...a, market: e.target.value }))} className="modal-input" />
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => setOnboardStep(2)} className="rpv-btn">Back</button>
                  <button onClick={() => {
                    // finish: compute picks and close modal (accessibly)
                    const picks = computeTopPicks(onboardAnswers);
                    setTopPicks(picks.length ? picks : computeTopPicks({ ...onboardAnswers, intent: onboardAnswers.intent }));
                    trackEvent('onboard_completed', onboardAnswers);
                    closeOnboard('completed');
                  }} className="rpv-btn rpv-btn-primary">Show my prompts</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Favorites Manager */}
      {favorites.length > 0 && (
  <div className="rpv-collapsible mb-18">
          <div className="rpv-collapsible-header">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Favorites</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{favorites.length} saved</div>
            </div>
            <div>
              <button className="rpv-btn" onClick={() => setShowFavoritesPanel((s) => !s)} aria-expanded={showFavoritesPanel}>{showFavoritesPanel ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          {showFavoritesPanel && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {favorites.map((f) => (
                <div key={f.id} className="favorites-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{f.title}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="rpv-btn" onClick={() => applyFavorite(f.id)}>Apply</button>
                      <button className="rpv-btn" onClick={() => { setRenameModalId(f.id); setModalInput(f.title || ''); }}>Rename</button>
                      <button className="rpv-btn" onClick={() => setDeleteModalId(f.id)} style={{ color: '#b91c1c' }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                    {Object.entries(f.values || {}).slice(0, 3).map(([k, v]) => (
                      <div key={k}>{k}: {v}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rename Modal */}
      {renameModalId && (
        <div className="rpv-modal-backdrop" onClick={() => { setRenameModalId(null); setModalInput(""); }}>
          <div className="rpv-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rename favorite</h3>
            <div>
              <input value={modalInput} onChange={(e) => setModalInput(e.target.value)} style={{ width: '100%', height:36, padding:'0 8px', borderRadius:8, border:'1px solid #e5e7eb' }} />
              <div className="row">
                <button onClick={() => { if (modalInput.trim()) { setFavorites((s) => s.map((x) => x.id === renameModalId ? { ...x, title: modalInput.trim() } : x)); setRenameModalId(null); setModalInput(""); } }} style={{ height:36, borderRadius:8 }}>Save</button>
                <button onClick={() => { setRenameModalId(null); setModalInput(""); }} style={{ height:36, borderRadius:8 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalId && (
        <div className="rpv-modal-backdrop" onClick={() => setDeleteModalId(null)}>
          <div className="rpv-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete favorite?</h3>
            <div style={{ color: '#6b7280' }}>This will remove the saved favorite. This action cannot be undone.</div>
            <div className="row">
              <button onClick={() => { removeFavorite(deleteModalId); setDeleteModalId(null); }} style={{ height:36, borderRadius:8, color:'#fff', background:'#b91c1c' }}>Delete</button>
              <button onClick={() => setDeleteModalId(null)} style={{ height:36, borderRadius:8 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics (Top copied prompts) */}
      {Object.keys(copyCounts || {}).length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Usage</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Top copied prompts</div>
          </div>
          <div style={{ marginTop: 8 }}>
            {Object.entries(copyCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([k, v]) => (
                <div key={k} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ fontWeight: 700 }}>{k.split("||")[1] || k}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>{v} copies</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Category cards */}
      <div className="category-grid">
        {loading ? (
          // skeleton placeholders while loading
          Array.from({ length: 12 }).map((_, i) => (
            <div key={`sk-${i}`} className="category-card skeleton" style={{ height: 72 }} />
          ))
        ) : (
          visibleCategoryCards.map((cat) => {
          const isActive = selectedModule === cat.moduleKey;
          const isRecommended = recommendedModules.has(cat.moduleKey);
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
              className={`category-card ${isActive ? 'active' : ''} ${isRecommended ? 'recommended' : intent ? 'faded' : ''}`}
            >
              <div className="category-card-row">
                <span className="emoji">{cat.emoji}</span>
                <span className="label">{cat.label}</span>
              </div>
              <span className="tagline">{cat.tagline}</span>
            </button>
          );
          })
        )}
      </div>
      <div className="show-all-toggle">
        <button className="rpv-btn rpv-btn-ghost" onClick={() => { setShowAll((s) => !s); trackEvent('show_all_toggled', { showAll: !showAll }); }}>
          {showAll ? 'Show fewer' : `Show all categories (${CATEGORY_CARDS.length})`}
        </button>
      </div>

      {/* Top picks surfaced after onboarding */}
      {topPicks && topPicks.length > 0 && (
        <div className="top-picks-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Top picks for you</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Tailored suggestions</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            {topPicks.map((p) => (
                <div key={`${p.module}||${p.index}`} className="top-pick-card">
                  <div className="title">{p.title}</div>
                  <div className="desc">{(p.quick || '').slice(0,140)}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="rpv-btn" onClick={() => { setSelectedModule(p.module); setSelectedIndex(p.index); setFieldValues(extractPlaceholders(p).reduce((acc, k) => ({ ...acc, [k]: SAMPLE_DEFAULTS[k.toLowerCase()] || '' }), {})); trackEvent('onboard_pick_apply', { title: p.title }); }}>Use</button>
                    <button className="rpv-btn rpv-btn-primary" onClick={async () => { const txt = applyReplacements(buildFullPrompt(p), fieldValues); try { await navigator.clipboard.writeText(txt); } catch {} trackEvent('onboard_pick_copy', { title: p.title }); }}>Copy</button>
                    <button className="rpv-btn" onClick={() => { setFavorites((s) => [{ id: `${Date.now()}`, module: p.module, index: p.index, title: p.title || 'Saved', values: fieldValues, createdAt: new Date().toISOString() }, ...s].slice(0,50)); trackEvent('onboard_pick_save', { title: p.title }); }}>☆ Save</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      {!selectedModule && (
        <p className="helper-text">Choose a category above to see the prompts.</p>
      )}

      {/* Prompt selector + body */}
      {selectedModule && (
        <section style={{ marginTop: 8 }}>
          <div className="prompt-header">
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
                Pick a prompt, then copy the long version into ChatGPT and
                personalize the bracketed fields.
              </div>
            </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="rpv-row controls-row">
                <input
                  className="rpv-search"
                  placeholder={promptsForSelected.length ? "Search prompts by title or keyword…" : "No prompts"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  value={selectedIndex ?? ""}
                  onChange={(e) => {
                    const idx =
                      e.target.value === "" ? null : Number(e.target.value);
                    setSelectedIndex(idx);
                    if (idx != null) {
                      const p = filteredPrompts.find((d) => d.index === idx) || promptsForSelected.find((d) => d.index === idx);
                      trackEvent("prompt_selected", {
                        module: selectedModule,
                        title: p?.title,
                      });
                    }
                  }}
                  className="rpv-select"
                >
                  <option value="">
                    {(promptsForSelected || []).length
                      ? "Choose a prompt…"
                      : "No prompts found"}
                  </option>
                  {(filteredPrompts || promptsForSelected).map((p) => (
                    <option key={p.index} value={p.index}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
          </div>

          {currentPrompt && (
            <div className="prompt-panel">
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <span className="badge badge-accent">{displayName(currentPrompt.module)}</span>
                <span className="badge badge-muted">Long Prompt</span>
              </div>

              <div className="prompt-title">{currentPrompt.title || "Untitled Prompt"}</div>

              <div className="prompt-body">
                {renderedPrompt}
              </div>

              {/* Editable bracket fields */}
              {Object.keys(fieldValues).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div>
                    <div className="fill-variables-title">Fill variables</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Quick presets:</div>
                    <select
                      onChange={(e) => {
                        const key = e.target.value;
                        if (!key) return;
                        const set = PRESET_SETS[key];
                        if (set) setFieldValues((s) => ({ ...s, ...set }));
                      }}
                      defaultValue=""
                      style={{ height: 32, borderRadius: 8, padding: '0 8px' }}
                    >
                      <option value="">Apply a preset…</option>
                      {Object.keys(PRESET_SETS).map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.keys(fieldValues).map((k) => (
                      <label key={k} className="field-label">
                        <span style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{k}</span>
                        <input
                          value={fieldValues[k]}
                          onChange={(e) =>
                            setFieldValues((s) => ({ ...s, [k]: e.target.value }))
                          }
                          placeholder={k}
                          style={{
                            height: 36,
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            padding: "0 8px",
                            fontSize: 13,
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

                <div className="prompt-actions">
                <button onClick={handleCopy} className="rpv-btn rpv-btn-primary rpv-btn-lg">{copied ? "Copied!" : "Copy prompt"}</button>
                <button onClick={() => saveFavorite()} title="Save current filled prompt as favorite" className="rpv-btn rpv-btn-lg">☆ Save</button>

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <select
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) return;
                      applyFavorite(id);
                    }}
                    defaultValue=""
                    className="rpv-select"
                  >
                    <option value="">Favorites…</option>
                    {favorites.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                  <select
                    onChange={(e) => {
                      const i = e.target.selectedIndex - 1;
                      if (i < 0) return;
                      const vals = recentFills[i];
                      if (vals) setFieldValues(vals);
                    }}
                    defaultValue=""
                    className="rpv-select"
                  >
                    <option value="">Recent fills…</option>
                    {recentFills.map((r, idx) => (
                      <option key={idx} value={idx}>
                        {Object.values(r).slice(0, 3).join(", ")}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowFull((s) => !s)}
                  style={{ height: 36, borderRadius: 8, padding: "0 10px" }}
                >
                  {showFull ? "Collapse" : "Expand"}
                </button>

                <button
                  onClick={() => {
                    // request serverless variations (AI-powered when available)
                    (async () => {
                      if (!currentPrompt) return;
                      const base = renderedPrompt || buildFullPrompt(currentPrompt);
                      try {
                        const res = await fetch("/api/variations", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ prompt: base }),
                        });
                        if (res.ok) {
                          const j = await res.json();
                          setVariations(j.variations || [base]);
                        } else {
                          setVariations([base]);
                        }
                      } catch (e) {
                        console.warn("Variations error:", e);
                        setVariations([base]);
                      }
                    })();
                  }}
                  style={{ height: 36, borderRadius: 8, padding: "0 10px" }}
                >
                  Variations
                </button>

                <button
                  onClick={() => {
                    const txt = renderedPrompt || (currentPrompt && buildFullPrompt(currentPrompt)) || "";
                    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${(currentPrompt?.title || 'prompt').replace(/[^a-z0-9-_]/gi, '_')}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                  style={{ height: 36, borderRadius: 8, padding: "0 10px" }}
                >
                  Export
                </button>

                <a
                  href={
                    "https://chat.openai.com/" +
                    (renderedPrompt ? "?input=" + encodeURIComponent(renderedPrompt) : "")
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{ height: 36, display: "inline-flex", alignItems: "center", padding: "0 10px", borderRadius: 8, background: "#fff" }}
                >
                  Open Chat
                </a>
               
              </div>
            </div>
          )}
        </section>
      )}

      {loading && !selectedModule && (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }} aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`p-sk-${i}`} style={{ background: 'transparent' }}>
              <div className="skeleton" style={{ height: 18, width: '60%', borderRadius: 8, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 72, borderRadius: 12 }} />
            </div>
          ))}
        </div>
      )}

      {/* Commit SHA footer */}
      <div style={{ marginTop: 20, color: '#6b7280', fontSize: 12 }}>
        <CommitFooter />
      </div>
    </div>
  );
}

function CommitFooter() {
  const [sha, setSha] = useState<string | null>(null);

  useEffect(() => {
    // Prefer build-time env var (set in Vercel: REACT_APP_COMMIT_SHA = VERCEL_GIT_COMMIT_SHA)
    const envSha = process.env.REACT_APP_COMMIT_SHA || (window as any).__COMMIT__;
    if (envSha) {
      setSha(envSha);
      return;
    }

    // Fallback: try to fetch public/commit.txt which we include during repo commits
    fetch('/commit.txt')
      .then((r) => r.text())
      .then((t) => setSha(t.trim()))
      .catch(() => setSha(null));
  }, []);

  if (!sha) return <div />;
  return <div>Build: <strong style={{ fontFamily: 'monospace' }}>{sha}</strong></div>;
}