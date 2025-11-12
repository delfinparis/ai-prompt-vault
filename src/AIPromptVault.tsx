"use client";
import React, { useEffect, useState } from "react";
import { prompts as fullPrompts } from "./prompts";
import { labelOverrides, type LabelOverride } from "./labelOverrides";

/* ---------- Types ---------- */
type PromptItem = {
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
const REMOTE_JSON_URL =
  "https://script.google.com/macros/s/AKfycbww3SrcmhMY8IMPiSmj7OdqM3cUSVtfU0LuyVtqF9mvdbQjhdoHXASfMhEg4cam577dRw/exec";

const KEY_REMOTE_CACHE = "rpv:remoteCache";
const KEY_REMOTE_VER = "rpv:remoteVersion";

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

const displayName = (m: string) => m.replace(/^Module\s+\d+\s+—\s+/i, "");

/* ---------- Tracking ---------- */
const trackEvent = (name: string, data?: Record<string, any>) => {
  try {
    window.dispatchEvent(
      new CustomEvent("rpv_event", { detail: { name, ...data } })
    );
  } catch {
    // no-op
  }
};

/* ---------- Category Cards ---------- */
type CategoryMeta = {
  id: number;
  moduleKey: string;
  label: string;
  emoji: string;
  tagline: string;
};

const CATEGORY_CARDS: CategoryMeta[] = [
  { id: 1,  moduleKey: `Module 1 — ${MODULE_TITLES[0]}`,  label: "Get More Leads",       emoji: "📣", tagline: "Prompts for ads, content, funnels, and campaigns." },
  { id: 2,  moduleKey: `Module 2 — ${MODULE_TITLES[1]}`,  label: "Fix My Systems",       emoji: "🧩", tagline: "Checklists, SOPs, and daily/weekly workflows." },
  { id: 3,  moduleKey: `Module 3 — ${MODULE_TITLES[2]}`,  label: "Hit My Goals",         emoji: "🎯", tagline: "Scorecards, habit templates, and sprints." },
  { id: 4,  moduleKey: `Module 4 — ${MODULE_TITLES[3]}`,  label: "Win More Appointments",emoji: "📅", tagline: "Scripts and outlines for buyers and sellers." },
  { id: 5,  moduleKey: `Module 5 — ${MODULE_TITLES[4]}`,  label: "Wow My Clients",       emoji: "✨", tagline: "Onboarding, updates, and surprise & delight." },
  { id: 6,  moduleKey: `Module 6 — ${MODULE_TITLES[5]}`,  label: "Boost My Profit",      emoji: "💰", tagline: "Cashflow, budgets, and profitability audits." },
  { id: 7,  moduleKey: `Module 7 — ${MODULE_TITLES[6]}`,  label: "Win More Deals",       emoji: "🤝", tagline: "Negotiation playbooks and deal rescues." },
  { id: 8,  moduleKey: `Module 8 — ${MODULE_TITLES[7]}`,  label: "Find Better Homes",    emoji: "🏡", tagline: "Search strategies and buyer tools." },
  { id: 9,  moduleKey: `Module 9 — ${MODULE_TITLES[8]}`,  label: "Nurture My Sphere",    emoji: "🌱", tagline: "Touch plans, events, and local content." },
  { id: 10, moduleKey: `Module 10 — ${MODULE_TITLES[9]}`, label: "Improve My Marketing", emoji: "📈", tagline: "Funnels, CRO, and AI-powered assets." },
  { id: 11, moduleKey: `Module 11 — ${MODULE_TITLES[10]}`,label: "Automate My Business", emoji: "⚙️", tagline: "Lead routing, drips, and bots." },
  { id: 12, moduleKey: `Module 12 — ${MODULE_TITLES[11]}`,label: "Level Up & Learn",     emoji: "📚", tagline: "Curated learning and research prompts." },
];

/* ---------- Helpers: attach module / overrides ---------- */
const attachModule = (
  moduleIndex: number,
  items: Omit<PromptItem, "module" | "index">[]
): PromptItem[] => {
  const moduleName = `Module ${moduleIndex} — ${MODULE_TITLES[moduleIndex - 1]}`;
  return items.map((p, i) => ({ ...p, module: moduleName, index: i }));
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
  const audience = p.audience || "[buyer/seller/investor/agent type in [market]]";
  const inputs =
    p.inputs ||
    "- KPIs = [list]\n- Tools = [list]\n- Timeline/Budget = [X]\n- Constraints = [plain, compliant language]";
  const deliverable =
    p.deliverable || "Bulleted steps + 1 table (fields relevant to this prompt).";
  const constraints =
    p.constraints || "≤ 400 words; use headings; avoid guarantees; fair-housing safe.";
  const quality =
    (p as any).quality ||
    "Add ‘Why this works’ and 3 clarifying questions. Propose 2 ways to improve the first draft.";
  const success =
    p.success || "Define measurable outcomes (response rate %, time saved, appointments set).";
  const tools =
    p.tools || "Prefer Google Workspace, CRM, Make.com/Zapier, Notion, Canva as applicable.";
  const iterate =
    p.iterate || "End by asking 2–3 questions and offering a v2 refinement path.";
  const risk =
    p.risk || "Risk Check: keep claims verifiable; avoid protected-class targeting; keep language compliant.";

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

/* ---------- Merge remote ---------- */
function mergeRemote(base: PromptItem[], remote: RemotePayload): PromptItem[] {
  if (!remote?.modules) return base;

  const result = [...base];
  const existing = new Set(base.map((b) => (b.title || "").toLowerCase().trim()));
  const baseModules = Array.from(new Set(base.map((b) => b.module)));

  const findModuleKey = (label: string): string | null => {
    const exact = baseModules.find((m) => m === label);
    if (exact) return exact;
    const target = label.trim().toLowerCase();
    const match = baseModules.find((m) => displayName(m).trim().toLowerCase() === target);
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

      result.push({ ...r, module: targetModule, index: nextIndex++ });
      existing.add(t);
    });
  });

  return result;
}

/* ---------- Main ---------- */
export default function AIPromptVault() {
  const [data, setData] = useState<PromptItem[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // preload base + remote
  useEffect(() => {
    const baseArr: PromptItem[] = fullPrompts.flatMap((m, i) => attachModule(i + 1, m));
    setData(baseArr);

    (async () => {
      try {
        const cachedStr = localStorage.getItem(KEY_REMOTE_CACHE);
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr) as RemotePayload;
            const merged = mergeRemote(baseArr, cached);
            setData(merged);
          } catch {
            /* ignore cache errors */
          }
        }

        const res = await fetch(REMOTE_JSON_URL, { cache: "no-store" });
        if (!res.ok) { setLoading(false); return; }
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

  const currentPrompt =
    selectedModule != null && selectedIndex != null
      ? data.find((d) => d.module === selectedModule && d.index === selectedIndex) || null
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
    trackEvent("prompt_copied", { title: currentPrompt.title, module: currentPrompt.module });
    setTimeout(() => setCopied(false), 1200);
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
      </header>

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
                const nextModule = selectedModule === cat.moduleKey ? "" : cat.moduleKey;
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
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#020617" }}>
                  {cat.label}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{cat.tagline}</span>
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      {!selectedModule && (
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
          Choose a category above to see the prompts.
        </p>
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
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                Prompts in {displayName(selectedModule)}
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                Pick a prompt and copy the long version into ChatGPT. (Fields in brackets can be personalized.)
              </div>
            </div>

            <select
              value={selectedIndex ?? ""}
              onChange={(e) => {
                const idx = e.target.value === "" ? null : Number(e.target.value);
                setSelectedIndex(idx);
                if (idx != null) {
                  const p = promptsForSelected.find((d) => d.index === idx);
                  trackEvent("prompt_selected", {
                    module: selectedModule,
                    title: p?.title,
                  });
                }
              }}
              style={{
                height: 40,
                minWidth: 260,
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                padding: "0 14px",
                background: "#ffffff",
                fontSize: 13,
                color: "#111827",
              }}
            >
              <option value="">
                {promptsForSelected.length ? "Choose a prompt…" : "No prompts found"}
              </option>
              {promptsForSelected.map((p) => {
                const { title: niceTitle } = getLabelOverride(p.module, p.title);
                return (
                  <option key={p.index} value={p.index}>
                    {niceTitle}
                  </option>
                );
              })}
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
              </div>

              {/* Overridden title + subtitle */}
              {(() => {
                const { title: niceTitle, subtitle } = getLabelOverride(
                  currentPrompt.module,
                  currentPrompt.title
                );
                return (
                  <>
                    <div
                      style={{
                        fontWeight: 800,
                        margin: "4px 0 4px",
                        fontSize: 18,
                        color: "#020617",
                      }}
                    >
                      {niceTitle}
                    </div>
                    {subtitle && (
                      <div
                        style={{
                          marginBottom: 8,
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        {subtitle}
                      </div>
                    )}
                  </>
                );
              })()}

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
                {/* Removed the "Copy → paste..." helper line per your request */}
              </div>

              <div
                style={{
                  marginTop: 16,
                  paddingTop: 10,
                  borderTop: "1px dashed #e5e7eb",
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                Fair-housing &amp; compliance: avoid protected-class targeting,
                medical/financial inferences, and unverifiable claims.
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
    </div>
  );
}