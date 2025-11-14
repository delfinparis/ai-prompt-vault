# 🚀 Complete Launch Checklist

Your step-by-step playbook to launch both the web app and GPT in the ChatGPT store.

**Total time:** 4–6 hours  
**Cost:** $9/month (Plausible) + $20/month (ChatGPT Plus)  
**Potential:** 5,000+ users in 60 days

---

## Phase 1: Web App Launch (2 hours)

### ✅ Pre-Launch Setup (30 min)

- [ ] **Verify build passes**
  ```bash
  npm run build
  npm test -- --watchAll=false
  ```
  - Expected: All tests pass (36/36)
  - Expected: Build size ~103 kB gzipped

- [ ] **Set environment variable** in Vercel dashboard
  - Go to: Project Settings → Environment Variables
  - Add: `REACT_APP_GPT_STORE_URL` = `https://chat.openai.com/g/g-YOUR_GPT_ID` (add after GPT created)
  - Save and redeploy

- [ ] **Enable analytics** (choose one):
  
  **Option A: Plausible (recommended)**
  ```bash
  # 1. Sign up at https://plausible.io
  # 2. Add site: app.ai-prompt-vault.vercel.app
  # 3. Uncomment line 17 in public/index.html
  # 4. Commit and push
  ```
  
  **Option B: Custom endpoint (zero cost)**
  - Already enabled! Events stored in `/api/analytics`
  - Optional: Connect to database (see `ANALYTICS_SETUP.md`)

### ✅ Deploy to Production (15 min)

- [ ] **Assign subdomain** in Vercel
  - Go to: Project Settings → Domains
  - Add: `app.ai-prompt-vault.vercel.app` (or your custom domain)
  - Wait for DNS propagation (~5 min)

- [ ] **Test wizard flow** (incognito window)
  ```
  1. Visit app.ai-prompt-vault.vercel.app
  2. Wizard opens by default (first-time user)
  3. Select "Lead Generation" challenge
  4. Fill in: Market = "Austin, TX", Channel = "Instagram"
  5. Click "See my tailored prompt →"
  6. Click A/B variant CTA (Copy + Open ChatGPT / Use in ChatGPT / Get My Answer)
  7. Verify: Prompt copied to clipboard
  8. Check analytics dashboard (if enabled)
  ```

- [ ] **Test library browsing**
  ```
  1. Click "Start Wizard" → "Skip and browse the library →"
  2. Search for "listing description"
  3. Click a prompt card
  4. Fill 2 fields, copy prompt
  5. Verify: Copy successful, follow-up suggestions appear
  ```

- [ ] **Test agent profile** (optional)
  ```
  1. Click "Profile" in header (after first copy)
  2. Fill: Market, Niche, CRM
  3. Open new prompt → Verify: Fields auto-populate
  ```

- [ ] **Verify mobile responsive**
  - Test on iPhone/Android (or browser dev tools)
  - Verify: Wizard fits screen, buttons tap easily

### ✅ Analytics Dashboard (15 min)

- [ ] **Create Plausible goals** (if using Plausible)
  - Go to: Settings → Goals → Add Goal
  - Add custom events:
    - `rpv:wizard_start`
    - `rpv:wizard_challenge_selected`
    - `rpv:wizard_drilldown_complete`
    - `rpv:prompt_copy`
    - `rpv:cta_gpt_click`
    - `rpv:return_visit`

- [ ] **Create funnel**
  - Name: "Wizard Conversion"
  - Steps: wizard_start → challenge_selected → drilldown_complete → prompt_copy
  - Target: 48%+ completion (per simulation)

- [ ] **Set up A/B test view**
  - Filter: `rpv:cta_gpt_click`
  - Group by: property `variant`
  - Track: A vs B vs C click-through rate
  - Goal: Run for 1,600+ users per arm (~4,800 total)

### ✅ Quick Marketing (30 min)

- [ ] **Share on LinkedIn** (optional)
  ```
  🚀 Just launched a new tool for real estate agents

  Problem: AI feels like a blank page. Where do you start for YOUR business?

  Solution: Challenge-driven wizard that drills down and hands you a ready-to-paste prompt for ChatGPT.

  Try it: app.ai-prompt-vault.vercel.app

  Choose your challenge (lead gen, listing launch, follow-up, etc.) → answer 2-3 questions → get a tailored prompt in 60 seconds.

  Let me know what you think! 🏡⚡
  ```

- [ ] **Share in real estate communities** (Facebook groups, Discord)
  - Keep it helpful, not promotional
  - Focus on solving the "blank page" problem
  - Link to wizard: app.ai-prompt-vault.vercel.app

---

## Phase 2: GPT Store Launch (2 hours)

### ✅ GPT Configuration (45 min)

Follow **LAUNCH_NOW_GUIDE.md** steps 1–7:

- [ ] **Step 1:** Open GPT Builder → https://chat.openai.com/gpts/editor
- [ ] **Step 2:** Configure name, description, instructions (copy from guide)
- [ ] **Step 3:** Add 6 conversation starters
- [ ] **Step 4:** Upload `prompts-export.json` (see `totalPrompts` inside the file)
- [ ] **Step 5:** Set capabilities (all OFF)
- [ ] **Step 6:** Create/upload profile picture (house + lightning bolt)
- [ ] **Step 7:** Test privately (set visibility: "Only me")

**Test scenarios:**
```
1. "What prompts do you have for lead generation?"
2. "Create a FSBO conversion script for Denver"
3. "Write a listing description for a luxury condo"
```

Expected: GPT asks clarifying questions, generates complete outputs, suggests follow-ups

### ✅ Beta Test (1 week - Optional)

- [ ] **Set visibility:** "Anyone with a link"
- [ ] **Share with 10–20 agents** you know
- [ ] **Collect feedback** via Google Form:
  - What did you try?
  - Were the outputs useful?
  - What would make it better?
  - Would you use this regularly?

- [ ] **Iterate based on feedback:**
  - Adjust tone/voice in instructions
  - Add more conversation starters
  - Refine personalization prompts

### ✅ Public Launch (15 min)

- [ ] **Submit to GPT Store**
  - Set visibility: "Public"
  - Click "Update" or "Publish"
  - Wait for OpenAI review (~1–2 days)

- [ ] **Copy GPT URL** after approval
  - Format: `https://chat.openai.com/g/g-YOUR_GPT_ID`
  - Add to Vercel env: `REACT_APP_GPT_STORE_URL`
  - Redeploy app

- [ ] **Update web app** with GPT link
  - Verify "Use in ChatGPT →" button appears in header
  - Test click → opens GPT in new tab

### ✅ Marketing Blitz (1 hour)

**LinkedIn Post:**
```
🚀 Game-changing AI assistant for real estate agents

Just launched in the ChatGPT store + web app combo:

GPT Assistant: 120+ proven prompts for marketing, listings, lead gen
Web App: Challenge wizard that tailors prompts to YOUR market in 60 seconds

Try the GPT: [Your GPT Store Link]
Try the wizard: app.ai-prompt-vault.vercel.app

Built to solve the "blank page" problem. Pick your challenge, answer 3 questions, get a ready-to-use prompt.

What would you try first?

#RealEstate #AI #Productivity
```

**Facebook Groups:**
```
Hey everyone! 👋

I built two free tools to help agents get more from ChatGPT:

1️⃣ GPT in ChatGPT store (120+ prompts)
2️⃣ Web wizard (tailors prompts to your market)

Most useful for:
- Listing descriptions
- Lead gen plans
- Follow-up sequences
- Social content

Try the wizard: app.ai-prompt-vault.vercel.app
Try the GPT: [Link]

Let me know if you have questions!
```

**Email to your list:**
```
Subject: New AI tools for real estate (free)

Hi [Name],

Two ways to solve the "AI blank page" problem:

**Option 1: ChatGPT GPT**
120+ real estate prompts built into ChatGPT
→ [GPT Store Link]

**Option 2: Web Wizard**
Answer 3 questions → get a tailored prompt for your market
→ app.ai-prompt-vault.vercel.app

Both free. Pick your challenge (lead gen, listing launch, etc.) and go.

Let me know what you think!

[Your Name]

P.S. The web app has AI generation + advanced features. Check it out.
```

- [ ] **Post to LinkedIn** (copy above)
- [ ] **Post to 3–5 Facebook groups** (adjust tone per group)
- [ ] **Email your list** (if you have one)
- [ ] **Reply to ALL comments** within 24 hours

---

## Phase 3: Monitor & Iterate (Ongoing)

### Week 1: Foundation (Daily Check-Ins)

- [ ] **Check analytics** (daily)
  - Web app: Wizard start rate, completion rate, CTA clicks
  - GPT: Conversation count (ChatGPT analytics dashboard)
  - Target: 100 web visitors, 50 wizard starts, 20 GPT users

- [ ] **Respond to feedback** (within 24 hours)
  - GPT reviews/comments
  - LinkedIn/Facebook comments
  - Email replies

- [ ] **Fix any bugs** (priority)
  - Check Vercel logs for errors
  - Test wizard on different devices
  - Verify analytics events firing

### Week 2–4: Growth (Weekly Review)

- [ ] **Review A/B test** (if 1,600+ users per arm)
  - Which CTA variant wins? (A, B, or C)
  - Deploy winning variant to all users
  - Document findings

- [ ] **Analyze challenge popularity**
  - Check `rpv:wizard_challenge_selected` breakdown
  - Top 3 challenges = focus for content/marketing
  - Consider adding similar prompts to library

- [ ] **Track return visits**
  - Check `rpv:return_visit { days_since_last }`
  - D1 return rate target: 55%+ (per simulation)
  - D7 return rate target: 35%+

- [ ] **Add prompts based on requests**
  - Monitor GPT conversations for common asks
  - Add to `src/prompts.ts`
  - Regenerate `prompts-export.json` and reupload to GPT

### Month 2+: Scale (Monthly Review)

- [ ] **Content marketing**
  - Write blog post: "How I built a real estate AI assistant"
  - Create YouTube tutorial: "Getting started with the wizard"
  - Share case studies/success stories

- [ ] **Partnerships**
  - Reach out to real estate coaches
  - Offer co-branded version or affiliate deal
  - Guest post on RE blogs/podcasts

- [ ] **Premium features** (optional)
  - Implement paywall for 10+ generations/month
  - Add team sharing for brokerages
  - Power user mode (remember defaults)

- [ ] **Optimize for SEO**
  - GPT Store: Respond to reviews (boosts ranking)
  - Web app: Add blog/resources section
  - Target keywords: "real estate AI prompts", "ChatGPT for realtors"

---

## 🎯 Success Metrics Dashboard

Track these weekly:

| Metric | Week 1 | Week 4 | Week 8 | Target |
|--------|--------|--------|--------|--------|
| **Web App** |
| Unique visitors | 100 | 500 | 1,000 | 1,000 |
| Wizard starts | 50 | 250 | 500 | 500 |
| Wizard completions | 44 | 220 | 440 | 440 |
| D1 return rate | 55% | 55% | 55% | 55% |
| **GPT Store** |
| Total users | 20 | 200 | 1,000 | 1,000 |
| Conversations | 50 | 500 | 2,500 | 2,500 |
| Reviews | 1 | 10 | 25 | 25 |
| **Cross-Traffic** |
| GPT → Web clicks | 5 | 50 | 200 | 200 |
| Web → GPT clicks | 10 | 100 | 300 | 300 |

---

## 🚨 Common Issues & Quick Fixes

### Issue: Wizard won't open for first-time users
**Fix:** Clear `rpv:wizardDismissed` localStorage key or test in incognito

### Issue: Analytics events not firing
**Fix:** 
1. Check console for [Analytics] logs (dev mode)
2. Verify Plausible script uncommented (production)
3. Check Vercel function logs for `/api/analytics` errors

### Issue: A/B test variant stuck on one option
**Fix:** Clear `rpv:abWizardCTA` localStorage key to get reassigned

### Issue: GPT outputs too generic
**Fix:** Strengthen "Personalization is Key" section in GPT instructions

### Issue: Mobile wizard cuts off
**Fix:** Test on real device; adjust modal max-height in `AIPromptVault.tsx`

### Issue: "Use in ChatGPT" button doesn't appear
**Fix:** Verify `REACT_APP_GPT_STORE_URL` set in Vercel env vars and redeployed

---

## 📚 Reference Documentation

- **LAUNCH_NOW_GUIDE.md** — Complete GPT setup (Steps 1–10)
- **ANALYTICS_EVENTS.md** — Event tracking reference
- **ANALYTICS_SETUP.md** — How to enable Plausible/PostHog/Custom
- **WIZARD_IMPLEMENTATION.md** — Technical wizard docs
- **README.md** — Development setup

---

## ✅ Launch Day Checklist (Print This)

**Morning (9am–12pm):**
- [ ] Final build + test
- [ ] Deploy web app to production
- [ ] Enable analytics
- [ ] Test wizard in incognito
- [ ] Create/upload GPT profile pic
- [ ] Configure GPT (name, description, instructions)
- [ ] Upload prompts-export.json to GPT
- [ ] Test GPT privately

**Afternoon (12pm–3pm):**
- [ ] Submit GPT to store (set Public)
- [ ] Create LinkedIn post
- [ ] Create Facebook posts
- [ ] Draft email to list
- [ ] Take screenshots/demo video

**Evening (3pm–6pm):**
- [ ] Post to LinkedIn
- [ ] Post to Facebook groups
- [ ] Send email blast
- [ ] Monitor comments/replies
- [ ] Celebrate! 🎉

**Next 24 hours:**
- [ ] Reply to ALL comments
- [ ] Check analytics hourly
- [ ] Fix any bugs immediately
- [ ] Share early wins on social

---

## 🎉 You're Ready to Launch!

**Next action:** Start Phase 1, Step 1 (Verify build)

**Time commitment:** 
- Setup: 4–6 hours (one-time)
- Maintenance: 2–5 hours/week (first month)
- Growth: 5–10 hours/week (month 2+)

**Questions?** Check the reference docs or DM me.

**LET'S GO!** 🚀
