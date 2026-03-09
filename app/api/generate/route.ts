import Anthropic from '@anthropic-ai/sdk';
import { getGenreByKey } from '@/lib/genres';
import { buildSystemPrompt, buildUserMessage } from '@/lib/prompts';

export async function POST(req: Request) {
  const { primaryGenreKey, accentGenreKey, language, theme, shortsVersion, sadBanger, count = 1 } =
    await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

  const primary = getGenreByKey(primaryGenreKey);
  if (!primary) return Response.json({ error: 'Unknown genre' }, { status: 400 });

  const accent = accentGenreKey ? (getGenreByKey(accentGenreKey) ?? null) : null;
  const client = new Anthropic({ apiKey });
  const system = buildSystemPrompt(primary, accent, language);

  const batchCount = Math.min(Math.max(1, count), 4);
  const results = [];
  const usedTitles: string[] = [];

  for (let i = 0; i < batchCount; i++) {
    const user = buildUserMessage(theme, shortsVersion, sadBanger, usedTitles);
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
      usedTitles.push(data.title);
      results.push({ ...data, _index: i + 1 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      results.push({ error: message, _index: i + 1 });
    }
  }

  if (batchCount === 1) return Response.json(results[0]);
  return Response.json({ batch: results });
}
