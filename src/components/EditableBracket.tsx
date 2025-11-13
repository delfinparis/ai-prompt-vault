import React, { useState, useRef, useEffect } from 'react';
import { getPlaceholderHelp } from '../promptUtils';

interface EditableBracketProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  savedValues?: string[];
}

export const EditableBracket: React.FC<EditableBracketProps> = ({
  placeholder,
  value,
  onChange,
  savedValues = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const help = getPlaceholderHelp(placeholder);

  // Focus and select on edit
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    setShowSuggestions(false);
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsEditing(false);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      handleBlur();
    }
    // Tab to next bracket (allow default behavior)
  };

  const displayValue = value || placeholder;
  const isEmpty = !value;

  return (
    <span 
      ref={wrapperRef}
      className="editable-bracket-wrapper" 
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {!isEditing ? (
        <button
          className="editable-bracket"
          onClick={() => setIsEditing(true)}
          title={help.description}
          aria-label={`Edit ${placeholder}. ${help.description}`}
          style={{
            background: isEmpty ? '#fef3c7' : '#dbeafe',
            color: isEmpty ? '#92400e' : '#1e40af',
            border: `2px solid ${isEmpty ? '#fbbf24' : '#3b82f6'}`,
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'ui-monospace, monospace',
            transition: 'all 160ms ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isEmpty && <span style={{ fontSize: '11px', marginRight: '4px' }} aria-hidden="true">📝</span>}
          {displayValue}
        </button>
      ) : (
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={() => savedValues.length > 0 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={help.example}
            aria-label={`Enter ${placeholder}`}
            style={{
              minWidth: '120px',
              maxWidth: '300px',
              width: `${Math.max(120, (value.length + 5) * 8)}px`,
              border: '2px solid #3b82f6',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '14px',
              fontFamily: 'ui-monospace, monospace',
              outline: 'none',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
            }}
          />

          {/* Autocomplete suggestions */}
          {showSuggestions && savedValues.length > 0 && (
            <div
              role="listbox"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '200px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur
            >
              <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>
                Previously used:
              </div>
              {savedValues.slice(0, 5).map((suggestion, idx) => (
                <button
                  key={idx}
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelect(suggestion)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </span>
      )}
    </span>
  );
};
