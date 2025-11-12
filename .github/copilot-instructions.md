# AI Prompt Vault - Copilot Instructions

## Project Overview
Real estate AI prompt library built as a single-page React app. Users browse 12 categories (modules) of structured prompts designed for realtors, select a prompt, then copy the expanded version to use in ChatGPT.

## Architecture

### Data Flow Pattern
1. **Base prompts** (`src/prompts.ts`): 12 module arrays (M1-M12), each with ~10 prompt objects
2. **Module attachment**: `attachModule()` adds `module` and `index` fields to create `PromptItem[]`
3. **Remote merge**: `mergeRemote()` fetches from Google Apps Script URL, caches in localStorage with version checking
4. **Display overrides**: `src/labelOverrides.ts` provides friendly titles/subtitles without changing underlying data

### Key Components
- **Single component architecture**: `AIPromptVault.tsx` is the entire UI (no routing, no separate components)
- **Category cards**: 12 cards map to `CATEGORY_CARDS` array with emoji, label, tagline
- **Module mapping**: `MODULE_TITLES` constant defines the 12 module names; cards reference via `moduleKey`
- **Prompt builder**: `buildFullPrompt()` expands short prompt fields into structured long-form prompt

## Critical Patterns

### Type System
```typescript
type PromptItem = {
  title: string;
  quick?: string;      // Short description
  role?: string;       // AI role to assume
  deliverable?: string;
  success?: string;    // Success metrics
  // ... 7 more optional fields
  module: string;      // "Module X — Name"
  index: number;       // Position in module
}
```

### State Management
- No Redux/Context—local `useState` only
- `selectedModule`: controls which category is active
- `selectedIndex`: controls which prompt is shown
- `data`: merged base + remote prompts (cached)

### Remote Sync Strategy
```typescript
// On mount:
1. Load base prompts immediately (instant UI)
2. Try cached remote from localStorage
3. Fetch fresh remote, compare versions
4. Only update if version changed
```

**localStorage keys**: `rpv:remoteCache`, `rpv:remoteVersion`

### Event Tracking
Uses custom events via `window.dispatchEvent` with `rpv_event` pattern—placeholders for GA/Facebook pixel integration.

## Development Workflows

### Start Dev Server
```bash
npm start  # Opens http://localhost:3000
```

### Build for Production
```bash
npm run build  # Output to /build
```

### Testing
```bash
npm test  # Interactive watch mode
```

## Project-Specific Conventions

### Prompt Field Fallbacks
When building full prompts, missing fields use sensible defaults:
- No `audience`? → `"[buyer/seller/investor/agent type in [market]]"`
- No `inputs`? → Generic KPI/tools/timeline template
- Missing `constraints`? → "≤ 400 words; use headings; avoid guarantees; fair-housing safe"

**When adding prompts**: include at minimum `title`, `quick`, `role`—the rest can default.

### Module Display Names
Strip the prefix for UI:
```typescript
displayName("Module 1 — Lead Generation") // → "Lead Generation"
```

### Adding New Modules
1. Add module title to `MODULE_TITLES` array (index-based)
2. Create prompt array (e.g., `const M13 = [...]`)
3. Add to `prompts` export at bottom of `prompts.ts`
4. Add category card to `CATEGORY_CARDS` in `AIPromptVault.tsx`
5. Optionally add label overrides in `labelOverrides.ts`

### Inline Styles Pattern
This project uses **inline styles exclusively**—no CSS modules, no styled-components. All styling is in `style={{...}}` objects. When styling:
- Use camelCase property names (`marginBottom`, not `margin-bottom`)
- Include hover states via `onMouseEnter`/`onMouseLeave` handlers
- Responsive design via `minmax()` in grid templates

## External Dependencies

### Google Apps Script Integration
- **URL**: Hardcoded `REMOTE_JSON_URL` in `AIPromptVault.tsx`
- **Expected payload**: `{ version?: string, modules?: Record<string, RemotePrompt[]> }`
- **Module matching**: Uses fuzzy matching via `findModuleKey()` to map remote module names to local

### No Backend Required
Entirely client-side. Remote prompts are a nice-to-have enhancement—app works without them.

## Testing Considerations
- Uses `@testing-library/react` and Jest
- No existing tests in repo—when adding, test prompt builder logic and remote merge function

## Common Tasks

### Add a new prompt to existing module
```typescript
// In src/prompts.ts, add to relevant array (M1-M12):
{
  title: "Your Prompt Title",
  quick: "Brief summary shown in UI",
  role: "AI persona for this prompt",
  // Other fields optional—will use defaults
}
```

### Change category card appearance
Edit `CATEGORY_CARDS` array in `AIPromptVault.tsx`:
- `label`: Button text
- `emoji`: Icon
- `tagline`: Subtext
- `moduleKey`: Must match `"Module X — ${MODULE_TITLES[X-1]}"`

### Update prompt expansion template
Modify `buildFullPrompt()` function—this controls the structure of copied text. Keep "Role & Outcome" at top for consistency.

## Fair Housing & Compliance
Prompts include compliance guardrails:
- Default constraints mention "fair-housing safe"
- Risk check section warns about protected-class targeting
- When creating new prompts, never suggest demographic targeting

## Notes for AI Agents
- **Duplicated structure**: There's both `/src` and `/ai-prompt-vault/src`—work in `/src` (root-level)
- **Read before edit**: Always read `prompts.ts` structure before adding—maintain array pattern
- **Version checking**: If modifying remote logic, preserve version-based cache invalidation
- **Don't break the clipboard**: Test `navigator.clipboard` fallback when changing copy logic
