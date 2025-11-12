Design system & visual spec for AI Prompt Vault

Overview
- Goal: clean, friendly, and trustworthy UI focused on scannability and fast task completion.
- Fonts: Inter (variable), weights 400/600/700/800 for body/semibold/bold/extra-bold.

Color tokens (CSS variables)
- --bg: #f8fafc (page background)
- --surface: #ffffff (card surface)
- --text: #071235 (primary text)
- --muted: #6b7280 (secondary text)
- --primary: #2563eb (brand primary blue)
- --accent: #06b6d4 (teal accent)

Spacing scale
- --space-1: 4px
- --space-2: 8px
- --space-3: 12px
- --space-4: 16px
- --space-5: 24px

Radii & elevation
- --radius-sm: 8px
- --radius-md: 12px
- --radius-pill: 999px
- Shadows: subtle layered shadows: --shadow-sm, --shadow-md, --shadow-lg

Typography
- H1: 28px / 36px, 800 weight
- H2: 20px / 28px, 700 weight
- Body: 14px / 20px, 400 weight
- Small / muted: 12px / 18px, 400 weight, color --muted

Components
- Category Card
  - Layout: left emoji (18px), bold label (15px/700-800), tagline (13px/400 muted)
  - Padding: 16px 18px, border-radius: 12px
  - Border: 1px solid rgba(16,24,40,0.06)
  - Hover: translateY(-3px), shadow --shadow-md
  - Active: subtle gradient + 3px outline using rgba(--primary, 0.08)

- Primary Button (.rpv-btn-primary)
  - Height: 42px, padding 0 16px, border-radius: 999px
  - Background: --primary, color: white, font-weight: 600
  - Hover: slightly darker background; Focus: 3px ring (16% alpha)

- Secondary / Ghost (.rpv-btn-ghost)
  - Transparent bg, muted text, 1px transparent border

- Prompt Panel
  - Surface: white, border-radius 12px, subtle shadow
  - Title: 18px / 800
  - Body: pre-wrap text, 14px, muted color for metadata
  - Actions: pill primary for "Copy prompt", secondary for "Save"

Motion
- Use .motion-fade-up for entrance (200-220ms)
- Hover lift: translateY(-3px) + shadow
- Shimmer skeleton for loading lists
- Respect prefers-reduced-motion

Accessibility
- Contrast: ensure primary text >= 4.5:1 vs surface
- Focus: visible 3px ring for interactive controls
- Keyboard: all interactive elements reachable; modal focus trap implemented

Metrics to measure post-change
- Copies per session (primary)
- Time to first copy
- Favorites saved
- Onboarding completion

Notes
- When implementing, extract repeated sizes/colors into variables in CSS (we added these already).
- Keep emoji for friendly tone; consider replacing with single-color SVGs for consistency.
