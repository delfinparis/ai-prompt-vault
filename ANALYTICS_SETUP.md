# Analytics Setup Guide

Quick guide to enable event tracking for the AI Prompt Vault wizard and library.

---

## Option 1: Plausible Analytics (Recommended)

**Best for:** Privacy-first tracking, GDPR compliant, simple setup, no cookies

### Setup (5 minutes)

1. **Create account:** https://plausible.io
2. **Add site:** `app.ai-prompt-vault.vercel.app`
3. **Uncomment script** in `public/index.html`:

```html
<!-- Change this line: -->
<!-- <script defer data-domain="app.ai-prompt-vault.vercel.app" src="https://plausible.io/js/script.js"></script> -->

<!-- To: -->
<script defer data-domain="app.ai-prompt-vault.vercel.app" src="https://plausible.io/js/script.js"></script>
```

4. **Deploy** and events auto-send via `trackEvent()` helper

### Create Funnels

In Plausible dashboard:

1. Go to **Goals** → **+ Add Goal**
2. Add these custom events:
   - `rpv:wizard_start`
   - `rpv:wizard_challenge_selected`
   - `rpv:wizard_drilldown_complete`
   - `rpv:prompt_copy`
   - `rpv:cta_gpt_click`

3. Create funnel:
   - Name: "Wizard Conversion"
   - Steps: wizard_start → challenge_selected → drilldown_complete → prompt_copy → cta_gpt_click

### View A/B Test Results

1. Go to **Custom Properties**
2. Filter `rpv:cta_gpt_click` by property `variant`
3. Compare click-through rates for A, B, C

**Cost:** $9/month (10k pageviews), $19/month (100k pageviews)

---

## Option 2: PostHog (Advanced)

**Best for:** Session replay, heatmaps, advanced funnels, feature flags

### Setup (10 minutes)

1. **Create account:** https://posthog.com
2. **Copy snippet** from PostHog dashboard
3. **Add to** `public/index.html` before `</head>`:

```html
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  posthog.init('YOUR_PROJECT_API_KEY',{api_host:'https://app.posthog.com'})
</script>
```

4. **Replace** `YOUR_PROJECT_API_KEY` with actual key
5. **Deploy** and events auto-send via `trackEvent()` helper

### Features
- Session recording (watch user flows)
- Heatmaps (see where users click)
- Feature flags (for A/B tests)
- Cohort analysis (segment by persona)

**Cost:** Free for 1M events/month, then $0.00045/event

---

## Option 3: Custom Endpoint (Privacy-First)

**Best for:** Full control, no external dependencies, GDPR compliant by design

### What's Included

Pre-built serverless function at `/api/analytics.ts`:
- ✅ Rate limiting (100 events/IP/minute)
- ✅ Event validation (must start with `rpv:`)
- ✅ CORS headers
- ✅ In-memory store (last 1000 events)
- ✅ No PII collection
- ✅ Optional forwarding to your database

### Enable (5 minutes)

**Already wired!** Events from `trackEvent()` automatically call this endpoint.

To view events in production:

```javascript
// In browser console:
window.addEventListener('rpv_event', (e) => {
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: e.detail.name,
      properties: e.detail,
      timestamp: Date.now()
    })
  });
});
```

### Connect to Database (Optional)

Edit `api/analytics.ts` and uncomment `forwardToService()`:

```typescript
// Example: PostgreSQL
async function forwardToService(event: any) {
  await db.query(
    'INSERT INTO analytics_events (event, properties, timestamp) VALUES ($1, $2, $3)',
    [event.event, JSON.stringify(event.properties), new Date(event.timestamp)]
  );
}
```

**Supported databases:**
- Vercel Postgres
- Supabase
- PlanetScale
- MongoDB Atlas
- Any PostgreSQL/MySQL database

---

## Option 4: Google Analytics 4 (Not Recommended)

**Why not:** Cookie consent required, complex setup, privacy concerns, slower

If you must use GA4:

1. Create GA4 property
2. Add gtag.js to `public/index.html`
3. Map `rpv:*` events to GA4 custom events
4. Implement cookie consent banner (GDPR requirement)

---

## Testing Analytics

### Development (Local)

All events log to console automatically:

```bash
npm start
# Open browser DevTools → Console
# Look for [Analytics] logs
```

### Production (Vercel)

1. **Deploy** to Vercel
2. **Open** app in browser
3. **Check** your analytics dashboard (Plausible/PostHog)
4. **Verify** events appear within 60 seconds

**Quick test sequence:**
1. Visit homepage (fires `rpv:view_home`)
2. Click "Start Wizard" (fires `rpv:wizard_start`)
3. Select challenge (fires `rpv:wizard_challenge_selected`)
4. Complete form (fires `rpv:wizard_drilldown_complete`)
5. Click CTA (fires `rpv:prompt_copy` and `rpv:cta_gpt_click`)

---

## Event Reference

See `ANALYTICS_EVENTS.md` for complete event schema and tracking strategy.

**Core wizard events:**
- rpv:view_home
- rpv:wizard_start
- rpv:wizard_challenge_selected
- rpv:wizard_drilldown_complete
- rpv:prompt_copy
- rpv:cta_gpt_click
- rpv:followup_prompt_click
- rpv:return_visit

---

## Privacy & Compliance

All analytics options are designed to be GDPR compliant:

✅ **No PII collected** (no names, emails, addresses)  
✅ **No cross-site tracking** (first-party only)  
✅ **No fingerprinting** (no device IDs)  
✅ **User controls** (localStorage can be cleared)  
✅ **Transparent** (events logged in dev console)

**Plausible & Custom endpoint:** No cookies, no consent needed  
**PostHog:** Optional cookies for session replay (get consent first)

---

## Recommended Setup for Launch

**Week 1:** Custom endpoint (no external dependencies)  
**Week 2–4:** Add Plausible for dashboard view  
**Month 2+:** Upgrade to PostHog if you need session replay

**Total setup time:** 5 minutes (uncomment Plausible script)  
**Total cost:** $9/month (Plausible 10k pageviews)

---

## Next Steps

1. Choose Option 1 (Plausible) or Option 3 (Custom)
2. Uncomment script in `public/index.html`
3. Deploy to Vercel
4. Test wizard flow
5. Set up funnel dashboard
6. Run A/B test for 2 weeks

**Questions?** See `ANALYTICS_EVENTS.md` for detailed event schemas and queries.

---

*Last updated: November 2025*
