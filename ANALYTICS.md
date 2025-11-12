# 📊 Analytics Setup Guide

## Quick Start: Plausible Analytics (Recommended)

### Why Plausible?
- ✅ Privacy-friendly (no cookies)
- ✅ GDPR compliant out of the box
- ✅ Lightweight (< 1KB script)
- ✅ Beautiful dashboard
- ✅ Custom events built-in
- ✅ $9/mo for 10K visits

### Setup Steps (5 minutes)

1. **Sign up:** https://plausible.io
2. **Add your domain:** `your-app.vercel.app`
3. **Get your script:**
   ```html
   <script defer data-domain="your-app.vercel.app" src="https://plausible.io/js/script.js"></script>
   ```

4. **Add to `public/index.html`:**
   ```html
   <head>
     <!-- Existing tags... -->
     <script defer data-domain="your-app.vercel.app" src="https://plausible.io/js/script.js"></script>
   </head>
   ```

5. **Deploy:** `git push` → Vercel auto-deploys

### Custom Events Tracked

The app already tracks these events automatically:

```javascript
// User actions
- prompt_copied         // User copies a prompt
- prompt_exported       // User exports as .txt
- prompt_duplicated     // User creates custom version
- prompt_selected       // User clicks a prompt card

// Engagement
- favorite_toggled      // User stars/unstars
- tag_clicked          // User filters by tag
- favorites_opened     // User views favorites

// Features
- dark_mode_toggled    // User switches theme
- prompt_added_to_collection  // User organizes prompts
```

### View Your Data

Go to: `https://plausible.io/your-app.vercel.app`

You'll see:
- **Traffic:** Unique visitors, pageviews, bounce rate
- **Sources:** Where users come from (FB, Google, direct)
- **Goals:** Custom events (prompts copied, signups, upgrades)
- **Devices:** Desktop vs mobile usage

---

## Alternative: PostHog (For Power Users)

### Why PostHog?
- ✅ Product analytics + session replay
- ✅ Feature flags
- ✅ A/B testing
- ✅ User funnels
- ✅ Free up to 1M events/mo

### Setup Steps

1. **Sign up:** https://posthog.com
2. **Get your project API key**
3. **Add to `public/index.html`:**
   ```html
   <script>
     !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
     posthog.init('YOUR_PROJECT_API_KEY',{api_host:'https://app.posthog.com'})
   </script>
   ```

4. **Deploy**

### Custom Events

The app auto-sends events to PostHog. You'll see:
- **Funnels:** Signup → First Copy → Upgrade
- **Session Replay:** Watch users interact with your app
- **Cohorts:** Segment power users vs casual users

---

## Key Metrics to Track

### Product Metrics
- **Daily Active Users (DAU):** How many use it daily?
- **Prompts per user:** Average copies per session
- **Retention:** % who return Day 7, Day 30
- **Most popular prompts:** Which get copied most?
- **Feature adoption:** % using sequences, collections, custom

### Business Metrics (After Monetization)
- **Signups per day:** Growth rate
- **Free → Pro conversion:** % who upgrade
- **Time to convert:** Days from signup to payment
- **Churn rate:** % who cancel monthly
- **MRR:** Monthly recurring revenue

### Funnel to Optimize
```
100 visitors
  ↓ (80% bounce prevention)
80 signups
  ↓ (60% activation)
48 copy 3+ prompts
  ↓ (30% hit limit)
14 reach 10 prompts
  ↓ (10% convert)
1-2 upgrade to Pro
```

**Goal:** 3-5% signup → Pro conversion

---

## Simple Analytics Dashboard

### Create a Goals Dashboard in Plausible

1. Go to Settings → Goals
2. Add custom events:
   - `prompt_copied` → Goal: "Prompt Copied"
   - `prompt_exported` → Goal: "Export Used"
   - `favorite_toggled` → Goal: "Favorite Added"
   - `prompt_duplicated` → Goal: "Custom Prompt Created"

3. View conversion rates:
   - % of visitors who copy a prompt
   - % who star a favorite
   - % who create custom prompts

### Track User Journey

**New User Flow:**
```
1. Landing → 2. Browse → 3. Click Prompt → 4. Copy → 5. See Follow-ups → 6. Copy Again
```

**Set up funnel:**
1. Pageview
2. prompt_selected (click)
3. prompt_copied (first copy)
4. prompt_copied (second copy within 10 min)

**Success metric:** 50% reach step 4

---

## Google Analytics Alternative (Not Recommended)

### Why Not GA4?
- ❌ Heavy script (slows site)
- ❌ Complex setup
- ❌ Privacy concerns
- ❌ Overkill for SaaS

**But if you must:**

1. Create GA4 property
2. Add to `public/index.html`:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

3. Track custom events:
   ```javascript
   gtag('event', 'prompt_copied', {
     'event_category': 'engagement',
     'event_label': prompt.title
   });
   ```

---

## Privacy & Compliance

### GDPR Compliance Checklist
- [ ] Add privacy policy page
- [ ] Mention analytics in policy
- [ ] Use Plausible (no cookies = no consent needed)
- [ ] OR: Add cookie banner if using GA

### Privacy Policy Template

**Analytics Section:**
```
We use Plausible Analytics to understand how users interact with our app. 
Plausible is privacy-friendly and does not use cookies or collect personal data.
Learn more: https://plausible.io/privacy-focused-web-analytics

Data collected:
- Page views
- Feature usage (which prompts copied, which features used)
- Device type (desktop vs mobile)

We do NOT collect:
- Personal information
- IP addresses
- Cross-site tracking data
```

---

## Testing Your Analytics

### 1. Open Developer Console
```javascript
// Should see events logged
window.addEventListener('rpv_event', (e) => {
  console.log('Event:', e.detail);
});
```

### 2. Trigger Events
- Copy a prompt → `prompt_copied`
- Star a favorite → `favorite_toggled`
- Toggle dark mode → `dark_mode_toggled`

### 3. Check Plausible Dashboard
- Go to plausible.io
- View today's stats
- Check custom events showing up

---

## Advanced: Revenue Tracking (After Monetization)

### Track Upgrades

Add this to your payment success page:

```javascript
// When user upgrades
trackEvent('upgrade_to_pro', {
  plan: 'pro_monthly',
  price: 29,
  revenue: 29
});

// Plausible revenue goal
window.plausible('Upgrade', {
  props: {
    plan: 'pro_monthly',
    revenue: { amount: 29, currency: 'USD' }
  }
});
```

### Track Churn

```javascript
// When user cancels
trackEvent('subscription_cancelled', {
  plan: 'pro_monthly',
  reason: 'too_expensive'  // from exit survey
});
```

---

## Quick Setup Script

Run this to add Plausible:

```bash
# 1. Get your Plausible domain script
echo "Visit: https://plausible.io → Add site → Copy script"

# 2. Add to public/index.html
# (Paste script in <head> before </head>)

# 3. Deploy
git add public/index.html
git commit -m "analytics: add Plausible tracking"
git push

# 4. Verify
# Visit your app, then check plausible.io dashboard
```

---

## Cost Breakdown

### Plausible
- 0-10K visits/mo: $9/mo
- 10K-100K: $19/mo
- 100K-1M: $69/mo

### PostHog
- 0-1M events/mo: FREE
- 1M-10M: $0.00045/event (~$450/mo)

### Google Analytics
- FREE (but you pay with user privacy)

**Recommendation:** Start with Plausible ($9/mo). Add PostHog when you have 1K+ users and want session replay.

---

## What to Track (Priority Order)

### Month 1: Validation
✅ Daily signups
✅ Prompts copied per user
✅ Most popular prompts
✅ Mobile vs desktop usage

### Month 2: Monetization
✅ Free limit hit rate
✅ Upgrade button clicks
✅ Conversion rate
✅ Time to first payment

### Month 3: Growth
✅ Traffic sources (which FB groups work?)
✅ Referral tracking
✅ Viral coefficient
✅ MRR growth

---

**Let's track everything! 📊**
