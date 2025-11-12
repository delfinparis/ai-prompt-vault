# 🤖 Prompt Generation Engine - Build More Content

## Strategy: Multi-Source Content Generation

### Approach 1: AI-Powered Prompt Generator (RECOMMENDED)

Use ChatGPT/Claude to generate batches of prompts based on real estate workflows.

#### Quick Script:
```javascript
// scripts/generate-prompts.js
const prompts = [
  {
    category: "Listing Marketing",
    workflows: [
      "Open house follow-up emails",
      "Virtual tour scripts",
      "Neighborhood highlight posts",
      "Price reduction announcements",
      "Just listed social posts"
    ]
  },
  {
    category: "Buyer Communication",
    workflows: [
      "Home showing confirmations",
      "Offer acceptance letters",
      "Inspection contingency explanations",
      "Closing timeline emails",
      "Post-closing thank you notes"
    ]
  },
  {
    category: "Lead Generation",
    workflows: [
      "Facebook ad copy variations",
      "Landing page headlines",
      "Email newsletter topics",
      "Video script outlines",
      "Instagram carousel ideas"
    ]
  }
];

// Use this prompt with ChatGPT:
const generatorPrompt = `
You are an expert real estate AI prompt engineer.

Create 5 detailed ChatGPT prompts for: "${workflow}"

Format each as:
{
  "title": "Short title (5-7 words)",
  "role": "You are a [specific role]",
  "quick": "One sentence description",
  "deliverable": "What output this creates",
  "inputs": ["field1", "field2", "field3"],
  "constraints": ["Keep it under 500 words", "Use conversational tone"],
  "tools": ["ChatGPT", "Claude"],
  "format": "Email/Social post/Script/etc",
  "audience": "Who this is for"
}

Make them SPECIFIC to real estate agents' daily tasks.
Focus on saving time, not generic advice.
`;
```

---

## Approach 2: Scrape Real Estate Pain Points

### Sources to Mine:
1. **Reddit**: r/realtors, r/RealEstate
2. **Facebook Groups**: Real estate agent communities
3. **YouTube Comments**: RE coaching channels
4. **Forums**: ActiveRain, BiggerPockets

### What to Look For:
- "I hate writing..."
- "Does anyone have a template for..."
- "How do you handle..."
- "What do you say when..."

### Script:
```python
# scripts/scrape_reddit.py
import praw

reddit = praw.Reddit(
    client_id="YOUR_ID",
    client_secret="YOUR_SECRET",
    user_agent="prompt-finder"
)

subreddit = reddit.subreddit("realtors")
keywords = ["template", "write", "email", "social media", "script"]

pain_points = []
for submission in subreddit.hot(limit=100):
    if any(kw in submission.title.lower() for kw in keywords):
        pain_points.append({
            "title": submission.title,
            "upvotes": submission.score,
            "comments": submission.num_comments,
            "url": submission.url
        })

# Output: Top 50 pain points → Turn into prompts
```

---

## Approach 3: Interview Real Agents (BEST FOR QUALITY)

### Quick User Research:
1. Find 10 agents (FB groups, LinkedIn)
2. Offer $20 Amazon gift card for 15-min call
3. Ask:
   - "What do you spend the most time writing?"
   - "What emails do you dread sending?"
   - "What social posts take forever?"
   - "What client questions repeat constantly?"

### Turn Answers Into Prompts:
```
Agent says: "I hate writing CMAs for buyers who ghost me"

→ Prompt: "Buyer CMA Follow-Up Email (Re-engagement)"
   Role: Real estate agent following up on a CMA
   Deliverable: Professional but casual re-engagement email
   Inputs: [buyer_name, property_address, days_since_cma]
```

---

## Approach 4: Analyze Competitor Tools

### Tools to Study:
- **Jasper AI**: Real estate templates
- **Copy.ai**: Real estate category
- **ChatGPT Prompt Marketplace**: RE-specific prompts
- **PromptBase**: Paid real estate prompts

### What to Extract:
- Categories they cover
- Most popular templates
- Input fields they use
- Output formats

### Differentiation:
- Make yours MORE specific
- Add local market fields
- Include follow-up suggestions
- Better mobile UX

---

## Approach 5: Google Trends + Search Data

### Find What Agents Search:
```
Google Trends → "real estate" + "template"
Related queries:
- "open house sign in sheet template"
- "real estate bio examples"
- "listing description generator"
- "buyer consultation script"
```

### Turn Searches Into Prompts:
```
Search: "real estate bio examples"
→ Prompt: "Professional Agent Bio Generator"
   Inputs: [years_experience, specialties, personal_story, awards]
   Output: 3 versions (formal, casual, social media)
```

---

## 🚀 RECOMMENDED: Hybrid Approach

### Week 1: Quick Wins (AI Generation)
1. Use ChatGPT with the generator prompt above
2. Create 50 prompts across 10 categories
3. Add to `src/prompts.ts`
4. Deploy and get feedback

### Week 2: User Research
1. Post in 5 FB groups: "What emails take you forever?"
2. Analyze 100 responses
3. Create 20 high-demand prompts
4. Interview 5 agents ($100 total)

### Week 3: Competitive Analysis
1. Study Jasper/Copy.ai templates
2. Find gaps (they don't cover X)
3. Build 15 unique prompts
4. Test with beta users

### Week 4: Ongoing Engine
1. Add "Request a Prompt" button to app
2. Users submit: "I need help with X"
3. You create prompt within 24 hours
4. Add to library → Everyone benefits

---

## 📊 Prompt Quality Checklist

Every prompt must have:
- ✅ Specific use case (not "write email" → "write open house follow-up email")
- ✅ Real estate context (not generic marketing)
- ✅ Clear inputs (3-5 fields max)
- ✅ Expected output (email, post, script, etc.)
- ✅ Time-saving (should take <2 min to use)

---

## 🤖 AI Prompt Generator (Copy & Paste)

Use this in ChatGPT to generate batches:

```
You are a real estate AI prompt engineer. Generate 10 prompts for real estate agents.

CATEGORY: [Choose: Listings, Buyer Communication, Lead Gen, Social Media, Client Management]

For each prompt, create:
{
  "title": "Specific 5-7 word title",
  "role": "You are a [specific expert role]",
  "quick": "One sentence: what this does",
  "deliverable": "Exact output type (email, post, script)",
  "inputs": ["field1", "field2", "field3"],
  "constraints": ["Constraint 1", "Constraint 2"],
  "tools": ["ChatGPT", "Claude"],
  "format": "Email/Social/Document",
  "audience": "Target audience"
}

REQUIREMENTS:
1. Focus on daily tasks agents HATE doing
2. Be hyper-specific (not generic)
3. Include local market context when relevant
4. Output should take <5 min to generate
5. Must save agent 30+ minutes

Example good prompt:
"Price Reduction Announcement Email (Client Retention)"

Example bad prompt:
"Write an email" ❌ Too generic
```

---

## 📈 Growth Loop

```
Add "Request a Prompt" → User submits need → You create it → Add to library
    ↓
  More prompts → More value → More users → More requests → More prompts
    ↓
  Viral growth (agents share specific prompts they love)
```

---

## 🎯 Next Actions (Pick One):

### Option A: Fast (AI Batch Generation)
```bash
# 1. Open ChatGPT
# 2. Paste generator prompt above
# 3. Generate 50 prompts in 30 minutes
# 4. Add to prompts.ts
# 5. Deploy
```

### Option B: Quality (User Research)
```bash
# 1. Post in 5 FB groups today
# 2. Ask: "What emails/posts take you forever?"
# 3. Collect 50 responses
# 4. Turn top 10 into prompts
# 5. Interview 3 agents ($60 total)
```

### Option C: Automated (Scraping)
```bash
# 1. Set up Reddit scraper
# 2. Find top 100 pain points
# 3. Cluster by category
# 4. Generate prompts for top 20
# 5. Validate with 5 agents
```

---

## 💡 Pro Tip: The "Shadow" Method

Follow 10 real estate agents for 1 week:
- Watch their Instagram stories
- Read their email newsletters
- Join their Facebook groups
- Note: What do they post most? That's what takes time.

Turn their repetitive content into prompts.

---

**Which approach do you want to start with?**
