import { computeMissingPlaceholders } from '../guardrailUtils';
import { PromptItem } from '../promptUtils';

describe('computeMissingPlaceholders', () => {
  const mkPrompt = (title: string, text: string): PromptItem => ({
    title,
    role: '',
    deliverable: '',
    inputs: text,
    constraints: '',
    tools: '',
    format: '',
    audience: '',
    module: 'Test',
    index: 0,
  } as any);

  test('returns empty array when no placeholders', () => {
    const p = mkPrompt('No PH', 'plain text');
    expect(computeMissingPlaceholders(p, {})).toEqual([]);
  });

  test('detects single missing placeholder', () => {
    const p = mkPrompt('One', 'Hello [name]');
    expect(computeMissingPlaceholders(p, {})).toEqual(['name']);
  });

  test('ignores placeholders with non-empty values', () => {
    const p = mkPrompt('Two', 'Hi [name], welcome to [market]');
    const fv = { name: 'Ava', market: 'Austin' };
    expect(computeMissingPlaceholders(p, fv)).toEqual([]);
  });

  test('trims whitespace-only values as missing', () => {
    const p = mkPrompt('Trim', 'Hi [name], see [market]');
    const fv = { name: '  ', market: '' };
    expect(computeMissingPlaceholders(p, fv)).toEqual(['name', 'market']);
  });

  test('deduplicates duplicate placeholders', () => {
    const p = mkPrompt('Dup', 'Use [market] twice: [market]');
    expect(computeMissingPlaceholders(p, {})).toEqual(['market']);
  });
});
