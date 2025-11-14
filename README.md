# AI Prompt Vault - Realtor Execution App

**Live App:** https://ai-prompt-vault-two.vercel.app/

A behavior change engine for real estate agents that identifies what you're avoiding and removes friction with AI-powered execution.

## The Core Problem

Realtors don't lack knowledge - they lack consistent execution. This app doesn't teach what to do; it diagnoses WHY you're not doing it and helps you execute immediately.

## Features

- 🎯 **Pick-One Diagnostic** - Identify the single activity holding you back right now
- 🧠 **12 Universal Barriers** - Deep psychological insights into what stops action (fear, perfectionism, overwhelm, etc.)
- ✨ **AI Execution Engine** - Generate content in 60 seconds to remove friction
- 🔥 **Streak Tracking** - Build momentum with daily accountability
- 📊 **Dashboard Command Center** - See what's urgent, celebrate wins
- 💡 **Coaching Tips** - Personalized guidance based on your specific barrier

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-proj-your-key-here
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Run Development Server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Test Serverless Functions Locally

To test the AI generation endpoint locally:

```bash
npm install -g vercel
vercel dev
```

### 5. Build for Production

```bash
npm run build
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variable in Vercel dashboard:
   - Go to **Project Settings → Environment Variables**
   - Add `OPENAI_API_KEY` with your OpenAI key
   - Scope: Production, Preview, Development
4. Deploy!

Vercel will automatically:
- Build on every push to `main`
- Create preview deployments for PRs
- Run serverless functions in `/api` directory

## Architecture

- **Frontend**: React 19.2.0 + TypeScript 4.9.5
- **AI Integration**: OpenAI API (gpt-4o-mini model)
- **Serverless Functions**: Vercel serverless (`/api/generate.ts`)
- **State Management**: React hooks + localStorage
- **Styling**: Inline styles with CSS variables
- **Wizard Synthesis**: Extracted in `src/wizardPromptBuilder.ts` for testability (buildEnhancedWizardPrompt)

## Free Tier Limits

- 10 prompt copies per month
- 3 AI generations per month
- Limits reset automatically on the 1st of each month

## Pro Tier Features (Coming Soon)

- 100 AI generations per month
- Unlimited prompt access
- Save and export all outputs
- Team collaboration features
- Priority support

## Project Structure

```
/api
  generate.ts          # OpenAI API proxy (serverless function)
  variations.ts        # Prompt variation generator
/src
  AIPromptVault.tsx    # Main app component (2800+ lines)
  prompts.ts           # Prompt library data (170+ prompts)
  labelOverrides.ts    # Display name mappings
  index.tsx            # App entry point
/public
  index.html           # HTML template
```

## Key Features Implementation

### Sequence Tracking
The app learns which prompts users commonly use together and suggests them as "next steps". See `SEQUENCE_TRACKING.md` for details.

### AI Generation
- Users can generate content directly in the app
- Usage limits enforced (3 free generations/month)
- Results saved to localStorage history
- Copy/clear functionality

### Smart Suggestions
### Coaching Wizard (Diagnostic → Prescription)
Located in `AIPromptVault.tsx` and powered by `wizardPromptBuilder.ts`.

Flow:
1. Category selection from consolidated high‑level groups (Lead Generation, Listing & Marketing, Client Management & Negotiation, Productivity & Organization, Market Knowledge & Strategy, or custom challenge).
2. Drill‑down inputs with multi‑select chips (`WIZARD_OPTION_SETS`) plus a freeform field that merges into a comma‑separated data string.
3. Structured synthesis creating sections: Situation Snapshot, Objectives, Constraints & Challenges, Recommended Strategy (with 3 pillars), Immediate Action Steps (Today / This Week / This Month), Refinement Cues.

Extend:
- Add / edit categories: update `CHALLENGE_CATEGORIES` & corresponding entry in `CHALLENGES` (question ids matter—regex grouping in synthesis looks for goal, obstacle, situation, etc.).
- Add chip sets: modify `WIZARD_OPTION_SETS` (keys must match question id). Chips auto-sync into `wizardAnswers` and analytics.
- Adjust synthesis: edit `wizardPromptBuilder.ts` (ensure tests updated if section labels changed).

### Analytics Events (CustomEvent `rpv_event`)
The wizard and broader app emit events for funnel analysis:
- `rpv:wizard_category_select` { challenge }
- `rpv:wizard_custom_challenge_submit` { chars }
- `rpv:wizard_chip_select` { questionId, value, selected }
- `rpv:wizard_generate` { challenge, answers:[{k,len}], totalChars }
- `rpv:wizard_prompt_copy` { challenge, length }
- `rpv:followup_prompt_click` { label, source }
// Quality scoring additions
- `rpv:wizard_quality_generate` { challenge, score, suggestionsRemaining }
- `rpv:wizard_quality_threshold` { from, to, challenge, suggestionsRemaining }

Listen example:
```javascript
window.addEventListener('rpv_event', (e) => {
  const { name, data, ts } = (e as CustomEvent).detail;
  console.log('[analytics]', name, data, ts);
});
```

### Testing Additions
`wizardSynthesis.test.ts` ensures:
- All required sections appear for rich input.
- Fallback situation line when missing context.
- `_custom` keys excluded from context bullets.
- Goal absence triggers "Clarify with user" sentinel.
- Output stays plain text (no code fences / markdown bullet asterisks).

To add more tests (e.g., extremely long custom challenge), extend that file with new cases referencing `buildEnhancedWizardPrompt`.

### Admin dashboard overlay (debug)
Append `?admin=1` to your app URL to open a small live overlay (bottom‑right) that summarizes wizard funnel stats from the same `rpv_event` stream:
- Category selections per key
- Generate and Copy counts
- Quality Generate count and average score
- Threshold counts at 45, 65, and 85

- ✨ Gold badges for strong sequences (3+ uses)
- 📊 Blue badges for emerging patterns
- Social proof messaging ("85% of agents use this next")

## Development

### Adding New Prompts

Edit `src/prompts.ts` and add to the appropriate module array (M1-M12):

```typescript
{
  title: "Your Prompt Title",
  role: "Real estate marketing expert",
  deliverable: "What you want generated",
  inputs: [
    { name: "[placeholder]", description: "What to fill in - example: Austin, TX" }
  ],
  // ... other fields
}
```

### Changing Module Display Names

Edit `MODULE_TITLES` in `src/AIPromptVault.tsx`.

### Overriding Card Labels

Edit `src/labelOverrides.ts` to map internal titles to user-facing labels.

## Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Learn More

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Documentation](https://reactjs.org/)
- [Vercel Documentation](https://vercel.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
