"use client";

import { useState, useRef } from "react";
import type { Project } from "./types";

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onContinue?: () => void;
  onBack: () => void;
}

const VOICES = [
  { value: "en-IN-Wavenet-D", label: "Rohan — en-IN Male" },
  { value: "en-IN-Wavenet-A", label: "Priya — en-IN Female" },
  { value: "en-IN-Wavenet-B", label: "Arjun — en-IN Male" },
  { value: "en-IN-Wavenet-C", label: "Ananya — en-IN Female" },
  { value: "en-US-Wavenet-D", label: "Alex — en-US Male" },
  { value: "en-US-Wavenet-F", label: "Sarah — en-US Female" },
];

export default function AudioPanel({ project, onUpdate, onContinue, onBack }: Props) {
  const [voice, setVoice] = useState("en-IN-Wavenet-D");
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateAudio = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/content/generate-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ssml: project.ssml,
        voice,
        speaking_rate: speakingRate,
        project_id: project.id,
      }),
    });

    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Failed to generate audio.");
      setLoading(false);
      return;
    }

    const data = await res.json() as { audio_url: string };
    onUpdate({ audioUrl: data.audio_url });
    setLoading(false);
    setTimeout(() => audioRef.current?.play().catch(() => null), 100);
  };

  const downloadAudio = () => {
    if (!project.audioUrl) return;
    const a = document.createElement("a");
    a.href = project.audioUrl;
    a.download = "westside-content.mp3";
    a.click();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Generate Audio</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Convert SSML to speech using Google Cloud Text-to-Speech.
        </p>
      </div>

      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 max-h-32 overflow-y-auto">
        <p className="text-xs font-medium text-slate-500 mb-1">SSML preview</p>
        <p className="text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
          {project.ssml.slice(0, 400)}{project.ssml.length > 400 ? "…" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Voice</label>
          <select
            value={voice}
            onChange={e => setVoice(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {VOICES.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Speed: {speakingRate.toFixed(1)}×
          </label>
          <input
            type="range"
            min="0.5" max="1.5" step="0.1"
            value={speakingRate}
            onChange={e => setSpeakingRate(parseFloat(e.target.value))}
            className="w-full mt-2 accent-slate-900"
          />
        </div>
      </div>

      <button
        onClick={generateAudio}
        disabled={loading}
        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? "Generating audio…" : project.audioUrl ? "Regenerate Audio" : "Generate Audio"}
      </button>

      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

      {project.audioUrl && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audio Preview</p>
          <audio ref={audioRef} src={project.audioUrl} controls className="w-full" />
          <button
            onClick={downloadAudio}
            className="text-sm text-slate-600 underline hover:text-slate-900"
          >
            Download MP3
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to SSML
        </button>
        {onContinue && (
          <button
            onClick={onContinue}
            disabled={!project.audioUrl}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Video Review →
          </button>
        )}
      </div>
    </div>
  );
}
