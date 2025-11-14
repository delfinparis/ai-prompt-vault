import { computeQualityMeta, thresholdsCrossed } from '../qualityMeter';

describe('qualityMeter.computeQualityMeta', () => {
  const cfg = { questions: [
    { id: 'market' },
    { id: 'goal' },
    { id: 'obstacle' },
    { id: 'tone' },
    { id: 'urgency' },
  ] } as any;

  it('scores higher when key fields are present', () => {
    const base = computeQualityMeta({}, cfg);
    const withSituation = computeQualityMeta({ market: 'Austin, TX' }, cfg);
    const withGoal = computeQualityMeta({ market: 'Austin', goal: 'Book 5 appts' }, cfg);
    const withMore = computeQualityMeta({ market: 'Austin', goal: 'Book 5 appts', obstacle: 'Low response', tone: 'Helpful', urgency: 'Next 30 days' }, cfg);

    expect(withSituation.score).toBeGreaterThan(base.score);
    expect(withGoal.score).toBeGreaterThan(withSituation.score);
    expect(withMore.score).toBeGreaterThan(withGoal.score);
  });

  it('suggests missing categories appropriately', () => {
    const meta = computeQualityMeta({ market: 'Denver', goal: 'Get listings' }, cfg);
    expect(meta.suggestions).toEqual(expect.arrayContaining(['add_blocker', 'add_timeframe']));
  });

  it('adds a length bonus up to 15', () => {
    const short = computeQualityMeta({ market: 'A' }, cfg);
    const longText = 'x'.repeat(1000);
    const long = computeQualityMeta({ market: longText, goal: longText, obstacle: longText }, cfg);
    expect(long.score).toBeGreaterThan(short.score);
    // Cannot exceed +15 from length
    const diff = long.score - computeQualityMeta({ market: 'Austin', goal: 'G', obstacle: 'B' }, cfg).score;
    expect(diff).toBeLessThanOrEqual(15);
  });
});

describe('qualityMeter.thresholdsCrossed', () => {
  it('detects crossed thresholds in order', () => {
    expect(thresholdsCrossed(10, 50)).toEqual([45]);
    expect(thresholdsCrossed(44, 65)).toEqual([45, 65]);
    expect(thresholdsCrossed(70, 90)).toEqual([85]);
    expect(thresholdsCrossed(85, 86)).toEqual([]);
  });
});
