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
    category: 'content'
  },
  {
    id: 'video-script',
    name: 'Video Scripts',
    emoji: '🎥',
    description: 'Reels, TikTok, YouTube',
    category: 'content'
  },
  {
    id: 'listing-description',
    name: 'Listing Descriptions',
    emoji: '🏡',
    description: 'MLS copy that sells',
    category: 'content'
  },
  {
    id: 'email-sequence',
    name: 'Email Campaigns',
    emoji: '📧',
    description: 'Nurture sequences',
    category: 'content'
  },

  // SALES & PROSPECTING
  {
    id: 'sphere-script',
    name: 'Call Scripts',
    emoji: '📞',
    description: 'Sphere & lead calls',
    category: 'sales'
  },
  {
    id: 'consultation-script',
    name: 'Consultations',
    emoji: '💼',
    description: 'Buyer/seller meetings',
    category: 'sales'
  },
  {
    id: 'objection-handling',
    name: 'Handle Objections',
    emoji: '🛡️',
    description: 'Price, commission, timing',
    category: 'sales'
  },
  {
    id: 'expired-fsbo',
    name: 'Expired/FSBO',
    emoji: '✉️',
    description: 'Win difficult listings',
    category: 'sales'
  },

  // CLIENT SERVICE
  {
    id: 'open-house-followup',
    name: 'Open House Follow-Up',
    emoji: '🚪',
    description: 'Text/email after visits',
    category: 'service'
  },
  {
    id: 'market-report',
    name: 'Market Updates',
    emoji: '📊',
    description: 'Client-friendly reports',
    category: 'service'
  },
  {
    id: 'cma-narrative',
    name: 'CMA Narrative',
    emoji: '📈',
    description: 'Explain pricing strategy',
    category: 'service'
  },
  {
    id: 'thank-you',
    name: 'Thank You Notes',
    emoji: '🙏',
    description: 'Personal & memorable',
    category: 'service'
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
                <button
                  key={useCase.id}
                  onClick={() => handleUseCaseSelect(useCase.id)}
                  style={styles.useCaseCard}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {useCase.emoji}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: '#f1f5f9' }}>
                    {useCase.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {useCase.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SALES & PROSPECTING */}
          <div style={styles.categorySection}>
            <h3 style={styles.categoryTitle}>Sales & Prospecting</h3>
            <div style={styles.useCaseGrid}>
              {USE_CASES.filter(u => u.category === 'sales').map(useCase => (
                <button
                  key={useCase.id}
                  onClick={() => handleUseCaseSelect(useCase.id)}
                  style={styles.useCaseCard}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {useCase.emoji}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: '#f1f5f9' }}>
                    {useCase.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {useCase.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CLIENT SERVICE */}
          <div style={styles.categorySection}>
            <h3 style={styles.categoryTitle}>Client Service</h3>
            <div style={styles.useCaseGrid}>
              {USE_CASES.filter(u => u.category === 'service').map(useCase => (
                <button
                  key={useCase.id}
                  onClick={() => handleUseCaseSelect(useCase.id)}
                  style={styles.useCaseCard}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {useCase.emoji}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: '#f1f5f9' }}>
                    {useCase.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {useCase.description}
                  </div>
                </button>
              ))}
            </div>
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

      {/* Step 4: Generated Prompt */}
      {!showHistory && state.step === 4 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.title}>Your Perfect AI Prompt</h2>
          <div style={styles.explainerBox}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>How this works:</strong>
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              1. Click "Copy to Clipboard" below<br />
              2. Open ChatGPT, Claude, or your AI assistant<br />
              3. Paste the prompt and hit send<br />
              4. The AI will generate your content using advanced techniques
            </div>
          </div>

          <div style={styles.promptBox}>
            <pre style={styles.promptText}>{state.generatedPrompt}</pre>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopyPrompt}
              style={{
                ...styles.primaryButton,
                background: copiedPrompt ? '#10b981' : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                flex: '1 1 200px'
              }}
              aria-label={copiedPrompt ? 'Prompt copied to clipboard' : 'Copy prompt to clipboard'}
              aria-live="polite"
            >
              {copiedPrompt ? '✓ Copied!' : '📋 Copy to Clipboard'}
            </button>
            <a
              href={`https://chat.openai.com/?q=${encodeURIComponent(state.generatedPrompt)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...styles.primaryButton,
                background: '#10a37f',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '1 1 200px'
              }}
            >
              Test in ChatGPT →
            </a>
          </div>

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
          placeholder={'placeholder' in currentQuestion ? currentQuestion.placeholder : ''}
          style={styles.input}
          autoFocus
        />
      )}

      {currentQuestion.type === 'textarea' && (
        <textarea
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => onAnswer(currentQuestion.id, e.target.value)}
          placeholder={'placeholder' in currentQuestion ? currentQuestion.placeholder : ''}
          style={styles.textarea}
          rows={4}
          autoFocus
        />
      )}

      {currentQuestion.type === 'select' && 'options' in currentQuestion && currentQuestion.options && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {currentQuestion.options.map(option => (
            <button
              key={option.value}
              onClick={() => onAnswer(currentQuestion.id, option.value)}
              style={{
                ...styles.selectOption,
                borderColor: answers[currentQuestion.id] === option.value ? '#10b981' : '#334155',
                background: answers[currentQuestion.id] === option.value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.6)'
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
          opacity: canContinue ? 1 : 0.5,
          cursor: canContinue ? 'pointer' : 'not-allowed'
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
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    lineHeight: 1.6, // Improved from browser default
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
    paddingTop: '40px'
  },
  logo: {
    fontSize: '36px', // Increased from 32px
    fontWeight: 'bold',
    marginBottom: '12px', // Increased from 8px
    lineHeight: 1.2,
    background: 'linear-gradient(135deg, #a78bfa 0%, #10b981 100%)', // Brighter purple for contrast
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  tagline: {
    fontSize: '16px',
    color: '#d1d5db', // Increased from #94a3b8 for AAA contrast (10.1:1)
    lineHeight: 1.5,
  },
  stepContainer: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '48px',
    textAlign: 'center',
    letterSpacing: '-0.01em', // Slightly tighter for headings
    lineHeight: 1.3,
    color: '#f8fafc', // Explicit AAA contrast
  },
  subtitle: {
    fontSize: '16px',
    color: '#d1d5db', // Increased from #94a3b8 for AAA contrast (10.1:1)
    marginBottom: '32px',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  categorySection: {
    marginBottom: '56px' // Increased from 48px for better separation
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
    padding: '24px', // Increased from 20px for better touch targets
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    color: '#f8fafc', // AAA contrast
    minHeight: '156px', // Increased from 140px for better touch target (48px+)
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
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '12px 0', // Increased from 8px for 48px touch target
    marginBottom: '24px',
    minHeight: '48px', // Explicit touch target
    display: 'flex',
    alignItems: 'center',
    outline: 'none', // Will add custom focus state
  },
  input: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    background: 'rgba(21, 27, 46, 0.8)',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#f8fafc', // AAA contrast
    marginBottom: '24px',
    boxSizing: 'border-box',
    lineHeight: 1.5,
    minHeight: '56px', // Improved touch target
    outline: 'none', // Will add custom focus state
  },
  textarea: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    background: 'rgba(21, 27, 46, 0.8)',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#f8fafc', // AAA contrast
    marginBottom: '24px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    lineHeight: 1.6,
    minHeight: '120px',
    outline: 'none', // Will add custom focus state
  },
  selectOption: {
    background: 'rgba(21, 27, 46, 0.8)',
    border: '2px solid #334155',
    borderRadius: '12px',
    padding: '20px', // Increased from 16px for better touch target
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    color: '#f8fafc', // AAA contrast
    minHeight: '56px', // Explicit touch target
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
    padding: '18px 24px',
    fontSize: '17px', // Optimized for mobile readability
    fontWeight: '600', // Slightly reduced from bold for better readability
    borderRadius: '12px',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    minHeight: '56px',
    transition: 'all 0.2s',
    lineHeight: 1.4,
    letterSpacing: '0.01em',
    outline: 'none', // Will add custom focus state
    boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3)', // Adds depth
  },
  secondaryButton: {
    width: '100%',
    padding: '18px', // Increased from 16px for better touch target
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '12px',
    border: '2px solid #475569',
    background: 'transparent',
    color: '#d1d5db', // Improved from #cbd5e1 for better contrast
    cursor: 'pointer',
    marginTop: '16px',
    minHeight: '56px',
    lineHeight: 1.4,
    outline: 'none', // Will add custom focus state
  },
  ctaBox: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '2px solid #10b981',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'center'
  },
  historyButton: {
    background: 'rgba(139, 92, 246, 0.15)',
    border: '2px solid #a78bfa', // Increased border visibility
    borderRadius: '10px',
    padding: '12px 20px', // Increased for 48px touch target
    fontSize: '15px', // Increased from 14px
    fontWeight: '600',
    color: '#c4b5fd', // Brighter for better contrast
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'all 0.2s',
    minHeight: '48px',
    lineHeight: 1.4,
    outline: 'none', // Will add custom focus state
  },
  historyCard: {
    background: 'rgba(21, 27, 46, 0.8)',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '20px', // Increased from 16px
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  historyRestoreButton: {
    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', // Brighter gradient
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px', // Increased for 48px touch target
    fontSize: '15px', // Increased from 14px
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '48px',
    lineHeight: 1.4,
    outline: 'none', // Will add custom focus state
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
  },
  explainerBox: {
    background: 'rgba(59, 130, 246, 0.12)',
    border: '2px solid #60a5fa', // Brighter blue for better visibility
    borderRadius: '12px',
    padding: '20px', // Increased from 16px
    marginBottom: '24px',
    color: '#e5e7eb', // Improved contrast
    lineHeight: 1.6,
  }
};

// Export component
export default PromptCrafter;
