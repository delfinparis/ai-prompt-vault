/**
 * Unit tests for UI logic functions in AIPromptVault
 * Tests visibleCategoryCards and computeTopPicks behavior
 */

import { PromptItem } from '../promptUtils';

// Mock category cards structure matching AIPromptVault.tsx
const MODULE_TITLES = [
  "Lead Generation & Marketing",
  "Operations & Time Management",
  "Goal Setting & Accountability",
  "Listing & Buyer Presentations",
];

type CategoryMeta = {
  id: number;
  moduleKey: string;
  label: string;
  emoji: string;
  tagline: string;
};

const MOCK_CATEGORY_CARDS: CategoryMeta[] = [
  {
    id: 1,
    moduleKey: `Module 1 — ${MODULE_TITLES[0]}`,
    label: "Get More Leads",
    emoji: "📣",
    tagline: "Prompts for ads, content, funnels, and campaigns.",
  },
  {
    id: 2,
    moduleKey: `Module 2 — ${MODULE_TITLES[1]}`,
    label: "Fix My Systems",
    emoji: "🧩",
    tagline: "Checklists, SOPs, and daily/weekly workflows.",
  },
  {
    id: 3,
    moduleKey: `Module 3 — ${MODULE_TITLES[2]}`,
    label: "Hit My Goals",
    emoji: "🎯",
    tagline: "Scorecards, habit templates, and sprints.",
  },
  {
    id: 4,
    moduleKey: `Module 4 — ${MODULE_TITLES[3]}`,
    label: "Win More Appointments",
    emoji: "📅",
    tagline: "Scripts and outlines for buyers and sellers.",
  },
];

const MOCK_ONBOARD_INTENTS = [
  { key: "leads", label: "Get more leads", moduleKey: MOCK_CATEGORY_CARDS[0].moduleKey, emoji: "📣" },
  { key: "listing", label: "Create a listing", moduleKey: MOCK_CATEGORY_CARDS[3].moduleKey, emoji: "🏡" },
];

// Helper: compute visible cards (mirrors useMemo in AIPromptVault.tsx)
function computeVisibleCategoryCards(
  showAll: boolean,
  topPicks: PromptItem[] | null,
  allCards: CategoryMeta[]
): CategoryMeta[] {
  if (showAll) return allCards;
  const picks = topPicks || [];
  const pickModules = new Set(picks.map((p) => p.module));
  const sorted = [...allCards].sort((a, b) => {
    const aScore = pickModules.has(a.moduleKey) ? 0 : 1;
    const bScore = pickModules.has(b.moduleKey) ? 0 : 1;
    return aScore - bScore || a.id - b.id;
  });
  return sorted.slice(0, 6);
}

// Helper: compute recommended modules (mirrors useMemo in AIPromptVault.tsx)
function computeRecommendedModules(
  intent: string | null,
  onboardIntents: typeof MOCK_ONBOARD_INTENTS
): Set<string> {
  if (!intent) return new Set<string>();
  const intentObj = onboardIntents.find((i) => i.key === intent);
  if (!intentObj || !intentObj.moduleKey) return new Set<string>();
  return new Set([intentObj.moduleKey]);
}

describe('visibleCategoryCards logic', () => {
  it('returns all cards when showAll is true', () => {
    const result = computeVisibleCategoryCards(true, null, MOCK_CATEGORY_CARDS);
    expect(result).toHaveLength(4);
    expect(result).toEqual(MOCK_CATEGORY_CARDS);
  });

  it('returns top 6 cards when showAll is false and no top picks', () => {
    const result = computeVisibleCategoryCards(false, null, MOCK_CATEGORY_CARDS);
    expect(result).toHaveLength(4); // only 4 mock cards available
    expect(result[0].id).toBe(1); // preserves order
  });

  it('prioritizes cards matching top picks modules', () => {
    const topPicks: PromptItem[] = [
      {
        title: "Test Prompt",
        module: `Module 3 — ${MODULE_TITLES[2]}`, // Hit My Goals
        index: 0,
        role: "test",
        deliverable: "test",
        inputs: "test",
        constraints: "test",
        tools: "test",
        format: "test",
        audience: "test",
      },
    ];
    const result = computeVisibleCategoryCards(false, topPicks, MOCK_CATEGORY_CARDS);
    // Card with id=3 (Hit My Goals) should come first
    expect(result[0].id).toBe(3);
    expect(result[0].moduleKey).toBe(`Module 3 — ${MODULE_TITLES[2]}`);
  });

  it('sorts by id when modules have equal priority', () => {
    const result = computeVisibleCategoryCards(false, [], MOCK_CATEGORY_CARDS);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(3);
  });
});

describe('recommendedModules logic', () => {
  it('returns empty set when intent is null', () => {
    const result = computeRecommendedModules(null, MOCK_ONBOARD_INTENTS);
    expect(result.size).toBe(0);
  });

  it('returns module key for matching intent', () => {
    const result = computeRecommendedModules('leads', MOCK_ONBOARD_INTENTS);
    expect(result.size).toBe(1);
    expect(result.has(MOCK_CATEGORY_CARDS[0].moduleKey)).toBe(true);
  });

  it('returns empty set for unknown intent', () => {
    const result = computeRecommendedModules('unknown', MOCK_ONBOARD_INTENTS);
    expect(result.size).toBe(0);
  });

  it('returns empty set for intent without moduleKey', () => {
    const intentsWithoutModule: Array<{ key: string; label: string; moduleKey?: string; emoji: string }> = [
      { key: "other", label: "Other / Browse", emoji: "🔍" }, // no moduleKey
    ];
    const result = computeRecommendedModules('other', intentsWithoutModule as typeof MOCK_ONBOARD_INTENTS);
    expect(result.size).toBe(0);
  });
});

describe('computeTopPicks logic', () => {
  const mockData: PromptItem[] = [
    {
      title: "Lead Gen Email",
      module: `Module 1 — ${MODULE_TITLES[0]}`,
      index: 0,
      role: "solo agent",
      deliverable: "email",
      inputs: "market",
      constraints: "test",
      tools: "test",
      format: "test",
      audience: "test",
    },
    {
      title: "Solo Agent Script",
      module: `Module 1 — ${MODULE_TITLES[0]}`,
      index: 1,
      role: "team lead",
      deliverable: "script",
      inputs: "test",
      constraints: "test",
      tools: "test",
      format: "test",
      audience: "test",
    },
    {
      title: "Listing Presentation",
      module: `Module 4 — ${MODULE_TITLES[3]}`,
      index: 0,
      role: "test",
      deliverable: "presentation",
      inputs: "test",
      constraints: "test",
      tools: "test",
      format: "test",
      audience: "test",
    },
  ];

  // Simple mock buildFullPrompt
  const mockBuildFullPrompt = (p: PromptItem) => {
    return `${p.title} ${p.role} ${p.deliverable} ${p.inputs}`;
  };

  function computeTopPicksHelper(
    answers: { intent?: string; role?: string; market?: string },
    data: PromptItem[],
    copyCounts: Record<string, number>
  ): PromptItem[] {
    if (!answers.intent) return [];
    const intent = MOCK_ONBOARD_INTENTS.find((i) => i.key === answers.intent);
    if (!intent || !intent.moduleKey) return [];
    const candidates = data.filter((d) => d.module === intent.moduleKey);
    const qMarket = (answers.market || "").toLowerCase();
    const qRole = (answers.role || "").toLowerCase();
    const scored = candidates
      .map((p) => {
        let score = 0;
        if ((p.title || "").toLowerCase().includes(qRole) || (p.role || "").toLowerCase().includes(qRole)) score += 20;
        const built = mockBuildFullPrompt(p).toLowerCase();
        if (qMarket && built.includes(qMarket)) score += 30;
        const key = `${p.module}||${p.title}`;
        score += (copyCounts?.[key] || 0);
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.p);
    return scored;
  }

  it('returns empty array when no intent provided', () => {
    const result = computeTopPicksHelper({}, mockData, {});
    expect(result).toEqual([]);
  });

  it('returns empty array when intent has no moduleKey', () => {
    const result = computeTopPicksHelper({ intent: 'other' }, mockData, {});
    expect(result).toEqual([]);
  });

  it('filters candidates by intent moduleKey', () => {
    const result = computeTopPicksHelper({ intent: 'leads' }, mockData, {});
    expect(result.length).toBeGreaterThan(0);
    result.forEach((p) => {
      expect(p.module).toBe(`Module 1 — ${MODULE_TITLES[0]}`);
    });
  });

  it('scores prompts by role match', () => {
    const result = computeTopPicksHelper({ intent: 'leads', role: 'solo agent' }, mockData, {});
    // "Lead Gen Email" has "solo agent" in role field, should score higher
    expect(result[0].title).toBe('Lead Gen Email');
  });

  it('incorporates copy counts into scoring', () => {
    const counts = {
      [`Module 1 — ${MODULE_TITLES[0]}||Solo Agent Script`]: 100,
    };
    const result = computeTopPicksHelper({ intent: 'leads' }, mockData, counts);
    // "Solo Agent Script" should rank higher due to copy count
    expect(result[0].title).toBe('Solo Agent Script');
  });

  it('limits results to top 3', () => {
    const largeData: PromptItem[] = Array.from({ length: 10 }, (_, i) => ({
      title: `Prompt ${i}`,
      module: `Module 1 — ${MODULE_TITLES[0]}`,
      index: i,
      role: "test",
      deliverable: "test",
      inputs: "test",
      constraints: "test",
      tools: "test",
      format: "test",
      audience: "test",
    }));
    const result = computeTopPicksHelper({ intent: 'leads' }, largeData, {});
    expect(result.length).toBeLessThanOrEqual(3);
  });
});
