/**
 * Virtual Realtor Testing Simulation
 *
 * Simulates 10,000 real estate agents using PromptCrafter to evaluate:
 * - Question clarity and necessity
 * - User friction points
 * - Opportunities to reduce cognitive load
 * - Which data AI can infer vs. needs to ask
 *
 * Goal: "Don't make users think - just answer simple questions and we do the rest!"
 */

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUAL REALTOR PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

type RealtorProfile = {
  id: number;
  name: string;
  age: number;
  experience: 'rookie' | 'intermediate' | 'veteran';
  techSavvy: 'low' | 'medium' | 'high';
  market: string;
  specialty: 'buyer-agent' | 'listing-agent' | 'luxury' | 'investor-focused' | 'generalist';
  typicalPriceRange: string;
  mainPainPoint: string;
};

// Generate diverse realtor profiles
function generateRealtorProfiles(count: number): RealtorProfile[] {
  const markets = [
    'Austin TX', 'Denver CO', 'Phoenix AZ', 'Miami FL', 'Seattle WA',
    'Portland OR', 'Nashville TN', 'Charlotte NC', 'San Diego CA', 'Boston MA',
    'Atlanta GA', 'Dallas TX', 'Chicago IL', 'Orlando FL', 'Tampa FL'
  ];

  const experiences = ['rookie', 'intermediate', 'veteran'] as const;
  const techLevels = ['low', 'medium', 'high'] as const;
  const specialties = ['buyer-agent', 'listing-agent', 'luxury', 'investor-focused', 'generalist'] as const;
  const priceRanges = ['Under $300K', '$300-500K', '$500K-$1M', '$1M+'];
  const painPoints = [
    'Not enough time to write content',
    'Don\'t know what to say in market updates',
    'Struggle with social media consistency',
    'Need help with expired listing outreach',
    'Want to nurture sphere better',
    'Don\'t know how to handle objections',
    'Need better listing descriptions'
  ];

  const profiles: RealtorProfile[] = [];

  for (let i = 0; i < count; i++) {
    profiles.push({
      id: i + 1,
      name: `Realtor ${i + 1}`,
      age: 25 + Math.floor(Math.random() * 40), // Age 25-65
      experience: experiences[Math.floor(Math.random() * experiences.length)],
      techSavvy: techLevels[Math.floor(Math.random() * techLevels.length)],
      market: markets[Math.floor(Math.random() * markets.length)],
      specialty: specialties[Math.floor(Math.random() * specialties.length)],
      typicalPriceRange: priceRanges[Math.floor(Math.random() * priceRanges.length)],
      mainPainPoint: painPoints[Math.floor(Math.random() * painPoints.length)]
    });
  }

  return profiles;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CURRENT QUESTION SETS (from our implementation)
// ═══════════════════════════════════════════════════════════════════════════════

const CURRENT_QUESTIONS = {
  'market-report': [
    "Where's your market? (City, neighborhood, or zip code)",
    "Property type focus? (All, Single-Family, Condos, Townhomes, Luxury, Multi-Family)",
    "What time frame? (Last 7 Days, 30 Days, Quarter, Year, Year-Over-Year)",
    "Price range focus? (All, Under $300K, $300-500K, $500K-$1M, $1M+)",
    "Which metrics do you want to highlight? (All Metrics, Price Trends, Inventory, Days on Market, Sale-to-List Ratio)",
    "Do you have specific market data? (Leave blank if you want AI to research)",
    "Who is this report for? (Buyers, Sellers, General Sphere, Investors)",
    "Overall market trend? (Let AI Determine, Hot/Seller's Market, Balanced, Cooling/Buyer's Market, Mixed)",
    "Compare to what period? (vs. Last Month, Quarter, Year, Peak 2021, None)",
    "What should they DO with this info? (Your recommendation)"
  ],
  'social-content': [
    "Which platform? (Instagram, Facebook, LinkedIn, TikTok)",
    "What type of post? (Market Update, Listing Showcase, Tips & Advice, Personal Story, Just Sold)",
    "What market/location? (City, neighborhood, or zip code)",
    "Property type focus? (All, Single-Family, Condos, Townhomes, Luxury, Multi-Family)",
    "Specific data or details you want to highlight? (Leave blank if you want AI to research)",
    "Tone & style? (Professional, Casual & Friendly, Luxury & Upscale, Educational, Humorous)",
    "Call-to-action? (What do you want them to do?)"
  ],
  'sphere-script': [
    "Who are you calling? (Past Client, Friend/Family, Warm Lead, Cold Lead, Professional Contact)",
    "How do you know them? (When did you last talk? What's your history?)",
    "What's your goal for this call? (Get Referral, Book Appointment, Stay Top of Mind, Share Market Update)",
    "What's your market hook? (Recent change in their neighborhood/situation)",
    "Their home/situation (if known)? (Neighborhood, how long they've owned, equity position)",
    "Any personal details to reference? (Life updates, hobbies, family, career)"
  ],
  'listing-description': [
    "Property type? (Single Family, Condo, Townhouse, Luxury Home, Land/Lot)",
    "Beds, baths, sq ft, year built",
    "Location & neighborhood (City, neighborhood, school district, notable features)",
    "List price",
    "Top 5-7 features to highlight (Updates, unique features, what makes it special)",
    "Who is this perfect for? (Growing Family, Young Professionals, Downsizers, Entertainers, Remote Workers, Investors)",
    "Any urgency factors? (None, New to Market, Price Reduction, Open House This Weekend, Expecting Multiple Offers)",
    "Writing style? (Professional MLS, Storytelling, Luxury/Upscale, Casual/Friendly)"
  ],
  'email-sequence': [
    "Who is this email sequence for? (New Leads, Active Buyers, Potential Sellers, Past Clients)",
    "Where did these leads come from? (Zillow, Facebook ad, open house, referral)",
    "Their buying/selling timeline? (0-3 Months HOT, 3-6 Months, 6-12 Months, Just Exploring)",
    "Their location & price range (if known)",
    "What problem are they trying to solve? (First-time buyer, downsizing, investment, relocation)",
    "How many emails? (3, 5, 7)",
    "What should the sequence accomplish? (Book Call, Download Guide, Schedule Showing, Build Trust)"
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTING SIMULATION
// ═══════════════════════════════════════════════════════════════════════════════

type TestResult = {
  realtorProfile: RealtorProfile;
  useCase: string;
  questionsEvaluated: {
    question: string;
    clarity: number; // 1-10
    necessity: number; // 1-10 (10 = absolutely needed, 1 = AI can infer)
    cognitiveLoad: number; // 1-10 (10 = very hard to answer, 1 = easy)
    feedback: string;
    suggestedSimplification?: string;
    canAIInfer?: boolean;
    suggestedDefault?: string;
  }[];
  overallFriction: number; // 1-10
  timeToComplete: number; // estimated seconds
  wouldAbandon: boolean;
  generalFeedback: string;
};

async function simulateRealtorTest(
  realtor: RealtorProfile,
  useCase: string,
  questions: string[]
): Promise<TestResult> {
  const prompt = `You are simulating a real estate agent using an AI content tool called PromptCrafter.

# AGENT PROFILE
- Name: ${realtor.name}
- Experience: ${realtor.experience} (${realtor.age} years old)
- Tech Savvy: ${realtor.techSavvy}
- Market: ${realtor.market}
- Specialty: ${realtor.specialty}
- Price Range: ${realtor.typicalPriceRange}
- Main Pain Point: ${realtor.mainPainPoint}

# SCENARIO
This agent is trying to use the "${useCase}" feature. They need to answer these questions:

${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

# YOUR TASK
Evaluate EACH question from this agent's perspective. Think like a busy realtor who wants quick results without overthinking.

For EACH question, analyze:
1. **Clarity (1-10)**: How clear is this question? Will the agent immediately understand what to answer?
2. **Necessity (1-10)**: How necessary is this question? (10 = absolutely must ask, 1 = AI can easily infer this)
3. **Cognitive Load (1-10)**: How hard is it to answer? (10 = requires research/thinking, 1 = instant answer)
4. **Feedback**: Specific issues or confusion points
5. **Can AI Infer?**: Could AI figure this out from other answers or context?
6. **Suggested Default**: What should the default be to reduce friction?
7. **Suggested Simplification**: How could we simplify this question?

Then provide:
- **Overall Friction (1-10)**: How frustrated would this agent be? (10 = very frustrated, 1 = delighted)
- **Time to Complete**: Estimated seconds to answer all questions
- **Would Abandon**: Would this agent give up before finishing? (true/false)
- **General Feedback**: What's the biggest improvement needed?

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "The question text",
      "clarity": 8,
      "necessity": 7,
      "cognitiveLoad": 3,
      "feedback": "Clear but...",
      "canAIInfer": false,
      "suggestedDefault": "All property types",
      "suggestedSimplification": "Simpler version of question"
    }
  ],
  "overallFriction": 5,
  "timeToComplete": 45,
  "wouldAbandon": false,
  "generalFeedback": "Overall thoughts..."
}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    const evaluation = JSON.parse(content);

    return {
      realtorProfile: realtor,
      useCase,
      questionsEvaluated: evaluation.questions || [],
      overallFriction: evaluation.overallFriction || 5,
      timeToComplete: evaluation.timeToComplete || 60,
      wouldAbandon: evaluation.wouldAbandon || false,
      generalFeedback: evaluation.generalFeedback || ''
    };
  } catch (error) {
    console.error('Error simulating test:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH TESTING & ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

async function runBatchTests(
  realtorCount: number,
  useCasesToTest: string[] = ['market-report', 'social-content', 'sphere-script', 'listing-description', 'email-sequence']
) {
  console.log(`\n🧪 Starting Virtual Realtor Testing Simulation...`);
  console.log(`📊 Testing ${realtorCount} realtors across ${useCasesToTest.length} use cases\n`);

  const realtors = generateRealtorProfiles(realtorCount);
  const allResults: TestResult[] = [];

  let testsCompleted = 0;
  const totalTests = realtorCount * useCasesToTest.length;

  // Run tests in batches to avoid rate limits
  const batchSize = 10;

  for (let i = 0; i < realtors.length; i += batchSize) {
    const batch = realtors.slice(i, i + batchSize);

    const batchPromises = batch.flatMap(realtor =>
      useCasesToTest.map(async useCase => {
        const questions = CURRENT_QUESTIONS[useCase as keyof typeof CURRENT_QUESTIONS] || [];
        const result = await simulateRealtorTest(realtor, useCase, questions);
        testsCompleted++;

        if (testsCompleted % 100 === 0) {
          console.log(`✅ Progress: ${testsCompleted}/${totalTests} tests completed (${Math.round(testsCompleted/totalTests * 100)}%)`);
        }

        return result;
      })
    );

    const batchResults = await Promise.all(batchPromises);
    allResults.push(...batchResults);

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return allResults;
}

// Helper function
const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

function analyzeResults(results: TestResult[]) {
  console.log('\n\n📊 ANALYSIS RESULTS\n');
  console.log('═'.repeat(80));

  // Group by use case
  const byUseCase = results.reduce((acc, r) => {
    if (!acc[r.useCase]) acc[r.useCase] = [];
    acc[r.useCase].push(r);
    return acc;
  }, {} as Record<string, TestResult[]>);

  for (const [useCase, useCaseResults] of Object.entries(byUseCase)) {
    console.log(`\n\n## ${useCase.toUpperCase()}`);
    console.log('─'.repeat(80));

    // Aggregate question stats
    const questionStats: Record<string, {
      clarity: number[];
      necessity: number[];
      cognitiveLoad: number[];
      canAIInferCount: number;
      suggestions: string[];
    }> = {};

    useCaseResults.forEach(result => {
      result.questionsEvaluated.forEach(q => {
        if (!questionStats[q.question]) {
          questionStats[q.question] = {
            clarity: [],
            necessity: [],
            cognitiveLoad: [],
            canAIInferCount: 0,
            suggestions: []
          };
        }
        questionStats[q.question].clarity.push(q.clarity);
        questionStats[q.question].necessity.push(q.necessity);
        questionStats[q.question].cognitiveLoad.push(q.cognitiveLoad);
        if (q.canAIInfer) questionStats[q.question].canAIInferCount++;
        if (q.suggestedSimplification) {
          questionStats[q.question].suggestions.push(q.suggestedSimplification);
        }
      });
    });

    // Calculate averages and identify issues
    console.log('\n### QUESTION-BY-QUESTION ANALYSIS:\n');

    Object.entries(questionStats).forEach(([question, stats], idx) => {
      const avgClarity = avg(stats.clarity);
      const avgNecessity = avg(stats.necessity);
      const avgCognitiveLoad = avg(stats.cognitiveLoad);
      const inferPercentage = (stats.canAIInferCount / useCaseResults.length) * 100;

      console.log(`\n${idx + 1}. ${question}`);
      console.log(`   📊 Clarity: ${avgClarity.toFixed(1)}/10 ${avgClarity < 7 ? '⚠️ CONFUSING!' : '✅'}`);
      console.log(`   🎯 Necessity: ${avgNecessity.toFixed(1)}/10 ${avgNecessity < 5 ? '⚠️ CAN REMOVE!' : ''}`);
      console.log(`   🧠 Cognitive Load: ${avgCognitiveLoad.toFixed(1)}/10 ${avgCognitiveLoad > 7 ? '⚠️ TOO HARD!' : '✅'}`);
      console.log(`   🤖 ${inferPercentage.toFixed(0)}% say AI can infer this ${inferPercentage > 50 ? '⚠️ MAKE OPTIONAL!' : ''}`);

      if (avgClarity < 7 || avgNecessity < 5 || avgCognitiveLoad > 7 || inferPercentage > 50) {
        console.log(`   💡 ACTION NEEDED: ${
          avgClarity < 7 ? 'Rephrase for clarity. ' : ''
        }${
          avgNecessity < 5 ? 'Consider removing or making optional. ' : ''
        }${
          avgCognitiveLoad > 7 ? 'Simplify or provide better defaults. ' : ''
        }${
          inferPercentage > 50 ? 'AI can infer - make optional with smart default. ' : ''
        }`);
      }
    });

    // Overall metrics
    const avgFriction = avg(useCaseResults.map(r => r.overallFriction));
    const avgTime = avg(useCaseResults.map(r => r.timeToComplete));
    const abandonRate = (useCaseResults.filter(r => r.wouldAbandon).length / useCaseResults.length) * 100;

    console.log(`\n\n### OVERALL METRICS:`);
    console.log(`   Friction Score: ${avgFriction.toFixed(1)}/10 ${avgFriction > 6 ? '⚠️ TOO HIGH!' : '✅'}`);
    console.log(`   Avg Time: ${avgTime.toFixed(0)} seconds ${avgTime > 90 ? '⚠️ TOO LONG!' : '✅'}`);
    console.log(`   Abandon Rate: ${abandonRate.toFixed(1)}% ${abandonRate > 10 ? '⚠️ TOO HIGH!' : '✅'}`);

    // Segment by tech savviness
    const byTechSavvy = {
      low: useCaseResults.filter(r => r.realtorProfile.techSavvy === 'low'),
      medium: useCaseResults.filter(r => r.realtorProfile.techSavvy === 'medium'),
      high: useCaseResults.filter(r => r.realtorProfile.techSavvy === 'high')
    };

    console.log(`\n### BY TECH SAVVINESS:`);
    Object.entries(byTechSavvy).forEach(([level, results]) => {
      if (results.length > 0) {
        const avgFric = avg(results.map(r => r.overallFriction));
        const abandon = (results.filter(r => r.wouldAbandon).length / results.length) * 100;
        console.log(`   ${level}: Friction ${avgFric.toFixed(1)}/10, Abandon ${abandon.toFixed(1)}%`);
      }
    });
  }

  // Cross-use-case insights
  console.log('\n\n═'.repeat(80));
  console.log('## CROSS-USE-CASE INSIGHTS\n');

  const allFriction = results.map(r => r.overallFriction);
  const allTime = results.map(r => r.timeToComplete);
  const allAbandon = results.filter(r => r.wouldAbandon).length / results.length * 100;

  console.log(`📊 Overall Average Friction: ${avg(allFriction).toFixed(1)}/10`);
  console.log(`⏱️  Overall Average Time: ${avg(allTime).toFixed(0)} seconds`);
  console.log(`🚪 Overall Abandon Rate: ${allAbandon.toFixed(1)}%`);

  // Top recommendations
  console.log('\n\n## 🎯 TOP RECOMMENDATIONS:\n');
  console.log('1. Questions with clarity < 7: Rephrase immediately');
  console.log('2. Questions with necessity < 5: Remove or make optional');
  console.log('3. Questions with cognitive load > 7: Add smart defaults');
  console.log('4. Questions where >50% say AI can infer: Make optional');
  console.log('5. Target: <60 seconds completion, <5/10 friction, <5% abandon rate');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN SIMULATION
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const realtorCount = parseInt(process.argv[2] || '100', 10); // Default to 100 for quick test

  console.log('\n🎯 PROMPTCRAFTER VIRTUAL TESTING SIMULATION');
  console.log('═'.repeat(80));
  console.log(`Testing with ${realtorCount} virtual realtors\n`);

  const results = await runBatchTests(realtorCount);

  // Save raw results
  const fs = await import('fs/promises');
  await fs.writeFile(
    'test-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('\n💾 Raw results saved to test-results.json');

  // Analyze
  analyzeResults(results);

  console.log('\n\n✅ Simulation complete!\n');
}

// Run main
main().catch(console.error);

export { generateRealtorProfiles, simulateRealtorTest, analyzeResults };
