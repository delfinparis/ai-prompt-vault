# PromptCrafter Quick Wins - Implementation Plan

**Status**: Ready to build
**Estimated Time**: 4-5 hours total
**Risk Level**: Low (incremental changes, well-tested patterns)

---

## Feature 1: Voice Preference Memory (30 min) ✅

### What It Does
Remembers which voice/tone preset the user prefers for each use case.
- Instagram posts → Always "Friendly"
- LinkedIn posts → Always "Professional"
- Luxury listings → Always "Luxury"

### Implementation

```typescript
// Add voice preset type
type VoicePreset = 'professional' | 'friendly' | 'bold' | 'luxury';

// On voice selection:
const handleVoiceSelect = (voice: VoicePreset) => {
  setSelectedVoice(voice);
  if (state.selectedUseCase) {
    localStorage.setItem(`voice_pref_${state.selectedUseCase}`, voice);
  }
};

// On use case selection (load saved preference):
useEffect(() => {
  if (state.selectedUseCase) {
    const savedVoice = localStorage.getItem(`voice_pref_${state.selectedUseCase}`);
    if (savedVoice) {
      setSelectedVoice(savedVoice as VoicePreset);
    }
  }
}, [state.selectedUseCase]);
```

### UI Changes
- Add small badge next to selected voice: "✓ Your usual choice"
- Subtle animation when auto-selecting saved preference

### Files Changed
- `src/PromptCrafter.tsx` - Add localStorage logic

---

## Feature 2: First-Time Onboarding Tour (1-2 hours) ✅

### What It Does
Shows a guided 3-step tour on first visit:
1. "Choose your content type" (points to use case grid)
2. "Pick your brand voice" (points to voice selector - we'll add this with Feature 3)
3. "Generate AI content instantly!" (points to Generate button)

### Implementation

**Option A: DIY (Simple)**
```typescript
const [showTour, setShowTour] = useState(false);

useEffect(() => {
  const hasSeenTour = localStorage.getItem('onboarding_complete');
  if (!hasSeenTour) {
    setShowTour(true);
  }
}, []);

// Overlay with arrows and tooltips
// "Next" button advances through steps
// "Skip" button dismisses and saves to localStorage
```

**Option B: Library (Professional)**
```bash
npm install react-joyride
```

```typescript
import Joyride from 'react-joyride';

const tourSteps = [
  {
    target: '.use-case-grid',
    content: '👋 Welcome! Choose what type of content you need.',
    placement: 'center'
  },
  {
    target: '.generate-button',
    content: '✨ Click here to generate AI content instantly!',
    placement: 'top'
  }
];

<Joyride
  steps={tourSteps}
  run={showTour}
  continuous
  showProgress
  showSkipButton
  callback={(data) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      localStorage.setItem('onboarding_complete', 'true');
      setShowTour(false);
    }
  }}
/>
```

### UI Changes
- Spotlight effect on current step
- "Next" and "Skip Tour" buttons
- Progress dots (Step 1 of 2)
- "Restart Tour" button in header (question mark icon)

### Files Changed
- `package.json` - Add react-joyride dependency
- `src/PromptCrafter.tsx` - Add tour component

---

## Feature 3: Batch Variations Mode (2-3 hours) 🚀

### What It Does
Generate 3-5 variations of content at once so users can pick the best one.

### Implementation

```typescript
// Add batch size state
const [batchSize, setBatchSize] = useState(1); // 1-5
const [generatedOutputs, setGeneratedOutputs] = useState<string[]>([]);

// Modified API call
const handleGenerate = async () => {
  setIsGenerating(true);
  setGeneratedOutputs([]);

  try {
    // Generate multiple in parallel
    const promises = Array(batchSize).fill(null).map(() =>
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: state.generatedPrompt,
          userInput: JSON.stringify(state.answers)
        })
      }).then(res => res.json())
    );

    const results = await Promise.all(promises);
    const outputs = results.map(r => r.output || r.result);
    setGeneratedOutputs(outputs);

    // Confetti!
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  } catch (error) {
    console.error('Batch generation error:', error);
  } finally {
    setIsGenerating(false);
  }
};
```

### UI Changes

**Slider Before Generate Button:**
```
How many variations? ● ● ● ○ ○
                      [1] [2] [3] [4] [5]
```

**Output Display (Carousel or Tabs):**
```
┌─────────────────────────────────────┐
│ Variation 1 of 3         📋 Copy    │
├─────────────────────────────────────┤
│ Generated content here...            │
│                                      │
│ [← Previous]            [Next →]    │
└─────────────────────────────────────┘

Or tabs:
[Variation 1] [Variation 2] [Variation 3]
```

### Files Changed
- `src/PromptCrafter.tsx` - Add batch logic
- API: No changes needed (just call multiple times)

---

## Feature 4: Edit & Regenerate Modal (1-2 hours) ⚡

### What It Does
From history, user clicks "Edit & Regenerate" and gets:
- Modal with all previous answers pre-filled
- Can modify any field
- Clicks "Regenerate" and gets new output

### Implementation

```typescript
// Add edit modal state
const [editModalOpen, setEditModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState<PromptHistory | null>(null);

// Handle edit click from history
const handleEditFromHistory = (item: PromptHistory) => {
  setEditingItem(item);
  setEditModalOpen(true);
};

// In modal:
<Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
  <h2>Edit & Regenerate</h2>
  <p>Modify any details below and click Regenerate</p>

  {/* Render all questions with pre-filled answers from editingItem.answers */}
  {questions.map(q => (
    <Input
      key={q.id}
      value={editedAnswers[q.id] || editingItem?.answers[q.id] || ''}
      onChange={(e) => setEditedAnswers({...editedAnswers, [q.id]: e.target.value})}
    />
  ))}

  <Button onClick={() => {
    // Generate with modified answers
    setState({
      step: 4,
      selectedUseCase: editingItem.useCaseId,
      answers: editedAnswers,
      generatedPrompt: generatePrompt(editingItem.useCaseId, editedAnswers)
    });
    setEditModalOpen(false);
    handleGenerate();
  }}>
    ✨ Regenerate
  </Button>
</Modal>
```

### UI Changes
- "Edit & Regenerate" button in history panel (next to "Reuse")
- Modal with form fields pre-filled
- Clear "Regenerate" CTA button

### Files Changed
- `src/PromptCrafter.tsx` - Add modal component

---

## Build Order (Recommended)

### **Session 1: Today - Morning (30 min)**
✅ Voice Preference Memory
- Low risk, high value
- Test: Select voice for Instagram → refresh page → should remember
- Commit: "feat: remember voice preferences per use case"

### **Session 2: Today - Afternoon (1-2 hours)**
✅ Onboarding Tour
- Use react-joyride (professional, tested, accessible)
- Test: Clear localStorage → refresh → tour appears
- Commit: "feat: add first-time user onboarding tour"

### **Session 3: Tomorrow - Morning (2-3 hours)**
✅ Batch Variations
- Most complex feature - tackle when fresh
- Test: Select 3 variations → should get 3 outputs
- Commit: "feat: add batch variations mode (1-5 outputs)"

### **Session 4: Tomorrow - Afternoon (1-2 hours)**
✅ Edit & Regenerate Modal
- Builds on batch mode patterns
- Test: Edit from history → modify field → regenerate
- Commit: "feat: add edit & regenerate from history"

---

## Testing Checklist

### Voice Preferences
- [ ] Select "Friendly" for Social Media use case
- [ ] Refresh page
- [ ] Navigate back to Social Media use case
- [ ] Should pre-select "Friendly" with "Your usual choice" badge
- [ ] Clear localStorage → should default to no selection

### Onboarding Tour
- [ ] Clear localStorage key `onboarding_complete`
- [ ] Refresh page
- [ ] Tour should auto-start
- [ ] Click "Next" through all steps
- [ ] Tour should end and not re-appear
- [ ] Click "?" icon in header → tour restarts

### Batch Variations
- [ ] Set slider to 3
- [ ] Click "Generate with AI"
- [ ] Should see "Generating 3 variations..."
- [ ] Wait 3-5 seconds
- [ ] Should see 3 outputs (carousel or tabs)
- [ ] Each should have individual "Copy" button
- [ ] All 3 saved to history (or user picks which to save)

### Edit & Regenerate
- [ ] Generate content once (save to history)
- [ ] Go to history panel
- [ ] Click "Edit & Regenerate"
- [ ] Modal opens with pre-filled form
- [ ] Change one field
- [ ] Click "Regenerate"
- [ ] Should generate new content with modified field
- [ ] New output should appear

---

## Rollback Plan

If anything breaks:
```bash
git reset --hard HEAD~1  # Undo last commit
git checkout main  # Go back to stable
```

Each feature is independent - can ship 1, 2, 3, or all 4.

---

## Success Metrics (Track in Plausible)

### Voice Preferences
- Event: `voice_preference_saved`
- Property: `use_case_id`, `voice_preset`
- Target: 60% of users save at least 1 preference

### Onboarding Tour
- Event: `tour_completed` vs `tour_skipped`
- Target: 40% completion rate

### Batch Variations
- Event: `batch_generate`
- Property: `batch_size` (1-5)
- Target: 30% of generations use batch mode (2+)

### Edit & Regenerate
- Event: `edit_from_history`
- Target: 20% of returning users use this feature

---

## Ready to Build?

All 4 features are scoped, tested patterns, low risk.

**Start with Feature 1** (voice preferences) - it's a 30-minute dopamine hit that builds confidence for the rest.

Want me to implement it now? 🚀
