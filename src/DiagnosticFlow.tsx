import React, { useState } from 'react';
import { CORE_ACTIVITIES, Activity, ActivityStatus, UserProfile } from './activities';

interface DiagnosticFlowProps {
  onComplete: (profile: UserProfile, selectedActivities: Map<string, ActivityStatus>) => void;
}

export const DiagnosticFlow: React.FC<DiagnosticFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [market, setMarket] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'new' | 'intermediate' | 'experienced'>('intermediate');
  const [businessGoal, setBusinessGoal] = useState('');
  const [activityStatuses, setActivityStatuses] = useState<Map<string, ActivityStatus>>(new Map());

  const handleActivityStatusChange = (activityId: string, status: ActivityStatus) => {
    const newStatuses = new Map(activityStatuses);
    newStatuses.set(activityId, status);
    setActivityStatuses(newStatuses);
  };

  const getAvoidedActivities = (): Activity[] => {
    return CORE_ACTIVITIES.filter(a => {
      const status = activityStatuses.get(a.id);
      return status === 'not-doing' || status === 'doing-sometimes';
    }).sort((a, b) => b.impactScore - a.impactScore);
  };

  const handleSubmit = () => {
    const profile: UserProfile = {
      name,
      market,
      experienceLevel,
      businessGoal,
      priorityActivities: getAvoidedActivities().slice(0, 3).map(a => a.id),
      onboardingComplete: true
    };
    onComplete(profile, activityStatuses);
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
        onClick={() => name && market && businessGoal && setStep(2)}
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a1a' }}>
        The Honest Assessment
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px', lineHeight: '1.6' }}>
        Here are the 10 activities that separate top producers from everyone else.
        <br />
        <strong>Be brutally honest:</strong> Which ones are you actually doing consistently?
      </p>

      <div style={{ marginBottom: '40px' }}>
        {CORE_ACTIVITIES.map((activity, index) => {
          const status = activityStatuses.get(activity.id);
          return (
            <div
              key={activity.id}
              style={{
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '16px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{
                      background: '#4CAF50',
                      color: 'white',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {index + 1}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>
                      {activity.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    {activity.description}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong>Frequency:</strong> {activity.frequency}
                    </span>
                    <span style={{ fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong>Time:</strong> {activity.timeEstimate}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Impact: {'⭐'.repeat(Math.ceil(activity.impactScore / 2))}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleActivityStatusChange(activity.id, 'doing-consistently')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: `2px solid ${status === 'doing-consistently' ? '#4CAF50' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    background: status === 'doing-consistently' ? '#E8F5E9' : 'white',
                    color: status === 'doing-consistently' ? '#2E7D32' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ✅ Doing it
                </button>
                <button
                  onClick={() => handleActivityStatusChange(activity.id, 'doing-sometimes')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: `2px solid ${status === 'doing-sometimes' ? '#FF9800' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    background: status === 'doing-sometimes' ? '#FFF3E0' : 'white',
                    color: status === 'doing-sometimes' ? '#E65100' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ⚠️ Sometimes
                </button>
                <button
                  onClick={() => handleActivityStatusChange(activity.id, 'not-doing')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: `2px solid ${status === 'not-doing' ? '#F44336' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    background: status === 'not-doing' ? '#FFEBEE' : 'white',
                    color: status === 'not-doing' ? '#C62828' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ❌ Avoiding
                </button>
              </div>

              {status === 'not-doing' && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#FFF3E0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#E65100'
                }}>
                  <strong>Common reasons agents skip this:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    {activity.avoidanceReasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setStep(1)}
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
          onClick={() => activityStatuses.size === CORE_ACTIVITIES.length && setStep(3)}
          disabled={activityStatuses.size !== CORE_ACTIVITIES.length}
          style={{
            flex: 2,
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: activityStatuses.size !== CORE_ACTIVITIES.length ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: activityStatuses.size !== CORE_ACTIVITIES.length ? 'not-allowed' : 'pointer'
          }}
        >
          See My Results →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const avoided = getAvoidedActivities();
    const consistent = CORE_ACTIVITIES.filter(a => activityStatuses.get(a.id) === 'doing-consistently');

    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a1a' }}>
          Here's the truth, {name}
        </h1>

        {consistent.length > 0 && (
          <div style={{
            background: '#E8F5E9',
            border: '2px solid #4CAF50',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '12px' }}>
              ✅ You're crushing it on {consistent.length} activities:
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#2E7D32' }}>
              {consistent.map(a => (
                <li key={a.id} style={{ marginBottom: '8px' }}>{a.title}</li>
              ))}
            </ul>
          </div>
        )}

        {avoided.length > 0 && (
          <>
            <div style={{
              background: '#FFEBEE',
              border: '2px solid #F44336',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#C62828', marginBottom: '12px' }}>
                ⚠️ But you're leaving money on the table with these {avoided.length}:
              </h3>
              <div style={{ marginTop: '16px' }}>
                {avoided.slice(0, 3).map((activity, index) => (
                  <div
                    key={activity.id}
                    style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      border: '2px solid #FFCDD2'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{
                        background: '#F44336',
                        color: 'white',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        {index + 1}
                      </span>
                      <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>
                        {activity.title}
                      </h4>
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#F44336'
                      }}>
                        Impact: {activity.impactScore}/10
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                      {activity.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: '#FFF3E0',
              borderLeft: '4px solid #FF9800',
              padding: '20px',
              marginBottom: '32px',
              borderRadius: '4px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#E65100', marginBottom: '12px' }}>
                💡 Here's what we're going to do:
              </h3>
              <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6', margin: 0 }}>
                We'll focus on <strong>just these top 3 activities</strong> that will move the needle most for your {market} business.
                I'll help you execute them in <strong>5 minutes or less</strong> using AI.
                <br /><br />
                No more excuses. No more overwhelm. Just daily action.
              </p>
            </div>
          </>
        )}

        <button
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '20px',
            fontSize: '20px',
            fontWeight: 'bold',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
          }}
        >
          Let's Get to Work 🚀
        </button>
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
