// wizardPromptBuilder.ts
// Extracted enhanced wizard prompt synthesis for unit testing & reuse.

export function buildEnhancedWizardPrompt(
  basePromptText: string,
  challengeKey: string,
  answers: Record<string, string>
): string {
  const cleanEntries = Object.entries(answers)
    .filter(([k, v]) => !k.endsWith('_custom') && String(v || '').trim().length > 0);

  const pickValues = (regex: RegExp) => cleanEntries.filter(([k]) => regex.test(k)).map(([, v]) => v.trim());
  const goals = pickValues(/goal|desiredOutcome|topGoal|strategicGoal/i);
  const blockers = pickValues(/obstacle|blocker|blockers|biggestBlocker|shiftConcern/i);
  const situationParts = pickValues(/challengeSummary|situation|market|propertyType|clientType/i);
  const timeframe = pickValues(/urgency|cadence|timeframe/i);
  const tone = pickValues(/tone/i);
  const channels = pickValues(/channel|timeBlocks/i);

  const situationLine = situationParts.join('; ');
  const goalsLine = goals.join('; ');
  const blockersLine = blockers.join('; ');
  const channelLine = channels.join('; ');
  const timeframeLine = timeframe.join('; ');
  const toneLine = tone.join('; ');

  const resolvedSituation = situationLine || 'Real estate professional seeking strategic guidance.';

  const contextBullets = cleanEntries
    .map(([k, v]) => `- ${k.replace(/([A-Z])/g, ' $1')}: ${v}`)
    .join('\n');

  const structureInstructions = `\n\nTASK: Using the CONTEXT, produce a structured, copy-ready output with the following sections:\n1. Situation Snapshot (1 concise paragraph summarizing current state).\n2. Objectives (bullet list; include any timeframe).\n3. Constraints & Challenges (bullet list; prioritize blockers).\n4. Recommended Strategy (short paragraph followed by 3 strategic pillars).\n5. Immediate Action Steps (Today, This Week, This Month – each with 2-3 concrete actions).\n6. Refinement Cues (3 smart follow-up prompts the user could ask next).\n\nGUIDELINES:\n- Be specific and actionable; avoid fluff or generic coaching phrases.\n- No demographic descriptors (avoid age, ethnicity, family status).\n- Keep tone professional, encouraging, and high-clarity.${toneLine ? `\n- Adopt a tone that is: ${toneLine}.` : ''}${channelLine ? `\n- Consider primary channels: ${channelLine}.` : ''}${timeframeLine ? `\n- Timeframe considerations: ${timeframeLine}.` : ''}\n- Do NOT invent metrics; only suggest realistic tracking ideas.\n- Return plain text (no markdown asterisks, no code fences).`;

  const preface = `You are an expert real estate growth strategist and marketing operations assistant. Provide a rigorously structured answer tailored to the specifics provided. First, internalize the context, then output ONLY the requested sections.`;

  const composite = `${preface}\n\nCONTEXT:\n${contextBullets}\n${structureInstructions}\n\nAdditional synthesis hints:\n- Core situation: ${resolvedSituation}\n- Primary goals: ${goalsLine || 'Clarify with user.'}\n- Key blockers: ${blockersLine || 'Not explicitly stated.'}`;

  return `${basePromptText}\n\n${composite}`.trim();
}

export interface EnhancedPromptSectionsPresence {
  situation: boolean;
  objectives: boolean;
  constraints: boolean;
  strategy: boolean;
  actions: boolean;
  refinement: boolean;
}

export function detectEnhancedSections(text: string): EnhancedPromptSectionsPresence {
  const lc = text.toLowerCase();
  return {
    situation: /situation snapshot/.test(lc),
    objectives: /objectives/.test(lc),
    constraints: /constraints & challenges/.test(lc),
    strategy: /recommended strategy/.test(lc),
    actions: /immediate action steps/.test(lc),
    refinement: /refinement cues/.test(lc)
  };
}
