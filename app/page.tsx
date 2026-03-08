"use client";

import { useRef, useState } from "react";
import { THEME_POOL } from "@/lib/tags";

interface TrackResult {
  title: string;
  bpm: number;
  key: string;
  mood: string;
  kie_style: string;
  kie_lyrics: string;
  concept: string;
}

// Copy strategy (in order of reliability on iOS):
// 1. navigator.share() — native share sheet, works on iOS without HTTPS
// 2. navigator.clipboard.writeText() — requires HTTPS
// 3. select text in visible textarea — user taps native Copy callout
async function copyFromTextarea(
  ref: React.RefObject<HTMLTextAreaElement | null>
): Promise<"copied" | "select"> {
  const el = ref.current;
  if (!el) return "select";

  const text = el.value;

  // 1. Native share sheet (iOS Safari, no HTTPS needed)
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return "copied";
    } catch {
      // user cancelled or share failed — fall through
    }
  }

  // 2. Async clipboard API (HTTPS only)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      // fall through
    }
  }

  // 3. Select the visible textarea — iOS shows native Copy callout
  el.focus();
  el.select();
  el.setSelectionRange(0, text.length);
  return "select";
}

function OutputBox({
  label,
  value,
  charLimit,
  rows,
}: {
  label: string;
  value: string;
  charLimit: number;
  rows: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "select">("idle");

  const handleCopy = async () => {
    const result = await copyFromTextarea(ref);
    setState(result);
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <div className="rounded-xl bg-[#141414] border border-[#2A2A2A] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
        <span className="text-xs tracking-widest text-[#666] uppercase">{label}</span>
        <button
          onClick={handleCopy}
          className={`text-xs px-3 py-1 rounded border transition-colors ${
            state === "copied"
              ? "border-[#FFB400] text-[#FFB400]"
              : state === "select"
              ? "border-blue-500 text-blue-400"
              : "border-[#2A2A2A] text-[#888] hover:border-[#FFB400] hover:text-[#FFB400]"
          }`}
        >
          {state === "copied" ? "Copied!" : state === "select" ? "Now tap Copy" : "Copy"}
        </button>
      </div>
      <div className="px-4 py-3">
        <textarea
          ref={ref}
          readOnly
          value={value}
          rows={rows}
          className="w-full bg-transparent text-sm text-[#E8E8E8] leading-relaxed font-mono resize-none outline-none selection:bg-[#FFB400]/30"
        />
        <p className="text-xs text-[#444] mt-1">
          {value.length} / {charLimit} chars
        </p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        checked ? "border-[#FFB400] bg-[#FFB400]/10" : "border-[#2A2A2A] bg-[#141414]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${checked ? "text-[#FFB400]" : "text-[#E8E8E8]"}`}>
          {label}
        </span>
        <div
          className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${
            checked ? "bg-[#FFB400]" : "bg-[#2A2A2A]"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full bg-white transition-transform ${
              checked ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </div>
      </div>
      <p className="text-xs text-[#666] mt-0.5">{description}</p>
    </button>
  );
}

export default function Home() {
  const [selectedTheme, setSelectedTheme] = useState(THEME_POOL[0]);
  const [shortsVersion, setShortsVersion] = useState(false);
  const [sadBanger, setSadBanger] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selectedTheme.value, shortsVersion, sadBanger }),
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

  return (
    <main className="min-h-screen max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-widest text-[#FFB400] uppercase mb-1">Mixtape Africa</p>
        <h1 className="text-2xl font-bold text-[#E8E8E8]">Prompt Generator</h1>
        <p className="text-sm text-[#666] mt-1">Deep Afro House concepts for Kie.ai</p>
      </div>

      {/* Theme Selector */}
      <section className="mb-6">
        <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Theme</h2>
        <div className="grid grid-cols-2 gap-2">
          {THEME_POOL.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setSelectedTheme(theme)}
              className={`py-2.5 px-3 rounded-lg text-sm font-medium text-left transition-all ${
                selectedTheme.value === theme.value
                  ? "bg-[#FFB400] text-[#0D0D0D]"
                  : "bg-[#141414] border border-[#2A2A2A] text-[#999] hover:border-[#FFB400]/50"
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </section>

      {/* Toggles */}
      <section className="mb-6 space-y-2">
        <h2 className="text-xs tracking-widest text-[#666] uppercase mb-3">Style Mode</h2>
        <Toggle
          label="Shorts Version"
          description="Hook-first 60s structure, no intro buildup"
          checked={shortsVersion}
          onChange={setShortsVersion}
        />
        <Toggle
          label="Sad Banger"
          description="Upbeat groove, bittersweet lyrics — happy feet, heavy heart"
          checked={sadBanger}
          onChange={setSadBanger}
        />
      </section>

      {/* Generate Button */}
      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-4 rounded-xl font-semibold text-base transition-all bg-[#FFB400] text-[#0D0D0D] hover:bg-[#FF6B00] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </span>
        ) : (
          "Generate Track Concept"
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-5">
          {/* Track Info */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A]">
            <h3 className="text-lg font-bold text-[#FFB400]">{result.title}</h3>
            <p className="text-sm text-[#888] mt-1">{result.mood}</p>
            <div className="flex gap-4 mt-3">
              <span className="text-xs bg-[#1E1E1E] border border-[#2A2A2A] rounded px-2 py-1 text-[#999]">
                {result.bpm} BPM
              </span>
              <span className="text-xs bg-[#1E1E1E] border border-[#2A2A2A] rounded px-2 py-1 text-[#999]">
                {result.key}
              </span>
            </div>
            {result.concept && (
              <p className="text-xs text-[#666] mt-3 leading-relaxed">{result.concept}</p>
            )}
          </div>

          <OutputBox label="Style Tags (kie_style)" value={result.kie_style} charLimit={200} rows={3} />
          <OutputBox label="Lyrics (kie_lyrics)" value={result.kie_lyrics} charLimit={4500} rows={16} />

          {/* Regenerate */}
          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-[#2A2A2A] text-sm text-[#666] hover:border-[#FFB400]/50 hover:text-[#FFB400] transition-colors disabled:opacity-50"
          >
            Regenerate
          </button>
        </div>
      )}
    </main>
  );
}
