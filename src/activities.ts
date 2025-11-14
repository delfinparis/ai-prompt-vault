// Core data structures for the Realtor Execution App

export type ActivityStatus = 'doing-consistently' | 'doing-sometimes' | 'not-doing';
export type ActivityCategory = 'prospecting' | 'relationship' | 'marketing' | 'systems' | 'development';

// Psychological barriers that prevent action
export type BarrierType = 'fear' | 'skill' | 'authenticity' | 'time' | 'technical' | 'motivation';

// Universal psychological barriers (30 years psychology/coaching research)
// These apply across ALL activities and map to specific coaching interventions
export const UNIVERSAL_BARRIERS = [
  { 
    id: 'fear-judgment', 
    label: 'Fear of judgment or rejection', 
    subtext: '"What will they think of me?"',
    type: 'fear' as BarrierType,
    coachingTip: 'Rejection is information, not a reflection of your worth. Every "no" is data that refines your approach. Let\'s reframe this as curiosity instead of seeking approval.',
    intervention: {
      validate: 'Fear of rejection is hardwired - it kept our ancestors alive. Your brain is doing its job.',
      reframe: 'But here\'s the truth: people are thinking about YOU way less than you think. They\'re worried about their own stuff. And the ones judging? They\'re not your people anyway.',
      microAction: 'Start with someone safe - a past client who loves you, or a friend in your sphere. Test the water with low stakes first.',
      mantra: '"I\'m helping, not bothering. If it\'s not for them, it\'s for someone else."'
    }
  },
  { 
    id: 'perfectionism', 
    label: 'Perfectionism or fear of failure', 
    subtext: '"If I can\'t do it perfectly, why bother?"',
    type: 'fear' as BarrierType,
    coachingTip: 'Done is better than perfect. Your first version doesn\'t need to be your best version. Let\'s aim for "good enough to help someone" and iterate from there.',
    intervention: {
      validate: 'You have high standards - that\'s actually a strength. But it becomes a cage when it stops you from starting.',
      reframe: 'Perfectionism isn\'t about excellence - it\'s about fear of criticism. Excellence is iteration. Version 1 can\'t exist without Version 0.',
      microAction: 'Set a timer for 10 minutes. Whatever you create in that time IS the finished version. Ship it. Perfect is the enemy of done.',
      mantra: '"B+ work done beats A+ work imagined."'
    }
  },
  { 
    id: 'overwhelm', 
    label: 'Overwhelm or don\'t know where to start', 
    subtext: '"This feels too big"',
    type: 'skill' as BarrierType,
    coachingTip: 'Break it into the smallest possible first step. You don\'t need to see the whole staircase, just the first step. Let\'s make this so small it feels almost silly not to do it.',
    intervention: {
      validate: 'Your brain freezes when the task feels undefined or massive. That\'s normal - it\'s called decision paralysis.',
      reframe: 'You don\'t need a plan for the whole thing. You need ONE next action. Just one. The rest will reveal itself.',
      microAction: 'What\'s the stupidly simple first move? Open your laptop? Pull up your CRM? Write one sentence? Do ONLY that. Then stop. You\'ll find momentum takes over.',
      mantra: '"Just the next right step. That\'s all I need to know."'
    }
  },
  { 
    id: 'low-energy', 
    label: 'Low energy, burnout, or exhaustion', 
    subtext: '"I\'m just too tired right now"',
    type: 'motivation' as BarrierType,
    coachingTip: 'Energy follows action more than action follows energy. Can you commit to just 5 minutes? Often starting creates momentum. But also: are you taking care of yourself? Rest isn\'t optional.',
    intervention: {
      validate: 'If you\'re burned out, that\'s real. Your body is telling you something. Honor that.',
      reframe: 'But also: sometimes "tired" is code for "I don\'t want to feel uncomfortable." Be honest - are you physically depleted, or emotionally avoiding?',
      microAction: 'Commit to 5 minutes. Set a timer. If after 5 minutes you\'re truly exhausted, stop and rest guilt-free. But if you feel momentum, keep going.',
      mantra: '"Motion creates emotion. Just 5 minutes."'
    }
  },
  { 
    id: 'discomfort-self-promotion', 
    label: 'Discomfort with self-promotion', 
    subtext: '"I don\'t want to be pushy or salesy"',
    type: 'authenticity' as BarrierType,
    coachingTip: 'You\'re not bragging - you\'re making it easy for people to find help when they need it. Shift from "promoting myself" to "being visible so I can serve." That\'s service, not sales.',
    intervention: {
      validate: 'You were raised to be humble, not brag. That\'s a good value. But it\'s being weaponized against you.',
      reframe: 'Visibility isn\'t vanity - it\'s service. Someone needs what you have. If you hide, they can\'t find you. You\'re doing THEM a disservice by staying quiet.',
      microAction: 'Rewrite your message as "Here\'s something helpful" instead of "Here\'s why I\'m great." Lead with value, not credentials. That\'s not salesy - that\'s generous.',
      mantra: '"Visibility = service. Hiding = selfish."'
    }
  },
  { 
    id: 'present-bias', 
    label: 'Immediate discomfort vs. delayed reward', 
    subtext: '"I don\'t feel like it right now"',
    type: 'motivation' as BarrierType,
    coachingTip: 'Your future self is begging you to do this now. Can you do it FOR them? Imagine yourself 3 months from now thanking yourself for pushing through the discomfort today.',
    intervention: {
      validate: 'Your brain is wired to choose comfort now over rewards later. That\'s evolution - it kept you alive.',
      reframe: 'But you\'re not running from a tiger anymore. The "discomfort" is just fear. And on the other side? Freedom. Money. Success. Your future self is BEGGING you to push through.',
      microAction: 'Picture yourself 90 days from now. What does that version of you wish you\'d done today? Do it for THEM, not for you right now.',
      mantra: '"Future me is counting on present me."'
    }
  },
  { 
    id: 'lack-confidence', 
    label: 'Lack of confidence or skill', 
    subtext: '"I don\'t know how to do this well"',
    type: 'skill' as BarrierType,
    coachingTip: 'You learn by doing, not by waiting until you\'re "ready." Let\'s use AI to scaffold the first version so you\'re not starting from scratch. Competence comes from repetition, not perfection.',
    intervention: {
      validate: 'You don\'t feel ready because you\'re not - YET. Confidence comes AFTER action, not before.',
      reframe: 'Every expert was once a beginner. They didn\'t wait to feel confident - they acted their way into it. You will too.',
      microAction: 'Use AI to draft it for you. Then just tweak it. You\'re not starting from zero - you\'re editing. Way less scary.',
      mantra: '"I don\'t need to be great. I just need to start."'
    }
  },
  { 
    id: 'past-negative', 
    label: 'Past negative experience', 
    subtext: '"I tried this before and it didn\'t work"',
    type: 'fear' as BarrierType,
    coachingTip: 'The past is data, not destiny. What\'s different now? What did you learn? Let\'s adjust the approach based on what you know now. This isn\'t the same situation - you\'re not the same person.',
    intervention: {
      validate: 'You tried and it hurt. That pain is real. Your brain is trying to protect you from feeling that again.',
      reframe: 'But the past taught you what NOT to do. You\'re smarter now. Different market. Different you. This isn\'t round 2 - it\'s a new game.',
      microAction: 'Change ONE variable from last time. Different script, different time of day, different audience. Make it feel new, not repeated.',
      mantra: '"I\'m not the same person who failed. I\'m the one who learned."'
    }
  },
  { 
    id: 'identity-conflict', 
    label: 'Identity conflict', 
    subtext: '"This isn\'t who I am"',
    type: 'authenticity' as BarrierType,
    coachingTip: 'Who you are is who you choose to become. You don\'t have to change your identity - just add a new skill to your toolbox. "I\'m not a cold caller" can become "I\'m someone who reaches out to help people."',
    intervention: {
      validate: 'You have a story about who you are. "I\'m not the type to..." That story feels true because you\'ve believed it for years.',
      reframe: 'But identity isn\'t fixed - it\'s chosen. Every action is a vote for the person you\'re becoming. You don\'t have to BE a salesperson. Just do ONE sales action. That\'s it.',
      microAction: 'Don\'t call it "prospecting" - call it "checking in." Language matters. Reframe the action to fit your identity, not fight it.',
      mantra: '"I\'m not changing who I am. I\'m expanding what I can do."'
    }
  },
  { 
    id: 'distraction', 
    label: 'Distraction or competing priorities', 
    subtext: '"I have more urgent things to do"',
    type: 'time' as BarrierType,
    coachingTip: 'Urgent rarely equals important. What you avoid is often what would move the needle most. Can you time-block 15 minutes FIRST thing tomorrow, before distractions pile up? Protect this time like a client appointment.',
    intervention: {
      validate: 'You\'re busy. There\'s always something screaming for attention. Urgent feels important.',
      reframe: 'But busy-work is a hiding place. The hard stuff - prospecting, content, follow-ups - that\'s what builds the business. Urgent is a trap.',
      microAction: 'Block 15 minutes FIRST THING tomorrow. Before email, before social media, before anything. Make it sacred. This is your business-building time.',
      mantra: '"Urgent is the enemy of important. I choose important."'
    }
  },
  { 
    id: 'fear-success', 
    label: 'Fear of success or change', 
    subtext: '"What if this actually works and my life changes?"',
    type: 'fear' as BarrierType,
    coachingTip: 'Your nervous system fears the unknown more than the familiar struggle. Success means new territory - that\'s scary! Let\'s name it: what specifically are you afraid will change? Often just naming it reduces its power.',
    intervention: {
      validate: 'Success is scarier than failure. Failure is familiar. Success? Unknown. More responsibility. Higher expectations. What if you can\'t handle it?',
      reframe: 'But you\'re already handling hard things. You CAN handle success. And if it gets overwhelming? You\'ll figure it out then. Cross that bridge when you get there.',
      microAction: 'Name the fear out loud: "I\'m afraid if I succeed, then ___." Just naming it strips away some of its power. Then do it anyway.',
      mantra: '"I\'m afraid of success, and I\'m doing it anyway."'
    }
  },
  { 
    id: 'need-certainty', 
    label: 'Need for certainty or control', 
    subtext: '"I can\'t predict the outcome"',
    type: 'fear' as BarrierType,
    coachingTip: 'No one has certainty - they just have willingness to try anyway. Can you get comfortable with "I don\'t know, let\'s find out"? The only way to know if something works is to test it. Small experiments, not big bets.',
    intervention: {
      validate: 'You want guarantees. You want to know it\'ll work before you try. That\'s not crazy - that\'s smart risk management.',
      reframe: 'But there are no guarantees. Ever. The only certainty is that NOT trying guarantees nothing changes. Trying gives you a CHANCE.',
      microAction: 'Treat this as an experiment, not a commitment. "I\'m testing this for 7 days." That\'s it. Low stakes. Gather data. Decide later.',
      mantra: '"I don\'t need certainty. I need curiosity."'
    }
  }
] as const;

export interface BarrierIntervention {
  validate: string; // "Your feeling is real and normal"
  reframe: string; // "But here's a different way to see it"
  microAction: string; // "Try this tiny specific thing"
  mantra: string; // "Repeat this to yourself"
}

export interface Barrier {
  id: string;
  label: string; // Short label shown to user
  type: BarrierType;
  coachingTip: string; // What to tell them to help overcome this
  intervention?: BarrierIntervention; // Deep intervention to get them unstuck
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  impactScore: number; // 1-10, how much this moves the needle
  frequency: string; // "Daily", "Weekly", "Monthly"
  timeEstimate: string; // "5 mins", "30 mins", etc.
  avoidanceReasons: string[]; // Why agents skip this (legacy - for display)
  barriers: Barrier[]; // Specific barriers users can select
  successMetric: string; // What "doing it" looks like
  aiCanHelp: boolean; // Can we generate content for this?
}

export const CORE_ACTIVITIES: Activity[] = [
  {
    id: 'prospecting',
    title: 'Daily Prospecting & Lead Generation',
    description: 'Making calls, sending texts, door knocking, reaching out to sphere (5+ contacts/day)',
    category: 'prospecting',
    impactScore: 10,
    frequency: 'Daily',
    timeEstimate: '30-60 mins',
    avoidanceReasons: [
      'Fear of rejection',
      'Don\'t know what to say',
      'Feels like pushy sales'
    ],
    barriers: [
      { id: 'fear-rejection', label: 'I\'m afraid of rejection or hearing "no"', type: 'fear', coachingTip: 'Rejection is data, not personal. Every "no" gets you closer to a "yes". Let\'s craft a softer, consultative approach that feels like helping, not selling.' },
      { id: 'dont-know-what-say', label: 'I don\'t know what to say or how to start the conversation', type: 'skill', coachingTip: 'You don\'t need to be clever, just curious. Start with "Hey [name], quick question..." and ask about their plans. I\'ll give you the exact script.' },
      { id: 'feels-pushy', label: 'It feels too "salesy" or pushy', type: 'authenticity', coachingTip: 'You\'re right - hard selling is gross. Let\'s shift to market education: "Saw inventory dropped 20% - curious if you\'re thinking about buying/selling?" Info first, pitch never.' },
      { id: 'no-time', label: 'I don\'t have time / keep putting it off', type: 'time', coachingTip: 'Start with just 5 contacts in 15 minutes. That\'s it. Consistency beats volume. Set a phone timer and stop when it rings.' }
    ],
    successMetric: '5+ meaningful contacts per day',
    aiCanHelp: true
  },
  {
    id: 'past-client-followup',
    title: 'Past Client Follow-Up',
    description: 'Regular touchpoints with people who\'ve already bought/sold with you (monthly minimum)',
    category: 'relationship',
    impactScore: 9,
    frequency: 'Monthly',
    timeEstimate: '15-30 mins',
    avoidanceReasons: [
      'Feel like I\'m bothering them',
      'They\'ll call me when ready',
      'Don\'t know what to say'
    ],
    barriers: [
      { id: 'bothering', label: 'I feel like I\'m bothering them or being annoying', type: 'fear', coachingTip: 'You gave them the biggest financial transaction of their life. They WANT to hear from you. It\'s about staying top-of-mind, not hard selling. Let\'s send a market update or neighborhood news - pure value, zero ask.' },
      { id: 'assume-theyll-call', label: 'They\'ll call me if they need something', type: 'motivation', coachingTip: 'They won\'t. 80% of referrals go to agents who stayed in touch. Out of sight = out of mind. A quick text every 30 days keeps you in the game when their friend asks "Know a realtor?"' },
      { id: 'what-to-say-past', label: 'I don\'t know what to say after the transaction', type: 'skill', coachingTip: 'Keep it stupid simple: "Hey [name], just checking in! How\'s the house treating you?" That\'s it. Or send a market update: "Prices up 5% in your area - good news for equity!" I\'ll write it for you.' }
    ],
    successMetric: 'Contact each past client at least monthly',
    aiCanHelp: true
  },
  {
    id: 'lead-response',
    title: 'Immediate Lead Response',
    description: 'Responding to online leads within 5 minutes of inquiry',
    category: 'prospecting',
    impactScore: 9,
    frequency: 'As needed',
    timeEstimate: '2-5 mins',
    avoidanceReasons: [
      'Not monitoring alerts',
      'Will call them later',
      'Overwhelmed by volume'
    ],
    barriers: [
      { id: 'not-monitoring', label: 'I\'m not set up to get real-time alerts', type: 'technical', coachingTip: 'Fix this TODAY. Turn on push notifications for your CRM/lead source. Speed to lead is THE #1 conversion factor. 5 minutes vs 30 minutes = 21x higher contact rate.' },
      { id: 'call-later', label: 'I see it but think "I\'ll call them in an hour"', type: 'motivation', coachingTip: 'They already contacted 3 other agents. The first one to respond wins 80% of the time. Set a rule: see lead = respond within 60 seconds. It doesn\'t have to be perfect, just fast.' },
      { id: 'overwhelmed-leads', label: 'Too many leads, can\'t keep up', type: 'time', coachingTip: 'This is a champagne problem! Either hire an ISA (inside sales assistant) or use a response template: "Got your inquiry! When\'s a good time to chat - mornings or afternoons?" Speed > perfection.' }
    ],
    successMetric: 'Respond within 5 minutes, 100% of the time',
    aiCanHelp: true
  },
  {
    id: 'crm-updates',
    title: 'CRM & Database Management',
    description: 'Adding contacts, logging interactions, setting follow-ups, tagging/categorizing',
    category: 'systems',
    impactScore: 8,
    frequency: 'Daily',
    timeEstimate: '10-15 mins',
    avoidanceReasons: [
      'Boring admin work',
      'Don\'t see immediate ROI',
      'CRM feels complicated'
    ],
    barriers: [
      { id: 'boring', label: 'It\'s boring busywork / I hate admin tasks', type: 'motivation', coachingTip: 'Fair. But undocumented conversations = lost money. Do it immediately after each interaction (phone still in hand). 2 minutes now saves 30 minutes later trying to remember who said what.' },
      { id: 'no-roi', label: 'I don\'t see how this helps me close deals', type: 'motivation', coachingTip: 'Your CRM is your second brain. Without it, you forget to follow up, miss hot leads, and lose referrals. Top producers treat their database like gold. You can\'t manage what you don\'t track.' },
      { id: 'too-complicated', label: 'My CRM is too complicated / I don\'t know how to use it', type: 'technical', coachingTip: 'Ignore 90% of the features. You need 3 things: add contact, log note, set follow-up. That\'s it. Watch one 10-minute YouTube tutorial today and you\'re set.' }
    ],
    successMetric: 'Update after every interaction',
    aiCanHelp: false
  },
  {
    id: 'social-media',
    title: 'Social Media Content',
    description: 'Market updates, listings, neighborhood tours, personal brand content (3-5x/week)',
    category: 'marketing',
    impactScore: 8,
    frequency: 'Weekly',
    timeEstimate: '10-20 mins per post',
    avoidanceReasons: [
      'Don\'t know what to post',
      'Camera shy',
      'Perfectionism paralysis'
    ],
    barriers: [
      { id: 'what-to-post', label: 'I don\'t know what to post / run out of ideas', type: 'skill', coachingTip: 'Use the 3-3-3 rule: 3 market updates (new listings, sold prices), 3 helpful tips (mortgage hacks, staging ideas), 3 personal (coffee shop, local event). Repeat forever. I\'ll generate the captions.' },
      { id: 'camera-shy', label: 'I hate being on camera / I\'m not a "content creator"', type: 'authenticity', coachingTip: 'Good news: you don\'t need video. Start with text + stock photos. People buy from humans, not influencers. Authenticity > production value. Post like you\'re texting a friend.' },
      { id: 'perfectionism', label: 'I overthink it and never actually post', type: 'motivation', coachingTip: 'Done > perfect. Set a 10-minute timer: pick topic, write caption, find image, post. If it takes longer, you\'re overthinking. Imperfect posts get more engagement anyway - people trust raw over polished.' }
    ],
    successMetric: '3-5 posts per week minimum',
    aiCanHelp: true
  },
  {
    id: 'newsletter',
    title: 'Email/Newsletter to Sphere',
    description: 'Market updates, new listings, local events, value-add content to your database',
    category: 'marketing',
    impactScore: 9,
    frequency: 'Monthly',
    timeEstimate: '30-60 mins',
    avoidanceReasons: [
      'No one reads emails anymore',
      'Don\'t know what to write',
      'Takes too long'
    ],
    barriers: [
      { id: 'no-one-reads', label: 'Nobody reads emails anymore / waste of time', type: 'motivation', coachingTip: 'Wrong. Email has 40x higher conversion than social media. Your sphere checks email daily. They might not read every word, but they see YOUR NAME every month. That\'s the goal.' },
      { id: 'what-to-write-newsletter', label: 'I don\'t know what to write about', type: 'skill', coachingTip: 'Same format every time: quick market update (3 bullet points), new listing or recent sale, upcoming open house or event, fun local news. I\'ll write the whole thing in 60 seconds.' },
      { id: 'takes-too-long', label: 'Writing a newsletter takes forever', type: 'time', coachingTip: 'Because you\'re starting from scratch. Use a template + AI. Pull last month\'s email, change the stats, update the listings, hit send. 10 minutes max if you stop overthinking it.' }
    ],
    successMetric: 'Send at least monthly to entire sphere',
    aiCanHelp: true
  },
  {
    id: 'market-research',
    title: 'Property Previews & Market Research',
    description: 'Touring new listings, attending open houses, studying neighborhoods',
    category: 'development',
    impactScore: 7,
    frequency: 'Weekly',
    timeEstimate: '2-4 hours',
    avoidanceReasons: [
      'Time-consuming',
      'Not revenue-generating',
      'Prefer sitting at computer'
    ],
    barriers: [
      { id: 'time-consuming', label: 'It takes too much time / I\'m too busy', type: 'time', coachingTip: 'Block 2 hours every Tuesday morning. Non-negotiable. You can\'t sell what you don\'t know. Buyers will ghost you if you don\'t know inventory. This IS revenue-generating, just indirect.' },
      { id: 'not-revenue', label: 'It doesn\'t directly make me money', type: 'motivation', coachingTip: 'Knowledge is your competitive advantage. Agents who preview weekly close 30% more deals because they match buyers faster and earn trust. "I actually toured that one yesterday - here\'s what you need to know" = instant credibility.' },
      { id: 'prefer-computer', label: 'I\'d rather research online than drive around', type: 'motivation', coachingTip: 'Photos lie. MLS descriptions are written by listing agents trying to sell. You need to see: traffic noise, weird smells, neighbor drama, actual condition. 10 minutes in person > 30 minutes online.' }
    ],
    successMetric: 'Preview 5+ properties per week',
    aiCanHelp: false
  },
  {
    id: 'open-houses',
    title: 'Hosting Open Houses',
    description: 'Hold open houses on your listings and other agents\' listings',
    category: 'prospecting',
    impactScore: 7,
    frequency: 'Monthly',
    timeEstimate: '3-4 hours per event',
    avoidanceReasons: [
      'They don\'t work anymore',
      'Weekends are for family',
      'Lead quality concerns'
    ],
    barriers: [
      { id: 'dont-work', label: 'Open houses don\'t work anymore', type: 'motivation', coachingTip: 'They work differently now. You\'re not selling the house - you\'re meeting future buyers/sellers. Capture emails, build relationships. 1 open house = 10-20 leads if you work the room. Follow up is where the magic happens.' },
      { id: 'weekends-family', label: 'Weekends are for my family', type: 'time', coachingTip: 'Valid. Do 1 per month, 2 hours max. Saturday 1-3pm or Sunday 12-2pm. Family gets the rest. Or trade: you do open houses for other agents who hate them, they do something you hate. Win-win.' },
      { id: 'lead-quality', label: 'The leads are tire-kickers and nosy neighbors', type: 'motivation', coachingTip: 'True. But 2-3 serious buyers show up at every one. Your job: qualify fast. "Are you actively looking or just browsing?" Get contact info from everyone. Follow up separates pros from amateurs.' }
    ],
    successMetric: '1-2 open houses per month minimum',
    aiCanHelp: true
  },
  {
    id: 'ask-referrals',
    title: 'Asking for Referrals & Testimonials',
    description: 'Directly asking clients "Who do you know?" at closing and quarterly',
    category: 'relationship',
    impactScore: 9,
    frequency: 'Monthly',
    timeEstimate: '5-10 mins',
    avoidanceReasons: [
      'Feels awkward',
      'Don\'t want to seem pushy',
      'Assume people will volunteer'
    ],
    barriers: [
      { id: 'awkward', label: 'It feels really awkward to ask', type: 'fear', coachingTip: 'You just helped them with a $500K+ transaction. They\'re HAPPY. Asking for referrals at closing is expected. Try: "I grow my business through referrals. Who do you know thinking about buying or selling?" Direct and professional.' },
      { id: 'seem-pushy', label: 'I don\'t want to seem pushy or desperate', type: 'authenticity', coachingTip: 'Pushy is following up 5 times. Asking ONCE at closing is professional. Frame it: "If you know anyone, I\'d love an introduction." That\'s not pushy - that\'s how business works. Happy clients WANT to refer you.' },
      { id: 'assume-volunteer', label: 'If they know someone, they\'ll tell me', type: 'motivation', coachingTip: 'They won\'t. People are busy and forget. You have to ask explicitly. Data: agents who ask get 4x more referrals. Script: "Before we go, quick question - who in your life is thinking about real estate?"' }
    ],
    successMetric: 'Ask every client at closing + quarterly check-ins',
    aiCanHelp: true
  },
  {
    id: 'skills-training',
    title: 'Skills Training & Script Practice',
    description: 'Role-playing objection handlers, practicing presentations, studying market data',
    category: 'development',
    impactScore: 8,
    frequency: 'Daily',
    timeEstimate: '30 mins',
    avoidanceReasons: [
      'Uncomfortable',
      'Feel like I already know it',
      'Will just wing it'
    ],
    barriers: [
      { id: 'uncomfortable-practice', label: 'Role-playing feels awkward and uncomfortable', type: 'authenticity', coachingTip: 'Because you\'re doing it in your head. Get on a Zoom with another agent or your broker. 15 minutes of awkward practice = confidence in real convos. Top producers practice weekly. Amateurs wing it and lose deals.' },
      { id: 'already-know', label: 'I already know this stuff / I\'ve been doing this for years', type: 'motivation', coachingTip: 'Then why are you here looking for help? Even LeBron practices free throws. Scripts + objection handlers are muscle memory. You need to respond in 2 seconds, not fumble. Refresh = sharpen the saw.' },
      { id: 'wing-it', label: 'I\'ll just figure it out in the moment', type: 'motivation', coachingTip: 'You can wing it... and lose deals. Or you can have a proven script for "Your price is too high" ready to go. Practice doesn\'t make perfect - it makes automatic. When a buyer says "We\'re waiting," you need a response NOW, not "uh..."' }
    ],
    successMetric: '30 minutes of practice daily',
    aiCanHelp: true
  }
];

export interface UserActivity {
  activityId: string;
  status: ActivityStatus;
  selectedBarrier?: string; // Barrier ID if they selected one
  lastCompleted?: string; // ISO date string
  streak: number; // consecutive days/weeks/months
  totalCompletions: number;
  notes?: string;
}

export interface UserProfile {
  name: string;
  email?: string;
  market: string; // City, State
  experienceLevel: 'new' | 'intermediate' | 'experienced'; // 0-2 yrs, 3-5 yrs, 6+ yrs
  businessGoal: string; // "Close 24 deals this year", etc.
  priorityActivities: string[]; // Array of activity IDs
  onboardingComplete: boolean;
}

export interface ActivityCompletion {
  activityId: string;
  completedAt: string; // ISO date string
  generatedContent?: string; // If AI helped, store what was created
  notes?: string;
}

export interface DashboardData {
  profile: UserProfile;
  activities: UserActivity[];
  recentCompletions: ActivityCompletion[];
  streaks: {
    activityId: string;
    current: number;
    longest: number;
  }[];
  reminders: {
    activityId: string;
    message: string;
    urgency: 'low' | 'medium' | 'high';
  }[];
}

// Helper functions
export function getActivityById(id: string): Activity | undefined {
  return CORE_ACTIVITIES.find(a => a.id === id);
}

export function getActivitiesByCategory(category: ActivityCategory): Activity[] {
  return CORE_ACTIVITIES.filter(a => a.category === category);
}

export function calculateStreak(completions: ActivityCompletion[], activityId: string, frequency: string): number {
  const activityCompletions = completions
    .filter(c => c.activityId === activityId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  if (activityCompletions.length === 0) return 0;

  let streak = 0;
  const now = new Date();
  const frequencyDays = frequency === 'Daily' ? 1 : frequency === 'Weekly' ? 7 : 30;

  for (let i = 0; i < activityCompletions.length; i++) {
    const completedDate = new Date(activityCompletions[i].completedAt);
    const daysDiff = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= frequencyDays * (i + 1)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getDaysSinceLastCompletion(completions: ActivityCompletion[], activityId: string): number | null {
  const activityCompletions = completions
    .filter(c => c.activityId === activityId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  if (activityCompletions.length === 0) return null;

  const lastCompletion = new Date(activityCompletions[0].completedAt);
  const now = new Date();
  return Math.floor((now.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24));
}

// Content generation types
export type ContentType = 'newsletter' | 'social-post' | 'prospecting-script' | 'follow-up-email' | 'referral-request' | 'open-house-plan';

export interface GenerationRequest {
  contentType: ContentType;
  activityId: string;
  inputs: {
    market?: string;
    targetAudience?: string;
    listingAddress?: string;
    clientName?: string;
    topic?: string;
    tone?: 'professional' | 'casual' | 'friendly';
    length?: 'short' | 'medium' | 'long';
  };
}

export interface GenerationResult {
  content: string;
  subject?: string; // For emails
  hashtags?: string[]; // For social media
  callToAction?: string;
  metadata?: Record<string, any>;
}
