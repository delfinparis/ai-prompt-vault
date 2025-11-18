# Premium Features Foundation - Implementation Plan

**Date:** January 18, 2025
**Goal:** Build foundation for future premium/paid features
**Status:** Planning Phase

---

## Strategic Overview

### Why Premium Features?

**Current State:**
- PromptCrafter is 100% free
- All 15 use cases available to everyone
- No monetization strategy

**Premium Opportunity:**
- Power users who use 5+ prompts/week would pay for advanced features
- B2B opportunity: Brokerage licenses for teams
- Real estate coaches could white-label for students

**Competitors Charging:**
- Jasper AI: $39-99/month
- Copy.ai: $49/month
- ChatGPT Plus: $20/month

**Our Advantage:**
- Hyper-focused on real estate (not generic AI)
- Already has 15 proven use cases
- Built-in smart defaults & voice personalization

---

## Phase 3: Premium Features Foundation

**Timeline:** 2-3 weeks
**Goal:** Build infrastructure for premium features (NOT payment yet)

### Feature 1: Multi-Variation Generation ⭐ PRIORITY

**What:**
- Generate 3 variations of the same prompt at once
- Compare options side-by-side
- Pick the best one (or combine elements)

**Why This Matters:**
- Current flow: Generate → Don't like it → Generate again → Lose first version
- Multi-variation solves: "I liked parts of each output"
- Power users want options without re-clicking

**User Flow:**
```
1. Answer questions
2. Click "Generate 3 Variations"
3. See 3 side-by-side outputs:
   - Variation A (Professional)
   - Variation B (Storytelling)
   - Variation C (Data-Driven)
4. Click "Use This One" or "Regenerate This One"
5. Copy to clipboard
```

**Implementation:**
```typescript
// State
const [variations, setVariations] = useState<string[]>([]);
const [selectedVariation, setSelectedVariation] = useState<number | null>(null);

// API call
const generateVariations = async () => {
  const prompts = [
    generatePrompt(useCaseId, answers, 'professional'),
    generatePrompt(useCaseId, answers, 'storytelling'),
    generatePrompt(useCaseId, answers, 'data-driven')
  ];

  // Call OpenAI 3 times (parallel requests)
  const results = await Promise.all(
    prompts.map(prompt => fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    }))
  );

  setVariations(results.map(r => r.output));
};
```

**UI Design:**
- Grid layout: 3 columns on desktop, stack on mobile
- Each variation in a card with:
  - Label: "Variation A - Professional Tone"
  - Output text (truncated with "Read More")
  - "Copy This" button
  - "Regenerate This One" button (replaces just this variation)

**Premium Flag:**
```typescript
// Free users: 1 variation
// Premium users: 3 variations

if (!isPremium) {
  // Show teaser: "Want 3 variations? Upgrade to Premium"
}
```

**Cost Impact:**
- 3x OpenAI API calls = 3x cost
- Mitigation: Only for premium users OR charge credits

---

### Feature 2: Export to PDF/Word

**What:**
- Download generated prompts as formatted documents
- Include branding (agent's logo, contact info)
- Professional formatting

**Why:**
- Agents want to save outputs for later
- Print market reports for clients
- Email as attachments

**Formats:**
1. **PDF** (most requested)
   - Clean formatting
   - Agent branding header/footer
   - Ready to print or email

2. **Word (.docx)** (for editing)
   - Editable format
   - Client can make tweaks

3. **Plain Text** (for CRM import)
   - Copy-paste into CRM notes

**Implementation:**
```typescript
// Use react-pdf or jsPDF
import { PDFDownloadLink } from '@react-pdf/renderer';

<PDFDownloadLink
  document={<PromptPDF content={generatedOutput} />}
  fileName="market-report.pdf"
>
  {({ loading }) => loading ? 'Preparing PDF...' : 'Download PDF'}
</PDFDownloadLink>
```

**Premium Feature?**
- Free: Copy to clipboard only
- Premium: Export to PDF/Word with branding

---

### Feature 3: Custom Templates (Save Your Own)

**What:**
- Save favorite prompts as reusable templates
- Modify existing use cases to fit your style
- Create entirely new use cases

**User Flow:**
```
1. Generate a great prompt
2. Click "Save as Template"
3. Name it: "My Luxury Listing Script"
4. Edit questions, defaults, prompt structure
5. Template appears in "My Templates" section
6. Reuse anytime
```

**Why:**
- Power users want to tweak our prompts
- Brokerages want team-wide templates
- Coaches want to share templates with students

**Data Model:**
```typescript
interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'marketing' | 'content';
  questions: Question[];
  promptTemplate: string;
  createdAt: number;
  usageCount: number;
}

// Store in localStorage (free) or cloud (premium)
localStorage.setItem('customTemplates', JSON.stringify(templates));
```

**Premium Feature?**
- Free: 3 custom templates max (localStorage)
- Premium: Unlimited templates (cloud sync)
- Team Plan: Share templates across brokerage

---

### Feature 4: Stripe Integration Skeleton

**What:**
- Build payment infrastructure (but don't charge yet)
- Pricing tiers
- User accounts

**Pricing Tiers (Proposed):**

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | - 15 use cases<br>- 1 variation per prompt<br>- Copy to clipboard<br>- 3 custom templates (local) |
| **Pro** | $19/mo | - Everything in Free<br>- 3 variations per prompt<br>- Export PDF/Word<br>- Unlimited custom templates<br>- Cloud sync<br>- Priority support |
| **Team** | $99/mo | - Everything in Pro<br>- 5 team members<br>- Shared template library<br>- Usage analytics<br>- White-label branding |

**Implementation (Stripe):**
```typescript
// Install Stripe
npm install @stripe/stripe-js stripe

// Create pricing table in Stripe Dashboard
// Embed checkout link

<button onClick={() => {
  window.location.href = 'https://buy.stripe.com/test_...'
}}>
  Upgrade to Pro - $19/month
</button>
```

**Backend (Vercel Edge Functions):**
```typescript
// /api/create-checkout-session.ts
import Stripe from 'stripe';

export default async function handler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price: 'price_1234567890', // Pro plan price ID
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: 'https://yourdomain.com/success',
    cancel_url: 'https://yourdomain.com/canceled',
  });

  res.redirect(303, session.url);
}
```

**User Auth (Clerk or NextAuth):**
```typescript
// Option 1: Clerk (easiest)
npm install @clerk/nextjs

// Option 2: NextAuth (free, DIY)
npm install next-auth
```

**DON'T CHARGE YET:**
- Build infrastructure only
- Test checkout flow
- Don't make anything premium-only yet
- Get 100 users first, THEN enable payments

---

## Implementation Priority

### Sprint 1 (Week 1): Multi-Variation Generation
- ✅ Day 1-2: Build UI for 3-column variation display
- ✅ Day 3: Parallel API calls to OpenAI
- ✅ Day 4: "Regenerate This One" functionality
- ✅ Day 5: Testing & polish

**Deliverable:** Users can generate 3 variations and pick the best

---

### Sprint 2 (Week 2): Export + Templates
- ✅ Day 1-2: PDF export with react-pdf
- ✅ Day 3: Word export with docx library
- ✅ Day 4-5: Custom templates (save, edit, reuse)

**Deliverable:** Users can export outputs and save custom templates

---

### Sprint 3 (Week 3): Stripe Skeleton
- ✅ Day 1: Set up Stripe account & test products
- ✅ Day 2: Create checkout flow (test mode)
- ✅ Day 3: User auth (Clerk or NextAuth)
- ✅ Day 4: Premium flag in database
- ✅ Day 5: Testing end-to-end

**Deliverable:** Payment infrastructure ready (but not enforced)

---

## Success Metrics

**Before Monetization (Free Users):**
- 100+ active users
- 500+ prompts generated
- 20+ custom templates created
- <5% churn rate

**After Enabling Premium:**
- 5% conversion to Pro ($19/mo) = $95 MRR at 100 users
- 1 Team plan ($99/mo) = $99 MRR
- **Target:** $500 MRR in first 3 months

---

## Risk Mitigation

### Risk 1: No one pays
**Mitigation:**
- Keep Free tier generous (don't paywall core features)
- Pro tier is for power users only
- Build trust first with free value

### Risk 2: OpenAI costs too high
**Mitigation:**
- Multi-variation only for Pro users
- Credit system: 100 credits/month (1 generation = 1 credit, 3 variations = 3 credits)
- Switch to gpt-4o-mini (cheaper)

### Risk 3: Users don't want templates
**Mitigation:**
- Ship multi-variation first (higher value)
- Templates are bonus feature
- Survey users before building

---

## Technical Architecture

### Database (Supabase or Firebase)
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'free', -- free, pro, team
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Templates table
CREATE TABLE custom_templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  use_case_id TEXT,
  questions JSONB,
  prompt_template TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  use_case_id TEXT,
  variations_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Routes
```
/api/generate - Generate single prompt (free)
/api/generate-variations - Generate 3 variations (premium)
/api/export-pdf - Export to PDF (premium)
/api/templates - CRUD custom templates
/api/stripe/checkout - Create Stripe checkout session
/api/stripe/webhook - Handle subscription events
```

---

## Open Questions

1. **Should we use Clerk or NextAuth for auth?**
   - Clerk: $25/mo for Pro features, easier
   - NextAuth: Free, more DIY

2. **Should multi-variation be premium-only?**
   - Option A: Free users get 1 variation, premium gets 3
   - Option B: Everyone gets 3, but free users limited to 10/month

3. **What's the right price point?**
   - $19/mo (comparable to ChatGPT Plus)
   - $29/mo (higher value, fewer customers)
   - $9/mo (volume play)

4. **Should we launch Team plan immediately?**
   - Yes: Huge opportunity for brokerages
   - No: Build individual users first

---

## Next Steps

1. **User Research (1 week)**
   - Survey current users: "Would you pay for X?"
   - Validate feature priorities
   - Get 5 beta testers to commit to premium

2. **Build Multi-Variation (1 week)**
   - Highest value, lowest complexity
   - Ship to production as "beta"
   - Collect feedback

3. **Build Export + Templates (1 week)**
   - PDF export most requested
   - Templates for power users

4. **Stripe Skeleton (1 week)**
   - Don't charge yet
   - Test checkout flow with $0 test products

5. **Enable Payments (when ready)**
   - 100+ users milestone
   - Feature-complete
   - Pricing validated

---

## Summary

**Total Timeline:** 4 weeks (3 weeks build + 1 week research)

**Deliverables:**
- ✅ Multi-variation generation (3 side-by-side outputs)
- ✅ Export to PDF/Word
- ✅ Custom templates (save & reuse)
- ✅ Stripe payment infrastructure (not enforced yet)

**Goal:** Build premium features foundation WITHOUT charging users yet. Get to 100 users, validate pricing, THEN enable payments.

**Next Immediate Action:** Start with Multi-Variation Generation (Sprint 1).
