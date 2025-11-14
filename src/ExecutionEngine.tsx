import React, { useState } from 'react';
import { Activity, UserProfile, ContentType } from './activities';

interface ExecutionEngineProps {
  activity: Activity;
  profile: UserProfile;
  onComplete: (generatedContent?: string, notes?: string) => void;
  onBack: () => void;
}

export const ExecutionEngine: React.FC<ExecutionEngineProps> = ({
  activity,
  profile,
  onComplete,
  onBack
}) => {
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [metadata, setMetadata] = useState<any>({});
  const [error, setError] = useState('');
  const [inputs, setInputs] = useState<Record<string, string>>({
    market: profile.market,
    targetAudience: 'past clients and leads',
    tone: 'professional',
    length: 'medium'
  });
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const getContentTypeForActivity = (): ContentType | null => {
    const mapping: Record<string, ContentType> = {
      'prospecting': 'prospecting-script',
      'past-client-followup': 'follow-up-email',
      'lead-response': 'follow-up-email',
      'social-media': 'social-post',
      'newsletter': 'newsletter',
      'open-houses': 'open-house-plan',
      'ask-referrals': 'referral-request',
      'skills-training': 'prospecting-script'
    };
    return mapping[activity.id] || null;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setGeneratedContent('');
    
    try {
      const contentType = getContentTypeForActivity();
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          inputs,
          userId: profile.email || 'anonymous'
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      setGeneratedContent(data.output);
      setMetadata(data.metadata || {});
    } catch (err: any) {
      setError(err.message || 'Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkComplete = () => {
    onComplete(generatedContent, notes);
  };

  const renderInputForm = () => {
    const contentType = getContentTypeForActivity();

    return (
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a1a' }}>
          Customize Your Content
        </h3>

        {(contentType === 'newsletter' || contentType === 'social-post' || contentType === 'follow-up-email') && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
              Topic or Focus
            </label>
            <input
              type="text"
              value={inputs.topic || ''}
              onChange={(e) => setInputs({ ...inputs, topic: e.target.value })}
              placeholder="e.g., Rising inventory, First-time buyer tips, Market update"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
        )}

        {contentType === 'prospecting-script' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
              Script Type
            </label>
            <select
              value={inputs.topic || 'FSBO'}
              onChange={(e) => setInputs({ ...inputs, topic: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="cold calling FSBOs">FSBO (For Sale By Owner)</option>
              <option value="expired listings">Expired Listings</option>
              <option value="circle prospecting">Circle Prospecting</option>
              <option value="past client check-in">Past Client Check-In</option>
              <option value="sphere of influence">Sphere of Influence</option>
            </select>
          </div>
        )}

        {contentType === 'social-post' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
              Listing Address (optional)
            </label>
            <input
              type="text"
              value={inputs.listingAddress || ''}
              onChange={(e) => setInputs({ ...inputs, listingAddress: e.target.value })}
              placeholder="e.g., 123 Main St - leave blank for general post"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
        )}

        {(contentType === 'referral-request' || contentType === 'follow-up-email') && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
              Client/Contact Name (optional)
            </label>
            <input
              type="text"
              value={inputs.clientName || ''}
              onChange={(e) => setInputs({ ...inputs, clientName: e.target.value })}
              placeholder="e.g., Sarah Johnson"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
              Tone
            </label>
            <select
              value={inputs.tone}
              onChange={(e) => setInputs({ ...inputs, tone: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
              Length
            </label>
            <select
              value={inputs.length}
              onChange={(e) => setInputs({ ...inputs, length: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderGeneratedContent = () => {
    if (!generatedContent) return null;

    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>
            Your Generated Content
          </h3>
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              background: copied ? '#4CAF50' : 'white',
              color: copied ? 'white' : '#667eea',
              border: `2px solid ${copied ? '#4CAF50' : '#667eea'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>

        {metadata.subject && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#FFF3E0', borderRadius: '8px' }}>
            <strong style={{ fontSize: '14px', color: '#E65100' }}>Subject Line:</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#333' }}>{metadata.subject}</p>
          </div>
        )}

        <div style={{
          background: 'white',
          border: '2px solid #e0e0e0',
          borderRadius: '12px',
          padding: '20px',
          whiteSpace: 'pre-wrap',
          fontSize: '14px',
          lineHeight: '1.8',
          color: '#333',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {generatedContent}
        </div>

        {metadata.hashtags && metadata.hashtags.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#E8F5E9', borderRadius: '8px' }}>
            <strong style={{ fontSize: '14px', color: '#2E7D32' }}>Hashtags:</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#333' }}>
              {metadata.hashtags.join(' ')}
            </p>
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this activity..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              outline: 'none',
              minHeight: '80px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
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
              marginBottom: '16px'
            }}
          >
            ← Back to Dashboard
          </button>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                {activity.aiCanHelp ? '✨' : '📋'}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a' }}>
                  {activity.title}
                </h1>
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
                  {activity.description}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '13px',
                    color: '#888',
                    background: '#f5f5f5',
                    padding: '6px 12px',
                    borderRadius: '6px'
                  }}>
                    📅 {activity.frequency}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    color: '#888',
                    background: '#f5f5f5',
                    padding: '6px 12px',
                    borderRadius: '6px'
                  }}>
                    ⏱️ {activity.timeEstimate}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#FF6B6B',
                    background: '#FFE8E8',
                    padding: '6px 12px',
                    borderRadius: '6px'
                  }}>
                    ⭐ Impact: {activity.impactScore}/10
                  </span>
                </div>
              </div>
            </div>

            {activity.aiCanHelp && !generatedContent && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '2px solid #667eea',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🚀</span>
                  <p style={{ margin: 0, fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
                    <strong>AI can help!</strong> Fill out a few details below and I'll generate {
                      getContentTypeForActivity() === 'newsletter' ? 'a newsletter' :
                      getContentTypeForActivity() === 'social-post' ? 'a social post' :
                      getContentTypeForActivity() === 'prospecting-script' ? 'a script' :
                      getContentTypeForActivity() === 'follow-up-email' ? 'an email' :
                      getContentTypeForActivity() === 'referral-request' ? 'a referral request' :
                      'content'
                    } for you in seconds.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          {activity.aiCanHelp && !generatedContent && renderInputForm()}

          {error && (
            <div style={{
              background: '#FFEBEE',
              border: '2px solid #F44336',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              color: '#C62828'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {generatedContent && renderGeneratedContent()}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            {!generatedContent && activity.aiCanHelp && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  flex: 1,
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: generating ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  boxShadow: generating ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {generating ? '✨ Generating...' : '✨ Generate with AI'}
              </button>
            )}

            {generatedContent && (
              <>
                <button
                  onClick={() => {
                    setGeneratedContent('');
                    setMetadata({});
                    setError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: 'white',
                    color: '#666',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Generate Again
                </button>

                <button
                  onClick={handleMarkComplete}
                  style={{
                    flex: 2,
                    padding: '16px',
                    fontSize: '16px',
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
                  ✅ Mark Complete & Continue
                </button>
              </>
            )}

            {!activity.aiCanHelp && (
              <button
                onClick={() => onComplete(undefined, notes)}
                style={{
                  flex: 1,
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                }}
              >
                ✅ Mark as Complete
              </button>
            )}
          </div>

          {/* Tips Section */}
          {!generatedContent && (
            <div style={{
              marginTop: '32px',
              padding: '20px',
              background: '#F5F5F5',
              borderRadius: '12px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#1a1a1a' }}>
                💡 Success Tips for {activity.title}
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
                <li>Set a specific time block in your calendar</li>
                <li>Remove distractions before you start</li>
                <li>Focus on progress, not perfection</li>
                <li>{activity.frequency === 'Daily' ? 'Do it at the same time each day to build a habit' : 'Block out dedicated time on your calendar'}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
