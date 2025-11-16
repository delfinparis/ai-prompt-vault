import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error(
    "[generate-call-script] Missing OPENAI_API_KEY. Did you set it in .env.local?"
  );
}

const client = new OpenAI({
  apiKey,
});

const SYSTEM_PROMPT = `
You are an empathetic real estate coaching assistant that helps agents overcome call reluctance
and reconnect with their past clients and sphere.

Your job is to:
1. Acknowledge the agent's emotional state (guilt, anxiety, embarrassment, etc.) in a subtle way.
2. Generate a simple, human, non-salesy script for calling or texting a specific person.
3. Make the scripts feel warm, low-pressure, and sincere.
4. Avoid sounding like a robot or generic marketing copy.
5. Never shame the agent. Normalize their delay and focus on the present moment.
6. When appropriate, include a natural, soft segue into real estate or referrals,
   but only AFTER genuine reconnection.

Always:
- Use casual, conversational language.
- Keep scripts short and easy to say out loud.
- Avoid jargon, hype, and hard closes.
- Never mention that you are an AI or model.
`;

function buildUserPrompt(input: {
  emotion?: string;
  blockReason?: string;
  fearStory?: string;
  actionType: string;
  contactName: string;
  contactNotes?: string;
  agentTone?: string;
}) {
  const {
    emotion,
    blockReason,
    fearStory,
    actionType,
    contactName,
    contactNotes,
    agentTone,
  } = input;

  return `
The agent is about to reach out to a past client from their sphere.

CONTEXT ABOUT THE CALL:
- Contact name: ${contactName || "the client"}.
- Notes about them: ${contactNotes || "no extra notes provided"}.

EMOTIONAL STATE & BLOCK:
- Main block reason: ${blockReason || "not specified"}.
- Main emotion: ${emotion || "not specified"}.
- Story their brain tells them: ${fearStory || "not specified"}.

CALL TYPE:
- The agent wants to do a: ${actionType} (call, text message, or voicemail).

TONE:
- The agent's natural tone: ${agentTone || "friendly and conversational"}.

TASK:
1. Generate a short, natural ${actionType} script that:
   - Acknowledges that it's been a while in a light, honest way (if relevant).
   - Feels like a human reconnecting, not a sales pitch.
   - Would feel comfortable even if the agent is shy or anxious.
   - Uses any useful context from the notes.

2. Generate an alternative TEXT MESSAGE they can send instead of calling, if they get stuck.

3. Generate a short VOICEMAIL script if they reach voicemail.

4. Generate 3 brief CONVERSATION PROMPTS they can use if the call goes well (e.g., life updates, local happenings).

5. Generate 1 natural REFERRAL SEGUE they can use ONLY if the conversation feels good—make it soft, not pushy.

IMPORTANT:
- Keep each script under 80–100 words.
- Make it 100% okay that they haven't called in a long time.
- Avoid apologizing too heavily; one light acknowledgment is enough.
- Never sound like a sales script; sound like a human, helpful agent.
- Don't include labels like "Call Script:" in the text itself; we will label them in the UI.

Return your response as JSON with these keys:
- call_script
- text_script
- voicemail_script
- conversation_prompts (array of strings)
- referral_segue
`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!apiKey) {
    res.status(500).json({
      error:
        "OPENAI_API_KEY is not set on the server. Add it to .env.local and restart `vercel dev`.",
    });
    return;
  }

  try {
    const {
      emotion,
      blockReason,
      fearStory,
      actionType,
      contactName,
      contactNotes,
      agentTone,
    } = req.body || {};

    if (!contactName || !actionType) {
      res.status(400).json({
        error: "Missing required fields: contactName, actionType",
      });
      return;
    }

    const userPrompt = buildUserPrompt({
      emotion,
      blockReason,
      fearStory,
      actionType,
      contactName,
      contactNotes,
      agentTone,
    });

    console.log("[generate-call-script] Calling OpenAI for:", {
      contactName,
      actionType,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini", // align with how you're using OpenAI elsewhere
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let json: any;

    try {
      json = JSON.parse(content);
    } catch (e) {
      console.error(
        "[generate-call-script] Failed to parse JSON, returning raw content",
        e
      );
      json = {
        call_script: content,
        text_script: "",
        voicemail_script: "",
        conversation_prompts: [],
        referral_segue: "",
      };
    }

    res.status(200).json(json);
  } catch (err: any) {
    console.error("[generate-call-script] Error:", err);
    res.status(500).json({
      error:
        err?.message || "Failed to generate script due to a server error.",
    });
  }
}