# Knowledge Refresh Workflow

Keep the GPT’s knowledge file (`prompts-export.json`) synchronized with the in-app prompt library.

## When to Run
- After adding, removing, or significantly editing prompts in `src/prompts.ts`
- Before a public marketing push or feature launch
- Monthly (routine hygiene)

## Steps (2–3 minutes)
1. Install deps (if needed): `npm install`
2. Run export script:
   ```bash
   npm run export:prompts
   ```
3. Inspect diff:
   - Check `totalPrompts` increased/decreased as expected
   - Spot-check a new prompt’s fields (title, quick, role, deliverable, success)
4. Upload fresh `prompts-export.json` in GPT Builder → Knowledge
5. Test retrieval:
   - Ask: “Show me prompts for [category]”
   - Trigger one new/modified prompt by title
6. Update launch docs if prompt count changed (e.g. `LAUNCH_NOW_GUIDE.md`)

## Validation Checklist
- `totalPrompts` matches count you expect
- No truncated strings (scan for escaped quotes or missing closing quotes)
- Category names unchanged (consistency helps retrieval)
- New prompt appears when searching by a unique word in its title

## Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| Prompt missing in GPT | Export not refreshed or upload failed | Re-run export & re-upload, refresh GPT Builder |
| Count mismatch | Manual edit to JSON or removal without export | Always regenerate via script |
| Retrieval is generic | Instructions need reinforcement | Strengthen personalization section in GPT instructions |
| Duplicate IDs | Regex edge case | Ensure each prompt has unique title; rerun export |

## Notes
- Export script uses regex; it’s fast but not a TypeScript AST. Avoid multiline string literals with backticks for prompt fields or the regex may miss them.
- If you add new fields in the future (e.g. `tags`, `difficulty`), update `scripts/export-prompts.js` accordingly.

## Next Improvements (optional)
- Add automated diff summary in CI
- Validate schema (JSON Schema + quick check)
- Include `tags` array in export for richer GPT filtering

---
Last updated: {{DATE}}
