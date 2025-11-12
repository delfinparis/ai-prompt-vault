"use client";

import React, { useEffect, useMemo, useState } from "react";
import { prompts as fullPrompts } from "./prompts";

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

type BuilderValues = {
  market: string;
  persona: string;
  channel: string;
  goal: string;
  budget: string;
  timeline: string;
  tone: string;
  platform: string;
};

/* ---------- Constants ---------- */

const REMOTE_JSON_URL =
  "https://script.google.com/macros/s/AKfycbww3SrcmhMY8IMPiSmj7OdqM3cUSVtfU0LuyVtqF9mvdbQjhdoHXASfMhEg4cam577dRw/exec";

const KEY_REMOTE_CACHE = "rpv:remoteCache";
const KEY_REMOTE_VER = "rpv:remoteVersion";

const moduleNames = [
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
    window.dispatchEvent(new CustomEvent("rpv_event", { detail: { name, ...data } }));
    // window.gtag?.("event", name, data);
    // window.fbq?.("trackCustom", name, data);
  } catch {
    // no-op
  }
};

/* ---------- Data helpers ---------- */

const attachModule = (
  moduleIndex: number,
  prompts: Omit<PromptItem, "module" | "index">[]
): PromptItem[] => {
  const moduleLabel = `Module ${moduleIndex} — ${moduleNames[moduleIndex - 1]}`;
  return prompts.map((p, i) => ({
    ...p,
    module: moduleLabel,
    index: i,
  }));
};

function buildFullPrompt(p: PromptItem): string {
  return `Role & Outcome
Act as a ${p.role || "top 1% real-estate coach"} and produce: “${
    p.title
  }” for ${p.audience || "[buyer/seller/investor/agent type in [market]]"} in ${
    p.module
  }.

Facts / Inputs
${
  p.inputs ||
  "- KPIs = [list]\n- Tools = [list]\n- Timeline/Budget = [budget]\n- Constraints = [plain, compliant language]"
}

Deliverable
${
  p.deliverable ||
  "Bulleted steps + 1 table (fields relevant to this prompt)."
}

Success Metrics
${
  p.success ||
  "Define measurable outcomes (response rate %, time saved, appointments set, conversion rate)."
}

Tool Integration
${
  p.tools ||
  "Prefer Google Workspace, CRM, Make.com/Zapier, Notion, Canva as applicable."
}

Iteration Loop
${p.iterate || "End by asking 2–3 questions and offering a v2 refinement path."}

${
  p.risk ||
  "Risk Check: avoid protected-class targeting or unverifiable claims. Keep language fair-housing safe."
}`;
}

/* ---------- Remote merge ---------- */

function mergeRemote(base: PromptItem[], remote: RemotePayload): PromptItem[] {
  if (!remote?.modules) return base;

  const result = [...base];
  const existingTitles = new Set(
    base.map((b) => (b.title || "").toLowerCase().trim())
  );

  Object.entries(remote.modules).forEach(([rawModuleName, prompts]) => {
    if (!Array.isArray(prompts)) return;

    prompts.forEach((r, idx) => {
      const t = (r.title || "").toLowerCase().trim();
      if (!t || existingTitles.has(t)) return;

      const matchedModule =
        base.find(
          (b) =>
            displayName(b.module).toLowerCase().trim() ===
            rawModuleName.toLowerCase().trim()
        )?.module || `Module ? — ${rawModuleName}`;

      result.push({
        ...r,
        module: matchedModule,
        index: idx,
      });
      existingTitles.add(t);
    });
  });

  // Re-index within each module
  const byModule: Record<string, PromptItem[]> = {};
  result.forEach((p) => {
    if (!byModule[p.module]) byModule[p.module] = [];
    byModule[p.module].push(p);
  });

  const final: PromptItem[] = [];
  Object.keys(byModule).forEach((m) => {
    byModule[m].forEach((p, i) => final.push({ ...p, index: i }));
  });

  return final;
}

/* ---------- Builder substitution ---------- */

function buildPromptWithBuilderValues(
  base: string,
  values: BuilderValues
): string {
  let out = base;

  const replaceToken = (pattern: RegExp, value: string) => {
    if (!value.trim()) return;
    out = out.replace(pattern, value.trim());
  };

  // You can add more tokens later if you want
  replaceToken(/\[market\]/gi, values.market);
  replaceToken(/\[buyer persona\]/gi, values.persona);
  replaceToken(/\[persona\]/gi, values.persona);
  replaceToken(/\[channel\]/gi, values.channel);
  replaceToken(/\[goal\]/gi, values.goal);
  replaceToken(/\[budget\]/gi, values.budget);
  replaceToken(/\[timeline\]/gi, values.timeline);
  replaceToken(/\[time horizon\]/gi, values.timeline);
  replaceToken(/\[tone\]/gi, values.tone);
  replaceToken(/\[platform\]/gi, values.platform);

  return out;
}

/* ---------- Main Component ---------- */

export default function AIPromptVault() {
  const [data, setData] = useState<PromptItem[]>([]);
  const [modulesList, setModulesList] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copiedBase, setCopiedBase] = useState(false);
  const [copiedBuilt, setCopiedBuilt] = useState(false);
  const [loading, setLoading] = useState(true);

  const [builderValues, setBuilderValues] = useState<BuilderValues>({
    market: "",
    persona: "",
    channel: "",
    goal: "",
    budget: "",
    timeline: "",
    tone: "",
    platform: "",
  });

  // Load base + remote
  useEffect(() => {
    const baseArr = (fullPrompts as Omit<PromptItem, "module" | "index">[][]).flatMap(
      (m, i) => attachModule(i + 1, m)
    );

    setData(baseArr);
    setModulesList(Array.from(new Set(baseArr.map((d) => d.module))));

    (async () => {
      try {
        const cachedStr = localStorage.getItem(KEY_REMOTE_CACHE);
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr) as RemotePayload;
            const merged = mergeRemote(baseArr, cached);
            setData(merged);
            setModulesList(Array.from(new Set(merged.map((d) => d.module))));
          } catch {
            // ignore cache parse errors
          }
        }

        const res = await fetch(REMOTE_JSON_URL, { cache: "no-store" });
        if (!res.ok) return;
        const remote = (await res.json()) as RemotePayload;
        const ver = remote.version || "";
        const oldVer = localStorage.getItem(KEY_REMOTE_VER);

        if (!oldVer || oldVer !== ver) {
          const merged = mergeRemote(baseArr, remote);
          setData(merged);
          setModulesList(Array.from(new Set(merged.map((d) => d.module))));
          localStorage.setItem(KEY_REMOTE_CACHE, JSON.stringify(remote));
          localStorage.setItem(KEY_REMOTE_VER, ver);
        }
      } catch (e) {
        console.warn("Remote load failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const current = useMemo(
    () =>
      selectedModule && selectedIndex != null
        ? data.find(
            (d) => d.module === selectedModule && d.index === selectedIndex
          ) || null
        : null,
    [data, selectedModule, selectedIndex]
  );

  const basePromptText = useMemo(
    () => (current ? buildFullPrompt(current) : ""),
    [current]
  );

  const builtPromptText = useMemo(
    () =>
      basePromptText
        ? buildPromptWithBuilderValues(basePromptText, builderValues)
        : "",
    [basePromptText, builderValues]
  );

  const handleCopyBase = async () => {
    if (!basePromptText) return;
    try {
      await navigator.clipboard.writeText(basePromptText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = basePromptText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiedBase(true);
    if (current) {
      trackEvent("prompt_copied_base", {
        title: current.title,
        module: current.module,
      });
    }
    setTimeout(() => setCopiedBase(false), 1200);
  };

  const handleCopyBuilt = async () => {
    const textToCopy = builtPromptText || basePromptText;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiedBuilt(true);
    if (current) {
      trackEvent("prompt_copied_built", {
        title: current.title,
        module: current.module,
      });
    }
    setTimeout(() => setCopiedBuilt(false), 1200);
  };

  const handleBuilderChange = (field: keyof BuilderValues, value: string) => {
    setBuilderValues((prev) => ({ ...prev, [field]: value }));
    trackEvent("builder_field_changed", { field, value });
  };

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "28px 20px",
        fontFamily:
          "system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial,sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>
          AI Prompt Vault for Real Estate Agents
        </div>
        <div style={{ color: "#6b7280", fontSize: 14 }}>
          Browse advanced superprompts organized by module. Fill in your details
          in the builder, then copy the full prompt into ChatGPT.
        </div>
      </div>

      {/* Module selector */}
      <select
        value={selectedModule}
        onChange={(e) => {
          const value = e.target.value;
          setSelectedModule(value);
          setSelectedIndex(null);
          trackEvent("module_selected", { module: value });
        }}
        style={{
          height: 42,
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          padding: "0 12px",
          background: "#fff",
          fontSize: 14,
          marginBottom: 10,
        }}
      >
        <option value="">Select a module</option>
        {modulesList.map((m) => (
          <option key={m} value={m}>
            {displayName(m)}
          </option>
        ))}
      </select>

      {/* Prompt selector */}
      <select
        disabled={!selectedModule}
        value={selectedIndex ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          const idx = raw === "" ? null : Number(raw);
          setSelectedIndex(idx);
          if (idx != null) {
            const p = data.find(
              (d) => d.module === selectedModule && d.index === idx
            );
            trackEvent("prompt_selected", {
              module: selectedModule,
              title: p?.title,
            });
          }
        }}
        style={{
          height: 42,
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          padding: "0 12px",
          background: selectedModule ? "#fff" : "#f8fafc",
          fontSize: 14,
        }}
      >
        <option value="">Select a prompt…</option>
        {selectedModule &&
          data
            .filter((d) => d.module === selectedModule)
            .map((p) => (
              <option key={p.index} value={p.index}>
                {p.title}
              </option>
            ))}
      </select>

      {/* Prompt card */}
      {current && (
        <div
          style={{
            marginTop: 18,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 10px 24px rgba(12,35,64,.06)",
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
                fontSize: 12,
                padding: "4px 8px",
                background: "#eef2ff",
                color: "#334155",
                borderRadius: 999,
              }}
            >
              {displayName(current.module)}
            </span>
            <span
              style={{
                fontSize: 12,
                padding: "4px 8px",
                background: "#eef2ff",
                color: "#334155",
                borderRadius: 999,
              }}
            >
              Long Prompt
            </span>
          </div>

          <div
            style={{
              fontWeight: 800,
              margin: "4px 0 8px",
              fontSize: 18,
            }}
          >
            {current.title}
          </div>

          {/* Original prompt (for reference / manual copy) */}
          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.45,
              color: "#111827",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {basePromptText}
          </div>

          <div
            style={{
              marginBottom: 14,
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleCopyBase}
              style={{
                height: 40,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                padding: "0 12px",
                background: "#f1f5f9",
                color: "#0c2340",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copiedBase ? "Copied original prompt!" : "Copy base prompt"}
            </button>
          </div>

          {/* Builder */}
          <div
            style={{
              marginTop: 4,
              paddingTop: 16,
              borderTop: "1px dashed #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 10,
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              Prompt Builder (beta)
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 6px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  color: "#6b7280",
                }}
              >
                Fill fields → copy built prompt
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <BuilderField
                label="Market"
                placeholder="Chicago North Side"
                value={builderValues.market}
                onChange={(v) => handleBuilderChange("market", v)}
              />
              <BuilderField
                label="Buyer / Persona"
                placeholder="first-time buyers, move-up sellers"
                value={builderValues.persona}
                onChange={(v) => handleBuilderChange("persona", v)}
              />
              <BuilderField
                label="Primary Channel"
                placeholder="YouTube, Instagram Reels, email"
                value={builderValues.channel}
                onChange={(v) => handleBuilderChange("channel", v)}
              />
              <BuilderField
                label="Main Goal"
                placeholder="15 qualified leads/month"
                value={builderValues.goal}
                onChange={(v) => handleBuilderChange("goal", v)}
              />
              <BuilderField
                label="Budget"
                placeholder="$1,500/mo ad spend"
                value={builderValues.budget}
                onChange={(v) => handleBuilderChange("budget", v)}
              />
              <BuilderField
                label="Timeline / Time Horizon"
                placeholder="next 90 days"
                value={builderValues.timeline}
                onChange={(v) => handleBuilderChange("timeline", v)}
              />
              <BuilderField
                label="Tone / Voice"
                placeholder="casual but data-backed"
                value={builderValues.tone}
                onChange={(v) => handleBuilderChange("tone", v)}
              />
              <BuilderField
                label="AI Platform"
                placeholder="ChatGPT, Claude, Gemini"
                value={builderValues.platform}
                onChange={(v) => handleBuilderChange("platform", v)}
              />
            </div>

            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
              This builder auto-fills tokens like <code>[market]</code>,{" "}
              <code>[buyer persona]</code>, <code>[channel]</code>,{" "}
              <code>[goal]</code>, and <code>[budget]</code> wherever they
              appear in the prompt.
            </div>

            <textarea
              readOnly
              value={builtPromptText || basePromptText}
              style={{
                width: "100%",
                minHeight: 180,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                padding: 10,
                fontFamily: "inherit",
                fontSize: 13,
                lineHeight: 1.45,
                resize: "vertical",
                background: "#f9fafb",
              }}
            />

            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                onClick={handleCopyBuilt}
                style={{
                  height: 40,
                  borderRadius: 10,
                  border: "1px solid #0f172a",
                  padding: "0 12px",
                  background: "#0f172a",
                  color: "#f9fafb",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copiedBuilt ? "Built prompt copied!" : "Copy prompt with my details"}
              </button>

              <span style={{ fontSize: 11, color: "#6b7280" }}>
                Leave fields blank to fall back to the original prompt text.
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
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

      {loading && !current && (
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>
          Loading prompts…
        </p>
      )}
    </div>
  );
}

/* ---------- Small subcomponent ---------- */

type BuilderFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

function BuilderField({ label, placeholder, value, onChange }: BuilderFieldProps) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
      <span style={{ color: "#374151", fontWeight: 600 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          height: 36,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          padding: "0 10px",
          fontSize: 13,
        }}
      />
    </label>
  );
}