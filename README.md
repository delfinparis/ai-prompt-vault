# AI Prompt Vault

A curated library of AI prompts for real estate agents, featuring smart workflow tracking and direct AI generation.

## Features

- 📚 **170+ Professional Prompts** - Organized by real estate workflows
- ✨ **Direct AI Generation** - Generate content without leaving the platform
- 🧠 **Smart Suggestions** - Learn your workflow patterns
- 🎯 **Sequence Tracking** - Discover which prompts work best together
- 💾 **Save Outputs** - Keep a library of your best AI-generated content
- 🎨 **Beautiful UX** - Gradients, animations, and delightful interactions

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
