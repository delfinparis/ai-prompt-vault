"use client";
import React, { useEffect, useState } from "react";
import { prompts as fullPrompts } from "./prompts";
import { labelOverrides, type LabelOverride } from "./labelOverrides";

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
};

type RemotePrompt = Omit<PromptItem, "module" | "index">;
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
  return (h >>> 0).toString(36).slice(0, 6);
};

const generatePromptId = (title: string, moduleName: string, index?: number): string => {
  const base = `${slugify(title || "untitled")}__${shortHash(displayName(moduleName))}`;
  return typeof index === "number" ? `${base}-${index}` : base;
};

/* ---------- Tracking ---------- */
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

function getLabelOverride(moduleKey: string, originalTitle: string):
  { title: string; subtitle?: string } {
  const list: LabelOverride[] | undefined = labelOverrides[moduleKey];
  if (!list) return { title: originalTitle };
  const hit = list.find((l) => l.match === originalTitle);
  return hit ? { title: hit.title, subtitle: hit.subtitle } : { title: originalTitle };
}

/* ---------- Build long prompt ---------- */

const buildFullPrompt = (p: PromptItem): string => {
  const moduleName = p.module || "Category";
  const title = p.title || "Prompt";
  const audience =
    p.audience || "[buyer/seller/investor/agent type in [market]]";
  const inputs =
    p.inputs ||
    "- KPIs = [list]\n- Tools = [list]\n- Timeline/Budget = [X]\n- Constraints = [plain, compliant language]";
  const deliverable =
    p.deliverable || "Bulleted steps + 1 table (fields relevant to this prompt).";
  const constraints =
    p.constraints ||
    "≤ 400 words; use headings; avoid guarantees; fair-housing safe.";
  const quality =
    (p as any).quality ||
    "Add ‘Why this works’ and 3 clarifying questions. Propose 2 ways to improve the first draft.";
  const success =
    p.success ||
    "Define measurable outcomes (response rate %, time saved, appointments set).";
  const tools =
    p.tools ||
    "Prefer Google Workspace, CRM, Make.com/Zapier, Notion, Canva as applicable.";
  const iterate =
    p.iterate ||
    "End by asking 2–3 questions and offering a v2 refinement path.";
  const risk =
    p.risk ||
    "Risk Check: keep claims verifiable; avoid protected-class targeting; keep language compliant.";

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

  const promptsForSelected = selectedModule
    ? data.filter((d) => d.module === selectedModule)
    : [];

  const filteredData = searchQuery.trim()
    ? data.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          (p.title || "").toLowerCase().includes(q) ||
          (p.quick || "").toLowerCase().includes(q) ||
          (p.role || "").toLowerCase().includes(q) ||
          (p.module || "").toLowerCase().includes(q)
        );
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

  const addToRecent = (prompt: PromptItem) => {
    const entry = { id: prompt.id, timestamp: Date.now() };
    setRecentPrompts((prev) => {
      const filtered = prev.filter((p) => p.id !== entry.id);
      const updated = [entry, ...filtered].slice(0, 10);
      try { localStorage.setItem("rpv:recentIds", JSON.stringify(updated)); } catch {}
      return updated;
    });
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

      {viewMode === "browse" && (
        <>
      {/* Search Results */}
      {searchQuery.trim() && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
            Search Results ({filteredData.length})
          </div>
          {filteredData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
              <div style={{ fontSize: 14 }}>
                No prompts found for "{searchQuery}"
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredData.map((p) => (
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
                    trackEvent("search_prompt_selected", { title: p.title, query: searchQuery });
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                      {p.title}
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
      </>
      )}

      {/* Prompt selector + body */}
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
                Pick a prompt, then copy the long version into ChatGPT and
                personalize the bracketed fields.
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
                }}
              >
                {currentPrompt.title || "Untitled Prompt"}
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

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
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

          {favorites.size > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                ⭐ Favorites ({favorites.size})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.filter((p) => favorites.has(p.id)).map((p) => (
                  <div
                    key={p.id}
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
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{displayName(p.module)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          setSelectedModule(p.module);
                          setSelectedIndex(p.index);
                          setViewMode("browse");
                          trackEvent("library_prompt_opened", { id: p.id });
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
            </div>
          )}

          {recentPrompts.length > 0 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                🕒 Recent ({recentPrompts.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentPrompts.map((r, i) => {
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
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                          {prompt.title}
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
            </div>
          )}
        </div>
      )}

    </div>
  );
}