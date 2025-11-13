import { mapAutoFillValue, AgentProfile } from '../hooks/useAgentProfile';

describe('mapAutoFillValue', () => {
  const baseProfile: Partial<AgentProfile> = {
    name: 'Ava Agent',
    market: 'Austin, TX',
    niche: 'First-time buyers',
    channels: ['Instagram', 'YouTube'],
  };

  test('returns market for placeholders containing market or city', () => {
    expect(mapAutoFillValue(baseProfile, 'target market')).toBe('Austin, TX');
    expect(mapAutoFillValue(baseProfile, 'City / Area')).toBe('Austin, TX');
  });

  test('market synonyms map correctly', () => {
    expect(mapAutoFillValue(baseProfile, 'service area')).toBe('Austin, TX');
    expect(mapAutoFillValue(baseProfile, 'farm')).toBe('Austin, TX');
    expect(mapAutoFillValue(baseProfile, 'metro')).toBe('Austin, TX');
    expect(mapAutoFillValue(baseProfile, 'neighborhood')).toBe('Austin, TX');
    expect(mapAutoFillValue(baseProfile, 'zip')).toBe('Austin, TX');
    expect(mapAutoFillValue(baseProfile, 'county')).toBe('Austin, TX');
  });

  test('returns niche for placeholders containing niche or specialty', () => {
    expect(mapAutoFillValue(baseProfile, 'niche')).toBe('First-time buyers');
    expect(mapAutoFillValue(baseProfile, 'specialty focus')).toBe('First-time buyers');
  });

  test('returns name for placeholders containing name', () => {
    expect(mapAutoFillValue(baseProfile, 'your name')).toBe('Ava Agent');
  });

  test('niche synonyms map correctly', () => {
    expect(mapAutoFillValue(baseProfile, 'avatar')).toBe('First-time buyers');
    expect(mapAutoFillValue(baseProfile, 'ICP')).toBe('First-time buyers');
    expect(mapAutoFillValue(baseProfile, 'persona')).toBe('First-time buyers');
    expect(mapAutoFillValue(baseProfile, 'ideal client')).toBe('First-time buyers');
  });

  test('returns first channel for placeholders containing channel', () => {
    expect(mapAutoFillValue(baseProfile, 'primary channel')).toBe('Instagram');
  });

  test('channel synonyms map correctly', () => {
    expect(mapAutoFillValue(baseProfile, 'platform')).toBe('Instagram');
    expect(mapAutoFillValue(baseProfile, 'primary platform')).toBe('Instagram');
  });

  test('is case-insensitive', () => {
    expect(mapAutoFillValue(baseProfile, 'CITY')).toBe('Austin, TX');
    expect(mapAutoFillValue(baseProfile, 'NiChE')).toBe('First-time buyers');
  });

  test('returns null when profile missing or no match', () => {
    expect(mapAutoFillValue(null, 'unknown field')).toBeNull();
    expect(mapAutoFillValue({}, 'budget')).toBeNull();
  });
});
