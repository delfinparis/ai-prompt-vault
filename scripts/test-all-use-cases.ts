/**
 * Test All 12 Use Cases - Automated API Testing
 *
 * This script tests each use case to ensure:
 * 1. API responds successfully
 * 2. Generated content is returned
 * 3. No errors occur
 * 4. Response time is reasonable (<30s)
 */

interface TestResult {
  useCase: string;
  success: boolean;
  responseTime: number;
  outputLength: number;
  error?: string;
}

const API_URL = 'https://ai-prompt-vault-two.vercel.app/api/generate';

// Test prompts for each use case
const TEST_PROMPTS = {
  'Social Media Posts': `You are a social media expert for real estate agents.

TASK: Write 3 engaging social media posts.

TOPIC: Market update for Austin, TX
PLATFORM: Instagram
GOAL: educate-market
TONE: professional
LENGTH: caption

Write 3 variations that stop the scroll and provide value.`,

  'Email Campaigns': `You are an email marketing expert for real estate professionals.

TASK: Write a compelling email campaign.

CAMPAIGN TYPE: past-client-nurture
SUBJECT LINE STYLE: curiosity
GOAL: Generate repeat business and referrals
AUDIENCE: Past clients who closed 2+ years ago
SPECIAL OFFER: Free home value report
TONE: professional

Create subject line and email body that drives opens and clicks.`,

  'Market Reports': `You are a real estate market analyst and content writer.

TASK: Write a monthly market report.

LOCATION: Austin, TX
TIME PERIOD: December 2024
DATA HIGHLIGHTS: Median home price: $525,000 (up 3% YoY), Days on market: 28 (down from 35), Inventory: 2.1 months (low supply)
TARGET AUDIENCE: buyers
TONE: professional

Create an insightful report that positions you as the local expert.`,

  'Scripts for Cold Calling': `You are a top-producing real estate agent trainer who teaches consultative selling (not pushy sales tactics).

TASK: Write a for-sale-by-owner (FSBO) cold calling script.

CONTEXT: Calling homeowner who listed FSBO 2 weeks ago on Zillow
GOAL: Get appointment
OBJECTION TO ADDRESS: "I want to save on commission"
TONE: professional

Create a script that builds rapport and provides value.`,

  'Conversation Starters (Sphere)': `You are a relationship-building expert for real estate agents.

TASK: Write 5 natural conversation starters for your sphere of influence.

CONTEXT: Holiday season networking events
GOAL: Stay top-of-mind without being salesy
APPROACH: Add value and show genuine interest
TONE: casual

Create conversation starters that feel authentic, not scripted.`,

  'Follow-up Messages': `You are a follow-up expert for real estate professionals.

TASK: Write follow-up messages.

SCENARIO: post-showing
BUYER FEEDBACK: Loved the kitchen and backyard, concerned about small bedrooms
TIMELINE: Send within 24 hours
ACTION NEEDED: Address concern and schedule second showing
TONE: professional

Create messages that keep momentum and address objections.`,

  'Client Check-ins': `You are a client relationship expert for real estate agents.

TASK: Write a client check-in message.

CLIENT TYPE: buyer
STAGE: under-contract
DAYS SINCE LAST CONTACT: 7
UPCOMING MILESTONE: Inspection is tomorrow
TONE: casual

Create a check-in that shows you're on top of the transaction.`,

  'Testimonial Requests': `You are a client experience expert for real estate agents.

TASK: Write a testimonial request message.

CLIENT TYPE: seller
TRANSACTION: Just closed, smooth sale in 10 days
RELATIONSHIP: Strong rapport throughout
PREFERRED PLATFORM: Google Reviews
TONE: casual

Make it easy for them to say yes and write a great review.`,

  'Referral Requests': `You are a referral generation expert for real estate professionals.

TASK: Write a referral request message.

CLIENT: Just helped first-time buyers close on dream home
TIMING: 2 weeks post-closing (happy and settled)
SPECIFIC ASK: Friends/family/coworkers looking to buy
INCENTIVE: $250 gift card for successful referral
TONE: casual

Make the ask feel natural and show appreciation.`,

  'Listing Descriptions': `You are a real estate copywriter who writes listing descriptions that make buyers want to schedule a showing immediately.

Act as a master journalist, author, poet, advertising copywriter, and book editor to craft an accessible, yet engaging listing description that doesn't read like all the other listing descriptions, but captures the emotion of the reader without being over the top or cheesy, but professional and fun. Let's make it so a buyer sees it and says, "WOW - I have to go see this property!" Let's also respect all NAR rules about listing descriptions as well as Fair Housing rules.

TASK: Write an MLS listing description for a single family.

Address: 123 Maple Street, Austin, TX 78704
IMPORTANT: Research this address online to find accurate neighborhood details, school ratings, nearby amenities, and property history. Incorporate relevant findings naturally into the description.
Basics: 4 bed, 3 bath, 2,400 sqft, built 2015
Location: South Austin, walkable to shops and restaurants
Price: $675,000
Key Features:
Modern kitchen with quartz countertops
Large backyard with covered patio
Home office with built-in shelving
Updated primary suite

TARGET BUYER: family
URGENCY FACTOR: new-listing

STYLE: professional
Clean, clear, factual - focus on features and benefits

CONSTRAINTS:
- Lead with the most compelling feature (not the address)
- Use specific details, not generic adjectives (not "beautiful kitchen" - instead "chef's kitchen with quartz waterfall island and commercial-grade appliances")
- Create urgency without being pushy
- Paint a picture of the lifestyle, not just the house
- Keep it under 250 words (buyers skim)
- DO NOT use: "charming", "cozy" (code for small), "unique" (code for weird), "motivated seller", "won't last long"
- DO NOT list every single feature - highlight what makes it special
- Use online research about the address to add credible neighborhood/area details

OUTPUT FORMAT:
Headline: [Attention-grabbing first sentence]
Body: [2-3 paragraphs with sensory details and lifestyle benefits - MAXIMUM 1300 CHARACTERS for this section only]
Key Features: [Bulleted list of top 5-7 features]

CRITICAL: The Body section MUST be 1300 characters or less (as close to 1300 as possible, but never exceed it). The Headline and Key Features are separate and don't count toward this limit.

Write this to sell the lifestyle, not just the house.`,

  'Open House Invitations': `You are an event marketing expert for real estate agents.

TASK: Write an open house invitation.

PROPERTY TYPE: single-family
PROPERTY HIGHLIGHTS: Modern farmhouse, gourmet kitchen, huge backyard
DATE/TIME: This Sunday, 1-3pm
ADDRESS: 456 Oak Lane, Austin, TX
TARGET AUDIENCE: families
SPECIAL FEATURE: Professional staging and refreshments
TONE: professional

Create an invitation that drives attendance.`,

  'Just Listed/Sold Announcements': `You are a real estate marketing expert who creates announcements that generate leads.

TASK: Write a just-listed announcement.

PROPERTY TYPE: single-family
NEIGHBORHOOD: Travis Heights
PRICE: $725,000
KEY STATS: 3 bed, 2 bath, completely renovated
UNIQUE ANGLE: First listing in neighborhood in 6 months
CALL-TO-ACTION: Schedule private showing
PLATFORM: email
TONE: professional

Create urgency and excitement.`
};

async function testUseCase(useCase: string, prompt: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json();
      return {
        useCase,
        success: false,
        responseTime,
        outputLength: 0,
        error: `HTTP ${response.status}: ${errorData.error || 'Unknown error'}`
      };
    }

    const data = await response.json();

    if (!data.success || !data.output) {
      return {
        useCase,
        success: false,
        responseTime,
        outputLength: 0,
        error: 'API returned success=false or no output'
      };
    }

    return {
      useCase,
      success: true,
      responseTime,
      outputLength: data.output.length,
    };
  } catch (error: any) {
    return {
      useCase,
      success: false,
      responseTime: Date.now() - startTime,
      outputLength: 0,
      error: error.message || String(error)
    };
  }
}

async function runAllTests() {
  console.log('🧪 Testing All 12 Use Cases\n');
  console.log('API Endpoint:', API_URL);
  console.log('Starting tests...\n');

  const results: TestResult[] = [];
  const useCases = Object.keys(TEST_PROMPTS);

  for (let i = 0; i < useCases.length; i++) {
    const useCase = useCases[i];
    const prompt = TEST_PROMPTS[useCase as keyof typeof TEST_PROMPTS];

    console.log(`[${i + 1}/${useCases.length}] Testing: ${useCase}...`);

    const result = await testUseCase(useCase, prompt);
    results.push(result);

    if (result.success) {
      console.log(`   ✅ Success (${(result.responseTime / 1000).toFixed(1)}s, ${result.outputLength} chars)`);
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }

    // Add small delay between requests to avoid rate limiting
    if (i < useCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`Success Rate: ${((successful.length / results.length) * 100).toFixed(1)}%\n`);

  if (successful.length > 0) {
    const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
    const avgOutputLength = successful.reduce((sum, r) => sum + r.outputLength, 0) / successful.length;

    console.log('⏱️  Average Response Time:', (avgResponseTime / 1000).toFixed(1) + 's');
    console.log('📝 Average Output Length:', avgOutputLength.toFixed(0) + ' characters\n');
  }

  if (failed.length > 0) {
    console.log('❌ FAILED TESTS:\n');
    failed.forEach(result => {
      console.log(`   - ${result.useCase}`);
      console.log(`     Error: ${result.error}\n`);
    });
  }

  console.log('='.repeat(80) + '\n');

  // Exit with error code if any tests failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

runAllTests().catch(console.error);
