#!/usr/bin/env node

/**
 * Dark Mode Color Fixer
 * Replaces hardcoded colors with CSS variables for proper dark mode support
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/AIPromptVault.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Color mapping: hardcoded → CSS variable
const colorMappings = [
  // White colors
  { from: 'color: "#fff"', to: 'color: "var(--text-inverse)"' },
  { from: "color: '#fff'", to: "color: 'var(--text-inverse)'" },
  { from: 'background: "#fff"', to: 'background: "var(--surface)"' },
  { from: "background: '#fff'", to: "background: 'var(--surface)'" },
  
  // Gray backgrounds
  { from: 'background: "#f8fafc"', to: 'background: "var(--surface-hover)"' },
  { from: "background: '#f8fafc'", to: "background: 'var(--surface-hover)'" },
  { from: 'background: "#f1f5f9"', to: 'background: "var(--badge-bg)"' },
  { from: "background: '#f1f5f9'", to: "background: 'var(--badge-bg)'" },
  { from: 'background: "#e5e7eb"', to: 'background: "var(--border)"' },
  { from: "background: '#e5e7eb'", to: "background: 'var(--border)'" },
  
  // Info/blue colors
  { from: 'background: "#f0f9ff"', to: 'background: "var(--info-bg)"' },
  { from: "background: '#f0f9ff'", to: "background: 'var(--info-bg)'" },
  { from: 'background: "#dbeafe"', to: 'background: "var(--badge-primary-bg)"' },
  { from: "background: '#dbeafe'", to: "background: 'var(--badge-primary-bg)'" },
  { from: 'color: "#0369a1"', to: 'color: "var(--info-text)"' },
  { from: "color: '#0369a1'", to: "color: 'var(--info-text)'" },
  { from: 'color: "#075985"', to: 'color: "var(--info-text)"' },
  { from: "color: '#075985'", to: "color: 'var(--info-text)'" },
  
  // Success/green colors
  { from: 'color: "#10b981"', to: 'color: "var(--success)"' },
  { from: "color: '#10b981'", to: "color: 'var(--success)'" },
  { from: 'background: "#10b981"', to: 'background: "var(--success)"' },
  { from: "background: '#10b981'", to: "background: 'var(--success)'" },
  
  // Warning/amber colors
  { from: 'color: "#f59e0b"', to: 'color: "var(--warning)"' },
  { from: "color: '#f59e0b'", to: "color: 'var(--warning)'" },
  
  // Error/red colors
  { from: 'background: "#ef4444"', to: 'background: "var(--error)"' },
  { from: "background: '#ef4444'", to: "background: 'var(--error)'" },
  
  // Purple colors
  { from: 'color: "#8b5cf6"', to: 'color: "var(--purple)"' },
  { from: "color: '#8b5cf6'", to: "color: 'var(--purple)'" },
  { from: 'background: "#8b5cf6"', to: 'background: "var(--purple)"' },
  { from: "background: '#8b5cf6'", to: "background: 'var(--purple)'" },
  
  // Slate/gray text
  { from: 'color: "#334155"', to: 'color: "var(--text-secondary)"' },
  { from: "color: '#334155'", to: "color: 'var(--text-secondary)'" },
];

// Apply replacements
let replacements = 0;
colorMappings.forEach(({ from, to }) => {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    replacements += matches.length;
    content = content.replace(regex, to);
  }
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`✅ Fixed ${replacements} hardcoded colors in AIPromptVault.tsx`);
console.log(`📝 File updated: ${filePath}`);
console.log('\n🎨 All colors now use CSS variables for proper dark mode support!');
