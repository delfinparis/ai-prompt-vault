import React, { useState } from 'react';
import { AgentProfile } from '../hooks/useAgentProfile';

interface AgentProfileSetupProps {
  onComplete: (profile: Partial<AgentProfile>) => void;
  onSkip: () => void;
}

const COMMON_MARKETS = [
  'Austin, TX', 'Phoenix, AZ', 'Miami, FL', 'Denver, CO',
  'Nashville, TN', 'Charlotte, NC', 'Raleigh, NC', 'Atlanta, GA',
  'Tampa, FL', 'Dallas, TX', 'Houston, TX', 'San Diego, CA'
];

const COMMON_NICHES = [
  'First-time buyers', 'Luxury homes', 'Investment properties',
  'Downsizers', 'Military families', 'Relocating executives',
  'New construction', 'Fix-and-flip investors'
];

const COMMON_CHANNELS = [
  'Facebook Ads', 'Instagram', 'YouTube', 'TikTok',
  'Google Ads', 'Email marketing', 'Direct mail',
  'Door knocking', 'Cold calling', 'Open houses'
];

export const AgentProfileSetup: React.FC<AgentProfileSetupProps> = ({
  onComplete,
  onSkip
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [market, setMarket] = useState('');
  const [niche, setNiche] = useState('');
  const [channels, setChannels] = useState<string[]>([]);

  const handleComplete = () => {
    onComplete({
      name,
      market,
      niche,
      channels,
      setupComplete: true
    });
  };

  const toggleChannel = (channel: string) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter(c => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const canProceed = () => {
    if (step === 1) return name.trim() && market.trim();
    if (step === 2) return niche.trim();
    if (step === 3) return channels.length > 0;
    return false;
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          maxWidth: 560,
          width: '100%',
          padding: '32px 24px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>
            Welcome to AI Prompt Vault!
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            30-second setup to personalize your experience
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                background: s <= step ? 'var(--primary)' : 'var(--border)',
                borderRadius: 999,
                transition: 'background 300ms'
              }}
            />
          ))}
        </div>

        {/* Step 1: Name & Market */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
              Tell us about yourself
            </h3>

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>
                Your name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Johnson"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 200ms',
                  background: 'var(--input-bg)',
                  color: 'var(--text)',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-secondary)' }}>
                Your market
              </span>
              <input
                type="text"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                placeholder="Austin, TX"
                list="markets"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 200ms',
                  background: 'var(--input-bg)',
                  color: 'var(--text)',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <datalist id="markets">
                {COMMON_MARKETS.map(m => <option key={m} value={m} />)}
              </datalist>
            </label>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', width: '100%', marginBottom: 4 }}>Popular markets:</span>
              {COMMON_MARKETS.slice(0, 6).map(m => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  type="button"
                  style={{
                    padding: '6px 10px',
                    background: market === m ? 'var(--primary-bg)' : 'var(--surface-hover)',
                    border: market === m ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 160ms',
                    color: market === m ? 'var(--primary)' : 'var(--text)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Niche */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
              Who do you help?
            </h3>

            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Pick your primary niche (you can change this later):
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {COMMON_NICHES.map(n => (
                <button
                  key={n}
                  onClick={() => setNiche(n)}
                  type="button"
                  style={{
                    padding: '12px 16px',
                    background: niche === n ? 'var(--primary)' : 'var(--surface-hover)',
                    border: niche === n ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: niche === n ? 600 : 400,
                    color: niche === n ? 'var(--text-inverse)' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 160ms',
                    textAlign: 'left',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>
                  Or enter your own:
                </span>
                <input
                  type="text"
                  value={!COMMON_NICHES.includes(niche) ? niche : ''}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., Waterfront properties"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 14,
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Channels */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
              How do you generate leads?
            </h3>

            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Select all that apply:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {COMMON_CHANNELS.map(c => (
                <button
                  key={c}
                  onClick={() => toggleChannel(c)}
                  type="button"
                  style={{
                    padding: '10px 14px',
                    background: channels.includes(c) ? 'var(--primary)' : 'var(--surface-hover)',
                    border: channels.includes(c) ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: channels.includes(c) ? 600 : 400,
                    color: channels.includes(c) ? 'var(--text-inverse)' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 160ms',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {channels.includes(c) && <span>✓</span>}
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              type="button"
              style={{
                padding: '12px 20px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              type="button"
              style={{
                flex: 1,
                padding: '12px 20px',
                background: canProceed() ? 'var(--primary)' : 'var(--border)',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-inverse)',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                transition: 'all 160ms',
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              type="button"
              style={{
                flex: 1,
                padding: '12px 20px',
                background: canProceed() ? 'var(--primary)' : 'var(--border)',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-inverse)',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                transition: 'all 160ms',
              }}
            >
              Complete Setup
            </button>
          )}

          <button
            onClick={onSkip}
            type="button"
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              fontSize: 13,
              color: 'var(--muted)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
