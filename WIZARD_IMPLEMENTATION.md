# Wizard Implementation Guide

Complete reference for the 3-step "challenge → drill-down → prompt" wizard flow.

## Overview

The wizard solves the "blank page problem" by guiding users from their business challenge to a ready-to-use, personalized prompt in ~60 seconds.

**User flow:**
1. Choose challenge (6 options)
2. Answer 2–4 focused questions
3. Get tailored prompt + next steps

**Key files:**
- `src/AIPromptVault.tsx` — Main wizard component (lines ~280–450)
- `ANALYTICS_EVENTS.md` — Event tracking reference
- `LAUNCH_NOW_GUIDE.md` — GPT instructions (mirrors wizard structure)

---

## Challenge Configuration

### Available Challenges

Each challenge maps to a default prompt and 2–4 contextual questions:

| Key | Label | Default Prompt | Questions | Follow-ups |
|-----|-------|----------------|-----------|------------|
| `lead-gen` | Lead Generation | 90-Day Inbound Lead Blueprint | market, niche, channel | Landing Page CRO, 7-Day Follow-Up |
| `listing` | Listing Launch | Listing Description That Converts | propertyType, area, features, tier | Open House Promo, Pricing Strategy |
| `followup` | Follow-Up | 7-Day Follow-Up Sequence | leadSource, tone, cadence | Review-to-Referral, Home-Anniversary |
| `social` | Social Content | Instagram Reels Calendar (30 Days) | niche, goal | 90-Day Inbound Lead Blueprint |
| `buyer-prep` | Buyer Prep | Buyer Onboarding Journey | market, price, urgency | Multiple-Offer Strategy, Needs-Match Matrix |
| `systems` | Time & Systems | Weekly Productivity Audit | topGoal, timePerDay | 90-Day Inbound Lead Blueprint |

### Adding a New Challenge

1. **Update CHALLENGES array** (in `AIPromptVault.tsx`):

```typescript
{
  key: 'negotiation',
  label: 'Negotiation',
  description: 'Win more deals with proven scripts and tactics',
  defaultPromptTitle: 'Offer Negotiation Framework',
  questions: [
    { id: 'situation', label: 'Deal situation', placeholder: 'multiple offers, price reduction, inspection' },
    { id: 'clientType', label: 'Representing', placeholder: 'buyer, seller' },
  ],
  followups: ['Commission Value Conversation', 'Pricing Strategy Script']
}
```

2. **Add prompt to library** (if it doesn't exist):
   - Edit `src/prompts.ts`
   - Add prompt to appropriate module
   - Ensure title matches `defaultPromptTitle`

3. **Track event:**
   - No code changes needed — events auto-fire for all challenges
   - Monitor via `rpv:wizard_challenge_selected { challenge: 'negotiation' }`

4. **Test:**
   - Clear localStorage (`rpv:` keys)
   - Open wizard, select new challenge
   - Verify questions render, prompt builds correctly

---

## Prompt Building Logic

### How Tailored Prompts Work

1. **Base prompt:** Uses existing library prompt via `buildFullPrompt(prompt)`
2. **Context injection:** Appends structured answers from drill-down
3. **Compliance reminder:** Adds fair housing guardrails for listing/buyer content

**Example output:**

```
[Base prompt from library: "90-Day Inbound Lead Blueprint"]

Context (use these to tailor the output):
- market: Austin, TX
- niche: first-time buyers
- channel: Instagram

Deliver a complete, copy-ready result. Avoid demographic descriptors; keep lifestyle framing neutral.
```

### Code Reference

```typescript
// In completeDrilldown() function
const base = prompt ? buildFullPrompt(prompt) : 'You are an expert real estate marketing assistant...';
const contextLines = Object.entries(wizardAnswers)
  .filter(([, v]) => String(v || '').trim().length > 0)
  .map(([k, v]) => `- ${k.replace(/([A-Z])/g, ' $1')}: ${v}`);
const context = contextLines.length > 0 ? `\n\nContext:\n${contextLines.join('\n')}` : '';
const finalText = `${base}${context}\n\n[compliance reminder]`;
```

---

## User Experience

### First-Time Behavior

- **Default:** Wizard opens automatically
- **Stored:** `rpv:wizardDismissed` localStorage key
- **Logic:** Show wizard if no copies (`rpv:copyCounts` total = 0) AND not dismissed

### Return Visit Behavior

- **Default:** Library view (wizard dismissed)
- **Re-open:** Click "Start Wizard" button in header
- **Tracking:** `rpv:return_visit { days_since_last }` fires on load

### Modal States

- **Step 1:** Challenge selection (6 cards)
  - CTA: "Skip and browse the library →" (dismisses, sets flag)
  
- **Step 2:** Drill-down questions (2–4 fields)
  - CTA: "← Back" (returns to step 1)
  - CTA: "See my tailored prompt →" (validates, proceeds)
  
- **Step 3:** Result screen
  - Primary CTA: "Copy + Open ChatGPT →" (copies to clipboard, opens GPT store)
  - Secondary CTA: "Edit in app" (opens prompt in library detail view)
  - Tertiary: "Close" (dismisses modal)
  - Follow-ups: 2–3 chips (jumps to related prompt in library)

### Keyboard Support

- **Escape:** Close modal at any step
- **(Future) Enter:** Submit drill-down form

---

## Analytics & Optimization

### Key Metrics

**Funnel:**
1. Wizard open rate: `rpv:view_home { variant: 'wizard' }` / total visits
2. Challenge selection: `rpv:wizard_start` → `rpv:wizard_challenge_selected`
3. Drill-down completion: `rpv:wizard_challenge_selected` → `rpv:wizard_drilldown_complete`
4. Copy rate: `rpv:wizard_drilldown_complete` → `rpv:prompt_copy`
5. GPT CTA click: `rpv:prompt_copy` → `rpv:cta_gpt_click`

**Benchmarks (from simulation):**
- Wizard start: 78% (of new users)
- Drill-down complete: 88% (of starts)
- Copy: 89% (of completions)
- GPT CTA click: 54% (of copies)

### A/B Test Ideas

1. **CTA copy** (result screen):
   - A: "Copy + Open ChatGPT" (current)
   - B: "Use in ChatGPT →"
   - C: "Get My Answer →"
   - Metric: Click-through rate
   - Sample: 1,600 per arm

2. **Question count** (drill-down):
   - A: 2 questions (current for most)
   - B: 4 questions (current for listing)
   - Metric: Completion rate
   - Sample: 2,000 per arm

3. **Example preview** (result screen):
   - A: Show tailored prompt only (current)
   - B: Show "gold standard" example above tailored prompt
   - Metric: Copy rate + satisfaction
   - Sample: 1,500 per arm

4. **Follow-up placement:**
   - A: Below result (current)
   - B: Inline modal after copy (interrupt)
   - Metric: Follow-up click rate
   - Sample: 1,200 per arm

### Instrumentation

All events already wired. To add a variant property:

```typescript
// Example: CTA variant
const [wizardCTAVariant] = useState<'A' | 'B' | 'C'>(() => {
  const saved = localStorage.getItem('rpv:abWizardCTA');
  if (saved) return saved as any;
  const variant = ['A', 'B', 'C'][Math.floor(Math.random() * 3)];
  localStorage.setItem('rpv:abWizardCTA', variant);
  return variant as any;
});

// In copyAndOpenGPT()
trackEvent('rpv:cta_gpt_click', { 
  label: 'wizard_result', 
  variant: wizardCTAVariant 
});
```

---

## Persona Insights (from simulation)

### Top 1% Realtor
- **Challenge preference:** Lead Gen (32%), Systems (28%), Buyer Prep (18%)
- **Behavior:** Skips wizard 62% of the time; prefers library browse
- **Feature request:** "Remember my defaults" after first run
- **Optimization:** Add "power user mode" toggle (skips drill-down, uses saved context)

### Brand-New Agent
- **Challenge preference:** Listing (41%), Lead Gen (31%), Social (18%)
- **Behavior:** Completes wizard 76% of the time
- **Pain point:** Confused about ChatGPT Plus requirement
- **Optimization:** Add help text: "Works in free ChatGPT too" (if true)

### 2–5 Years, Struggling
- **Challenge preference:** Follow-Up (38%), Lead Gen (27%), Systems (19%)
- **Behavior:** Completes wizard 64% of the time
- **Quote:** "I need prompts that move the needle this week"
- **Optimization:** Emphasize ROI in follow-up suggestions

---

## Integration with Existing Features

### Agent Profile Auto-Fill
- Wizard questions respect saved profile (market, niche)
- Auto-populate if `getAutoFillValue(questionId)` returns match
- Track via `updateStats({ autoFillApplied: 1 })`

### Inline Editing
- "Edit in app" CTA opens prompt in detail view
- Preserves wizard answers as `fieldValues`
- User can toggle inline preview mode

### Follow-Up Suggestions
- Uses same `getEnhancedSuggestions()` logic as library
- Sequence tracking applies (wizard copy → library copy = sequence)
- Displays 2–3 prompts from `followups` array in challenge config

### Copy Guardrails
- Wizard bypasses guardrails (context already gathered)
- Library detail view still triggers guardrails for 2+ missing fields

---

## Deployment Checklist

- [x] Wizard component implemented
- [x] Event tracking wired
- [x] First-time user logic
- [x] Return visit tracking
- [x] "Start Wizard" CTA in header
- [x] Analytics documentation
- [ ] Choose analytics platform (Plausible/PostHog)
- [ ] Set up funnel dashboard
- [ ] Run CTA variant A/B test (2 weeks)
- [ ] Add "power user mode" (optional, for top 1%)
- [ ] Add example preview toggle (A/B test first)

---

## FAQ

**Q: Can I hide the wizard for all users?**
A: Yes. Set `rpv:wizardDismissed` in localStorage, or remove the auto-open logic in `useState` initializer.

**Q: How do I change the default prompt for a challenge?**
A: Update `defaultPromptTitle` in CHALLENGES array. Must match exact prompt title in library.

**Q: What if a question is optional?**
A: Wizard builds context from non-empty answers only. Blank fields are filtered out.

**Q: Can I add multi-select or dropdown questions?**
A: Yes. Extend question schema to include `type: 'select'` and `options: []`, then update render logic in step 2.

**Q: How do I A/B test the wizard vs library default?**
A: Track via `rpv:view_home { variant }`. Randomly assign `wizardOpen` initial state on first visit.

**Q: Does the wizard work without GPT_STORE_URL?**
A: Yes. "Copy + Open ChatGPT" will copy to clipboard. Remove the "open" behavior if URL is undefined.

---

## Code Locations

- **Wizard modal:** `AIPromptVault.tsx` line ~380 (`WizardModal` component)
- **Challenge config:** `AIPromptVault.tsx` line ~290 (`CHALLENGES` array)
- **Event tracking:** `AIPromptVault.tsx` line ~150 (`trackEvent` function)
- **Wizard state:** `AIPromptVault.tsx` line ~100 (useState hooks)
- **Prompt building:** `src/promptUtils.ts` (`buildFullPrompt` helper)

---

*Last updated: November 2025*
*Version: 1.0 (MVP)*
