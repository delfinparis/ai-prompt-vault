import React, { useState } from 'react';
import { Activity, UNIVERSAL_BARRIERS } from './activities';

interface BarrierInterventionProps {
  activity: Activity;
  selectedBarrier: string;
  userName: string;
  onReady: () => void; // When user is ready to execute
  onBack: () => void;
}

export const BarrierIntervention: React.FC<BarrierInterventionProps> = ({
  activity,
  selectedBarrier,
  userName,
  onReady,
  onBack
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  // Get barrier details
  const getBarrierDetails = () => {
    if (selectedBarrier.startsWith('custom:')) {
      return {
        label: selectedBarrier.replace('custom:', ''),
        intervention: {
          validate: 'What you\'re feeling is real. Your hesitation is telling you something important.',
          reframe: 'But remember: discomfort is not danger. Growth lives on the other side of this feeling.',
          microAction: 'Take it one tiny step at a time. You don\'t have to do it perfectly - just do it.',
          mantra: '"I feel the fear, and I do it anyway."'
        }
      };
    }

    const barrier = UNIVERSAL_BARRIERS.find(b => b.id === selectedBarrier);
    return barrier || null;
  };

  const barrier = getBarrierDetails();
  if (!barrier || !barrier.intervention) return null;

  const { validate, reframe, microAction, mantra } = barrier.intervention;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'white',
            border: '2px solid #e0e0e0',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            color: '#666',
            marginBottom: '24px'
          }}
        >
          ← Back
        </button>

        {/* Main intervention card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '48px 40px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          marginBottom: '24px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '12px' }}>
              Let's get you unstuck, {userName}
            </h1>
            <p style={{ fontSize: '18px', color: '#666', lineHeight: '1.6' }}>
              You're avoiding <strong>{activity.title}</strong> because:
            </p>
            <p style={{ 
              fontSize: '20px', 
              color: '#FF6B6B', 
              fontWeight: '600', 
              fontStyle: 'italic',
              marginTop: '12px'
            }}>
              "{barrier.label}"
            </p>
          </div>

          {/* Step 1: Validate */}
          <div style={{ 
            marginBottom: '32px',
            padding: '24px',
            background: '#FFF3E0',
            borderLeft: '4px solid #FFB800',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
              <span style={{ fontSize: '32px', flexShrink: 0 }}>✋</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#E65100', marginBottom: '12px' }}>
                  First, let's validate what you're feeling
                </h3>
                <p style={{ fontSize: '16px', color: '#333', lineHeight: '1.7', margin: 0 }}>
                  {validate}
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Reframe */}
          <div style={{ 
            marginBottom: '32px',
            padding: '24px',
            background: '#E8F5E9',
            borderLeft: '4px solid #4CAF50',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
              <span style={{ fontSize: '32px', flexShrink: 0 }}>🔄</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2E7D32', marginBottom: '12px' }}>
                  Now, let's reframe it
                </h3>
                <p style={{ fontSize: '16px', color: '#333', lineHeight: '1.7', margin: 0 }}>
                  {reframe}
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Micro-action */}
          <div style={{ 
            marginBottom: '32px',
            padding: '24px',
            background: '#E3F2FD',
            borderLeft: '4px solid #2196F3',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
              <span style={{ fontSize: '32px', flexShrink: 0 }}>🎯</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1565C0', marginBottom: '12px' }}>
                  Here's your micro-action
                </h3>
                <p style={{ fontSize: '16px', color: '#333', lineHeight: '1.7', margin: 0 }}>
                  {microAction}
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Mantra */}
          <div style={{ 
            marginBottom: '40px',
            padding: '32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px'
            }}>
              Your mantra
            </p>
            <p style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: 'white',
              lineHeight: '1.5',
              margin: 0
            }}>
              {mantra}
            </p>
          </div>

          {/* Acknowledgment checkbox */}
          <div style={{
            padding: '24px',
            background: '#F5F5F5',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                style={{
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
              <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>
                I understand this. I'm ready to take action despite the discomfort.
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={onBack}
              style={{
                flex: 1,
                padding: '18px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: 'white',
                color: '#666',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              ← Go Back
            </button>
            <button
              onClick={onReady}
              disabled={!acknowledged}
              style={{
                flex: 2,
                padding: '18px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: acknowledged ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: acknowledged ? 'pointer' : 'not-allowed',
                boxShadow: acknowledged ? '0 4px 16px rgba(102, 126, 234, 0.4)' : 'none',
                transition: 'all 0.2s',
                transform: acknowledged ? 'translateY(0)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (acknowledged) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (acknowledged) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              I'm Ready - Let's Do This 🚀
            </button>
          </div>
        </div>

        {/* Bottom encouragement */}
        <div style={{
          textAlign: 'center',
          padding: '24px',
          color: '#999',
          fontSize: '14px',
          fontStyle: 'italic'
        }}>
          <p style={{ margin: 0 }}>
            Remember: courage isn't the absence of fear. It's taking action despite it.
          </p>
        </div>
      </div>
    </div>
  );
};
