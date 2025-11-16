# Project Overview

Name: AI Prompt Vault / "Call Your Sphere" wizard

Goal:
- Help real estate agents restart the habit of calling their past clients.
- We walk them through the emotional/psychological block, then give them a simple, human script to use (call, text, voicemail).

Current MVP:
- React (Create React App) + TypeScript.
- Entry: src/index.tsx
- Main existing app: src/AIPromptVault.tsx
- New feature (wizard): src/CallYourSphereWizard.tsx
- Currently generates scripts locally in the browser (no API call) to avoid dev friction.

Tech:
- CRA (react-scripts), not Next.js.
- Deployed to Vercel.
- Existing AI endpoint: api/generate.ts (used by the main app).

Recent work:
- We added CallYourSphereWizard and temporarily made it the default view in index.tsx.
- API route /api/generate-call-script was attempted but is currently disabled / not wired up.
- For now, we’re okay using a local script generator in the frontend; server-side AI can come later.

What I want help with next:
- [Add your immediate goals here: e.g., “integrate the wizard alongside the existing app,” “proper routing/nav,” “eventually hook this wizard up to OpenAI via a clean API route,” etc.]