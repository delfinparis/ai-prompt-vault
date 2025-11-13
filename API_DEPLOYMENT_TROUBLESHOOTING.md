# API Deployment Troubleshooting

## Current Issue

The Vercel serverless API routes (`/api/*`) are not being recognized when deployed with Create React App. The routes return the HTML index.html instead of JSON responses.

## Working Files

✅ API endpoints are correctly structured:
- `api/prompts.ts`
- `api/prompt/[id].ts`
- `api/track.ts`

✅ Using proper Vercel serverless format with `@vercel/node`

## Problem

Vercel with CRA is serving the static build from `build/` directory and not recognizing the `/api` folder as serverless functions.

## Solutions to Try

### Option 1: Move to Next.js (Recommended)

Vercel works best with Next.js for API routes. Consider migrating:

```bash
# Create new Next.js app
npx create-next-app@latest ai-prompt-vault-next

# Move src/ to app/ or pages/
# Move api/ to app/api/ or pages/api/
# Update imports
```

### Option 2: Use Vercel Functions with Different Structure

Create functions in the correct location for Vercel:

```
/api/
  prompts.js (or .ts)
  track.js
  prompt/
    [id].js
```

And update `vercel.json`:
```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3"
    }
  }
}
```

### Option 3: Test Locally with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev

# Test endpoints
curl http://localhost:3000/api/prompts
```

### Option 4: Alternative - Use Netlify Functions

Netlify might handle CRA + serverless better:

```
netlify/
  functions/
    prompts.ts
    track.ts
```

## Quick Win: Use Existing Working API

Your `/api/generate.ts` endpoint has the same structure but also isn't working. This confirms it's a deployment configuration issue, not a code issue.

## Temporary Solution for GPT Launch

### Option A: External API Service

Deploy the API separately:
1. Create new repo with just the API functions
2. Deploy to Vercel as standalone Functions project
3. Update GPT to point to that URL
4. Keep main app on current deployment

### Option B: Use Different Hosting

Deploy just the API to:
- Railway.app (Node.js server)
- Render.com (Node.js server)
- AWS Lambda (via Serverless Framework)

## Next Steps

1. **Test locally** with `vercel dev` to confirm API works
2. **Check Vercel dashboard** logs for errors
3. **Contact Vercel support** or check their CRA + API docs
4. **OR** proceed with separate API deployment for GPT launch

The GPT implementation is complete and correct. We just need to solve the deployment routing issue.
