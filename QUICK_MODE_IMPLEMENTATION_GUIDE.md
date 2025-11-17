# Quick Mode Implementation Guide

**Goal:** Reduce friction from 5.4/10 to 4.0/10 and time from 66s to 40s by implementing Quick Mode with smart defaults.

**Status:** Framework started, ready for completion

---

## Phase 1: Smart Defaults (HIGHEST PRIORITY - 30 min)

### Already Added:
✅ Quick Mode state management
✅ LocalStorage persistence
✅ Essential questions mapping

### Implementation Steps:

#### 1.1: Add Default Values to Questions

Edit `src/PromptCrafter.tsx` → Update `getQuestionsForUseCase` to add defaults:

**Market Report:**
```typescript
{
  id: 'property-type',
  type: 'select' as const,
  question: 'Property type focus?',
  defaultValue: 'all', // ADD THIS
  options: [...]
},
{
  id: 'time-frame',
  type: 'select' as const,
  question: 'What time frame?',
  defaultValue: 'last-30-days', // ADD THIS
  options: [...]
},
{
  id: 'trend-direction',
  type: 'select' as const,
  question: 'Overall market trend?',
  defaultValue: 'unknown', // ADD THIS (Let AI Determine)
  options: [...]
}
```

**Social Content:**
```typescript
{
  id: 'platform',
  type: 'select' as const,
  question: 'Which platform?',
  defaultValue: 'instagram', // ADD THIS
  options: [...]
},
{
  id: 'tone',
  type: 'select' as const,
  question: 'Tone & style?',
  defaultValue: 'professional', // ADD THIS
  options: [...]
}
```

**Email Sequence:**
```typescript
{
  id: 'emails',
  type: 'select' as const,
  question: 'How many emails?',
  defaultValue: '5', // ADD THIS
  options: [...]
}
```

#### 1.2: Update Question Type

Add `defaultValue` to the `Question` type:

```typescript
type Question = {
  id: string;
  type: 'text' | 'textarea' | 'select';
  question: string;
  subtitle?: string;
  placeholder?: string;
  options?: QuestionOption[];
  defaultValue?: string; // ADD THIS
};
```

#### 1.3: Auto-Fill Defaults

In `QuestionFlow` component, pre-fill answers with defaults:

```typescript
function QuestionFlow({ ... }) {
  const questions = getQuestionsForUseCase(useCaseId);

  // Auto-fill defaults on mount
  useEffect(() => {
    questions.forEach(q => {
      if (q.defaultValue && !answers[q.id]) {
        onAnswer(q.id, q.defaultValue);
      }
    });
  }, [useCaseId]);

  // ... rest of component
}
```

**Impact:** Users see sensible defaults pre-selected → Saves ~15 seconds

---

## Phase 2: Rephrase Confusing Questions (15 min)

### Questions to Fix:

#### 2.1: Sphere Script - "Market Hook"

**Before:**
```typescript
{
  id: 'market-hook',
  type: 'text' as const,
  question: 'What\'s your market hook?',
  subtitle: 'Recent change in their neighborhood/situation',
  placeholder: '...'
}
```

**After:**
```typescript
{
  id: 'market-hook',
  type: 'text' as const,
  question: 'Any recent market changes to mention?',
  subtitle: '(Optional) Make your call more relevant',
  placeholder: 'Example: "3 homes just sold on your street" or "Prices up 5% this month"'
}
```

#### 2.2: Sphere Script - "Home/Situation"

**Before:**
```typescript
{
  id: 'home-details',
  type: 'text' as const,
  question: 'Their home/situation (if known)?',
  subtitle: 'Neighborhood, how long they\'ve owned, equity position',
  placeholder: '...'
}
```

**After:**
```typescript
{
  id: 'home-details',
  type: 'text' as const,
  question: 'Know their home details?',
  subtitle: '(Optional) Helps personalize the script',
  placeholder: 'Example: "Live in Riverside, bought in 2021 for $450K" or leave blank'
}
```

#### 2.3: Social Content - "Specific Data"

**Before:**
```typescript
{
  id: 'specific-data',
  type: 'textarea' as const,
  question: 'Specific data or details you want to highlight?',
  subtitle: 'Stats, property details, story elements (leave blank if you want AI to research)',
  placeholder: '...'
}
```

**After:**
```typescript
{
  id: 'specific-data',
  type: 'textarea' as const,
  question: 'Got specific numbers or facts?',
  subtitle: '(Optional) Leave blank and AI will add relevant stats',
  placeholder: 'Example: "Median price $487K, up 3.2% from last month" or leave blank for AI to research'
}
```

**Impact:** Less confusion for low-tech users → Reduces friction ~0.5 points

---

## Phase 3: Quick Mode UI Toggle (45 min)

### 3.1: Add Toggle to Question Flow Header

In `QuestionFlow` component, add toggle above questions:

```typescript
<div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
  <button
    onClick={() => setQuickMode(!quickMode)}
    style={{
      padding: '8px 16px',
      background: quickMode ? '#6366f1' : 'transparent',
      color: quickMode ? '#fff' : '#94a3b8',
      border: '2px solid #6366f1',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s'
    }}
  >
    ⚡ Quick Mode ({essentialQuestions.length} questions)
  </button>
  <button
    onClick={() => setQuickMode(!quickMode)}
    style={{
      padding: '8px 16px',
      background: !quickMode ? '#6366f1' : 'transparent',
      color: !quickMode ? '#fff' : '#94a3b8',
      border: '2px solid #6366f1',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s'
    }}
  >
    🎛️ Advanced ({allQuestions.length} questions)
  </button>
</div>
```

### 3.2: Filter Questions Based on Mode

```typescript
function QuestionFlow({ ..., quickMode }: { ..., quickMode: boolean }) {
  const allQuestions = getQuestionsForUseCase(useCaseId);
  const essentialIds = ESSENTIAL_QUESTIONS[useCaseId] || [];

  // Filter questions based on mode
  const questionsToShow = quickMode
    ? allQuestions.filter(q => essentialIds.includes(q.id))
    : allQuestions;

  const currentQuestion = questionsToShow[currentStep - 1];

  // ... rest of logic
}
```

### 3.3: Update Progress Indicator

```typescript
<div style={{ marginBottom: '16px', fontSize: '14px', color: '#94a3b8' }}>
  Question {currentStep} of {questionsToShow.length}
  {quickMode && <span style={{ color: '#10b981', marginLeft: '8px' }}>⚡ Quick Mode</span>}
</div>
```

**Impact:** Users choose their experience → Advanced users get full control, busy users get speed

---

## Phase 4: Question Count Optimization (Already Done!)

**Market Report:**
- Full Mode: 10 questions
- Quick Mode: 4 questions → **60% reduction** ✅

**Social Content:**
- Full Mode: 7 questions
- Quick Mode: 3 questions → **57% reduction** ✅

**Sphere Script:**
- Full Mode: 6 questions
- Quick Mode: 3 questions → **50% reduction** ✅

---

## Testing Checklist

### Before Deployment:

- [ ] All smart defaults pre-selected
- [ ] Quick Mode toggle works (persists to localStorage)
- [ ] 3 confusing questions rephrased
- [ ] Essential questions still capture core info
- [ ] Advanced Mode shows all questions
- [ ] Progress counter accurate in both modes
- [ ] Prompt quality same in both modes
- [ ] Time to complete < 45 seconds in Quick Mode

### Test Scenarios:

1. **Quick Mode - Market Report:**
   - Select market, audience, skip rest → Generate
   - Should produce professional report with AI-researched data
   - Time target: ~35 seconds

2. **Advanced Mode - Market Report:**
   - Fill all 10 questions → Generate
   - Should use all provided details
   - Time target: ~60 seconds

3. **Low-Tech User:**
   - Default Quick Mode
   - Clear question phrasing
   - No abandon

---

## Expected Results After Implementation

| Metric | Before | After Implementation | Target | Status |
|--------|--------|---------------------|--------|--------|
| Friction | 5.4/10 | 4.0/10 | <5/10 | ✅ EXCEEDS |
| Time | 66 sec | 40 sec | <60 sec | ✅ EXCEEDS |
| Abandon | 1.0% | 0.5% | <5% | ✅ EXCEEDS |

---

## Code Files to Modify

1. **`src/PromptCrafter.tsx`**
   - [x] Add Quick Mode state (DONE)
   - [x] Add ESSENTIAL_QUESTIONS mapping (DONE)
   - [ ] Add `defaultValue` to Question type
   - [ ] Add default values to all select questions
   - [ ] Rephrase 3 confusing questions
   - [ ] Pass `quickMode` prop to QuestionFlow
   - [ ] Filter questions in QuestionFlow based on mode
   - [ ] Add Quick/Advanced toggle UI
   - [ ] Auto-fill defaults on mount

---

## Alternative: Simpler Approach (30 min total)

If full Quick Mode is too complex, do this instead:

### Just Add Smart Defaults:
1. Add `defaultValue` to all select questions
2. Pre-fill on load
3. Rephrase 3 confusing questions

**Impact:** 70% of the benefit with 30% of the work

**Expected Results:**
- Friction: 5.4 → 4.8/10
- Time: 66 → 50 seconds
- Abandon: 1.0% → 0.8%

Still a WIN!

---

## Next Steps

**Option A:** Implement Full Quick Mode (1-2 hours)
- Maximum impact
- Best UX
- Professional feature

**Option B:** Just Smart Defaults (30 min)
- Quick win
- 70% of benefit
- Ship today

Which would you prefer? 🚀
