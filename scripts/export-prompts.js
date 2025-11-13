#!/usr/bin/env node
/**
 * Export prompts from src/prompts.ts into prompts-export.json
 * Usage: npm run export:prompts
 *
 * This avoids manual drift between the code library and the GPT knowledge file.
 * It performs a lightweight static parse (regex) of each module array (M1..M12)
 * extracting: title, quick, role, deliverable, success. If a field is missing it is skipped.
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(process.cwd(), 'src', 'prompts.ts');
const DEST = path.join(process.cwd(), 'prompts-export.json');

const CATEGORY_MAP = {
  1: 'Marketing & Lead Generation',
  2: 'Daily Systems & Productivity',
  3: 'Goals & Accountability',
  4: 'Listings & Buyer Presentations',
  5: 'Client Service & Follow-Up',
  6: 'Finance & Business Planning',
  7: 'Negotiation & Deal Strategy',
  8: 'Home Search & Market Intel',
  9: 'Database & Referral Engine',
 10: 'Tech, AI & Marketing Automation',
 11: 'AI Workflows & Automation',
 12: 'Learning & Industry Resources'
};

function readSource() {
  return fs.readFileSync(SOURCE, 'utf8');
}

// Rough module splitter: const M# = [ ... ]; capturing content inside brackets.
function extractModuleBlocks(source) {
  const moduleBlocks = [];
  const regex = /const\s+M(\d+)\s*=\s*\[(.*?)\];/gs; // dotAll
  let match;
  while ((match = regex.exec(source)) !== null) {
    moduleBlocks.push({ moduleIndex: parseInt(match[1], 10), body: match[2] });
  }
  return moduleBlocks;
}

// Extract prompt objects inside a module body. Assumes objects start with {title:"..."
function extractPromptObjects(blockBody) {
  const prompts = [];
  // Split on '},' boundaries while keeping braces content.
  const rawObjects = blockBody.split(/},/).map(chunk => chunk.trim()).filter(Boolean);
  rawObjects.forEach(raw => {
    // Ensure ends with '}' for regex parsing
    if (!raw.endsWith('}')) raw = raw + '}';
    // Title mandatory
    const titleMatch = raw.match(/title:\s*"([^"]+)"/);
    if (!titleMatch) return;
    const quickMatch = raw.match(/quick:\s*"([\s\S]*?)"/);
    const roleMatch = raw.match(/role:\s*"([^"]+)"/);
    const deliverableMatch = raw.match(/deliverable:\s*"([\s\S]*?)"/);
    const successMatch = raw.match(/success:\s*"([\s\S]*?)"/);

    const prompt = {
      title: titleMatch[1],
    };
    if (quickMatch) prompt.quick = quickMatch[1];
    if (roleMatch) prompt.role = roleMatch[1];
    if (deliverableMatch) prompt.deliverable = deliverableMatch[1];
    if (successMatch) prompt.success = successMatch[1];
    prompts.push(prompt);
  });
  return prompts;
}

function buildExport() {
  const source = readSource();
  const blocks = extractModuleBlocks(source);
  const exportPrompts = [];

  blocks.forEach(({ moduleIndex, body }) => {
    const category = CATEGORY_MAP[moduleIndex] || `Module ${moduleIndex}`;
    const items = extractPromptObjects(body);
    items.forEach((p, idx) => {
      exportPrompts.push({
        id: `${category.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${idx}`,
        title: p.title,
        category,
        role: p.role || '',
        deliverable: p.deliverable || '',
        quick: p.quick || '',
        success: p.success || ''
      });
    });
  });

  const payload = {
    version: 'auto',
    exported: new Date().toISOString(),
    totalPrompts: exportPrompts.length,
    categories: Object.values(CATEGORY_MAP),
    prompts: exportPrompts,
    metadata: {
      description: 'AI Prompt Vault for Real Estate - Auto-exported prompt library',
      usage: 'Search by category, personalize with your market, niche, tools.',
      webApp: 'https://ai-prompt-vault.vercel.app'
    }
  };
  return payload;
}

function main() {
  try {
    const payload = buildExport();
    fs.writeFileSync(DEST, JSON.stringify(payload, null, 2));
    console.log(`✅ Exported ${payload.totalPrompts} prompts to ${DEST}`);
  } catch (err) {
    console.error('❌ Export failed:', err);
    process.exit(1);
  }
}

main();
