// Simple serverless handler for generating prompt variations.
// If OPENAI_API_KEY is set in the environment, this will proxy to OpenAI's completions endpoint.
// Otherwise it returns a safe rule-based set of variations.

async function aiVariations(prompt: string): Promise<string[]> {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY?.trim();
  if (key) {
    // Try up to 3 times with exponential backoff
    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a helpful assistant that rewrites prompts for real-estate agents." },
              { role: "user", content: `Create 3 high-quality variations of this prompt: ${prompt}` },
            ],
            max_tokens: 600,
            temperature: 0.8,
          }),
        });

        // Handle rate limits explicitly
        if (res.status === 429) {
          const wait = Math.pow(2, attempt) * 500;
          await new Promise((r) => setTimeout(r, wait));
          attempt++;
          continue;
        }

        if (!res.ok) {
          const txt = await res.text();
          console.warn("OpenAI response not ok:", txt);
          throw new Error("OpenAI request failed");
        }
        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content;
        if (!content) throw new Error("No completion content");
        const parts = content.split(/\n\s*\n/).filter(Boolean).slice(0, 3);
        return parts.length ? parts : [content];
      } catch (e) {
        console.warn("AI variations attempt failed:", attempt, e);
        attempt++;
        const wait = Math.pow(2, attempt) * 400;
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    console.warn("AI variations failed after retries, falling back to local rules");
  }

  // Fallback rule-based variations
  const short = prompt.replace(/\n/g, " ").slice(0, 400) + (prompt.length > 400 ? "..." : "");
  const ad = `Ad-style: ${short}`;
  const formal = `${prompt}\n\nTone: Formal, professional.`;
  return [short, ad, formal];
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const prompt = body?.prompt || "";
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    const variations = await aiVariations(prompt);
    return res.status(200).json({ variations });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
