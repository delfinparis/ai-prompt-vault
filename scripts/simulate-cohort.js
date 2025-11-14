#!/usr/bin/env node
// Synthetic cohort simulation for AI Prompt Vault (10,000 users)
// Generates event-level metrics and actionable feedback suggestions.

const fs = require('fs');
const path = require('path');

// --- Config ---
const N_USERS = 10000;
const SEED = 20251113;
const OUT_DIR = path.join(__dirname, '..', 'reports', 'simulations');
const DATE_TAG = new Date().toISOString().slice(0, 10);

// --- Seeded PRNG (mulberry32) ---
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const r = (min = 0, max = 1) => min + (max - min) * rand();
const pick = (arr) => arr[Math.floor(r(0, arr.length))];

// --- Wizard categories (approximate keys) ---
const CATEGORIES = [
  'lead_generation',
  'listing_marketing',
  'client_management',
  'productivity',
  'market_strategy',
  'custom',
];

// --- Compute quality meta (mirrors app logic) ---
function computeQualityMeta(answers, totalQuestions) {
  const entries = Object.entries(answers).filter(([k]) => !k.endsWith('_custom'));
  const nonEmpty = entries.filter(([, v]) => String(v).trim().length > 0);
  const keysJoined = nonEmpty.map(([k]) => k).join(',');
  const lenTotal = nonEmpty.reduce((s, [, v]) => s + String(v).length, 0);
  const hasGoal = /goal|topGoal|desiredOutcome|strategicGoal/.test(keysJoined);
  const hasBlocker = /obstacle|blocker|blockers|biggestBlocker|shiftConcern/.test(keysJoined);
  const hasSituation = /market|propertyType|challengeSummary|situation|clientType/.test(keysJoined);
  const hasTone = /tone/.test(keysJoined);
  const hasTimeframe = /urgency|cadence|timeframe/.test(keysJoined);
  let score = 0;
  if (hasSituation) score += 25;
  if (hasGoal) score += 20;
  if (hasBlocker) score += 20;
  if (hasTone) score += 10;
  if (hasTimeframe) score += 10;
  const lengthBonus = Math.min(15, Math.floor((lenTotal / 140) * 15));
  score += lengthBonus;
  const suggestions = [];
  if (!hasSituation) suggestions.push('add_situation');
  if (!hasGoal) suggestions.push('add_goal');
  if (!hasBlocker) suggestions.push('add_blocker');
  if (!hasTimeframe) suggestions.push('add_timeframe');
  if (!hasTone) suggestions.push('add_tone');
  if (lengthBonus < 8) suggestions.push('expand_answers');
  return { score, suggestions, nonEmptyCount: nonEmpty.length, totalPossible: totalQuestions };
}

// --- Simulation ---
const metrics = {
  users: N_USERS,
  newUsers: 0,
  returningUsers: 0,
  wizardStarts: 0,
  categoryCounts: Object.fromEntries(CATEGORIES.map(c => [c, 0])),
  chipSelects: 0,
  generates: 0,
  copies: 0,
  qualityGenerates: 0,
  avgGenerateScore: 0,
  thresholds: { 45: 0, 65: 0, 85: 0 },
  scoreBuckets: { '<45': 0, '45-64': 0, '65-84': 0, '85+': 0 },
  stepDropoffs: { step1_only: 0, step2_abandon: 0, generated: 0 },
};

// per-user loop
for (let i = 0; i < N_USERS; i++) {
  const returning = r() < 0.35; // 35% returning traffic
  if (returning) metrics.returningUsers++; else metrics.newUsers++;

  // Wizard entry probability
  const openWizard = returning ? r() < 0.25 : r() < 0.85;
  if (!openWizard) {
    // Library-only user: may copy something directly
    if (r() < 0.22) metrics.copies++;
    continue;
  }

  metrics.wizardStarts++;

  // Category pick
  const category = pick(CATEGORIES);
  metrics.categoryCounts[category]++;

  // Step 1 → Step 2 progression
  if (r() > 0.92) { // 8% drop after step 1
    metrics.stepDropoffs.step1_only++;
    continue;
  }

  // Step 2 answering simulation (now with preselected defaults & timeframe nudge)
  const totalQuestions = 6;
  const answerOrder = ['situation', 'goal', 'blocker', 'timeframe', 'tone', 'channel'];
  const answers = {};
  let lastScore = 0;
  const crossed = { 45: false, 65: false, 85: false };

  // Simulate chip selects and custom text length (slightly higher with preselects)
  const chipActions = 3 + Math.floor(r() * 5); // 3-7 chip toggles (was 2-6)
  metrics.chipSelects += chipActions;

  // IMPROVED: Tone preselected as "Helpful" by default (90% keep it)
  if (r() < 0.9) {
    answers['tone'] = 'tone:' + 'x'.repeat(10);
  }

  for (const key of answerOrder) {
    if (key === 'tone' && answers['tone']) continue; // already set above
    // probability user fills this item (BOOSTED for timeframe due to quick-add chip)
    const p = key === 'situation' ? 0.88 : key === 'goal' ? 0.82 : key === 'blocker' ? 0.74 : key === 'timeframe' ? 0.70 : key === 'channel' ? 0.45 : 0.5;
    if (r() < p) {
      const length = 30 + Math.floor(r() * 180); // chars (slightly longer with microcopy guidance)
      answers[key] = `${key}:${'x'.repeat(length)}`;
    }
    const { score } = computeQualityMeta(answers, totalQuestions);
    // threshold crossing
    [45, 65, 85].forEach(t => {
      if (!crossed[t] && lastScore < t && score >= t) {
        metrics.thresholds[t]++;
        crossed[t] = true;
      }
    });
    lastScore = score;
  }

  // Step 2 → Generate decision (improved with better UX)
  if (r() > 0.82) { // 18% drop at step 2 (was 22% - improvement from guidance)
    metrics.stepDropoffs.step2_abandon++;
    continue;
  }

  metrics.generates++;
  const meta = computeQualityMeta(answers, totalQuestions);
  metrics.qualityGenerates++;
  const n = metrics.qualityGenerates;
  metrics.avgGenerateScore = Math.round(((metrics.avgGenerateScore * (n - 1)) + meta.score) / n);
  if (meta.score < 45) metrics.scoreBuckets['<45']++; else if (meta.score < 65) metrics.scoreBuckets['45-64']++; else if (meta.score < 85) metrics.scoreBuckets['65-84']++; else metrics.scoreBuckets['85+']++;

  // Copy probability depends on quality tier (IMPROVED with stronger CTA + refinement chips)
  const copyP = meta.score >= 85 ? 0.82 : meta.score >= 65 ? 0.72 : meta.score >= 45 ? 0.58 : 0.38;
  if (r() < copyP) metrics.copies++;

  metrics.stepDropoffs.generated++;
}

// --- Feedback synthesis ---
const feedback = [];

// Improve form completion if many are <65
const lowMid = metrics.scoreBuckets['<45'] + metrics.scoreBuckets['45-64'];
const lowMidRate = metrics.qualityGenerates ? lowMid / metrics.qualityGenerates : 0;
if (lowMidRate > 0.4) {
  feedback.push({
    area: 'Wizard Step 2',
    suggestion: 'Add inline “what good looks like” examples under Situation/Goal; pre-select 1–2 chips by default.',
    expectedImpact: 'Increase 65+ tier by 10–15% and copy rate by ~8–12%.'
  });
}

// Timeframe completion boost
if (metrics.thresholds[45] > metrics.thresholds[65]) {
  feedback.push({
    area: 'Quality Meter',
    suggestion: 'Highlight missing timeframe with a subtle nudge and a one-click “Next 30 days” chip.',
    expectedImpact: 'Shift users over the 65 threshold earlier; better strategy specificity.'
  });
}

// Early drop at step 1
const step1Drop = metrics.stepDropoffs.step1_only / Math.max(1, metrics.wizardStarts);
if (step1Drop > 0.06) {
  feedback.push({
    area: 'Onboarding',
    suggestion: 'Reduce perceived friction—relabel the first step and add “Takes ~60 seconds” microcopy.',
    expectedImpact: 'Lower Step 1→2 drop-off by 2–3 points.'
  });
}

// Copies vs generates ratio
const copyToGenerate = metrics.generates ? metrics.copies / metrics.generates : 0;
if (copyToGenerate < 0.55) {
  feedback.push({
    area: 'Result Step',
    suggestion: 'Add “Copy & Open ChatGPT” as primary CTA with confetti feedback; provide 1-click refinement cues.',
    expectedImpact: 'Lift copy rate by 5–8 points.'
  });
}

// Recommend admin goals
feedback.push({
  area: 'Admin Dashboard',
  suggestion: 'Track 45/65/85 thresholds over cohorts; alert when 65+ dips below target for 48h.',
  expectedImpact: 'Keeps quality regressions visible during iterations.'
});

// --- Output ---
fs.mkdirSync(OUT_DIR, { recursive: true });
const outJson = path.join(OUT_DIR, `cohort-${DATE_TAG}.json`);
const outMd = path.join(OUT_DIR, `cohort-${DATE_TAG}.md`);

const summary = {
  seed: SEED,
  date: DATE_TAG,
  metrics,
  feedback,
};
fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));

const md = `# Cohort Simulation (${DATE_TAG})\n\n- Users: ${N_USERS}\n- New vs Returning: ${metrics.newUsers}/${metrics.returningUsers}\n- Wizard starts: ${metrics.wizardStarts}\n- Generates: ${metrics.generates}\n- Copies: ${metrics.copies} (copy/generate ${(metrics.generates? (metrics.copies/metrics.generates*100).toFixed(1):'0.0')}%)\n- Avg quality score: ${metrics.avgGenerateScore}\n- Score buckets: ${Object.entries(metrics.scoreBuckets).map(([k,v])=>`${k}:${v}`).join(', ')}\n- Thresholds crossed: 45=${metrics.thresholds[45]}, 65=${metrics.thresholds[65]}, 85=${metrics.thresholds[85]}\n\n## Category selections\n${Object.entries(metrics.categoryCounts).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\n## Drop-offs\n- Step 1 only: ${metrics.stepDropoffs.step1_only}\n- Step 2 abandon: ${metrics.stepDropoffs.step2_abandon}\n- Generated: ${metrics.stepDropoffs.generated}\n\n## Recommendations\n${feedback.map(f=>`- [${f.area}] ${f.suggestion} — ${f.expectedImpact}`).join('\n')}\n`;
fs.writeFileSync(outMd, md);

console.log('Simulation complete.');
console.log(`JSON: ${path.relative(process.cwd(), outJson)}`);
console.log(`MD:   ${path.relative(process.cwd(), outMd)}`);
