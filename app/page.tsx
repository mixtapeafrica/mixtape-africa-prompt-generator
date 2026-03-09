"use client";

import { useEffect, useRef, useState } from "react";
import {
  REGIONS,
  GENRES,
  THEME_POOL,
  LANGUAGE_OPTIONS,
  DEFAULT_CHANNELS,
  getGenresByRegion,
  getFusionScore,
  type Genre,
  type RegionKey,
  type ChannelProfile,
} from "@/lib/genres";

// ── Helpers ──────────────────────────────────────────────────────────────────
async function copyText(text: string): Promise<"copied" | "select"> {
  if (navigator.share) {
    try { await navigator.share({ text }); return "copied"; } catch { /* cancelled */ }
  }
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return "copied"; } catch { /* fallthrough */ }
  }
  return "select";
}

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Sub-components ───────────────────────────────────────────────────────────
function OutputBox({ label, value, charLimit, rows }: { label: string; value: string; charLimit: number; rows: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "select">("idle");
  const handleCopy = async () => {
    const r = await copyText(value);
    setState(r);
    setTimeout(() => setState("idle"), 2500);
  };
  return (
    <div className="rounded-xl bg-[#141414] border border-[#2A2A2A] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
        <span className="text-xs tracking-widest text-[#666] uppercase">{label}</span>
        <button onClick={handleCopy} className={`text-xs px-3 py-1 rounded border transition-colors ${state === "copied" ? "border-[#FFB400] text-[#FFB400]" : state === "select" ? "border-blue-500 text-blue-400" : "border-[#2A2A2A] text-[#888] hover:border-[#FFB400] hover:text-[#FFB400]"}`}>
          {state === "copied" ? "Copied!" : state === "select" ? "Tap to copy" : "Copy"}
        </button>
      </div>
      <div className="px-4 py-3">
        <textarea ref={ref} readOnly value={value} rows={rows} className="w-full bg-transparent text-sm text-[#E8E8E8] leading-relaxed font-mono resize-none outline-none selection:bg-[#FFB400]/30" />
        <p className="text-xs text-[#444] mt-1">{value.length} / {charLimit} chars</p>
      </div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-full text-left p-3 rounded-lg border transition-all ${checked ? "border-[#FFB400] bg-[#FFB400]/10" : "border-[#2A2A2A] bg-[#141414]"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${checked ? "text-[#FFB400]" : "text-[#E8E8E8]"}`}>{label}</span>
        <div className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${checked ? "bg-[#FFB400]" : "bg-[#2A2A2A]"}`}>
          <div className={`w-3 h-3 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
        </div>
      </div>
      <p className="text-xs text-[#666] mt-0.5">{description}</p>
    </button>
  );
}

function GenreCard({ genre, selected, role, onSelect }: { genre: Genre; selected: boolean; role?: "primary" | "accent"; onSelect: () => void }) {
  const accent = role === "accent";
  return (
    <button onClick={onSelect} className={`text-left p-3 rounded-xl border transition-all ${selected ? (accent ? "border-[#4B5FD5] bg-[#4B5FD5]/10" : "border-[#FFB400] bg-[#FFB400]/10") : "border-[#2A2A2A] bg-[#141414] hover:border-[#FFB400]/40"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{genre.emoji}</span>
        <span className={`text-sm font-semibold ${selected ? (accent ? "text-[#4B5FD5]" : "text-[#FFB400]") : "text-[#E8E8E8]"}`}>{genre.name}</span>
      </div>
      <p className="text-xs text-[#555]">{genre.tagline}</p>
      <p className="text-xs text-[#444] mt-1">{genre.bpm[0]}–{genre.bpm[1]} BPM</p>
    </button>
  );
}

function FusionBadge({ score, note }: { score: number; note: string }) {
  const stars = "★".repeat(score) + "☆".repeat(5 - score);
  const color = score >= 4 ? "text-[#FFB400]" : score === 3 ? "text-orange-400" : "text-[#666]";
  return (
    <div className={`mt-2 px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-xs ${color}`}>
      <span className="font-mono">{stars}</span> <span className="text-[#888]">{note}</span>
    </div>
  );
}

interface TrackResult {
  title: string; bpm: number; key: string; mood: string;
  kie_style: string; kie_lyrics: string; concept: string;
  _index?: number; error?: string;
}

function ResultCard({ result, primaryGenre, accentGenre, fusionMode, defaultOpen }: {
  result: TrackResult; primaryGenre: Genre | null; accentGenre: Genre | null;
  fusionMode: boolean; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (result.error) {
    return <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">Track {result._index}: {result.error}</div>;
  }
  return (
    <div className="rounded-xl bg-[#141414] border border-[#2A2A2A] overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full text-left px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#FFB400]">{result.title}</h3>
          <p className="text-xs text-[#666] mt-0.5">{result.mood}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <span className="text-xs bg-[#1E1E1E] border border-[#2A2A2A] rounded px-2 py-1 text-[#999]">{result.bpm} BPM</span>
            <span className="text-xs bg-[#1E1E1E] border border-[#2A2A2A] rounded px-2 py-1 text-[#999]">{result.key}</span>
          </div>
          <span className="text-[#555] text-lg">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#1E1E1E] pt-3">
          {primaryGenre && (
            <span className="inline-block text-xs bg-[#1E1E1E] border border-[#FFB400]/30 rounded px-2 py-1 text-[#FFB400]/80">
              {primaryGenre.name}{accentGenre && fusionMode ? ` × ${accentGenre.name}` : ""}
            </span>
          )}
          {result.concept && <p className="text-xs text-[#666] leading-relaxed">{result.concept}</p>}
          <OutputBox label="Style Tags" value={result.kie_style} charLimit={200} rows={3} />
          <OutputBox label="Lyrics" value={result.kie_lyrics} charLimit={4500} rows={16} />
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  // Channel
  const [channels] = useState<ChannelProfile[]>(DEFAULT_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>("rooftop");
  const activeChannel = channels.find(c => c.id === activeChannelId) ?? channels[0];

  // Genre
  const [activeRegion, setActiveRegion] = useState<RegionKey>(activeChannel.defaultRegion);
  const [primaryGenre, setPrimaryGenre] = useState<Genre | null>(null);
  const [fusionMode, setFusionMode] = useState(false);
  const [accentRegion, setAccentRegion] = useState<RegionKey>("south");
  const [accentGenre, setAccentGenre] = useState<Genre | null>(null);

  // Settings
  const [theme, setTheme] = useState(THEME_POOL[0]);
  const [language, setLanguage] = useState(activeChannel.defaultLanguage);
  const [customLanguage, setCustomLanguage] = useState("");
  const [shortsVersion, setShortsVersion] = useState(false);
  const [sadBanger, setSadBanger] = useState(false);
  const [count, setCount] = useState(1);

  // State
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TrackResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ results: TrackResult[]; genre: string; ts: number }>>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fusionInfo = fusionMode && primaryGenre && accentGenre
    ? getFusionScore(primaryGenre.key, accentGenre.key)
    : null;

  const effectiveLanguage = customLanguage.trim() || language;

  // Apply channel defaults when switching
  useEffect(() => {
    const ch = channels.find(c => c.id === activeChannelId);
    if (!ch) return;
    setActiveRegion(ch.defaultRegion);
    setLanguage(ch.defaultLanguage);
    setCustomLanguage("");
    const g = GENRES.find(g => g.key === ch.defaultGenreKey) ?? null;
    setPrimaryGenre(g);
    setFusionMode(false);
    setAccentGenre(null);
  }, [activeChannelId, channels]);

  const selectPrimary = (g: Genre) => {
    setPrimaryGenre(g);
    setCustomLanguage("");
    setLanguage(LANGUAGE_OPTIONS[g.region]?.[0] ?? "");
  };

  const surpriseMe = async () => {
    const g = rand(GENRES);
    const t = rand(THEME_POOL);
    const lang = rand(LANGUAGE_OPTIONS[g.region] ?? ["English"]);
    setPrimaryGenre(g);
    setActiveRegion(g.region);
    setTheme(t);
    setLanguage(lang);
    setCustomLanguage("");
    setFusionMode(false);
    setAccentGenre(null);
    // Trigger generation after state update
    await runGenerate(g, null, false, lang, t.value);
  };

  const runGenerate = async (
    pg: Genre | null,
    ag: Genre | null,
    fm: boolean,
    lang: string,
    themeValue: string,
  ) => {
    if (!pg) { setError("Pick a genre first."); return; }
    setLoading(true); setError(null); setResults([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryGenreKey: pg.key,
          accentGenreKey: fm && ag ? ag.key : null,
          language: lang,
          theme: themeValue,
          shortsVersion,
          sadBanger,
          count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const newResults: TrackResult[] = data.batch ? data.batch : [data];
      setResults(newResults);
      setHistory(prev => [{
        results: newResults,
        genre: `${pg.name}${fm && ag ? ` × ${ag.name}` : ""}`,
        ts: Date.now(),
      }, ...prev].slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const generate = () => runGenerate(primaryGenre, accentGenre, fusionMode, effectiveLanguage, theme.value);

  return (
    <main className="min-h-screen max-w-lg mx-auto px-4 py-8" suppressHydrationWarning>

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs tracking-widest text-[#FFB400] uppercase mb-1">Mixtape Africa</p>
        <h1 className="text-2xl font-bold text-[#E8E8E8]">Prompt Generator</h1>
        <p className="text-sm text-[#666] mt-1">Pan-African track concepts for Kie.ai / Suno</p>
      </div>

      {/* ── CHANNEL SWITCHER ── */}
      <section className="mb-6">
        <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Channel</h2>
        <div className="space-y-2">
          {channels.map(ch => (
            <button key={ch.id} onClick={() => setActiveChannelId(ch.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${activeChannelId === ch.id ? "border-[#FFB400] bg-[#FFB400]/10" : "border-[#2A2A2A] bg-[#141414] hover:border-[#FFB400]/30"}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{ch.emoji}</span>
                <div>
                  <p className={`text-sm font-semibold ${activeChannelId === ch.id ? "text-[#FFB400]" : "text-[#E8E8E8]"}`}>{ch.name}</p>
                  <p className="text-xs text-[#555]">{ch.description}</p>
                </div>
                {activeChannelId === ch.id && <span className="ml-auto text-xs text-[#FFB400] border border-[#FFB400]/40 rounded px-2 py-0.5">Active</span>}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section className="mb-5 flex gap-2">
        <button onClick={surpriseMe} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[#2A2A2A] text-[#888] hover:border-[#FFB400]/50 hover:text-[#FFB400] transition-all disabled:opacity-40">
          🎲 Surprise Me
        </button>
        <div className="flex border border-[#2A2A2A] rounded-xl overflow-hidden">
          {[1, 2, 4].map(n => (
            <button key={n} onClick={() => setCount(n)}
              className={`px-4 py-2.5 text-sm font-medium transition-all ${count === n ? "bg-[#FFB400] text-[#0D0D0D]" : "text-[#666] hover:text-[#E8E8E8]"}`}>
              {n}×
            </button>
          ))}
        </div>
      </section>

      {/* ── PRIMARY GENRE ── */}
      <section className="mb-5">
        <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Genre</h2>
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {REGIONS.map(r => (
            <button key={r.key} onClick={() => setActiveRegion(r.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeRegion === r.key ? "bg-[#FFB400] text-[#0D0D0D]" : "bg-[#141414] border border-[#2A2A2A] text-[#888]"}`}>
              {r.emoji} {r.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {getGenresByRegion(activeRegion).map(g => (
            <GenreCard key={g.key} genre={g} selected={primaryGenre?.key === g.key} role="primary" onSelect={() => selectPrimary(g)} />
          ))}
        </div>
      </section>

      {/* ── FUSION MODE ── */}
      <section className="mb-5">
        <button onClick={() => { setFusionMode(v => !v); setAccentGenre(null); }}
          className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-all ${fusionMode ? "border-[#4B5FD5] text-[#4B5FD5] bg-[#4B5FD5]/10" : "border-[#2A2A2A] text-[#666] hover:border-[#4B5FD5]/40"}`}>
          {fusionMode ? "✕ Remove Fusion" : "+ Fuse Genres (Dominant × Accent)"}
        </button>
        {fusionMode && (
          <div className="mt-3">
            <p className="text-xs text-[#666] mb-2">Accent — one element blends into the dominant genre</p>
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
              {REGIONS.map(r => (
                <button key={r.key} onClick={() => setAccentRegion(r.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${accentRegion === r.key ? "bg-[#4B5FD5] text-white" : "bg-[#141414] border border-[#2A2A2A] text-[#888]"}`}>
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {getGenresByRegion(accentRegion)
                .filter(g => g.key !== primaryGenre?.key)
                .map(g => (
                  <GenreCard key={g.key} genre={g} selected={accentGenre?.key === g.key} role="accent" onSelect={() => setAccentGenre(g)} />
                ))}
            </div>
            {fusionInfo && <FusionBadge score={fusionInfo.score} note={fusionInfo.note} />}
          </div>
        )}
      </section>

      {/* ── LANGUAGE ── */}
      <section className="mb-5">
        <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Language</h2>
        {primaryGenre && (
          <div className="flex flex-wrap gap-2 mb-3">
            {(LANGUAGE_OPTIONS[primaryGenre.region] ?? []).map(lang => (
              <button key={lang} onClick={() => { setLanguage(lang); setCustomLanguage(""); }}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${!customLanguage && effectiveLanguage === lang ? "border-[#FFB400] text-[#FFB400] bg-[#FFB400]/10" : "border-[#2A2A2A] text-[#888]"}`}>
                {lang}
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          value={customLanguage}
          onChange={e => setCustomLanguage(e.target.value)}
          placeholder="Custom mix, e.g. English + Swahili + French"
          className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#2A2A2A] text-sm text-[#E8E8E8] placeholder-[#444] outline-none focus:border-[#FFB400]/50"
        />
        {effectiveLanguage && (
          <p className="text-xs text-[#555] mt-1">Using: <span className="text-[#888]">{effectiveLanguage}</span></p>
        )}
      </section>

      {/* ── THEME ── */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs tracking-widest text-[#666] uppercase">Lyric Theme</h2>
          <button onClick={() => setTheme(rand(THEME_POOL))} className="text-xs text-[#555] hover:text-[#FFB400] transition-colors">🎲 Random</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {THEME_POOL.map(t => (
            <button key={t.value} onClick={() => setTheme(t)}
              className={`py-2 px-3 rounded-lg text-sm text-left transition-all ${theme.value === t.value ? "bg-[#FFB400] text-[#0D0D0D] font-medium" : "bg-[#141414] border border-[#2A2A2A] text-[#999]"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── STYLE MODES ── */}
      <section className="mb-6 space-y-2">
        <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Style Mode</h2>
        <Toggle label="Shorts Version" description="Hook-first 60s structure, drop at 8 seconds" checked={shortsVersion} onChange={setShortsVersion} />
        <Toggle label="Sad Banger" description="Upbeat groove, bittersweet lyrics — happy feet, heavy heart" checked={sadBanger} onChange={setSadBanger} />
      </section>

      {/* ── GENERATE ── */}
      {!primaryGenre && (
        <p className="text-center text-sm text-[#555] mb-4">Pick a genre above — or hit Surprise Me</p>
      )}
      <button onClick={generate} disabled={loading || !primaryGenre}
        className="w-full py-4 rounded-xl font-semibold text-base transition-all bg-[#FFB400] text-[#0D0D0D] hover:bg-[#FF6B00] disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {count > 1 ? `Generating ${count} tracks...` : "Generating..."}
          </span>
        ) : primaryGenre
          ? `Generate ${count > 1 ? `${count}× ` : ""}${primaryGenre.name}${fusionMode && accentGenre ? ` × ${accentGenre.name}` : ""}`
          : "Generate Track Concept"}
      </button>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">{error}</div>
      )}

      {/* ── RESULTS ── */}
      {results.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs tracking-widest text-[#666] uppercase">{results.length > 1 ? `${results.length} Tracks Generated` : "Track Generated"}</h2>
            <button onClick={generate} disabled={loading} className="text-xs text-[#555] hover:text-[#FFB400] transition-colors disabled:opacity-40">Regenerate</button>
          </div>
          {results.map((r, i) => (
            <ResultCard key={i} result={r} primaryGenre={primaryGenre} accentGenre={accentGenre} fusionMode={fusionMode} defaultOpen={i === 0} />
          ))}
        </div>
      )}

      {/* ── HISTORY ── */}
      {history.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowHistory(v => !v)} className="w-full flex items-center justify-between py-2 text-xs tracking-widest text-[#555] uppercase hover:text-[#888] transition-colors">
            <span>History ({history.length})</span>
            <span>{showHistory ? "▲" : "▼"}</span>
          </button>
          {showHistory && (
            <div className="mt-2 space-y-2">
              {history.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#FFB400]">{h.genre}</span>
                    <span className="text-xs text-[#444]">{new Date(h.ts).toLocaleTimeString()}</span>
                  </div>
                  <div className="space-y-1">
                    {h.results.filter(r => !r.error).map((r, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <span className="text-xs text-[#888]">{r.title}</span>
                        <span className="text-xs text-[#555]">{r.bpm} BPM · {r.key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="h-12" />
    </main>
  );
}
