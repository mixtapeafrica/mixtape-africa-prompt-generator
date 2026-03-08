import Anthropic from '@anthropic-ai/sdk';
import { getGenreByKey } from '@/lib/genres';
import { buildSystemPrompt, buildUserMessage } from '@/lib/prompts';

export async function POST(req: Request) {
  const { primaryGenreKey, accentGenreKey, language, theme, shortsVersion, sadBanger } =
    await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

  const primary = getGenreByKey(primaryGenreKey);
  if (!primary) return Response.json({ error: 'Unknown genre' }, { status: 400 });

  const accent = accentGenreKey ? (getGenreByKey(accentGenreKey) ?? null) : null;

  const client = new Anthropic({ apiKey });
  const system = buildSystemPrompt(primary, accent, language);
  const user = buildUserMessage(theme, shortsVersion, sadBanger, []);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const data = JSON.parse(clean);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
