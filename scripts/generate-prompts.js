#!/usr/bin/env node

/**
 * AI Prompt Generator for Real Estate
 * 
 * Usage: node scripts/generate-prompts.js [category]
 * Categories: listings, buyers, leads, social, management
 * 
 * This script generates ChatGPT-ready prompts that you can paste
 * into ChatGPT/Claude to create batches of real estate prompts.
 */

const categories = {
  listings: {
    name: "Listing Marketing",
    workflows: [
      "Open house follow-up emails",
      "Virtual tour video scripts",
      "Neighborhood highlight social posts",
      "Price reduction announcements",
      "Just listed Instagram captions",
      "Coming soon teaser posts",
      "Listing expired seller letters",
      "Professional staging advice emails",
      "Property feature highlight reels",
      "Luxury listing descriptions"
    ]
  },
  buyers: {
    name: "Buyer Communication",
    workflows: [
      "Home showing confirmation texts",
      "Offer acceptance congratulations",
      "Inspection contingency explanations",
      "Closing timeline emails",
      "Post-closing thank you notes",
      "First-time buyer education series",
      "Multiple offer situation guidance",
      "Home warranty explanation emails",
      "Moving day checklist emails",
      "New homeowner tips newsletter"
    ]
  },
  leads: {
    name: "Lead Generation",
    workflows: [
      "Facebook ad copy variations",
      "Landing page headlines for buyer leads",
      "Email newsletter topic ideas",
      "YouTube video script outlines",
      "Instagram carousel post ideas",
      "Referral request emails",
      "Past client re-engagement campaigns",
      "Neighborhood farming postcards",
      "Sphere of influence emails",
      "Expired listing approach letters"
    ]
  },
  social: {
    name: "Social Media Content",
    workflows: [
      "Behind-the-scenes day-in-the-life posts",
      "Market update graphics captions",
      "Testimonial thank you posts",
      "Tips for sellers series",
      "Local business spotlight posts",
      "Community event coverage",
      "Before/after staging reveals",
      "Agent introduction reels",
      "Myth-busting educational content",
      "Q&A response videos"
    ]
  },
  management: {
    name: "Client Management",
    workflows: [
      "Transaction status update emails",
      "Document request follow-ups",
      "Appointment reminder texts",
      "Quarterly market update reports",
      "Annual home maintenance reminders",
      "Referral thank you gifts notes",
      "Birthday/anniversary messages",
      "Service provider recommendations",
      "Difficult conversation scripts",
      "Client expectation setting emails"
    ]
  }
};

const generatePromptTemplate = (category, workflow) => {
  return `
========================================
CHATGPT PROMPT GENERATOR REQUEST
========================================

Category: ${category}
Workflow: ${workflow}

Generate 5 detailed, ready-to-use prompts for real estate agents.

REQUIREMENTS:
1. Each prompt must be hyper-specific to this workflow
2. Include 3-5 input fields (e.g., property_address, client_name, price)
3. Output should be immediately usable (email, post, script, etc.)
4. Must save agents 30+ minutes per use
5. Include constraints (tone, length, style)

FORMAT EACH PROMPT AS:
{
  "title": "Specific 5-7 word title",
  "role": "You are a [specific expert role with 10+ years experience]",
  "quick": "One clear sentence describing what this does",
  "deliverable": "Exact output type (Email subject + body, Instagram caption + hashtags, etc.)",
  "inputs": ["input_field_1", "input_field_2", "input_field_3"],
  "constraints": [
    "Keep it under 300 words",
    "Use conversational but professional tone",
    "Include a clear call-to-action"
  ],
  "tools": ["ChatGPT", "Claude"],
  "format": "Email/Social Post/Script/Document",
  "audience": "Specific target (first-time buyers, luxury sellers, etc.)"
}

EXAMPLE GOOD OUTPUT:
{
  "title": "Open House Follow-Up Email (Next Day)",
  "role": "You are a real estate agent with 10+ years of experience in residential sales, skilled at converting open house visitors into qualified buyers",
  "quick": "Send personalized follow-up email to open house attendees within 24 hours to gauge interest and schedule private showings",
  "deliverable": "Professional email with subject line, personalized body thanking them for attending, highlighting property features they showed interest in, and clear next steps",
  "inputs": ["attendee_name", "property_address", "features_they_liked", "your_name", "your_phone"],
  "constraints": [
    "Keep email under 200 words",
    "Include 2-3 specific property features",
    "Add clear call-to-action (schedule showing)",
    "Professional but warm tone",
    "Mobile-friendly formatting"
  ],
  "tools": ["ChatGPT", "Claude"],
  "format": "Email",
  "audience": "Potential buyers who attended your open house"
}

NOW GENERATE 5 PROMPTS FOR: ${workflow}

Make each one solve a specific pain point agents face daily.
`;
};

// Main function
function main() {
  const args = process.argv.slice(2);
  const categoryKey = args[0] || 'listings';
  
  if (!categories[categoryKey]) {
    console.log('❌ Invalid category. Choose from: listings, buyers, leads, social, management');
    process.exit(1);
  }

  const category = categories[categoryKey];
  
  console.log(`\n🚀 Generating prompt templates for: ${category.name}\n`);
  console.log('📋 Copy each section below and paste into ChatGPT/Claude:\n');
  console.log('=' .repeat(80));
  
  category.workflows.forEach((workflow, index) => {
    console.log(generatePromptTemplate(category.name, workflow));
    console.log('=' .repeat(80));
    
    if (index < category.workflows.length - 1) {
      console.log('\n⬇️  NEXT WORKFLOW ⬇️\n');
    }
  });

  console.log('\n✅ Done! You now have', category.workflows.length, 'prompt generators.');
  console.log('📝 Paste each into ChatGPT, collect the outputs, and add to src/prompts.ts\n');
  console.log('💡 Tip: Generate 5-10 at a time, test them with real agents, then generate more.\n');
}

main();
