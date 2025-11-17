# Analytics Dashboard Guide

## Plausible Analytics Setup

### Current Configuration
- **Domain:** ai-prompt-vault-two.vercel.app
- **Script Location:** public/index.html (line ~15)
- **Custom Events:** Yes (5 tracked events)

### Accessing Your Dashboard
1. Go to https://plausible.io/ai-prompt-vault-two.vercel.app
2. Login with your Plausible account
3. View real-time and historical data

---

## Custom Events Being Tracked

### 1. PromptCrafter_Started
**When:** User selects a use case
**Properties:**
- `useCase` - Which use case they selected
- `timestamp` - When they started

**Example:**
```javascript
analytics.track('PromptCrafter_Started', {
  useCase: 'social_media_posts',
  timestamp: 1763406000000
});
```

**What to Monitor:**
- Most popular use cases
- Entry points for user journey
- Daily/weekly starts

---

### 2. PromptCrafter_Completed
**When:** AI generation completes successfully
**Properties:**
- `useCase` - Which use case they completed
- `duration` - Time from start to completion (ms)
- `defaultsChanged` - How many defaults they customized
- `timestamp` - When completed

**Example:**
```javascript
analytics.track('PromptCrafter_Completed', {
  useCase: 'social_media_posts',
  duration: 45000, // 45 seconds
  defaultsChanged: 2,
  timestamp: 1763406045000
});
```

**What to Monitor:**
- Completion rate per use case
- Average time to complete
- How often users customize vs use defaults
- Drop-off points

---

### 3. AI_Generated
**When:** AI generation API call completes
**Properties:**
- `useCase` - Which use case was generated
- `success` - true/false
- `error` - Error message (if failed)

**Example Success:**
```javascript
analytics.track('AI_Generated', {
  useCase: 'email_campaigns',
  success: true
});
```

**Example Failure:**
```javascript
analytics.track('AI_Generated', {
  useCase: 'cold_calling_scripts',
  success: false,
  error: 'API timeout'
});
```

**What to Monitor:**
- AI generation success rate
- Error patterns
- Which use cases have highest success rate

---

### 4. Prompt_Copied
**When:** User clicks "Copy Result" button
**Properties:**
- `useCase` - Which use case output was copied

**Example:**
```javascript
analytics.track('Prompt_Copied', {
  useCase: 'listing_descriptions'
});
```

**What to Monitor:**
- Copy rate (indicates satisfaction)
- Which outputs users find most valuable
- Copy vs "Create Another" ratio

---

### 5. History_Viewed
**When:** User clicks "Prompt History" button
**Properties:**
- `historyCount` - How many items in history

**Example:**
```javascript
analytics.track('History_Viewed', {
  historyCount: 5
});
```

**What to Monitor:**
- How often users revisit history
- Power users with high history counts
- History feature usage rate

---

## Key Metrics to Track

### Conversion Funnel
1. **Visitors** → Total page views
2. **Started** → PromptCrafter_Started events
3. **Completed** → PromptCrafter_Completed events
4. **Copied** → Prompt_Copied events

**Target Conversion Rates:**
- Visitor → Started: 60%+
- Started → Completed: 80%+
- Completed → Copied: 90%+

---

### Use Case Popularity

**Top Use Cases to Monitor:**
1. Social Media Posts
2. Email Campaigns
3. Listing Descriptions
4. Client Check-ins
5. Follow-up Messages

**Questions to Answer:**
- Which use cases drive the most completions?
- Which have highest drop-off rates?
- Which take longest to complete?

---

### User Behavior Patterns

**Smart Defaults Usage:**
- What % of users customize defaults?
- Average defaults changed per session
- Which questions get customized most?

**Session Patterns:**
- Average prompts per session
- Time between prompts
- Repeat user rate (via localStorage history)

**Device Split:**
- Mobile vs Desktop usage
- Completion rates by device
- Time to complete by device

---

## Plausible Dashboard Views

### 1. Overview Dashboard
Shows at a glance:
- Total visitors
- Unique visitors
- Pageviews
- Bounce rate
- Visit duration

### 2. Custom Events Dashboard
Filter by event name:
- PromptCrafter_Started
- PromptCrafter_Completed
- AI_Generated
- Prompt_Copied
- History_Viewed

**Click event → See all properties**

### 3. Custom Reports
Create reports for:
- Use case performance comparison
- Completion funnel by use case
- Error rate over time
- Mobile vs Desktop performance

---

## Sample Analytics Queries

### Most Popular Use Cases (Last 30 Days)
1. Go to Custom Events
2. Filter: PromptCrafter_Started
3. Group by: useCase property
4. Sort by: Count descending

### Average Completion Time
1. Filter: PromptCrafter_Completed
2. View: duration property
3. Calculate: Average (manual or export to CSV)

### Success Rate by Use Case
1. Filter: AI_Generated
2. Group by: useCase + success
3. Calculate: (success true / total) * 100

### Daily Active Users Trend
1. Go to Visitors
2. Set date range: Last 90 days
3. View graph for daily pattern

---

## Alerts to Set Up

### Critical Issues
- **Error Rate > 5%** - AI_Generated with success: false
- **Completion Rate < 50%** - Started vs Completed ratio
- **Zero Activity** - No events for 24 hours

### Performance Issues
- **Slow Completions** - Average duration > 2 minutes
- **High Bounce Rate** - > 70% bounce rate
- **Low Copy Rate** - < 60% of completions result in copy

---

## Weekly Analytics Review Checklist

- [ ] Check total visitors (week over week growth)
- [ ] Review top 5 use cases
- [ ] Check AI generation error rate
- [ ] Review completion funnel
- [ ] Monitor mobile vs desktop split
- [ ] Check average time to complete
- [ ] Review custom event trends
- [ ] Identify drop-off points

---

## Monthly Analytics Goals

**Month 1 (Current):**
- 100+ unique visitors
- 70%+ start rate
- 75%+ completion rate
- 85%+ copy rate
- < 2% error rate

**Month 3:**
- 500+ unique visitors
- 75%+ start rate
- 80%+ completion rate
- 90%+ copy rate
- < 1% error rate

**Month 6:**
- 2,000+ unique visitors
- 80%+ start rate
- 85%+ completion rate
- 90%+ copy rate
- < 0.5% error rate

---

## Pro Tips

### 1. Track User Segments
Use Plausible's UTM parameters:
- `?utm_source=email` - Email campaigns
- `?utm_source=social` - Social media
- `?utm_source=organic` - SEO traffic

### 2. A/B Testing
Test variations:
- Different use case ordering
- Button copy changes
- Default values
- Question flow

Track results via custom events.

### 3. Cohort Analysis
Group users by:
- First use case chosen
- Device type
- Time of day
- Day of week

Find patterns in power users.

### 4. Export Data
Download CSV for deeper analysis:
- Excel pivot tables
- Google Sheets charts
- Custom SQL queries (if using Plausible's data export)

---

## Current Status

✅ **Analytics Implemented:**
- 5 custom events tracked
- Properties capture key metrics
- Session storage for duration tracking
- localStorage for history count

📊 **Data Being Collected:**
- Use case preferences
- Completion rates
- Time to complete
- Customization patterns
- Error rates
- Copy behavior

🎯 **Next Steps:**
1. Access Plausible dashboard
2. Verify events are firing
3. Set up weekly review schedule
4. Create custom reports
5. Set up alerts
