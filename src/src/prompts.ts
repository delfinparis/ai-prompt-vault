// src/prompts.ts

// Module definitions with 10 prompts each. These replicate the initial 12 modules.
const M1 = [
  {title:"90-Day Inbound Lead Blueprint",quick:"Act as a marketing strategist for [market]. Build a 90-day plan for [buyer/seller/investor] leads via [channel]. Include weekly calendar, KPIs, 5 hooks, UTMs.", role:"marketing strategist",deliverable:"12-week calendar (theme|channel|CTA|goal) + KPI table + 5 hooks + UTM plan.",success:"≥15 leads/week by week 6; CPL <$[Y]."},
  {title:"YouTube Channel Plan (12 Episodes)",quick:"Design a 12-episode YouTube plan for [niche] in [market]: titles, hooks, CTAs, b-roll, keywords. Include upload cadence + thumbnail angles.", role:"content strategist",deliverable:"Table: Ep | Title | Hook | CTA | Keyword | B-roll | Thumbnail idea.",success:"≥5% CTR; Avg view duration ≥40%."},
  {title:"Local SEO Starter Kit",quick:"Create a local SEO checklist for [city]: GMB, citations, review cadence, FAQ schema, location pages. Output priorities + timelines.", role:"SEO consultant",deliverable:"Checklist with High/Med/Low impact + owner + deadline.",success:"Rank top-3 for [service + city] within 90 days (leading indicators)."},
  {title:"Listing Lead Magnet Funnel",quick:"Draft a ‘Home Valuation + Market Update’ funnel with landing copy, 3-email nurture, SMS, and retargeting angles.", role:"funnel architect",deliverable:"Page wireframe + copy + 3 emails + 2 SMS + 3 retargeting hooks.",success:"Opt-in ≥25%; reply ≥15% by Day 7."},
  {title:"Neighborhood Guide Generator",quick:"Produce a neighborhood guide template for [area]: lifestyle, schools, commute, pricing, 5 hotspots, map idea.", role:"local content creator",deliverable:"PDF outline + blog outline + social carousel notes.",success:"Guide downloads ≥50/month."},
  {title:"Open House Promo Pack",quick:"Create pre/during/post open house assets: IG reel script, flyer copy, sign-in CTA, follow-up text/email.", role:"event marketer",deliverable:"Run-of-show + assets + follow-up sequence.",success:"CRM capture rate ≥30% of visitors."},
  {title:"Referral Engine Email Series",quick:"Write a 4-email referral/introductions series for SOI: value first, social proof, soft ask, reminder.", role:"copywriter",deliverable:"4 emails + subject lines + cadence.",success:"Reply rate ≥12%; referrals per 100 ≥5."},
  {title:"Instagram Reels Calendar (30 Days)",quick:"Build a 30-day Reels plan: hooks, captions, on-screen beats, CTAs. Balance education/story/listings.", role:"short-form coach",deliverable:"Table: Day | Idea | Hook | Caption | CTA.",success:"3 posts/week; avg reach ↑ 50% in 30 days."},
  {title:"Brand Positioning Statement",quick:"Craft a unique positioning + tagline for [niche] in [market] with proof points and voice guide.", role:"brand strategist",deliverable:"1-liner + 3 proof bullets + tone/style notes.",success:"Message used consistently across site/social."},
  {title:"Review & Social Proof System",quick:"Design a post-closing review capture flow: ask script, links, reminder cadence, showcase placements.", role:"reputation manager",deliverable:"Templates + reminder SOP + showcase widgets.",success:"≥70% of closed clients leave a review."}
];

const M2 = [
  {title:"Weekly Productivity Audit",quick:"Audit calendar/tasks for a team of [#] in [market]. Table: Task | Time | ROI | Automate/Delegate/Delete | Tool.",role:"productivity coach",success:"Reclaim ≥5 hours/agent/week."},
  {title:"Daily Checklist Builder",quick:"Create a 12-task daily checklist balancing pipeline/admin/prospecting/learning. Export-friendly.",role:"workflow architect",deliverable:"CSV-style list AM/Mid/PM + durations.",success:"≥80% daily completion."},
  {title:"Pipeline SOP (Lead→Close)",quick:"Define CRM stages, entry/exit criteria, tasks, SLAs, and 2 automations/stage.",role:"CRM consultant",deliverable:"Table: Stage | Entry | Exit | Tasks | SLA | Owner.",success:"SLA compliance ≥95%."},
  {title:"Listing Launch Timeline (T-14→T+14)",quick:"Create a listing launch Gantt with owners, assets, dependencies, compliance checks.",role:"project manager",deliverable:"Timeline table + checklist.",success:"0 missed disclosures; on-time go-live."},
  {title:"Buyer Onboarding Journey",quick:"Map onboarding for [buyer persona]: welcome pack, expectations, template updates.",role:"CX designer",deliverable:"Timeline + message templates.",success:"Buyer CSAT ≥9/10."},
  {title:"Vendor Directory Framework",quick:"Sheet structure for lenders/inspectors/trades with verification cadence and disclaimers.",role:"ops manager",success:"Quarterly verification 100%."},
  {title:"File Naming & Docs Policy",quick:"Create naming convention + folder tree + retention schedule for [cloud tool].",role:"compliance officer",success:"Doc retrieval <2 minutes."},
  {title:"Inbox & DM Triage SOP",quick:"Multi-channel SLA + templates + escalation path; rules for auto-labels/tasks.",role:"communication lead",success:"Avg response <15 min; 0 missed leads."},
  {title:"Post-Closing Handoff Process",quick:"Checklist to TC: survey, review ask, gift, anniversary automation.",role:"transaction coordinator",success:"100% clients enter nurture."},
  {title:"One-Page Operating System",quick:"Create a 1-pager: Vision, 90-day goals, KPIs, meeting rhythm, org chart.",role:"business coach",success:"<30 min weekly meeting, KPI alignment."}
];

const M3 = [
  {title:"GCI Reverse-Engineering",quick:"Turn GCI [$X] and avg side [$Y] into weekly activity targets using conversion rates.",role:"performance coach",deliverable:"Table: Goal | Activity | Volume | Assumptions.",success:"Exact # calls/appts to hit target."},
  {title:"Weekly Scorecard",quick:"Scorecard for leading/lagging: calls, contacts, appts, contracts, posts.",role:"ops analyst",success:"Update in <5 min weekly."},
  {title:"Prospecting Habit Protocol",quick:"Build a 20-min daily ritual for [method]: trigger→routine→reward.",role:"behavioral coach",success:"≥5 new contacts/day × 21 days."},
  {title:"Weekly Reflection Template",quick:"One-page review: wins, numbers, blockers, experiments, focus.",role:"growth mentor",success:"Consistent self-reporting trends."},
  {title:"30-Day Skill Sprint",quick:"Design a 30-day sprint for [skill]: daily drills + checkpoints.",role:"training manager",success:"≥20% competence gain."},
  {title:"Goal Red-Team Exercise",quick:"List reasons you might miss [goal] + mitigation plan.",role:"strategic coach",success:"2 preventions implemented now."},
  {title:"Accountability Partner Rules",quick:"Create a 15-min weekly accountability agenda + commitment contract.",role:"team coach",success:"≥80% completion in 4 weeks."},
  {title:"Personal P&L Dashboard",quick:"Agent P&L: income, taxes, savings, investments; alerts <40% margin.",role:"financial coach",success:"Know net profit weekly."},
  {title:"Morning Priming Prompts",quick:"3-min exercise: affirmation, visualization, gratitude, micro-goal.",role:"mindset coach",success:"Mood/energy ≥8/10 after 7 days."},
  {title:"End-of-Day Debrief",quick:"Nightly check-in: what mattered, improvements, top win; auto-log.",role:"reflection facilitator",success:"≥70% completion in 30 days."}
];

const M4 = [
  {title:"Pricing Strategy Script",quick:"Price talk track with comps, DOM, trends; analogy→data→position→CTA.",role:"listing-presentation coach",success:"Seller accepts within 5%."},
  {title:"Commission Value Conversation",quick:"Handle ‘lower your commission’: acknowledge→value reframe→choice close.",role:"negotiation coach",success:"≥70% full fee retention."},
  {title:"FSBO Conversion Sequence",quick:"3 calls + 3 texts for FSBO with [motivation/timeline]; compliant phrasing.",role:"lead-conversion specialist",success:"≥20% appointment rate."},
  {title:"Competing Agent Response",quick:"Acknowledge multi-agent interviews; differentiate→proof→low-risk CTA.",role:"persuasion coach",success:"≥50% signed listing."},
  {title:"Rate-Sensitivity Buyer Talk",quick:"Explain payment impact; discuss buy-downs/refi-later with disclaimer.",role:"mortgage conversationalist",success:"≥70% remain active."},
  {title:"Multiple-Offer Strategy",quick:"Buyer plan: prep, terms, escalation, appraisal gap, debrief.",role:"buyer strategist",success:"Win rate ≥60% multi-offer."},
  {title:"Buyer Consult Deck Outline",quick:"Slide outline: process, timeline, stats, agency, next steps.",role:"training designer",success:"≥90% to signed agency."},
  {title:"Listing Refresh Plan",quick:"At Day [X] low activity: reshoot, recopy, retarget, reprice, relaunch.",role:"marketing consultant",success:"Showings ↑ ≥30% in 7 days."},
  {title:"Graceful Disengagement Scripts",quick:"5 ways to exit misaligned clients while preserving goodwill.",role:"relationship strategist",success:"Positive reviews maintained."},
  {title:"Repair Request Negotiation",quick:"Matrix for inspection items; fix/credit/price + sample email.",role:"contract coach",success:"≥80% accepted w/o large cuts."}
];

const M5 = [
  {title:"White-Glove Onboarding",quick:"3 touches in 72h: welcome, next-7-days checklist, FAQ video.",role:"CX designer",success:"Week-1 CSAT ≥9/10."},
  {title:"Weekly Update Cadence",quick:"Email + text summary + CRM log: progress, next steps, key dates.",role:"communications strategist",success:"0 status-check inquiries."},
  {title:"Bad-News Playbook",quick:"Scripts for appraisal shortfall/inspection issues: acknowledge→facts→options→next step.",role:"crisis comms coach",success:"≥90% stay engaged."},
  {title:"Move-Day Concierge",quick:"Checklist: utilities, vendors, locksmith, mail, welcome kit + 7/30/90 surveys.",role:"service planner",success:"≥80% survey response; ≥1 referral in 6 mo."},
  {title:"Expectations Agreement",quick:"Agreement: communication hours, response times, decision rights.",role:"client-relations consultant",success:"0 major comms breakdowns."},
  {title:"Year-1 Maintenance Series",quick:"Quarterly maintenance emails for [property/climate] + vendor CTAs.",role:"nurture specialist",success:"Open ≥40%; click ≥10%."},
  {title:"Vendor Issue Escalation",quick:"Flow: client→agent→vendor→broker→legal; logging + timeline.",role:"risk manager",success:"Ack <24h; resolve <72h."},
  {title:"Surprise & Delight Moments",quick:"5 touchpoints by milestone with budget $[X] and personalization.",role:"retention strategist",success:"Referrals ↑ ≥20% YoY."},
  {title:"Service Recovery Templates",quick:"Apology|Accountability|Remedy|Re-commit|Follow-up + public-review reply.",role:"reputation consultant",success:"Complaints closed; ≥4★ avg."},
  {title:"Closing-Day Story Pack",quick:"Shot list, captions, hashtags, review ask + compliance note.",role:"social content coach",success:"≥70% clients post/tag in 24h."}
];

const M6 = [
  {title:"12-Month Cashflow Model",quick:"Forecast income/expenses with tax, reserves, profit targets; monthly table.",role:"finance coach",success:"Know runway & savings by month 12."},
  {title:"Marketing Budget Allocator",quick:"Distribute $[X]/mo across [channels]; CPL targets; scale/cut rules.",role:"marketing CFO",success:"≤$[Y] CPL; ≥20% ROI/channel."},
  {title:"Profitability Review Audit",quick:"Analyze expenses by ROI; keep/cut/renegotiate + 90-day savings plan.",role:"business consultant",success:"Reduce expenses ≥15%."},
  {title:"Commission Advance Tree",quick:"Decision framework: cashflow, deal certainty, cost, alternatives.",role:"risk advisor",success:"0 unnecessary advances."},
  {title:"Team Compensation Plan",quick:"Comp for ISA/LA/TC: base/split/bonus/cap + retention incentives.",role:"comp architect",success:"Turnover <10% annually."},
  {title:"Quarterly Tax Planning",quick:"Checklist: estimates, deductions log, retirement, receipts; reminders.",role:"tax strategy coach",success:"100% on-time payments."},
  {title:"Investor Service Line",quick:"Offering for investors: criteria, underwriting sheet, fees, deck.",role:"business developer",success:"Launch in ≤45 days."},
  {title:"Market Analytics Template",quick:"Dashboard: SP/LP, DOM, MOI for [submarket/type] with talking points.",role:"data analyst",success:"Monthly update informs listings."},
  {title:"Vendor RFP Generator",quick:"RFP template: scope, deliverables, metrics, pricing, rubric.",role:"procurement advisor",success:"Clarity pre-contract."},
  {title:"Insurance & Risk Checklist",quick:"Policies: E&O, cyber, GL, data; renewal dates; claims protocol.",role:"risk manager",success:"0 coverage gaps; on-time renewals."}
];

const M7 = [
  {title:"BATNA Power Map",quick:"Build BATNA table for [scenario]; include risk check.",role:"negotiation coach",success:"≥2 creative options + thresholds."},
  {title:"Concession Strategy Ladder",quick:"Rank tradeables by cost to client vs value to other party.",role:"deal architect",success:"≥50% concessions offset."},
  {title:"Anchoring Language Framework",quick:"3 anchors: data-first, emotional story, bracketed range; phrases to avoid.",role:"persuasive linguist",success:"Offers land within 3% target."},
  {title:"Calibrated Question Builder",quick:"10 ‘how/what’ questions + labels to uncover constraints.",role:"Voss-style trainer",success:"≥50% more info disclosed."},
  {title:"Appraisal Gap Plan",quick:"If appraisal < offer by [$X]: rebuttal, reprice, bridge cash, renegotiate, cancel.",role:"transaction strategist",success:"≥70% resolved w/o cancel."},
  {title:"Inspection Resolution Matrix",quick:"Minor/major matrix: repair/credit/ignore with suggested language.",role:"mediator",success:"≥90% resolution in 3 days."},
  {title:"Deadline Pressure Playbook",quick:"Resist TILI deadlines: scripts, alternatives, reframes; pre-deadline checklist.",role:"time-based tactician",success:"0 rushed concessions."},
  {title:"Deal Rescue Protocol",quick:"Save deals with financing/inspection/cold-feet issues; flow + scripts.",role:"conflict specialist",success:"≥60% revived."},
  {title:"Multiple-Offer Ethics Guide",quick:"Ethical handling in [state/brokerage]: disclosure, offer mgmt, scripts.",role:"compliance advisor",success:"100% compliance; 0 complaints."},
  {title:"Negotiation Post-Mortem",quick:"Debrief: what worked, surprises, missed clues, system change; rubric.",role:"reflective coach",success:"Complete within 48h of close."}
];

const M8 = [
  {title:"Needs-Match Matrix",quick:"Must-have vs nice-to-have matrix for [persona] in [market] with commute band [X–Y].",role:"profiling strategist",deliverable:"Weighted table with fit scores.",success:"≥3 neighborhoods fit ≥80%."},
  {title:"Smart Search Strings",quick:"MLS/portal boolean strings + alerts for [criteria] across MLS/Zillow/Redfin.",role:"portal power-user",success:"≤3 irrelevant listings/week."},
  {title:"Off-Market Outreach",quick:"Letter/email/text for [neighborhood/type]; compliant; opt-out line.",role:"listing acquisition specialist",success:"≥5% response / 100 sends."},
  {title:"New-Build vs Resale",quick:"Side-by-side with lifecycle cost + agent talking points.",role:"buyer educator",success:"Client chooses confidently."},
  {title:"Lender Options Explainer",quick:"Compare lenders/programs for [credit/income profile] with pros/cons.",role:"financing translator",success:"Select 2 qualified options in 48h."},
  {title:"Investor Deal Screener",quick:"Quick screen for [strategy]: cap rate, cash-on-cash, DSCR estimates.",role:"underwriting coach",success:"Shortlist in under 10 minutes."},
  {title:"Relocation Brief",quick:"Relocation pack: schools, commute, rents vs buys, neighborhoods.",role:"relocation advisor",success:"Client shortlists 3 areas."},
  {title:"School-Zone Navigator",quick:"Map search + school ratings + taxes for [family profile].",role:"family move strategist",success:"Confidence in top 2 zones."},
  {title:"Downsizer Options Map",quick:"Condos/townhomes w/ accessibility, HOA insights, budgets.",role:"downsizing consultant",success:"Tour list within 48h."},
  {title:"First-Time Buyer Roadmap",quick:"From pre-approval to close with expectation management scripts.",role:"first-time coach",success:"On-track milestones each week."}
];

const M9 = [
  {title:"12-Touch Sphere Plan",quick:"Monthly plan for SOI/past clients/vendors with channel + theme + CTA.",role:"retention strategist",success:"≥30% engagement/touch."},
  {title:"Home-Anniversary Automation",quick:"CRM workflow: reminder→gift tier [$25/$50/$100]→message→social post.",role:"automation expert",success:"≥95% anniversaries auto-celebrated."},
  {title:"Community Spotlight Series",quick:"12-episode plan on local businesses/nonprofits/events in [neighborhood].",role:"local content creator",success:"+25% local followers; 3 collabs."},
  {title:"Client-Appreciation Event",quick:"Plan for [season/theme]: timeline, vendors, sponsors, RSVP.",role:"event marketer",success:"≥60% attendance; ≥3 referrals."},
  {title:"Review-to-Referral Bridge",quick:"Turn 5★ reviews into warm referral asks (text/email/DM).",role:"relationship copywriter",success:"≥20% provide a referral in 30 days."},
  {title:"Newsletter Engine",quick:"Monthly template: market stat, story, tip, local pick, CTA.",role:"newsletter editor",success:"Open ≥35%, click ≥6%."},
  {title:"Past-Client Care Calendar",quick:"Quarterly touches: maintenance notes, check-ins, invites.",role:"client care planner",success:"Retention/referrals up YoY."},
  {title:"Hyperlocal Facebook Group",quick:"Start/moderate a local group: rules, weekly topics, promo limits.",role:"community manager",success:"1000 members in 6 mo."},
  {title:"Vendor Co-Marketing Kit",quick:"Co-marketing SOP with lenders/contractors; shared content calendar.",role:"partnership lead",success:"2 co-branded assets/month."},
  {title:"‘Just Closed’ Story Framework",quick:"Client story → lesson → CTA format for posts and emails.",role:"story coach",success:"Save/share rate ↑ 25%."}
];

const M10 = [
  {title:"Landing Page CRO Audit",quick:"Audit [URL]: headline, proof, CTA, friction, load/mobile; give fixes + examples.",role:"CRO expert",success:"Conv ↑ ≥30% in 14 days."},
  {title:"7-Day Follow-Up Sequence",quick:"SMS+Email for [source]: Day-by-day copy with branches.",role:"sales automation copywriter",success:"≥25% reply in 7 days."},
  {title:"No-Show Prevention Flow",quick:"Booking → 24h → 1h reminders + ‘what to expect’ checklist.",role:"workflow optimizer",success:"No-shows <10%."},
  {title:"Retargeting Ad Set",quick:"3 ad angles (pain/proof/curiosity) for visitors who bounced on [page].",role:"digital ad strategist",success:"Re-engagement CTR ≥15%."},
  {title:"Site Chatbot Script",quick:"Qualify and book leads: greeting→qualify→offer→booking→CRM tags.",role:"AI convo designer",success:"Chat→lead ≥25%."},
  {title:"AI Systems Stack",quick:"Design AI stack for [team size]: workflows, tools, integration notes, privacy.",role:"tech architect",success:"Admin time −30%/week."},
  {title:"Super-Prompt Trio",quick:"3 super-prompts: Listing Pack, Seller Brief, Negotiation Coach.",role:"prompt engineer",success:"10× output speed & consistency."},
  {title:"AI Usage & Ethics Policy",quick:"Policy for [brokerage]: purpose, use, data, verification, disclosure, fair housing.",role:"compliance strategist",success:"100% agent compliance."},
  {title:"Daily AI Briefing Ritual",quick:"10-min habit: scan sources, save, apply, share; 3 daily questions.",role:"learning coach",success:"30-day habit formed."},
  {title:"AI Market Dashboard Spec",quick:"KPIs (New Listings, DOM, MOI, SP/LP, $/sqft) + auto-summary + CSV/Notion embed.",role:"product designer",success:"Used daily for client reports."}
];

const M11 = [
  {title:"AI Automation Blueprint",quick:"Map automations for [team size] with [tools]; triggers, actions, time saved.",role:"AI systems architect",success:"≥10 hrs saved/agent/week."},
  {title:"Lead Routing + Auto Follow-Up",quick:"Source→CRM→owner assign→SMS/email→task; include tags and SLA.",role:"CRM automation consultant",success:"100% leads replied <5 min."},
  {title:"Post-Closing Drip (12 Mo.)",quick:"Design 12-month nurture: monthly topic + personalization fields.",role:"retention automation designer",success:"≥25% repeat/referral in 12 mo."},
  {title:"Content Repurposing Flow",quick:"Turn 1 long video/blog into 5 assets via AI + schedulers.",role:"content systems engineer",success:"5× outputs in <30 min."},
  {title:"Transaction Status Bot",quick:"Status change → templated client updates via SMS/email.",role:"workflow developer",success:"0 ‘what’s next?’ messages."},
  {title:"Smart Scheduling Sync",quick:"Calendly↔Google↔CRM; reminders + logging; double-book prevention.",role:"calendar workflow designer",success:"No-shows <5%."},
  {title:"AI Email → Task",quick:"Classify Gmail → create tasks in Todoist/Notion with GPT descriptors.",role:"productivity consultant",success:"100% inbox triage automated."},
  {title:"Weekly Metrics Summary Bot",quick:"Compile leads/showings/offers into Slack/email with graph.",role:"data-reporting specialist",success:"100% team awareness weekly."},
  {title:"Auto Social Posting",quick:"New listing/closing/blog → caption via AI → publish → log.",role:"marketing automation expert",success:"≥3 posts/week automated."},
  {title:"‘/delegate’ Task Assistant",quick:"Slash-command creates detailed tasks with GPT expansion.",role:"VA workflow designer",success:"−80% manual task entry time."}
];

const M12 = [
  {title:"Market Data Source Finder",quick:"Top 10 data/report/API sources for [national/state/city] stats; frequency + use case.",role:"data researcher",success:"Updated data weekly."},
  {title:"Realtor Blog Curator",quick:"Top 15 blogs for real estate/marketing/AI; why valuable + frequency.",role:"content scout",success:"15-min/day reading routine."},
  {title:"YouTube Channel Radar",quick:"Top 15 channels for sales/AI/branding/tech; best playlists.",role:"media analyst",success:"Curate 3 videos/week."},
  {title:"Podcast Playbook",quick:"Top 15 podcasts; theme, length, why listen; weekly schedule.",role:"learning strategist",success:"Daily 1-episode habit."},
  {title:"Substack/Newsletter Watchlist",quick:"10 must-subscribe AI+RE newsletters; focus + frequency + value.",role:"knowledge curator",success:"Weekly insight pipeline."},
  {title:"Social Expert Tracker",quick:"Top 20 LinkedIn/X/IG/TikTok accounts; niche + notable insights.",role:"social intel researcher",success:"Comment weekly on 3 posts."},
  {title:"Realtor News Portal Guide",quick:"10 news outlets for housing/policy/tech; bias/slant + usage tips.",role:"news curator",success:"Daily briefing workflow."},
  {title:"Trend Watch Prompt",quick:"Weekly search/prompt template to find emerging AI/housing trends.",role:"trend analyst",success:"Monday 9am ritual in place."},
  {title:"Local Intelligence Dashboard",quick:"Template aggregating permits, zoning, dev, employers for [city/county].",role:"hyperlocal researcher",success:"1-page local insights hub."},
  {title:"Personal Learning Roadmap (6 mo.)",quick:"Month-by-month plan mixing blogs, podcasts, YouTube, newsletters, AI practice.",role:"learning architect",success:"+10% efficiency or GCI in 6 mo."}
];

// Final export: array of module arrays
export const prompts = [M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M11, M12];