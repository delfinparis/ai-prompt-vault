# Analytics Events Reference

All events are prefixed with `rpv:` and dispatched via the `trackEvent()` helper in `AIPromptVault.tsx`.

## Event Infrastructure

Events are automatically sent to:
- Custom event listener (`window` event `rpv_event`)
- Plausible Analytics (if installed)
- PostHog (if installed)
- Console (development mode only)

## Core Events

### Home & Navigation
- **rpv:view_home** `{ variant: 'wizard' | 'library' }`
  - Fired on component mount
  - Tracks default home view (wizard for new users, library for returning)
  
- **rpv:return_visit** `{ days_since_last: number }`
  - Fired on every page load for returning users
  - Tracks days since last visit

### Wizard Flow (New)
- **rpv:wizard_start**
  - User clicks "Start Wizard" CTA or opens wizard modal
  
- **rpv:wizard_challenge_selected** `{ challenge: string }`
  - User picks a challenge (lead-gen, listing, followup, social, buyer-prep, systems)
  
- **rpv:wizard_drilldown_complete** `{ challenge: string, q_count: number }`
  - User completes drill-down questions and sees tailored prompt
  
- **rpv:prompt_copy** `{ source: 'wizard', challenge: string }`
  - User copies prompt from wizard result screen
  - Can extend with `{ source: 'library', title: string }` for library copies
  
- **rpv:cta_gpt_click** `{ label: string }`
  - User clicks "Use in ChatGPT →" or "Copy + Open ChatGPT" CTA
  - Labels: 'wizard_result', 'header', 'followup'
  
- **rpv:followup_prompt_click** `{ label: string, source: 'wizard' | 'library' }`
  - User clicks a suggested follow-up prompt

### Existing Events (Pre-Wizard)
- **prompt_copied** `{ title: string, module: string, utm?: string }`
  - User copies a prompt from library detail view
  
- **prompt_selected** `{ title: string }`
  - User opens prompt detail modal
  
- **favorite_toggled** `{ promptId: string, action: 'add' | 'remove' }`
  - User favorites/unfavorites a prompt
  
- **dark_mode_toggled** `{ enabled: boolean, mode: 'auto' | 'dark' | 'light' }`
  - User changes theme preference
  
- **sequence_recorded** `{ from: string, to: string, count: number }`
  - User copies prompts in sequence (within 5 min window)
  
- **copy_guardrail_triggered** `{ title: string, missingCount: number }`
  - Guardrail blocks copy due to 2+ missing fields
  
- **generation_success** `{ promptTitle: string, count: number, remainingFree: number }`
  - AI generation completes successfully
  
- **generation_limit_hit** `{ count: number }`
  - User hits free tier generation limit
  
- **inline_preview_toggled** `{ enabled: boolean, title: string, source: 'kbd' | 'toggle' }`
  - User switches between inline/form editing modes

## Funnel Metrics (Wizard)

### Key Conversion Points
1. Home load → Wizard open rate
2. Wizard open → Challenge selected
3. Challenge selected → Drill-down complete
4. Drill-down complete → Copy prompt
5. Copy prompt → Open ChatGPT click
6. Follow-up click rate

### Sample Queries (Plausible/PostHog)

**Wizard conversion funnel:**
```
rpv:wizard_start → 
  rpv:wizard_challenge_selected → 
    rpv:wizard_drilldown_complete → 
      rpv:prompt_copy
```

**Challenge popularity:**
```sql
SELECT challenge, COUNT(*) 
FROM rpv:wizard_challenge_selected 
GROUP BY challenge 
ORDER BY COUNT(*) DESC
```

**GPT CTA effectiveness:**
```sql
SELECT label, COUNT(*) 
FROM rpv:cta_gpt_click 
GROUP BY label
```

**Return visit cohorts:**
```sql
SELECT 
  CASE 
    WHEN days_since_last = 0 THEN 'Same day'
    WHEN days_since_last <= 1 THEN '1 day'
    WHEN days_since_last <= 7 THEN '1 week'
    WHEN days_since_last <= 30 THEN '1 month'
    ELSE '30+ days'
  END as cohort,
  COUNT(*)
FROM rpv:return_visit
GROUP BY cohort
```

## A/B Test Framework

### Wizard CTA Variants (Ready to Test)

**Current implementation:** "Copy + Open ChatGPT"

**Variants to test:**
- A: "Copy + Open ChatGPT" (control)
- B: "Use in ChatGPT →"
- C: "Open in ChatGPT"
- D: "Get My Answer →"

**How to implement:**
1. Add `KEY_AB_WIZARD_CTA` localStorage key
2. Randomly assign variant on first visit
3. Track variant in all `rpv:cta_gpt_click` events: `{ label, variant }`
4. Measure: Click-through rate on wizard result screen

**Sample sizes:**
- Baseline CTR estimate: 48% (from simulation)
- Detect 5% absolute lift: ~1,600–2,000 users per arm
- Run for 2–4 weeks or until significance

### Home View Test (Already Instrumented)

**Current:** Wizard default for new users, library for returning

**Track via:** `rpv:view_home { variant }`

**Metrics:**
- Time to first copy
- Wizard completion rate
- Browse rate (wizard → library switch)

## Implementation Notes

### Adding New Events

```typescript
// In AIPromptVault.tsx
trackEvent('rpv:your_event_name', { 
  property: 'value',
  count: 123 
});
```

### Suppress PII

Never log:
- Full addresses (use "area" or "city")
- Client names
- Phone numbers
- Email addresses
- Specific property prices (use tier: entry/mid/luxury)

Always:
- Aggregate by category (challenge, module, tag)
- Use anonymized IDs (promptId, not prompt title in sensitive contexts)
- Round numeric inputs (budget → tier, days → bucket)

## Dashboard Setup (External Tools)

### Plausible (Recommended for MVP)

1. Add script to `public/index.html`:
```html
<script defer data-domain="app.ai-prompt-vault.vercel.app" src="https://plausible.io/js/script.js"></script>
```

2. Events auto-send via `window.plausible()` call in `trackEvent`

### PostHog (Advanced)

1. Add PostHog snippet to `public/index.html`
2. Events auto-send via `window.posthog.capture()` in `trackEvent`
3. Create funnels, cohorts, and session recordings

### Custom (Privacy-First)

All events dispatch to `window` event `rpv_event`:

```javascript
window.addEventListener('rpv_event', (e) => {
  const { name, ...data } = e.detail;
  // Send to your backend
  fetch('/api/track', {
    method: 'POST',
    body: JSON.stringify({ event: name, properties: data })
  });
});
```

## Privacy & GDPR

- All events use first-party cookies only (localStorage)
- No external tracking without user analytics script (Plausible/PostHog)
- Events contain no PII by design
- Clear data: `localStorage.clear()` or incognito mode

## Testing Events

**Development console:**
```javascript
// All events log to console in dev mode
// Check browser DevTools → Console for [Analytics] logs
```

**Production verification:**
```javascript
// Listen for events in production
window.addEventListener('rpv_event', (e) => {
  console.log('Event:', e.detail);
});
```

**Integration tests:**
```typescript
// In __tests__/analytics.test.ts
test('wizard start fires event', () => {
  const listener = jest.fn();
  window.addEventListener('rpv_event', listener);
  
  // Trigger wizard
  fireEvent.click(screen.getByText('Start Wizard'));
  
  expect(listener).toHaveBeenCalledWith(
    expect.objectContaining({
      detail: expect.objectContaining({ name: 'rpv:wizard_start' })
    })
  );
});
```

## Next Steps

1. **Choose analytics platform:** Plausible (simple) or PostHog (advanced)
2. **Set up dashboard:** Create funnels for wizard flow
3. **Run A/B test:** Wizard CTA variant (2 weeks, 3,200+ users)
4. **Weekly review:** Check top challenges, drop-off points, return cohorts
5. **Iterate:** Add challenges based on `rpv:wizard_challenge_selected` popularity

---

*Last updated: November 2025*
*Event schema version: 1.0*
