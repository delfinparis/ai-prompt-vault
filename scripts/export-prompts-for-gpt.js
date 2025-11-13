// scripts/export-prompts-for-gpt.js
// Exports all prompts to JSON format for GPT knowledge base

const fs = require('fs');
const path = require('path');

// Read the TypeScript file as text and extract the prompts
const promptsFilePath = path.join(__dirname, '../src/prompts.ts');
const promptsContent = fs.readFileSync(promptsFilePath, 'utf8');

// Parse the module arrays from the TypeScript file
// This is a simple parser - assumes the format is consistent
const modules = [];
const moduleRegex = /const M\d+ = \[([\s\S]*?)\];/g;
let match;

while ((match = moduleRegex.exec(promptsContent)) !== null) {
  const moduleContent = match[1];
  // Extract individual prompt objects
  const promptRegex = /\{title:"([^"]+)"[^}]*quick:"([^"]*)"[^}]*role:"([^"]*)"[^}]*deliverable:"([^"]*)"[^}]*success:"([^"]*)"\}/g;
  const promptsInModule = [];
  let promptMatch;
  
  while ((promptMatch = promptRegex.exec(moduleContent)) !== null) {
    promptsInModule.push({
      title: promptMatch[1],
      quick: promptMatch[2],
      role: promptMatch[3],
      deliverable: promptMatch[4],
      success: promptMatch[5]
    });
  }
  
  modules.push(promptsInModule);
}

// Module metadata
const MODULE_NAMES = {
  1: "Marketing & Lead Generation",
  2: "Daily Systems & Productivity",
  3: "Goals & Accountability",
  4: "Listings & Buyer Presentations",
  5: "Client Service & Follow-Up",
  6: "Finance & Business Planning",
  7: "Negotiation & Deal Strategy",
  8: "Home Search & Market Intel",
  9: "Database & Referral Engine",
  10: "Tech, AI & Marketing Automation",
  11: "AI Workflows & Automation",
  12: "Learning & Industry Resources"
};

const MODULE_TAGS = {
  1: ["leads", "marketing", "content"],
  2: ["systems", "productivity", "workflow"],
  3: ["goals", "planning", "accountability"],
  4: ["listing", "buyer", "presentation"],
  5: ["client", "service", "followup"],
  6: ["finance", "profit", "budget"],
  7: ["negotiation", "deals", "strategy"],
  8: ["buyer", "search", "tools"],
  9: ["sphere", "community", "nurture"],
  10: ["marketing", "ads", "ai"],
  11: ["automation", "workflow", "tech"],
  12: ["learning", "research", "intel"]
};

// Build full prompt list
const allPrompts = modules.flatMap((modulePrompts, moduleIdx) => {
  const moduleName = MODULE_NAMES[moduleIdx + 1] || `Module ${moduleIdx + 1}`;
  const tags = MODULE_TAGS[moduleIdx + 1] || [];
  
  return modulePrompts.map((p, idx) => ({
    id: `${moduleName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx}`,
    title: p.title,
    category: moduleName,
    tags,
    role: p.role || "expert real estate coach",
    deliverable: p.deliverable || "",
    quick: p.quick || "",
    success: p.success || ""
  }));
});

// Create export object
const exportData = {
  version: "1.0",
  exported: new Date().toISOString(),
  totalPrompts: allPrompts.length,
  categories: Object.values(MODULE_NAMES),
  prompts: allPrompts,
  metadata: {
    description: "AI Prompt Vault for Real Estate - Complete prompt library for agents, brokers, and teams",
    usage: "Search by category, tags, or keywords. Personalize with your market, niche, and tools.",
    webApp: "https://ai-prompt-vault.vercel.app"
  }
};

// Write to file
const outputPath = path.join(__dirname, '../prompts-export.json');
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

console.log(`✅ Exported ${allPrompts.length} prompts to prompts-export.json`);
console.log(`📁 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
console.log(`📂 Location: ${outputPath}`);
console.log(`\n🚀 Ready to upload to GPT as knowledge file!`);
