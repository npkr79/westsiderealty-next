"use client";

import { useState } from "react";
import type { Project } from "./types";

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function SSMLPanel({ project, onUpdate, onContinue, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSsml = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/content/ssml", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script: project.script,
        project_id: project.id,
      }),
    });

    if (!res.ok) {
      setError("Failed to generate SSML. Please try again.");
      setLoading(false);
      return;
    }

    const data = await res.json() as { ssml: string };
    onUpdate({ ssml: data.ssml });
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Generate SSML</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Convert script to Speech Synthesis Markup Language for Google Cloud TTS.
        </p>
      </div>

      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 max-h-40 overflow-y-auto">
        <p className="text-xs font-medium text-slate-500 mb-1">Script</p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{project.script}</p>
      </div>

      <button
        onClick={generateSsml}
        disabled={loading}
        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? "Converting…" : project.ssml ? "Regenerate SSML" : "Generate SSML"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(project.ssml || loading) && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            SSML — edit as needed
          </label>
          <textarea
            value={project.ssml}
            onChange={e => onUpdate({ ssml: e.target.value })}
            rows={18}
            placeholder={loading ? "Converting script to SSML…" : ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y"
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={!project.ssml.trim()}
          className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate Audio →
        </button>
      </div>
    </div>
  );
}
