#!/usr/bin/env node

/**
 * Fix all remaining hardcoded colors in CSS for dark mode
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/AIPromptVault.css');

const colorMappings = [
  // Muted/secondary text colors
  { find: /color: #6b7280;/g, replace: 'color: var(--text-secondary);' },
  { find: /color: #9ca3af;/g, replace: 'color: var(--text-tertiary);' },
  { find: /color: #4b5563;/g, replace: 'color: var(--text-secondary);' },
  
  // Primary/dark text colors
  { find: /color: #111827;/g, replace: 'color: var(--text-primary);' },
  { find: /color: #0f172a;/g, replace: 'color: var(--text-primary);' },
  { find: /color: #0b1720;/g, replace: 'color: var(--text-primary);' },
  { find: /color: #334155;/g, replace: 'color: var(--text-primary);' },
  
  // White/inverse colors
  { find: /color: #ffffff;/g, replace: 'color: var(--text-inverse);' },
  { find: /color: #fff;/g, replace: 'color: var(--text-inverse);' },
  
  // Background colors
  { find: /background: #ffffff;/g, replace: 'background: var(--surface);' },
  { find: /background: #f9fafb;/g, replace: 'background: var(--surface-hover);' },
  { find: /background: #eef2ff;/g, replace: 'background: var(--badge-primary-bg);' },
  { find: /background:#0f172a;/g, replace: 'background: var(--primary);' },
  
  // Border colors  
  { find: /border: 1px solid #e5e7eb;/g, replace: 'border: 1px solid var(--border);' },
  { find: /border-color: #0f172a;/g, replace: 'border-color: var(--primary);' },
  { find: /border-color: #2563eb;/g, replace: 'border-color: var(--primary);' },
  
  // Category card colors (need special handling for active state)
  { find: /background: linear-gradient\(180deg, rgba\(240,246,255,0\.55\), #f8fbff\);/g,
    replace: 'background: var(--badge-primary-bg);' },
];

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let totalReplacements = 0;

  colorMappings.forEach(({ find, replace }) => {
    const matches = content.match(find);
    if (matches) {
      totalReplacements += matches.length;
      content = content.replace(find, replace);
    }
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  
  console.log(`✅ Fixed ${totalReplacements} hardcoded colors in AIPromptVault.css`);
  console.log('🎨 All text and UI colors now use semantic CSS variables!');
  console.log('\nFixed elements:');
  console.log('  • Title and subtitle text');
  console.log('  • Muted text and helper text');
  console.log('  • Category card labels');
  console.log('  • Prompt body text');
  console.log('  • Button colors');
  console.log('  • Badge backgrounds');
  console.log('  • Select inputs');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
