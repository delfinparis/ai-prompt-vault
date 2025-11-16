import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import InstallPrompt from "./InstallPrompt";

// ========== TYPES ==========

type BarrierIntervention = {
  validate: string;
  reframe: string;
  microAction: string;
  mantra: string;
};

type Barrier = {
  id: string;
  label: string;
  subtext?: string;
  intervention: BarrierIntervention;
};

type ScriptVariation = {
  id: string;
  name: string;
  tone: string;
  opener: string;
  body: string;
  close: string;
};

type ConversationFlow = {
  phase: string;
  what_to_say: string;
  what_to_listen_for: string;
  next_move: string;
};

type MoodType = 'anxious' | 'avoiding' | 'unmotivated' | 'frustrated' | 'ready' | null;

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

type CallData = {
  startTime: Date | null;
  duration: number;
  notes: string;
  checklist: ChecklistItem[];
  outcome: 'completed' | 'voicemail' | 'no-answer' | 'callback' | null;
};

type WizardState = {
  step: number;
  mood: MoodType;
  selectedBarrier: string | null;
  acknowledged: boolean;
  contactName: string;
  contactPhone: string;
  contactNotes: string;
  selectedScript: string | null;
  callData: CallData;
  followUpDate: string;
};

// ========== PSYCHOLOGICAL BARRIERS (from research) ==========

const CALLING_BARRIERS: Barrier[] = [
  {
    id: 'fear-judgment',
    label: 'Fear of bothering them or being annoying',
    subtext: '"They\'ll think I\'m just trying to sell them something"',
    intervention: {
      validate: 'You helped them with the biggest financial decision of their life. This fear is normal, but it\'s not based in reality.',
      reframe: 'You\'re not a telemarketer - you\'re their trusted advisor checking in. If a doctor called to check on your health, would you feel bothered? This is the same thing.',
      microAction: 'Start with your favorite past client - someone you KNOW likes you. Test the water with someone safe first.',
      mantra: '"I\'m their realtor. Staying in touch is my job - and they expect it."'
    }
  },
  {
    id: 'dont-know-what-say',
    label: 'I don\'t know what to say',
    subtext: '"What if the conversation gets awkward?"',
    intervention: {
      validate: 'Not having a script makes calling feel like walking a tightrope without a net. That\'s scary.',
      reframe: 'The best calls aren\'t scripted - they\'re structured. You need a solid opening and 2-3 conversation prompts. That\'s it. The rest flows naturally.',
      microAction: 'Use one of the scripts we give you below. Say it out loud 3 times before you dial. Muscle memory kills anxiety.',
      mantra: '"I don\'t need to be perfect. I just need to be human."'
    }
  },
  {
    id: 'rejection-fear',
    label: 'Fear of rejection or awkward response',
    subtext: '"What if they don\'t remember me or seem annoyed?"',
    intervention: {
      validate: 'Your brain is trying to protect you from social pain. Rejection hurts. That\'s hardwired.',
      reframe: 'But here\'s the truth: 95% of people are happy to hear from you. The 5% who aren\'t? They\'re having a bad day - it\'s not about you. And even THEY might refer you later.',
      microAction: 'Reframe "rejection" as "wrong timing." If they\'re short, just say "No worries! Let\'s catch up another time" and move on. No big deal.',
      mantra: '"Not now doesn\'t mean not ever. I\'m planting seeds."'
    }
  },
  {
    id: 'too-salesy',
    label: 'It feels too "salesy" or pushy',
    subtext: '"I don\'t want to be one of those realtors"',
    intervention: {
      validate: 'You have integrity. You don\'t want to manipulate people. That\'s a strength, not a weakness.',
      reframe: 'Here\'s the difference: pushy is calling to TAKE (make a sale). Calling to GIVE (check in, add value, offer help) is service. Lead with curiosity and care - that\'s never pushy.',
      microAction: 'Make the call 100% about them. Ask questions. Listen. Don\'t pitch. Just reconnect. That\'s it. You\'re not selling - you\'re building relationship equity.',
      mantra: '"Caring isn\'t salesy. Ghosting them is."'
    }
  },
  {
    id: 'perfectionism',
    label: 'I want to wait until I have a good reason to call',
    subtext: '"I need a market update or listing to share first"',
    intervention: {
      validate: 'You want to add value. That\'s honorable. But it\'s also an excuse your brain is using to avoid discomfort.',
      reframe: 'The BEST reason to call is NO reason. "Just thinking about you" is more memorable than another listing email. Authenticity beats content every time.',
      microAction: 'Call with zero agenda. Literally say: "No real estate pitch - I just wanted to check in and see how you\'re doing." That\'s the whole call. They\'ll love you for it.',
      mantra: '"Connection IS the value. I don\'t need an excuse."'
    }
  },
  {
    id: 'past-negative',
    label: 'I called before and it went badly',
    subtext: '"Last time I tried this, they were cold or uninterested"',
    intervention: {
      validate: 'That sucked. Your brain remembers pain more than pleasure - it\'s trying to protect you from feeling that again.',
      reframe: 'But one bad call doesn\'t predict the next. Different person, different day, different energy. You\'re also better now than you were then. This isn\'t a repeat - it\'s a fresh start.',
      microAction: 'Call someone DIFFERENT this time. Don\'t re-traumatize yourself with the same person. Build momentum with wins first, then circle back to the hard ones.',
      mantra: '"That was then. This is now. I\'m not the same agent I was yesterday."'
    }
  },
  {
    id: 'no-time',
    label: 'I don\'t have time / too busy with other tasks',
    subtext: '"I\'ll do it later when things slow down"',
    intervention: {
      validate: 'You ARE busy. There\'s always something urgent screaming for attention. That\'s real.',
      reframe: 'But "busy" is often code for "avoiding the hard thing." Calling your sphere takes 15 minutes and could generate a $15K commission. That\'s $1,000/minute. You don\'t have time NOT to do this.',
      microAction: 'Block 15 minutes FIRST thing tomorrow morning - before email, before anything. Set a timer. Make 3 calls. Then stop. That\'s it. Consistency beats volume.',
      mantra: '"Fifteen focused minutes beats three chaotic hours."'
    }
  },
  {
    id: 'low-energy',
    label: 'I\'m tired / not in the right headspace',
    subtext: '"I need to feel more motivated first"',
    intervention: {
      validate: 'If you\'re genuinely burned out, rest is not optional. Honor that.',
      reframe: 'But also: energy follows action more than action follows energy. The first call is always the hardest. By call #3, you\'ll have momentum and feel BETTER than before you started.',
      microAction: 'Commit to ONE call. Just one. If after that call you\'re truly exhausted, stop guilt-free. But I bet you\'ll feel energized and want to keep going.',
      mantra: '"Motion creates emotion. Just one call."'
    }
  },
  {
    id: 'identity-conflict',
    label: 'This isn\'t who I am / not my style',
    subtext: '"I\'m not a \'phone person\' or aggressive sales type"',
    intervention: {
      validate: 'You have a story about who you are. "I\'m not the type to call people out of the blue." That story feels true because you\'ve believed it for years.',
      reframe: 'But identity isn\'t fixed - it\'s chosen. You don\'t have to BE a "phone person." Just make ONE call to ONE person you care about. That\'s not changing who you are - it\'s expanding what you can do.',
      microAction: 'Don\'t call it "prospecting" - call it "checking in on people I helped." Language matters. Reframe the action to fit your identity, not fight it.',
      mantra: '"I\'m not changing who I am. I\'m serving people I care about."'
    }
  }
];

// ========== SCRIPT VARIATIONS ==========

const generateScriptVariations = (name: string, notes: string): ScriptVariation[] => {
  const personalTouch = notes.trim().length > 0
    ? `I was thinking about ${notes.toLowerCase()} and wanted to check in.`
    : `I was going through my past clients and realized it's been way too long since we've caught up.`;

  return [
    {
      id: 'no-agenda',
      name: 'No-Agenda Check-In',
      tone: 'Warm, genuine, zero pressure',
      opener: `Hey ${name}, it's [Your Name] with [Brokerage]!`,
      body: `${personalTouch} No real estate agenda whatsoever - I genuinely just wanted to see how you're doing and what's new in your world. Got a few minutes to catch up?`,
      close: `Great! So tell me - how's everything going with you?`
    },
    {
      id: 'market-value',
      name: 'Market Update Hook',
      tone: 'Professional, value-first',
      opener: `Hey ${name}, it's [Your Name] - hope you're doing well!`,
      body: `Quick question: have you been following what's happening in the [neighborhood] market lately? I've been tracking it and wanted to share something interesting with you. ${notes.trim() ? `Also, ${notes.toLowerCase()}` : ''} Do you have a minute?`,
      close: `So here's what I'm seeing... [share 1-2 quick market facts]. Curious what you think - does this match what you're seeing in your neighborhood?`
    },
    {
      id: 'quick-question',
      name: 'Quick Question Approach',
      tone: 'Casual, low-pressure, consultative',
      opener: `Hey ${name}, it's [Your Name] - got a quick question for you.`,
      body: `I'm working with a few buyers right now looking in [area], and ${notes.trim() ? `I remembered ${notes.toLowerCase()}` : `your neighborhood came up`}. Are you still loving the area, or have you ever thought about what's next for you guys?`,
      close: `Yeah? Tell me more about that...`
    },
    {
      id: 'anniversary',
      name: 'Anniversary/Milestone',
      tone: 'Sentimental, relationship-focused',
      opener: `Hey ${name}, it's [Your Name]!`,
      body: `I was looking back at my past clients and realized we closed on your place [X time] ago - crazy how fast time flies! ${personalTouch} I wanted to check in and see how the house is treating you. Any issues come up, or you still happy there?`,
      close: `That's great to hear! And hey - if anything ever comes up with the house or you know someone looking to buy or sell, you know where to find me.`
    },
    {
      id: 'referral-ask',
      name: 'Direct Referral Request',
      tone: 'Confident, professional, straightforward',
      opener: `Hey ${name}, it's [Your Name] with [Brokerage].`,
      body: `I'm reaching out because I'm looking to help a few more families this quarter, and I wanted to check in with my favorite past clients first. ${notes.trim() ? `I know ${notes.toLowerCase()}, so ` : ''}I'm curious - who do you know in your life who might be thinking about buying, selling, or even just has real estate questions?`,
      close: `Perfect! Can you text me their number, or would you rather intro us over text? Either way works for me.`
    },
    {
      id: 'help-offer',
      name: 'Offer to Help',
      tone: 'Helpful, service-oriented',
      opener: `Hey ${name}, it's [Your Name] - hope you're doing great!`,
      body: `I wanted to reach out because I've been helping a lot of clients with [market trend, refinance, home equity, etc.] lately, and I thought of you. ${personalTouch} Have you thought about [relevant topic based on notes]? I'd love to help if it makes sense.`,
      close: `No pressure at all - just wanted to make sure you knew I'm here if you ever need anything real estate-related.`
    }
  ];
};

// ========== CONVERSATION FLOW GUIDE ==========

const CONVERSATION_FLOW: ConversationFlow[] = [
  {
    phase: '1. Opening (First 15 seconds)',
    what_to_say: 'Use your chosen script opener. Warm, confident, and clear about who you are.',
    what_to_listen_for: 'Their tone. Are they happy to hear from you? Rushed? Neutral?',
    next_move: 'If positive: dive into body. If rushed: "Bad timing? I can call back later." If neutral: proceed with body but keep it brief.'
  },
  {
    phase: '2. Body (30-60 seconds)',
    what_to_say: 'Deliver your script body. Ask your opening question. Then STOP and listen.',
    what_to_listen_for: 'Life updates, home satisfaction, pain points, names of friends/family, market concerns.',
    next_move: 'Ask follow-up questions. "Tell me more about that." "How are you feeling about it?" Show genuine curiosity.'
  },
  {
    phase: '3. Real Estate Transition (if natural)',
    what_to_say: '"By the way, how\'s the house treating you? Any issues or maintenance stuff come up?" OR "Have you thought about [market trend] at all?"',
    what_to_listen_for: 'Complaints about space, neighborhood changes, job relocation, family growth, financial stress.',
    next_move: 'If they express a need: "Want me to look into that for you?" If not: move to close.'
  },
  {
    phase: '4. Referral Ask (optional but powerful)',
    what_to_say: '"Quick question before I let you go - who do you know in your life who might be thinking about buying, selling, or just has real estate questions?"',
    what_to_listen_for: 'Names, situations, hesitation ("I don\'t know anyone right now").',
    next_move: 'If they give a name: "Perfect! Can you intro us or want me to reach out?" If not: "No worries! Just keep me in mind if anyone mentions it."'
  },
  {
    phase: '5. Close (Last 15 seconds)',
    what_to_say: '"So good catching up with you! Let\'s not let it be another [X months] before we talk again. I\'ll check in soon."',
    what_to_listen_for: 'Positive affirmation, warmth, appreciation.',
    next_move: 'Hang up. Immediately log the call in your CRM with notes. Set a follow-up reminder for 30-60 days.'
  }
];

// ========== LOCALSTORAGE KEYS ==========

const KEY_STREAK = "cys:streak";
const KEY_LAST_CALL = "cys:lastCall";
const KEY_TOTAL_CALLS = "cys:totalCalls";
const KEY_WEEK_CALLS = "cys:weekCalls";
const KEY_WEEK_START = "cys:weekStart";

// ========== MAIN COMPONENT ==========

// Map moods to barriers
const MOOD_TO_BARRIER: Record<string, string> = {
  'anxious': 'rejection-fear',
  'avoiding': 'perfectionism',
  'unmotivated': 'low-energy',
  'frustrated': 'past-negative'
};

export default function CallYourSphereWizard() {
  const [state, setState] = useState<WizardState>({
    step: 0, // Start at mood check
    mood: null,
    selectedBarrier: null,
    acknowledged: false,
    contactName: "",
    contactPhone: "",
    contactNotes: "",
    selectedScript: null,
    callData: {
      startTime: null,
      duration: 0,
      notes: "",
      checklist: [],
      outcome: null
    },
    followUpDate: ""
  });

  const [streak, setStreak] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [weekCalls, setWeekCalls] = useState(0);

  // Load streak data on mount
  useEffect(() => {
    try {
      const savedStreak = localStorage.getItem(KEY_STREAK);
      const savedTotal = localStorage.getItem(KEY_TOTAL_CALLS);
      const savedWeek = localStorage.getItem(KEY_WEEK_CALLS);
      const weekStart = localStorage.getItem(KEY_WEEK_START);

      if (savedStreak) setStreak(parseInt(savedStreak));
      if (savedTotal) setTotalCalls(parseInt(savedTotal));

      const now = new Date();
      const currentWeekStart = getWeekStart(now);

      if (weekStart !== currentWeekStart) {
        localStorage.setItem(KEY_WEEK_START, currentWeekStart);
        localStorage.setItem(KEY_WEEK_CALLS, "0");
        setWeekCalls(0);
      } else if (savedWeek) {
        setWeekCalls(parseInt(savedWeek));
      }
    } catch (e) {
      console.error("Failed to load streak data", e);
    }
  }, []);

  const getWeekStart = (date: Date): string => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const next = () => setState((s) => ({ ...s, step: s.step + 1 }));
  const back = () => setState((s) => ({ ...s, step: s.step > 1 ? s.step - 1 : 1 }));

  const recordCall = () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const lastCall = localStorage.getItem(KEY_LAST_CALL);

      let newStreak = streak;
      if (lastCall) {
        const lastDate = new Date(lastCall);
        const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Same day - don't increment
        } else if (daysDiff === 1) {
          newStreak = streak + 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const newTotal = totalCalls + 1;
      const newWeek = weekCalls + 1;

      localStorage.setItem(KEY_STREAK, newStreak.toString());
      localStorage.setItem(KEY_LAST_CALL, today);
      localStorage.setItem(KEY_TOTAL_CALLS, newTotal.toString());
      localStorage.setItem(KEY_WEEK_CALLS, newWeek.toString());

      setStreak(newStreak);
      setTotalCalls(newTotal);
      setWeekCalls(newWeek);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      next();
    } catch (e) {
      console.error("Failed to record call", e);
      next();
    }
  };

  const resetWizard = () => {
    setState({
      step: 1,
      mood: null,
      selectedBarrier: null,
      acknowledged: false,
      contactName: "",
      contactPhone: "",
      contactNotes: "",
      selectedScript: null,
      callData: {
        startTime: null,
        duration: 0,
        notes: '',
        checklist: [],
        outcome: null
      },
      followUpDate: ""
    });
  };

  const selectedBarrierData = CALLING_BARRIERS.find(b => b.id === state.selectedBarrier);
  const scriptVariations = generateScriptVariations(state.contactName || "there", state.contactNotes);

  // ========== STEP RENDERING ==========

  function renderStep() {
    const weeklyGoal = 5;
    const weekProgress = Math.min(100, (weekCalls / weeklyGoal) * 100);

    switch (state.step) {
      // STEP 1: Barrier Identification
      case 1:
        return (
          <StepCard>
            <StepHeader
              title="Let's get honest: What's really stopping you?"
              subtitle="Pick the one that hits hardest right now. No judgment."
            />

            <div style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              fontSize: '14px',
              color: '#fca5a5'
            }}>
              💡 <strong>Why this matters:</strong> We can't fix what we don't name. Once you identify the block, we'll give you the exact workaround.
            </div>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
              {CALLING_BARRIERS.map((barrier) => {
                const isSelected = state.selectedBarrier === barrier.id;
                return (
                  <button
                    key={barrier.id}
                    onClick={() => setState(s => ({ ...s, selectedBarrier: barrier.id }))}
                    style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${isSelected ? '#10b981' : '#475569'}`,
                      background: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#1e293b',
                      color: isSelected ? '#10b981' : '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {isSelected && '✓ '}{barrier.label}
                    </div>
                    {barrier.subtext && (
                      <div style={{ fontSize: '13px', fontStyle: 'italic', color: isSelected ? '#6ee7b7' : '#94a3b8' }}>
                        {barrier.subtext}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <PrimaryButton
              onClick={next}
              disabled={!state.selectedBarrier}
            >
              Show Me How to Break Through This →
            </PrimaryButton>
          </StepCard>
        );

      // STEP 2: Psychological Intervention
      case 2:
        if (!selectedBarrierData) return null;
        const { intervention } = selectedBarrierData;

        return (
          <StepCard onBack={back}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '8px' }}>
                Let's get you unstuck
              </h1>
              <p style={{ fontSize: '16px', color: '#94a3b8' }}>
                You're avoiding calling because:
              </p>
              <p style={{
                fontSize: '18px',
                color: '#fca5a5',
                fontWeight: '600',
                fontStyle: 'italic',
                marginTop: '8px'
              }}>
                "{selectedBarrierData.label}"
              </p>
            </div>

            {/* Validate */}
            <div style={{
              marginBottom: '20px',
              padding: '20px',
              background: 'rgba(251, 191, 36, 0.1)',
              borderLeft: '4px solid #fbbf24',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>✋</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '8px' }}>
                    First, let's validate what you're feeling
                  </h3>
                  <p style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6' }}>
                    {intervention.validate}
                  </p>
                </div>
              </div>
            </div>

            {/* Reframe */}
            <div style={{
              marginBottom: '20px',
              padding: '20px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderLeft: '4px solid #10b981',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>🔄</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                    Now, let's reframe it
                  </h3>
                  <p style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6' }}>
                    {intervention.reframe}
                  </p>
                </div>
              </div>
            </div>

            {/* Micro-action */}
            <div style={{
              marginBottom: '20px',
              padding: '20px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>🎯</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
                    Here's your micro-action
                  </h3>
                  <p style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6' }}>
                    {intervention.microAction}
                  </p>
                </div>
              </div>
            </div>

            {/* Mantra */}
            <div style={{
              marginBottom: '28px',
              padding: '24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px'
              }}>
                Your mantra
              </p>
              <p style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: '1.4'
              }}>
                {intervention.mantra}
              </p>
            </div>

            {/* Acknowledgment */}
            <div style={{
              padding: '20px',
              background: '#1e293b',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={state.acknowledged}
                  onChange={(e) => setState(s => ({ ...s, acknowledged: e.target.checked }))}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '15px', color: '#cbd5e1', fontWeight: '500' }}>
                  I understand this. I'm ready to take action despite the discomfort.
                </span>
              </label>
            </div>

            <PrimaryButton
              onClick={next}
              disabled={!state.acknowledged}
            >
              I'm Ready - Let's Do This 🚀
            </PrimaryButton>
          </StepCard>
        );

      // STEP 3: Contact Entry
      case 3:
        return (
          <StepCard onBack={back}>
            <StepHeader
              title="Who are you calling today?"
              subtitle="Pick ONE person. We'll make this easy."
            />

            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              fontSize: '14px',
              color: '#10b981'
            }}>
              💪 <strong>327 agents</strong> made calls today. You're next!
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>
                Contact Name
              </label>
              <input
                type="text"
                value={state.contactName}
                onChange={(e) => setState(s => ({ ...s, contactName: e.target.value }))}
                placeholder="Sarah Johnson"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  WebkitAppearance: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={state.contactPhone}
                onChange={(e) => setState(s => ({ ...s, contactPhone: e.target.value }))}
                placeholder="(555) 123-4567"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  WebkitAppearance: 'none'
                }}
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                For tap-to-call on mobile
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#cbd5e1' }}>
                Quick Notes (Optional)
              </label>
              <textarea
                value={state.contactNotes}
                onChange={(e) => setState(s => ({ ...s, contactNotes: e.target.value }))}
                placeholder="Bought a 3/2 in 2021. Has two kids. Mentioned wanting a bigger yard."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  minHeight: '90px',
                  resize: 'vertical',
                  WebkitAppearance: 'none'
                }}
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                This helps us personalize your scripts
              </p>
            </div>

            <PrimaryButton
              onClick={next}
              disabled={!state.contactName.trim()}
            >
              Generate My Scripts →
            </PrimaryButton>
          </StepCard>
        );

      // STEP 4: Script Arsenal (5-6 variations + conversation flow)
      case 4:
        // Format phone number for tel: link (remove non-digits)
        const cleanPhone = state.contactPhone.replace(/\D/g, '');
        const hasPhone = cleanPhone.length >= 10;

        return (
          <StepCard onBack={back}>
            <StepHeader
              title={`Here's what to say to ${state.contactName}`}
              subtitle="Pick the approach that feels most like YOU"
            />

            {/* Tap-to-Call Button (Mobile) */}
            {hasPhone && (
              <a
                href={`tel:+1${cleanPhone}`}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '18px 24px',
                  marginBottom: '24px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
                }}
              >
                📞 Tap to Call {state.contactName}
              </a>
            )}

            {/* Script Variations */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '16px' }}>
                📞 Choose Your Script Style:
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {scriptVariations.map((script) => {
                  const isSelected = state.selectedScript === script.id;
                  return (
                    <div
                      key={script.id}
                      onClick={() => setState(s => ({ ...s, selectedScript: script.id }))}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${isSelected ? '#10b981' : '#475569'}`,
                        background: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#1e293b',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: isSelected ? '#10b981' : '#cbd5e1'
                        }}>
                          {isSelected && '✓ '}{script.name}
                        </span>
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const fullScript = `${script.opener}\n\n${script.body}\n\n${script.close}`;
                              navigator.clipboard?.writeText(fullScript);
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              background: '#10b981',
                              color: '#0f172a',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            📋 Copy
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '12px' }}>
                        {script.tone}
                      </div>
                      {isSelected && (
                        <div style={{
                          fontSize: '14px',
                          color: '#e2e8f0',
                          lineHeight: '1.6',
                          paddingTop: '12px',
                          borderTop: '1px solid #475569'
                        }}>
                          <p style={{ marginBottom: '8px' }}><strong>Opening:</strong> {script.opener}</p>
                          <p style={{ marginBottom: '8px' }}><strong>Body:</strong> {script.body}</p>
                          <p><strong>Close:</strong> {script.close}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conversation Flow Guide */}
            <div style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '16px' }}>
                🗺️ Step-by-Step Conversation Flow:
              </h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                {CONVERSATION_FLOW.map((phase, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: '#0f172a',
                    borderRadius: '8px',
                    borderLeft: '3px solid #3b82f6'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px' }}>
                      {phase.phase}
                    </div>
                    <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                      <strong>Say:</strong> {phase.what_to_say}
                    </div>
                    <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                      <strong>Listen for:</strong> {phase.what_to_listen_for}
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      <strong>Next:</strong> {phase.next_move}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <PrimaryButton
                onClick={next}
                disabled={!state.selectedScript}
              >
                I'm Ready - When Should I Call?
              </PrimaryButton>
              <SecondaryButton onClick={back}>
                Go Back & Edit
              </SecondaryButton>
            </div>
          </StepCard>
        );

      // STEP 5: Commitment Time
      case 5:
        return (
          <StepCard onBack={back}>
            <StepHeader title="When will you reach out?" />

            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
              {[
                { value: "now", label: "Right now 🔥", color: "emerald" },
                { value: "lunch", label: "After lunch", color: "slate" },
                { value: "evening", label: "This evening", color: "slate" },
                { value: "tomorrow", label: "Tomorrow morning", color: "slate" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setState(s => ({ ...s, commitmentTime: opt.label }));
                    recordCall();
                  }}
                  style={{
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '12px',
                    border: opt.color === 'emerald' ? '2px solid #10b981' : '2px solid #475569',
                    background: opt.color === 'emerald' ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                    color: opt.color === 'emerald' ? '#6ee7b7' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </StepCard>
        );

      // STEP 6: Celebration
      case 6:
        return (
          <StepCard>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <StepHeader
                title="You're building the habit!"
                subtitle={`That's call #${totalCalls} all-time`}
              />

              {/* Streak Display */}
              <div style={{
                background: '#1e293b',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                  {streak > 0 ? "🔥" : "💪"}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
                  {streak} Day Streak
                </div>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                  {streak === 0 && "Start your streak by calling today!"}
                  {streak === 1 && "Great start! Call again tomorrow to build your streak."}
                  {streak > 1 && streak < 7 && "You're on fire! Keep it going."}
                  {streak >= 7 && streak < 30 && "Incredible momentum! This is a habit now."}
                  {streak >= 30 && "You're a calling machine! 🚀"}
                </p>
              </div>

              {/* Weekly Progress */}
              <div style={{
                background: '#1e293b',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                    This Week's Calls
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                    {weekCalls} / {weeklyGoal}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '12px',
                  background: '#475569',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #6ee7b7 100%)',
                      width: `${weekProgress}%`,
                      transition: 'width 0.5s'
                    }}
                  />
                </div>
                {weekCalls >= weeklyGoal && (
                  <p style={{ fontSize: '14px', color: '#10b981', marginTop: '8px', fontWeight: '600' }}>
                    ✨ Weekly goal crushed!
                  </p>
                )}
              </div>

              {/* ROI Reminder */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <p style={{ fontSize: '14px', color: '#6ee7b7' }}>
                  <strong>Fun fact:</strong> This call could lead to a $450K listing.
                  Even one deal pays for this app for 24 months.
                </p>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <PrimaryButton onClick={resetWizard}>
                  Add Another Call Today
                </PrimaryButton>
                <SecondaryButton onClick={resetWizard}>
                  Done For Today - See You Tomorrow!
                </SecondaryButton>
              </div>
            </div>
          </StepCard>
        );

      default:
        return null;
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020617',
      color: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      paddingBottom: '32px'
    }}>
      {/* Streak Badge - Top Right */}
      {streak > 0 && (
        <div style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: '700',
          color: '#10b981',
          zIndex: 1000
        }}>
          <span style={{ fontSize: '18px' }}>🔥</span>
          <span>{streak} Day{streak !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '900px' }}>
        {renderStep()}
      </div>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

// ========== COMPONENTS ==========

function StepCard({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: '20px',
      border: '1px solid #334155',
      background: '#0f172a',
      padding: '32px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
    }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            left: '32px',
            top: '32px',
            fontSize: '14px',
            color: '#94a3b8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ← Back
        </button>
      )}
      {children}
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#f1f5f9' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: '16px', color: '#94a3b8' }}>{subtitle}</p>
      )}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '18px 24px',
        fontSize: '18px',
        fontWeight: 'bold',
        borderRadius: '12px',
        border: 'none',
        background: disabled ? '#475569' : '#10b981',
        color: disabled ? '#94a3b8' : '#0f172a',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: disabled ? 'none' : '0 4px 16px rgba(16, 185, 129, 0.3)',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '56px',
        touchAction: 'manipulation'
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '18px 24px',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '12px',
        border: '2px solid #475569',
        background: 'transparent',
        color: '#cbd5e1',
        cursor: 'pointer',
        transition: 'all 0.2s',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '56px',
        touchAction: 'manipulation'
      }}
    >
      {children}
    </button>
  );
}
