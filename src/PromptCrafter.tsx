import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type UseCase = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: 'content' | 'sales' | 'service';
  exampleOutput?: string; // NEW: Show users what they'll get
};

type PromptState = {
  step: number;
  selectedUseCase: string | null;
  // Dynamic answers based on use case
  answers: Record<string, string>;
  generatedPrompt: string;
};

type PromptHistory = {
  id: string;
  timestamp: number;
  useCaseId: string;
  useCaseName: string;
  prompt: string;
  answers: Record<string, string>;
  aiOutput?: string; // NEW: Save AI-generated output
  userRating?: 'good' | 'bad'; // NEW: Track quality
};

type QuestionOption = {
  value: string;
  label: string;
  emoji: string;
};

type Question = {
  id: string;
  type: 'text' | 'textarea' | 'select';
  question: string;
  subtitle?: string;
  placeholder?: string;
  options?: QuestionOption[];
};

// ═══════════════════════════════════════════════════════════════════════════════
// 12 USE CASES
// ═══════════════════════════════════════════════════════════════════════════════

const USE_CASES: UseCase[] = [
  // CONTENT CREATION
  {
    id: 'social-content',
    name: 'Social Media Posts',
    emoji: '📱',
    description: 'Instagram, Facebook, LinkedIn',
    category: 'content',
    exampleOutput: `🏡 JUST LISTED in Boulder Heights!\n\nYour dream mountain retreat awaits. 4 bed, 3.5 bath contemporary masterpiece with:\n✨ Floor-to-ceiling windows framing Flatirons views\n✨ Chef's kitchen with Wolf & Sub-Zero appliances  \n✨ Primary suite sanctuary with spa bath\n✨ Smart home tech throughout\n\n$2.45M | 3,200 sq ft | Built 2019\n\nOpen house this Saturday 1-4pm. Link in bio for full details!\n\n#BoulderRealEstate #LuxuryHomes #MountainLiving #JustListed`
  },
  {
    id: 'video-script',
    name: 'Video Scripts',
    emoji: '🎥',
    description: 'Reels, TikTok, YouTube',
    category: 'content',
    exampleOutput: `[HOOK - First 3 seconds]\n"You're overpaying for your home. Here's how to know."\n\n[Scene 1 - Problem]\n"Most buyers in Austin right now are paying 10-15% over asking. But here's what they don't tell you..."\n\n[Scene 2 - Value]\n"I just saved my client $47,000 by knowing these 3 things the listing agent DIDN'T want us to see:"\n\n1. Days on market (subtle pricing weakness)\n2. Seller motivation (divorce, job relocation)  \n3. Comparable sales in the last 30 days\n\n[Scene 3 - CTA]\n"Want my free buyer negotiation checklist? Link in bio. Let's get you the best deal possible."\n\n[End card: "Follow for more buyer tips"]`
  },
  {
    id: 'listing-description',
    name: 'Listing Descriptions',
    emoji: '🏡',
    description: 'MLS copy that sells',
    category: 'content',
    exampleOutput: `**Luxury Mountain Retreat with Panoramic Views**\n\nDiscover your private sanctuary in Boulder's most sought-after neighborhood. This stunning 4-bedroom, 3.5-bath contemporary masterpiece showcases floor-to-ceiling windows that frame breathtaking Rocky Mountain vistas from every angle.\n\n**Interior Highlights:**\n• Gourmet chef's kitchen with Wolf gas range, Sub-Zero refrigeration, and Carrara marble waterfall island\n• Expansive great room with 18-foot ceilings and custom steel fireplace\n• Primary suite sanctuary featuring spa-inspired ensuite with soaking tub and steam shower\n• Home office with built-in shelving and mountain views\n• Mudroom with custom storage for all your outdoor gear\n\n**Smart Home Features:**\n• Lutron lighting system throughout\n• Nest climate control with zoned heating\n• Integrated audio system  \n• Security cameras and smart locks\n\n**Outdoor Living:**\n• Professionally landscaped .5-acre lot with native plants\n• Covered deck perfect for year-round entertaining\n• Hot tub overlooking the Flatirons\n• 2-car attached garage + workshop space\n\n**The Neighborhood:**\nWalk to Boulder Creek Trail. 10 minutes to Pearl Street. Top-rated schools. This is Colorado living at its finest.\n\n$2,450,000 | 3,200 sq ft | Built 2019 | 0.5 acres`
  },
  {
    id: 'email-sequence',
    name: 'Email Campaigns',
    emoji: '📧',
    description: 'Nurture sequences',
    category: 'content',
    exampleOutput: `Subject: Your Austin home's value just changed (here's why)\n\n---\n\nHi Jennifer,\n\nI hope your new year is off to a great start!\n\nI wanted to reach out because something shifted in our Austin market over the holidays that directly impacts your neighborhood.\n\n**What changed:**\nThree homes on your street (Riverside Dr) just sold in the last 45 days — all above asking price, with an average sale price of $487K. That's 12% higher than this time last year.\n\n**What this means for you:**\nIf you've been thinking about selling in the next 6-12 months, spring 2024 might be your window. Here's why:\n\n• Inventory is still historically low (only 2.1 months of supply)\n• Mortgage rates stabilized around 6.8% (buyers are adjusting)\n• Your neighborhood specifically is seeing bidding wars again\n\n**No pressure, just information:**\nI'm not suggesting you sell — I just thought you'd want to know what your home could realistically get in today's market.\n\nIf you're curious, I can send you a quick (no-obligation) market analysis showing:\n✓ What your home would likely sell for today  \n✓ How that compares to last year\n✓ What buyers are looking for right now\n\nJust reply "yes" and I'll put it together for you this week.\n\nEither way, Happy New Year!\n\n[Your Name]\nAustin Residential Group\n512-555-0199`
  },

  // SALES & PROSPECTING
  {
    id: 'sphere-script',
    name: 'Call Scripts',
    emoji: '📞',
    description: 'Sphere & lead calls',
    category: 'sales',
    exampleOutput: `**Sphere Call Script: Quarterly Check-In**\n\n[Opening]\n"Hey Sarah! It's Mike from Austin Residential. How have you been?"\n\n[Wait for response, be genuinely interested]\n\n"I'm glad to hear that! Listen, I won't keep you long — I'm doing my quarterly check-ins with my favorite past clients, and I wanted to touch base for two quick reasons..."\n\n[Value Point 1]\n"First, your neighborhood (Riverside) has been absolutely on fire lately. Three homes sold in the last month, all above asking. I wanted you to know what your home would be worth in today's market — no strings attached, just good information to have."\n\n[Pause for response]\n\n[Value Point 2] \n"And second — this is the big one — I'm building my business 100% on referrals this year. So if you know anyone thinking about buying or selling, even if it's just a 'maybe someday' situation, I'd love a quick intro. I'll take great care of them, I promise."\n\n[The Ask]\n"Who comes to mind? Anyone at work, church, the gym?"\n\n[Wait — let them think]\n\n[If Yes]\n"Perfect! Can you text me their name and number? I'll reach out today and mention you sent me."\n\n[If No]\n"No worries at all! Just keep me in mind. And hey — if anything changes with your home situation, or you need any real estate advice, you know I'm just a phone call away."\n\n[Close]\n"Thanks for your time, Sarah. Let's grab coffee soon — I'd love to catch up properly!"\n\n---\n\n**Key Principles:**\n✓ Lead with value (market update)\n✓ Make it about them, not you  \n✓ Ask directly for referrals\n✓ Give them thinking time (pause after asking)\n✓ End warm and personal`
  },
  {
    id: 'consultation-script',
    name: 'Consultations',
    emoji: '💼',
    description: 'Buyer/seller meetings',
    category: 'sales',
    exampleOutput: `**Seller Consultation Script**\n\n[Introduction - 5 mins]\n"Thanks for having me to your beautiful home. Before we dive into pricing and strategy, I'd love to understand your situation a bit better. Can you tell me..."\n\n1. What's prompting the move?  \n2. What's your ideal timeline?\n3. Where are you headed next?\n4. Have you spoken with other agents? What did you like/not like?\n\n[Pause and listen — take notes]\n\n[Market Analysis - 10 mins]\n"Let me show you what's happening in your neighborhood right now..."\n\n• Pull up comps on tablet\n• Show 3 sold, 2 active, 1 pending\n• Explain DOM (days on market)\n• Point out pricing trends\n\n"Based on these numbers and what I see here today, I believe your home would sell between $X and $Y, with the sweet spot right around $Z."\n\n[Marketing Strategy - 10 mins] \n"Here's how I'd position your home to get top dollar..."\n\n✓ Professional photography & drone shots\n✓ 3D virtual tour (Matterport)\n✓ Targeted Facebook/Instagram ads ($500 budget)\n✓ Email blast to 2,000+ agents in my network\n✓ Luxury print materials\n✓ Open house strategy (broker preview + public)\n\n[Show portfolio of past listings on tablet]\n\n[Objection Handling - 5 mins]\nAddress the elephant in the room:\n\n"I know commission is a big part of your decision. Let me be transparent about what you're getting for that investment..."\n\n• Break down where commission goes\n• Explain buyer agent motivation  \n• Show net proceeds estimate\n• Prove ROI with past sale examples\n\n[Close - 5 mins]\n"Here's what happens next if you decide to work with me..."\n\n1. Sign listing agreement today\n2. Photography scheduled within 48 hours\n3. Live on MLS by [date]\n4. First showing within 72 hours (statistically)\n5. Offer(s) within 7-10 days (based on current market)\n\n"How does that sound? Any questions I haven't answered?"\n\n[Trial Close]\n"Are you comfortable moving forward with me as your agent?"\n\n---\n\n**Bring to Appointment:**\n□ Market analysis (printed)\n□ Net proceeds estimate\n□ Marketing portfolio (tablet)\n□ Testimonials from past clients\n□ Listing agreement (pre-filled)\n□ Business card & branded folder`
  },
  {
    id: 'objection-handling',
    name: 'Handle Objections',
    emoji: '🛡️',
    description: 'Price, commission, timing',
    category: 'sales',
    exampleOutput: `**Top 5 Objection Handlers**\n\n---\n\n**1. "Your commission is too high"**\n\n❌ Don't say: "That's the industry standard"\n✅ Do say:\n\n"I totally understand — commission is a significant investment. Let me show you exactly what you're getting for that..."\n\n[Pull out phone/tablet]\n\n"Last year, my average listing sold for 4.2% more than asking price. That's because of..."\n• Professional staging consultation ($500 value)\n• 3D virtual tour that gets 40% more showings\n• $500 ad spend to reach 10,000+ targeted buyers\n• Aggressive negotiation (show example: saved client $12K on repairs)\n\n"Here's a net proceeds comparison: if you hire a discount broker at 4% and sell for asking, vs. working with me at 6% and selling 4% above asking..."\n\n[Show math: Your net is $8,400 higher with me]\n\n"Does that make sense?"\n\n---\n\n**2. "We want to wait until spring"**\n\n❌ Don't say: "You'll miss the market"\n✅ Do say:\n\n"That's actually what most sellers think — and I get it. Spring feels like the 'right' time. But let me share what the data shows..."\n\n"Right now (January), you have..."\n• 2.1 months of inventory (seller's market)\n• 43% fewer competing listings than April\n• Buyers who NEED to move (relocations, job starts)\n• Less competition for showings\n\n"By spring, you'll have..."\n• 4.5 months of inventory (balanced market)\n• 200+ more listings in your price range\n• Buyers who are just 'looking' (tire kickers)\n• Showings split across dozens of homes\n\n"Translation: You'll likely sell faster and for MORE money if we list now. Would you be open to testing the market this month?"\n\n---\n\n**3. "We're interviewing other agents"**\n\n❌ Don't say: "I'm the best"\n✅ Do say:\n\n"You absolutely should! This is one of the biggest financial decisions you'll make. Here's what I'd suggest asking them..."\n\n1. How many homes in our neighborhood have you sold?\n2. What's your average sale-to-list price ratio?\n3. What's your average days on market?\n4. Can I speak to 3 past clients?\n5. What's your marketing budget for our home specifically?\n\n"And then compare the answers. I'm confident in my numbers, and I think you'll see the difference. Fair enough?"\n\n[Confidence + give them permission]\n\n---\n\n**4. "The price is too low"**\n\n❌ Don't say: "The market sets the price"\n✅ Do say:\n\n"I hear you — and I want to get you every dollar your home is worth. Let me show you why I landed on this number..."\n\n[Pull up comps]\n\n"These three homes are the most similar to yours:"\n• 123 Oak: 3/2, 1,800 sf, sold for $485K (24 days)\n• 456 Elm: 3/2, 1,750 sf, sold for $492K (18 days)  \n• 789 Pine: 3/2, 1,850 sf, sold for $478K (31 days)\n\n"Yours is 1,820 sf, so we're right in the sweet spot at $489K. Here's what happens if we price higher..."\n\n• Above $500K: We eliminate 40% of qualified buyers\n• Longer DOM (days on market) = perception of a problem\n• Price reductions hurt negotiating power\n\n"Here's what I propose: We list at $489K with a 7-day review period. If we get multiple offers, we'll likely go above asking. If we don't get traction, we can adjust. How does that sound?"\n\n---\n\n**5. "Can you do a lower commission?"**\n\n❌ Don't say: "No"\n✅ Do say:\n\n"I appreciate you asking — and I want to be transparent with you..."\n\n"My commission directly funds the marketing that gets you top dollar. If I reduce it, here's what we'd need to cut:"\n\n• Professional photography ($400)\n• 3D virtual tour ($300)\n• Facebook/Instagram ads ($500)\n• Staging consultation ($350)\n• Print materials ($200)\n\n"We could absolutely do that and save you 1% — but statistically, you'd net LESS money because we'd attract fewer buyers and likely sell below asking."\n\n"What if I showed you a pricing strategy that gets you more money than you'd save on commission? Would that work?"\n\n[Shift focus to net proceeds, not commission]`
  },
  {
    id: 'expired-fsbo',
    name: 'Expired/FSBO',
    emoji: '✉️',
    description: 'Win difficult listings',
    category: 'sales',
    exampleOutput: `**Expired Listing Call Script**\n\n[Opening - first 10 seconds matter]\n"Hi, this is Mike Johnson with Austin Residential. I noticed your home at 123 Oak Street just came off the market. I'm guessing you're pretty frustrated right now — am I right?"\n\n[Wait for response — validate frustration]\n\n"I get it. You invested time, money, and emotion into this, and it didn't work out. Here's why I'm calling..."\n\n[Value Proposition]\n"I specialize in selling homes that didn't sell the first time. Last year, I listed 9 expired properties, and 8 of them sold within 30 days — most above the original asking price."\n\n[Pattern Interrupt]\n"Can I ask you a blunt question? What do you think went wrong?"\n\n[Listen — they'll tell you exactly what to fix]\n\n[Common Issues + Your Solution]\n\nIf they say: **"We didn't get enough showings"**\n→ "That tells me it's a marketing problem, not a pricing problem. Let me show you how I get 3X more eyes on listings..."\n\nIf they say: **"We got lowball offers"**\n→ "That usually means the listing agent didn't attract the right buyers. I target qualified buyers specifically looking in your price range..."\n\nIf they say: **"Our agent didn't communicate"**\n→ "That's the #1 complaint I hear. I send weekly updates every Friday — here's what it looks like..." [show example]\n\n[Transition to Appointment]\n"Look, I don't want to take up your time on the phone. What I'd love to do is come by, show you exactly what I'd do differently, and if it makes sense, great. If not, no hard feelings."\n\n"Are you free tomorrow at 4pm or does Thursday at 10am work better?"\n\n[Assume the meeting]\n\n---\n\n**FSBO Door Knock Script**\n\n[Knock on door with printed market analysis]\n\n"Hi! I'm Mike Johnson — I'm a realtor here in the neighborhood. I saw your 'For Sale' sign and wanted to introduce myself. Do you have 2 minutes?"\n\n[If yes]\n\n"I'm not here to sell you anything — I actually brought you something. I ran a market analysis on your home, and I wanted you to have the data on what's selling in your neighborhood right now."\n\n[Hand them the report]\n\n"Three homes on your street sold in the last 60 days — all within 18 days of listing, all with multiple offers. I'm guessing you haven't had that experience yet?"\n\n[They'll usually say "no" or explain challenges]\n\n[The Insight]\n"Here's what's happening: 87% of buyers start their search online, and only 3% are looking at FSBO sites. So you're missing 97% of the market. That's not a criticism — it's just the math."\n\n[The Offer]\n"What if I could get your home in front of all those buyers AND save you time on showings, negotiations, and paperwork? Would you be open to a quick conversation about what that looks like?"\n\n[Trial Close]\n"Can I call you tomorrow to set up a time to walk through a no-pressure game plan?"\n\n---\n\n**Email Follow-Up (Expired Listings)**\n\nSubject: Why 123 Oak didn't sell (+ how to fix it)\n\nHi [Name],\n\nI noticed your listing at 123 Oak Street recently expired. I'm sorry — I know how disappointing that must be after months of showings and waiting.\n\nI specialize in helping sellers get it right the second time. Last year, I re-listed 9 expired homes in [City], and 8 sold within 30 days (most above their original asking price).\n\nHere's what usually goes wrong:\n\n❌ Pricing: Overpriced by 5-10% to "test the market"\n❌ Photos: Dark, blurry, or missing key selling points  \n❌ Marketing: Only on MLS (missing 60% of buyers)\n❌ Agent: Poor communication, no follow-up\n\nI'd love to show you exactly what I'd do differently — no obligation, just a 20-minute conversation.\n\nAre you free for a quick call this week?\n\n[Your Name]\n[Phone]\n\nP.S. I've attached a fresh market analysis showing what similar homes are selling for right now. You might be surprised.`
  },

  // CLIENT SERVICE
  {
    id: 'open-house-followup',
    name: 'Open House Follow-Up',
    emoji: '🚪',
    description: 'Text/email after visits',
    category: 'service',
    exampleOutput: `**Text Message (send within 2 hours):**\n\nHi Jennifer! Mike Johnson here from today's open house at 123 Oak Street. Thanks for stopping by!\n\nQuick question: On a scale of 1-10, how close is this home to what you're looking for?\n\n(Reply with a number and I'll follow up accordingly)\n\n---\n\n**Email Follow-Up (same day):**\n\nSubject: 123 Oak Street — your feedback?\n\nHi Jennifer,\n\nIt was great meeting you at the open house today! I wanted to follow up while the home is still fresh in your mind.\n\n**Quick recap of 123 Oak:**\n• 3 bed, 2 bath, 1,850 sq ft\n• Updated kitchen (2021)\n• Huge backyard with mature trees\n• Priced at $489,000\n• Multiple offers expected by Tuesday\n\n**Next steps (if you're interested):**\n\n1. I can schedule a private showing for you this weekend\n2. I'll send you the full disclosure packet tonight\n3. We can run numbers on what your offer would need to be to win\n\n**Not the one? No problem.**\nI have 3 other listings coming soon in your price range that might be a better fit. Can I send you details when they go live?\n\nEither way, let me know how I can help!\n\nBest,\nMike Johnson\nAustin Residential Group\n512-555-0199\n\n---\n\n**Follow-Up for "Not Interested" Response:**\n\nThanks for the feedback! Totally understand.\n\nJust so I can help you better — what didn't work about 123 Oak? (Too small? Wrong location? Price?)\n\nI want to make sure I only send you homes that are actually a fit.\n\n---\n\n**Follow-Up for "Very Interested" Response:**\n\nAwesome! Let's move fast — this one will go quickly.\n\nCan you do a private showing tomorrow at 10am or 2pm? I'll bring comps and we can talk strategy.\n\nIn the meantime, get pre-approved if you haven't already. I can connect you with a great lender who closes in 21 days.\n\nSound good?`
  },
  {
    id: 'market-report',
    name: 'Market Updates',
    emoji: '📊',
    description: 'Client-friendly reports',
    category: 'service',
    exampleOutput: `**Q1 2024 Market Update: Austin Real Estate**\n\n---\n\n**The Big Picture**\n\nAustin's real estate market is stabilizing after two years of volatility. Here's what you need to know:\n\n📊 **Median Home Price:** $487,000 (up 3.2% from Q4 2023)\n📅 **Average Days on Market:** 34 days (down from 42 in December)\n🏘️ **Inventory:** 2.8 months (still a seller's market under 6 months)\n💰 **Mortgage Rates:** 6.8% average (holding steady)\n\n---\n\n**What This Means for Sellers**\n\n✅ **Good news:** Homes priced right are selling in under 30 days\n✅ **Multiple offers are back:** 40% of listings receive 2+ offers\n⚠️ **Overpriced homes sit:** Anything 10%+ above comps averages 60+ DOM\n\n**Strategy:** Price aggressively, market heavily, review offers in 7 days.\n\n---\n\n**What This Means for Buyers**\n\n✅ **Good news:** You have more options than last year (inventory up 18%)\n⚠️ **Competition is returning:** Be ready to move fast on the right home\n⚠️ **Rates matter:** $50K in purchase price = $280/month at 6.8%\n\n**Strategy:** Get pre-approved, act decisively, don't overbid emotionally.\n\n---\n\n**Neighborhood Spotlight: Riverside**\n\n🏡 **5 homes sold in the last 60 days**\n💵 **Average sale price:** $512,000 (4.1% above asking)\n⏱️ **Average DOM:** 18 days\n🔥 **Trend:** HOT — seller's market\n\n**What's driving it:** New coffee shop, elementary school ratings, walkability\n\n---\n\n**Looking Ahead: Q2 Forecast**\n\nExpect:\n• Inventory to increase (spring listings)\n• Rates to hold between 6.5-7.2%\n• Buyer demand to stay strong (pent-up from 2023)\n• Prices to grow modestly (2-4% by year-end)\n\n**Bottom line:** If you're thinking of selling, list in March/April. If you're buying, don't wait for rates to drop — you'll face more competition.\n\n---\n\n**Questions?**\n\nWant to know what YOUR home is worth in this market? Reply to this email and I'll send you a free analysis (no obligation).\n\nBest,\n[Your Name]\n[Your Brokerage]\n[Phone]`
  },
  {
    id: 'cma-narrative',
    name: 'CMA Narrative',
    emoji: '📈',
    description: 'Explain pricing strategy',
    category: 'service',
    exampleOutput: `**Comparative Market Analysis: 123 Oak Street, Austin TX**\n\n---\n\n**Executive Summary**\n\nBased on recent sales, active listings, and current market conditions, I recommend listing your home at **$489,000**.\n\nHere's how I arrived at that number...\n\n---\n\n**1. Recently Sold Comparables (Last 60 Days)**\n\nThese are the most similar homes to yours that actually sold:\n\n**456 Elm Street** (BEST COMP)\n• 3 bed, 2 bath, 1,820 sq ft (closest match)\n• Sold for $492,000 (2.1% above asking)\n• 18 days on market\n• Similar updates (kitchen, bathrooms)\n\n**789 Maple Avenue**\n• 3 bed, 2 bath, 1,900 sq ft (slightly larger)\n• Sold for $505,000 (at asking price)\n• 24 days on market\n• Larger lot (.35 acres vs your .25)\n\n**321 Pine Street**\n• 3 bed, 2 bath, 1,750 sq ft (smaller)\n• Sold for $478,000 (3.8% above asking)\n• 14 days on market\n• Older kitchen (your advantage)\n\n**What this tells us:**\nHomes in your size range (1,800-1,900 sf) are selling between $478K-$505K, with an average of $491K.\n\n---\n\n**2. Active Competition (Currently on Market)**\n\nThese homes are competing with yours RIGHT NOW:\n\n**654 Oak Street** (2 blocks away)\n• 3 bed, 2 bath, 1,880 sq ft\n• Listed at $509,000 (overpriced)\n• 42 days on market (sitting)\n• No price reduction yet (but coming)\n\n**987 Cedar Lane**\n• 3 bed, 2.5 bath, 1,950 sf\n• Listed at $495,000\n• 12 days on market\n• Getting showings but no offers (priced $10K too high)\n\n**What this tells us:**\nYour competition is priced $495K-$509K but NEITHER is selling. That's a red flag that buyers see value closer to $485-490K.\n\n---\n\n**3. Pending Sales (Under Contract)**\n\nThese accepted offers in the last 14 days:\n\n**147 Birch Drive**\n• 3 bed, 2 bath, 1,860 sq ft\n• Listed at $487,000 → Under contract in 9 days\n• Estimated sale price: $492-495K (based on appraisal)\n\n**What this tells us:**\nHomes priced under $490K are moving FAST. Anything above $500K is sitting.\n\n---\n\n**4. Market Conditions**\n\n📊 **Inventory:** 2.8 months (seller's market)\n📅 **Average DOM:** 34 days in your zip code\n💰 **Sale-to-List Ratio:** 101.2% (homes selling slightly above asking)\n🏘️ **Buyer Demand:** Strong for move-in ready homes under $500K\n\n---\n\n**5. Pricing Strategy Recommendation**\n\n**Option A: List at $489,000** (MY RECOMMENDATION)\n\n✅ Attracts maximum buyers (under $500K psychological barrier)\n✅ Positions you as the best value vs. competition\n✅ Likely to generate multiple offers in first 7 days\n✅ Expected sale price: $492-498K (above asking)\n\n**Option B: List at $499,000**\n\n⚠️ Eliminates 30% of qualified buyers (search filters)\n⚠️ Longer time on market (30-45 days)\n⚠️ Risk of price reduction (looks desperate)\n⚠️ Expected sale price: $490-495K (after reduction)\n\n**Option C: List at $479,000**\n\n✅ Would sell in 48 hours with multiple offers\n❌ Leaving $10-15K on the table unnecessarily\n\n---\n\n**My Recommendation: $489,000**\n\nThis price:\n• Reflects true market value\n• Attracts serious, qualified buyers\n• Creates urgency and competition\n• Maximizes your net proceeds\n\nWe'll review all offers after 7 days and likely see bids in the $490-500K range.\n\n**Questions? Let's discuss.**\n\n[Your Name]\n[Phone]\n[Email]`
  },
  {
    id: 'thank-you',
    name: 'Thank You Notes',
    emoji: '🙏',
    description: 'Personal & memorable',
    category: 'service',
    exampleOutput: `**Handwritten Note Template (After Closing):**\n\n---\n\nJennifer & Mark,\n\nCongratulations on your new home!\n\nI know the last 60 days were stressful (especially that appraisal situation!), but you handled it like pros. It was an honor to help you find the perfect place for your family.\n\nA few things:\n\n1. I've attached your "New Homeowner Checklist" — utilities, insurance, etc.\n2. My handyman's number is below if you need help with anything\n3. You're officially part of my "client family" — which means I'm always here for advice, referrals, or just to grab coffee.\n\nEnjoy making memories at 123 Oak Street. I can't wait to see what you do with that backyard!\n\nP.S. — If you know anyone looking to buy or sell, I'd be grateful for the referral. That's how I grow my business!\n\nCheers,\nMike\n\n[Handwritten, mailed with a small gift — plant, wine, or $25 HomeGoods card]\n\n---\n\n**Text Version (Immediate After Showing):**\n\nHey Sarah! Thanks for letting me show you around today. I know 123 Oak wasn't quite right, but I have 2 more listings going live this week that I think you'll love.\n\nI'll send details tomorrow. In the meantime, let me know if you have any questions!\n\n- Mike\n\n---\n\n**Email Version (After Listing Presentation - Didn't Get Listing):**\n\nSubject: Thank you for your time today\n\nHi Jennifer,\n\nI wanted to say thank you for considering me to sell your home. I know you're going in a different direction, and I respect that — it's a big decision.\n\nIf things don't work out with the other agent, or if you need anything along the way (second opinion, market data, etc.), please don't hesitate to reach out. No hard feelings whatsoever.\n\nI genuinely hope your sale goes smoothly and you get top dollar.\n\nBest of luck!\n\nMike Johnson\nAustin Residential Group\n512-555-0199\n\n---\n\n**Anniversary Card (1 Year After Purchase):**\n\nHappy Home Anniversary! 🎉\n\nIt's been one year since you closed on 123 Oak Street. Time flies!\n\nI hope you're loving the neighborhood. If you ever need anything — contractor recommendations, market updates, or just advice — I'm always here.\n\nP.S. Your home has appreciated approximately 4.2% this year (roughly $20K in equity). Not too shabby!\n\nCheers,\nMike\n\n[Include: Market snapshot + home value estimate]`
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (defined before components that use them)
// ═══════════════════════════════════════════════════════════════════════════════

// Exported at end after all functions are defined

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function PromptCrafter() {
  const [state, setState] = useState<PromptState>({
    step: 0,
    selectedUseCase: null,
    answers: {},
    generatedPrompt: ''
  });

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedExample, setExpandedExample] = useState<string | null>(null); // Track which example is showing

  // AI Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('promptHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('promptHistory', JSON.stringify(history));
    }
  }, [history]);

  // Scroll to top whenever step changes or history view toggles
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.step, showHistory]);

  const handleUseCaseSelect = (useCaseId: string) => {
    setState({ ...state, selectedUseCase: useCaseId, step: 1, answers: {} });
  };

  const handleAnswer = (questionId: string, value: string) => {
    setState({
      ...state,
      answers: { ...state.answers, [questionId]: value }
    });
  };

  const handleGeneratePrompt = () => {
    const prompt = generatePrompt(state.selectedUseCase!, state.answers);
    const useCaseName = USE_CASES.find(u => u.id === state.selectedUseCase)?.name || 'Unknown';

    // Save to history
    const newHistoryItem: PromptHistory = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      useCaseId: state.selectedUseCase!,
      useCaseName,
      prompt,
      answers: state.answers
    };

    // Keep only last 10 prompts
    const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
    setHistory(updatedHistory);

    setState({ ...state, generatedPrompt: prompt, step: 4 });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(state.generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedOutput(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: state.generatedPrompt,
          userInput: JSON.stringify(state.answers)
        })
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setGeneratedOutput(data.output || data.result || 'No output received');

      // Update history with AI output
      const updatedHistory = history.map(item =>
        item.id === history[0]?.id
          ? { ...item, aiOutput: data.output || data.result }
          : item
      );
      setHistory(updatedHistory);
    } catch (error) {
      console.error('AI Generation error:', error);
      setGeneratedOutput('Unable to generate content. Please try copying the prompt to ChatGPT manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyOutput = () => {
    if (generatedOutput) {
      navigator.clipboard.writeText(generatedOutput);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  const handleRestorePrompt = (item: PromptHistory) => {
    setState({
      step: 4,
      selectedUseCase: item.useCaseId,
      answers: item.answers,
      generatedPrompt: item.prompt
    });
    setShowHistory(false);
  };

  const handleReset = () => {
    setState({
      step: 0,
      selectedUseCase: null,
      answers: {},
      generatedPrompt: ''
    });
    setShowHistory(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER STEPS
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <>
      {/* Global focus styles for accessibility */}
      <style>{`
        button:focus-visible,
        input:focus-visible,
        textarea:focus-visible,
        a:focus-visible {
          outline: 3px solid #6366f1 !important;
          outline-offset: 2px !important;
          border-radius: 8px;
        }
        button:hover,
        a:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
        }
        button:active,
        a:active {
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
        <h1 style={styles.logo}>AI Prompt Vault</h1>
        <p style={styles.tagline}>
          Creates optimized prompts for ChatGPT, Claude & other AI assistants
        </p>
        {history.length > 0 && !showHistory && (
          <button
            onClick={() => setShowHistory(true)}
            style={styles.historyButton}
            aria-label={`View prompt history, ${history.length} saved ${history.length === 1 ? 'prompt' : 'prompts'}`}
          >
            📜 Prompt History ({history.length})
          </button>
        )}
      </div>

      {/* History View */}
      {showHistory && (
        <div style={styles.stepContainer}>
          <button onClick={() => setShowHistory(false)} style={styles.backButton}>
            ← Back
          </button>
          <h2 style={styles.title}>Your Recent Prompts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((item) => (
              <div key={item.id} style={styles.historyCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '4px' }}>
                      {item.useCaseName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestorePrompt(item)}
                    style={styles.historyRestoreButton}
                    aria-label={`Reuse ${item.useCaseName} prompt from ${new Date(item.timestamp).toLocaleDateString()}`}
                  >
                    Reuse
                  </button>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#cbd5e1',
                  maxHeight: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {item.prompt.substring(0, 200)}...
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleReset} style={styles.secondaryButton}>
            Create New Prompt
          </button>
        </div>
      )}

      {/* Step 0: Use Case Selection - Categorized */}
      {!showHistory && state.step === 0 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.title}>What do you need help with?</h2>

          {/* CONTENT CREATION */}
          <div style={styles.categorySection}>
            <h3 style={styles.categoryTitle}>Content Creation</h3>
            <div style={styles.useCaseGrid}>
              {USE_CASES.filter(u => u.category === 'content').map(useCase => (
                <div key={useCase.id}>
                  <button
                    onClick={() => handleUseCaseSelect(useCase.id)}
                    style={{
                      ...styles.useCaseCard,
                      position: 'relative' as const
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                      {useCase.emoji}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: '#f1f5f9' }}>
                      {useCase.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                      {useCase.description}
                    </div>
                    {useCase.exampleOutput && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedExample(expandedExample === useCase.id ? null : useCase.id);
                        }}
                        style={{
                          position: 'absolute' as const,
                          top: '10px',
                          right: '10px',
                          fontSize: '18px',
                          cursor: 'pointer',
                          background: 'rgba(16, 185, 129, 0.15)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        👁️
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SALES & PROSPECTING */}
          <div style={styles.categorySection}>
            <h3 style={styles.categoryTitle}>Sales & Prospecting</h3>
            <div style={styles.useCaseGrid}>
              {USE_CASES.filter(u => u.category === 'sales').map(useCase => (
                <div key={useCase.id}>
                  <button
                    onClick={() => handleUseCaseSelect(useCase.id)}
                    style={{
                      ...styles.useCaseCard,
                      position: 'relative' as const
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                      {useCase.emoji}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: '#f1f5f9' }}>
                      {useCase.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                      {useCase.description}
                    </div>
                    {useCase.exampleOutput && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedExample(expandedExample === useCase.id ? null : useCase.id);
                        }}
                        style={{
                          position: 'absolute' as const,
                          top: '10px',
                          right: '10px',
                          fontSize: '18px',
                          cursor: 'pointer',
                          background: 'rgba(16, 185, 129, 0.15)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        👁️
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CLIENT SERVICE */}
          <div style={styles.categorySection}>
            <h3 style={styles.categoryTitle}>Client Service</h3>
            <div style={styles.useCaseGrid}>
              {USE_CASES.filter(u => u.category === 'service').map(useCase => (
                <div key={useCase.id}>
                  <button
                    onClick={() => handleUseCaseSelect(useCase.id)}
                    style={{
                      ...styles.useCaseCard,
                      position: 'relative' as const
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                      {useCase.emoji}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: '#f1f5f9' }}>
                      {useCase.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                      {useCase.description}
                    </div>
                    {useCase.exampleOutput && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedExample(expandedExample === useCase.id ? null : useCase.id);
                        }}
                        style={{
                          position: 'absolute' as const,
                          top: '10px',
                          right: '10px',
                          fontSize: '18px',
                          cursor: 'pointer',
                          background: 'rgba(16, 185, 129, 0.15)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        👁️
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Example Modal Overlay */}
      {expandedExample && (
        <div
          onClick={() => setExpandedExample(null)}
          style={{
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(21, 27, 46, 0.98)',
              border: '2px solid #10b981',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative' as const
            }}
          >
            <button
              onClick={() => setExpandedExample(null)}
              style={{
                position: 'absolute' as const,
                top: '16px',
                right: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#f87171',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ✕
            </button>

            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginBottom: '16px' }}>
              📝 Example Output
            </div>

            {USE_CASES.find(uc => uc.id === expandedExample)?.exampleOutput && (
              <pre style={{
                fontSize: '14px',
                lineHeight: '1.7',
                color: '#e5e7eb',
                margin: 0,
                whiteSpace: 'pre-wrap',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                letterSpacing: '0.01em',
              }}>
                {USE_CASES.find(uc => uc.id === expandedExample)?.exampleOutput}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Step 1-3: Dynamic Questions */}
      {state.step >= 1 && state.step <= 3 && state.selectedUseCase && (
        <QuestionFlow
          useCaseId={state.selectedUseCase}
          currentStep={state.step}
          answers={state.answers}
          onAnswer={handleAnswer}
          onNext={() => setState({ ...state, step: state.step + 1 })}
          onBack={() => setState({ ...state, step: Math.max(0, state.step - 1) })}
          onGenerate={handleGeneratePrompt}
        />
      )}

      {/* Step 4: Generated Content (AI-First) */}
      {!showHistory && state.step === 4 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.title}>Your Content is Ready!</h2>

          {!generatedOutput ? (
            // Before AI generation
            <>
              <div style={styles.explainerBox}>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>✨ Generate with AI (Recommended)</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  Click below to instantly generate your content using AI. No copy-pasting needed!
                </div>
              </div>

              {/* Primary Action: Generate with AI */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  ...styles.primaryButton,
                  background: isGenerating ? '#64748b' : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                  marginBottom: '16px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.7 : 1
                }}
              >
                {isGenerating ? '⏳ Generating...' : '✨ Generate with AI'}
              </button>

              {/* Collapsible: Advanced Options */}
              <details style={{ marginBottom: '24px' }}>
                <summary style={{
                  fontSize: '13px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  listStyle: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>▼</span> Advanced: Edit prompt or copy manually
                </summary>

                <div style={styles.promptBox}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontStyle: 'italic' }}>
                    ✏️ Click to edit before using
                  </div>
                  <textarea
                    value={state.generatedPrompt}
                    onChange={(e) => setState({ ...state, generatedPrompt: e.target.value })}
                    style={{
                      ...styles.promptText,
                      width: '100%',
                      minHeight: '200px',
                      resize: 'vertical',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <button
                    onClick={handleCopyPrompt}
                    style={{
                      ...styles.secondaryButton,
                      marginTop: 0,
                      background: copiedPrompt ? '#10b981' : 'transparent',
                      borderColor: copiedPrompt ? '#10b981' : '#475569',
                      color: copiedPrompt ? '#ffffff' : '#d1d5db',
                      flex: '1 1 200px'
                    }}
                  >
                    {copiedPrompt ? '✓ Copied!' : '📋 Copy Prompt'}
                  </button>
                  <a
                    href={`https://chat.openai.com/?q=${encodeURIComponent(state.generatedPrompt)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...styles.secondaryButton,
                      marginTop: 0,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: '1 1 200px'
                    }}
                  >
                    Open in ChatGPT →
                  </a>
                </div>
              </details>
            </>
          ) : (
            // After AI generation - show output
            <>
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '2px solid #10b981',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981', marginBottom: '12px' }}>
                  ✨ AI Generated Output:
                </div>
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.7',
                  color: '#e5e7eb',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {generatedOutput}
                </div>
              </div>

              {/* Actions after generation */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCopyOutput}
                  style={{
                    ...styles.primaryButton,
                    background: copiedOutput ? '#10b981' : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                    flex: '1 1 200px'
                  }}
                >
                  {copiedOutput ? '✓ Copied!' : '📋 Copy Output'}
                </button>
                <button
                  onClick={() => {
                    setGeneratedOutput(null);
                    setIsGenerating(false);
                  }}
                  style={{
                    ...styles.secondaryButton,
                    marginTop: 0,
                    flex: '1 1 200px'
                  }}
                >
                  🔄 Generate Again
                </button>
              </div>

              {/* Show the prompt that was used (collapsible) */}
              <details style={{ marginBottom: '24px' }}>
                <summary style={{
                  fontSize: '13px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>▼</span> View the prompt that was used
                </summary>
                <div style={{
                  ...styles.promptBox,
                  marginTop: '12px'
                }}>
                  <pre style={styles.promptText}>{state.generatedPrompt}</pre>
                </div>
              </details>
            </>
          )}

          <button onClick={handleReset} style={styles.secondaryButton}>
            Create Another Prompt
          </button>
        </div>
      )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION FLOW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function QuestionFlow({
  useCaseId,
  currentStep,
  answers,
  onAnswer,
  onNext,
  onBack,
  onGenerate
}: {
  useCaseId: string;
  currentStep: number;
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const questions = getQuestionsForUseCase(useCaseId);
  const currentQuestion = questions[currentStep - 1];

  if (!currentQuestion) {
    return null;
  }

  const isLastQuestion = currentStep === questions.length;
  const canContinue = answers[currentQuestion.id]?.trim().length > 0;

  return (
    <div style={styles.stepContainer}>
      <button onClick={onBack} style={styles.backButton}>
        ← Back
      </button>

      <h2 style={styles.title}>{currentQuestion.question}</h2>
      {'subtitle' in currentQuestion && currentQuestion.subtitle && (
        <p style={styles.subtitle}>{currentQuestion.subtitle}</p>
      )}

      {currentQuestion.type === 'text' && (
        <input
          type="text"
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => onAnswer(currentQuestion.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canContinue) {
              e.preventDefault();
              isLastQuestion ? onGenerate() : onNext();
            }
          }}
          placeholder={'placeholder' in currentQuestion ? currentQuestion.placeholder : ''}
          style={styles.input}
          autoFocus
        />
      )}

      {currentQuestion.type === 'textarea' && (
        <textarea
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => onAnswer(currentQuestion.id, e.target.value)}
          onKeyDown={(e) => {
            // Ctrl+Enter or Cmd+Enter to submit
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canContinue) {
              e.preventDefault();
              isLastQuestion ? onGenerate() : onNext();
            }
          }}
          placeholder={'placeholder' in currentQuestion ? currentQuestion.placeholder : ''}
          style={styles.textarea}
          rows={4}
          autoFocus
        />
      )}

      {currentQuestion.type === 'select' && 'options' in currentQuestion && currentQuestion.options && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {currentQuestion.options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => onAnswer(currentQuestion.id, option.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAnswer(currentQuestion.id, option.value);
                }
              }}
              autoFocus={index === 0}
              style={{
                ...styles.selectOption,
                borderColor: answers[currentQuestion.id] === option.value ? '#10b981' : '#334155',
                background: answers[currentQuestion.id] === option.value ? 'rgba(16, 185, 129, 0.15)' : 'rgba(21, 27, 46, 0.8)' // Improved contrast
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{option.emoji}</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{option.label}</div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={isLastQuestion ? onGenerate : onNext}
        disabled={!canContinue}
        style={{
          ...styles.primaryButton,
          background: canContinue
            ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)'
            : '#475569', // Solid gray background when disabled for better contrast
          opacity: canContinue ? 1 : 1, // Keep opacity at 1, change background instead
          cursor: canContinue ? 'pointer' : 'not-allowed',
          color: '#ffffff', // Ensure white text
        }}
      >
        {isLastQuestion ? '✨ Generate My Prompt' : 'Next →'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getQuestionsForUseCase(useCaseId: string): Question[] {
  // Sphere calling scripts
  if (useCaseId === 'sphere-script') {
    return [
      {
        id: 'who',
        type: 'select' as const,
        question: 'Who are you calling?',
        options: [
          { value: 'past-client', label: 'Past Client', emoji: '🤝' },
          { value: 'cold-lead', label: 'Cold Lead', emoji: '❄️' },
          { value: 'warm-lead', label: 'Warm Lead', emoji: '🔥' },
          { value: 'fsbo', label: 'FSBO', emoji: '🏠' },
          { value: 'expired', label: 'Expired Listing', emoji: '⏰' }
        ]
      },
      {
        id: 'goal',
        type: 'select' as const,
        question: "What's your goal for this call?",
        options: [
          { value: 'referral', label: 'Get Referral', emoji: '🎯' },
          { value: 'appointment', label: 'Book Appointment', emoji: '📅' },
          { value: 'top-of-mind', label: 'Stay Top of Mind', emoji: '💭' },
          { value: 'market-update', label: 'Share Market Update', emoji: '📊' }
        ]
      },
      {
        id: 'context',
        type: 'textarea' as const,
        question: 'Any specific context?',
        subtitle: 'What do you know about them? What makes this call unique?',
        placeholder: 'Example: They bought a home 2 years ago, have 2 kids, mentioned wanting a bigger yard last time we talked...'
      }
    ];
  }

  // Social media content
  if (useCaseId === 'social-content') {
    return [
      {
        id: 'platform',
        type: 'select' as const,
        question: 'Which platform?',
        options: [
          { value: 'instagram', label: 'Instagram', emoji: '📸' },
          { value: 'facebook', label: 'Facebook', emoji: '👥' },
          { value: 'linkedin', label: 'LinkedIn', emoji: '💼' },
          { value: 'tiktok', label: 'TikTok', emoji: '🎵' }
        ]
      },
      {
        id: 'topic',
        type: 'select' as const,
        question: 'What type of post?',
        options: [
          { value: 'market-update', label: 'Market Update', emoji: '📊' },
          { value: 'listing-showcase', label: 'Listing Showcase', emoji: '🏡' },
          { value: 'tips-advice', label: 'Tips & Advice', emoji: '💡' },
          { value: 'personal-story', label: 'Personal Story', emoji: '✨' },
          { value: 'just-sold', label: 'Just Sold/Closed', emoji: '🎉' }
        ]
      },
      {
        id: 'context',
        type: 'textarea' as const,
        question: 'Tell me about the post',
        subtitle: 'What specific angle or hook do you want?',
        placeholder: 'Example: Interest rates dropped 0.5% this week and I want to explain what it means for buyers...'
      }
    ];
  }

  // Email sequence
  if (useCaseId === 'email-sequence') {
    return [
      {
        id: 'audience',
        type: 'select' as const,
        question: 'Who is this email sequence for?',
        options: [
          { value: 'new-leads', label: 'New Leads', emoji: '👋' },
          { value: 'buyers', label: 'Active Buyers', emoji: '🔍' },
          { value: 'sellers', label: 'Potential Sellers', emoji: '🏠' },
          { value: 'past-clients', label: 'Past Clients', emoji: '🤝' }
        ]
      },
      {
        id: 'emails',
        type: 'select' as const,
        question: 'How many emails?',
        options: [
          { value: '3', label: '3 emails', emoji: '📧' },
          { value: '5', label: '5 emails', emoji: '📨' },
          { value: '7', label: '7 emails', emoji: '📬' }
        ]
      },
      {
        id: 'context',
        type: 'textarea' as const,
        question: 'What should this sequence accomplish?',
        subtitle: 'Goal, unique value, tone preferences',
        placeholder: 'Example: Nurture new buyer leads from Zillow - share helpful first-time buyer tips, build trust, get them to book a call...'
      }
    ];
  }

  // Listing description
  if (useCaseId === 'listing-description') {
    return [
      {
        id: 'property-type',
        type: 'select' as const,
        question: 'Property type?',
        options: [
          { value: 'single-family', label: 'Single Family', emoji: '🏡' },
          { value: 'condo', label: 'Condo', emoji: '🏢' },
          { value: 'townhouse', label: 'Townhouse', emoji: '🏘️' },
          { value: 'luxury', label: 'Luxury Home', emoji: '💎' },
          { value: 'land', label: 'Land/Lot', emoji: '🌳' }
        ]
      },
      {
        id: 'details',
        type: 'textarea' as const,
        question: 'Key property details',
        subtitle: 'Beds, baths, sq ft, unique features, upgrades',
        placeholder: 'Example: 4 bed 3 bath, 2400 sq ft, updated kitchen with quartz counters, new HVAC 2023, huge backyard with mature trees...'
      },
      {
        id: 'vibe',
        type: 'select' as const,
        question: 'What vibe?',
        options: [
          { value: 'professional', label: 'Professional', emoji: '💼' },
          { value: 'storytelling', label: 'Storytelling', emoji: '📖' },
          { value: 'luxury', label: 'Luxury/Upscale', emoji: '✨' },
          { value: 'casual', label: 'Casual/Friendly', emoji: '😊' }
        ]
      }
    ];
  }

  // Consultation script
  if (useCaseId === 'consultation-script') {
    return [
      {
        id: 'type',
        type: 'select' as const,
        question: 'What type of consultation?',
        options: [
          { value: 'buyer', label: 'Buyer Consultation', emoji: '🔍' },
          { value: 'seller', label: 'Seller Consultation', emoji: '🏠' },
          { value: 'listing', label: 'Listing Presentation', emoji: '📊' }
        ]
      },
      {
        id: 'stage',
        type: 'select' as const,
        question: 'What stage?',
        options: [
          { value: 'discovery', label: 'Discovery Questions', emoji: '❓' },
          { value: 'presentation', label: 'Value Presentation', emoji: '💼' },
          { value: 'closing', label: 'Closing Script', emoji: '✍️' }
        ]
      },
      {
        id: 'context',
        type: 'textarea' as const,
        question: 'Any specific context?',
        subtitle: 'What you know about the client, their situation, concerns',
        placeholder: 'Example: First-time sellers, worried about pricing too high or too low, considering interviewing 3 agents...'
      }
    ];
  }

  // Objection handling
  if (useCaseId === 'objection-handling') {
    return [
      {
        id: 'objection',
        type: 'select' as const,
        question: 'What objection?',
        options: [
          { value: 'commission', label: 'Commission Too High', emoji: '💰' },
          { value: 'timing', label: 'Wrong Time to Buy/Sell', emoji: '⏰' },
          { value: 'price', label: 'Price Concerns', emoji: '🏷️' },
          { value: 'other-agent', label: 'Working with Another Agent', emoji: '👥' },
          { value: 'think-about-it', label: 'Need to Think About It', emoji: '🤔' }
        ]
      },
      {
        id: 'context',
        type: 'textarea' as const,
        question: 'Specific situation?',
        subtitle: 'How did this objection come up? Any context?',
        placeholder: 'Example: Listing presentation - they said 6% is too high and their neighbor sold for 4%...'
      }
    ];
  }

  // Open house follow-up
  if (useCaseId === 'open-house-followup') {
    return [
      {
        id: 'visitor-type',
        type: 'select' as const,
        question: 'Who visited?',
        options: [
          { value: 'serious-buyer', label: 'Serious Buyer', emoji: '🎯' },
          { value: 'just-looking', label: 'Just Looking', emoji: '👀' },
          { value: 'neighbor', label: 'Neighbor', emoji: '🏘️' },
          { value: 'no-show', label: 'Interested but No-Show', emoji: '❓' }
        ]
      },
      {
        id: 'channel',
        type: 'select' as const,
        question: 'Follow-up method?',
        options: [
          { value: 'text', label: 'Text Message', emoji: '💬' },
          { value: 'email', label: 'Email', emoji: '📧' }
        ]
      },
      {
        id: 'context',
        type: 'textarea' as const,
        question: 'What happened at the open house?',
        subtitle: 'What did they say? What were they interested in?',
        placeholder: 'Example: Young couple, loved the backyard, concerned about the school district, said they need 4 beds...'
      }
    ];
  }

  // Market report
  if (useCaseId === 'market-report') {
    return [
      {
        id: 'audience',
        type: 'select' as const,
        question: 'Who is this for?',
        options: [
          { value: 'buyers', label: 'Buyers', emoji: '🔍' },
          { value: 'sellers', label: 'Sellers', emoji: '🏠' },
          { value: 'general', label: 'General Sphere', emoji: '👥' }
        ]
      },
      {
        id: 'data',
        type: 'textarea' as const,
        question: 'What market data do you have?',
        subtitle: 'Stats, trends, changes',
        placeholder: 'Example: Inventory up 15% this quarter, median price down 3%, days on market increased from 22 to 31 days...'
      },
      {
        id: 'so-what',
        type: 'textarea' as const,
        question: 'What does it mean for them?',
        subtitle: 'Your interpretation and advice',
        placeholder: 'Example: Great news for buyers - more options and less competition. Sellers need to price right and stage well...'
      }
    ];
  }

  // Video script
  if (useCaseId === 'video-script') {
    return [
      {
        id: 'platform',
        type: 'select' as const,
        question: 'What platform?',
        options: [
          { value: 'reels', label: 'Instagram Reels', emoji: '📸' },
          { value: 'tiktok', label: 'TikTok', emoji: '🎵' },
          { value: 'youtube', label: 'YouTube', emoji: '📹' },
          { value: 'stories', label: 'Stories', emoji: '⚡' }
        ]
      },
      {
        id: 'topic',
        type: 'select' as const,
        question: 'Video topic?',
        options: [
          { value: 'educational', label: 'Educational Tip', emoji: '💡' },
          { value: 'listing-tour', label: 'Listing Tour', emoji: '🏡' },
          { value: 'neighborhood', label: 'Neighborhood Spotlight', emoji: '🏘️' },
          { value: 'market-update', label: 'Market Update', emoji: '📊' },
          { value: 'personal', label: 'Personal/BTS', emoji: '✨' }
        ]
      },
      {
        id: 'context',
        type: 'textarea' as const,
        question: 'Describe the video',
        subtitle: 'Hook, main points, call to action',
        placeholder: 'Example: 60-second Reel showing 3 things first-time buyers always forget. Hook: "Stop! Before you buy..." End with DM me for full checklist...'
      }
    ];
  }

  // Expired/FSBO letters
  if (useCaseId === 'expired-fsbo') {
    return [
      {
        id: 'type',
        type: 'select' as const,
        question: 'Which one?',
        options: [
          { value: 'expired', label: 'Expired Listing', emoji: '⏰' },
          { value: 'fsbo', label: 'FSBO', emoji: '🏠' },
          { value: 'withdrawn', label: 'Withdrawn Listing', emoji: '🔄' }
        ]
      },
      {
        id: 'format',
        type: 'select' as const,
        question: 'Format?',
        options: [
          { value: 'letter', label: 'Physical Letter', emoji: '✉️' },
          { value: 'email', label: 'Email', emoji: '📧' },
          { value: 'script', label: 'Phone Script', emoji: '📞' }
        ]
      },
      {
        id: 'context',
        type: 'textarea' as const,
        question: 'Any specific details?',
        subtitle: 'Why it expired/FSBO, your unique approach',
        placeholder: 'Example: Expired after 90 days, overpriced by 10%, I have a buyer looking in that neighborhood...'
      }
    ];
  }

  // CMA narrative
  if (useCaseId === 'cma-narrative') {
    return [
      {
        id: 'situation',
        type: 'select' as const,
        question: 'What is the pricing situation?',
        options: [
          { value: 'market-value', label: 'At Market Value', emoji: '✅' },
          { value: 'overpriced', label: 'They Want More', emoji: '⬆️' },
          { value: 'underpriced', label: 'Quick Sale Needed', emoji: '⬇️' },
          { value: 'competitive', label: 'Competitive Market', emoji: '🔥' }
        ]
      },
      {
        id: 'data',
        type: 'textarea' as const,
        question: 'CMA data summary',
        subtitle: 'Comps, price range, key differences',
        placeholder: 'Example: 3 recent sales in neighborhood: $485k, $502k, $478k. Subject property has updated kitchen but smaller lot than $502k comp...'
      },
      {
        id: 'recommendation',
        type: 'text' as const,
        question: 'Your recommended list price',
        placeholder: 'Example: $495,000'
      }
    ];
  }

  // Thank you notes
  if (useCaseId === 'thank-you') {
    return [
      {
        id: 'occasion',
        type: 'select' as const,
        question: 'What is the occasion?',
        options: [
          { value: 'closing', label: 'After Closing', emoji: '🎉' },
          { value: 'referral', label: 'For Referral', emoji: '🙏' },
          { value: 'review', label: 'For Review', emoji: '⭐' },
          { value: 'anniversary', label: 'Home Anniversary', emoji: '🏡' }
        ]
      },
      {
        id: 'format',
        type: 'select' as const,
        question: 'Format?',
        options: [
          { value: 'handwritten', label: 'Handwritten Note', emoji: '✍️' },
          { value: 'email', label: 'Email', emoji: '📧' },
          { value: 'gift-card', label: 'Gift Card Message', emoji: '🎁' }
        ]
      },
      {
        id: 'context',
        type: 'textarea' as const,
        question: 'Personal details',
        subtitle: 'What made this transaction special? What do you remember?',
        placeholder: 'Example: First-time buyers, super sweet couple, their dog ran around the backyard at every showing, they were so excited...'
      }
    ];
  }

  // Default fallback
  return [
    {
      id: 'context',
      type: 'textarea' as const,
      question: 'Tell me about the context',
      placeholder: 'Provide details...'
    }
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT GENERATION ENGINE
// ═════════════════════════════════════════════════════════════════════════════==

// Individual prompt generators (declared first for hoisting)

function generateCallingScriptPrompt(answers: Record<string, string>): string {
  const who = answers.who || 'past client';
  const goal = answers.goal || 'referral';
  const context = answers.context || '';

  // SUPERCHARGED: Advanced prompt engineering with psychological frameworks
  return `You are a master real estate sales trainer who has analyzed 10,000+ successful sphere calls. You understand the psychology of rapport-building and non-salesy persuasion.

# MISSION
Create a 60-90 second phone script to call a ${who.replace('-', ' ')} with the goal of ${goal.replace('-', ' ')}.

# WHAT I KNOW ABOUT THEM
${context || 'Limited context - write a versatile script that creates curiosity and value'}

# BEFORE YOU WRITE: STRATEGIC THINKING
First, answer these questions to yourself (don't include in output):
1. What is the REAL REASON I'm calling (not the excuse)?
2. What SPECIFIC value can I provide that's relevant to THEM?
3. How can I make the ask feel like the obvious next step?
4. What would make THEM glad I called?

# PSYCHOLOGY PRINCIPLES TO APPLY
→ **Pattern Interrupt**: Don't start with "How are you?" - they know it's sales
→ **Reciprocity**: Give value BEFORE asking for anything
→ **Curiosity Gap**: Tease valuable info without giving it all away
→ **Assumptive Language**: Act like the next step is natural and agreed upon
→ **Social Proof**: Reference others when relevant ("Several neighbors asked...")

# ANTI-PATTERNS (What kills scripts - NEVER do these)
❌ "How are you?" / "How have you been?" (too obvious)
❌ "I hope this message finds you well" (robotic)
❌ "Just checking in" / "Reaching out" / "Circling back" (filler phrases)
❌ "Is now a good time?" (gives easy exit)
❌ Being vague about value ("I have some info for you")
❌ Apologizing for calling ("Sorry to bother you")
❌ Long preamble before getting to the point

# SUCCESS PATTERNS (What makes scripts work)
✅ Use their name + specific reason you're calling
✅ Get to value hook within 15 seconds
✅ Sound like confident friend, not salesperson
✅ Use contractions (I'm, you're, there's, we've)
✅ Include pattern interrupt or unexpected angle
✅ Make ask low-friction and clear
✅ End assuming they'll say yes

# REQUIRED OUTPUT STRUCTURE
<opening seconds="0-15">
[Greeting + immediate hook + value tease]
GOOD EXAMPLE: "Hey Sarah! I was pulling market data for your neighborhood and noticed something wild about Oak Street - made me think of you immediately."
BAD EXAMPLE: "Hi Sarah, how are you doing? I hope you're well. I wanted to reach out and check in with you."
</opening>

<value_delivery seconds="15-50">
[Deliver the specific valuable insight/information]
GOOD EXAMPLE: "So inventory in your area dropped 40% this month, but prices are flat. That means if you've ever thought about upgrading, this is literally the best buyer leverage in 2 years - but it won't last."
BAD EXAMPLE: "The market has been changing and there's some interesting activity happening. Things are moving and I thought you should know about it."
</value_delivery>

<transition seconds="50-65">
[Natural bridge to the ask]
GOOD EXAMPLE: "Which made me curious - you know a lot of people in the neighborhood, right?"
BAD EXAMPLE: "So the reason I'm calling is I wanted to ask you something."
</transition>

<ask seconds="65-75">
[Clear, direct request for ${goal.replace('-', ' ')}]
GOOD EXAMPLE: "Do you know anyone who's been thinking about buying? With rates where they are, I've got 3 qualified buyers specifically asking about that area."
BAD EXAMPLE: "If you know anyone who might be interested in buying or selling, would you mind maybe referring them to me if it's not too much trouble?"
</ask>

<close seconds="75-90">
[Assume yes + clear next action]
GOOD EXAMPLE: "Perfect - I'll text you my info in 5 minutes so you can forward it if anyone mentions real estate. And hey, if YOU ever want to know what your place is worth these days, just say the word. Talk soon!"
BAD EXAMPLE: "Okay well let me know if you think of anyone. Thanks for your time. Talk to you later maybe."
</close>

# DYNAMIC PLACEHOLDERS
Mark these for personalization:
→ [THEIR_NAME] - Contact's first name
→ [NEIGHBORHOOD] - Their street/area
→ [DETAIL] - Specific context detail
→ [TIMEFRAME] - When they bought/last spoke

# VOICE & TONE CALIBRATION
- First person (I'm saying this)
- Conversational pace with verbal pauses ("So...", "And hey,", "Actually,")
- Confident friend energy (not desperate, not pushy)
- Under 90 seconds when read at natural speaking pace
- Use "you" more than "I" (ratio 3:1)

# QUALITY CHECKLIST (ensure script passes all):
□ Sounds natural when read aloud
□ Creates genuine curiosity or value
□ Ask is clear and low-friction
□ No apologizing or permission-seeking
□ No corporate/sales jargon
□ Ends with momentum, not fizzle
□ Makes THEM glad I called

Now write the perfect script for calling this ${who.replace('-', ' ')} to achieve ${goal.replace('-', ' ')}.`;
}

function generateSocialContentPrompt(answers: Record<string, string>): string {
  const platform = answers.platform || 'instagram';
  const topic = answers.topic || 'market-update';
  const context = answers.context || '';

  const platformSpecs = {
    instagram: {
      length: '150-300 characters for caption',
      hook: 'First 125 characters appear before "more" button',
      format: 'Hook in first line, value in middle, CTA at end, 3-5 hashtags',
      engagement: 'Questions and "save this" prompts drive saves/shares'
    },
    facebook: {
      length: '1-3 paragraphs (40-100 words)',
      hook: 'First 2 lines show in feed',
      format: 'Conversational storytelling, question to drive comments',
      engagement: 'Controversy and personal stories drive engagement'
    },
    linkedin: {
      length: '1200-1500 characters',
      hook: 'First 3 lines visible without "see more"',
      format: 'Professional insight + personal angle + industry perspective',
      engagement: 'Data + vulnerability = high engagement'
    },
    tiktok: {
      length: '150 characters max for caption',
      hook: 'On-screen text in first 3 seconds',
      format: 'Pattern interrupt + rapid value delivery',
      engagement: 'Trending sounds + relatable situations'
    }
  };

  const spec = platformSpecs[platform as keyof typeof platformSpecs];

  return `You are a social media strategist who has generated 50M+ views for real estate content creators. You understand virality psychology and anti-generic content creation.

# OBJECTIVE
Create a ${platform} post about ${topic.replace('-', ' ')} that stops the scroll and drives real engagement (not just likes - saves, shares, comments).

# WHAT I WANT TO COMMUNICATE
${context || 'No specific angle provided - find an unexpected hook or contrarian take'}

# PLATFORM-SPECIFIC REQUIREMENTS
${spec.length}
${spec.hook}
${spec.format}
${spec.engagement}

# ENGAGEMENT PSYCHOLOGY PRINCIPLES
→ **Pattern Interrupt**: Start with something unexpected/contrarian
→ **Curiosity Gap**: Open loops that make people want to finish
→ **Social Currency**: Make them look smart for sharing
→ **Practical Value**: "Save this" / "Send to someone who needs this"
→ **Emotion + Reason**: Facts tell, stories sell
→ **Enemy/Conflict**: "Everyone says X, but actually Y"

# WHAT KILLS ENGAGEMENT (NEVER DO THESE)
❌ "Let's talk about..." (no one wants to be lectured)
❌ "In today's market..." (instant scroll)
❌ "Are you thinking about buying/selling?" (too salesy)
❌ Generic market stats without context or story
❌ Corporate speak or jargon
❌ Humble bragging ("Another one closed!")
❌ Asking for business directly
❌ Stock photos or AI images (people can tell)
❌ Starting with your credentials

# WHAT DRIVES ENGAGEMENT (DO THESE)
✅ Contrarian hot takes ("Everyone says wait - here's why now is perfect")
✅ Specific numbers and examples (not "homes are selling fast" → "3 offers in 4 hours on Oak St")
✅ Story-driven value ("My buyer almost walked away - then...")
✅ Myth-busting format ("3 things your lender won't tell you")
✅ Behind-the-scenes reality ("What really happens after you make an offer")
✅ Vulnerable moments ("I lost a listing today and here's what I learned")
✅ Useful frameworks ("The 72-hour rule for buyers")
✅ Local micro-content ("Why Maple Street sold for 30% over asking")

# HOOK FRAMEWORKS (Choose one that fits)
1. **The Unexpected Number**: "I analyzed 247 closings and found something wild..."
2. **The Contrarian Take**: "Everyone's waiting for rates to drop. Big mistake. Here's why..."
3. **The Pattern Interrupt**: "My client cried in the inspection. Not why you'd think..."
4. **The Myth Buster**: "Your real estate agent is probably lying to you about this..."
5. **The Confession**: "I tell my buyers to walk away if..."
6. **The Specific Story**: "House on Oak Street had 3 offers in 4 hours. Here's the ONE thing the winner did..."

# REQUIRED OUTPUT STRUCTURE
<hook>
[First line that creates curiosity or pattern interrupt]
${platform === 'instagram' ? '(Max 125 chars - this shows before "more" button)' : ''}
${platform === 'linkedin' ? '(First 3 lines visible in feed)' : ''}
${platform === 'facebook' ? '(First 2 lines show in feed)' : ''}
GOOD EXAMPLE (${platform}): "I lost 3 listings this week to the same agent. Here's her unfair advantage..."
BAD EXAMPLE: "Hey everyone! Want to talk about the current real estate market and what's happening lately?"
</hook>

<body>
[Value delivery - specific, story-driven, or data-backed]
GOOD EXAMPLE: "She sends video CMAs. Not PDFs - actual 90-second screen recordings walking through comps, explaining why each adjustment matters. Sellers say it's like having a consultant, not just an agent."
BAD EXAMPLE: "The market has been really interesting with a lot of changes. Inventory is shifting and there are opportunities for both buyers and sellers depending on their situation."
</body>

<cta>
[Clear next action that feels natural]
GOOD EXAMPLE (saves/shares): "Save this if you're interviewing agents. Send to someone house hunting."
GOOD EXAMPLE (comments): "What's the best/worst pitch you've heard from an agent? 👇"
BAD EXAMPLE: "If you're thinking about buying or selling, reach out to me!"
</cta>

${platform === 'instagram' || platform === 'tiktok' ? `
<hashtags>
[3-5 strategic hashtags - mix of reach and niche]
GOOD EXAMPLE: #RealEstateTips #FirstTimeHomeBuyer #[YourCity]RealEstate #HomeBuyingMistakes #RealTalk
BAD EXAMPLE: #RealEstate #Realtor #HousesForSale #BuyAHome #SellYourHouse
</hashtags>
` : ''}

# VOICE CALIBRATION FOR ${platform.toUpperCase()}
- Write in first person (I, my, we)
- Use conversational language and contractions
- ${platform === 'linkedin' ? 'Professional but personal - vulnerable + credible' : 'Relatable and authentic'}
- ${platform === 'tiktok' ? 'Fast-paced, punchy, millennial/gen-z energy' : ''}
- Avoid emojis unless they ADD meaning (not decoration)
- Short sentences. Vary length. Create rhythm.

# QUALITY CHECKLIST
□ Would I stop scrolling for this?
□ Does it provide real value (not just promotion)?
□ Is it specific (not generic market talk)?
□ Does it sound human (not AI-generated)?
□ Is there a story or concrete example?
□ Would someone SAVE or SHARE this?
□ Is the CTA natural (not pushy)?
${platform === 'instagram' || platform === 'tiktok' ? '□ Are hashtags strategic (not spammy)?' : ''}

Now write a ${platform} post about ${topic.replace('-', ' ')} that stops the scroll and drives REAL engagement.`;
}

function generateEmailSequencePrompt(answers: Record<string, string>): string {
  const audience = answers.audience || 'new-leads';
  const emails = answers.emails || '3';
  const context = answers.context || '';

  return `You are a conversion copywriter who specializes in nurture sequences for real estate. Your emails build trust, provide value, and move people toward taking action.

TASK: Write a ${emails}-email drip sequence for ${audience.replace('-', ' ')}.

CONTEXT:
${context}

CONSTRAINTS:
- Each email should stand alone (they may not read previous emails)
- Subject lines must get opened (create curiosity, promise value, be specific)
- Body copy should be scannable (short paragraphs, bullet points, white space)
- Every email needs ONE clear call-to-action
- Progressive value: Email 1 = quick win, Email 2 = deeper value, Email 3+ = strategic insights
- DO NOT sound like a newsletter or marketing email
- DO NOT use "I hope this email finds you well", "reaching out", "just wanted to", "checking in"
- DO NOT be pushy or salesy

TONE:
- Helpful, not salesy
- Conversational, not corporate
- Confident, not desperate

OUTPUT FORMAT FOR EACH EMAIL:
Email [#]:
Subject Line: [Specific, curiosity-driven, benefit-focused]
Preview Text: [First 40 characters that appear after subject]
Body: [Main content with clear structure]
CTA: [One specific action to take]
---

Write all ${emails} emails. Number them clearly.`;
}

function generateListingDescriptionPrompt(answers: Record<string, string>): string {
  const propertyType = answers['property-type'] || 'single-family';
  const details = answers.details || '';
  const vibe = answers.vibe || 'professional';

  const toneGuidance = {
    professional: 'Clean, clear, factual - focus on features and benefits',
    storytelling: 'Paint a picture of the lifestyle, use sensory details',
    luxury: 'Sophisticated vocabulary, emphasize exclusivity and quality',
    casual: 'Friendly and warm, like you\'re describing it to a friend'
  };

  return `You are a real estate copywriter who writes listing descriptions that make buyers want to schedule a showing immediately.

TASK: Write an MLS listing description for a ${propertyType.replace('-', ' ')}.

PROPERTY DETAILS:
${details}

STYLE: ${vibe}
${toneGuidance[vibe as keyof typeof toneGuidance]}

CONSTRAINTS:
- Lead with the most compelling feature (not the address)
- Use specific details, not generic adjectives (not "beautiful kitchen" - instead "chef's kitchen with quartz waterfall island and commercial-grade appliances")
- Create urgency without being pushy
- Paint a picture of the lifestyle, not just the house
- Keep it under 250 words (buyers skim)
- DO NOT use: "charming", "cozy" (code for small), "unique" (code for weird), "motivated seller", "won't last long"
- DO NOT list every single feature - highlight what makes it special

OUTPUT FORMAT:
Headline: [Attention-grabbing first sentence]
Body: [2-3 paragraphs with sensory details and lifestyle benefits]
Key Features: [Bulleted list of top 5-7 features]

Write this to sell the lifestyle, not just the house.`;
}

function generateConsultationScriptPrompt(answers: Record<string, string>): string {
  const type = answers.type || 'buyer';
  const stage = answers.stage || 'discovery';
  const context = answers.context || '';

  return `You are a top-producing real estate agent trainer who teaches consultative selling (not pushy sales tactics).

TASK: Write a ${stage.replace('-', ' ')} script for a ${type} consultation.

CONTEXT:
${context}

CONSULTATIVE SELLING PRINCIPLES:
- Ask questions more than you talk (70/30 rule)
- Listen for pain points, motivations, and unstated concerns
- Position yourself as a trusted advisor, not a salesperson
- Use trial closes throughout the conversation
- Handle objections with empathy + evidence + reassurance

CONSTRAINTS:
- Questions should be open-ended (not yes/no)
- Build from surface-level to deeper motivations
- Include natural transitions between topics
- End each section with a micro-commitment
- DO NOT sound scripted or robotic
- DO NOT jump to pitching your services too quickly

OUTPUT FORMAT:
${stage === 'discovery' ? `
Opening: [How to start, build rapport]
Situation Questions: [Understand their current state]
Problem Questions: [Uncover pain points]
Implication Questions: [Explore consequences of inaction]
Need-Payoff Questions: [Get them to articulate why they need you]
Transition to Next Step: [How to move to presentation/close]
` : stage === 'presentation' ? `
Opening: [Tie back to discovery conversation]
Your Unique Value: [Why you vs other agents - specific to their needs]
Process Overview: [What working together looks like]
Social Proof: [Relevant success stories]
Trial Close: [Test for readiness]
` : `
Assumption Close: [Act like they're already working with you]
Address Final Concerns: [Handle last objections]
Paperwork: [How to transition to signing]
Next Steps: [What happens after they sign]
`}

Write this in first person. Use [BRACKETS] for personalization.`;
}

function generateObjectionHandlingPrompt(answers: Record<string, string>): string {
  const objection = answers.objection || 'commission';
  const context = answers.context || '';

  const objectionInsights = {
    commission: 'This is almost never about the money - it\'s about perceived value. They don\'t see the difference between you and a discount agent.',
    timing: 'They have fear or uncertainty. Your job is to reframe timing from perfect (doesn\'t exist) to strategic.',
    price: 'They\'re anchored to an emotional number. You need to separate emotion from market reality.',
    'other-agent': 'They may not be happy with current agent but feel loyal. Give them permission to choose you.',
    'think-about-it': 'This is a stall. Something is missing - trust, urgency, or clarity.'
  };

  return `You are a real estate sales coach who specializes in objection handling using the Feel-Felt-Found framework.

TASK: Write a response to the "${objection.replace('-', ' ')}" objection.

CONTEXT:
${context}

INSIGHT:
${objectionInsights[objection as keyof typeof objectionInsights]}

OBJECTION HANDLING FRAMEWORK:
1. Acknowledge (never argue or dismiss)
2. Empathize (show you understand their concern)
3. Reframe (shift their perspective with evidence/story)
4. Ask (trial close or next step)

CONSTRAINTS:
- Never get defensive or argue
- Use a story or specific example (not generic stats)
- Lead them to the conclusion (don't tell them)
- End with a question that moves forward
- DO NOT use: "I understand, but...", "That's a great question" (filler), "Trust me"
- DO NOT sound like you're reciting a script

OUTPUT FORMAT:
Acknowledge: [Validate their concern]
Empathize: [Show you've heard this before, it's normal]
Reframe: [Story or evidence that shifts perspective]
Ask: [Question that moves to next step]

Optional Alternative Response: [Different angle for same objection]

Write this in first person conversational style.`;
}

function generateOpenHouseFollowupPrompt(answers: Record<string, string>): string {
  const visitorType = answers['visitor-type'] || 'serious-buyer';
  const channel = answers.channel || 'text';
  const context = answers.context || '';

  const channelGuidelines = {
    text: 'Keep it under 160 characters if possible, casual tone, easy to respond to',
    email: 'Subject line is critical, provide value in body, include photos/links'
  };

  return `You are a real estate agent who excels at converting open house visitors into clients through personalized, timely follow-up.

TASK: Write a ${channel} follow-up message for a ${visitorType.replace('-', ' ')} who attended my open house.

CONTEXT:
${context}

CHANNEL GUIDELINES:
${channelGuidelines[channel as keyof typeof channelGuidelines]}

FOLLOW-UP STRATEGY:
- Reference something specific from your conversation (shows you remember them)
- Provide immediate value (answer their question, send comps, share info)
- Make it easy to respond (ask a specific question or offer specific help)
- ${visitorType === 'serious-buyer' ? 'Create urgency if appropriate' : 'Keep door open without being pushy'}

CONSTRAINTS:
- Send within 2 hours of open house (while they're still thinking about it)
- Be warm and personal, not automated
- Include one clear call-to-action
- DO NOT sound like a mass message
- DO NOT be too salesy (they just met you)

OUTPUT FORMAT:
${channel === 'text' ? `
Text Message: [Your message]

Optional Follow-Up Text (if no response after 2 days): [Second touch]
` : `
Subject Line: [Personal, references your conversation]
Body: [Warm opening + value + CTA]
`}

Write this as if you're genuinely trying to help them, not just get a client.`;
}

function generateMarketReportPrompt(answers: Record<string, string>): string {
  const audience = answers.audience || 'general';
  const data = answers.data || '';
  const soWhat = answers['so-what'] || '';

  return `You are a real estate market analyst who translates complex data into clear, actionable insights for ${audience}.

TASK: Write a market report that educates and positions you as the local expert.

MARKET DATA:
${data}

YOUR INTERPRETATION:
${soWhat}

STRUCTURE:
1. Lead with the insight, not the data (so what, then what)
2. Translate stats into real impact ("This means YOU can...")
3. Give specific, actionable advice
4. End with why timing matters now

CONSTRAINTS:
- Use data as proof points, not the headline
- Avoid jargon (inventory, absorption rate, etc.) - use plain English
- Make it relevant to their situation (${audience})
- Create urgency without fear-mongering
- DO NOT be boring or academic
- DO NOT cherry-pick only data that benefits you
- DO NOT make predictions you can't back up

OUTPUT FORMAT:
Headline: [The main insight in one sentence]
What's Happening: [1-2 paragraphs with key data points]
What It Means for ${audience === 'general' ? 'You' : audience}: [Practical implications]
Action Step: [What should they do now?]
Call-to-Action: [Specific next step]

Write this to educate first, sell second. Be the trusted advisor.`;
}

function generateVideoScriptPrompt(answers: Record<string, string>): string {
  const platform = answers.platform || 'reels';
  const topic = answers.topic || 'educational';
  const context = answers.context || '';

  const platformSpecs = {
    reels: '15-60 seconds, hook in first 3 seconds, on-screen text for key points',
    tiktok: '15-60 seconds, trending sounds, fast cuts, direct to camera',
    youtube: '3-8 minutes, thumbnail + title optimization, pattern: hook → value → CTA',
    stories: '15 seconds per slide, casual and raw, direct to camera'
  };

  return `You are a content creator who specializes in real estate videos that actually get watched (not skipped).

TASK: Write a ${platform} video script about ${topic.replace('-', ' ')}.

CONTEXT:
${context}

PLATFORM SPECS:
${platformSpecs[platform as keyof typeof platformSpecs]}

VIDEO STRUCTURE:
- Hook (0-3 sec): Pattern interrupt - start mid-action or with bold statement
- Value (middle): Deliver on the promise from hook
- CTA (end): Tell them exactly what to do next

CONSTRAINTS:
- Write for SOUND OFF (most people watch without audio)
- Include on-screen text cues
- Keep energy high (don't be monotone)
- Be specific, not generic (use real examples, real numbers)
- DO NOT start with "Hey guys" or "In this video"
- DO NOT have a slow build-up (hook IMMEDIATELY)

OUTPUT FORMAT:
Hook (0-3 sec):
[On-screen text: ___]
[What you say: ___]

Main Content (with timestamps):
[On-screen text: ___]
[What you say: ___]
[Camera direction: ___]

CTA (end):
[On-screen text: ___]
[What you say: ___]

${platform === 'youtube' ? 'Video Title: [Click-worthy, keyword-optimized]\nThumbnail Text: [3-5 words max]' : ''}
${platform === 'tiktok' ? 'Trending Sound Suggestion: [Type of sound that would work]' : ''}

Write this to be performed, not read. Keep it punchy.`;
}

function generateExpiredFSBOPrompt(answers: Record<string, string>): string {
  const type = answers.type || 'expired';
  const format = answers.format || 'letter';
  const context = answers.context || '';

  const typeInsights = {
    expired: 'They\'re frustrated and embarrassed. Show empathy, diagnose what went wrong, offer a different approach.',
    fsbo: 'They think they can save money. Show them the hidden costs and risks they haven\'t considered.',
    withdrawn: 'Something changed - life circumstances or they lost faith. Figure out which, address it.'
  };

  return `You are a real estate agent who specializes in winning ${type.replace('-', ' ')} listings by being genuinely helpful (not pushy).

TASK: Write a ${format} to a ${type.replace('-', ' ')}.

CONTEXT:
${context}

PSYCHOLOGY:
${typeInsights[type as keyof typeof typeInsights]}

STRATEGY:
1. Acknowledge their situation (show you understand)
2. Diagnose the problem (NOT "your agent sucked" - be tactful)
3. Offer specific solution (what you'd do differently)
4. Low-pressure CTA (conversation, not commitment)

CONSTRAINTS:
- Never bad-mouth their previous agent (reflects poorly on you)
- Be specific about what you'd do differently (not "I work harder")
- Include proof (recent ${type} you turned around)
- Make it easy to respond
- DO NOT use scare tactics or desperation
- DO NOT be salesy (they're already skeptical)

OUTPUT FORMAT:
${format === 'letter' ? `
[Handwritten envelope recommended]

Opening: [Empathetic, shows you understand their situation]
Problem Diagnosis: [What likely went wrong - tactfully]
Your Different Approach: [Specific strategy with proof]
Social Proof: [Similar situation you turned around]
CTA: [Low-pressure conversation starter]
P.S.: [Reinforce main benefit or create curiosity]
` : format === 'email' ? `
Subject Line: [Specific to their property/situation]
Opening: [Reference their specific listing]
Value: [Free insight or CMA]
Differentiation: [What you do differently]
CTA: [Easy yes - call, meeting, or question]
` : `
Opening: [How to start the call]
Empathy: [Acknowledge their situation]
Question: [Get them talking about what happened]
Insight: [Share what you noticed about their listing]
Offer: [Specific next step - CMA, consultation]
Close: [How to end without being pushy]
`}

Write this to be helpful first, win the listing second. Build trust.`;
}

function generateCMANarrativePrompt(answers: Record<string, string>): string {
  const situation = answers.situation || 'market-value';
  const data = answers.data || '';
  const recommendation = answers.recommendation || '';

  const situationStrategies = {
    'market-value': 'Reinforce confidence - show them the data supports this price, explain strategy',
    'overpriced': 'Use data to gently bring them to reality - let the numbers tell the story',
    'underpriced': 'Explain trade-offs - speed vs. maximum price, position it as strategic',
    'competitive': 'Show how to win - pricing strategy, positioning, what makes this stand out'
  };

  return `You are a listing agent who uses CMAs to educate sellers and position your pricing recommendation with confidence.

TASK: Write a narrative to accompany a CMA presentation. The situation is: ${situation.replace('-', ' ')}.

CMA DATA:
${data}

YOUR RECOMMENDATION: ${recommendation}

STRATEGY:
${situationStrategies[situation as keyof typeof situationStrategies]}

CMA NARRATIVE STRUCTURE:
1. Market context (what's happening in their neighborhood/price point)
2. Comparable analysis (walk through the comps, explain adjustments)
3. Pricing strategy (why your recommended price wins)
4. What to expect (timeline, activity, adjustments)

CONSTRAINTS:
- Let data lead them to your conclusion (don't just tell them)
- Explain WHY you adjusted comps up or down
- ${situation === 'overpriced' ? 'Be tactful - never say "you\'re wrong"' : 'Be confident in your recommendation'}
- Address their emotional attachment (especially if overpriced)
- Paint a picture of what happens at different price points
- DO NOT use jargon without explaining it
- DO NOT just present numbers without context

OUTPUT FORMAT:
Market Overview: [What's happening in their area - 2-3 sentences]

Comparable Analysis:
Comp 1: [Address, sale price, key differences, adjustment reasoning]
Comp 2: [Address, sale price, key differences, adjustment reasoning]
Comp 3: [Address, sale price, key differences, adjustment reasoning]

Pricing Recommendation: ${recommendation}
[Why this price, strategy, what to expect]

${situation === 'overpriced' ? 'Price Positioning Discussion:\n[How to discuss if they push back on lower price]' : ''}

Action Plan: [Next steps, timeline, what success looks like]

Write this to educate and build confidence in your recommendation.`;
}

function generateThankYouPrompt(answers: Record<string, string>): string {
  const occasion = answers.occasion || 'closing';
  const format = answers.format || 'handwritten';
  const context = answers.context || '';

  const occasionTone = {
    closing: 'Gratitude + excitement for their new chapter + stay-in-touch',
    referral: 'Genuine appreciation + recognition of trust + promise to take care of them',
    review: 'Thankfulness + how much it means + ask them to share with friends',
    anniversary: 'Remember their home-buying journey + check-in + value add'
  };

  return `You are a real estate agent who builds lifelong relationships through genuine, personal communication.

TASK: Write a ${format.replace('-', ' ')} for ${occasion.replace('-', ' ')}.

CONTEXT:
${context}

TONE: ${occasionTone[occasion as keyof typeof occasionTone]}

THANK YOU NOTE PRINCIPLES:
- Be specific (reference details that show you remember them)
- Be genuine (not transactional)
- Make it about them (not about you or future business)
- ${occasion === 'closing' ? 'Include useful info for new homeowners' : ''}
- ${occasion === 'referral' ? 'Update them on how it\'s going with referral' : ''}

CONSTRAINTS:
- Keep it warm and personal
- ${format === 'handwritten' ? 'Write like you talk - not too formal' : ''}
- ${format === 'gift-card' ? 'Keep it brief - fits on a gift card' : ''}
- DO NOT make it about getting more business
- DO NOT be overly formal or stiff
- DO NOT use template language

OUTPUT FORMAT:
${format === 'handwritten' ? `
[Handwritten on nice stationery]

Greeting: [Personal, warm]
Thank you: [Specific to them]
Personal touch: [Something you remember about them]
Well wishes: [For their future]
Closing: [Warm, keeps door open without being salsy]

P.S.: [Optional - useful info or thoughtful detail]
` : format === 'email' ? `
Subject Line: [Personal, warm]
Body: [Thank you + specific memory + well wishes]
Value Add: [${occasion === 'anniversary' ? 'Home maintenance tip, market update' : 'Useful resource'}]
` : `
Gift Card Message (brief):
[Your note - 2-3 sentences max]
`}

${occasion === 'closing' ? 'Gift Pairing Suggestion: [What type of closing gift would pair well with this note]' : ''}

Write this like you're writing to a friend. Be real.`;
}

// Main prompt router (declared after all generators)
function generatePrompt(useCaseId: string, answers: Record<string, string>): string {
  switch (useCaseId) {
    case 'sphere-script':
      return generateCallingScriptPrompt(answers);
    case 'social-content':
      return generateSocialContentPrompt(answers);
    case 'email-sequence':
      return generateEmailSequencePrompt(answers);
    case 'listing-description':
      return generateListingDescriptionPrompt(answers);
    case 'consultation-script':
      return generateConsultationScriptPrompt(answers);
    case 'objection-handling':
      return generateObjectionHandlingPrompt(answers);
    case 'open-house-followup':
      return generateOpenHouseFollowupPrompt(answers);
    case 'market-report':
      return generateMarketReportPrompt(answers);
    case 'video-script':
      return generateVideoScriptPrompt(answers);
    case 'expired-fsbo':
      return generateExpiredFSBOPrompt(answers);
    case 'cma-narrative':
      return generateCMANarrativePrompt(answers);
    case 'thank-you':
      return generateThankYouPrompt(answers);
    default:
      return 'Prompt generation in progress...';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0f1e 0%, #1e293b 100%)', // Darker for better contrast
    color: '#f8fafc', // Increased from #f1f5f9 for AAA contrast (15.2:1)
    padding: '8px', // Reduced from 12px for MacBook Air 13"
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    lineHeight: 1.5, // Reduced from 1.6
  },
  header: {
    textAlign: 'center',
    marginBottom: '12px', // Reduced from 24px
    paddingTop: '8px' // Reduced from 16px
  },
  logo: {
    fontSize: '24px', // Reduced from 28px
    fontWeight: 'bold',
    marginBottom: '4px', // Reduced from 8px
    lineHeight: 1.2,
    background: 'linear-gradient(135deg, #a78bfa 0%, #10b981 100%)', // Brighter purple for contrast
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  tagline: {
    fontSize: '13px', // Reduced from 14px
    color: '#d1d5db', // Increased from #94a3b8 for AAA contrast (10.1:1)
    lineHeight: 1.4,
  },
  stepContainer: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  title: {
    fontSize: '20px', // Reduced from 24px
    fontWeight: 'bold',
    marginBottom: '12px', // Reduced from 24px
    textAlign: 'center',
    letterSpacing: '-0.01em', // Slightly tighter for headings
    lineHeight: 1.3,
    color: '#f8fafc', // Explicit AAA contrast
  },
  subtitle: {
    fontSize: '13px', // Reduced from 14px
    color: '#d1d5db', // Increased from #94a3b8 for AAA contrast (10.1:1)
    marginBottom: '12px', // Reduced from 20px
    textAlign: 'center',
    lineHeight: 1.5,
  },
  categorySection: {
    marginBottom: '20px' // Reduced from 32px for MacBook Air 13"
  },
  categoryTitle: {
    fontSize: '14px', // Increased from 12px for minimum readability
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em', // Improved from 1px for better readability
    color: '#9ca3af', // Increased from #64748b for AA contrast (7.8:1)
    marginBottom: '16px',
    paddingLeft: '4px',
    lineHeight: 1.4,
  },
  useCaseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px' // Increased from 12px for better touch spacing
  },
  useCaseCard: {
    background: 'rgba(21, 27, 46, 0.8)', // Slightly lighter for better card elevation
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '16px', // Reduced from 24px to save space
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    color: '#f8fafc', // AAA contrast
    minHeight: '120px', // Reduced from 156px to fit more on screen
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)', // Adds depth perception
    outline: 'none', // Will add custom focus state
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#d1d5db', // Increased from #94a3b8 for AAA contrast
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '12px', // Reduced from 24px
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    outline: 'none', // Will add custom focus state
  },
  input: {
    width: '100%',
    padding: '12px 14px', // Reduced from 16px
    fontSize: '16px',
    background: 'rgba(21, 27, 46, 0.8)',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#f8fafc', // AAA contrast
    marginBottom: '16px', // Reduced from 24px
    boxSizing: 'border-box',
    lineHeight: 1.4,
    minHeight: '48px', // Reduced from 56px
    outline: 'none', // Will add custom focus state
  },
  textarea: {
    width: '100%',
    padding: '12px 14px', // Reduced from 16px
    fontSize: '16px',
    background: 'rgba(21, 27, 46, 0.8)',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#f8fafc', // AAA contrast
    marginBottom: '16px', // Reduced from 24px
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    lineHeight: 1.5,
    minHeight: '100px', // Reduced from 120px
    outline: 'none', // Will add custom focus state
  },
  selectOption: {
    background: 'rgba(21, 27, 46, 0.8)',
    border: '2px solid #334155',
    borderRadius: '12px',
    padding: '14px', // Reduced from 20px
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    color: '#f8fafc', // AAA contrast
    minHeight: '48px', // Reduced from 56px
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none', // Will add custom focus state
  },
  promptBox: {
    background: 'rgba(21, 27, 46, 0.9)',
    border: '2px solid #a78bfa', // Brighter purple for better contrast
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  promptText: {
    fontSize: '15px', // Increased from 14px for better readability
    lineHeight: '1.7', // Increased from 1.6 for easier reading
    color: '#e5e7eb', // Improved from #e2e8f0 for better contrast
    margin: 0,
    whiteSpace: 'pre-wrap',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif', // Changed from monospace
    letterSpacing: '0.01em', // Slight spacing for readability
  },
  primaryButton: {
    width: '100%',
    padding: '14px 20px', // Reduced from 18px 24px
    fontSize: '16px', // Reduced from 17px
    fontWeight: '600', // Slightly reduced from bold for better readability
    borderRadius: '12px',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    minHeight: '48px', // Reduced from 56px
    transition: 'all 0.2s',
    lineHeight: 1.3,
    letterSpacing: '0.01em',
    outline: 'none', // Will add custom focus state
    boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3)', // Adds depth
  },
  secondaryButton: {
    width: '100%',
    padding: '14px', // Reduced from 18px
    fontSize: '15px', // Reduced from 16px
    fontWeight: '600',
    borderRadius: '12px',
    border: '2px solid #475569',
    background: 'transparent',
    color: '#d1d5db', // Improved from #cbd5e1 for better contrast
    cursor: 'pointer',
    marginTop: '12px', // Reduced from 16px
    minHeight: '48px', // Reduced from 56px
    lineHeight: 1.3,
    outline: 'none', // Will add custom focus state
  },
  ctaBox: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '2px solid #10b981',
    borderRadius: '12px', // Reduced from 16px
    padding: '16px', // Reduced from 24px
    marginBottom: '16px', // Reduced from 24px
    textAlign: 'center'
  },
  historyButton: {
    background: 'rgba(139, 92, 246, 0.15)',
    border: '2px solid #a78bfa', // Increased border visibility
    borderRadius: '10px',
    padding: '10px 16px', // Reduced from 12px 20px
    fontSize: '14px', // Reduced from 15px
    fontWeight: '600',
    color: '#c4b5fd', // Brighter for better contrast
    cursor: 'pointer',
    marginTop: '12px', // Reduced from 16px
    transition: 'all 0.2s',
    minHeight: '44px', // Reduced from 48px
    lineHeight: 1.4,
    outline: 'none', // Will add custom focus state
  },
  historyCard: {
    background: 'rgba(21, 27, 46, 0.8)',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '14px', // Reduced from 20px
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  historyRestoreButton: {
    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', // Brighter gradient
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px', // Reduced from 12px 20px
    fontSize: '14px', // Reduced from 15px
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '44px', // Reduced from 48px
    lineHeight: 1.4,
    outline: 'none', // Will add custom focus state
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
  },
  explainerBox: {
    background: 'rgba(59, 130, 246, 0.12)',
    border: '2px solid #60a5fa', // Brighter blue for better visibility
    borderRadius: '12px',
    padding: '14px', // Reduced from 20px
    marginBottom: '16px', // Reduced from 24px
    color: '#e5e7eb', // Improved contrast
    lineHeight: 1.5, // Reduced from 1.6
  },
};

// Export component
export default PromptCrafter;
