import { PromptItem, extractPlaceholders } from './promptUtils';
import { refinePlaceholders } from './AIPromptVault';

// Compute which placeholders are missing (empty or whitespace only)
export function computeMissingPlaceholders(prompt: PromptItem, fieldValues: Record<string, string>): string[] {
  const raw = extractPlaceholders(prompt);
  const refined = refinePlaceholders(raw, prompt.title);
  const missing = refined.filter((ph) => !(fieldValues[ph] && fieldValues[ph].trim()));
  // Deduplicate to be safe, though refinePlaceholders already dedupes
  return Array.from(new Set(missing));
}
