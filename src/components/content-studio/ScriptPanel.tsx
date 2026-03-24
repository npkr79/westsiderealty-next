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
  const [feedback, setFeedback] = useState("");
  const [autoFixed, setAutoFixed] = useState(false);
  const [issuesFound, setIssuesFound] = useState<string[]>([]);
  const [originalScript, setOriginalScript] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);

  const generateScript = async () => {
    if (!project.selectedIdea) return;
    setLoading(true);
    setError(null);
    setAutoFixed(false);
    setIssuesFound([]);
    setOriginalScript("");
    setShowOriginal(false);

    const res = await fetch("/api/content/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selected_idea: project.selectedIdea,
        topic: project.topic,
        content_type: project.contentType,
        project_id: project.id,
        feedback: feedback || undefined,
      }),
    });

    if (!res.ok) {
      setError("Failed to generate script. Please try again.");
      setLoading(false);
      return;
    }

    const data = await res.json() as {
      script: string;
      auto_fixed?: boolean;
      issues_found?: string[];
      original_script?: string | null;
    };

    onUpdate({ script: data.script });
    setAutoFixed(data.auto_fixed ?? false);
    setIssuesFound(data.issues_found ?? []);
    setOriginalScript(data.original_script ?? "");
    setFeedback(""); // clear feedback after successful generation
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
          {loading
            ? "Writing…"
            : project.script
            ? (feedback ? "Regenerate with Feedback" : "Regenerate Script")
            : "Generate Script"}
        </button>
        {project.script && !loading && (
          <span className={`text-xs font-medium ${wordCount > 160 ? "text-red-600" : wordCount < 120 ? "text-amber-600" : "text-green-600"}`}>
            {wordCount} words{wordCount > 160 ? " — over limit" : wordCount < 120 ? " — under limit" : " ✓"}
          </span>
        )}
        <span className="text-xs text-slate-400">Target: 120–160 words for a 60-second reel</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(project.script || loading) && (
        <div className="space-y-3">
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

          {/* Validation badge */}
          {project.script && !loading && (
            <div>
              {autoFixed ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                      ⚠ Auto-corrected — {issuesFound.length} compliance issue{issuesFound.length !== 1 ? "s" : ""} fixed
                    </span>
                    {originalScript && (
                      <button
                        onClick={() => setShowOriginal(v => !v)}
                        className="text-xs text-slate-400 underline"
                      >
                        {showOriginal ? "Hide original" : "View original"}
                      </button>
                    )}
                  </div>
                  {showOriginal && originalScript && (
                    <textarea
                      readOnly
                      value={originalScript}
                      rows={10}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 leading-relaxed resize-none"
                    />
                  )}
                </div>
              ) : (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full inline-block">
                  ✓ Compliance check passed
                </span>
              )}
            </div>
          )}

          {/* Feedback for regeneration */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500">
              Feedback for regeneration (optional)
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={2}
              placeholder="e.g. Make it more data-driven, add Siolim pricing, shorter sentences, stronger hook…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-slate-400"
            />
          </div>
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
