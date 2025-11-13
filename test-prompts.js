const fs = require('fs');

// Read prompts.ts
const content = fs.readFileSync('src/prompts.ts', 'utf8');

// Extract the first 3 prompts from M1
const m1Match = content.match(/const M1 = \[([\s\S]*?)\];/);
if (!m1Match) {
  console.log('Could not find M1');
  process.exit(1);
}

const m1Content = m1Match[1];
const promptMatches = [...m1Content.matchAll(/\{title:"([^"]+)"[^}]+\}/g)];

console.log('Testing first 3 prompts from intro flow:\n');
console.log('='.repeat(80));

for (let i = 0; i < 3 && i < promptMatches.length; i++) {
  const promptBlock = promptMatches[i][0];
  const title = promptMatches[i][1];
  
  console.log(`\n\nPROMPT ${i + 1}: ${title}`);
  console.log('-'.repeat(80));
  
  // Extract quick field
  const quickMatch = promptBlock.match(/quick:"([^"]+)"/);
  const quick = quickMatch ? quickMatch[1] : '';
  
  // Default inputs that get added
  const defaultInputs = '- KPIs = [your specific goals - example: 50 leads/month, 15% conversion rate, $200 cost per lead]\n- Tools = [the actual tools you use - example: Follow Up Boss, Canva, Facebook Ads Manager]\n- Timeline/Budget = [X]\n- Constraints = [plain, compliant language]';
  
  // Combine to get all text that would be scanned
  const fullText = quick + '\n' + defaultInputs;
  
  // Extract placeholders
  const regex = /\[(.*?)\]/g;
  const placeholders = [];
  let match;
  while ((match = regex.exec(fullText)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1]);
    }
  }
  
  console.log(`\nTotal personalization steps: ${placeholders.length}\n`);
  
  // Show all steps
  for (let j = 0; j < placeholders.length; j++) {
    console.log(`Step ${j + 1}: [${placeholders[j]}]`);
  }
}
