"use client";

import { useRef, useState } from "react";
import {
  REGIONS,
  GENRES,
  THEME_POOL,
  LANGUAGE_OPTIONS,
  getGenresByRegion,
  getFusionScore,
  type Genre,
  type RegionKey,
} from "@/lib/genres";

// ── Copy helper ──────────────────────────────────────────────────────────────
async function copyFromTextarea(ref: React.RefObject<HTMLTextAreaElement | null>): Promise<"copied" | "select"> {
  const el = ref.current;
  if (!el) return "select";
  const text = el.value;
  if (navigator.share) {
    try { await navigator.share({ text }); return "copied"; } catch { /* cancelled */ }
  }
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return "copied"; } catch { /* fallthrough */ }
  }
  el.focus(); el.select(); el.setSelectionRange(0, text.length);
  return "select";
}

// ── Sub-components ───────────────────────────────────────────────────────────
function OutputBox({ label, value, charLimit, rows }: { label: string; value: string; charLimit: number; rows: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "select">("idle");
  const handleCopy = async () => {
    const r = await copyFromTextarea(ref);
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

function GenreCard({ genre, selected, onSelect }: { genre: Genre; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`text-left p-3 rounded-xl border transition-all ${selected ? "border-[#FFB400] bg-[#FFB400]/10" : "border-[#2A2A2A] bg-[#141414] hover:border-[#FFB400]/40"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{genre.emoji}</span>
        <span className={`text-sm font-semibold ${selected ? "text-[#FFB400]" : "text-[#E8E8E8]"}`}>{genre.name}</span>
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

// ── Main page ────────────────────────────────────────────────────────────────
interface TrackResult {
  title: string; bpm: number; key: string; mood: string;
  kie_style: string; kie_lyrics: string; concept: string;
}

export default function Home() {
  const [activeRegion, setActiveRegion] = useState<RegionKey>("west");
  const [primaryGenre, setPrimaryGenre] = useState<Genre | null>(null);

  const [fusionMode, setFusionMode] = useState(false);
  const [accentRegion, setAccentRegion] = useState<RegionKey>("south");
  const [accentGenre, setAccentGenre] = useState<Genre | null>(null);

  const [theme, setTheme] = useState(THEME_POOL[0]);
  const [language, setLanguage] = useState("");
  const [shortsVersion, setShortsVersion] = useState(false);
  const [sadBanger, setSadBanger] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fusionInfo = fusionMode && primaryGenre && accentGenre
    ? getFusionScore(primaryGenre.key, accentGenre.key)
    : null;

  const effectiveLanguage = language || (primaryGenre ? (LANGUAGE_OPTIONS[primaryGenre.region]?.[0] ?? "") : "");

  const generate = async () => {
    if (!primaryGenre) { setError("Pick a genre first."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryGenreKey: primaryGenre.key,
          accentGenreKey: fusionMode && accentGenre ? accentGenre.key : null,
          language: effectiveLanguage,
          theme: theme.value,
          shortsVersion,
          sadBanger,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-set language when genre changes
  const selectPrimary = (g: Genre) => {
    setPrimaryGenre(g);
    setLanguage(LANGUAGE_OPTIONS[g.region]?.[0] ?? "");
  };

  return (
    <main className="min-h-screen max-w-lg mx-auto px-4 py-8" suppressHydrationWarning>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-widest text-[#FFB400] uppercase mb-1">Mixtape Africa</p>
        <h1 className="text-2xl font-bold text-[#E8E8E8]">Prompt Generator</h1>
        <p className="text-sm text-[#666] mt-1">Pan-African track concepts for Kie.ai</p>
      </div>

      {/* ── PRIMARY GENRE ── */}
      <section className="mb-5">
        <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Genre</h2>

        {/* Region tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {REGIONS.map(r => (
            <button key={r.key} onClick={() => setActiveRegion(r.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeRegion === r.key ? "bg-[#FFB400] text-[#0D0D0D]" : "bg-[#141414] border border-[#2A2A2A] text-[#888]"}`}>
              {r.emoji} {r.label}
            </button>
          ))}
        </div>

        {/* Genre grid */}
        <div className="grid grid-cols-2 gap-2">
          {getGenresByRegion(activeRegion).map(g => (
            <GenreCard key={g.key} genre={g} selected={primaryGenre?.key === g.key} onSelect={() => selectPrimary(g)} />
          ))}
        </div>
      </section>

      {/* ── FUSION MODE ── */}
      <section className="mb-5">
        <button onClick={() => { setFusionMode(v => !v); setAccentGenre(null); }}
          className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-all ${fusionMode ? "border-[#FFB400] text-[#FFB400] bg-[#FFB400]/10" : "border-[#2A2A2A] text-[#666] hover:border-[#FFB400]/40"}`}>
          {fusionMode ? "✕ Remove Mix" : "+ Mix Genres (Fusion)"}
        </button>

        {fusionMode && (
          <div className="mt-3">
            <p className="text-xs text-[#666] mb-2">Accent genre — one element will blend in</p>

            {/* Accent region tabs */}
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
                  <GenreCard key={g.key} genre={g} selected={accentGenre?.key === g.key} onSelect={() => setAccentGenre(g)} />
                ))}
            </div>

            {fusionInfo && <FusionBadge score={fusionInfo.score} note={fusionInfo.note} />}
          </div>
        )}
      </section>

      {/* ── LANGUAGE ── */}
      {primaryGenre && (
        <section className="mb-5">
          <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Language</h2>
          <div className="flex flex-wrap gap-2">
            {(LANGUAGE_OPTIONS[primaryGenre.region] ?? []).map(lang => (
              <button key={lang} onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${effectiveLanguage === lang ? "border-[#FFB400] text-[#FFB400] bg-[#FFB400]/10" : "border-[#2A2A2A] text-[#888]"}`}>
                {lang}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── THEME ── */}
      <section className="mb-5">
        <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Lyric Theme</h2>
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
        <p className="text-center text-sm text-[#555] mb-4">Pick a genre above to generate</p>
      )}
      <button onClick={generate} disabled={loading || !primaryGenre}
        className="w-full py-4 rounded-xl font-semibold text-base transition-all bg-[#FFB400] text-[#0D0D0D] hover:bg-[#FF6B00] disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </span>
        ) : primaryGenre ? `Generate ${primaryGenre.name}${fusionMode && accentGenre ? ` × ${accentGenre.name}` : ""} Track` : "Generate Track Concept"}
      </button>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">{error}</div>
      )}

      {/* ── RESULTS ── */}
      {result && (
        <div className="mt-8 space-y-5">
          <div className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A]">
            <h3 className="text-lg font-bold text-[#FFB400]">{result.title}</h3>
            <p className="text-sm text-[#888] mt-1">{result.mood}</p>
            <div className="flex gap-3 mt-3 flex-wrap">
              <span className="text-xs bg-[#1E1E1E] border border-[#2A2A2A] rounded px-2 py-1 text-[#999]">{result.bpm} BPM</span>
              <span className="text-xs bg-[#1E1E1E] border border-[#2A2A2A] rounded px-2 py-1 text-[#999]">{result.key}</span>
              {primaryGenre && <span className="text-xs bg-[#1E1E1E] border border-[#FFB400]/30 rounded px-2 py-1 text-[#FFB400]/80">{primaryGenre.name}{accentGenre && fusionMode ? ` × ${accentGenre.name}` : ""}</span>}
            </div>
            {result.concept && <p className="text-xs text-[#666] mt-3 leading-relaxed">{result.concept}</p>}
          </div>

          <OutputBox label="Style Tags (kie_style)" value={result.kie_style} charLimit={200} rows={3} />
          <OutputBox label="Lyrics (kie_lyrics)" value={result.kie_lyrics} charLimit={4500} rows={16} />

          <button onClick={generate} disabled={loading}
            className="w-full py-3 rounded-xl border border-[#2A2A2A] text-sm text-[#666] hover:border-[#FFB400]/50 hover:text-[#FFB400] transition-colors disabled:opacity-50">
            Regenerate
          </button>
        </div>
      )}

      <div className="h-12" />
    </main>
  );
}
