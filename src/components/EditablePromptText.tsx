import React from 'react';
import { EditableBracket } from './EditableBracket';

interface EditablePromptTextProps {
  text: string;
  fieldValues: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  savedFieldHistory?: Record<string, string[]>;
}

export const EditablePromptText: React.FC<EditablePromptTextProps> = ({
  text,
  fieldValues,
  onFieldChange,
  savedFieldHistory = {}
}) => {
  // Parse text and find all [placeholders]
  const parts: Array<{ type: 'text' | 'bracket'; content: string }> = [];
  let lastIndex = 0;
  const bracketRegex = /\[([^\]]+)\]/g;
  let match;

  while ((match = bracketRegex.exec(text)) !== null) {
    // Add text before bracket
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // Add bracket
    parts.push({
      type: 'bracket',
      content: match[1]
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return (
    <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <span key={idx}>{part.content}</span>;
        } else {
          const placeholder = part.content;
          return (
            <EditableBracket
              key={idx}
              placeholder={placeholder}
              value={fieldValues[placeholder] || ''}
              onChange={(value) => onFieldChange(placeholder, value)}
              savedValues={savedFieldHistory[placeholder] || []}
            />
          );
        }
      })}
    </div>
  );
};
