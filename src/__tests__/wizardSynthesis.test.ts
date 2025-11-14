import { buildEnhancedWizardPrompt, detectEnhancedSections } from '../wizardPromptBuilder';

describe('buildEnhancedWizardPrompt', () => {
  const base = 'You are an expert real estate marketing assistant.';

  it('creates all required section headings on rich input', () => {
    const answers = {
      market: 'Austin, TX urban core',
      channel: 'Instagram, Email Newsletter',
      tone: 'Authoritative, Helpful',
      topGoal: 'Book 8 listing appointments in 30 days',
      obstacle: 'Low inbound lead volume',
      urgency: 'Need momentum within 45 days'
    };
    const text = buildEnhancedWizardPrompt(base, 'lead-gen', answers);
    const sections = detectEnhancedSections(text);
    expect(Object.values(sections).every(Boolean)).toBe(true);
    expect(text).toContain('Austin, TX urban core');
    expect(text).toMatch(/Primary goals:/i);
  });

  it('falls back to default situation when none provided', () => {
    const answers = { topGoal: 'Increase conversions', obstacle: 'Follow-up inconsistency' };
    const text = buildEnhancedWizardPrompt(base, 'systems', answers);
    expect(text).toContain('Real estate professional seeking strategic guidance');
  });

  it('excludes _custom keys from context bullets', () => {
    const answers = {
      tone: 'Friendly',
      tone_custom: 'Conversational',
      channel: 'YouTube',
      channel_custom: 'Local podcast'
    } as Record<string, string>;
    const text = buildEnhancedWizardPrompt(base, 'lead-gen', answers);
    // Should include aggregated base tone / channel but not separate _custom entries as bullets
    expect(text).toContain('tone: Friendly');
    expect(text).not.toContain('tone_custom');
    expect(text).toContain('channel: YouTube');
    expect(text).not.toContain('channel_custom');
  });

  it('shows clarify message when no goals provided', () => {
    const answers = { obstacle: 'Pricing objections', market: 'Denver' };
    const text = buildEnhancedWizardPrompt(base, 'listing', answers);
    expect(text).toMatch(/Primary goals: Clarify with user/i);
  });

  it('returns plain text without markdown asterisks or code fences', () => {
    const answers = { market: 'Phoenix', topGoal: 'Grow referral base', obstacle: 'Low engagement' };
    const text = buildEnhancedWizardPrompt(base, 'sphere', answers);
    expect(text).not.toMatch(/```/);
    // Allow hyphen bullets but prevent stray asterisk markdown formatting
    // (function currently never outputs asterisks) site regression guard
    expect(text).not.toMatch(/\n\*/);
  });
});
