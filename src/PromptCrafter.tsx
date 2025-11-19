import React, { useState, useEffect } from 'react';
import { analytics } from './utils/analytics';

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
  aiOutput?: string; // AI-generated output
  aiVariations?: string[]; // Multiple AI variations
  userRating?: 'good' | 'bad'; // Track quality
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
  defaultValue?: string; // NEW: Smart defaults for better UX
};

// ═══════════════════════════════════════════════════════════════════════════════
// 12 USE CASES
// ═══════════════════════════════════════════════════════════════════════════════

const USE_CASES: UseCase[] = [
  // CONTENT CREATION
  {
    id: 'social-content',
    name: 'Social Media',
    emoji: '📱',
    description: 'Insta, FB, LinkedIn',
    category: 'content',
    exampleOutput: `🏡 JUST LISTED in Boulder Heights!\n\nYour dream mountain retreat awaits. 4 bed, 3.5 bath contemporary masterpiece with:\n✨ Floor-to-ceiling windows framing Flatirons views\n✨ Chef's kitchen with Wolf & Sub-Zero appliances  \n✨ Primary suite sanctuary with spa bath\n✨ Smart home tech throughout\n\n$2.45M | 3,200 sq ft | Built 2019\n\nOpen house this Saturday 1-4pm. Link in bio for full details!\n\n#BoulderRealEstate #LuxuryHomes #MountainLiving #JustListed`
  },
  {
    id: 'video-script',
    name: 'Videos',
    emoji: '🎥',
    description: 'Reels, TikTok, YouTube',
    category: 'content',
    exampleOutput: `[HOOK - First 3 seconds]\n"You're overpaying for your home. Here's how to know."\n\n[Scene 1 - Problem]\n"Most buyers in Austin right now are paying 10-15% over asking. But here's what they don't tell you..."\n\n[Scene 2 - Value]\n"I just saved my client $47,000 by knowing these 3 things the listing agent DIDN'T want us to see:"\n\n1. Days on market (subtle pricing weakness)\n2. Seller motivation (divorce, job relocation)  \n3. Comparable sales in the last 30 days\n\n[Scene 3 - CTA]\n"Want my free buyer negotiation checklist? Link in bio. Let's get you the best deal possible."\n\n[End card: "Follow for more buyer tips"]`
  },
  {
    id: 'virtual-tour-script',
    name: 'Virtual Tours',
    emoji: '🎬',
    description: 'Live walkthrough scripts',
    category: 'content',
    exampleOutput: `**Virtual Tour Script: 123 Oak Street**\n\n[Introduction - 0:00-0:30]\n"Hey everyone! Welcome to 123 Oak Street - this stunning 3-bedroom, 2-bath home in the heart of Riverside. I'm Mike Johnson with Austin Residential, and I'm so excited to show you around today."\n\n"Before we dive in, here are the key stats:"\n• Listed at $489,000\n• 1,850 square feet\n• Built in 2015, meticulously maintained\n• Move-in ready\n\n"Alright, let's start outside and work our way in!"\n\n---\n\n[Exterior - 0:30-2:00]\n"Look at this curb appeal! The mature oak trees give you instant privacy, and the sellers just re-landscaped the front yard last spring."\n\n[Walk up driveway]\n\n"Two-car garage with epoxy floors and built-in storage. And check out this covered front porch - perfect for morning coffee."\n\n**Pro tip:** "Notice the architectural shingles? Those were replaced in 2020, so you've got 20+ years left on the roof."\n\n---\n\n[Entry & Living Room - 2:00-4:00]\n"Step inside... WOW. Look at these vaulted ceilings and natural light. The open floor plan is perfect for entertaining."\n\n[Pan around slowly]\n\n"See that fireplace? It's gas - so cozy in winter but no mess. And these floors are engineered hardwood throughout the main living area."\n\n**Call out features:**\n• Crown molding (custom)\n• Neutral paint (freshly done)\n• Ceiling fans with remote\n\n---\n\n[Kitchen - 4:00-6:30]\n"Okay, this kitchen is the heart of the home. Let me show you why..."\n\n[Open cabinets, drawers]\n\n"Quartz countertops, subway tile backsplash, stainless steel appliances - all updated in 2021. And look at this pantry space!"\n\n**Lifestyle sell:**\n"Imagine hosting Thanksgiving here - the island seats 4, you've got prep space for days, and that window overlooks the backyard so you can keep an eye on the kids."\n\n---\n\n[Primary Bedroom - 6:30-8:30]\n"Down the hall to the primary suite... This is your private retreat."\n\n[Show closet]\n\n"Walk-in closet with custom shelving. And the ensuite bathroom? Chef's kiss."\n\n[Enter bathroom]\n\n"Double vanity, soaking tub, separate tiled shower, and - look up - skylight for natural light. It's like a spa."\n\n---\n\n[Secondary Bedrooms - 8:30-10:00]\n"Two more bedrooms down this hall, both good-sized with ceiling fans and great closet space."\n\n**Positioning:**\n"Perfect for kids, home office, or guest room. Very flexible."\n\n---\n\n[Backyard - 10:00-12:00]\n"Now for my favorite part - let's step outside..."\n\n[Open back door dramatically]\n\n"LOOK at this backyard! Fully fenced, mature trees, covered patio... This is where you'll spend your weekends."\n\n**Lifestyle sell:**\n"I can already see summer BBQs, kids playing on that lawn, maybe a fire pit right there. And it backs up to a greenbelt, so total privacy."\n\n---\n\n[Wrap-Up - 12:00-13:30]\n"Alright, let's recap why this home is special:"\n\n✓ Move-in ready (nothing to do)\n✓ Updated kitchen & bathrooms\n✓ Amazing backyard for entertaining\n✓ Top-rated schools\n✓ Quiet street in a HOT neighborhood\n\n"Priced at $489,000, and based on recent sales, I expect this to go fast - probably with multiple offers."\n\n**Call to Action:**\n"If you want to see it in person, call or text me at 512-555-0199. Showings start this weekend, and I'm scheduling private tours for serious buyers right now."\n\n"Questions? Drop them in the comments and I'll answer every one."\n\n"Thanks for watching - see you at the next one!"\n\n---\n\n**Technical Notes:**\n📱 Shoot vertical for social media (Instagram/TikTok)\n🎥 Use gimbal for smooth walking shots\n💡 Film during golden hour (9-11am) for best light\n🎵 Add upbeat background music (royalty-free)\n⏱️ Keep final video under 2 minutes for attention span`
  },
  {
    id: 'buyer-seller-education',
    name: 'Education',
    emoji: '📚',
    description: 'Guides & explainers',
    category: 'content',
    exampleOutput: `**First-Time Home Buyer Guide: Austin Edition**\n\n---\n\n**Introduction**\n\nBuying your first home in Austin can feel overwhelming - I get it. This guide will walk you through every step so you know exactly what to expect.\n\n**Timeline: 60-90 days from start to keys**\n\n---\n\n**Step 1: Get Pre-Approved (Week 1)**\n\n**What it is:** A lender reviews your finances and tells you how much you can borrow.\n\n**Why it matters:** Sellers won't take you seriously without it. In this market, cash offers are competing against you.\n\n**What you need:**\n• 2 years of tax returns\n• 2 months of bank statements\n• Recent pay stubs\n• List of debts (student loans, car loans, credit cards)\n\n**How long it takes:** 2-3 days\n\n**Pro tip:** Get pre-approved with 2-3 lenders to compare rates. A 0.25% difference = $12,000 over 30 years.\n\n---\n\n**Step 2: Define Your Must-Haves (Week 1)**\n\n**Make two lists:**\n\n**Non-Negotiables:**\n• 3 bedrooms minimum\n• Under 30-minute commute\n• Good schools (if you have/want kids)\n• Safe neighborhood\n\n**Nice-to-Haves:**\n• Updated kitchen\n• Backyard\n• Garage\n• HOA or no HOA?\n\n**Budget Reality Check:**\nYour pre-approval says $450K, but your COMFORT zone might be $400K. Factor in:\n• Property taxes ($6K-8K/year in Austin)\n• HOA fees ($50-300/month)\n• Maintenance (1% of home value/year)\n• Utilities\n\n---\n\n**Step 3: Start Touring Homes (Week 2-4)**\n\n**How many to see:** 10-15 homes before you find "the one"\n\n**What to bring:**\n• Notebook (they all blur together)\n• Tape measure\n• Phone camera (take LOTS of photos)\n• Your agent (me!)\n\n**Red flags to watch for:**\n🚩 Foundation cracks\n🚩 Water stains on ceilings\n🚩 Funky smells (mold, pets, smoke)\n🚩 "Flipped" homes with cheap finishes\n🚩 Homes next to busy roads or power lines\n\n**Green lights:**\n✅ Well-maintained landscaping\n✅ Updated systems (HVAC, water heater, roof)\n✅ Neutral finishes\n✅ Good natural light\n\n---\n\n**Step 4: Make an Offer (Week 4-5)**\n\n**Components of an offer:**\n• Purchase price\n• Earnest money deposit ($2K-5K)\n• Inspection period (7-10 days)\n• Financing contingency\n• Closing date (30-45 days)\n\n**In a competitive market, you might:**\n• Offer above asking (up to 5%)\n• Waive inspection (risky!)\n• Shorten option period\n• Increase earnest money\n• Write a personal letter to seller\n\n**Pro tip:** Don't fall in love with a house until it's under contract. Emotions lead to overpaying.\n\n---\n\n**Step 5: Inspection & Negotiation (Week 5-6)**\n\n**Home inspection ($400-600):**\nA pro checks:\n• Foundation\n• Roof\n• HVAC\n• Plumbing\n• Electrical\n• Pests\n\n**What happens next:**\nYou'll get a 30-page report. Don't panic - every home has issues.\n\n**Focus on:**\n🔴 Safety issues (electrical, structural)\n🔴 Expensive repairs (roof, foundation, HVAC)\n\n**Ignore:**\n• Cosmetic stuff (paint, minor cracks)\n• Normal wear and tear\n\n**Negotiation options:**\n1. Ask seller to fix it\n2. Ask for credit at closing\n3. Lower the purchase price\n4. Walk away (if it's really bad)\n\n---\n\n**Step 6: Appraisal (Week 7)**\n\n**What it is:** Lender hires an appraiser to confirm the home is worth what you're paying.\n\n**Why it matters:** If appraisal comes in LOW, you have options:\n1. Renegotiate price down\n2. Bring more cash to closing (cover the gap)\n3. Walk away\n\n**Example:**\nYou offered $450K. Appraisal says $440K.\n\n• Lender will only loan on $440K\n• You need $10K extra cash OR seller lowers price\n\n---\n\n**Step 7: Final Walkthrough (Week 8)**\n\n**24-48 hours before closing:**\nYou tour the home one last time to verify:\n✓ Repairs were made (if agreed)\n✓ Home is in same condition\n✓ Seller removed all personal items\n✓ Appliances still work\n\n---\n\n**Step 8: Closing Day!**\n\n**What to bring:**\n• Driver's license\n• Cashier's check (or wire funds)\n• Proof of homeowner's insurance\n\n**What you'll sign:** 100+ pages (no joke)\n• Mortgage docs\n• Title transfer\n• Deed\n• Disclosures\n\n**How long it takes:** 1-2 hours\n\n**What you get:**\n🔑 KEYS!\n📄 Deed (you officially own it)\n\n---\n\n**Costs to Expect**\n\n**Upfront:**\n• Earnest money: $2K-5K (goes toward down payment)\n• Inspection: $400-600\n• Appraisal: $500-700\n\n**At Closing:**\n• Down payment: 3-20% of purchase price\n• Closing costs: 2-5% of purchase price ($8K-20K on a $400K home)\n  - Lender fees\n  - Title insurance\n  - Escrow (property taxes, insurance)\n  - Recording fees\n\n**First-Time Buyer Programs:**\n• FHA loan: 3.5% down\n• Conventional: 3-5% down (with PMI)\n• USDA/VA: 0% down (if you qualify)\n• Austin Housing Authority grants\n\n---\n\n**After You Move In**\n\n**Within 30 days:**\n□ Change locks\n□ Update address (USPS, bank, employer)\n□ Set up utilities\n□ Meet neighbors\n□ Locate main water shutoff valve\n\n**Within 6 months:**\n□ Service HVAC\n□ Clean gutters\n□ Check smoke/CO detectors\n□ Start emergency fund (for repairs)\n\n---\n\n**Common Mistakes to Avoid**\n\n❌ Skipping pre-approval\n❌ Maxing out your budget\n❌ Waiving inspection in a hot market\n❌ Buying based on emotions\n❌ Not budgeting for closing costs\n❌ Opening new credit cards before closing\n❌ Changing jobs before closing\n\n---\n\n**Questions?**\n\nCall/text me anytime: 512-555-0199\n\nI'm here to guide you through EVERY step.\n\nLet's find your first home!\n\n[Your Name]\nAustin Residential Group`
  },
  {
    id: 'listing-description',
    name: 'Listings',
    emoji: '🏡',
    description: 'MLS copy that sells',
    category: 'content',
    exampleOutput: `**Luxury Mountain Retreat with Panoramic Views**\n\nDiscover your private sanctuary in Boulder's most sought-after neighborhood. This stunning 4-bedroom, 3.5-bath contemporary masterpiece showcases floor-to-ceiling windows that frame breathtaking Rocky Mountain vistas from every angle.\n\n**Interior Highlights:**\n• Gourmet chef's kitchen with Wolf gas range, Sub-Zero refrigeration, and Carrara marble waterfall island\n• Expansive great room with 18-foot ceilings and custom steel fireplace\n• Primary suite sanctuary featuring spa-inspired ensuite with soaking tub and steam shower\n• Home office with built-in shelving and mountain views\n• Mudroom with custom storage for all your outdoor gear\n\n**Smart Home Features:**\n• Lutron lighting system throughout\n• Nest climate control with zoned heating\n• Integrated audio system  \n• Security cameras and smart locks\n\n**Outdoor Living:**\n• Professionally landscaped .5-acre lot with native plants\n• Covered deck perfect for year-round entertaining\n• Hot tub overlooking the Flatirons\n• 2-car attached garage + workshop space\n\n**The Neighborhood:**\nWalk to Boulder Creek Trail. 10 minutes to Pearl Street. Top-rated schools. This is Colorado living at its finest.\n\n$2,450,000 | 3,200 sq ft | Built 2019 | 0.5 acres`
  },
  {
    id: 'email-sequence',
    name: 'Emails',
    emoji: '📧',
    description: 'Nurture sequences',
    category: 'content',
    exampleOutput: `Subject: Your Austin home's value just changed (here's why)\n\n---\n\nHi Jennifer,\n\nI hope your new year is off to a great start!\n\nI wanted to reach out because something shifted in our Austin market over the holidays that directly impacts your neighborhood.\n\n**What changed:**\nThree homes on your street (Riverside Dr) just sold in the last 45 days — all above asking price, with an average sale price of $487K. That's 12% higher than this time last year.\n\n**What this means for you:**\nIf you've been thinking about selling in the next 6-12 months, spring 2024 might be your window. Here's why:\n\n• Inventory is still historically low (only 2.1 months of supply)\n• Mortgage rates stabilized around 6.8% (buyers are adjusting)\n• Your neighborhood specifically is seeing bidding wars again\n\n**No pressure, just information:**\nI'm not suggesting you sell — I just thought you'd want to know what your home could realistically get in today's market.\n\nIf you're curious, I can send you a quick (no-obligation) market analysis showing:\n✓ What your home would likely sell for today  \n✓ How that compares to last year\n✓ What buyers are looking for right now\n\nJust reply "yes" and I'll put it together for you this week.\n\nEither way, Happy New Year!\n\n[Your Name]\nAustin Residential Group\n512-555-0199`
  },

  // SALES & PROSPECTING
  {
    id: 'sphere-script',
    name: 'Calls',
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
    name: 'Objections',
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
  {
    id: 'negotiation-points',
    name: 'Negotiation',
    emoji: '🤝',
    description: 'Win-win deal points',
    category: 'sales',
    exampleOutput: `**Negotiation Talking Points: Buyer Representation**\n\n---\n\n**Scenario: Multiple Offer Situation**\n\nYour client loves the home at 123 Oak ($489K asking). You know there will be 3-5 other offers.\n\n**Goal:** Win the home WITHOUT overpaying\n\n---\n\n**Strategy 1: Escalation Clause (Smart Overbid)**\n\n**What to say:**\n"We're going to offer $492K with an escalation clause up to $505K in $2K increments."\n\n**Why it works:**\n• Shows you're serious ($3K over asking)\n• Protects against overpaying (only goes up if needed)\n• Beats cash offers psychologically (seller sees $505K potential)\n\n**Pro tip:** "I'll also include proof of funds showing we CAN go to $505K if needed."\n\n---\n\n**Strategy 2: Flexible Close Date**\n\n**What to say:**\n"Let's ask the listing agent when the seller wants to close. Then offer that exact date + a free rent-back if they need it."\n\n**Why it works:**\n• Sellers have timing needs (new job, school, etc.)\n• Rent-back solves moving stress\n• Costs you nothing but wins deals\n\n**Example:**\n"We'll close in 21 days if that works for you, or we can do 45 days with a 2-week free rent-back. Whatever helps you most."\n\n---\n\n**Strategy 3: Inspection for Info Only**\n\n**What to say:**\n"We'll do inspection for information only — we won't ask for repairs under $2,000."\n\n**Why it works:**\n• You still protect yourself (no waiving inspection!)\n• Seller feels confident deal won't fall apart over small stuff\n• You stand out from all-cash, no-inspection offers\n\n⚠️ **Important:** Only do this on newer homes or homes in good condition.\n\n---\n\n**Strategy 4: Appraisal Gap Coverage**\n\n**What to say:**\n"We'll cover up to $10K appraisal gap in cash."\n\n**Why it works:**\n• Seller's #1 fear = appraisal coming in low\n• Shows you're financially strong\n• Rarely actually needed (appraisals usually hit)\n\n**How to phrase it:**\n"If the appraisal comes in below our offer price, we'll cover the difference up to $10,000 in cash."\n\n---\n\n**Strategy 5: Personal Letter (Emotional Connection)**\n\n**What to say:**\n"Let's write a 1-page letter about why you love this home. I'll include a photo of your family."\n\n**Why it works:**\n• Sellers are human (they want to know their home is going to someone who'll love it)\n• Differentiates you from investors/flippers\n• Costs $0\n\n**Letter Template:**\n\nDear [Seller Name],\n\nWe fell in love with your home the moment we walked in. [Specific detail about the home]. We can already picture [personal touch — kids playing in backyard, hosting Thanksgiving, etc.].\n\nWe know you have multiple offers, and we want you to know we'll take great care of the home you've loved.\n\nThank you for considering us.\n\n[Your client's name]\n[Include family photo]\n\n---\n\n**Negotiation Talking Points: Seller Representation**\n\n---\n\n**Scenario: You Have Multiple Offers**\n\nYour listing at 123 Oak ($489K) received 4 offers ranging from $492K-$510K.\n\n**Goal:** Get highest price AND best terms\n\n---\n\n**Step 1: Qualify Each Offer (Not Just Price)**\n\nCreate a scorecard:\n\n| Offer | Price | Down Payment | Contingencies | Close Date | Score |\n|-------|-------|--------------|---------------|------------|-------|\n| A     | $510K | 20% ($102K)  | Inspection + Financing | 45 days | 7/10  |\n| B     | $505K | Cash         | Inspection Only | 21 days | 9/10  |\n| C     | $498K | 25% ($125K)  | None (waived all) | 30 days | 8/10  |\n| D     | $492K | 10% ($49K)   | Inspection + Financing + Appraisal | 60 days | 4/10  |\n\n**Recommendation to Seller:**\n"Offer B is $5K less than Offer A, but it's cash and closes in half the time. I'd take Offer B."\n\n---\n\n**Step 2: Counter the Top 2-3 Offers**\n\n**What to say:**\n"We have multiple strong offers. I'm countering the top 3 at $515K with same terms. Highest and best by 5pm tomorrow."\n\n**Why it works:**\n• Creates urgency\n• Pushes price higher\n• Lets buyers compete against themselves\n\n---\n\n**Step 3: Negotiate Repairs After Inspection**\n\n**Buyer asks for $8K in repairs.**\n\n**❌ Don't say:** "No."\n**✅ Do say:** "I'll give you a $4K credit at closing. That's halfway, and you can use it how you want."\n\n**Why it works:**\n• Shows good faith\n• Buyer controls how money is spent\n• Keeps deal together\n\n---\n\n**Talking Points for Common Situations**\n\n---\n\n**Low Appraisal**\n\n**Buyer's agent:** "Appraisal came in at $480K. We need you to drop the price from $489K."\n\n**You:** "I understand. Here are our options:\n1. I'll drop to $485K (meet halfway)\n2. You bring $9K more cash to closing\n3. We both walk away and I relist\n\nWhat works best for your buyer?"\n\n**Why it works:** Gives options, shows flexibility, maintains leverage\n\n---\n\n**Buyer Wants Seller Concessions**\n\n**Buyer's agent:** "Can seller pay $10K toward buyer's closing costs?"\n\n**You:** "We can do $5K if you increase the purchase price by $5K."\n\n**Why it works:** Net same to seller, helps buyer who's cash-poor\n\n---\n\n**Inspection Issues**\n\n**Buyer's agent:** "Inspection found roof needs replacement ($15K). We want a credit."\n\n**You:** "I'll get 3 roofer quotes. If it's truly $15K, I'll credit $10K. If it's less, I'll fix it. Sound fair?"\n\n**Why it works:** Shows you're reasonable, verifies actual cost, prevents buyer from inflating numbers\n\n---\n\n**Win-Win Negotiation Principles**\n\n1. **Always ask "Why?"**\n   - Buyer offers $20K under asking → "Why that number?"\n   - Seller won't budge on price → "What's driving that?"\n\n2. **Find the hidden needs**\n   - Seller might care more about close date than price\n   - Buyer might need appliances included\n\n3. **Give to get**\n   - "I'll agree to X if you agree to Y"\n\n4. **Use silence**\n   - After making an offer, STOP TALKING\n   - Let the other side respond first\n\n5. **Create urgency (ethically)**\n   - "We have another showing scheduled"\n   - "We're reviewing offers tomorrow at 5pm"\n\n---\n\n**Scripts for Tough Conversations**\n\n**Buyer is emotionally attached, considering overbidding:**\n\n"I know you love this home, but let's run the numbers. If you overpay by $30K, that's an extra $180/month for 30 years. That's $64,800 total. Is this home worth $64K more than the next-best option?"\n\n**Seller is overpriced, not getting offers:**\n\n"We've been on market 45 days with 30 showings and zero offers. The market is telling us something. We have two choices: drop the price by $15K now, or wait 30 more days and drop by $25K. Which would you prefer?"\n\n**Buyer won't budge, but you know seller will take less:**\n\n"What if I could get the seller to $485K? Would you write an offer today at that price?"\n\n[If yes, you now have leverage to push seller]\n\n---\n\n**Final Tips**\n\n✓ Everything is negotiable (price, terms, timing, inclusions)\n✓ Don't negotiate against yourself (wait for counteroffers)\n✓ Know your walk-away number (and stick to it)\n✓ Protect the relationship (you might work with them again)\n✓ Get everything in writing (verbal agreements = worthless)`
  },

  // CLIENT SERVICE
  {
    id: 'open-house-followup',
    name: 'Open House',
    emoji: '🚪',
    description: 'Text/email after visits',
    category: 'service',
    exampleOutput: `**Text Message (send within 2 hours):**\n\nHi Jennifer! Mike Johnson here from today's open house at 123 Oak Street. Thanks for stopping by!\n\nQuick question: On a scale of 1-10, how close is this home to what you're looking for?\n\n(Reply with a number and I'll follow up accordingly)\n\n---\n\n**Email Follow-Up (same day):**\n\nSubject: 123 Oak Street — your feedback?\n\nHi Jennifer,\n\nIt was great meeting you at the open house today! I wanted to follow up while the home is still fresh in your mind.\n\n**Quick recap of 123 Oak:**\n• 3 bed, 2 bath, 1,850 sq ft\n• Updated kitchen (2021)\n• Huge backyard with mature trees\n• Priced at $489,000\n• Multiple offers expected by Tuesday\n\n**Next steps (if you're interested):**\n\n1. I can schedule a private showing for you this weekend\n2. I'll send you the full disclosure packet tonight\n3. We can run numbers on what your offer would need to be to win\n\n**Not the one? No problem.**\nI have 3 other listings coming soon in your price range that might be a better fit. Can I send you details when they go live?\n\nEither way, let me know how I can help!\n\nBest,\nMike Johnson\nAustin Residential Group\n512-555-0199\n\n---\n\n**Follow-Up for "Not Interested" Response:**\n\nThanks for the feedback! Totally understand.\n\nJust so I can help you better — what didn't work about 123 Oak? (Too small? Wrong location? Price?)\n\nI want to make sure I only send you homes that are actually a fit.\n\n---\n\n**Follow-Up for "Very Interested" Response:**\n\nAwesome! Let's move fast — this one will go quickly.\n\nCan you do a private showing tomorrow at 10am or 2pm? I'll bring comps and we can talk strategy.\n\nIn the meantime, get pre-approved if you haven't already. I can connect you with a great lender who closes in 21 days.\n\nSound good?`
  },
  {
    id: 'market-report',
    name: 'Market',
    emoji: '📊',
    description: 'Client-friendly reports',
    category: 'service',
    exampleOutput: `**Q1 2024 Market Update: Austin Real Estate**\n\n---\n\n**The Big Picture**\n\nAustin's real estate market is stabilizing after two years of volatility. Here's what you need to know:\n\n📊 **Median Home Price:** $487,000 (up 3.2% from Q4 2023)\n📅 **Average Days on Market:** 34 days (down from 42 in December)\n🏘️ **Inventory:** 2.8 months (still a seller's market under 6 months)\n💰 **Mortgage Rates:** 6.8% average (holding steady)\n\n---\n\n**What This Means for Sellers**\n\n✅ **Good news:** Homes priced right are selling in under 30 days\n✅ **Multiple offers are back:** 40% of listings receive 2+ offers\n⚠️ **Overpriced homes sit:** Anything 10%+ above comps averages 60+ DOM\n\n**Strategy:** Price aggressively, market heavily, review offers in 7 days.\n\n---\n\n**What This Means for Buyers**\n\n✅ **Good news:** You have more options than last year (inventory up 18%)\n⚠️ **Competition is returning:** Be ready to move fast on the right home\n⚠️ **Rates matter:** $50K in purchase price = $280/month at 6.8%\n\n**Strategy:** Get pre-approved, act decisively, don't overbid emotionally.\n\n---\n\n**Neighborhood Spotlight: Riverside**\n\n🏡 **5 homes sold in the last 60 days**\n💵 **Average sale price:** $512,000 (4.1% above asking)\n⏱️ **Average DOM:** 18 days\n🔥 **Trend:** HOT — seller's market\n\n**What's driving it:** New coffee shop, elementary school ratings, walkability\n\n---\n\n**Looking Ahead: Q2 Forecast**\n\nExpect:\n• Inventory to increase (spring listings)\n• Rates to hold between 6.5-7.2%\n• Buyer demand to stay strong (pent-up from 2023)\n• Prices to grow modestly (2-4% by year-end)\n\n**Bottom line:** If you're thinking of selling, list in March/April. If you're buying, don't wait for rates to drop — you'll face more competition.\n\n---\n\n**Questions?**\n\nWant to know what YOUR home is worth in this market? Reply to this email and I'll send you a free analysis (no obligation).\n\nBest,\n[Your Name]\n[Your Brokerage]\n[Phone]`
  },
  {
    id: 'cma-narrative',
    name: 'CMA',
    emoji: '📈',
    description: 'Explain pricing strategy',
    category: 'service',
    exampleOutput: `**Comparative Market Analysis: 123 Oak Street, Austin TX**\n\n---\n\n**Executive Summary**\n\nBased on recent sales, active listings, and current market conditions, I recommend listing your home at **$489,000**.\n\nHere's how I arrived at that number...\n\n---\n\n**1. Recently Sold Comparables (Last 60 Days)**\n\nThese are the most similar homes to yours that actually sold:\n\n**456 Elm Street** (BEST COMP)\n• 3 bed, 2 bath, 1,820 sq ft (closest match)\n• Sold for $492,000 (2.1% above asking)\n• 18 days on market\n• Similar updates (kitchen, bathrooms)\n\n**789 Maple Avenue**\n• 3 bed, 2 bath, 1,900 sq ft (slightly larger)\n• Sold for $505,000 (at asking price)\n• 24 days on market\n• Larger lot (.35 acres vs your .25)\n\n**321 Pine Street**\n• 3 bed, 2 bath, 1,750 sq ft (smaller)\n• Sold for $478,000 (3.8% above asking)\n• 14 days on market\n• Older kitchen (your advantage)\n\n**What this tells us:**\nHomes in your size range (1,800-1,900 sf) are selling between $478K-$505K, with an average of $491K.\n\n---\n\n**2. Active Competition (Currently on Market)**\n\nThese homes are competing with yours RIGHT NOW:\n\n**654 Oak Street** (2 blocks away)\n• 3 bed, 2 bath, 1,880 sq ft\n• Listed at $509,000 (overpriced)\n• 42 days on market (sitting)\n• No price reduction yet (but coming)\n\n**987 Cedar Lane**\n• 3 bed, 2.5 bath, 1,950 sf\n• Listed at $495,000\n• 12 days on market\n• Getting showings but no offers (priced $10K too high)\n\n**What this tells us:**\nYour competition is priced $495K-$509K but NEITHER is selling. That's a red flag that buyers see value closer to $485-490K.\n\n---\n\n**3. Pending Sales (Under Contract)**\n\nThese accepted offers in the last 14 days:\n\n**147 Birch Drive**\n• 3 bed, 2 bath, 1,860 sq ft\n• Listed at $487,000 → Under contract in 9 days\n• Estimated sale price: $492-495K (based on appraisal)\n\n**What this tells us:**\nHomes priced under $490K are moving FAST. Anything above $500K is sitting.\n\n---\n\n**4. Market Conditions**\n\n📊 **Inventory:** 2.8 months (seller's market)\n📅 **Average DOM:** 34 days in your zip code\n💰 **Sale-to-List Ratio:** 101.2% (homes selling slightly above asking)\n🏘️ **Buyer Demand:** Strong for move-in ready homes under $500K\n\n---\n\n**5. Pricing Strategy Recommendation**\n\n**Option A: List at $489,000** (MY RECOMMENDATION)\n\n✅ Attracts maximum buyers (under $500K psychological barrier)\n✅ Positions you as the best value vs. competition\n✅ Likely to generate multiple offers in first 7 days\n✅ Expected sale price: $492-498K (above asking)\n\n**Option B: List at $499,000**\n\n⚠️ Eliminates 30% of qualified buyers (search filters)\n⚠️ Longer time on market (30-45 days)\n⚠️ Risk of price reduction (looks desperate)\n⚠️ Expected sale price: $490-495K (after reduction)\n\n**Option C: List at $479,000**\n\n✅ Would sell in 48 hours with multiple offers\n❌ Leaving $10-15K on the table unnecessarily\n\n---\n\n**My Recommendation: $489,000**\n\nThis price:\n• Reflects true market value\n• Attracts serious, qualified buyers\n• Creates urgency and competition\n• Maximizes your net proceeds\n\nWe'll review all offers after 7 days and likely see bids in the $490-500K range.\n\n**Questions? Let's discuss.**\n\n[Your Name]\n[Phone]\n[Email]`
  },
  {
    id: 'thank-you',
    name: 'THANK YOUS',
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
  const [showPrompt, setShowPrompt] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [copiedPromptFromViewer, setCopiedPromptFromViewer] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Quick Mode state (Phase 2)
  const [quickMode, setQuickMode] = useState(() => {
    // Load Quick Mode preference from localStorage
    const saved = localStorage.getItem('promptCrafterQuickMode');
    return saved === null ? false : saved === 'true'; // Default to false (show questions)
  });

  // Voice Personalization (Phase 2)
  const [voicePreference, setVoicePreference] = useState(() => {
    const saved = localStorage.getItem('promptCrafterVoicePreference');
    return saved || 'professional'; // Default to professional
  });

  // Listing Data Fetching (Virtual Tour Auto-Fetch)
  const [listingData, setListingData] = useState<any>(null);
  const [isFetchingListing, setIsFetchingListing] = useState(false);
  const [listingNotFound, setListingNotFound] = useState(false);
  const [editableListingData, setEditableListingData] = useState<any>(null);

  // Save Quick Mode preference
  useEffect(() => {
    localStorage.setItem('promptCrafterQuickMode', String(quickMode));
  }, [quickMode]);

  // Save Voice Preference
  useEffect(() => {
    localStorage.setItem('promptCrafterVoicePreference', voicePreference);
  }, [voicePreference]);

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

  // Auto-resize iframe for Squarespace embedding
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    // Send initial height
    sendHeight();

    // Send height on window resize
    window.addEventListener('resize', sendHeight);

    // Send height when content changes (DOM mutations)
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', sendHeight);
      observer.disconnect();
    };
  }, [state.step, generatedOutput, isGenerating, showHistory]);

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

  // Fetch listing data from MLS/Zillow/Redfin/Trulia
  const fetchListingData = async (address: string, propertyType?: string) => {
    setIsFetchingListing(true);
    setListingNotFound(false);
    setListingData(null);

    try {
      const searchQuery = propertyType
        ? `${propertyType} at ${address}`
        : address;

      const response = await fetch('/api/fetch-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: searchQuery })
      });

      const data = await response.json();

      if (data.found) {
        setListingData(data);
        setEditableListingData(data); // Copy for editing
        console.log('[PromptCrafter] Listing found:', data.address);
      } else {
        setListingNotFound(true);
        console.log('[PromptCrafter] Listing not found for:', searchQuery);
      }
    } catch (error) {
      console.error('[PromptCrafter] Error fetching listing:', error);
      setListingNotFound(true);
    } finally {
      setIsFetchingListing(false);
    }
  };

  // Cycle through funny loading messages
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingMessage(prev => (prev + 1) % 8);
      }, 2000); // Change message every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleUseCaseSelect = (useCaseId: string) => {
    // Track when user starts
    analytics.track('PromptCrafter_Started', {
      useCase: useCaseId,
      timestamp: Date.now()
    });

    // Store start time for duration tracking
    analytics.setSessionData(`${useCaseId}_startTime`, Date.now());
    analytics.setSessionData(`${useCaseId}_initialDefaults`, {});

    // Quick Mode: Skip questions and generate immediately with defaults
    if (quickMode) {
      const questions = getQuestionsForUseCase(useCaseId);
      const defaultAnswers: Record<string, string> = {};

      questions.forEach(q => {
        if (q.defaultValue) {
          defaultAnswers[q.id] = q.defaultValue;
        }
      });

      setState({
        ...state,
        selectedUseCase: useCaseId,
        step: 4, // Jump to result screen
        answers: defaultAnswers
      });

      // Immediately generate with defaults
      setTimeout(() => handleGenerate(), 100);
    } else {
      // Normal mode: Show questions
      setState({ ...state, selectedUseCase: useCaseId, step: 1, answers: {} });
    }
  };

  const handleAnswer = (questionId: string, value: string) => {
    setState({
      ...state,
      answers: { ...state.answers, [questionId]: value }
    });

    // Track if user modified a default value
    if (state.selectedUseCase) {
      const questions = getQuestionsForUseCase(state.selectedUseCase);
      const question = questions.find(q => q.id === questionId);

      if (question?.defaultValue && value !== question.defaultValue) {
        analytics.track('Default_Modified', {
          useCase: state.selectedUseCase,
          questionId: questionId,
          defaultValue: question.defaultValue,
          userValue: value
        });
      }
    }
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

  const handleGenerateVariations = async (count: number = 3) => {
    // First, generate the prompt if it doesn't exist
    if (!state.generatedPrompt) {
      handleGeneratePrompt();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsGenerating(true);
    setGeneratedOutput(null);
    setShowPrompt(false);
    setLoadingMessage(0);

    const promptToUse = generatePrompt(state.selectedUseCase!, state.answers, voicePreference);
    const variations: string[] = [];

    try {
      // Generate multiple variations in parallel
      const promises = Array.from({ length: count }, async (_, i) => {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptToUse + `\n\nNote: This is variation ${i + 1} of ${count}. Make it unique from the others.`,
            userInput: JSON.stringify(state.answers)
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Generation failed');
        }

        return data.output || data.result || 'No output received';
      });

      const results = await Promise.all(promises);
      variations.push(...results);

      setGeneratedOutput(variations[0]); // Show first variation by default

      // 🎉 CELEBRATION TIME!
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);

      // Track completion
      const startTime = analytics.getSessionData(`${state.selectedUseCase}_startTime`);
      const duration = startTime ? Date.now() - startTime : 0;
      const defaultsChanged = countDefaultsChanged();

      analytics.track('PromptCrafter_Completed', {
        useCase: state.selectedUseCase!,
        duration: duration,
        defaultsChanged: defaultsChanged,
        timestamp: Date.now()
      });

      analytics.track('AI_Generated', {
        useCase: state.selectedUseCase!,
        success: true
      });

      // Clear session data
      analytics.clearSessionData(`${state.selectedUseCase}_startTime`);

      // Update history with first variation
      const updatedHistory = history.map(item =>
        item.id === history[0]?.id
          ? { ...item, aiOutput: variations[0], aiVariations: variations }
          : item
      );
      setHistory(updatedHistory);
    } catch (error: any) {
      console.error('AI Generation error:', error);
      const errorMessage = error?.message || 'Unknown error';
      console.error('Error details:', errorMessage);

      setGeneratedOutput(`Unable to generate content. Error: ${errorMessage}\n\nPlease try copying the prompt to ChatGPT manually.`);

      analytics.track('AI_Generated', {
        useCase: state.selectedUseCase!,
        success: false,
        error: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    // Wrapper that calls handleGenerateVariations with count=1
    await handleGenerateVariations(1);
  };

  // Helper function to count how many defaults were changed
  const countDefaultsChanged = (): number => {
    if (!state.selectedUseCase) return 0;

    const questions = getQuestionsForUseCase(state.selectedUseCase);
    let changed = 0;

    questions.forEach(q => {
      if (q.defaultValue && state.answers[q.id] && state.answers[q.id] !== q.defaultValue) {
        changed++;
      }
    });

    return changed;
  };

  const handleCopyPromptFromViewer = () => {
    navigator.clipboard.writeText(state.generatedPrompt);
    setCopiedPromptFromViewer(true);
    setTimeout(() => setCopiedPromptFromViewer(false), 2000);
  };

  const handleCopyOutput = () => {
    if (generatedOutput) {
      navigator.clipboard.writeText(generatedOutput);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);

      // Track copy event
      analytics.track('Prompt_Copied', {
        useCase: state.selectedUseCase!
      });
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
    // Track abandon if user resets before completing
    if (state.selectedUseCase && state.step > 0 && state.step < 4 && !generatedOutput) {
      const questions = getQuestionsForUseCase(state.selectedUseCase);
      analytics.track('PromptCrafter_Abandoned', {
        useCase: state.selectedUseCase,
        stepReached: state.step,
        totalSteps: questions.length + 1 // +1 for final generate step
      });

      // Clear session data
      analytics.clearSessionData(`${state.selectedUseCase}_startTime`);
    }

    setState({
      step: 0,
      selectedUseCase: null,
      answers: {},
      generatedPrompt: ''
    });
    setShowHistory(false);
    setGeneratedOutput(null);
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

        /* Fun Loading Animations */
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Celebration Confetti */
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes pulse-celebration {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .confetti {
          position: fixed;
          width: 10px;
          height: 10px;
          background: #fbbf24;
          animation: confetti-fall 3s linear forwards;
          z-index: 9999;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* 🎉 CELEBRATION CONFETTI OVERLAY 🎉 */}
      {showCelebration && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          overflow: 'hidden'
        }}>
          {/* Confetti pieces */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                background: ['#fbbf24', '#f59e0b', '#8b5cf6', '#a78bfa', '#10b981', '#ec4899'][Math.floor(Math.random() * 6)],
                animationDelay: `${Math.random() * 0.5}s`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0'
              }}
            />
          ))}
          {/* Big celebration emoji */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '120px',
            animation: 'pulse-celebration 0.6s ease-in-out 3',
            filter: 'drop-shadow(0 8px 24px rgba(139, 92, 246, 0.5))'
          }}>
            🎉
          </div>
        </div>
      )}

      <div style={styles.container}>
        {/* Header - History Button Only */}
        {history.length > 0 && !showHistory && (
          <div style={styles.header}>
            <button
              onClick={() => {
                setShowHistory(true);
                analytics.track('History_Viewed', {
                  historyCount: history.length
                });
              }}
              style={styles.historyButton}
              aria-label={`View prompt history, ${history.length} saved ${history.length === 1 ? 'prompt' : 'prompts'}`}
            >
              📜 Previous Listings ({history.length})
            </button>
          </div>
        )}

      {/* History View */}
      {showHistory && (
        <div style={styles.stepContainer}>
          <button onClick={() => setShowHistory(false)} style={styles.backButton}>
            ← Back
          </button>
          <h2 style={styles.title}>Your Recent Listing Descriptions</h2>
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
            Create New Description
          </button>
        </div>
      )}

      {/* Step 0: Welcome Screen */}
      {!showHistory && state.step === 0 && (
        <div style={styles.stepContainer}>
          <div style={{
            textAlign: 'center' as const,
            maxWidth: '800px',
            margin: '0 auto',
            padding: '60px 20px'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#f1f5f9',
              marginBottom: '20px',
              lineHeight: '1.2'
            }}>
              Create the Perfect Listing Description
            </h1>

            <p style={{
              fontSize: '20px',
              color: '#94a3b8',
              marginBottom: '40px',
              lineHeight: '1.6'
            }}>
              Powered by a 6-expert review system that transforms property details into compelling descriptions that sell
            </p>

            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '30px',
              marginBottom: '40px',
              textAlign: 'left' as const
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#10b981',
                marginBottom: '20px'
              }}>
                How It Works:
              </h3>
              <div style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#f1f5f9' }}>1. Junior Copywriter</strong> - Creates energetic, engaging draft
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#f1f5f9' }}>2. Senior Copy Editor</strong> - Refines for clarity and impact
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#f1f5f9' }}>3. Literary Author</strong> - Adds vivid, sensory storytelling
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#f1f5f9' }}>4. Investigative Journalist</strong> - Fact-checks and adds credibility
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#f1f5f9' }}>5. Persuasion Expert</strong> - Optimizes for conversion psychology
                </div>
                <div>
                  <strong style={{ color: '#f1f5f9' }}>6. Veteran Realtor</strong> - Final polish with real-world selling expertise
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setState({ ...state, selectedUseCase: 'listing-description', step: 1, answers: {} });
              }}
              style={{
                ...styles.primaryButton,
                fontSize: '20px',
                padding: '18px 48px',
                minWidth: '200px'
              }}
            >
              Get Started
            </button>
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

            {(() => {
              // If expandedExample is a category, show first use case with example from that category
              const categoryMap: Record<string, string> = { content: 'content', sales: 'sales', service: 'service' };
              if (categoryMap[expandedExample as string]) {
                const firstWithExample = USE_CASES.find(uc =>
                  uc.category === expandedExample && uc.exampleOutput
                );
                if (firstWithExample?.exampleOutput) {
                  return (
                    <pre style={{
                      fontSize: '14px',
                      lineHeight: '1.7',
                      color: '#e5e7eb',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '0.01em',
                    }}>
                      {firstWithExample.exampleOutput}
                    </pre>
                  );
                }
              }
              // Otherwise show individual use case example
              const useCase = USE_CASES.find(uc => uc.id === expandedExample);
              if (useCase?.exampleOutput) {
                return (
                  <pre style={{
                    fontSize: '14px',
                    lineHeight: '1.7',
                    color: '#e5e7eb',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '0.01em',
                  }}>
                    {useCase.exampleOutput}
                  </pre>
                );
              }
              return null;
            })()}
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
          onGenerate={handleGenerate}
          fetchListingData={fetchListingData}
          isFetchingListing={isFetchingListing}
          listingData={listingData}
          listingNotFound={listingNotFound}
          editableListingData={editableListingData}
          setEditableListingData={setEditableListingData}
          setState={setState}
          state={state}
        />
      )}

      {/* Step 4: Generated Content (AI-First) */}
      {!showHistory && state.step === 4 && (
        <div style={styles.stepContainer}>
          {/* Back Button - Uniform across all steps */}
          <button
            onClick={() => setState({ ...state, step: Math.max(0, state.step - 1) })}
            style={styles.backButton}
          >
            ← Back
          </button>

          {generatedOutput && <h2 style={styles.title}>Your Content is Ready!</h2>}

          {!generatedOutput ? (
            // Before AI generation
            <>
              {isGenerating ? (
                // 🎉 FUN LOADING SCREEN 🎉
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                  border: '2px solid #8b5cf6',
                  borderRadius: '20px',
                  padding: '40px 24px',
                  marginBottom: '24px',
                  textAlign: 'center',
                  minHeight: '300px',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '24px'
                }}>
                  {/* Bouncing House Animation */}
                  <div style={{
                    fontSize: '80px',
                    animation: 'bounce 1s ease-in-out infinite',
                    filter: 'drop-shadow(0 4px 12px rgba(139, 92, 246, 0.3))'
                  }}>
                    🏡
                  </div>

                  {/* Funny Loading Messages */}
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#f8fafc',
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {[
                      "Teaching AI about curb appeal... 🌳",
                      "Sprinkling in some real estate magic... ✨",
                      "Consulting with virtual staging experts... 🎨",
                      "Checking comps in the AI neighborhood... 📊",
                      "Polishing those power words... 💎",
                      "Making sure it's commission-worthy... 💰",
                      "Adding that 'location, location, location' vibe... 📍",
                      "Almost done! Just staging the content... 🪴"
                    ][loadingMessage]}
                  </div>

                  {/* Spinning Progress Indicators */}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '24px' }}>
                    <span style={{ animation: 'spin 2s linear infinite' }}>📝</span>
                    <span style={{ animation: 'spin 2.5s linear infinite' }}>🤖</span>
                    <span style={{ animation: 'spin 3s linear infinite' }}>✨</span>
                  </div>

                  {/* Show Prompt Toggle */}
                  <button
                    onClick={() => setShowPrompt(!showPrompt)}
                    style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid #8b5cf6',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      color: '#d1d5db',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {showPrompt ? '👁️ Hide' : '🤓 Show'} what we sent to AI
                  </button>

                  {/* Show the actual prompt if toggled */}
                  {showPrompt && (
                    <div style={{ width: '100%' }}>
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        padding: '16px',
                        marginTop: '8px',
                        maxHeight: '200px',
                        overflow: 'auto',
                        width: '100%',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#cbd5e1',
                        fontFamily: 'monospace',
                        lineHeight: '1.6'
                      }}>
                        {state.generatedPrompt}
                      </div>
                      <button
                        onClick={handleCopyPromptFromViewer}
                        style={{
                          marginTop: '8px',
                          background: copiedPromptFromViewer ? '#10b981' : 'rgba(139, 92, 246, 0.2)',
                          border: '1px solid ' + (copiedPromptFromViewer ? '#10b981' : '#8b5cf6'),
                          borderRadius: '8px',
                          padding: '8px 16px',
                          color: copiedPromptFromViewer ? '#ffffff' : '#d1d5db',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          width: '100%'
                        }}
                      >
                        {copiedPromptFromViewer ? '✓ Copied to clipboard!' : '📋 Copy prompt to clipboard'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Voice Preference Selector */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                    border: '2px solid #8b5cf6',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '24px' }}>🎯</span>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#f8fafc',
                        margin: 0
                      }}>Choose Your Voice</h3>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: '#d1d5db',
                      marginBottom: '16px',
                      lineHeight: '1.5'
                    }}>
                      How should AI write this content?
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px'
                    }}>
                      {[
                        { value: 'professional', emoji: '👔', label: 'Professional', desc: 'Polished & trustworthy' },
                        { value: 'casual', emoji: '☕', label: 'Casual', desc: 'Warm & friendly' },
                        { value: 'enthusiastic', emoji: '⚡', label: 'Enthusiastic', desc: 'Energetic & inspiring' },
                        { value: 'empathetic', emoji: '💙', label: 'Empathetic', desc: 'Caring & understanding' }
                      ].map(voice => (
                        <button
                          key={voice.value}
                          onClick={() => setVoicePreference(voice.value)}
                          style={{
                            background: voicePreference === voice.value
                              ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)'
                              : 'rgba(21, 27, 46, 0.8)',
                            border: voicePreference === voice.value
                              ? '2px solid #a78bfa'
                              : '2px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '12px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left' as const
                          }}
                          onMouseEnter={(e) => {
                            if (voicePreference !== voice.value) {
                              e.currentTarget.style.borderColor = '#8b5cf6';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (voicePreference !== voice.value) {
                              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                            }
                          }}
                        >
                          <div style={{
                            fontSize: '28px',
                            marginBottom: '8px'
                          }}>
                            {voice.emoji}
                          </div>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#f8fafc',
                            marginBottom: '4px'
                          }}>
                            {voice.label}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#9ca3af',
                            lineHeight: '1.4'
                          }}>
                            {voice.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

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
                    style={{
                      ...styles.primaryButton,
                      background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                      marginBottom: '16px'
                    }}
                  >
                    ✨ Generate with AI
                  </button>
                </>
              )}

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
              {/* AI Generated Output Box */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '2px solid #10b981',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981', marginBottom: '12px' }}>
                  ✨ AI Generated Result:
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

              {/* Copy Button - directly below output */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={handleCopyOutput}
                  style={{
                    ...styles.primaryButton,
                    background: copiedOutput ? '#10b981' : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                    width: '100%',
                    marginTop: 0
                  }}
                >
                  {copiedOutput ? '✓ Copied!' : '📋 Copy Result'}
                </button>
              </div>
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
  onGenerate,
  fetchListingData,
  isFetchingListing,
  listingData,
  listingNotFound,
  editableListingData,
  setEditableListingData,
  setState,
  state
}: {
  useCaseId: string;
  currentStep: number;
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onGenerate: () => void;
  fetchListingData?: (address: string, propertyType?: string) => Promise<void>;
  isFetchingListing?: boolean;
  listingData?: any;
  listingNotFound?: boolean;
  editableListingData?: any;
  setEditableListingData?: (data: any) => void;
  setState?: (state: any) => void;
  state?: any;
}) {
  const questions = getQuestionsForUseCase(useCaseId);
  const currentQuestion = questions[currentStep - 1];

  // Auto-fill smart defaults when use case loads
  useEffect(() => {
    questions.forEach(q => {
      if (q.defaultValue && !answers[q.id]) {
        onAnswer(q.id, q.defaultValue);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCaseId]); // Only run when use case changes, not on every answer update

  if (!currentQuestion) {
    return null;
  }

  const isLastQuestion = currentStep === questions.length;
  const canContinue = answers[currentQuestion.id]?.trim().length > 0;

  // Special handling for auto-fetch listing data (virtual-tour-script & listing-description)
  const shouldFetchListing = (useCaseId === 'virtual-tour-script' || useCaseId === 'listing-description') &&
                              currentQuestion.id === 'property-address';
  const isVirtualTourAddress = shouldFetchListing; // Keep for backwards compatibility

  // Handle Next button click with special logic for virtual tour
  const handleNextClick = async () => {
    if (isVirtualTourAddress && fetchListingData) {
      const address = answers['property-address'];
      const propertyType = answers['property-type'];
      if (address) {
        await fetchListingData(address, propertyType);
        // Don't advance to next step - wait for user to confirm listing data
      }
    } else {
      isLastQuestion ? onGenerate() : onNext();
    }
  };

  // Show listing confirmation UI if we've fetched data for virtual tour
  if (isVirtualTourAddress && (isFetchingListing || listingData || listingNotFound)) {
    return (
      <div style={styles.stepContainer}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back
        </button>

        {isFetchingListing ? (
          <>
            <h2 style={styles.title}>🔍 Searching for listing...</h2>
            <p style={styles.subtitle}>Checking Zillow, Redfin, MLS, and Trulia</p>
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '2px solid #8b5cf6',
              borderRadius: '16px',
              padding: '40px 24px',
              textAlign: 'center',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{
                fontSize: '60px',
                animation: 'bounce 1s ease-in-out infinite'
              }}>
                🏡
              </div>
              <div style={{ fontSize: '16px', color: '#d1d5db' }}>
                Searching online listings...
              </div>
            </div>
          </>
        ) : listingData && listingData.found ? (
          <>
            <h2 style={styles.title}>✅ Found it! Please confirm</h2>
            <p style={styles.subtitle}>Edit any details that are incorrect</p>

            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid #10b981',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <label>
                  <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>Address</div>
                  <input
                    type="text"
                    value={editableListingData?.address || ''}
                    onChange={(e) => setEditableListingData && setEditableListingData({ ...editableListingData, address: e.target.value })}
                    style={styles.input}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <label>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>Bedrooms</div>
                    <input
                      type="number"
                      value={editableListingData?.bedrooms || ''}
                      onChange={(e) => setEditableListingData && setEditableListingData({ ...editableListingData, bedrooms: parseInt(e.target.value) || 0 })}
                      style={styles.input}
                    />
                  </label>
                  <label>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>Bathrooms</div>
                    <input
                      type="number"
                      step="0.5"
                      value={editableListingData?.bathrooms || ''}
                      onChange={(e) => setEditableListingData && setEditableListingData({ ...editableListingData, bathrooms: parseFloat(e.target.value) || 0 })}
                      style={styles.input}
                    />
                  </label>
                  <label>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>Sq Ft</div>
                    <input
                      type="number"
                      value={editableListingData?.squareFeet || ''}
                      onChange={(e) => setEditableListingData && setEditableListingData({ ...editableListingData, squareFeet: parseInt(e.target.value) || 0 })}
                      style={styles.input}
                    />
                  </label>
                </div>

                {editableListingData?.price && (
                  <label>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>Price</div>
                    <input
                      type="text"
                      value={editableListingData?.price ? `$${editableListingData.price.toLocaleString()}` : ''}
                      onChange={(e) => {
                        const numValue = parseInt(e.target.value.replace(/\D/g, ''));
                        setEditableListingData && setEditableListingData({ ...editableListingData, price: numValue || 0 });
                      }}
                      style={styles.input}
                    />
                  </label>
                )}

                <label>
                  <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>Features</div>
                  <textarea
                    value={editableListingData?.features?.join(', ') || ''}
                    onChange={(e) => setEditableListingData && setEditableListingData({
                      ...editableListingData,
                      features: e.target.value.split(',').map((f: string) => f.trim()).filter((f: string) => f)
                    })}
                    placeholder="Updated kitchen, hardwood floors, large backyard..."
                    style={styles.textarea}
                    rows={3}
                  />
                </label>

                {editableListingData?.description && (
                  <label>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>Description</div>
                    <textarea
                      value={editableListingData?.description || ''}
                      onChange={(e) => setEditableListingData && setEditableListingData({ ...editableListingData, description: e.target.value })}
                      style={styles.textarea}
                      rows={4}
                    />
                  </label>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (setState && state) {
                  // Save edited listing data to answers
                  setState({
                    ...state,
                    answers: {
                      ...state.answers,
                      'listing-data': JSON.stringify(editableListingData)
                    },
                    step: state.step + 1 // Move to next question
                  });
                }
              }}
              style={styles.primaryButton}
            >
              Looks Good! Continue →
            </button>
          </>
        ) : (
          <>
            <h2 style={styles.title}>❌ We couldn't find this listing online</h2>
            <p style={styles.subtitle}>Please paste the entire listing details including your description. We need all property info to craft the best tour script.</p>

            <textarea
              value={answers['manual-listing-paste'] || ''}
              onChange={(e) => onAnswer('manual-listing-paste', e.target.value)}
              placeholder="Paste listing details here:&#10;&#10;Address: 123 Oak St, Austin, TX&#10;Beds: 4&#10;Baths: 3&#10;Sq Ft: 2,400&#10;Price: $495,000&#10;Features: Updated kitchen with granite counters, hardwood floors throughout, large backyard with deck, 2-car garage...&#10;&#10;Description: Beautiful single-family home in desirable neighborhood..."
              style={{ ...styles.textarea, minHeight: '300px' }}
              rows={12}
              autoFocus
            />

            <button
              onClick={() => {
                if (setState && state && answers['manual-listing-paste']) {
                  setState({ ...state, step: state.step + 1 });
                }
              }}
              disabled={!answers['manual-listing-paste']?.trim()}
              style={{
                ...styles.primaryButton,
                background: answers['manual-listing-paste']?.trim()
                  ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)'
                  : '#475569',
                cursor: answers['manual-listing-paste']?.trim() ? 'pointer' : 'not-allowed',
                color: '#ffffff'
              }}
            >
              Continue with Manual Entry →
            </button>
          </>
        )}
      </div>
    );
  }

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
              handleNextClick();
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
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          {currentQuestion.options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => {
                onAnswer(currentQuestion.id, option.value);
                // Auto-advance after a short delay to show selection
                setTimeout(() => {
                  isLastQuestion ? onGenerate() : onNext();
                }, 300);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAnswer(currentQuestion.id, option.value);
                  setTimeout(() => {
                    isLastQuestion ? onGenerate() : onNext();
                  }, 300);
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
        onClick={handleNextClick}
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

// Define which question IDs are "essential" for Quick Mode
const ESSENTIAL_QUESTIONS: Record<string, string[]> = {
  'market-report': ['market-location', 'audience', 'actionable-insight', 'specific-data'],
  'social-content': ['topic', 'market-location', 'cta'],
  'sphere-script': ['who', 'goal', 'relationship'],
  'listing-description': ['property-type', 'property-address', 'key-features', 'ideal-buyer'],
  'email-sequence': ['audience', 'problem', 'goal'],
  'consultation-script': ['type', 'client-background', 'motivation'],
  'objection-handling': ['objection', 'exact-wording', 'when-in-process'],
  'open-house-followup': ['visitor-name', 'visitor-type', 'what-they-liked', 'channel'],
  'video-script': ['platform', 'length', 'topic', 'specific-content'],
  'expired-fsbo': ['type', 'property-address', 'your-edge', 'format'],
  'cma-narrative': ['property-address', 'property-details', 'your-opinion', 'comparable-sales'],
  'thank-you': ['occasion', 'client-names', 'memorable-moment'],
  'virtual-tour-script': ['property-type', 'property-address', 'tour-highlights'],
  'buyer-seller-education': ['topic', 'audience', 'location'],
  'negotiation-points': ['negotiation-type', 'client-role', 'current-situation', 'client-goals']
};

// Helper function to mark questions as essential or optional (reserved for Quick Mode v2.1)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function markQuestionPriority(question: Question, useCaseId: string, quickMode: boolean): Question & { isEssential: boolean } {
  const essentialIds = ESSENTIAL_QUESTIONS[useCaseId] || [];
  const isEssential = essentialIds.includes(question.id);

  return {
    ...question,
    isEssential,
    // In Quick Mode, hide non-essential questions
    // In Advanced Mode, show all questions
  };
}

function getQuestionsForUseCase(useCaseId: string): Question[] {
  // Sphere calling scripts - ENHANCED with 6 questions
  if (useCaseId === 'sphere-script') {
    return [
      {
        id: 'who',
        type: 'select' as const,
        question: 'Who are you calling?',
        defaultValue: 'past-client', // Most sphere calls are to past clients
        options: [
          { value: 'past-client', label: 'Past Client', emoji: '🤝' },
          { value: 'friend-family', label: 'Friend/Family', emoji: '❤️' },
          { value: 'warm-lead', label: 'Warm Lead', emoji: '🔥' },
          { value: 'cold-lead', label: 'Cold Lead', emoji: '❄️' },
          { value: 'professional-contact', label: 'Professional Contact', emoji: '💼' }
        ]
      },
      {
        id: 'relationship',
        type: 'textarea' as const,
        question: 'How do you know them?',
        subtitle: 'When did you last talk? What\'s your history?',
        placeholder: 'Example: Sold them a home 2 years ago, we grab coffee every few months, they have 2 kids...'
      },
      {
        id: 'goal',
        type: 'select' as const,
        question: "What's your goal for this call?",
        defaultValue: 'top-of-mind', // Most common goal for sphere calls
        options: [
          { value: 'referral', label: 'Get Referral', emoji: '🎯' },
          { value: 'appointment', label: 'Book Appointment', emoji: '📅' },
          { value: 'top-of-mind', label: 'Stay Top of Mind', emoji: '💭' },
          { value: 'market-update', label: 'Share Market Update', emoji: '📊' }
        ]
      },
      {
        id: 'market-hook',
        type: 'text' as const,
        question: 'Any recent market changes to mention?',
        subtitle: '(Optional) Make your call more relevant',
        placeholder: 'Example: "3 homes just sold on your street" or "Prices up 5% this month" or leave blank'
      },
      {
        id: 'home-details',
        type: 'text' as const,
        question: 'Know their home details?',
        subtitle: '(Optional) Helps personalize the script',
        placeholder: 'Example: "Live in Riverside, bought in 2021 for $450K" or leave blank'
      },
      {
        id: 'personal-notes',
        type: 'textarea' as const,
        question: 'Any personal details to reference?',
        subtitle: 'Life updates, hobbies, family, career - make it personal!',
        placeholder: 'Example: Just had a baby, mentioned needing more space, loves to entertain, works from home...'
      }
    ];
  }

  // Social media content - ENHANCED with conditional questions
  if (useCaseId === 'social-content') {
    return [
      {
        id: 'platform',
        type: 'select' as const,
        question: 'Which platform?',
        defaultValue: 'instagram', // Most popular platform for realtors
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
        id: 'market-location',
        type: 'text' as const,
        question: 'What market/location?',
        subtitle: 'City, neighborhood, or zip code',
        placeholder: 'Example: Austin TX, Riverside neighborhood, 78704, Travis County...'
      },
      {
        id: 'property-type',
        type: 'select' as const,
        question: 'Property type focus?',
        defaultValue: 'all', // Works for most general posts
        options: [
          { value: 'all', label: 'All Property Types', emoji: '🏘️' },
          { value: 'single-family', label: 'Single-Family Homes', emoji: '🏡' },
          { value: 'condos', label: 'Condos', emoji: '🏢' },
          { value: 'townhomes', label: 'Townhomes', emoji: '🏘️' },
          { value: 'luxury', label: 'Luxury ($1M+)', emoji: '💎' },
          { value: 'multi-family', label: 'Multi-Family/Investment', emoji: '🏬' }
        ]
      },
      {
        id: 'specific-data',
        type: 'textarea' as const,
        question: 'Got specific numbers or facts?',
        subtitle: '(Optional) Leave blank and AI will add relevant stats',
        placeholder: 'Example: "Median price $487K, up 3.2% from last month" or leave blank for AI to research'
      },
      {
        id: 'tone',
        type: 'select' as const,
        question: 'Tone & style?',
        defaultValue: 'professional', // Most common professional tone
        options: [
          { value: 'professional', label: 'Professional', emoji: '💼' },
          { value: 'casual-friendly', label: 'Casual & Friendly', emoji: '😊' },
          { value: 'luxury-upscale', label: 'Luxury & Upscale', emoji: '✨' },
          { value: 'educational', label: 'Educational', emoji: '📚' },
          { value: 'humorous', label: 'Humorous', emoji: '😄' }
        ]
      },
      {
        id: 'cta',
        type: 'text' as const,
        question: 'Call-to-action?',
        subtitle: 'What do you want them to do?',
        placeholder: 'Example: DM me for a free market analysis, Link in bio, Comment "INFO" below...'
      }
    ];
  }

  // Email sequence - ENHANCED with 7 questions
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
        id: 'lead-source',
        type: 'text' as const,
        question: 'Where did these leads come from?',
        subtitle: 'Important for context and trust-building',
        placeholder: 'Example: Zillow inquiry, Facebook ad, open house sign-in, referral from past client...'
      },
      {
        id: 'timeline',
        type: 'select' as const,
        question: 'Their buying/selling timeline?',
        defaultValue: '3-6-months', // Most common middle-funnel timeline
        options: [
          { value: '0-3-months', label: '0-3 Months (HOT)', emoji: '🔥' },
          { value: '3-6-months', label: '3-6 Months', emoji: '📅' },
          { value: '6-12-months', label: '6-12 Months', emoji: '🗓️' },
          { value: 'exploring', label: 'Just Exploring', emoji: '🤔' }
        ]
      },
      {
        id: 'location-pricerange',
        type: 'text' as const,
        question: 'Their location & price range (if known)',
        placeholder: 'Example: Looking in Austin, $400-500K range...'
      },
      {
        id: 'pain-point',
        type: 'textarea' as const,
        question: 'What problem are they trying to solve?',
        subtitle: 'First-time buyer, downsizing, investment, relocation, etc.',
        placeholder: 'Example: First-time buyers, overwhelmed by the process, worried about overpaying...'
      },
      {
        id: 'emails',
        type: 'select' as const,
        question: 'How many emails?',
        defaultValue: '5', // Middle option - most common sequence length
        options: [
          { value: '3', label: '3 emails', emoji: '📧' },
          { value: '5', label: '5 emails', emoji: '📨' },
          { value: '7', label: '7 emails', emoji: '📬' }
        ]
      },
      {
        id: 'goal',
        type: 'select' as const,
        question: 'What should the sequence accomplish?',
        defaultValue: 'book-call', // Most common goal for email sequences
        options: [
          { value: 'book-call', label: 'Book Consultation Call', emoji: '📞' },
          { value: 'download-guide', label: 'Download Guide/Resource', emoji: '📚' },
          { value: 'schedule-showing', label: 'Schedule Showing', emoji: '🏡' },
          { value: 'build-trust', label: 'Build Trust (Long Nurture)', emoji: '🤝' }
        ]
      }
    ];
  }

  // Listing description - ENHANCED with 8 questions
  if (useCaseId === 'listing-description') {
    return [
      {
        id: 'property-type',
        type: 'select' as const,
        question: 'Property type?',
        defaultValue: 'single-family', // Most common listing type
        options: [
          { value: 'single-family', label: 'Single Family', emoji: '🏡' },
          { value: 'condo', label: 'Condo', emoji: '🏢' },
          { value: 'townhouse', label: 'Townhouse', emoji: '🏘️' },
          { value: 'luxury', label: 'Luxury Home', emoji: '💎' },
          { value: 'land', label: 'Land/Lot', emoji: '🌳' }
        ]
      },
      {
        id: 'property-address',
        type: 'text' as const,
        question: 'Property address',
        subtitle: 'We\'ll automatically search Zillow, Redfin, MLS & Trulia for listing details',
        placeholder: 'Example: 123 Main Street, Austin, TX 78704'
      },
      // listing-data-confirmation handled by custom UI (auto-fetch from MLS/Zillow)
      // listing-manual-paste is fallback if not found
      {
        id: 'basic-specs',
        type: 'text' as const,
        question: 'Beds, baths, sq ft, year built',
        placeholder: 'Example: 4 bed, 3 bath, 2,400 sqft, built 2015...'
      },
      {
        id: 'location',
        type: 'text' as const,
        question: 'Location & neighborhood',
        subtitle: 'City, neighborhood, school district, notable features',
        placeholder: 'Example: Riverside, Austin TX, top-rated schools, walk to coffee shops...'
      },
      {
        id: 'price',
        type: 'text' as const,
        question: 'List price',
        placeholder: 'Example: $495,000...'
      },
      {
        id: 'key-features',
        type: 'textarea' as const,
        question: 'Top 5-7 features to highlight',
        subtitle: 'Updates, unique features, what makes it special',
        placeholder: 'Example: Updated kitchen (2023), quartz counters, Wolf appliances, primary suite w/ spa bath, huge backyard, smart home, 2-car garage...'
      },
      {
        id: 'existing-description',
        type: 'textarea' as const,
        question: 'Current listing description (if you have one)',
        subtitle: 'Optional - AI can improve/rewrite your existing copy',
        placeholder: 'Paste your current listing description here, or leave blank for a fresh start...'
      },
      {
        id: 'lifestyle-appeal',
        type: 'select' as const,
        question: 'Who is this perfect for?',
        defaultValue: 'family', // Most common target buyer
        options: [
          { value: 'family', label: 'Growing Family', emoji: '👨‍👩‍👧‍👦' },
          { value: 'professionals', label: 'Young Professionals', emoji: '💼' },
          { value: 'downsizer', label: 'Downsizers/Empty Nesters', emoji: '🏡' },
          { value: 'entertainer', label: 'Entertainers', emoji: '🎉' },
          { value: 'remote-worker', label: 'Remote Workers', emoji: '💻' },
          { value: 'investor', label: 'Investors', emoji: '💰' }
        ]
      },
      {
        id: 'ideal-buyer',
        type: 'textarea' as const,
        question: 'Describe the ideal buyer for this property',
        subtitle: 'Who would love living here? (helps our experts tailor the description)',
        placeholder: 'Example: Young families who want walkable schools, professionals seeking a home office, downsizers looking for low-maintenance living, entertainers who need a great backyard...'
      },
      {
        id: 'urgency',
        type: 'select' as const,
        question: 'Any urgency factors?',
        defaultValue: 'new-listing', // Most listings are new to market
        options: [
          { value: 'none', label: 'None', emoji: '📅' },
          { value: 'new-listing', label: 'New to Market', emoji: '🆕' },
          { value: 'price-reduction', label: 'Price Reduction', emoji: '💰' },
          { value: 'open-house', label: 'Open House This Weekend', emoji: '🚪' },
          { value: 'multiple-offers', label: 'Expecting Multiple Offers', emoji: '🔥' }
        ]
      },
      {
        id: 'vibe',
        type: 'select' as const,
        question: 'Writing style?',
        defaultValue: 'professional', // Most common MLS style
        options: [
          { value: 'professional', label: 'Professional MLS', emoji: '💼' },
          { value: 'storytelling', label: 'Storytelling', emoji: '📖' },
          { value: 'luxury', label: 'Luxury/Upscale', emoji: '✨' },
          { value: 'casual', label: 'Casual/Friendly', emoji: '😊' }
        ]
      }
    ];
  }

  // Consultation script - ENHANCED with 9 questions
  if (useCaseId === 'consultation-script') {
    return [
      {
        id: 'type',
        type: 'select' as const,
        question: 'What type of consultation?',
        defaultValue: 'buyer', // Buyer consultations most common
        options: [
          { value: 'buyer', label: 'Buyer Consultation', emoji: '🔍' },
          { value: 'seller', label: 'Seller Consultation', emoji: '🏠' },
          { value: 'listing', label: 'Listing Presentation', emoji: '📊' }
        ]
      },
      {
        id: 'client-background',
        type: 'select' as const,
        question: 'Client background?',
        defaultValue: 'first-time', // First-time buyers/sellers most common
        options: [
          { value: 'first-time', label: 'First-Time Buyer/Seller', emoji: '👋' },
          { value: 'experienced', label: 'Experienced', emoji: '🎯' },
          { value: 'investor', label: 'Investor', emoji: '💰' },
          { value: 'relocating', label: 'Relocating', emoji: '📦' },
          { value: 'downsizing', label: 'Downsizing', emoji: '🏡' },
          { value: 'upsizing', label: 'Upsizing/Growing Family', emoji: '👨‍👩‍👧‍👦' }
        ]
      },
      {
        id: 'motivation',
        type: 'textarea' as const,
        question: 'Why are they buying/selling NOW?',
        subtitle: 'Motivation drives urgency and objections',
        placeholder: 'Example: New job starting in 3 months, outgrew current home with 3rd baby, retiring and moving closer to grandkids...'
      },
      {
        id: 'timeline',
        type: 'select' as const,
        question: 'Their timeline?',
        defaultValue: 'soon', // Most common timeline
        options: [
          { value: 'urgent', label: 'Urgent (0-30 days)', emoji: '🔥' },
          { value: 'soon', label: 'Soon (1-3 months)', emoji: '📅' },
          { value: 'flexible', label: 'Flexible (3-6 months)', emoji: '🗓️' },
          { value: 'exploring', label: 'Just Exploring', emoji: '🤔' }
        ]
      },
      {
        id: 'competition',
        type: 'select' as const,
        question: 'Are they interviewing other agents?',
        defaultValue: 'unknown', // Most realistic default
        options: [
          { value: 'yes-2', label: 'Yes, 1-2 Others', emoji: '👥' },
          { value: 'yes-3plus', label: 'Yes, 3+ Others', emoji: '🏆' },
          { value: 'no', label: 'No, Just You', emoji: '🎯' },
          { value: 'unknown', label: 'Unknown', emoji: '❓' }
        ]
      },
      {
        id: 'pricerange-property',
        type: 'text' as const,
        question: 'Price range or property value?',
        placeholder: 'Example: Looking at $400-500K homes, or their home worth ~$495K...'
      },
      {
        id: 'concerns',
        type: 'textarea' as const,
        question: 'What are they worried about?',
        subtitle: 'Objections you expect or have heard',
        placeholder: 'Example: Worried about pricing too high/low, afraid of commission costs, unsure about market timing, overwhelmed by process...'
      },
      {
        id: 'your-edge',
        type: 'textarea' as const,
        question: 'What\'s YOUR unique advantage?',
        subtitle: 'Why should they choose you?',
        placeholder: 'Example: Sold 12 homes in their neighborhood last year, have buyer lined up, unique pricing strategy, concierge service...'
      },
      {
        id: 'meeting-length',
        type: 'select' as const,
        question: 'How long is the meeting?',
        defaultValue: '60min', // Standard consultation length
        options: [
          { value: '30min', label: '30 minutes', emoji: '⏱️' },
          { value: '60min', label: '60 minutes', emoji: '⏰' },
          { value: '90min', label: '90 minutes', emoji: '🕐' }
        ]
      }
    ];
  }

  // Objection handling - ENHANCED with 6 questions
  if (useCaseId === 'objection-handling') {
    return [
      {
        id: 'objection',
        type: 'select' as const,
        question: 'What objection?',
        defaultValue: 'commission', // Most common objection
        options: [
          { value: 'commission', label: 'Commission Too High', emoji: '💰' },
          { value: 'timing', label: 'Wrong Time to Buy/Sell', emoji: '⏰' },
          { value: 'price', label: 'Price Concerns', emoji: '🏷️' },
          { value: 'other-agent', label: 'Working with Another Agent', emoji: '👥' },
          { value: 'think-about-it', label: 'Need to Think About It', emoji: '🤔' }
        ]
      },
      {
        id: 'exact-wording',
        type: 'textarea' as const,
        question: 'What did they say exactly?',
        subtitle: 'Verbatim if possible - word choice matters',
        placeholder: 'Example: "Your commission is way too high. My neighbor sold with a discount broker for 4% total..."'
      },
      {
        id: 'when-in-process',
        type: 'select' as const,
        question: 'When did this come up?',
        defaultValue: 'listing-presentation', // Most common time for objections
        options: [
          { value: 'initial-call', label: 'Initial Phone Call', emoji: '📞' },
          { value: 'listing-presentation', label: 'Listing Presentation', emoji: '📊' },
          { value: 'offer-negotiation', label: 'Offer Negotiation', emoji: '💼' },
          { value: 'inspection-period', label: 'Inspection Period', emoji: '🔍' },
          { value: 'closing', label: 'Near Closing', emoji: '✍️' }
        ]
      },
      {
        id: 'emotional-state',
        type: 'select' as const,
        question: 'Their emotional tone?',
        defaultValue: 'skeptical', // Most common emotional state
        options: [
          { value: 'curious', label: 'Genuinely Curious', emoji: '🤔' },
          { value: 'skeptical', label: 'Skeptical', emoji: '🧐' },
          { value: 'frustrated', label: 'Frustrated/Upset', emoji: '😤' },
          { value: 'defensive', label: 'Defensive', emoji: '🛡️' },
          { value: 'testing', label: 'Testing You', emoji: '🎯' }
        ]
      },
      {
        id: 'relationship-status',
        type: 'select' as const,
        question: 'Your relationship status?',
        defaultValue: 'first-contact', // Most objections come early
        options: [
          { value: 'first-contact', label: 'First Conversation', emoji: '👋' },
          { value: 'few-weeks', label: 'Working Together (Weeks)', emoji: '📅' },
          { value: 'warm-relationship', label: 'Warm Relationship', emoji: '🤝' },
          { value: 'past-client', label: 'Past Client', emoji: '💼' }
        ]
      },
      {
        id: 'proof-available',
        type: 'textarea' as const,
        question: 'What proof/stats do you have to counter?',
        subtitle: 'Past results, testimonials, data, comparisons',
        placeholder: 'Example: I sold 15 homes last year at avg 102% of list price, avg DOM 18 days. Discount brokers in area average 95% and 45 DOM...'
      }
    ];
  }

  // Open house follow-up - ENHANCED with 7 questions
  if (useCaseId === 'open-house-followup') {
    return [
      {
        id: 'visitor-name',
        type: 'text' as const,
        question: 'Visitor name(s)?',
        placeholder: 'Example: Jennifer & Mark...'
      },
      {
        id: 'visitor-type',
        type: 'select' as const,
        question: 'How serious were they?',
        defaultValue: 'serious-buyer', // Most common open house visitor
        options: [
          { value: 'very-serious', label: 'Very Serious (Ready to Buy)', emoji: '🔥' },
          { value: 'serious-buyer', label: 'Serious (Actively Looking)', emoji: '🎯' },
          { value: 'just-looking', label: 'Just Looking', emoji: '👀' },
          { value: 'neighbor', label: 'Neighbor (Curious)', emoji: '🏘️' },
          { value: 'investor', label: 'Investor/Flipper', emoji: '💰' }
        ]
      },
      {
        id: 'what-they-liked',
        type: 'textarea' as const,
        question: 'What did they love?',
        subtitle: 'Specific rooms, features they commented on',
        placeholder: 'Example: Raved about the kitchen, loved the backyard, excited about the master suite, took tons of photos...'
      },
      {
        id: 'concerns',
        type: 'textarea' as const,
        question: 'What concerns did they mention?',
        placeholder: 'Example: Worried about school district, price feels high, need 4th bedroom, commute to work might be too long...'
      },
      {
        id: 'timeline',
        type: 'select' as const,
        question: 'Their buying timeline?',
        defaultValue: 'soon', // Most common timeline
        options: [
          { value: 'urgent', label: 'ASAP (0-30 days)', emoji: '🔥' },
          { value: 'soon', label: 'Soon (1-3 months)', emoji: '📅' },
          { value: 'flexible', label: 'Flexible (3-6 months)', emoji: '🗓️' },
          { value: 'unknown', label: 'Didn\'t Say', emoji: '❓' }
        ]
      },
      {
        id: 'pre-approval',
        type: 'select' as const,
        question: 'Pre-approval status?',
        defaultValue: 'unknown', // Most realistic default
        options: [
          { value: 'pre-approved', label: 'Pre-Approved', emoji: '✅' },
          { value: 'working-on-it', label: 'Working on It', emoji: '📝' },
          { value: 'not-yet', label: 'Not Yet', emoji: '❌' },
          { value: 'cash-buyer', label: 'Cash Buyer', emoji: '💰' },
          { value: 'unknown', label: 'Didn\'t Ask', emoji: '❓' }
        ]
      },
      {
        id: 'channel',
        type: 'select' as const,
        question: 'Follow-up method?',
        defaultValue: 'text', // Text is most effective for open house follow-up
        options: [
          { value: 'text', label: 'Text Message', emoji: '💬' },
          { value: 'email', label: 'Email', emoji: '📧' },
          { value: 'call', label: 'Phone Call', emoji: '📞' }
        ]
      }
    ];
  }

  // Market report - ENHANCED with 10 questions (YOUR KEY EXAMPLE!)
  if (useCaseId === 'market-report') {
    return [
      {
        id: 'market-location',
        type: 'text' as const,
        question: "Where's your market?",
        subtitle: 'City, neighborhood, zip code, or county',
        placeholder: 'Example: Austin TX, Riverside neighborhood, 78704, Travis County...'
      },
      {
        id: 'property-type',
        type: 'select' as const,
        question: 'Property type focus?',
        defaultValue: 'all', // SMART DEFAULT
        options: [
          { value: 'all', label: 'All Property Types', emoji: '🏘️' },
          { value: 'single-family', label: 'Single-Family Homes', emoji: '🏡' },
          { value: 'condos', label: 'Condos', emoji: '🏢' },
          { value: 'townhomes', label: 'Townhomes', emoji: '🏘️' },
          { value: 'luxury', label: 'Luxury ($1M+)', emoji: '💎' },
          { value: 'apartments', label: 'Apartments/Multi-Family', emoji: '🏬' }
        ]
      },
      {
        id: 'time-frame',
        type: 'select' as const,
        question: 'What time frame?',
        defaultValue: 'last-30-days', // SMART DEFAULT - Most common
        options: [
          { value: 'last-7-days', label: 'Last 7 Days', emoji: '📅' },
          { value: 'last-30-days', label: 'Last 30 Days', emoji: '📆' },
          { value: 'last-quarter', label: 'Last Quarter (Q1/Q2/Q3/Q4)', emoji: '📊' },
          { value: 'last-year', label: 'Last 12 Months', emoji: '🗓️' },
          { value: 'year-over-year', label: 'Year-Over-Year Comparison', emoji: '📈' }
        ]
      },
      {
        id: 'price-range',
        type: 'select' as const,
        question: 'Price range focus?',
        defaultValue: 'all', // SMART DEFAULT
        options: [
          { value: 'all', label: 'All Price Ranges', emoji: '💰' },
          { value: 'under-300k', label: 'Under $300K', emoji: '🏠' },
          { value: '300-500k', label: '$300K-$500K', emoji: '🏡' },
          { value: '500k-1m', label: '$500K-$1M', emoji: '🏘️' },
          { value: 'over-1m', label: '$1M+', emoji: '💎' }
        ]
      },
      {
        id: 'key-metrics',
        type: 'select' as const,
        question: 'Which metrics do you want to highlight?',
        subtitle: 'Select primary focus',
        defaultValue: 'all-metrics', // SMART DEFAULT
        options: [
          { value: 'all-metrics', label: 'All Key Metrics', emoji: '📊' },
          { value: 'price-trends', label: 'Price Trends', emoji: '💰' },
          { value: 'inventory-supply', label: 'Inventory & Supply', emoji: '🏘️' },
          { value: 'days-on-market', label: 'Days on Market', emoji: '⏰' },
          { value: 'sale-to-list-ratio', label: 'Sale-to-List Ratio', emoji: '📈' }
        ]
      },
      {
        id: 'specific-data',
        type: 'textarea' as const,
        question: 'Do you have specific market data?',
        subtitle: 'Leave blank if you want AI to research current stats',
        placeholder: 'Example: Median price $487K (up 3.2%), inventory 2.8 months, avg DOM 34 days, list-to-sale 101.2%...'
      },
      {
        id: 'audience',
        type: 'select' as const,
        question: 'Who is this report for?',
        defaultValue: 'general', // SMART DEFAULT
        options: [
          { value: 'buyers', label: 'Buyers', emoji: '🔍' },
          { value: 'sellers', label: 'Sellers', emoji: '🏠' },
          { value: 'general', label: 'General Sphere/Clients', emoji: '👥' },
          { value: 'investors', label: 'Investors', emoji: '💼' }
        ]
      },
      {
        id: 'trend-direction',
        type: 'select' as const,
        question: 'Overall market trend?',
        defaultValue: 'unknown', // SMART DEFAULT - 95% want this!
        options: [
          { value: 'unknown', label: 'Let AI Determine', emoji: '🤔' },
          { value: 'hot-sellers', label: 'Hot/Seller\'s Market', emoji: '🔥' },
          { value: 'balanced', label: 'Balanced Market', emoji: '⚖️' },
          { value: 'cooling-buyers', label: 'Cooling/Buyer\'s Market', emoji: '❄️' },
          { value: 'mixed', label: 'Mixed Signals', emoji: '🌤️' }
        ]
      },
      {
        id: 'comparison',
        type: 'select' as const,
        question: 'Compare to what period?',
        defaultValue: 'last-year', // SMART DEFAULT
        options: [
          { value: 'last-month', label: 'vs. Last Month', emoji: '📅' },
          { value: 'last-quarter', label: 'vs. Last Quarter', emoji: '📊' },
          { value: 'last-year', label: 'vs. Last Year', emoji: '📆' },
          { value: 'peak-2021', label: 'vs. Peak Market (2021)', emoji: '🏔️' },
          { value: 'none', label: 'No Comparison', emoji: '➖' }
        ]
      },
      {
        id: 'actionable-insight',
        type: 'textarea' as const,
        question: 'What should they DO with this info?',
        subtitle: 'Your recommendation based on the data',
        placeholder: 'Example: Great time for buyers - more inventory, less competition. Sellers should price aggressively and market heavily...'
      }
    ];
  }

  // Video script - ENHANCED with 7 questions
  if (useCaseId === 'video-script') {
    return [
      {
        id: 'platform',
        type: 'select' as const,
        question: 'What platform?',
        defaultValue: 'reels', // Instagram Reels most popular for realtors
        options: [
          { value: 'reels', label: 'Instagram Reels', emoji: '📸' },
          { value: 'tiktok', label: 'TikTok', emoji: '🎵' },
          { value: 'youtube', label: 'YouTube', emoji: '📹' },
          { value: 'youtube-shorts', label: 'YouTube Shorts', emoji: '⚡' },
          { value: 'stories', label: 'Stories (IG/FB)', emoji: '📱' }
        ]
      },
      {
        id: 'length',
        type: 'select' as const,
        question: 'Video length?',
        defaultValue: '60sec', // Sweet spot for engagement
        options: [
          { value: '15sec', label: '15 seconds', emoji: '⚡' },
          { value: '30sec', label: '30 seconds', emoji: '⏱️' },
          { value: '60sec', label: '60 seconds', emoji: '⏰' },
          { value: '3min', label: '3 minutes', emoji: '🕐' },
          { value: '5min-plus', label: '5+ minutes', emoji: '🎬' }
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
          { value: 'personal-story', label: 'Personal/Behind-the-Scenes', emoji: '✨' },
          { value: 'myth-busting', label: 'Myth Busting', emoji: '🚫' }
        ]
      },
      {
        id: 'hook-style',
        type: 'select' as const,
        question: 'Hook style (first 3 seconds)?',
        defaultValue: 'question', // Questions perform best for engagement
        options: [
          { value: 'question', label: 'Ask a Question', emoji: '❓' },
          { value: 'shocking-stat', label: 'Shocking Stat', emoji: '🤯' },
          { value: 'problem', label: 'State a Problem', emoji: '⚠️' },
          { value: 'bold-claim', label: 'Bold Claim/Statement', emoji: '💥' },
          { value: 'storytelling', label: 'Start a Story', emoji: '📖' }
        ]
      },
      {
        id: 'specific-content',
        type: 'textarea' as const,
        question: 'Specific content or topic details?',
        subtitle: 'What exact tip, property, or story?',
        placeholder: 'Example: 3 things first-time buyers forget, tour of 123 Oak St ($495K), why Riverside is hottest neighborhood, how I negotiated $30K off...'
      },
      {
        id: 'cta',
        type: 'select' as const,
        question: 'Call-to-action?',
        defaultValue: 'dm', // Direct engagement most effective
        options: [
          { value: 'dm', label: 'DM me', emoji: '💬' },
          { value: 'link-bio', label: 'Link in bio', emoji: '🔗' },
          { value: 'comment', label: 'Comment below', emoji: '💭' },
          { value: 'follow', label: 'Follow for more', emoji: '➕' },
          { value: 'save', label: 'Save this video', emoji: '🔖' }
        ]
      },
      {
        id: 'on-screen-text',
        type: 'select' as const,
        question: 'Text emphasis?',
        defaultValue: 'heavy', // Heavy text overlays perform best on social
        options: [
          { value: 'heavy', label: 'Heavy text overlays', emoji: '📝' },
          { value: 'minimal', label: 'Minimal text', emoji: '✍️' },
          { value: 'captions-only', label: 'Just captions', emoji: '💬' },
          { value: 'voiceover', label: 'Voiceover focus', emoji: '🎤' }
        ]
      }
    ];
  }

  // Expired/FSBO letters - ENHANCED with 8 questions
  if (useCaseId === 'expired-fsbo') {
    return [
      {
        id: 'type',
        type: 'select' as const,
        question: 'Which one?',
        defaultValue: 'expired', // Expired listings most common
        options: [
          { value: 'expired', label: 'Expired Listing', emoji: '⏰' },
          { value: 'fsbo', label: 'FSBO', emoji: '🏠' },
          { value: 'withdrawn', label: 'Withdrawn Listing', emoji: '🔄' }
        ]
      },
      {
        id: 'property-address',
        type: 'text' as const,
        question: 'Property address?',
        placeholder: 'Example: 123 Oak Street, Austin TX...'
      },
      {
        id: 'expired-details',
        type: 'textarea' as const,
        question: 'What happened? (Expired/FSBO specifics)',
        subtitle: 'Days on market, price, why it didn\'t sell',
        placeholder: 'Example: Listed for 90 days at $525K, overpriced by ~8%, bad photos, little marketing, agent didn\'t communicate...'
      },
      {
        id: 'seller-pain-level',
        type: 'select' as const,
        question: 'How motivated is the seller?',
        defaultValue: 'unknown', // Most realistic default
        options: [
          { value: 'extremely', label: 'Extremely (1-10: 9-10)', emoji: '🔥' },
          { value: 'very', label: 'Very Motivated (7-8)', emoji: '📈' },
          { value: 'moderate', label: 'Moderately (5-6)', emoji: '📊' },
          { value: 'low', label: 'Low (Testing Market)', emoji: '🤷' },
          { value: 'unknown', label: 'Unknown', emoji: '❓' }
        ]
      },
      {
        id: 'competition',
        type: 'select' as const,
        question: 'Are other agents calling too?',
        defaultValue: 'yes-many', // Most realistic for expired listings
        options: [
          { value: 'yes-many', label: 'Yes, Many Agents', emoji: '📞' },
          { value: 'yes-few', label: 'Yes, A Few', emoji: '👥' },
          { value: 'no', label: 'No / You\'re First', emoji: '🎯' },
          { value: 'unknown', label: 'Unknown', emoji: '❓' }
        ]
      },
      {
        id: 'your-edge',
        type: 'textarea' as const,
        question: 'What\'s your unique angle?',
        subtitle: 'Why should they choose YOU to relist?',
        placeholder: 'Example: Have a buyer interested in that neighborhood, sold 8 homes on their street last year, unique pricing strategy, 30-day guarantee...'
      },
      {
        id: 'format',
        type: 'select' as const,
        question: 'Format?',
        defaultValue: 'letter', // Physical letters stand out most
        options: [
          { value: 'letter', label: 'Physical Letter', emoji: '✉️' },
          { value: 'email', label: 'Email', emoji: '📧' },
          { value: 'script', label: 'Phone Script', emoji: '📞' },
          { value: 'door-knock', label: 'Door Knock Script', emoji: '🚪' }
        ]
      },
      {
        id: 'tone',
        type: 'select' as const,
        question: 'Tone approach?',
        defaultValue: 'empathetic', // Empathy works best for expired/FSBO
        options: [
          { value: 'empathetic', label: 'Empathetic (I feel your pain)', emoji: '🤝' },
          { value: 'direct-blunt', label: 'Direct & Blunt (Here\'s the truth)', emoji: '💥' },
          { value: 'consultative', label: 'Consultative (Let me help)', emoji: '💼' },
          { value: 'urgent', label: 'Urgent (Act now)', emoji: '⏰' }
        ]
      }
    ];
  }

  // CMA narrative - ENHANCED with 9 questions
  if (useCaseId === 'cma-narrative') {
    return [
      {
        id: 'property-address',
        type: 'text' as const,
        question: 'Subject property address?',
        placeholder: 'Example: 123 Oak Street, Austin TX...'
      },
      {
        id: 'property-details',
        type: 'textarea' as const,
        question: 'Property specs & condition',
        subtitle: 'Beds, baths, sqft, lot, year built, updates',
        placeholder: 'Example: 3 bed, 2 bath, 1,820 sqft, 0.25 acre lot, built 1995, updated kitchen (2022), new HVAC (2021)...'
      },
      {
        id: 'seller-desired-price',
        type: 'text' as const,
        question: 'What does the seller WANT?',
        subtitle: 'Their target price (even if unrealistic)',
        placeholder: 'Example: $525,000...'
      },
      {
        id: 'your-opinion',
        type: 'text' as const,
        question: 'What\'s it actually worth? (Your opinion)',
        placeholder: 'Example: $489,000...'
      },
      {
        id: 'comparable-sales',
        type: 'textarea' as const,
        question: 'List 3-5 comparable sales',
        subtitle: 'Address, specs, sale price, days on market',
        placeholder: 'Example:\n456 Elm: 3/2, 1,820sf, sold $492K, 18 DOM\n789 Maple: 3/2, 1,900sf, sold $505K, 24 DOM\n321 Pine: 3/2, 1,750sf, sold $478K, 14 DOM'
      },
      {
        id: 'active-competition',
        type: 'textarea' as const,
        question: 'Active listings (competition)',
        subtitle: 'What\'s currently on market that competes?',
        placeholder: 'Example:\n654 Oak: 3/2, 1,880sf, listed $509K, 42 DOM (sitting)\n987 Cedar: 3/2.5, 1,950sf, listed $495K, 12 DOM (no offers)'
      },
      {
        id: 'market-conditions',
        type: 'select' as const,
        question: 'Current market conditions?',
        defaultValue: 'balanced', // Most common market state
        options: [
          { value: 'hot-sellers', label: 'Hot Seller\'s Market', emoji: '🔥' },
          { value: 'balanced', label: 'Balanced', emoji: '⚖️' },
          { value: 'slow-buyers', label: 'Slow/Buyer\'s Market', emoji: '❄️' }
        ]
      },
      {
        id: 'situation',
        type: 'select' as const,
        question: 'Pricing situation?',
        defaultValue: 'want-more', // Most sellers want more than market value
        options: [
          { value: 'agree-market-value', label: 'They Agree with Market Value', emoji: '✅' },
          { value: 'want-more', label: 'They Want 5-10% More', emoji: '⬆️' },
          { value: 'way-overpriced', label: 'They Want 10%+ More', emoji: '🚀' },
          { value: 'quick-sale', label: 'Need Quick Sale (Price Under)', emoji: '⬇️' }
        ]
      },
      {
        id: 'pricing-strategy',
        type: 'select' as const,
        question: 'Recommended pricing strategy?',
        defaultValue: 'at-market', // Most common recommendation
        options: [
          { value: 'at-market', label: 'Price at Market Value', emoji: '🎯' },
          { value: 'slightly-under', label: 'Slightly Under (Bidding War)', emoji: '🔥' },
          { value: 'aggressive-under', label: 'Aggressively Under (Fast Sale)', emoji: '⚡' },
          { value: 'test-market', label: 'Slightly Over (Test Market)', emoji: '📈' }
        ]
      }
    ];
  }

  // Thank you notes - ENHANCED with 6 questions
  if (useCaseId === 'thank-you') {
    return [
      {
        id: 'occasion',
        type: 'select' as const,
        question: 'What is the occasion?',
        defaultValue: 'closing', // Most common thank you occasion
        options: [
          { value: 'closing', label: 'After Closing', emoji: '🎉' },
          { value: 'referral', label: 'For Referral', emoji: '🙏' },
          { value: 'review', label: 'For Review/Testimonial', emoji: '⭐' },
          { value: 'anniversary', label: 'Home Anniversary', emoji: '🏡' }
        ]
      },
      {
        id: 'client-names',
        type: 'text' as const,
        question: 'Client name(s)?',
        placeholder: 'Example: Jennifer & Mark...'
      },
      {
        id: 'property-address',
        type: 'text' as const,
        question: 'Property address?',
        subtitle: 'Where they bought/sold',
        placeholder: 'Example: 123 Oak Street...'
      },
      {
        id: 'memorable-moment',
        type: 'textarea' as const,
        question: 'Most memorable moment?',
        subtitle: 'Funny, sweet, or stressful - what stands out?',
        placeholder: 'Example: Their dog ran around the backyard at every showing, they cried when we got the offer, that crazy bidding war, the inspection issues we overcame...'
      },
      {
        id: 'specific-win',
        type: 'textarea' as const,
        question: 'What did you help them with specifically?',
        subtitle: 'Negotiation win, problem solved, challenge overcome',
        placeholder: 'Example: Negotiated $15K off price, got seller to fix HVAC, closed in 18 days for their job relocation...'
      },
      {
        id: 'format',
        type: 'select' as const,
        question: 'Format?',
        options: [
          { value: 'handwritten', label: 'Handwritten Note', emoji: '✍️' },
          { value: 'email', label: 'Email', emoji: '📧' },
          { value: 'gift-card', label: 'Gift Card Message', emoji: '🎁' },
          { value: 'video', label: 'Video Message', emoji: '🎥' }
        ]
      }
    ];
  }

  // Virtual Tour Scripts - SMART WORKFLOW
  // Step 1: Ask for property type (helps AI search better)
  // Step 2: Ask for address, then auto-fetch listing data from MLS/Zillow/Redfin
  // Step 3: Show editable confirmation OR fallback to manual paste
  // Step 4-5: Tour preferences (skipping beds/baths/sqft since we already know)
  if (useCaseId === 'virtual-tour-script') {
    return [
      {
        id: 'property-type',
        type: 'select' as const,
        question: 'Property type?',
        subtitle: 'This helps us find the right listing online',
        defaultValue: 'single-family',
        options: [
          { value: 'single-family', label: 'Single Family Home', emoji: '🏡' },
          { value: 'condo', label: 'Condo', emoji: '🏢' },
          { value: 'townhouse', label: 'Townhouse', emoji: '🏘️' },
          { value: 'luxury', label: 'Luxury Estate', emoji: '💎' },
          { value: 'multi-family', label: 'Multi-Family', emoji: '🏬' }
        ]
      },
      {
        id: 'property-address',
        type: 'text' as const,
        question: 'Property address?',
        subtitle: 'We\'ll automatically search Zillow, Redfin, MLS & Trulia',
        placeholder: 'Example: 123 Oak Street, Austin, TX 78704'
      },
      // listing-data-confirmation is a special step handled by custom UI
      // listing-manual-paste is fallback if not found
      {
        id: 'tour-highlights',
        type: 'textarea' as const,
        question: 'What are the key features to highlight in the tour?',
        subtitle: 'Top 5-7 rooms, features, or selling points',
        placeholder: 'Example: Updated kitchen with Wolf appliances, primary suite w/ spa bath, huge backyard, smart home features, 2-car garage...'
      },
      {
        id: 'tour-length',
        type: 'select' as const,
        question: 'Desired tour length?',
        defaultValue: '5-7min',
        options: [
          { value: '3-5min', label: '3-5 minutes (Quick)', emoji: '⚡' },
          { value: '5-7min', label: '5-7 minutes (Standard)', emoji: '⏰' },
          { value: '10min', label: '10+ minutes (Detailed)', emoji: '🎬' }
        ]
      },
      {
        id: 'walkthrough-style',
        type: 'select' as const,
        question: 'Tour style?',
        defaultValue: 'professional',
        options: [
          { value: 'professional', label: 'Professional/Formal', emoji: '💼' },
          { value: 'conversational', label: 'Conversational/Friendly', emoji: '😊' },
          { value: 'luxury', label: 'Luxury/Upscale', emoji: '✨' },
          { value: 'energetic', label: 'Energetic/Enthusiastic', emoji: '🔥' }
        ]
      }
    ];
  }

  // Buyer/Seller Education - NEW
  if (useCaseId === 'buyer-seller-education') {
    return [
      {
        id: 'topic',
        type: 'select' as const,
        question: 'What topic do you want to educate about?',
        defaultValue: 'first-time-buyer',
        options: [
          { value: 'first-time-buyer', label: 'First-Time Home Buying', emoji: '🏡' },
          { value: 'selling-process', label: 'Selling Process', emoji: '🏠' },
          { value: 'market-conditions', label: 'Understanding Market Conditions', emoji: '📊' },
          { value: 'financing', label: 'Financing & Mortgages', emoji: '💰' },
          { value: 'inspection', label: 'Home Inspection Guide', emoji: '🔍' },
          { value: 'negotiation', label: 'Negotiation Strategies', emoji: '🤝' }
        ]
      },
      {
        id: 'audience',
        type: 'select' as const,
        question: 'Who is the audience?',
        defaultValue: 'general',
        options: [
          { value: 'first-time', label: 'First-Time Buyers/Sellers', emoji: '👋' },
          { value: 'experienced', label: 'Experienced', emoji: '🎯' },
          { value: 'investors', label: 'Investors', emoji: '💼' },
          { value: 'general', label: 'General Audience', emoji: '👥' }
        ]
      },
      {
        id: 'location',
        type: 'text' as const,
        question: 'What market/location?',
        subtitle: 'City, state, or region for local context',
        placeholder: 'Example: Austin TX, Phoenix metro, Dallas-Fort Worth...'
      },
      {
        id: 'content-length',
        type: 'select' as const,
        question: 'How detailed should this be?',
        defaultValue: 'comprehensive',
        options: [
          { value: 'quick-tips', label: 'Quick Tips (5-7 points)', emoji: '⚡' },
          { value: 'comprehensive', label: 'Comprehensive Guide', emoji: '📚' },
          { value: 'in-depth', label: 'In-Depth Deep Dive', emoji: '🔬' }
        ]
      },
      {
        id: 'format',
        type: 'select' as const,
        question: 'What format?',
        defaultValue: 'guide',
        options: [
          { value: 'guide', label: 'Step-by-Step Guide', emoji: '📋' },
          { value: 'checklist', label: 'Checklist', emoji: '✅' },
          { value: 'faq', label: 'FAQ', emoji: '❓' },
          { value: 'article', label: 'Blog Article', emoji: '📝' }
        ]
      },
      {
        id: 'specific-focus',
        type: 'textarea' as const,
        question: 'Any specific aspects to focus on?',
        subtitle: 'Optional - particular questions, concerns, or subtopics',
        placeholder: 'Example: Focus on avoiding common mistakes, what to expect at closing, how to prepare financially...'
      }
    ];
  }

  // Negotiation Talking Points - NEW
  if (useCaseId === 'negotiation-points') {
    return [
      {
        id: 'negotiation-type',
        type: 'select' as const,
        question: 'What type of negotiation?',
        defaultValue: 'buyer-offer',
        options: [
          { value: 'buyer-offer', label: 'Buyer Making Offer', emoji: '💰' },
          { value: 'seller-counter', label: 'Seller Countering Offer', emoji: '🔄' },
          { value: 'inspection', label: 'Inspection Negotiations', emoji: '🔍' },
          { value: 'appraisal-gap', label: 'Appraisal Gap', emoji: '📊' },
          { value: 'multiple-offers', label: 'Multiple Offer Situation', emoji: '🔥' }
        ]
      },
      {
        id: 'client-role',
        type: 'select' as const,
        question: 'Who is your client?',
        options: [
          { value: 'buyer', label: 'Buyer', emoji: '🔍' },
          { value: 'seller', label: 'Seller', emoji: '🏠' }
        ]
      },
      {
        id: 'property-details',
        type: 'textarea' as const,
        question: 'Property details and context',
        subtitle: 'Price, location, days on market, any relevant details',
        placeholder: 'Example: $495K single-family in Austin, 30 DOM, seller motivated, needs quick close...'
      },
      {
        id: 'current-situation',
        type: 'textarea' as const,
        question: 'What\'s the current situation?',
        subtitle: 'What offers/counteroffers have been made? Any deadlines?',
        placeholder: 'Example: Listed at $500K, buyer offered $475K, seller countered at $495K, inspection revealed $10K in repairs...'
      },
      {
        id: 'client-goals',
        type: 'textarea' as const,
        question: 'What does your client want to achieve?',
        subtitle: 'Price, terms, contingencies, timeline',
        placeholder: 'Example: Get price down to $480K, keep inspection contingency, close in 30 days, seller pays closing costs...'
      },
      {
        id: 'leverage-points',
        type: 'textarea' as const,
        question: 'What leverage do you have?',
        subtitle: 'Cash offer, flexible closing, waived contingencies, market conditions',
        placeholder: 'Example: Cash offer, no financing contingency, can close in 2 weeks, property overpriced compared to comps...'
      },
      {
        id: 'tone',
        type: 'select' as const,
        question: 'Negotiation approach?',
        defaultValue: 'collaborative',
        options: [
          { value: 'collaborative', label: 'Collaborative Win-Win', emoji: '🤝' },
          { value: 'assertive', label: 'Assertive/Firm', emoji: '💪' },
          { value: 'empathetic', label: 'Empathetic/Understanding', emoji: '💙' },
          { value: 'data-driven', label: 'Data-Driven/Analytical', emoji: '📊' }
        ]
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
  // Extract listing data (auto-fetched or manual)
  let propertyDetails = '';
  if (answers['listing-data']) {
    const listing = JSON.parse(answers['listing-data']);
    propertyDetails = `PROPERTY DETAILS (from ${listing.source || 'MLS'}):
- Address: ${listing.address}
- Type: ${listing.propertyType}
- Specs: ${listing.bedrooms} bed, ${listing.bathrooms} bath, ${listing.squareFeet} sq ft
${listing.price ? `- Price: $${listing.price.toLocaleString()}` : ''}
${listing.features?.join(', ') || ''}
${listing.description ? `\nCurrent Description:\n${listing.description}` : ''}`;
  } else if (answers['manual-listing-paste']) {
    propertyDetails = answers['manual-listing-paste'];
  } else {
    // Fallback to individual fields
    const propertyType = answers['property-type'] || 'single-family';
    const address = answers.address || '';
    const basicSpecs = answers['basic-specs'] || '';
    const location = answers.location || '';
    const price = answers.price || '';
    const existingDescription = answers['existing-description'] || '';

    propertyDetails = `PROPERTY INFORMATION:
${address ? `Address: ${address}` : ''}
${propertyType ? `Type: ${propertyType.replace('-', ' ')}` : ''}
${basicSpecs ? `Basics: ${basicSpecs}` : ''}
${location ? `Location: ${location}` : ''}
${price ? `Price: ${price}` : ''}
${existingDescription ? `\nExisting Description:\n${existingDescription}` : ''}`;
  }

  const keyFeatures = answers['key-features'] || '';
  const idealBuyer = answers['ideal-buyer'] || '';

  return `You are a world-class listing description creation system powered by a panel of 6 expert reviewers.

${propertyDetails}

ADDITIONAL FEATURES TO HIGHLIGHT:
${keyFeatures}

${idealBuyer ? `IDEAL BUYER PROFILE:
${idealBuyer}

(Tailor the description to resonate with this buyer's needs, lifestyle, and aspirations)
` : ''}
## MULTI-EXPERT REVIEW PROCESS

Your task is to create a listing description through a 6-stage expert review process:

**STAGE 1: Junior Copywriter (Ad Agency)**
- Writes the initial draft
- Focus: Energetic, engaging language
- Highlights key features and benefits
- Creates emotional connection

**STAGE 2: Senior Copy Editor (Ad Agency)**
- Reviews and refines Stage 1
- Focus: Clarity, flow, and impact
- Removes clichés and weak language
- Strengthens calls-to-action

**STAGE 3: Literary Author (Bestseller Writer)**
- Adds narrative and sensory details
- Focus: Paint a vivid picture
- Create desire through storytelling
- Elevate language without being flowery

**STAGE 4: Investigative Journalist (Traditional Media)**
- Fact-checks and adds credibility
- Focus: Specific details over generalizations
- Removes hyperbole, adds substance
- Ensures accuracy and trustworthiness

**STAGE 5: Persuasion Expert (Marketing Psychology)**
- Optimizes for conversion
- Focus: Hooks, urgency, social proof
- Strategic word choice for maximum impact
- Creates FOMO (Fear of Missing Out)

**STAGE 6: Veteran Realtor (30 years, 1000s of transactions)**
- Final polish from real-world experience
- Focus: What actually sells properties
- Removes anything that doesn't move buyers
- Ensures Fair Housing compliance

## CRITICAL CONSTRAINTS

1. **Character Limit:** EXACTLY 1300 characters (not including headline or bullet points)
2. **Fair Housing:** NO references to familial status, religion, race, national origin, disability, or age
3. **Avoid Banned Words:** "charming", "cozy" (small), "unique" (weird), "motivated seller"
4. **Specificity:** Use exact details ("quartz waterfall island" not "beautiful kitchen")

## OUTPUT FORMAT

**Headline:** [Attention-grabbing first sentence - 10 words max]

**Description:** [Main body - MUST be exactly 1300 characters or less]

**Key Features:**
• [Feature 1]
• [Feature 2]
• [Feature 3]
• [Feature 4]
• [Feature 5]

**Expert Panel Notes:** [Brief note about what each expert contributed]

Generate the listing description now.`;
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
  const marketLocation = answers['market-location'] || 'your market';
  const propertyType = answers['property-type'] || 'all';
  const timeFrame = answers['time-frame'] || 'last-30-days';
  const priceRange = answers['price-range'] || 'all';
  const keyMetrics = answers['key-metrics'] || 'all-metrics';
  const specificData = answers['specific-data'] || '';
  const audience = answers.audience || 'general';
  const trendDirection = answers['trend-direction'] || 'unknown';
  const comparison = answers.comparison || 'none';
  const actionableInsight = answers['actionable-insight'] || '';

  // Map property types to readable labels
  const propertyTypeLabels: Record<string, string> = {
    'all': 'all property types',
    'single-family': 'single-family homes',
    'condos': 'condos',
    'townhomes': 'townhomes',
    'luxury': 'luxury properties ($1M+)',
    'apartments': 'apartments and multi-family properties'
  };

  const timeFrameLabels: Record<string, string> = {
    'last-7-days': 'the last 7 days',
    'last-30-days': 'the last 30 days',
    'last-quarter': 'the last quarter',
    'last-year': 'the last 12 months',
    'year-over-year': 'year-over-year'
  };

  const needsDataResearch = !specificData || specificData.trim() === '';

  return `You are a real estate market analyst who translates complex data into clear, actionable insights for ${audience}.

# TASK
Create a comprehensive market report for ${marketLocation} focused on ${propertyTypeLabels[propertyType] || propertyType} ${timeFrameLabels[timeFrame] || timeFrame}.

# MARKET PARAMETERS
- Location: ${marketLocation}
- Property Type: ${propertyTypeLabels[propertyType] || propertyType}
- Time Frame: ${timeFrameLabels[timeFrame] || timeFrame}
- Price Range: ${priceRange === 'all' ? 'All price ranges' : priceRange}
- Key Metrics Focus: ${keyMetrics}
${comparison !== 'none' ? `- Comparison: ${comparison}` : ''}

${needsDataResearch ? `# DATA GATHERING REQUIRED
**IMPORTANT**: The agent doesn't have specific market data. You MUST:
1. Use your knowledge of general real estate market trends
2. Provide realistic, representative example data for ${marketLocation}
3. Use typical market metrics (median price, days on market, inventory levels, list-to-sale ratio)
4. Make data feel specific but note it's "recent trends" or "current market conditions"
5. DO NOT make up exact numbers - use ranges and general trends

Example approach: "Recent trends in ${marketLocation} show median prices ranging from $X-$Y for ${propertyTypeLabels[propertyType]}..."
` : `# MARKET DATA PROVIDED
${specificData}
`}

${actionableInsight ? `# AGENT'S INTERPRETATION
${actionableInsight}
` : ''}

${trendDirection !== 'unknown' ? `# MARKET TREND
Current market is: ${trendDirection.replace('-', ' ')}
` : ''}

# AUDIENCE-SPECIFIC INSIGHTS
${audience === 'buyers' ? `
- What does this market mean for their buying power?
- Should they act now or wait?
- What negotiation leverage do they have?
- Are prices expected to rise or fall?
` : ''}
${audience === 'sellers' ? `
- Is this a good time to list?
- How should they price to sell quickly vs. maximize value?
- What's the competition like?
- How long should they expect to wait?
` : ''}
${audience === 'investors' ? `
- What's the ROI potential?
- Cash flow vs. appreciation play?
- Is inventory favorable for investors?
- What are the risks?
` : ''}

# STRUCTURE REQUIREMENTS
1. **Headline**: One sentence that captures the main market insight
2. **The Big Picture**: 2-3 sentences on overall market state
3. **Key Metrics** (${keyMetrics}):
   ${keyMetrics === 'all-metrics' ? '- Median/average price trends\n   - Days on market\n   - Inventory levels (months of supply)\n   - List-to-sale ratio' : `- Focus on ${keyMetrics}`}
4. **What It Means for ${audience}**:
   - Translate data into actionable decisions
   - Use "This means YOU can..." language
5. **Action Step**: What should they do RIGHT NOW?
6. **Call-to-Action**: Specific next step to engage with you

# WRITING CONSTRAINTS
- Lead with insight, not data (so what → what)
- Avoid jargon - use plain English (not "absorption rate", say "how fast homes are selling")
- Make it ${audience}-specific and relevant
- Create urgency without fear-mongering
- Use conversational tone (you're an advisor, not a reporter)
- Include specific numbers when available
- Compare to previous periods if data allows
- DO NOT be boring or academic
- DO NOT cherry-pick data to make market look better/worse
- DO NOT make predictions without backing them up
- DO NOT use phrases like "unprecedented" or "historic" unless truly warranted

# QUALITY CHECKLIST
□ Starts with an insight that makes them want to keep reading
□ Data supports claims (not the other way around)
□ ${audience} clearly understands what to do next
□ Tone is authoritative but not arrogant
□ Feels like advice from a trusted friend, not a sales pitch
□ Under 400 words (scannable)

# OUTPUT FORMAT
**Headline:** [The main insight in one sentence - make it compelling]

**The Big Picture**
[2-3 sentences setting the scene for ${marketLocation}]

**What the Numbers Show**
[Present key metrics with context and comparison]

**What This Means for ${audience}**
[Practical implications - "This means you can/should..."]

**Action Step**
[One specific thing they should do this week]

**Next Step**
[Clear CTA - "Reply to this email..." or "Call me for..." or "Download my free..."]

Write this to educate first, sell second. Be the trusted advisor who gives straight answers.`;
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

// Virtual Tour Script (NEW)
function generateVirtualTourScriptPrompt(answers: Record<string, string>): string {
  const propertyAddress = answers['property-address'] || '[property address]';
  const propertyType = answers['property-type'] || 'single-family';
  const tourHighlights = answers['tour-highlights'] || '';
  const tourLength = answers['tour-length'] || '5-7min';
  const walkthroughStyle = answers['walkthrough-style'] || 'professional';

  // Check for auto-fetched or manual listing data
  let propertyDetails = '';
  if (answers['listing-data']) {
    try {
      const listing = JSON.parse(answers['listing-data']);
      propertyDetails = `
PROPERTY DETAILS (from ${listing.source || 'MLS/Zillow'}):
- Address: ${listing.address}
- Type: ${listing.propertyType || propertyType}
- Specs: ${listing.bedrooms} bed, ${listing.bathrooms} bath, ${listing.squareFeet?.toLocaleString()} sq ft
${listing.price ? `- Listed Price: $${listing.price.toLocaleString()}` : ''}
${listing.yearBuilt ? `- Built: ${listing.yearBuilt}` : ''}
${listing.lotSize ? `- Lot Size: ${listing.lotSize}` : ''}
${listing.parking ? `- Parking: ${listing.parking}` : ''}
${listing.features && listing.features.length > 0 ? `- Key Features: ${listing.features.join(', ')}` : ''}
${listing.description ? `\nListing Description:\n${listing.description}` : ''}
      `;
    } catch (e) {
      console.error('Failed to parse listing data:', e);
      propertyDetails = `
PROPERTY DETAILS:
- Address: ${propertyAddress}
- Type: ${propertyType}
      `;
    }
  } else if (answers['manual-listing-paste']) {
    propertyDetails = `
PROPERTY DETAILS (provided by agent):
${answers['manual-listing-paste']}
    `;
  } else {
    // Fallback if no listing data
    propertyDetails = `
PROPERTY DETAILS:
- Address: ${propertyAddress}
- Type: ${propertyType}
    `;
  }

  const styleGuidance = {
    'professional': 'Professional, informative tone. Focus on facts, features, and benefits. Speak clearly and confidently.',
    'conversational': 'Warm, friendly tone. Talk like you\'re showing a friend around. Use natural language.',
    'luxury': 'Upscale, sophisticated tone. Emphasize quality, exclusivity, and lifestyle. Use elegant language.',
    'energetic': 'Enthusiastic, excited tone. Show passion for the property. Use dynamic language.'
  };

  return `You are a real estate agent creating a virtual tour script for a property.

${propertyDetails}

TOUR FOCUS:
Key Features to Highlight: ${tourHighlights}

TOUR PARAMETERS:
- Length: ${tourLength}
- Style: ${walkthroughStyle}

TASK: Create a detailed virtual tour walkthrough script that guides viewers through the property.

SCRIPT STRUCTURE:
1. **Introduction (0:00-0:30):**
   - Warm welcome
   - Property address and quick overview
   - Hook: What makes this special?

2. **Exterior/Curb Appeal (0:30-1:30):**
   - First impressions
   - Architectural style
   - Outdoor features (yard, driveway, landscaping)

3. **Main Living Areas (1:30-3:30):**
   - Entry/foyer
   - Living room
   - Kitchen (spend extra time here)
   - Dining area
   - Highlight flow and functionality

4. **Bedrooms & Bathrooms (3:30-5:00):**
   - Primary suite (emphasize luxury)
   - Secondary bedrooms
   - Notable bathroom features

5. **Special Features (5:00-6:00):**
   - Home office, bonus room, basement, etc.
   - Smart home features
   - Unique selling points

6. **Conclusion (6:00-${tourLength === '3-5min' ? '5:00' : tourLength === '5-7min' ? '7:00' : '10:00'}):**
   - Recap top 3 features
   - Location benefits (schools, shopping, commute)
   - Strong call-to-action
   - Contact information

TONE & STYLE: ${styleGuidance[walkthroughStyle as keyof typeof styleGuidance]}

REQUIREMENTS:
- Include specific timestamps for each section
- Point out details that cameras might miss
- Anticipate buyer questions and address them
- ${tourLength === '3-5min' ? 'Keep it concise - hit only the highlights' : tourLength === '10min' ? 'Go deep - provide extensive detail' : 'Balance detail with pacing'}
- Use descriptive language that paints a picture
- Include camera movement cues where helpful (e.g., "As we pan left...")

OUTPUT FORMAT:
**Virtual Tour Script: ${propertyAddress}**

[Introduction - 0:00-0:30]
[Your script here with specific talking points...]

[Continue for each section with timestamps]

Make it feel like a professional property tour that builds excitement and desire.`;
}

// Buyer/Seller Education (NEW)
function generateBuyerSellerEducationPrompt(answers: Record<string, string>): string {
  const topic = answers.topic || 'first-time-buyer';
  const audience = answers.audience || 'general';
  const location = answers.location || '[your market]';
  const contentLength = answers['content-length'] || 'comprehensive';
  const format = answers.format || 'guide';
  const specificFocus = answers['specific-focus'] || '';

  const topicDetails = {
    'first-time-buyer': 'First-Time Home Buying Process',
    'selling-process': 'How to Sell Your Home',
    'market-conditions': 'Understanding Current Market Conditions',
    'financing': 'Home Financing & Mortgage Options',
    'inspection': 'Home Inspection Guide',
    'negotiation': 'Negotiation Strategies for Buyers/Sellers'
  };

  return `You are a real estate expert creating educational content for clients.

TOPIC: ${topicDetails[topic as keyof typeof topicDetails]}
AUDIENCE: ${audience}
LOCATION: ${location}
CONTENT DEPTH: ${contentLength}
FORMAT: ${format}

SPECIFIC FOCUS:
${specificFocus || 'Cover all essential aspects of this topic'}

TASK: Create comprehensive, actionable educational content that empowers ${audience} to make informed decisions.

CONTENT REQUIREMENTS:

${contentLength === 'quick-tips' ? `
**Quick Tips (5-7 Key Points):**
- Each tip should be immediately actionable
- Include "why this matters"
- Keep it scannable and memorable
` : contentLength === 'comprehensive' ? `
**Comprehensive Guide:**
1. Introduction - Why this matters
2. Overview - The big picture
3. Step-by-step process
4. Common pitfalls to avoid
5. Pro tips from an experienced agent
6. Next steps/action items
7. FAQs
8. Local market context for ${location}
` : `
**In-Depth Deep Dive:**
- Extensive background and context
- Detailed step-by-step breakdowns
- Real-world examples and case studies
- Expert insights and insider knowledge
- Advanced strategies
- Resource links and additional reading
`}

TONE & APPROACH:
- Educational but not condescending
- Empowering, not overwhelming
- Use analogies and real examples
- Address fears and concerns directly
- ${audience === 'first-time' ? 'Explain industry jargon in plain language' : audience === 'investors' ? 'Focus on ROI and market analysis' : 'Balance beginner-friendly and advanced insights'}

${format === 'checklist' ? `
OUTPUT FORMAT (Checklist):
**${topicDetails[topic as keyof typeof topicDetails]}: Your Complete Checklist**

Before You Start:
☐ [Item 1 with brief explanation]
☐ [Item 2 with brief explanation]

[Continue with logical sections...]
` : format === 'faq' ? `
OUTPUT FORMAT (FAQ):
**${topicDetails[topic as keyof typeof topicDetails]}: Frequently Asked Questions**

Q1: [Most common question]
A: [Clear, detailed answer]

[Continue with 10-15 essential questions...]
` : `
OUTPUT FORMAT:
# ${topicDetails[topic as keyof typeof topicDetails]}

[Introduction paragraph that hooks the reader]

[Main content sections...]

[Conclusion with clear next steps]
`}

SPECIAL REQUIREMENTS:
- Include ${location}-specific insights where relevant
- Address common misconceptions
- Provide specific, actionable advice (not generic platitudes)
- Use data/statistics to support key points
- End with clear next steps or call-to-action

Make this the kind of resource that clients bookmark and share.`;
}

// Negotiation Talking Points (NEW)
function generateNegotiationPointsPrompt(answers: Record<string, string>): string {
  const negotiationType = answers['negotiation-type'] || 'buyer-offer';
  const clientRole = answers['client-role'] || 'buyer';
  const propertyDetails = answers['property-details'] || '';
  const currentSituation = answers['current-situation'] || '';
  const clientGoals = answers['client-goals'] || '';
  const leveragePoints = answers['leverage-points'] || '';
  const tone = answers.tone || 'collaborative';

  const negotiationContext = {
    'buyer-offer': 'Making Initial Offer',
    'seller-counter': 'Countering Buyer Offer',
    'inspection': 'Post-Inspection Negotiations',
    'appraisal-gap': 'Appraisal Came in Low',
    'multiple-offers': 'Multiple Offer Situation'
  };

  const toneGuidance = {
    'collaborative': 'Win-win approach. Focus on mutual benefit and finding common ground.',
    'assertive': 'Strong, confident approach. Advocate firmly for your client without being aggressive.',
    'empathetic': 'Understanding approach. Acknowledge the other party\'s position while advancing your client\'s interests.',
    'data-driven': 'Analytical approach. Use market data, comps, and facts to support your position.'
  };

  return `You are a skilled real estate negotiator preparing talking points for an agent.

NEGOTIATION CONTEXT:
- Type: ${negotiationContext[negotiationType as keyof typeof negotiationContext]}
- Representing: ${clientRole}
- Property: ${propertyDetails}

CURRENT SITUATION:
${currentSituation}

CLIENT GOALS:
${clientGoals}

LEVERAGE POINTS:
${leveragePoints}

NEGOTIATION APPROACH: ${tone}
${toneGuidance[tone as keyof typeof toneGuidance]}

TASK: Create comprehensive negotiation talking points that help the agent advocate effectively for their client.

OUTPUT STRUCTURE:

**1. OPENING POSITION**
- Your initial stance
- How to frame it positively
- Key message to emphasize

**2. JUSTIFICATION & SUPPORT**
- Market data to support your position
- Comparable sales analysis
- Property-specific factors
- Timeline/urgency considerations

**3. CONCESSION STRATEGY**
- What you can offer (if needed)
- What you need in return
- Order of concessions (give small, ask big)
- Walk-away point

**4. KEY TALKING POINTS**
For each major negotiation element (price, terms, contingencies, timeline):
- Your position
- Why it's reasonable
- Counter to expected objections
- Alternative solutions

**5. OBJECTION RESPONSES**
Anticipate the other side's likely objections:
- Objection: [What they'll say]
- Response: [How to address it]
- Reframe: [Turn it to your advantage]

**6. CREATIVE SOLUTIONS**
Beyond price - other ways to bridge the gap:
- Closing date flexibility
- Seller concessions
- Inspection resolution ideas
- Financing options

**7. SCRIPTS FOR TOUGH CONVERSATIONS**
Actual language to use:
- "I understand your position, however..."
- "Let's find a solution that works for both parties..."
- "Based on the data, here's what makes sense..."
- ${tone === 'assertive' ? '"My client is firm on this point because..."' : tone === 'empathetic' ? '"I can see why that\'s important to you. Here\'s what\'s important to us..."' : '"The numbers show that..."'}

**8. DEAL-MAKING SCENARIOS**
If they say X, you respond with Y:
- Scenario 1: [Likely response] → [Your counter]
- Scenario 2: [Likely response] → [Your counter]
- Scenario 3: [Likely response] → [Your counter]

**9. TIMING & DELIVERY TIPS**
- When to push, when to pause
- How to maintain momentum
- When to escalate to principals

**10. SUCCESS METRICS**
- Ideal outcome
- Acceptable outcome
- Walk-away point

STYLE:
- Be specific and tactical (not generic advice)
- Include exact phrases and scripts
- Anticipate multiple scenarios
- Focus on win-win when possible
- Protect your client's interests firmly but professionally

Make this so thorough that the agent feels confident and prepared for any response.`;
}

// Main prompt router (declared after all generators)
function generatePrompt(useCaseId: string, answers: Record<string, string>, voicePreference: string = 'professional'): string {
  // Voice preference instructions
  const voiceInstructions = {
    professional: 'Use a professional, polished tone. Clear, authoritative, and trustworthy. Like a seasoned expert.',
    casual: 'Use a warm, friendly, conversational tone. Like talking to a friend over coffee. Natural and approachable.',
    enthusiastic: 'Use an energetic, excited tone. Show passion and enthusiasm. Inspire action with positivity.',
    empathetic: 'Use a caring, understanding tone. Lead with empathy and emotional intelligence. Build deep trust.'
  };

  const voiceInstruction = voiceInstructions[voicePreference as keyof typeof voiceInstructions] || voiceInstructions.professional;

  let basePrompt: string;

  switch (useCaseId) {
    case 'sphere-script':
      basePrompt = generateCallingScriptPrompt(answers);
      break;
    case 'social-content':
      basePrompt = generateSocialContentPrompt(answers);
      break;
    case 'email-sequence':
      basePrompt = generateEmailSequencePrompt(answers);
      break;
    case 'listing-description':
      basePrompt = generateListingDescriptionPrompt(answers);
      break;
    case 'consultation-script':
      basePrompt = generateConsultationScriptPrompt(answers);
      break;
    case 'objection-handling':
      basePrompt = generateObjectionHandlingPrompt(answers);
      break;
    case 'open-house-followup':
      basePrompt = generateOpenHouseFollowupPrompt(answers);
      break;
    case 'market-report':
      basePrompt = generateMarketReportPrompt(answers);
      break;
    case 'video-script':
      basePrompt = generateVideoScriptPrompt(answers);
      break;
    case 'expired-fsbo':
      basePrompt = generateExpiredFSBOPrompt(answers);
      break;
    case 'cma-narrative':
      basePrompt = generateCMANarrativePrompt(answers);
      break;
    case 'thank-you':
      basePrompt = generateThankYouPrompt(answers);
      break;
    case 'virtual-tour-script':
      basePrompt = generateVirtualTourScriptPrompt(answers);
      break;
    case 'buyer-seller-education':
      basePrompt = generateBuyerSellerEducationPrompt(answers);
      break;
    case 'negotiation-points':
      basePrompt = generateNegotiationPointsPrompt(answers);
      break;
    default:
      return 'Prompt generation in progress...';
  }

  // Append voice preference instruction
  return `${basePrompt}\n\nVOICE & TONE: ${voiceInstruction}`;
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
  categoryHeader: {
    marginBottom: '16px',
  },
  categoryTitle: {
    fontSize: '14px', // Increased from 12px for minimum readability
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em', // Improved from 1px for better readability
    color: '#9ca3af', // Increased from #64748b for AA contrast (7.8:1)
    marginBottom: '0', // Remove margin since header handles spacing
    paddingLeft: '4px',
    lineHeight: 1.4,
  },
  useCaseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
    height: '150px', // Increased from 120px to accommodate text wrapping
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start', // Align from top for consistency
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
