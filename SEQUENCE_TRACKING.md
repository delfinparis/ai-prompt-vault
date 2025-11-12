# Sequence Tracking System

## Overview

The sequence tracking system learns which prompts users copy together, creating an intelligent "what's next?" recommendation engine. This transforms the app from a static library into a learning system that anticipates user workflows.

## How It Works

### 1. **Session History**
Every time a user copies a prompt, we record:
- Prompt ID
- Timestamp
- Module name
- Prompt title

This session history is stored in `localStorage` under `rpv:sessionHistory` and kept for 30 minutes.

### 2. **Sequence Recording**
When a user copies prompt B within 5 minutes of copying prompt A, we record this as a "sequence pair":
- `from`: First prompt ID (A)
- `to`: Second prompt ID (B)
- `count`: How many times this pair has occurred
- `lastUsed`: Timestamp of most recent use

### 3. **Learning Over Time**
Each time a sequence pair is used again, we increment its `count`. This creates a frequency-based model of common workflows:
- 5+ occurrences = strong pattern
- 10+ occurrences = proven workflow
- 20+ occurrences = essential sequence

### 4. **Smart Recommendations**
When showing "follow-up suggestions" after a copy:
1. **First priority**: Show learned sequences (sorted by frequency)
2. **Fallback**: Show tag/module matches (existing behavior)

This means the app gets smarter over time, showing better suggestions as it learns user patterns.

## Data Structure

### SequenceData
```typescript
interface SequenceData {
  pairs: Record<string, SequencePair>; // Key: "fromId->toId"
  totalSequences: number;               // Total recorded sequences
}
```

### SequencePair
```typescript
interface SequencePair {
  from: string;      // First prompt ID
  to: string;        // Second prompt ID
  count: number;     // Usage frequency
  lastUsed: number;  // Last timestamp
}
```

### SessionCopy
```typescript
interface SessionCopy {
  promptId: string;
  timestamp: number;
  module: string;
  title: string;
}
```

## localStorage Keys

- **`rpv:sequences`**: Complete sequence tracking data
- **`rpv:sessionHistory`**: Current session's copy history (last 10 prompts)

## Key Functions

### `recordSequence(fromId, toId)`
Records or increments a sequence pair. Called automatically when:
- User copies a prompt
- Previous copy was within 5 minutes
- Previous prompt ID is different from current

### `getSequenceSuggestions(promptId, limit)`
Returns top N prompts that users typically copy after this one, sorted by frequency.

## Analytics Events

The system tracks these events:
- `sequence_recorded` - When a new sequence pair is created/incremented
  - Properties: `from`, `to`, `count`

## Time Windows

- **Sequence threshold**: 5 minutes (300,000ms)
- **Session history**: Last 10 prompts
- **History cleanup**: 30 minutes (on page load)

## Example Workflow

1. User copies "FSBO Conversion Letter"
   - Session history: [`FSBO-Letter-001`]
   - No sequence recorded (first in session)

2. User copies "Follow-up Email Script" (2 minutes later)
   - Session history: [`FSBO-Letter-001`, `Follow-Up-Email-002`]
   - Sequence recorded: `FSBO-Letter-001->Follow-Up-Email-002` (count: 1)

3. User does this pattern 5 more times over next week
   - Sequence count: 6
   - Next time they copy "FSBO Conversion Letter", top suggestion will be "Follow-up Email Script"

4. System learns complete workflow:
   ```
   FSBO Letter (count: 6)
     → Follow-up Email (count: 6)
       → Phone Script (count: 4)
         → Listing Agreement (count: 3)
   ```

## Future Enhancements

### Phase 2: Named Sequences (Week 3-4)
- Let users save proven sequences
- Name them: "My FSBO System", "Luxury Listing Process"
- One-click to run entire sequence

### Phase 3: Team Sequences (Month 2)
- Share sequences across team members
- Build brokerage template libraries
- Track team-level patterns

### Phase 4: Context-Aware Suggestions (Month 3)
- Consider time of day (morning routines vs. evening follow-ups)
- Factor in user's niche (luxury vs. first-time buyers)
- Seasonal patterns (summer listings vs. winter tactics)

## Performance

- Storage: ~1KB per 100 sequence pairs
- Computation: O(n) where n = number of pairs (typically <100)
- No API calls or network overhead
- All processing happens client-side

## Privacy

- All data stored locally in user's browser
- No sequences sent to external servers
- User can clear data anytime via localStorage

## Testing

To verify sequence tracking works:

1. Copy any prompt (e.g., "Market Report Template")
2. Within 5 minutes, copy another prompt (e.g., "Listing Presentation")
3. Open browser DevTools → Application → Local Storage
4. Check `rpv:sequences` - should show the pair recorded
5. Check `rpv:sessionHistory` - should show both copies

## Monetization

This feature creates natural upgrade paths:

**Free tier:**
- See 1 sequence suggestion
- Basic pattern tracking

**Pro tier ($29/mo):**
- See all 3 suggestions
- Save custom sequences
- Export sequence reports

**Team tier ($99/mo):**
- Share sequences across team
- Team analytics dashboard
- Brokerage template library
