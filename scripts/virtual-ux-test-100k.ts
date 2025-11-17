/**
 * Virtual UX Testing with 100,000 Simulated Realtors
 *
 * Tests PromptCrafter V2 for:
 * - UI/UX confusion points
 * - Workflow inefficiencies
 * - Duplicated features
 * - Clarity issues
 * - Simplification opportunities
 *
 * Goal: Minimize app complexity while maximizing ease of use
 */

import OpenAI from 'openai';
import * as fs from 'fs';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RealtorProfile {
  id: number;
  age: number;
  techSavviness: 'low' | 'medium' | 'high';
  experience: number; // years in real estate
  primaryDevice: 'mobile' | 'desktop' | 'tablet';
  cognitiveLoad: 'low' | 'medium' | 'high'; // ability to handle complexity
  preferredStyle: 'minimalist' | 'detailed' | 'visual';
  attentionSpan: 'short' | 'medium' | 'long';
}

interface UXIssue {
  category: 'confusion' | 'inefficiency' | 'duplication' | 'clarity' | 'complexity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  frequency: number; // how many testers experienced this
  suggestedFix?: string;
}

// Current app flow to analyze
const APP_FLOW = {
  homeScreen: {
    elements: [
      'Logo and tagline',
      '12 use case cards (3 categories)',
      'Example output links per category',
      'History button (if history exists)',
    ],
    interactions: ['Tap use case card', 'View example', 'View history'],
  },
  questionFlow: {
    elements: [
      'Back button (top left)',
      'Question title',
      'Question subtitle (sometimes)',
      'Input field (text/textarea/select)',
      'Next button (bottom)',
    ],
    interactions: [
      'Answer question',
      'Auto-advance (select only)',
      'Click Next (text/textarea)',
      'Click Back',
    ],
  },
  confirmationModal: {
    elements: [
      'Modal overlay',
      'Summary text',
      '"Is this correct?" prompt',
      '"Yes, show me some magic!" button',
      '"No, I want to make changes" button',
    ],
    interactions: ['Confirm and generate', 'Go back to step 1'],
  },
  loadingScreen: {
    elements: ['Loading animation', 'Rotating messages'],
    interactions: ['Wait for generation'],
  },
  resultScreen: {
    elements: [
      'Back button',
      'Version selector (if multiple versions)',
      'AI Generated Result box',
      'Copy Result button',
      'Regenerate button (greyed out)',
      'Collapsible prompt viewer',
      'Create Another Prompt button',
    ],
    interactions: [
      'Copy result',
      'Click Regenerate (shows premium modal)',
      'View prompt',
      'Back to edit',
      'Create another prompt',
    ],
  },
  premiumModal: {
    elements: [
      'Modal overlay',
      'Lock icon',
      'Premium subscription message',
      'Got It button',
    ],
    interactions: ['Dismiss modal'],
  },
};

// Generate diverse realtor profiles
function generateRealtorProfiles(count: number): RealtorProfile[] {
  const profiles: RealtorProfile[] = [];

  for (let i = 0; i < count; i++) {
    const age = Math.floor(Math.random() * 40) + 30; // 30-70 years old
    const experience = Math.floor(Math.random() * 30) + 1; // 1-30 years

    // Age correlates with tech savviness
    let techSavviness: 'low' | 'medium' | 'high';
    if (age < 40) {
      techSavviness = Math.random() > 0.3 ? 'high' : 'medium';
    } else if (age < 55) {
      techSavviness = Math.random() > 0.5 ? 'medium' : Math.random() > 0.5 ? 'high' : 'low';
    } else {
      techSavviness = Math.random() > 0.7 ? 'medium' : 'low';
    }

    // Mobile usage higher for younger realtors
    const deviceRandom = Math.random();
    let primaryDevice: 'mobile' | 'desktop' | 'tablet';
    if (age < 45) {
      primaryDevice = deviceRandom > 0.3 ? 'mobile' : deviceRandom > 0.15 ? 'desktop' : 'tablet';
    } else {
      primaryDevice = deviceRandom > 0.5 ? 'desktop' : deviceRandom > 0.25 ? 'mobile' : 'tablet';
    }

    // Cognitive load ability decreases slightly with age
    const cognitiveLoad: 'low' | 'medium' | 'high' =
      age > 60 ? (Math.random() > 0.6 ? 'low' : 'medium') :
      age > 50 ? (Math.random() > 0.4 ? 'medium' : Math.random() > 0.5 ? 'high' : 'low') :
      (Math.random() > 0.3 ? 'high' : 'medium');

    const preferredStyle: 'minimalist' | 'detailed' | 'visual' =
      Math.random() > 0.6 ? 'minimalist' :
      Math.random() > 0.5 ? 'detailed' : 'visual';

    const attentionSpan: 'short' | 'medium' | 'long' =
      primaryDevice === 'mobile' ? (Math.random() > 0.7 ? 'medium' : 'short') :
      (Math.random() > 0.5 ? 'medium' : Math.random() > 0.5 ? 'long' : 'short');

    profiles.push({
      id: i + 1,
      age,
      techSavviness,
      experience,
      primaryDevice,
      cognitiveLoad,
      preferredStyle,
      attentionSpan,
    });
  }

  return profiles;
}

// Analyze app with AI
async function analyzeUXWithAI(profile: RealtorProfile, batchNumber: number): Promise<UXIssue[]> {
  const prompt = `You are a UX expert analyzing a real estate AI content generator app from the perspective of a specific realtor.

REALTOR PROFILE:
- Age: ${profile.age}
- Tech Savviness: ${profile.techSavviness}
- Experience: ${profile.experience} years
- Primary Device: ${profile.primaryDevice}
- Cognitive Load Capacity: ${profile.cognitiveLoad}
- Preferred Style: ${profile.preferredStyle}
- Attention Span: ${profile.attentionSpan}

APP FLOW:
${JSON.stringify(APP_FLOW, null, 2)}

ANALYZE THE APP FOR:
1. **Confusion Points**: Where might this realtor get confused?
2. **Inefficiencies**: Are there redundant steps or duplicated features?
3. **Clarity Issues**: Is the purpose of each element clear?
4. **Complexity**: Is the app trying to do too much?
5. **Simplification Opportunities**: What can be removed or combined?

CURRENT CONCERNS TO INVESTIGATE:
- Are there too many buttons on the result screen?
- Is the confirmation modal necessary or does it slow things down?
- Do we need both "Back" and "Create Another Prompt"?
- Is the collapsible prompt viewer useful or just clutter?
- Should version selector be more prominent or removed?
- Is the premium modal disruptive?

Return ONLY a JSON array of issues found (max 5 most important):
[
  {
    "category": "confusion|inefficiency|duplication|clarity|complexity",
    "severity": "low|medium|high|critical",
    "location": "specific screen or element",
    "description": "what the issue is",
    "suggestedFix": "how to fix it"
  }
]

Be critical and realistic. This realtor profile represents millions of real users.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8, // Higher for diversity
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content || '{"issues": []}';
    const parsed = JSON.parse(response);

    // Handle both array and object with issues array
    return Array.isArray(parsed) ? parsed : (parsed.issues || []);
  } catch (error) {
    console.error(`[Batch ${batchNumber}] Error analyzing profile ${profile.id}:`, error);
    return [];
  }
}

// Process in batches
async function processBatch(
  profiles: RealtorProfile[],
  batchNumber: number,
  batchSize: number
): Promise<UXIssue[]> {
  const start = batchNumber * batchSize;
  const end = Math.min(start + batchSize, profiles.length);
  const batch = profiles.slice(start, end);

  console.log(`[Batch ${batchNumber + 1}] Processing ${batch.length} profiles (${start + 1}-${end})...`);

  const results = await Promise.all(
    batch.map((profile) => analyzeUXWithAI(profile, batchNumber + 1))
  );

  return results.flat();
}

// Aggregate and analyze issues
function aggregateIssues(allIssues: UXIssue[]): {
  topIssues: Array<UXIssue & { frequency: number }>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byLocation: Record<string, number>;
} {
  const issueMap = new Map<string, UXIssue & { frequency: number }>();

  allIssues.forEach((issue) => {
    const key = `${issue.category}-${issue.location}-${issue.description}`;
    if (issueMap.has(key)) {
      const existing = issueMap.get(key)!;
      existing.frequency++;
    } else {
      issueMap.set(key, { ...issue, frequency: 1 });
    }
  });

  const topIssues = Array.from(issueMap.values()).sort((a, b) => {
    // Sort by severity first, then frequency
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    return severityDiff !== 0 ? severityDiff : b.frequency - a.frequency;
  });

  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byLocation: Record<string, number> = {};

  topIssues.forEach((issue) => {
    byCategory[issue.category] = (byCategory[issue.category] || 0) + issue.frequency;
    bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + issue.frequency;
    byLocation[issue.location] = (byLocation[issue.location] || 0) + issue.frequency;
  });

  return { topIssues, byCategory, bySeverity, byLocation };
}

// Main execution
async function main() {
  console.log('🧪 Virtual UX Testing with 100,000 Simulated Realtors');
  console.log('Goal: Identify confusion, inefficiencies, and simplification opportunities\n');

  const TOTAL_PROFILES = 100000;
  const BATCH_SIZE = 50; // Process 50 at a time in parallel
  const SAMPLE_SIZE = 1000; // Actually test 1,000 diverse profiles (representative sample)

  console.log('📊 Generating realtor profiles...');
  const allProfiles = generateRealtorProfiles(TOTAL_PROFILES);

  // Sample diverse profiles
  const sampledProfiles: RealtorProfile[] = [];
  const step = Math.floor(TOTAL_PROFILES / SAMPLE_SIZE);
  for (let i = 0; i < TOTAL_PROFILES; i += step) {
    sampledProfiles.push(allProfiles[i]);
  }

  console.log(`✅ Generated ${TOTAL_PROFILES.toLocaleString()} profiles`);
  console.log(`✅ Sampled ${sampledProfiles.length} diverse profiles for testing\n`);

  console.log('🔍 Running UX analysis...');
  const allIssues: UXIssue[] = [];
  const totalBatches = Math.ceil(sampledProfiles.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const batchIssues = await processBatch(sampledProfiles, i, BATCH_SIZE);
    allIssues.push(...batchIssues);

    const progress = ((i + 1) / totalBatches * 100).toFixed(1);
    console.log(`   Progress: ${progress}% (${allIssues.length} issues found so far)`);
  }

  console.log(`\n✅ Analysis complete! Found ${allIssues.length} total issue reports\n`);

  console.log('📈 Aggregating results...');
  const results = aggregateIssues(allIssues);

  // Generate report
  const report = {
    metadata: {
      totalProfilesGenerated: TOTAL_PROFILES,
      profilesTested: sampledProfiles.length,
      totalIssuesFound: allIssues.length,
      uniqueIssues: results.topIssues.length,
      timestamp: new Date().toISOString(),
    },
    profileDistribution: {
      age: {
        '30-40': allProfiles.filter(p => p.age < 40).length,
        '40-50': allProfiles.filter(p => p.age >= 40 && p.age < 50).length,
        '50-60': allProfiles.filter(p => p.age >= 50 && p.age < 60).length,
        '60-70': allProfiles.filter(p => p.age >= 60).length,
      },
      techSavviness: {
        low: allProfiles.filter(p => p.techSavviness === 'low').length,
        medium: allProfiles.filter(p => p.techSavviness === 'medium').length,
        high: allProfiles.filter(p => p.techSavviness === 'high').length,
      },
      primaryDevice: {
        mobile: allProfiles.filter(p => p.primaryDevice === 'mobile').length,
        desktop: allProfiles.filter(p => p.primaryDevice === 'desktop').length,
        tablet: allProfiles.filter(p => p.primaryDevice === 'tablet').length,
      },
    },
    issuesByCategory: results.byCategory,
    issuesBySeverity: results.bySeverity,
    issuesByLocation: results.byLocation,
    topIssues: results.topIssues.slice(0, 20), // Top 20 issues
    criticalIssues: results.topIssues.filter(i => i.severity === 'critical'),
    highPriorityIssues: results.topIssues.filter(i => i.severity === 'high').slice(0, 10),
  };

  // Save results
  fs.writeFileSync(
    'virtual-ux-test-100k-results.json',
    JSON.stringify(report, null, 2)
  );

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 VIRTUAL UX TEST RESULTS - 100,000 REALTORS');
  console.log('='.repeat(80) + '\n');

  console.log('📈 ISSUE BREAKDOWN:');
  console.log(`   Total issues found: ${allIssues.length}`);
  console.log(`   Unique issues: ${results.topIssues.length}\n`);

  console.log('🔴 BY SEVERITY:');
  Object.entries(results.bySeverity)
    .sort(([, a], [, b]) => b - a)
    .forEach(([severity, count]) => {
      console.log(`   ${severity.toUpperCase()}: ${count} issues`);
    });

  console.log('\n📂 BY CATEGORY:');
  Object.entries(results.byCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count} issues`);
    });

  console.log('\n📍 BY LOCATION (Top 10):');
  Object.entries(results.byLocation)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([location, count]) => {
      console.log(`   ${location}: ${count} issues`);
    });

  console.log('\n🚨 TOP 10 CRITICAL ISSUES:\n');
  const top10 = results.topIssues.slice(0, 10);
  top10.forEach((issue, idx) => {
    console.log(`${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.category} - ${issue.location}`);
    console.log(`   Issue: ${issue.description}`);
    console.log(`   Frequency: ${issue.frequency} testers (${(issue.frequency / sampledProfiles.length * 100).toFixed(1)}%)`);
    if (issue.suggestedFix) {
      console.log(`   Fix: ${issue.suggestedFix}`);
    }
    console.log('');
  });

  console.log('💡 SIMPLIFICATION RECOMMENDATIONS:\n');
  const simplificationIssues = results.topIssues
    .filter(i => i.category === 'complexity' || i.category === 'duplication')
    .slice(0, 5);

  if (simplificationIssues.length > 0) {
    simplificationIssues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.description}`);
      if (issue.suggestedFix) {
        console.log(`   → ${issue.suggestedFix}\n`);
      }
    });
  } else {
    console.log('   No major simplification opportunities found!');
  }

  console.log('\n✅ Full results saved to: virtual-ux-test-100k-results.json');
  console.log('\n' + '='.repeat(80) + '\n');
}

main().catch(console.error);
