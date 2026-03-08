// Port of tags_database.py — afro_house section only

export const THEME_POOL = [
  { label: "Fire", value: "fire, night, heat, movement" },
  { label: "Rain", value: "rain, water, rivers, cleansing" },
  { label: "Ancestors", value: "ancestors, memory, roots, soil" },
  { label: "City", value: "city lights, longing, distance, travel" },
  { label: "Love", value: "love, touch, warmth, presence" },
  { label: "Dawn", value: "dawn, hope, new beginnings, light" },
  { label: "Loss", value: "loss, grief, acceptance, healing" },
  { label: "Joy", value: "celebration, joy, freedom, dance" },
  { label: "Stillness", value: "silence, meditation, breath, stillness" },
  { label: "Resilience", value: "strength, resilience, survival, pride" },
];

const AFRO_HOUSE = {
  genre_tags: [
    "afro house", "south african deep house", "deep house",
    "tribal house", "afro tech", "organic house",
  ],
  mood_tags: [
    "hypnotic", "spiritual", "dark", "meditative",
    "underground", "atmospheric", "soulful", "mysterious",
  ],
  instrument_tags: [
    "log drum bass", "tribal shaker", "synthesizer pads",
    "four-on-floor kick", "filtered vocal chops",
    "organic bass", "congas", "djembe",
    "kalimba", "kora", "sine sub bass",
  ],
  production_tags: [
    "warm analog", "wide stereo", "heavy reverb",
    "organic textures", "deep mix", "cinematic",
  ],
  vibe_keywords: [
    "groovy", "tribal", "percussive", "spiritual",
    "hypnotic", "danceable",
  ],
};

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function buildStyleSeed(): string {
  const parts = [
    ...pick(AFRO_HOUSE.genre_tags, 2),
    ...pick(AFRO_HOUSE.mood_tags, 2),
    ...pick(AFRO_HOUSE.instrument_tags, 3),
    ...pick(AFRO_HOUSE.production_tags, 1),
    ...pick(AFRO_HOUSE.vibe_keywords, 1),
  ];
  return parts.join(", ");
}
