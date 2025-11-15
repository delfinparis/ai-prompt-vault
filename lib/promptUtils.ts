// lib/promptUtils.ts
// Minimal server-side copy of buildFullPrompt used by API routes to avoid importing from src/

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
