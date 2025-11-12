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

export const extractPlaceholders = (p: PromptItem | null): string[] => {
  if (!p) return [];
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

  const built = buildFullPrompt(p);
  rx.lastIndex = 0;
  while ((m = rx.exec(built))) {
    const tok = m[1].trim();
    if (tok) found.add(tok);
  }

  return Array.from(found);
};

export const applyReplacements = (text: string, values: Record<string, string>) => {
  if (!text) return text;
  return text.replace(/\[([^\[\]]+)\]/g, (match, key) => {
    const k = (key || "").trim();
    if (k in values && values[k] !== "") return values[k];
    return match;
  });
};
