# Phase 2 Features Testing Guide

**Date:** January 18, 2025
**Features:** Voice Personalization + Quick Mode
**URL:** https://ai-prompt-vault-two.vercel.app/prompts

---

## Quick Testing Checklist

### Voice Personalization Testing (5 minutes)

- [ ] **Load the app** - See voice selector on home screen
- [ ] **Default selection** - "Professional" should be selected by default
- [ ] **Try each voice:**
  - [ ] Click "👔 Professional" - Purple gradient, border glow
  - [ ] Click "☕ Casual" - Purple gradient, border glow
  - [ ] Click "⚡ Enthusiastic" - Purple gradient, border glow
  - [ ] Click "💙 Empathetic" - Purple gradient, border glow
- [ ] **Generate content** - Select "Social Media Posts" with each voice
  - [ ] Professional: Should sound polished, authoritative
  - [ ] Casual: Should sound warm, friendly, conversational
  - [ ] Enthusiastic: Should sound energetic, exciting
  - [ ] Empathetic: Should sound caring, understanding
- [ ] **Persistence** - Refresh page, voice preference should be remembered
- [ ] **Mobile** - Test voice selector on mobile (cards stack vertically)

**Expected behavior:**
- Voice preference saves to localStorage
- Selected voice has purple gradient background + border
- Generated content reflects chosen tone
- Smooth hover states on unselected cards

---

### Quick Mode Testing (5 minutes)

- [ ] **Toggle OFF (default)** - Gray toggle, questions show normally
- [ ] **Toggle ON:**
  - [ ] Click toggle - Turns green, circle slides right
  - [ ] Click "Email Campaigns" use case
  - [ ] Should skip ALL questions
  - [ ] Should jump straight to loading animation
  - [ ] Should generate with all defaults
- [ ] **Toggle OFF again:**
  - [ ] Click toggle - Turns gray, circle slides left
  - [ ] Click "Market Reports" use case
  - [ ] Should show questions step-by-step (normal flow)
- [ ] **Persistence** - Refresh page, Quick Mode state should be remembered
- [ ] **Mobile** - Test toggle on mobile devices

**Expected behavior:**
- Toggle animation is smooth (200ms transition)
- Quick Mode ON: 1 click → instant generation
- Quick Mode OFF: Normal question flow
- Default answers populate correctly in Quick Mode

---

## Detailed Testing Scenarios

### Scenario 1: Voice Personalization Full Flow

**Goal:** Verify voice preference affects all use cases

1. **Set voice to "Casual"**
2. **Test 3 different use cases:**
   - Social Media Posts
   - Email Campaigns
   - Listing Descriptions
3. **Verify tone in each:**
   - Should use warm, friendly language
   - Should feel conversational (like talking to a friend)
   - Should avoid corporate jargon

**Pass criteria:**
- All 3 outputs sound casual/friendly
- Voice preference persists across use cases
- No errors in console

---

### Scenario 2: Quick Mode Power User Workflow

**Goal:** Verify Quick Mode saves time for repeat users

1. **Turn Quick Mode ON**
2. **Generate 5 different use cases rapidly:**
   - Social Media Posts (Instagram, educate, professional)
   - Email Campaigns (past-client nurture, professional)
   - Listing Descriptions (single-family, professional)
   - Client Check-ins (buyer, under-contract, casual)
   - Market Reports (Austin TX, buyers, professional)
3. **Verify each:**
   - No questions asked
   - Generates with smart defaults
   - Completes in <10 seconds

**Pass criteria:**
- Total time for 5 generations: <2 minutes
- All defaults correct
- No UI glitches

---

### Scenario 3: Combined Features Test

**Goal:** Verify Voice Personalization works with Quick Mode

1. **Set voice to "Enthusiastic"**
2. **Turn Quick Mode ON**
3. **Generate "Open House Invitations"**
4. **Verify:**
   - Quick Mode skips questions ✓
   - Output is energetic and exciting ✓
   - Both features work together ✓

**Pass criteria:**
- Output shows enthusiastic tone
- No questions asked
- Generation completes successfully

---

## Edge Cases to Test

### Voice Personalization Edge Cases

- [ ] **Switch voice mid-session**
  - Set to Professional
  - Generate content
  - Change to Casual
  - Generate again
  - Both outputs should have different tones

- [ ] **localStorage cleared**
  - Clear browser data
  - Reload app
  - Should default to "Professional"

- [ ] **Multiple tabs**
  - Open 2 tabs
  - Change voice in Tab 1
  - Reload Tab 2
  - Should show new preference

### Quick Mode Edge Cases

- [ ] **Toggle during generation**
  - Start generating with Quick Mode OFF
  - Toggle Quick Mode ON during loading
  - Should not affect current generation

- [ ] **Use case with no defaults**
  - Turn Quick Mode ON
  - If any use case has questions without defaults
  - Should handle gracefully (skip or use empty string)

- [ ] **Mobile landscape**
  - Test toggle on mobile in landscape mode
  - Should still be tappable (48px minimum)

---

## Browser Compatibility

Test on these browsers/devices:

### Desktop
- [ ] **Chrome (latest)** - Windows/Mac
  - Voice selector: 2x2 grid
  - Toggle: Smooth animation
- [ ] **Safari (latest)** - Mac
  - Voice selector cards render correctly
  - Toggle animation works
- [ ] **Firefox (latest)** - Windows/Mac
  - All gradients render
  - No console errors

### Mobile
- [ ] **iPhone Safari**
  - Voice cards stack vertically (1 column on small screens)
  - Toggle is 48x48px touch target
  - Quick Mode works correctly
- [ ] **Android Chrome**
  - Same as iPhone testing
  - Toggle animation smooth

---

## Analytics Verification

Open browser console and verify these events fire:

### Voice Personalization
- No specific event yet (consider adding "Voice_Changed" event)

### Quick Mode
- [ ] `Quick_Mode_Toggled` when toggle clicked
  - `{ enabled: true }` when turned ON
  - `{ enabled: false }` when turned OFF

**To verify:**
1. Open DevTools Console
2. Look for: `📊 Analytics Event: { event: 'Quick_Mode_Toggled', ... }`
3. Check Plausible dashboard after testing

---

## Performance Testing

### Quick Mode Performance

**Goal:** Verify Quick Mode is actually faster

1. **Normal Mode (baseline):**
   - Start timer
   - Select "Social Media Posts"
   - Answer all 5 questions
   - Click "Show me the magic"
   - Stop timer when content appears
   - **Target:** ~40 seconds

2. **Quick Mode:**
   - Start timer
   - Turn Quick Mode ON
   - Select "Social Media Posts"
   - Stop timer when content appears
   - **Target:** ~10 seconds

**Expected improvement:** 75% faster (30 seconds saved)

---

## Known Limitations

### Voice Personalization
- Voice preference applies to NEW generations only
- Doesn't modify existing history items
- Limited to 4 preset voices (no custom tone)

### Quick Mode
- Uses ALL defaults - no customization
- Can't preview defaults before generating
- May not work well for use cases needing specific inputs

---

## Bug Reporting Template

If you find issues, report using this format:

```
**Feature:** Voice Personalization / Quick Mode
**Browser:** Chrome 120 / Safari 17 / etc
**Device:** Desktop / iPhone 14 / etc
**Steps to reproduce:**
1. ...
2. ...
3. ...

**Expected:** ...
**Actual:** ...
**Screenshot:** [attach if applicable]
**Console errors:** [paste if any]
```

---

## Success Criteria

### Voice Personalization
- ✅ All 4 voices produce different tones
- ✅ Preference persists across sessions
- ✅ Works on all browsers
- ✅ Mobile-friendly UI
- ✅ No console errors

### Quick Mode
- ✅ Toggle works smoothly
- ✅ Skips questions correctly
- ✅ Generates with defaults
- ✅ Saves 30+ seconds for power users
- ✅ Preference persists across sessions

---

## Next Steps After Testing

Once testing is complete:

1. **Document any bugs found** - Create issues in GitHub
2. **Gather user feedback** - Have 2-3 real estate agents test
3. **Analytics review** - Check Plausible for Quick_Mode_Toggled events
4. **Move to Content Expansion** - Add 5 new use cases
5. **Premium Features Foundation** - Multi-variation generation

---

## Quick Reference

**Test URLs:**
- Production: https://ai-prompt-vault-two.vercel.app/prompts
- Local: http://localhost:3000/prompts

**localStorage Keys:**
- Voice: `promptCrafterVoicePreference`
- Quick Mode: `promptCrafterQuickMode`

**Analytics Events:**
- `Quick_Mode_Toggled`
- `PromptCrafter_Started`
- `AI_Generated`
- `Prompt_Copied`

**Support:**
- Report bugs: https://github.com/anthropics/claude-code/issues
- Documentation: All in repo MD files
