# 💰 Monetization Playbook

## Overview
This document outlines the complete monetization strategy for AI Prompt Vault, including pricing rationale, payment setup, conversion funnels, and revenue projections.

---

## 🎯 Pricing Philosophy

### The Value Ladder
1. **Free (Lead Gen):** 10 prompts/month → Build trust, collect testimonials
2. **Pro ($29/mo):** Unlimited → Individual power users
3. **Team ($99/mo):** 5 seats → Brokerages and teams

### Pricing Psychology
- $29/mo = One showing saved (no-show prevention)
- $290/year = Save 2 months (16% discount)
- $99/mo team = $20/user (60% bulk discount)

### Why This Works
- **Low enough:** Agents expense <$50/mo tools without approval
- **High enough:** Signals quality, not "cheap template site"
- **Annual discount:** Improves cash flow, reduces churn
- **Team upsell:** 5x revenue per customer, stickier

---

## 💳 Payment Infrastructure

### Recommended: Lemon Squeezy
**Why:**
- No Stripe/Merchant of Record headaches
- Handles global taxes/VAT automatically
- Clean UI, great for SaaS
- 5% + payment fees (vs Stripe 2.9% + MoR complexity)

**Setup Steps:**
1. Create account at lemonsqueezy.com
2. Create products:
   - Pro Monthly ($29)
   - Pro Annual ($290)
   - Team Monthly ($99)
3. Get API keys
4. Add checkout links to app

**Alternative: Gumroad**
- Even simpler, good for MVP
- Higher fees (10%), but zero setup
- Great for pre-launch validation

---

## 🔐 Feature Gates

### Free Plan (Lead Generation)
✅ Browse all prompts
✅ Copy 10 prompts per month
✅ Basic features (search, favorites)
✅ Mobile app
❌ Prompt sequences
❌ Custom prompts
❌ Collections/folders
❌ Field history
❌ Follow-up suggestions
❌ Export to .txt
❌ Priority support

**Counter Display:**
```
"8 of 10 free prompts used this month"
→ Upgrade for unlimited ⚡
```

### Pro Plan ($29/mo)
✅ Everything in Free
✅ Unlimited prompts
✅ Prompt sequences
✅ Custom prompts
✅ Collections/folders
✅ Field history (quick-select)
✅ Follow-up suggestions
✅ Export to .txt
✅ Priority email support
✅ Early access to new prompts

**Badge Display:**
```
PRO badge on user avatar
"You're on Pro - unlimited everything!"
```

### Team Plan ($99/mo)
✅ Everything in Pro
✅ 5 user seats
✅ Shared prompt library
✅ Team analytics dashboard
✅ Admin controls
✅ Onboarding call (30 min)
✅ Slack/dedicated support

---

## 📊 Conversion Funnel

### Stage 1: Free User Activation
**Goal:** Get them to copy 3 prompts in first session

**Tactics:**
- Onboarding: "Try this popular prompt first"
- Show trending prompts (social proof)
- Success confetti on first copy
- Email: "You tried X, here are 3 more you'll love"

**Metric:** Time to 3rd prompt copy

### Stage 2: Engagement Loop
**Goal:** Get them to 10 prompts (hit free limit)

**Tactics:**
- Follow-up suggestions after each copy
- Recently used section (pull them back)
- Email: "Agents like you also use these prompts"
- Show counter: "7 of 10 used this month"

**Metric:** Days to hit limit

### Stage 3: Paywall Moment
**Goal:** Convert at limit or during power-user moment

**Tactics:**
- Soft paywall: "Upgrade for unlimited ⚡"
- Show locked features (sequences, custom prompts)
- Social proof: "Join 87 Pro members"
- Urgency: "Founding member discount ends soon"

**Metric:** Limit → Upgrade conversion rate

### Stage 4: Pro Upsell
**Goal:** Convert Pro → Team when they share

**Tactics:**
- Detect sharing behavior (same IP, similar usage)
- Show team benefits in dashboard
- Offer trial: "Invite your team (free for 14 days)"
- ROI calc: "$20/agent vs $29 each = save $46/mo"

**Metric:** Pro → Team conversion rate

---

## 💌 Email Sequences

### Welcome Series (Free Users)
**Email 1:** Welcome + First prompt suggestion (Day 0)
**Email 2:** "Here's how top agents use this" (Day 2)
**Email 3:** Case study + video tutorial (Day 5)
**Email 4:** "You're doing great! Try these next" (Day 10)
**Email 5:** Testimonials + upgrade CTA (Day 15)

### Upgrade Series (Hit Limit)
**Email 1:** "You hit 10 prompts! Here's what Pro unlocks" (Immediately)
**Email 2:** Social proof + discount reminder (2 days later)
**Email 3:** Case study from Pro user (4 days later)
**Email 4:** Last chance / FOMO (7 days later)

### Retention Series (Pro Users)
**Email 1:** Welcome to Pro + advanced tips (Day 0)
**Email 2:** Unlock sequences feature (Day 7)
**Email 3:** Create your first custom prompt (Day 14)
**Email 4:** Monthly usage recap (Every 30 days)

---

## 🎁 Discounts & Promotions

### Founding Member (First 100 Customers)
- **Offer:** 50% off forever ($14.50/mo or $149/year)
- **Why:** Early testimonials, loyal community, good PR
- **Cost:** $14.50 * 100 = $1,450/mo locked in (worth it)

### Product Hunt Launch (24 Hours Only)
- **Offer:** 40% off first year (Pro: $174/year)
- **Why:** Maximize PH momentum, create urgency
- **Code:** PHLAUNCH40

### Seasonal Campaigns
- **Black Friday:** 50% off annual plans
- **New Year:** "New Year, New Leads" - 30% off
- **Real Estate Peaks:** Summer/Spring promotions

### Affiliate Program
- **Offer:** 30% recurring commission
- **Target:** RE coaches, YouTubers, bloggers
- **Why:** High LTV ($348/year per customer = $104 commission in Year 1)

---

## 📈 Revenue Projections

### Conservative Path
| Month | Free Users | Pro ($29) | Team ($99) | MRR |
|-------|-----------|-----------|------------|-----|
| 1 | 100 | 0 | 0 | $0 |
| 2 | 500 | 20 | 0 | $580 |
| 3 | 2,000 | 100 | 5 | $3,395 |
| 6 | 5,000 | 200 | 15 | $7,285 |
| 12 | 10,000 | 500 | 50 | $19,450 |

**Year 1 ARR:** ~$230K

### Optimistic Path
| Month | Free Users | Pro ($29) | Team ($99) | MRR |
|-------|-----------|-----------|------------|-----|
| 1 | 200 | 0 | 0 | $0 |
| 2 | 1,000 | 50 | 2 | $1,648 |
| 3 | 5,000 | 250 | 10 | $8,240 |
| 6 | 15,000 | 600 | 40 | $21,360 |
| 12 | 50,000 | 1,500 | 150 | $58,350 |

**Year 1 ARR:** ~$700K

### Key Assumptions
- **Free → Pro conversion:** 5% (industry avg: 2-4%)
- **Pro → Team conversion:** 5%
- **Monthly churn:** 5%
- **Annual pre-pay rate:** 30%
- **Affiliate-driven signups:** 20%

---

## 🧮 Unit Economics

### Customer Acquisition Cost (CAC)
- **Organic (FB groups, SEO):** $0-5
- **Content marketing:** $10-20
- **Paid ads:** $30-50
- **Affiliate commission:** $104 (30% of Year 1)

**Target CAC:** <$30

### Lifetime Value (LTV)
- **Average Pro lifespan:** 12 months
- **Annual plan rate:** 30%
- **Pro LTV:** $348 (1 year) to $1,044 (3 years)
- **Team LTV:** $1,188 (1 year) to $3,564 (3 years)

**Target LTV:CAC Ratio:** >10:1

### Break-Even Analysis
**Fixed Costs (Monthly):**
- Hosting (Vercel): $20
- Domain: $1
- Lemon Squeezy fees: 5% of revenue
- Email (ConvertKit): $29

**Variable Costs:**
- Support (10 hrs/mo @ $20/hr): $200
- Content creation: $200/mo

**Total:** ~$450/mo

**Break-even:** 16 Pro customers

---

## 🚀 Launch Pricing Strategy

### Phase 1: Founding Member (First 2 Weeks)
- **Offer:** 50% off forever
- **Price:** $14.50/mo or $149/year
- **Limit:** First 100 customers
- **Goal:** Testimonials, early revenue, loyal base

### Phase 2: Product Hunt Launch (Day 15)
- **Offer:** 40% off first year
- **Price:** $17.40/mo or $174/year
- **Code:** PHLAUNCH40
- **Duration:** 24 hours only

### Phase 3: Public Launch (Week 3+)
- **Offer:** 20% off first month
- **Price:** $23.20 first month, then $29
- **Code:** WELCOME20
- **Goal:** Lower barrier, prove value

### Phase 4: Full Price (Month 2+)
- **Price:** $29/mo or $290/year
- **Occasional:** Seasonal promotions

---

## 🎯 Conversion Optimization

### A/B Tests to Run
1. **Paywall messaging:**
   - "Upgrade to Pro" vs "Unlock unlimited"
   - "Only $29/mo" vs "$0.96/day"
   
2. **Pricing page:**
   - 3 plans vs 2 plans (remove free from comparison)
   - Annual discount: 16% vs 25% vs "2 months free"
   
3. **Email subject lines:**
   - "You hit your limit" vs "Here's what you're missing"
   - "Join 87 Pro members" vs "Unlock 6 features for $29"

4. **CTA buttons:**
   - "Start Pro Trial" vs "Upgrade Now"
   - Color: Blue vs Green vs Orange

### Key Metrics to Track
- **Activation rate:** % who copy 3+ prompts
- **Limit hit rate:** % who reach 10 prompts
- **Conversion rate:** % who upgrade (by source)
- **Time to convert:** Days from signup to payment
- **Churn rate:** % who cancel monthly
- **Reactivation rate:** % who return after canceling

---

## 💡 Creative Monetization Ideas

### 1. Custom Prompt Marketplace
- Let Pro users sell their custom prompts
- Take 30% commission
- Best sellers get featured

### 2. Done-For-You Service
- "Send us your listing, we'll write it" - $49/listing
- Upsell from product to service
- Productized service at scale

### 3. Broker Licensing
- White-label for brokerages - $499/mo
- Custom branding, unlimited agents
- Recurring revenue from enterprises

### 4. AI Writing Credits
- Integrate GPT API directly
- Sell credits: 100 for $19
- Easier than copy/paste for beginners

### 5. Certification Program
- "AI-Certified Agent" course - $297
- Teach them to use tool effectively
- Affiliate upsell opportunity

---

## 📞 Support & Retention

### Free User Support
- Email only (48-hour response)
- Help docs / FAQs
- Community Facebook group

### Pro User Support
- Priority email (24-hour response)
- Live chat (business hours)
- Monthly office hours (group Q&A)

### Team User Support
- Dedicated Slack channel
- Onboarding call (30 min)
- Quarterly business review
- Custom prompt creation

### Churn Prevention
- Exit survey: "Why are you leaving?"
- Offer pause (3 months frozen)
- Discount: "Stay for $19/mo?"
- Win-back campaign after 30 days

---

## ✅ Pre-Launch Checklist

### Payment Setup
- [ ] Lemon Squeezy account created
- [ ] Products configured (Pro, Pro Annual, Team)
- [ ] Checkout links tested
- [ ] Webhook for license validation
- [ ] Refund policy written

### App Integration
- [ ] Paywall logic (10 prompt limit)
- [ ] Feature gates (sequences, custom, collections)
- [ ] Upgrade modal designed
- [ ] "Unlock Pro" CTAs placed
- [ ] License verification API

### Marketing Assets
- [ ] Pricing page designed
- [ ] Feature comparison table
- [ ] Testimonials collected
- [ ] Demo video recorded
- [ ] Case studies written

### Email Infrastructure
- [ ] ConvertKit account set up
- [ ] Welcome series created
- [ ] Upgrade sequence written
- [ ] Templates designed
- [ ] Automations tested

### Analytics
- [ ] Conversion events tracked
- [ ] Cohort analysis set up
- [ ] Revenue dashboard built
- [ ] Churn tracking enabled

---

**Ready to make money! 💰**
