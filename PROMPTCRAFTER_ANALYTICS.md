# PromptCrafter Analytics Tracking

**Date:** 2025-01-16
**Status:** ✅ Complete - Ready for Testing

---

## Overview

PromptCrafter V2 now includes comprehensive analytics tracking to measure performance against our targets.

| Metric | Target | Implementation Status |
|--------|--------|----------------------|
| **Completion Time** | <40 seconds | ✅ Tracked |
| **Abandon Rate** | <5% | ✅ Tracked |
| **Default Acceptance** | >70% | ✅ Tracked |
| **AI Success Rate** | >95% | ✅ Tracked |

---

## Files Created

1. **[src/utils/analytics.ts](src/utils/analytics.ts)** - Analytics utility (176 lines)
2. **[src/PromptCrafter.tsx](src/PromptCrafter.tsx)** - Integrated tracking

---

## Events Tracked

### 1. PromptCrafter_Started

**When:** User clicks a use case card

**Data:**
```typescript
{
  useCase: 'market-report',
  timestamp: 1674567890123
}
```

**Location:** [src/PromptCrafter.tsx:242-245](src/PromptCrafter.tsx#L242-L245)

---

### 2. PromptCrafter_Completed

**When:** AI successfully generates content

**Data:**
```typescript
{
  useCase: 'market-report',
  duration: 38000,        // 38 seconds
  defaultsChanged: 2,     // Changed 2/7 defaults
  timestamp: 1674567928123
}
```

**Location:** [src/PromptCrafter.tsx:318-323](src/PromptCrafter.tsx#L318-L323)

**Key Metrics:**
- `duration` → Compare vs 40s target
- `defaultsChanged` → Target: <30% (2.1/7 = 30%)

---

### 3. PromptCrafter_Abandoned

**When:** User clicks "Back" before completing

**Data:**
```typescript
{
  useCase: 'market-report',
  stepReached: 5,
  totalSteps: 11
}
```

**Location:** [src/PromptCrafter.tsx:397-401](src/PromptCrafter.tsx#L397-L401)

---

### 4. Default_Modified

**When:** User changes a pre-filled default

**Data:**
```typescript
{
  useCase: 'market-report',
  questionId: 'property-type',
  defaultValue: 'all',
  userValue: 'single-family'
}
```

**Location:** [src/PromptCrafter.tsx:263-269](src/PromptCrafter.tsx#L263-L269)

**Analysis:** If >50% change a default, reconsider it!

---

### 5. AI_Generated

**When:** AI generation completes (success or failure)

**Data:**
```typescript
{
  useCase: 'market-report',
  success: true
}
```

**Location:** [src/PromptCrafter.tsx:325-328](src/PromptCrafter.tsx#L325-L328), [344-347](src/PromptCrafter.tsx#L344-L347)

---

## How to View Analytics

### Development Mode (Browser Console)

All events log to console when `NODE_ENV=development`:

```bash
npm start
# Open DevTools → Console
# You'll see: 📊 Analytics Event: {...}
```

---

### Testing Mode (LocalStorage)

Check analytics summary in browser console:

```javascript
// Get summary
analytics.getSummary()
// Returns:
// {
//   totalEvents: 15,
//   completionRate: 85.7,    // %
//   avgDuration: 42.3,       // seconds
//   abandonRate: 14.3        // %
// }

// Export all events
analytics.exportEvents()

// Clear all events
analytics.clearEvents()
```

---

### Production Mode (Plausible)

Events automatically sent to Plausible Analytics:

**Dashboard:** https://plausible.io/ai-prompt-vault-two.vercel.app

**Setup:**
1. Plausible script already in [public/index.html:21](public/index.html#L21)
2. Domain: `ai-prompt-vault-two.vercel.app`
3. Events auto-tracked via `window.plausible()`

**View Custom Events:**
- Navigate to **Custom Events** in Plausible
- Filter by event name
- View counts, trends, and properties

---

## Success Metrics

### Completion Rate

**Formula:** `(Completed / Started) × 100`

**Target:** >95%

**How to Check:**
```javascript
const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
const started = events.filter(e => e.event === 'PromptCrafter_Started').length;
const completed = events.filter(e => e.event === 'PromptCrafter_Completed').length;
console.log(`Completion Rate: ${(completed / started * 100).toFixed(1)}%`);
```

---

### Average Completion Time

**Formula:** Average duration from all completed events

**Target:** <40 seconds

**How to Check:**
```javascript
const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
const durations = events
  .filter(e => e.event === 'PromptCrafter_Completed')
  .map(e => e.duration / 1000); // Convert to seconds

const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
console.log(`Avg Duration: ${avg.toFixed(1)} seconds`);
```

---

### Abandon Rate

**Formula:** `(Abandoned / Started) × 100`

**Target:** <5%

**How to Check:**
```javascript
const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
const started = events.filter(e => e.event === 'PromptCrafter_Started').length;
const abandoned = events.filter(e => e.event === 'PromptCrafter_Abandoned').length;
console.log(`Abandon Rate: ${(abandoned / started * 100).toFixed(1)}%`);
```

---

### Default Acceptance Rate

**Formula:** `% of defaults NOT changed`

**Target:** >70%

**How to Check:**
```javascript
const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
const completed = events.filter(e => e.event === 'PromptCrafter_Completed');
const avgChanged = completed.reduce((sum, e) => sum + e.defaultsChanged, 0) / completed.length;

// Market Report has 7 defaults
const acceptanceRate = ((7 - avgChanged) / 7 * 100);
console.log(`Default Acceptance: ${acceptanceRate.toFixed(1)}%`);
```

---

### AI Success Rate

**Formula:** `(Successful / Total Attempts) × 100`

**Target:** >95%

**How to Check:**
```javascript
const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
const attempts = events.filter(e => e.event === 'AI_Generated');
const successful = attempts.filter(e => e.success === true).length;
console.log(`AI Success Rate: ${(successful / attempts.length * 100).toFixed(1)}%`);
```

---

## Testing Checklist

### Before Deploy:

- [x] Analytics utility created
- [x] Tracking integrated into PromptCrafter
- [x] All 5 events tracked
- [x] Plausible script in index.html
- [x] LocalStorage persistence working
- [x] Console logging in development

### After Deploy:

- [ ] Test a complete flow in production
- [ ] Verify events appear in browser console (dev mode)
- [ ] Check LocalStorage for event data
- [ ] Verify events sent to Plausible (if enabled)
- [ ] Export first 10 events and validate structure

---

## Privacy & Data

**What We Track:**
- ✅ Use case selection (e.g., "market-report")
- ✅ Completion time (milliseconds)
- ✅ Number of defaults changed
- ✅ Which defaults were modified
- ✅ AI generation success/failure

**What We DON'T Track:**
- ❌ User's actual answers
- ❌ Generated content
- ❌ Personal information
- ❌ Email or names
- ❌ IP addresses (Plausible is privacy-first)

**Storage:**
- **LocalStorage:** Last 100 events (browser-only, user can clear)
- **Plausible:** Anonymized event counts (GDPR compliant)

---

## API Reference

### `analytics.track(eventName, data)`

Track an event.

**Example:**
```typescript
analytics.track('PromptCrafter_Started', {
  useCase: 'market-report'
});
```

---

### `analytics.setSessionData(key, value)`

Store temporary session data.

**Example:**
```typescript
analytics.setSessionData('market-report_startTime', Date.now());
```

---

### `analytics.getSessionData(key)`

Retrieve session data.

**Example:**
```typescript
const startTime = analytics.getSessionData('market-report_startTime');
```

---

### `analytics.getSummary()`

Get analytics summary.

**Returns:**
```typescript
{
  totalEvents: number,
  completionRate: number,  // %
  avgDuration: number,     // seconds
  abandonRate: number      // %
}
```

---

### `analytics.exportEvents()`

Export all events as JSON.

**Example:**
```javascript
const json = analytics.exportEvents();
console.log(json);
// Or copy to clipboard:
copy(analytics.exportEvents())
```

---

## Testing Flow

### 1. Start Dev Server

```bash
npm start
```

### 2. Open Browser Console

Press `F12` → Console tab

### 3. Complete a Flow

1. Click "Market Report"
   - See: `📊 Analytics Event: PromptCrafter_Started`

2. Change "All Property Types" → "Single Family"
   - See: `📊 Analytics Event: Default_Modified`

3. Fill questions and click "Generate with AI"
   - See: `📊 Analytics Event: PromptCrafter_Completed`
   - See: `📊 Analytics Event: AI_Generated`

### 4. Check Summary

```javascript
analytics.getSummary()
```

Expected output:
```javascript
{
  totalEvents: 4,
  completionRate: 100,
  avgDuration: 38.5,
  abandonRate: 0
}
```

---

## Real vs Predicted Performance

### Virtual Testing Predictions:

**Before Smart Defaults:**
- Friction: 5.4/10
- Time: 66 seconds
- Abandon: 1.0%

**After Smart Defaults:**
- Friction: 4.0/10 (predicted)
- Time: 40 seconds (predicted)
- Abandon: 0.5% (predicted)

### Actual Performance (To Be Measured):

After 1 week of beta testing, compare:

```javascript
const summary = analytics.getSummary();

console.log(`
Predicted vs Actual:
- Time: 40s predicted vs ${summary.avgDuration.toFixed(1)}s actual
- Abandon: 0.5% predicted vs ${summary.abandonRate.toFixed(1)}% actual
- Completion: 99.5% predicted vs ${summary.completionRate.toFixed(1)}% actual
`);
```

---

## Troubleshooting

### Events not logging to console?

**Fix:** Make sure you're in development mode:
```bash
npm start  # Not npm run build
```

---

### getSummary() returns zeros?

**Fix:** Complete at least one full flow:
1. Click a use case
2. Fill in questions
3. Generate with AI
4. Then run `analytics.getSummary()`

---

### Duration is always 0?

**Fix:** Must complete the flow (click "Generate with AI"):
- ✅ Complete flow → Duration tracked
- ❌ Click "Back" → No duration (abandoned)

---

### Events not in Plausible?

**Fix:** Check Plausible script is loaded:
```javascript
typeof window.plausible  // Should return "function"
```

If undefined, check [public/index.html](public/index.html) line 21.

---

## Next Steps

### Week 1: Deploy & Test

1. Deploy to production
2. Share with beta users
3. Gather initial data

### Week 2: Analyze

```javascript
// After 1 week, export all events
const data = analytics.exportEvents();

// Analyze:
// - Are we hitting <40 second target?
// - Is abandon rate <5%?
// - Are defaults being kept >70%?
// - Which defaults are changed most?
```

### Week 3: Optimize

Based on real data:
- If time >45s → Implement Quick Mode
- If abandon >5% → Investigate problematic questions
- If defaults changed >40% → Reconsider default values

### Week 4: Iterate

- Ship improvements
- Run A/B tests
- Continue measuring

---

## Summary

**✅ Analytics fully integrated!**

**Tracking:**
- 5 key events
- Completion time (<40s target)
- Abandon rate (<5% target)
- Default modifications (>70% acceptance target)
- AI success rate (>95% target)

**Storage:**
- Browser console (dev)
- LocalStorage (testing)
- Plausible (production)

**Ready to:**
- Deploy and gather real data
- Compare vs virtual testing predictions
- Optimize based on actual user behavior

---

**Questions?** See [TESTING_GUIDE.md](TESTING_GUIDE.md) for testing instructions.
