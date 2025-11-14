import React, { useState, useMemo } from 'react';
import { CORE_ACTIVITIES, UNIVERSAL_BARRIERS, Activity, UserProfile } from './activities';

interface DiagnosticFlowProps {
  onComplete: (
    profile: UserProfile, 
    selectedActivityId: string,
    selectedBarrier: string
  ) => void;
}

export const DiagnosticFlow: React.FC<DiagnosticFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [market, setMarket] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'new' | 'intermediate' | 'experienced'>('intermediate');
  const [businessGoal, setBusinessGoal] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [selectedBarrier, setSelectedBarrier] = useState<string>('');

  const selectedActivity: Activity | undefined = useMemo(
    () => CORE_ACTIVITIES.find(a => a.id === selectedActivityId || ''),
    [selectedActivityId]
  );

  const handleSubmit = () => {
    if (!selectedActivityId || !selectedBarrier) return;

    const profile: UserProfile = {
      name,
      market,
      experienceLevel,
      businessGoal,
      priorityActivities: [selectedActivityId],
      onboardingComplete: true
    };
    
    // Scroll to top before completing
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    onComplete(profile, selectedActivityId, selectedBarrier);
  };

  const renderStep1 = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a1a' }}>
        Let's get you unstuck
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px', lineHeight: '1.6' }}>
        Most agents know what they SHOULD be doing. The question is: what are you actually avoiding?
        Let's figure that out together.
      </p>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
          What's your name?
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
          What market do you work in?
        </label>
        <input
          type="text"
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          placeholder="City, State (e.g., Austin, TX)"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
          How long have you been in real estate?
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { value: 'new' as const, label: '0-2 years' },
            { value: 'intermediate' as const, label: '3-5 years' },
            { value: 'experienced' as const, label: '6+ years' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setExperienceLevel(option.value)}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                border: `2px solid ${experienceLevel === option.value ? '#4CAF50' : '#e0e0e0'}`,
                borderRadius: '8px',
                background: experienceLevel === option.value ? '#E8F5E9' : 'white',
                color: experienceLevel === option.value ? '#2E7D32' : '#666',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
          What's your business goal this year?
        </label>
        <input
          type="text"
          value={businessGoal}
          onChange={(e) => setBusinessGoal(e.target.value)}
          placeholder="e.g., Close 24 deals, Hit $100K GCI"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
      </div>

      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (name && market && businessGoal) setStep(2);
        }}
        disabled={!name || !market || !businessGoal}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '18px',
          fontWeight: 'bold',
          background: (!name || !market || !businessGoal) ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: (!name || !market || !businessGoal) ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s'
        }}
      >
        Next: The Honest Assessment →
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a1a' }}>
        Pick just one to tackle now
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
        Of the 10 high-impact activities, which are you <strong>most avoiding right this moment</strong>?
        We'll focus on just one. You can always come back for another later.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {CORE_ACTIVITIES.map((activity) => {
          const selected = selectedActivityId === activity.id;
          return (
            <button
              key={activity.id}
              onClick={() => {
                setSelectedActivityId(activity.id);
                // Reset barrier choice when switching activity
                setSelectedBarrier('');
              }}
              style={{
                textAlign: 'left',
                background: selected ? '#E8F5E9' : 'white',
                border: `2px solid ${selected ? '#4CAF50' : '#e0e0e0'}`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>
                {selected && '✓ '} {activity.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>{activity.description}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#888' }}>📅 {activity.frequency}</span>
                <span style={{ fontSize: '12px', color: '#888' }}>⏱️ {activity.timeEstimate}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#FF6B6B' }}>⭐ {activity.impactScore}/10</span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setStep(1);
          }}
          style={{
            flex: 1,
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: 'white',
            color: '#666',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            selectedActivityId && setStep(3);
          }}
          disabled={!selectedActivityId}
          style={{
            flex: 2,
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: !selectedActivityId ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !selectedActivityId ? 'not-allowed' : 'pointer'
          }}
        >
          Next: What's really stopping you? →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (!selectedActivity) return null;
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a1a' }}>
          Let's dig deeper, {name}
        </h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '16px', lineHeight: '1.6' }}>
          You chose: <strong style={{ color: '#1a1a1a' }}>{selectedActivity.title}</strong>.
          Now the critical question: <strong style={{ color: '#1a1a1a' }}>What's really stopping you?</strong>
        </p>
        <p style={{ fontSize: '16px', color: '#999', marginBottom: '32px', lineHeight: '1.5', fontStyle: 'italic' }}>
          Be brutally honest. No judgment. This is how we prescribe the right solution.
        </p>
        <div
          style={{
            background: 'white',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>
            {selectedActivity.title}
          </h3>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '20px', fontStyle: 'italic' }}>
            What's the real reason you're not doing this?
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {UNIVERSAL_BARRIERS.map((barrier) => {
              const isSelected = selectedBarrier === barrier.id;
              return (
                <button
                  key={barrier.id}
                  onClick={() => setSelectedBarrier(barrier.id)}
                  style={{
                    padding: '14px 16px',
                    fontSize: '14px',
                    textAlign: 'left',
                    border: `2px solid ${isSelected ? '#4CAF50' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    background: isSelected ? '#E8F5E9' : 'white',
                    color: isSelected ? '#2E7D32' : '#333',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: isSelected ? '600' : 'normal',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#4CAF50';
                      e.currentTarget.style.background = '#f9f9f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <span style={{ fontWeight: '600' }}>
                    {isSelected && '✓ '}
                    {barrier.label}
                  </span>
                  {'subtext' in barrier && (
                    <span style={{ fontSize: '12px', color: isSelected ? '#558B5A' : '#999', fontStyle: 'italic' }}>
                      {(barrier as any).subtext}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom reason input */}
          <div style={{ marginTop: '16px', padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#666', display: 'block', marginBottom: '8px' }}>
              Or describe your own reason:
            </label>
            <input
              type="text"
              placeholder="Type your specific barrier here... (optional)"
              value={selectedBarrier.startsWith('custom:') ? selectedBarrier.replace('custom:', '') : ''}
              onChange={(e) => {
                if (e.target.value.trim()) {
                  setSelectedBarrier(`custom:${e.target.value.trim()}`);
                } else {
                  setSelectedBarrier('');
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ fontSize: '12px', color: '#999', marginTop: '6px', fontStyle: 'italic' }}>
              Sometimes your reason is unique. That's okay - we'll coach you through it.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setStep(2);
            }}
            style={{
              flex: 1,
              padding: '16px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: 'white',
              color: '#666',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedBarrier}
            style={{
              flex: 2,
              padding: '16px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: !selectedBarrier ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: !selectedBarrier ? 'not-allowed' : 'pointer'
            }}
          >
            See My Custom Action Plan →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '60px' }}>
      {/* Progress indicator */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div style={{
                flex: 1,
                height: '8px',
                background: step >= s ? '#4CAF50' : '#e0e0e0',
                borderRadius: '4px',
                transition: 'background 0.3s'
              }} />
              {s < 3 && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: step >= s ? '#4CAF50' : '#e0e0e0',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'background 0.3s'
                }}>
                  {s}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};
