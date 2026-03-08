import Anthropic from "@anthropic-ai/sdk";
import { buildStyleSeed } from "@/lib/tags";
import { MASTER_PROMPT } from "@/lib/master_prompt";

export async function POST(req: Request) {
  const { theme, shortsVersion, sadBanger } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const styleSeed = buildStyleSeed();

  const modifiers: string[] = [];
  if (shortsVersion) {
    modifiers.push(
      "SHORTS VERSION: Structure kie_lyrics for short-form video (60 seconds max). " +
      "Start with the Hook immediately at 0s — NO intro buildup. " +
      "Format: [Hook Intro] → [Verse 1] (10s) → [Drop] → [Outro]. " +
      "First line must grab attention in under 3 seconds."
    );
  }
  if (sadBanger) {
    modifiers.push(
      "SAD BANGER STRUCTURE: Upbeat groove (115–122 BPM, danceable) but bittersweet/melancholic lyrics. " +
      "Like Harry Styles 'As It Was' but Afro House — happy feet, heavy heart. " +
      "Chorus feels euphoric musically but lyrically about longing, loss, or distance."
    );
  }

  const userMessage = [
    `Generate a track concept. Theme: ${theme}.`,
    `Use this style seed as the foundation for kie_style: [${styleSeed}].`,
    "Refine it: keep genre/instrument/mood tags that fit, replace generic ones,",
    "add humanizing tags (Raw/Vinyl crackle/Live recording feel/Breathy) and 'Black Coffee style' reference.",
    "Final kie_style must be under 200 chars.",
    ...modifiers,
    "Return ONLY the JSON object — no markdown fences, no explanation.",
  ].join(" ");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: MASTER_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    // Strip markdown fences if Claude adds them despite instructions
    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const data = JSON.parse(clean);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
