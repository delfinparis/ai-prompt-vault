Design Moodboard — AI Prompt Vault

Goal

Create a one-page moodboard with 6–8 examples to guide visual language for the AI Prompt Vault: approachable, professional, minimal, high-contrast CTAs, card-based content, quick scanning for real-estate agents.

Selected examples (links + short rationale)

1. Zillow — https://www.zillow.com/
   - Rationale: Real-estate native, clear hero CTAs, readable typography, strong use of cards for property summaries, bold primary action color (blue).

2. Airbnb — https://www.airbnb.com/
   - Rationale: Friendly microcopy, generous spacing, use of rounded cards and subtle shadows, emphasis on photography and short guides.

3. Notion — https://www.notion.so/
   - Rationale: Minimal typographic hierarchy, calm neutral palette, clean card surfaces, and compact utility chrome—good model for knowledge tools.

4. Stripe (marketing) — https://stripe.com/
   - Rationale: Crisp typographic scale, token-driven design, clear CTAs and spacing rhythm; excellent for professional tone with accessible contrast.

5. Inter UI examples / Figma community — https://rsms.me/inter/
   - Rationale: Typeface choice (Inter), legibility at small sizes, variable fonts for responsive weight.

6. Front / Intercom messaging surfaces — https://www.frontapp.com/ & https://www.intercom.com/
   - Rationale: Clear action buttons, conversational microcopy, approachable color accents for CTAs.

7. Canva templates gallery — https://www.canva.com/
   - Rationale: Card browsing UX, lightweight filters/pills, and preview-first layout patterns.

Patterns & takeaways

- Tone: friendly, pragmatic, action-oriented. Short microcopy with verbs: "Get tailored prompts", "Copy prompt", "Save".
- Cards: subtle radii (8–12px), soft shadow, white surface on neutral background, 12–16px internal padding, left-aligned content and a small emoji/icon.
- Typography: Inter as the primary UI font; scale: 14px base, 16–20px headings; weights: 400/600/800 for clarity.
- Colors: neutral background (#f7fafc / #f3f4f6), surface (#ffffff), primary accent (muted indigo or teal), muted text (#6b7280), strong dark for headings (#0f172a).
- CTAs: Primary button filled with accent color & white text; ghost buttons with thin borders; pill-shaped inputs and selects.
- Motion: short, subtle fade/translate for cards, skeleton shimmer for loading, respect prefers-reduced-motion.
- Controls: pill filters/intent chips near the top; show/hide toggles and "Show all" affordance when content is collapsed.

Suggested tokens

- --bg: #f7fafc
- --surface: #ffffff
- --text: #0f172a
- --muted: #6b7280
- --primary: #4f46e5 (indigo-600)
- --primary-contrast: #ffffff
- --radius: 10px
- --shadow-sm: 0 1px 2px rgba(16,24,40,0.04)
- --shadow-md: 0 6px 18px rgba(16,24,40,0.06)

Next steps

- Wire tokens into `src/AIPromptVault.css` and replace remaining inline styles in `src/AIPromptVault.tsx`.
- Replace emoji icons with single-color SVGs (optional) for a polished look.
- Add targeted UI tests for `visibleCategoryCards` and `computeTopPicks` logic.

Notes

This moodboard is intentionally minimal — it's a lightweight guide to align the visual polish with the product goals for real-estate agents: speed, clarity, and action. If you'd like, I can create a small Figma starter frame that mirrors `AIPromptVault` page layout next.