import { refinePlaceholders, getEffectiveHelp } from '../AIPromptVault';
// Note: AIPromptVault exports these helpers for isolated unit testing.

describe('refinePlaceholders', () => {
  it('removes directive placeholders and nested artifacts', () => {
    const input = [
      'describe their situation - example: going through a divorce',
      'plain, compliant language',
      '[nested [artifact]]',
      'target cost per lead',
      'X'
    ];
    const result = refinePlaceholders(input, 'FSBO Conversion Sequence');
    expect(result).toContain('describe their situation - example: going through a divorce');
    expect(result).toContain('target cost per lead');
    expect(result).toContain('X');
    expect(result).not.toContain('plain, compliant language');
    expect(result).not.toContain('[nested [artifact]]');
  });
});

describe('getEffectiveHelp', () => {
  it('overrides FSBO situation help', () => {
    const help = getEffectiveHelp('describe their situation - example: going through a divorce', 'FSBO Conversion Sequence');
    expect(help.description).toMatch(/seller's specific situation/i);
  });

  it('overrides target CPL help', () => {
    const help = getEffectiveHelp('target cost per lead', '90-Day Inbound Lead Blueprint');
    expect(help.example).toBe('200');
  });

  it('contextual X for 90-Day plan', () => {
    const help = getEffectiveHelp('X', '90-Day Inbound Lead Blueprint');
    expect(help.description).toMatch(/Number of days/i);
  });
});
