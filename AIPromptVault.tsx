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
  } catch {
    // no-op
  }
};

/* ---------- Attach module labels ---------- */

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

/* ---------- Build full prompt text (with [brackets]) ---------- */

const buildFullPrompt = (p: PromptItem): string => {
  return `Role & Outcome
Act as a ${p.role || "top 1% real-estate coach"} and produce: “${p.title}” for ${
    p.audience || "[buyer/seller/investor/agent type in [market]]"
  } in ${p.module}.

Facts / Inputs
${
  p.inputs ||
  "- KPIs = [list]\n- Tools = [list]\n- Timeline/Budget = [X]\n- Constraints = [plain, compliant language]"
}

Deliverable
${p.deliverable || "Bulleted steps + 1 table (fields relevant to this prompt)."}

Success Metrics
${
  p.success ||
  "Define measurable outcomes (e.g., response rate %, time saved, appointments set)."
}

Tool Integration
${p.tools || "Prefer Google Workspace, CRM, Make.com/Zapier, Notion, Canva as applicable."}

Iteration Loop
${p.iterate || "End by asking 2–3 questions and offering a v2 refinement path."}

${p.risk || "Risk Check: avoid protected-class targeting or unverifiable claims."}`;
};

/* ---------- Bracket helpers ---------- */

const BRACKET_REGEX = /\[([^\]]+)\]/g;

/**
 * Render text with [brackets] as inline inputs.
 */
function renderEditablePrompt(
  text: string,
  values: Record<string, string>,
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = BRACKET_REGEX.exec(text)) !== null) {
    const start = match.index;
    const end = BRACKET_REGEX.lastIndex;
    const key = match[1]; // inner text, e.g. "market" from "[market]"

    // plain text before bracket
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const value = values[key] ?? "";

    parts.push(
      <input
        key={`${key}-${start}`}
        value={value}
        placeholder={key}
        onChange={(e) =>
          setValues((prev) => ({
            ...prev,
            [key]: e.target.value,
          }))
        }
        style={{
          display: "inline-block",
          minWidth: Math.max(80, key.length * 8),
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          padding: "2px 6px",
          margin: "0 2px",
          fontSize: 13,
          fontFamily:
            "system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial,sans-serif",
          background: "#f9fafb",
        }}
      />
    );

    lastIndex = end;
  }

  // trailing text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Build final string with user values instead of [brackets].
 * Empty values keep the original [token].
 */
function buildPromptWithValues(
  text: string,
  values: Record<string, string>
): string {
  return text.replace(BRACKET_REGEX, (_match, key: string) => {
    const v = values[key];
    return v && v.trim().length > 0 ? v.trim() : `[${key}]`;
  });
}

/* ---------- Merge Remote Prompts ---------- */

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

  // Re-index within modules
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

/* ---------- Main Component ---------- */

export default function AIPromptVault() {
  const [data, setData] = useState<PromptItem[]>([]);
  const [modulesList, setModulesList] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copiedBase, setCopiedBase] = useState(false);
  const [copiedFilled, setCopiedFilled] = useState(false);
  const [loading, setLoading] = useState(true);

  // values for each [bracket] token
  const [editableValues, setEditableValues] = useState<Record<string, string>>(
    {}
  );

  // Build base data & load remote on mount
  useEffect(() => {
    const baseArr = fullPrompts.flatMap((m, i) => attachModule(i + 1, m));
    setData(baseArr);
    setModulesList(Array.from(new Set(baseArr.map((d) => d.module)));

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

  // Clear bracket values when switching prompts
  useEffect(() => {
    setEditableValues({});
  }, [selectedModule, selectedIndex]);

  const basePromptText = useMemo(
    () => (current ? buildFullPrompt(current) : ""),
    [current]
  );

  const filledPromptText = useMemo(
    () => (current ? buildPromptWithValues(basePromptText, editableValues) : ""),
    [basePromptText, editableValues, current]
  );

  const handleCopyBase = async () => {
    if (!current) return;
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
    trackEvent("prompt_copied_raw", { title: current.title, module: current.module });
    setTimeout(() => setCopiedBase(false), 1200);
  };

  const handleCopyFilled = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(filledPromptText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = filledPromptText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiedFilled(true);
    trackEvent("prompt_copied_filled", {
      title: current.title,
      module: current.module,
    });
    setTimeout(() => setCopiedFilled(false), 1200);
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
          Browse advanced “superprompts” organized by module. Edit the fields
          inline, copy, and paste directly into ChatGPT.
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

          {/* Editable prompt body */}
          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.45,
              color: "#111827",
              fontSize: 14,
            }}
          >
            {renderEditablePrompt(
              basePromptText,
              editableValues,
              setEditableValues
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              marginTop: 14,
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
              {copiedBase ? "Copied!" : "Copy with [fields]"}
            </button>

            <button
              onClick={handleCopyFilled}
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
              {copiedFilled ? "Copied!" : "Copy with your inputs"}
            </button>
          </div>

          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
            Type directly into the highlighted fields (like{" "}
            <code>[market]</code> or <code>[budget]</code>) before copying.
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