import type { Genre, LyricTemplate } from './genres';

const LYRIC_STRUCTURES: Record<LyricTemplate, string> = {
  chant: `LYRIC STRUCTURE — CHANT/LOOP (80–150 words total):
Minimal, hypnotic. One central phrase looped and evolved with small variations.
[Intro] — 2 lines setting the sonic mood (not the hook yet)
[Groove] — Central phrase establishes. Repeat 2–3 times with slight variation.
[Drop] — Full groove feeling. Phrase is most present and confident.
[Breakdown] — Strip to one voice. The phrase in its most naked form.
[Outro] — Elements fade. Phrase continues into the mix.
Performance tags: (whisper) (chant) (echo) (breathy)
THIS IS NOT A SONG WITH VERSES AND CHORUSES. It is a hypnotic incantation.`,

  'verse-hook': `LYRIC STRUCTURE — VERSE/HOOK (300–500 words):
Full song structure optimized for streaming. Hook arrives within 40 seconds.
[Intro Hook] — 1 memorable line. The whole song in one phrase.
[Verse 1] — 8 lines, first-person narrative, specific imagery and location reference.
[Pre-Chorus] — 4 lines, emotional escalation, energy rising.
[Chorus] — 4–6 lines, singable, contains the song title phrase.
[Verse 2] — Same structure, new detail, deeper in the story.
[Bridge] — 4–8 lines, rap-style or spoken, emotional turn or revelation.
[Chorus] — Repeat with variations.
[Outro] — Chorus fades with ad-libs.
LANGUAGE: Local language in verses, English in chorus with 1–2 local words as hook texture.`,

  'call-response': `LYRIC STRUCTURE — CALL & RESPONSE (200–300 words):
[Opening Wail] — 2 lines of pure emotion. No narrative yet. Set the emotional territory.
[Verse 1] — 4 lines, poetic imagery (longing, loss, love). Write in target dialect.
[Response] — 2 lines, backing vocal echo or contrast. Shorter, affirmative.
[Verse 2] — 4 lines, escalation of feeling. More specific, more painful/joyful.
[Chant Break] — Repetitive syllabic section (sah-sah, yah-yah, or culturally appropriate equivalent). This is the emotional peak.
[Verse 3] — 4 lines, resolution, surrender, or defiance.
[Outro] — Fade on chant with ornamented vocal.
Mark Arabic/ornamental melodic decoration with (melisma) or (ornament).`,

  cyclical: `LYRIC STRUCTURE — CYCLICAL/RITUAL (60–100 words total — repetition IS the structure):
Ancient ceremonial format. Words should feel elemental and spare.
[Invocation] — Name the spirit, color, or intention. 2 lines. Set the sacred frame.
[Chant 1] — 2 lines only. Write once, mark ×4. These will repeat four times.
[Break] — [guembri solo] or [krakeb break] — notation only, no words.
[Chant 2] — 2 new lines. Deeper, more specific. Mark ×4.
[Peak] — All voices together. Single phrase. The most essential statement.
[Return] — Chant 1 again. Mark as "slower, cooling."
FEWER WORDS = MORE POWER. Do not add narrative complexity.`,

  narrative: `LYRIC STRUCTURE — NARRATIVE/STORYTELLING (280–420 words):
Place-grounded storytelling. Specific location is essential.
[Intro] — 2 lines setting the scene. Name a SPECIFIC place (city, river, neighborhood, landmark).
[Verse 1] — 6–8 lines, local language narrative. Romantic, social, or reflective theme.
[Hook] — 4 lines, melodic and catchy, contains the song title. This repeats.
[Verse 2] — 6–8 lines, deepening the story. New detail, emotional development.
[Hook] — Repeat.
[Bridge] — 4 lines, emotional peak. Can shift to English if crossing languages.
[Outro Hook] — Hook fades with variations.
PRIMARY LANGUAGE: African language for verses, hook can be bilingual.`,

  'rapid-fire': `LYRIC STRUCTURE — RAPID-FIRE/STREET (250–400 words):
[Rapid Intro Verse] — 8 lines delivered FAST. Street storytelling, social commentary, humor.
[Drop Chant] — 2 words maximum. Crowd shout. Write once, mark ×4.
[Verse 2] — 8 lines fast. Specific references, callouts, escalation.
[Drop Chant] — Same or variation.
[Bridge] — 4 lines SLOWER. Emotional core beneath the chaos.
[Rapid Outro] — Escalating speed back to full energy.
LANGUAGE: Street dialect, colloquial, not formal. Humor is welcome.`,
};

export function buildSystemPrompt(
  primary: Genre,
  accent: Genre | null,
  language: string,
): string {
  const accentBlock = accent
    ? `
## ACCENT GENRE: ${accent.name}
${accent.culturalDNA}

FUSION RULE — DOMINANT/ACCENT ARCHITECTURE:
${primary.name} is the DOMINANT genre: rhythm, structure, BPM, and primary instruments all come from ${primary.name}.
${accent.name} is the ACCENT: introduce exactly ONE signature element from ${accent.name} that feels like a discovery within the ${primary.name} track — not a label, not a category. The accent element should be felt before it is identified. Think: what would happen if a ${primary.name} producer spent a month immersed in ${accent.name} culture and let one thing slip in?

Do NOT blend both genres equally. Do NOT just list both genre names in the kie_style. Show the instruments.`
    : '';

  const styleBlock = accent
    ? `## KIE_STYLE FOR FUSION
Lead with ${primary.name} genre/instrument tags (the dominant identity).
Then add 1–2 specific ${accent.name} instrument or texture tags (the accent discovery).
Do NOT just list genre names — name actual instruments and textures.
Max 200 characters total. Include BPM. Include humanizing tags (Raw / Breathy / Live recording feel / Warm).
Reference a key artist: ${primary.referenceArtists[0]} style.`
    : `## KIE_STYLE
Build from these tags as a starting pool: ${primary.styleTags.join(', ')}
Format: genre tags → specific instruments → mood/texture → BPM → vocal style.
Max 200 characters. Name specific instruments. Add humanizing tags: Raw, Live recording feel, Breathy, Warm.
Reference artist style where authentic: ${primary.referenceArtists[0]} style.`;

  return `You are a music producer and cultural authority with deep expertise across all African and Afro-diasporic music traditions.

## PRIMARY GENRE: ${primary.name}
Region: ${primary.region.toUpperCase()} Africa | BPM: ${primary.bpm[0]}–${primary.bpm[1]} | Language: ${language || primary.defaultLanguage}
Reference Artists: ${primary.referenceArtists.join(', ')}

### Cultural DNA
${primary.culturalDNA}

### Hit Formula for This Genre
${primary.hitFormula}
${accentBlock}

## LYRIC STRUCTURE
${LYRIC_STRUCTURES[primary.lyricTemplate]}

${styleBlock}

## LANGUAGE GUIDANCE
Primary language: ${language || primary.defaultLanguage}
- Write in romanized transliteration for non-Latin scripts (Darija, Lingala, etc.) — not Arabic script
- For bilingual tracks: primary language in verses, English in chorus with 1–2 local words as texture
- Code-switching is a FEATURE — the moment language shifts is emotionally charged; use it intentionally
- Phonetic warmth matters: Swahili's open vowels, Yoruba's tonal rhythm, Darija's French bleed-in, Lingala's flowing musicality, Portuguese's rounded warmth

## GLOBAL CROSSOVER FORMULA
- ONE specific African location per verse (makes the universal feel grounded)
- Specific-Universal imagery: "Lagos at 3am" > "the city at night"
- Controlled vulnerability: emotionally exposed vocal over rhythmically locked groove
- The track should feel like an INVITATION not an assertion — global listeners should feel they discovered something
- Hook: 3–6 syllables, works without music, could trend on a short-form video
- Polyrhythm as premium signal: subtle rhythmic complexity felt before heard

## OUTPUT
Return ONLY valid JSON — no markdown fences, no explanation:
{
  "title": string (evocative, 1–3 words, African language or poetic English),
  "bpm": number (within ${primary.bpm[0]}–${primary.bpm[1]}),
  "key": string (minor preferred: Db minor, Ab minor, Eb minor, F minor, A minor),
  "mood": string (2–4 adjectives),
  "kie_style": string (under 200 chars, comma-separated style tags),
  "kie_lyrics": string (under 4500 chars, structured with metatags),
  "concept": string (2–3 sentence production summary)
}`;
}

export function buildUserMessage(
  theme: string,
  shortsVersion: boolean,
  sadBanger: boolean,
  usedTitles: string[],
): string {
  const forbidden = usedTitles.length ? `FORBIDDEN titles (do not repeat): ${usedTitles.join(', ')}.` : '';
  const mods: string[] = [];

  if (shortsVersion) {
    mods.push(
      'SHORTS VERSION: Structure kie_lyrics for short-form video (60 seconds max). Hook at 0s — NO intro buildup. Format: [Hook Intro] → [Verse 1] (10s) → [Drop] → [Outro]. First line must grab attention within 3 seconds.',
    );
  }
  if (sadBanger) {
    mods.push(
      'SAD BANGER: Upbeat groove (danceable) but bittersweet/melancholic lyrics. Happy feet, heavy heart. Chorus feels euphoric musically but lyrically about longing, loss, or distance.',
    );
  }

  return [
    `Generate a track concept. Lyric theme: ${theme}.`,
    forbidden,
    ...mods,
    'Return ONLY the JSON object — no markdown, no explanation.',
  ].filter(Boolean).join(' ');
}
