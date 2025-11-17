import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import InstallPrompt from './InstallPrompt';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

type MoodType = 'anxious' | 'avoiding' | 'unmotivated' | 'frustrated' | 'ready';

type Barrier = {
  id: string;
  validate: string;
  reframe: string;
  microAction: string;
  mantra: string;
};

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

type CallOutcome = 'completed' | 'voicemail' | 'no-answer' | 'callback';

type ScriptVariation = {
  id: string;
  name: string;
  emoji: string;
  tone: string;
  opening: {
    say: string;
    listenFor: string;
    nextMove: string;
  };
  body: {
    say: string;
    listenFor: string;
    nextMove: string;
  };
  transition: {
    say: string;
    listenFor: string;
    nextMove: string;
  };
  ask: {
    say: string;
    listenFor: string;
    nextMove: string;
  };
  close: {
    say: string;
    listenFor: string;
    nextMove: string;
  };
};

type WizardState = {
  step: number;
  mood: MoodType | null;
  barrier: Barrier | null;
  contactName: string;
  contactPhone: string;
  contactNotes: string;
  selectedScript: ScriptVariation | null;
  checklist: ChecklistItem[];
  callStartTime: Date | null;
  callDuration: number;
  callNotes: string;
  callOutcome: CallOutcome | null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD & BARRIER MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const MOOD_OPTIONS = [
  { id: 'ready', emoji: '🔥', label: 'Ready to call', color: '#10b981' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#f59e0b' },
  { id: 'avoiding', emoji: '😬', label: 'Avoiding it', color: '#ef4444' },
  { id: 'unmotivated', emoji: '😴', label: 'Low energy', color: '#6b7280' },
  { id: 'frustrated', emoji: '😤', label: 'Frustrated', color: '#8b5cf6' },
];

const BARRIERS: Record<string, Barrier> = {
  anxious: {
    id: 'rejection-fear',
    validate: "Fear of rejection is hardwired into us. You're not weak for feeling it.",
    reframe: "But here's the truth: past clients WANT to hear from you. You helped them with one of their biggest life decisions. You're their trusted advisor, not a telemarketer.",
    microAction: "Start with your favorite past client - the one who loved you. Just say: 'Hey [name], it's [you]. I was thinking about you today and wanted to check in. How are you?'",
    mantra: "I'm their realtor. Staying in touch is my job, and they appreciate it."
  },
  avoiding: {
    id: 'perfectionism',
    validate: "You're waiting for the perfect reason to call. That's your brain protecting you from discomfort.",
    reframe: "There is no perfect reason. 'Just checking in' IS enough. People do business with people they like and remember.",
    microAction: "Don't script it. Just call and say: 'Hey [name], no big reason - I was going through my client list and realized I hadn't talked to you in a while. How have you been?'",
    mantra: "Imperfect action beats perfect inaction every time."
  },
  unmotivated: {
    id: 'low-energy',
    validate: "You're tired. Real estate is exhausting. Your brain wants to conserve energy.",
    reframe: "One call = potential referral = commission. The ROI on 5 minutes is literally thousands of dollars. You're not tired; you're avoiding discomfort.",
    microAction: "Set a timer for 5 minutes. Make ONE call. If you still feel terrible after, you can stop. (Spoiler: you won't.)",
    mantra: "Five minutes now = five figures later."
  },
  frustrated: {
    id: 'past-negative',
    validate: "You've had bad experiences. Someone was rude, dismissive, or didn't refer you. That hurt.",
    reframe: "One bad call doesn't define the next one. Most people are kind. And even if they're not, it's a 60-second awkward moment vs. a lifetime of regret for not trying.",
    microAction: "Call someone who's never let you down. Your biggest fan. Rebuild momentum with a guaranteed win.",
    mantra: "The next call is not the last call. I choose who I remember."
  },
  ready: {
    id: 'ready',
    validate: "You're in the zone. This is what momentum feels like.",
    reframe: "Ride this wave. The more calls you make when you feel good, the easier it gets when you don't.",
    microAction: "Make this call, then make another. Stack wins.",
    mantra: "I'm a professional. This is what I do."
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CHECKLIST (can be customized per call later)
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: '1', text: 'Warm opening - ask how they are', completed: false },
  { id: '2', text: 'Share value/market update', completed: false },
  { id: '3', text: 'Ask about their needs', completed: false },
  { id: '4', text: 'Request referral', completed: false },
  { id: '5', text: 'Schedule follow-up', completed: false },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SCRIPT VARIATIONS (6 detailed scripts with step-by-step flows)
// ═══════════════════════════════════════════════════════════════════════════════

const SCRIPT_VARIATIONS: ScriptVariation[] = [
  {
    id: 'market-update',
    name: 'Market Update Value Bomb',
    emoji: '📊',
    tone: 'Professional, value-first, consultative',
    opening: {
      say: "Hey [NAME], it's [YOUR NAME] - your realtor from [YEAR/PROPERTY]. I hope you're doing well! I was just looking at the market data for your neighborhood and saw something I thought you'd want to know about. Do you have 2 minutes?",
      listenFor: "Their tone (rushed, curious, happy to hear from you)",
      nextMove: "If rushed: 'No problem! Can I text you the update?' If curious: proceed to body."
    },
    body: {
      say: "So homes in [THEIR NEIGHBORHOOD] are up/down [X%] from when you bought. Yours specifically - if you were thinking about it - would probably be worth around [ESTIMATE RANGE]. I'm not saying you should sell, but I wanted you to know what's happening. Also, inventory is [tight/loosening], so if you know anyone thinking about buying or selling, now's actually a good time.",
      listenFor: "Questions about their home value, market conditions, or referrals",
      nextMove: "Answer questions. If they mention knowing someone, ask for intro."
    },
    transition: {
      say: "Real quick - since I have you - are you still happy in the house? Any plans to upgrade, downsize, or get an investment property in the next year or two?",
      listenFor: "Future plans, pain points, family changes",
      nextMove: "If yes: 'Let's grab coffee and talk about it.' If no: proceed to ask."
    },
    ask: {
      say: "Perfect. And hey - I'm always looking to help more people like you. If you know anyone who bought, sold, or is thinking about real estate, I'd love an introduction. Even if it's just a warm 'you should talk to [YOUR NAME]' - that means the world to me.",
      listenFor: "Names, maybes, or 'I'll keep you in mind'",
      nextMove: "If name: 'Can I text you my info to forward?' If maybe: 'No pressure - just keep me in mind!'"
    },
    close: {
      say: "Awesome. Thanks for taking my call, [NAME]. I'll check in again in a few months, but if anything changes or you need anything, you know where to find me. Talk soon!",
      listenFor: "Goodbye, thanks, etc.",
      nextMove: "End call. Log outcome and notes in CRM."
    }
  },
  {
    id: 'no-agenda-checkin',
    name: 'No-Agenda Check-In',
    emoji: '💬',
    tone: 'Warm, casual, genuinely curious',
    opening: {
      say: "Hey [NAME]! It's [YOUR NAME]. I was going through my list of favorite past clients and realized I hadn't talked to you in forever. How are you? How's life?",
      listenFor: "Personal updates - kids, work, life changes",
      nextMove: "Listen actively. Ask follow-up questions. Build rapport first."
    },
    body: {
      say: "That's awesome! And how's the house treating you? Everything still good with [SPECIFIC FEATURE they loved when they bought]? I remember you were so excited about that.",
      listenFor: "Home satisfaction, repairs, changes, or frustrations",
      nextMove: "If issues: 'I know a great [contractor/plumber]. Want me to connect you?' If good: proceed."
    },
    transition: {
      say: "I'm glad to hear it. Hey, I don't have an agenda here - I just genuinely wanted to check in. But since I have you: do you know anyone who's mentioned buying, selling, or even just curious about what their home is worth? I'm trying to help more people this year.",
      listenFor: "Names, hesitation, or 'I'll think about it'",
      nextMove: "If name: get details. If hesitation: 'No pressure - just wanted to ask.'"
    },
    ask: {
      say: "If anyone comes to mind - even someone who's just casually mentioned it - I'd love an intro. You can literally just text them my info with a 'This is my realtor - they're great.' That's all I need.",
      listenFor: "Commitment level",
      nextMove: "If yes: 'Thank you! Text me their name and I'll handle it.' If no: 'All good!'"
    },
    close: {
      say: "Well, it was great catching up with you, [NAME]. I mean it - let's not go this long without talking again. If you ever need anything - real estate or not - I'm here. Take care!",
      listenFor: "Warm goodbye",
      nextMove: "End call. Note personal details they shared for next call."
    }
  },
  {
    id: 'anniversary',
    name: 'Home Anniversary',
    emoji: '🎉',
    tone: 'Sentimental, celebratory, grateful',
    opening: {
      say: "Hey [NAME], it's [YOUR NAME]! Quick question - did you realize it's been [X YEARS] since you closed on your house? I was looking at my calendar and saw the date pop up. How time flies, right?",
      listenFor: "Surprise, nostalgia, 'Wow, really?'",
      nextMove: "Let them reminisce. Ask: 'Do you remember how crazy that day was?'"
    },
    body: {
      say: "I still remember [SPECIFIC MEMORY from closing/showing]. Anyway, I wanted to call and say thank you again for trusting me with such a big decision. You were an amazing client, and I hope the house has treated you well. How's it been?",
      listenFor: "Stories, gratitude, updates on the home",
      nextMove: "Engage warmly. Ask about renovations, family changes, etc."
    },
    transition: {
      say: "That's so great to hear. You know, I was thinking - if you ever wanted to know what it's worth now, I could pull a quick report for you. No obligation, just for fun. Would that be helpful?",
      listenFor: "Interest in home value",
      nextMove: "If yes: 'I'll email it to you today.' If no: 'All good - just thought I'd offer.'"
    },
    ask: {
      say: "And hey - since we're celebrating your home anniversary - do you know anyone else who might need a realtor? I'm trying to help [X NUMBER] families this year, and referrals from people like you are how I grow my business.",
      listenFor: "Names or 'I'll keep you in mind'",
      nextMove: "If name: 'Amazing! What's their situation?' If not: 'I appreciate you!'"
    },
    close: {
      say: "Well, happy [X]-year anniversary in your home, [NAME]! Here's to many more years of great memories. And seriously - if you ever need anything, you know I'm just a call away. Talk soon!",
      listenFor: "Thanks, goodbye",
      nextMove: "End call. Mark calendar for next year's anniversary call."
    }
  },
  {
    id: 'referral-request',
    name: 'Direct Referral Ask',
    emoji: '🙏',
    tone: 'Confident, professional, direct',
    opening: {
      say: "Hey [NAME], it's [YOUR NAME]. I hope you're doing well! I wanted to reach out because I'm planning my year, and I realized I never properly asked you this: who do you know that I should be talking to about real estate?",
      listenFor: "Surprise, curiosity, or immediate name drop",
      nextMove: "If name: 'Tell me about them.' If confusion: 'Let me explain...'"
    },
    body: {
      say: "Here's the thing - I help my favorite past clients first, and then I grow through referrals. So I'm literally just calling people like you and asking: do you have a friend, family member, coworker, or neighbor who's mentioned buying, selling, downsizing, or even just 'I wonder what my house is worth?' If so, I'd love an introduction.",
      listenFor: "Thought process, names coming to mind",
      nextMove: "Stay silent. Let them think. Don't fill the silence."
    },
    transition: {
      say: "And to be clear - I'm not asking you to sell them for me. I just want you to make the intro. You can literally text them: '[YOUR NAME] is my realtor. They're awesome. Here's their number.' That's it. I'll take it from there.",
      listenFor: "Willingness, names, or 'Let me think about it'",
      nextMove: "If name: 'What's their situation?' If hesitation: 'No pressure - but I'd appreciate it.'"
    },
    ask: {
      say: "Is there anyone - even someone who's just casually mentioned it - that I should know about? I promise I'll take great care of them, just like I did for you.",
      listenFor: "Names, details, or 'I'll get back to you'",
      nextMove: "If name: 'Can I text you my info to forward?' If not: 'Okay - but keep me in mind!'"
    },
    close: {
      say: "I really appreciate you even considering it, [NAME]. Referrals are the lifeblood of my business, so thank you. And like I said - if you ever need anything, I'm here. Talk soon!",
      listenFor: "Thanks, goodbye",
      nextMove: "Follow up in 2 weeks if they said 'Let me think about it.'"
    }
  },
  {
    id: 'local-news-hook',
    name: 'Local News Hook',
    emoji: '📰',
    tone: 'Timely, relevant, insider info',
    opening: {
      say: "Hey [NAME]! It's [YOUR NAME]. Quick question - did you see the news about [LOCAL DEVELOPMENT/RATE CHANGE/NEW BUSINESS in their area]? I wanted to call you because it might actually affect your property value.",
      listenFor: "Curiosity, 'No, what happened?'",
      nextMove: "Share the news. Explain how it impacts them."
    },
    body: {
      say: "So [EXPLAIN NEWS]. What that means for you is [IMPACT ON VALUE/NEIGHBORHOOD]. I'm not saying you need to do anything, but I thought you'd want to know as a homeowner. Have you been following what's happening in the area?",
      listenFor: "Questions, concerns, or interest in home value",
      nextMove: "Answer questions. Offer to send more info via text/email."
    },
    transition: {
      say: "Yeah, it's pretty interesting. Anyway, while I have you - how are you? How's everything with the house? Any plans to move, upgrade, or downsize anytime soon?",
      listenFor: "Future plans, family changes",
      nextMove: "If yes: 'Let's talk about it - I can help.' If no: proceed to ask."
    },
    ask: {
      say: "Got it. And hey - do you know anyone in the area who might want to know about this? Or anyone thinking about buying or selling? I'm always looking to help more people, and introductions from clients like you are the best leads I get.",
      listenFor: "Names or 'I'll think about it'",
      nextMove: "If name: 'What's their situation?' If not: 'No worries - just thought I'd ask.'"
    },
    close: {
      say: "Awesome. Well, I'll keep you posted if I hear anything else about the neighborhood. And if you ever want an updated value report on your place, just let me know. Thanks for your time, [NAME]!",
      listenFor: "Thanks, goodbye",
      nextMove: "Send follow-up text with link to news article."
    }
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver / Helper',
    emoji: '🛠️',
    tone: 'Helpful, service-oriented, resourceful',
    opening: {
      say: "Hey [NAME], it's [YOUR NAME]. I was thinking about you the other day and wanted to check in - how's the house? Any projects, repairs, or things you've been putting off that I might be able to help with?",
      listenFor: "Home issues, DIY projects, contractor needs",
      nextMove: "Listen for pain points. Offer solutions."
    },
    body: {
      say: "I have a whole network of people - contractors, plumbers, electricians, landscapers - who I've worked with for years. If you need anything, I can connect you with someone trustworthy who won't gouge you. Seriously - even if it's just a recommendation, I'm happy to help.",
      listenFor: "Specific needs or 'Actually, I do need...'",
      nextMove: "If need: 'Let me text you their info right now.' If not: proceed."
    },
    transition: {
      say: "And beyond the house - how are you? How's the family? Everything good? I know life gets busy, but I wanted to make sure you know I'm here if you ever need anything - real estate or not.",
      listenFor: "Personal updates, gratitude",
      nextMove: "Build rapport. Show you care beyond the transaction."
    },
    ask: {
      say: "One more thing - and I know I always ask this - but do you know anyone who's thinking about buying or selling? I'm trying to help [X NUMBER] more families this year, and referrals from people like you are how I do it.",
      listenFor: "Names or 'I'll keep you in mind'",
      nextMove: "If name: 'Tell me about them.' If not: 'All good - just wanted to ask.'"
    },
    close: {
      say: "Well, I'm glad I called. Don't be a stranger, [NAME] - and seriously, if you need anything, text me. I'll make it happen. Talk soon!",
      listenFor: "Thanks, goodbye",
      nextMove: "Send contractor contact info immediately via text if they asked."
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function CallYourSphereWizardV2() {
  const [state, setState] = useState<WizardState>({
    step: 0,
    mood: null,
    barrier: null,
    contactName: '',
    contactPhone: '',
    contactNotes: '',
    selectedScript: null,
    checklist: DEFAULT_CHECKLIST,
    callStartTime: null,
    callDuration: 0,
    callNotes: '',
    callOutcome: null,
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // BREATHING EXERCISE STATE
  // ═══════════════════════════════════════════════════════════════════════════════

  type BreathPhase = 'inhale1' | 'inhale2' | 'exhale' | 'rest';
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale1');
  const [currentRound, setCurrentRound] = useState(1);
  const [breathingActive, setBreathingActive] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════════
  // STREAK TRACKING (persisted in localStorage)
  // ═══════════════════════════════════════════════════════════════════════════════

  const [streak, setStreak] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);

  // ═══════════════════════════════════════════════════════════════════════════════
  // AI CUSTOM SCRIPT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════════

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [customScript, setCustomScript] = useState<{
    call_script?: string;
    text_script?: string;
    voicemail_script?: string;
    conversation_prompts?: string[];
    referral_segue?: string;
  } | null>(null);
  const [selectedScriptType, setSelectedScriptType] = useState<'call' | 'text' | 'voicemail'>('call');

  useEffect(() => {
    const savedStreak = parseInt(localStorage.getItem('cys:streak') || '0');
    const savedTotal = parseInt(localStorage.getItem('cys:totalCalls') || '0');
    setStreak(savedStreak);
    setTotalCalls(savedTotal);
  }, []);

  // Scroll to top whenever step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.step]);

  // Breathing exercise timer
  useEffect(() => {
    if (!breathingActive) return;

    const timings = {
      inhale1: 4000,   // 4 seconds - deep inhale
      inhale2: 1000,   // 1 second - top off
      exhale: 8000,    // 8 seconds - long exhale
      rest: 2000,      // 2 seconds - pause
    };

    const timer = setTimeout(() => {
      if (breathPhase === 'inhale1') {
        setBreathPhase('inhale2');
      } else if (breathPhase === 'inhale2') {
        setBreathPhase('exhale');
      } else if (breathPhase === 'exhale') {
        setBreathPhase('rest');
      } else if (breathPhase === 'rest') {
        if (currentRound < 3) {
          setCurrentRound(currentRound + 1);
          setBreathPhase('inhale1');
        } else {
          // Breathing complete!
          setBreathingActive(false);
          setState({ ...state, step: 2 }); // Move to contact entry
        }
      }
    }, timings[breathPhase]);

    return () => clearTimeout(timer);
  }, [breathingActive, breathPhase, currentRound]);

  const incrementStreak = () => {
    const lastCall = localStorage.getItem('cys:lastCall');
    const today = new Date().toDateString();

    let newStreak = streak;

    if (lastCall === today) {
      // Already called today, don't increment
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastCall === yesterday.toDateString()) {
      // Consecutive day
      newStreak = streak + 1;
    } else {
      // Broke streak
      newStreak = 1;
    }

    const newTotal = totalCalls + 1;

    localStorage.setItem('cys:streak', newStreak.toString());
    localStorage.setItem('cys:totalCalls', newTotal.toString());
    localStorage.setItem('cys:lastCall', today);

    setStreak(newStreak);
    setTotalCalls(newTotal);

    // Confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleMoodSelect = (mood: MoodType) => {
    const barrier = BARRIERS[mood];
    // If ready, skip priming and go straight to contact entry
    // If not ready, go to priming step
    setState({ ...state, mood, barrier, step: mood === 'ready' ? 2 : 1 });
  };

  const handleStartBreathing = () => {
    setBreathingActive(true);
    setBreathPhase('inhale1');
    setCurrentRound(1);
  };

  const handleSkipPriming = () => {
    // Track skip for analytics
    console.log('🔍 User skipped priming');
    setState({ ...state, step: 2 });
  };

  const handleContactSubmit = () => {
    // Move to script selection step
    setState({ ...state, step: 3 });
  };

  const handleScriptSelect = (script: ScriptVariation) => {
    setState({ ...state, selectedScript: script, step: 4 });
  };

  const handleGenerateCustomScript = async () => {
    setIsGeneratingScript(true);
    setCustomScript(null);

    try {
      const response = await fetch('/api/generate-call-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotion: state.mood || 'neutral',
          blockReason: state.barrier?.id || 'none',
          fearStory: state.barrier?.validate || '',
          actionType: 'call',
          contactName: state.contactName,
          contactNotes: state.contactNotes,
          agentTone: 'friendly and conversational',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const data = await response.json();
      setCustomScript(data);
      setSelectedScriptType('call');
    } catch (error) {
      console.error('Error generating custom script:', error);
      alert('Failed to generate custom script. Please try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleStartCall = () => {
    setState({ ...state, callStartTime: new Date() });
  };

  const handleEndCall = () => {
    if (state.callStartTime) {
      const duration = Math.floor((new Date().getTime() - state.callStartTime.getTime()) / 1000);
      setState({ ...state, callDuration: duration, step: 5 });
    }
  };

  const toggleChecklistItem = (id: string) => {
    setState({
      ...state,
      checklist: state.checklist.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    });
  };

  const handleCallComplete = (outcome: CallOutcome) => {
    setState({ ...state, callOutcome: outcome });
    incrementStreak();

    // Placeholder: Save to CRM
    saveToCRM({
      contactName: state.contactName,
      contactPhone: state.contactPhone,
      callDuration: state.callDuration,
      callNotes: state.callNotes,
      checklist: state.checklist,
      outcome,
    });
  };

  const handleBack = () => {
    // Go back one step, with special handling for mood-based flow
    if (state.step === 2 && state.mood !== 'ready') {
      // If we skipped intervention, go back to it
      setState({ ...state, step: 1 });
    } else if (state.step === 2 && state.mood === 'ready') {
      // If we went straight from mood to contact entry, go back to mood
      setState({ ...state, step: 0 });
    } else if (state.step === 4 && state.callStartTime) {
      // Don't allow going back during active call
      return;
    } else {
      setState({ ...state, step: Math.max(0, state.step - 1) });
    }
  };

  const handleReset = () => {
    setState({
      step: 0,
      mood: null,
      barrier: null,
      contactName: '',
      contactPhone: '',
      contactNotes: '',
      selectedScript: null,
      checklist: DEFAULT_CHECKLIST,
      callStartTime: null,
      callDuration: 0,
      callNotes: '',
      callOutcome: null,
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  const saveToCRM = (data: any) => {
    // Placeholder function - will wire up to actual CRM APIs later
    console.log('📤 Saving to CRM:', data);
    // TODO: POST to /api/crm/save-call
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER STEPS
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div style={styles.container}>
      {/* Streak Badge (top-right) */}
      <div style={styles.streakBadge}>
        🔥 {streak} day{streak !== 1 ? 's' : ''} · {totalCalls} total calls
      </div>

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Step 0: Mood Check */}
      {state.step === 0 && (
        <div style={styles.stepContainer}>
          <h1 style={styles.title}>How are you feeling right now?</h1>
          <p style={styles.subtitle}>Be honest. We'll work with it.</p>

          <div style={styles.moodGrid}>
            {MOOD_OPTIONS.map(mood => (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood.id as MoodType)}
                style={{
                  ...styles.moodButton,
                  borderColor: mood.color,
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>{mood.emoji}</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{mood.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Breathing Exercise (Priming) */}
      {state.step === 1 && state.mood !== 'ready' && (
        <div style={styles.stepContainer}>
          <button onClick={handleBack} style={styles.backButton}>
            ← Back
          </button>

          {!breathingActive ? (
            // Pre-breathing: Instructions
            <>
              <h2 style={styles.title}>Let's calm your nervous system</h2>
              <p style={styles.subtitle}>
                This 45-second breathing exercise will shift you from stressed to ready
              </p>

              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '2px solid #10b981',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#e2e8f0', marginBottom: '16px' }}>
                  <strong style={{ color: '#10b981' }}>How it works:</strong>
                  <br />
                  1. Deep inhale through your nose (4 sec)
                  <br />
                  2. Sharp inhale to top off lungs (1 sec)
                  <br />
                  3. Slow exhale through your mouth (8 sec)
                  <br />
                  4. Rest (2 sec)
                  <br />
                  <br />
                  Repeat 3 times. Just follow the circle.
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                  ✨ Stanford research shows this reduces anxiety faster than meditation
                </div>
              </div>

              <button onClick={handleStartBreathing} style={styles.primaryButton}>
                Start Breathing Exercise
              </button>

              <button onClick={handleSkipPriming} style={styles.skipButton}>
                Skip (not recommended)
              </button>
            </>
          ) : (
            // During breathing: Animated guide
            <>
              <h2 style={styles.title}>Breathe with the circle</h2>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
              }}>
                {/* Animated breathing circle */}
                <div style={{
                  width: breathPhase === 'inhale1' ? '200px' :
                         breathPhase === 'inhale2' ? '240px' :
                         breathPhase === 'exhale' ? '80px' : '120px',
                  height: breathPhase === 'inhale1' ? '200px' :
                          breathPhase === 'inhale2' ? '240px' :
                          breathPhase === 'exhale' ? '80px' : '120px',
                  borderRadius: '50%',
                  background: breathPhase === 'inhale1' || breathPhase === 'inhale2' ?
                    'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' :
                    breathPhase === 'exhale' ?
                    'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' :
                    'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  transition: 'all ' + (breathPhase === 'inhale1' ? '4s' :
                                       breathPhase === 'inhale2' ? '1s' :
                                       breathPhase === 'exhale' ? '8s' : '2s') + ' ease-in-out',
                  boxShadow: '0 0 60px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '40px'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    textAlign: 'center'
                  }}>
                    {breathPhase === 'inhale1' && 'Breathe In'}
                    {breathPhase === 'inhale2' && 'Top Off'}
                    {breathPhase === 'exhale' && 'Sighhhhh Out'}
                    {breathPhase === 'rest' && 'Rest'}
                  </div>
                </div>

                {/* Instructions */}
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#f1f5f9',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  {breathPhase === 'inhale1' && 'Deep breath through your nose...'}
                  {breathPhase === 'inhale2' && 'One more quick inhale!'}
                  {breathPhase === 'exhale' && 'Slow exhale through your mouth...'}
                  {breathPhase === 'rest' && 'Relax...'}
                </div>

                {/* Round counter */}
                <div style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                  textAlign: 'center'
                }}>
                  Round {currentRound} of 3
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Today's Call (Contact Entry) */}
      {state.step === 2 && (
        <div style={styles.stepContainer}>
          <button onClick={handleBack} style={styles.backButton}>
            ← Back
          </button>

          <h2 style={styles.title}>Who are you calling today?</h2>

          <input
            type="text"
            placeholder="Contact name"
            value={state.contactName}
            onChange={(e) => setState({ ...state, contactName: e.target.value })}
            style={styles.input}
          />

          <input
            type="tel"
            placeholder="Phone number"
            value={state.contactPhone}
            onChange={(e) => setState({ ...state, contactPhone: e.target.value })}
            style={styles.input}
          />

          <textarea
            placeholder="Quick notes (e.g., 'Bought in 2019, loves gardening')"
            value={state.contactNotes}
            onChange={(e) => setState({ ...state, contactNotes: e.target.value })}
            style={styles.textarea}
            rows={3}
          />

          <button
            onClick={handleContactSubmit}
            disabled={!state.contactName || !state.contactPhone}
            style={{
              ...styles.primaryButton,
              opacity: (!state.contactName || !state.contactPhone) ? 0.5 : 1,
            }}
          >
            Next: Get Script
          </button>
        </div>
      )}

      {/* Step 3: Script Selection */}
      {state.step === 3 && (
        <div style={styles.stepContainer}>
          <button onClick={handleBack} style={styles.backButton}>
            ← Back
          </button>

          <h2 style={styles.title}>Choose Your Script</h2>
          <p style={styles.subtitle}>Pick the one that feels most natural for you</p>

          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {SCRIPT_VARIATIONS.map(script => (
              <button
                key={script.id}
                onClick={() => handleScriptSelect(script)}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '2px solid #334155',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{script.emoji}</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f1f5f9' }}>
                    {script.name}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                  {script.tone}
                </div>
              </button>
            ))}
          </div>

          {/* AI Custom Script Generator */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
              Or generate a personalized script with AI
            </p>
            <button
              onClick={handleGenerateCustomScript}
              disabled={isGeneratingScript}
              style={{
                background: isGeneratingScript
                  ? '#475569'
                  : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 28px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: isGeneratingScript ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)',
              }}
            >
              {isGeneratingScript ? '⏳ Generating...' : '✨ Generate Custom Script'}
            </button>
          </div>

          {/* Display Generated Custom Script with Variations */}
          {customScript && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid #10b981',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginBottom: '16px' }}>
                🎯 Your Personalized Script
              </h3>

              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedScriptType('call')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: selectedScriptType === 'call' ? '2px solid #10b981' : '2px solid #475569',
                    background: selectedScriptType === 'call' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: selectedScriptType === 'call' ? '#10b981' : '#cbd5e1',
                    fontSize: '14px',
                    fontWeight: selectedScriptType === 'call' ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                >
                  📞 Call Script
                </button>
                <button
                  onClick={() => setSelectedScriptType('text')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: selectedScriptType === 'text' ? '2px solid #10b981' : '2px solid #475569',
                    background: selectedScriptType === 'text' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: selectedScriptType === 'text' ? '#10b981' : '#cbd5e1',
                    fontSize: '14px',
                    fontWeight: selectedScriptType === 'text' ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                >
                  💬 Text Message
                </button>
                <button
                  onClick={() => setSelectedScriptType('voicemail')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: selectedScriptType === 'voicemail' ? '2px solid #10b981' : '2px solid #475569',
                    background: selectedScriptType === 'voicemail' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: selectedScriptType === 'voicemail' ? '#10b981' : '#cbd5e1',
                    fontSize: '14px',
                    fontWeight: selectedScriptType === 'voicemail' ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                >
                  📱 Voicemail
                </button>
              </div>

              {/* Script Content */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#e5e7eb', whiteSpace: 'pre-wrap' }}>
                  {selectedScriptType === 'call' && customScript.call_script}
                  {selectedScriptType === 'text' && customScript.text_script}
                  {selectedScriptType === 'voicemail' && customScript.voicemail_script}
                </p>
              </div>

              {/* Conversation Prompts */}
              {customScript.conversation_prompts && customScript.conversation_prompts.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                    💡 Conversation Starters:
                  </h4>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {customScript.conversation_prompts.map((prompt, index) => (
                      <li key={index} style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '4px' }}>
                        {prompt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Referral Segue */}
              {customScript.referral_segue && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                    🤝 Soft Referral Ask:
                  </h4>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', fontStyle: 'italic' }}>
                    {customScript.referral_segue}
                  </p>
                </div>
              )}

              {/* Use This Script Button */}
              <button
                onClick={() => {
                  // Create a temporary script object to use with the existing flow
                  const tempScript: ScriptVariation = {
                    id: 'custom-ai',
                    name: 'AI-Generated Custom Script',
                    emoji: '🤖',
                    tone: 'Personalized for ' + state.contactName,
                    opening: {
                      say: customScript.call_script || '',
                      listenFor: 'Their response and tone',
                      nextMove: 'Adapt based on their reaction'
                    },
                    body: {
                      say: customScript.text_script || '',
                      listenFor: 'Engagement signals',
                      nextMove: 'Continue conversation naturally'
                    },
                    transition: {
                      say: customScript.conversation_prompts?.[0] || '',
                      listenFor: 'Their interests',
                      nextMove: 'Build rapport'
                    },
                    ask: {
                      say: customScript.referral_segue || '',
                      listenFor: 'Willingness to refer',
                      nextMove: 'Thank them gracefully'
                    },
                    close: {
                      say: customScript.voicemail_script || 'Thanks for your time!',
                      listenFor: 'Goodbye',
                      nextMove: 'End call warmly'
                    }
                  };
                  handleScriptSelect(tempScript);
                }}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                ✅ Use This Script
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Live Call Companion */}
      {state.step === 4 && state.selectedScript && (
        <div style={styles.stepContainer}>
          {/* Only show back button BEFORE call starts */}
          {!state.callStartTime && (
            <button onClick={handleBack} style={styles.backButton}>
              ← Back
            </button>
          )}

          <h2 style={styles.title}>{state.contactName}</h2>
          <p style={styles.subtitle}>{state.contactPhone}</p>

          {/* Tap to Call */}
          {!state.callStartTime && (
            <>
              {/* Show selected script name */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '2px solid #10b981',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '20px', marginRight: '8px' }}>{state.selectedScript.emoji}</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                  {state.selectedScript.name}
                </span>
              </div>

              <a
                href={`tel:+1${state.contactPhone.replace(/\D/g, '')}`}
                onClick={handleStartCall}
                style={styles.callButton}
              >
                📞 Tap to Call
              </a>

              {/* Show full script breakdown before call */}
              <div style={{ marginTop: '24px' }}>
                <ScriptBreakdown script={state.selectedScript} contactName={state.contactName} />
              </div>
            </>
          )}

          {/* Live Checklist (appears after call starts) */}
          {state.callStartTime && (
            <>
              <div style={styles.timerBox}>
                ⏱️ Call in progress: {formatDuration(
                  Math.floor((new Date().getTime() - state.callStartTime.getTime()) / 1000)
                )}
              </div>

              {/* Current phase guide */}
              <div style={styles.scriptBox}>
                <ScriptBreakdown script={state.selectedScript} contactName={state.contactName} compact />
              </div>

              <div style={styles.checklistBox}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                  Call Checklist:
                </div>
                {state.checklist.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    style={{
                      ...styles.checklistItem,
                      opacity: item.completed ? 0.5 : 1,
                    }}
                  >
                    <div style={{ fontSize: '20px' }}>
                      {item.completed ? '✅' : '⬜'}
                    </div>
                    <div style={{ flex: 1, textDecoration: item.completed ? 'line-through' : 'none' }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleEndCall} style={styles.endCallButton}>
                End Call
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 5: Post-Call Summary */}
      {state.step === 5 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.title}>How did it go?</h2>
          <p style={styles.subtitle}>Call duration: {formatDuration(state.callDuration)}</p>

          <textarea
            placeholder="Quick notes about the call (optional)"
            value={state.callNotes}
            onChange={(e) => setState({ ...state, callNotes: e.target.value })}
            style={styles.textarea}
            rows={3}
          />

          <div style={styles.outcomeGrid}>
            {['completed', 'voicemail', 'no-answer', 'callback'].map(outcome => (
              <button
                key={outcome}
                onClick={() => handleCallComplete(outcome as CallOutcome)}
                style={styles.outcomeButton}
              >
                {outcome === 'completed' && '✅ Talked'}
                {outcome === 'voicemail' && '📬 Voicemail'}
                {outcome === 'no-answer' && '📵 No Answer'}
                {outcome === 'callback' && '🔄 Call Back'}
              </button>
            ))}
          </div>

          {state.callOutcome && (
            <div style={styles.celebrationBox}>
              <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>🎉 You did it!</h2>
              <p style={{ fontSize: '18px', marginBottom: '16px' }}>
                {streak} day streak · {totalCalls} total calls
              </p>
              <button onClick={handleReset} style={styles.primaryButton}>
                Make Another Call
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCRIPT BREAKDOWN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ScriptBreakdown({ script, contactName, compact = false }: {
  script: ScriptVariation;
  contactName: string;
  compact?: boolean;
}) {
  const phases = [
    { name: 'Opening', data: script.opening, emoji: '👋' },
    { name: 'Body', data: script.body, emoji: '💬' },
    { name: 'Transition', data: script.transition, emoji: '🔄' },
    { name: 'Ask', data: script.ask, emoji: '🙏' },
    { name: 'Close', data: script.close, emoji: '👋' }
  ];

  const personalizeSay = (text: string) => {
    return text.replace(/\[NAME\]/g, contactName);
  };

  if (compact) {
    return (
      <div style={{ fontSize: '13px' }}>
        {phases.map((phase, idx) => (
          <div key={idx} style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
              {phase.emoji} {phase.name}
            </div>
            <div style={{ color: '#e2e8f0', lineHeight: '1.4' }}>
              {personalizeSay(phase.data.say)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {phases.map((phase, idx) => (
        <div
          key={idx}
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '2px solid #334155',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px'
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginBottom: '12px' }}>
            {phase.emoji} {phase.name}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>
              SAY:
            </div>
            <div style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.6' }}>
              "{personalizeSay(phase.data.say)}"
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>
              LISTEN FOR:
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
              {phase.data.listenFor}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>
              NEXT MOVE:
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
              {phase.data.nextMove}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#f1f5f9',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  streakBadge: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: 'rgba(16, 185, 129, 0.2)',
    border: '2px solid #10b981',
    borderRadius: '12px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#10b981',
    zIndex: 1000,
  },
  stepContainer: {
    maxWidth: '600px',
    margin: '0 auto',
    paddingTop: '60px',
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'color 0.2s',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  },
  skipButton: {
    width: '100%',
    padding: '14px',
    fontSize: '14px',
    fontWeight: '600',
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'color 0.2s',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#94a3b8',
    marginBottom: '32px',
    textAlign: 'center',
  },
  moodGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
    marginTop: '32px',
  },
  moodButton: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '3px solid',
    borderRadius: '16px',
    padding: '24px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    color: '#f1f5f9',
    minHeight: '140px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  },
  interventionBox: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid #334155',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  interventionSection: {
    marginBottom: '20px',
  },
  interventionLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  },
  interventionText: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#e2e8f0',
  },
  input: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#f1f5f9',
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#f1f5f9',
    marginBottom: '16px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  primaryButton: {
    width: '100%',
    padding: '18px 24px',
    fontSize: '18px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#0f172a',
    cursor: 'pointer',
    minHeight: '56px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: 'transform 0.2s',
  },
  scriptBox: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '2px solid #10b981',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
  },
  callButton: {
    display: 'block',
    width: '100%',
    padding: '20px 24px',
    fontSize: '20px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#0f172a',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    minHeight: '56px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  },
  timerBox: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '2px solid #ef4444',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '24px',
    color: '#fca5a5',
  },
  checklistBox: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid #334155',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  },
  endCallButton: {
    width: '100%',
    padding: '18px 24px',
    fontSize: '18px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    minHeight: '56px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  },
  outcomeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '24px',
  },
  outcomeButton: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#f1f5f9',
    cursor: 'pointer',
    minHeight: '56px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  },
  celebrationBox: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '2px solid #10b981',
    borderRadius: '16px',
    padding: '32px',
    marginTop: '24px',
    textAlign: 'center',
  },
};
