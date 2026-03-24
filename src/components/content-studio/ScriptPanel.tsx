"use client";

import { useState } from "react";
import type { Project } from "./types";

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function ScriptPanel({ project, onUpdate, onContinue, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateScript = async () => {
    if (!project.selectedIdea) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/content/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idea: project.selectedIdea,
        topic: project.topic,
        content_type: project.contentType,
        project_id: project.id,
      }),
    });

    if (!res.ok) {
      setError("Failed to generate script. Please try again.");
      setLoading(false);
      return;
    }

    const data = await res.json() as { script: string };
    onUpdate({ script: data.script });
    setLoading(false);
  };

  const wordCount = project.script.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Write Script</h2>
        <p className="text-sm text-slate-500 mt-0.5">Generate or edit your content script.</p>
      </div>

      {project.selectedIdea && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-1">
          <p className="text-xs font-medium text-slate-500">Selected idea</p>
          <p className="text-sm font-semibold text-slate-900">{project.selectedIdea.title}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{project.selectedIdea.hook}</p>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={generateScript}
          disabled={loading || !project.selectedIdea}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Writing…" : project.script ? "Regenerate Script" : "Generate Script"}
        </button>
        {project.script && !loading && (
          <span className={`text-xs font-medium ${wordCount > 160 ? "text-amber-600" : "text-green-600"}`}>
            {wordCount} words{wordCount > 160 ? " — over limit" : ""}
          </span>
        )}
        <span className="text-xs text-slate-400">Target: 120–160 words for a 60-second reel</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(project.script || loading) && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Script — edit as needed
          </label>
          <textarea
            value={project.script}
            onChange={e => onUpdate({ script: e.target.value })}
            rows={16}
            placeholder={loading ? "Writing your script…" : ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y"
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={!project.script.trim()}
          className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate SSML →
        </button>
      </div>
    </div>
  );
}
