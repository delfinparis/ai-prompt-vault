// qualityMeter.ts
// Centralized quality scoring used by the wizard meter and analytics

export interface QualityMeta {
  score: number;
  suggestions: string[];
  nonEmptyCount: number;
  totalPossible: number;
}

// Compute quality score based on presence of key fields and overall length.
// Suggestions are machine-readable keys consumed by UI for nudges.
export function computeQualityMeta(
  answers: Record<string, string>,
  challengeConfig: { questions: Array<{ id: string }> }
): QualityMeta {
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

  const suggestions: string[] = [];
  if (!hasSituation) suggestions.push('add_situation');
  if (!hasGoal) suggestions.push('add_goal');
  if (!hasBlocker) suggestions.push('add_blocker');
  if (!hasTimeframe) suggestions.push('add_timeframe');
  if (!hasTone) suggestions.push('add_tone');
  if (lengthBonus < 8) suggestions.push('expand_answers');

  return { score, suggestions, nonEmptyCount: nonEmpty.length, totalPossible: challengeConfig.questions.length };
}

// Helper to compute which thresholds were crossed moving from prev->next
export function thresholdsCrossed(prev: number, next: number, thresholds = [45, 65, 85]): number[] {
  return thresholds.filter(t => prev < t && next >= t);
}
