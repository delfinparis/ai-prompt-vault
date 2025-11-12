## AI assistant instructions — ai-prompt-vault

This project is a small single-page React + TypeScript app (Create React App) that ships a curated library of "prompts" for real-estate agents. The goal of these instructions is to help an AI contributor be immediately productive: where data lives, how the UI is wired, and what to update for common tasks.

- Quick start
  - Install and run locally: the project uses Create React App. Use `npm install` then `npm start` (dev server). Production build: `npm run build`. Tests: `npm test`.

- Big picture
  - Entry: `src/index.tsx` mounts the main component `AIPromptVault` from `src/AIPromptVault.tsx`.
  - Data source: the prompt content is defined statically in `src/prompts.ts` (arrays M1..M12). The UI also attempts to fetch a remote JSON (Apps Script URL in `AIPromptVault.tsx`) and merges remote modules into the base dataset.
  - Labels: human-friendly title/subtitle overrides live in `src/labelOverrides.ts`.
  - Storage & caching: remote payload is cached in `localStorage` under keys `rpv:remoteCache` and `rpv:remoteVersion` (see constants in `AIPromptVault.tsx`).

- Where to make common edits
  - Add or edit prompts: modify `src/prompts.ts`. Each module is an array (M1, M2, ...). The top-level export is `export const prompts = [M1, M2, ...]`.
  - Change module display names: `AIPromptVault.tsx` defines `MODULE_TITLES` and internal module keys like `Module 1 — <title>`. Edit those to change module headings.
  - Override card labels/titles: use `src/labelOverrides.ts` to map prompt `match` strings to friendly `title` and `subtitle` used elsewhere.
  - Remote prompts: the app fetches `REMOTE_JSON_URL` in `AIPromptVault.tsx` and merges using `mergeRemote`. Remote payload structure: { version?: string, modules?: Record<string, RemotePrompt[]> }.

- Important code patterns & examples
  - Prompt shape (TypeScript): `PromptItem` (see `AIPromptVault.tsx`) — fields include `title, role, deliverable, inputs, constraints, tools, format, audience, module, index`.
  - Building the long prompt: `buildFullPrompt(p: PromptItem)` (in `AIPromptVault.tsx`) concatenates fields into the long-form prompt that users copy.
  - Merge logic: `mergeRemote(base, remote)` preserves existing prompts (case-insensitive title check) and appends new ones into matching modules (matching by the internal module key or its displayName).
  - Tracking: `trackEvent(name, data)` dispatches a CustomEvent `rpv_event` on `window` — useful for integration tests or telemetry during debugging.

- Debugging tips (quick wins)
  - Remote fetch issues: inspect Network tab for the Apps Script URL (constant `REMOTE_JSON_URL`) and check `localStorage` keys `rpv:remoteCache`/`rpv:remoteVersion`.
  - Prompt merge problems: open console and log `mergeRemote` inputs; the merge matches module names by exact match or by `displayName(module)`.
  - Copy to clipboard: `handleCopy` uses `navigator.clipboard` with a fallback textarea copy. To test, click a prompt in the running app.

- Conventions to follow
  - Keep prompt data in `src/prompts.ts` as plain arrays. Use the existing M1..M12 pattern and export the array in order (module index maps to title). Indexes are zero-based within modules; `attachModule` assigns `module` and `index` at runtime.
  - Prefer small, focused edits. The UI uses inline styles in `AIPromptVault.tsx` (no CSS-in-JS libs). Avoid large refactors unless necessary.

- Tests & quality gate suggestions (discoverable now)
  - There are no unit tests for `buildFullPrompt` or `mergeRemote`. When adding tests, target those pure functions (they're easy to unit-test) and use the existing CRA test setup (`react-scripts test`).

- PR notes
  - When adding prompts, update `src/prompts.ts` and, if the displayed labels should change, add entries to `src/labelOverrides.ts`.
  - If you change module ordering or internal module keys, ensure `CATEGORY_CARDS` and `MODULE_TITLES` in `AIPromptVault.tsx` remain aligned.

If any of this is unclear, tell me which area you'd like expanded (run/debug steps, examples of prompt edits, or adding a test for a specific function) and I'll update this file.
